// source-images.mjs — source royalty-free photos and upload them to CMP (the DAM),
// one per content item, so scripts/attach-assets.mjs can then attach them [exact].
//
//   npm run source-images                     # DRY RUN: print the pick table, download/upload nothing
//   npm run source-images -- --apply          # download + upload to CMP + register + record credits
//   npm run source-images -- --type=poi       # scope to one type: poi | event | area | article
//   npm run source-images -- --force          # re-source even items that already have a per-item image
//   npm run source-images -- --limit=5        # cap items processed (a small first --apply batch)
//   npm run source-images -- --provider=pexels  # force a provider (default: unsplash, then pexels fallback)
//
// WHY this exists (see ASSETS.md)
// ---------------------------------------------------------------------------
// attach-assets.mjs can only ATTACH what already lives in CMP. With CMP holding only
// the ~46 hand-curated originals, attach falls back to GUESS:section — spraying one
// generic image across dozens of items. This script fills the SOURCING gap that was
// always the real blocker: it turns each item's name + tags into a search, picks a
// landscape shot from Unsplash (Pexels as fallback), and uploads it into the item's
// own CMP folder as <slug>-1.jpg — the folder leaf attach matches on.
//
// LEGAL HYGIENE (ASSETS.md): royalty-free only (Unsplash/Pexels licences permit this),
// landscape, and we bias queries away from people. Faces/brand-marks can't be detected
// programmatically — the DRY-RUN pick table (item → photo URL → photographer) is the
// human eyeball step before anything is uploaded. Credits are recorded for attribution.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { pois } from './data/pois/index.mjs';
import { events } from './data/events.mjs';
import { areas } from './data/areas.mjs';
import { articles } from './data/articles/index.mjs';
import { tags } from './data/tags.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const CREDITS_PATH = join(HERE, 'data', 'asset-credits.json');
const ASSETS_MD = join(REPO, 'ASSETS.md');

const CMP_BASE = (process.env.CMP_API_URL || 'https://api.cmp.optimizely.com').replace(/\/$/, '');
const CMP_TOKEN_URL = 'https://accounts.cmp.optimizely.com/o/oauth2/v1/token';
const ROOT_NAME = process.env.CMP_ROOT_FOLDER || 'This is Dubai';

const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
const FORCE = argv.includes('--force');
const ONLY = (argv.find((a) => a.startsWith('--type=')) || '').split('=')[1] || null;
const LIMIT = Number((argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1]) || Infinity;
const PROVIDER = (argv.find((a) => a.startsWith('--provider=')) || '').split('=')[1] || null;

const required = {
  CMP_CLIENT_ID: process.env.CMP_CLIENT_ID,
  CMP_CLIENT_SECRET: process.env.CMP_CLIENT_SECRET,
};
if (!PROVIDER || PROVIDER === 'unsplash') required.UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
if (PROVIDER === 'pexels') required.PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
  console.error(`✖ Missing in the environment: ${missing.join(', ')}`);
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tagName = new Map(tags.map((t) => [t.slug, t.displayName]));

// ── What to source, per type ─────────────────────────────────────────────────
// `section` is the CMP folder (under root) that holds this type's per-item folders.
// `query(item)` turns an item into a search string biased toward place/scene photos.
const STOP = new Set(['a', 'an', 'the', 'of', 'and', 'in', 'to', 'for', 'your', 'days', 'day', 'guide', 'first', 'timer', 's']);
const fromSlug = (slug) =>
  slug.split('-').filter((w) => !STOP.has(w.toLowerCase())).slice(0, 4).join(' ');

const TYPES = {
  poi: {
    label: 'Point of Interest', section: 'Places to Visit', items: pois,
    query: (it) => `${it.displayName} Dubai`,
    fallback: (it) => `${(it.tagSlugs || []).map((s) => tagName.get(s) || s).slice(0, 2).join(' ')} Dubai`.trim(),
  },
  event: {
    label: 'Event', section: 'Events', items: events,
    query: (it) => `${it.displayName} Dubai`,
    fallback: (it) => `${(it.tagSlugs || []).map((s) => tagName.get(s) || s).slice(0, 2).join(' ')} Dubai event`.trim(),
  },
  area: {
    label: 'Neighbourhood', section: 'Neighbourhoods', items: areas,
    query: (it) => `${it.displayName} Dubai`,
    fallback: () => 'Dubai neighbourhood skyline',
  },
  article: {
    label: 'Article', section: 'Articles', items: articles,
    query: (it) => `Dubai ${fromSlug(it.slug)}`,
    fallback: () => 'Dubai cityscape travel',
  },
};

// ── CMP ───────────────────────────────────────────────────────────────────────
let cmpTok;
async function cmpToken() {
  if (cmpTok && cmpTok.exp > Date.now()) return cmpTok.tok;
  const r = await fetch(CMP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials', client_id: process.env.CMP_CLIENT_ID, client_secret: process.env.CMP_CLIENT_SECRET }),
  });
  const j = await r.json().catch(() => null);
  if (!j?.access_token) throw new Error(`CMP token failed: ${r.status} ${JSON.stringify(j).slice(0, 160)}`);
  cmpTok = { tok: j.access_token, exp: Date.now() + (j.expires_in - 120) * 1000 };
  return cmpTok.tok;
}

// GET carries no Content-Type (CMP 400s on a bodyless GET that declares JSON).
async function cmpGet(path, attempt = 1) {
  const r = await fetch(`${CMP_BASE}${path}`, { headers: { Authorization: `Bearer ${await cmpToken()}` } });
  if (r.status === 429 && attempt <= 6) { await sleep(1200 * attempt); return cmpGet(path, attempt + 1); }
  const t = await r.text(); let j; try { j = t ? JSON.parse(t) : null; } catch { j = t; }
  return { status: r.status, json: j };
}
async function cmpPost(path, body, attempt = 1) {
  const r = await fetch(`${CMP_BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await cmpToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (r.status === 429 && attempt <= 6) { await sleep(1200 * attempt); return cmpPost(path, body, attempt + 1); }
  const t = await r.text(); let j; try { j = t ? JSON.parse(t) : null; } catch { j = t; }
  return { status: r.status, json: j };
}

async function cmpChildren(parentId) {
  const out = [];
  let url = parentId ? `/v3/folders?parent_folder_id=${parentId}` : '/v3/folders';
  while (url) {
    const { json } = await cmpGet(url);
    out.push(...(json?.data ?? []));
    const next = json?.pagination?.next;
    url = next ? next.replace(CMP_BASE, '') : null;
  }
  return out;
}

async function cmpAssets() {
  const out = [];
  let path = '/v3/assets';
  for (let g = 0; path && g < 200; g++) {
    const { status, json } = await cmpGet(path);
    if (status === 429) { await sleep(2000); continue; }
    if (status !== 200 || !json?.data) throw new Error(`CMP assets failed: ${status}`);
    out.push(...json.data);
    const next = json.pagination?.next;
    path = next ? next.replace(CMP_BASE, '') : null;
  }
  return out.filter((a) => a.type === 'image' && !a.is_archived);
}

const normalise = (s) =>
  (s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\b(the|a|an|of|and)\b/g, ' ').trim().replace(/\s+/g, ' ');
const folderLeaf = (loc) => (loc || '').split('/').filter(Boolean).pop() || '';

/** Resolve (creating on --apply) the CMP folder id for an item under its section. */
async function ensureItemFolder(sectionId, sectionKids, displayName) {
  const hit = sectionKids.find((f) => f.name.toLowerCase() === displayName.toLowerCase());
  if (hit) return hit.id;
  if (!APPLY) return null; // dry run: caller notes it would be created
  const { status, json } = await cmpPost('/v3/folders', { name: displayName, parent_folder_id: sectionId });
  if (status !== 201) throw new Error(`folder "${displayName}" create failed: ${status} ${JSON.stringify(json).slice(0, 140)}`);
  sectionKids.push(json);
  return json.id;
}

/** Upload a JPEG buffer into a CMP folder, return the created asset id. */
async function cmpUpload(buf, filename, folderId) {
  const u = await cmpGet(`/v3/upload-url?file_name=${encodeURIComponent(filename)}&content_type=image%2Fjpeg`);
  if (u.status !== 200 || !u.json?.url) throw new Error(`upload-url failed: ${u.status}`);
  const { url, upload_meta_fields } = u.json;

  const form = new FormData();
  for (const [k, v] of Object.entries(upload_meta_fields)) form.append(k, v); // policy fields first
  form.append('file', new Blob([buf], { type: 'image/jpeg' }), filename);     // file LAST (GCS/S3 rule)
  const put = await fetch(url, { method: 'POST', body: form });
  if (put.status >= 300) throw new Error(`GCS upload failed: ${put.status} ${(await put.text()).slice(0, 160)}`);

  const reg = await cmpPost('/v3/assets', { key: upload_meta_fields.key, title: filename, folder_id: folderId });
  if (reg.status !== 201 || !reg.json?.id) throw new Error(`asset register failed: ${reg.status} ${JSON.stringify(reg.json).slice(0, 160)}`);
  return reg.json.id;
}

// ── Providers ───────────────────────────────────────────────────────────────
// Each provider returns a LIST of candidates (so pick() can skip already-used photos).
let unsplashExhausted = false; // once the demo tier's 50 req/hr is hit, stop trying it
async function unsplashPick(query) {
  if (unsplashExhausted) return [];
  const r = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&content_filter=high&per_page=8`,
    { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`, 'Accept-Version': 'v1' } },
  );
  if (r.status === 403) { unsplashExhausted = true; console.log('    (Unsplash 50/hr limit reached — using Pexels for the rest)'); return []; }
  if (!r.ok) return [];
  const j = await r.json();
  return (j.results || []).map((p) => ({
    provider: 'unsplash',
    downloadUrl: `${p.urls.raw}&w=2400&q=80&fm=jpg&fit=max`,
    trackUrl: p.links?.download_location || null,
    photographer: p.user?.name || 'Unknown',
    photographerUrl: p.user?.links?.html || null,
    sourceUrl: p.links?.html || null,
    caption: (p.description || p.alt_description || '').slice(0, 80),
    id: p.id,
    width: p.width,
  }));
}

async function pexelsPick(query) {
  if (!process.env.PEXELS_API_KEY) return [];
  const r = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=8`,
    { headers: { Authorization: process.env.PEXELS_API_KEY } },
  );
  if (!r.ok) return [];
  const j = await r.json();
  return (j.photos || []).map((p) => ({
    provider: 'pexels',
    downloadUrl: p.src?.large2x || p.src?.large || p.src?.original,
    trackUrl: null,
    photographer: p.photographer || 'Unknown',
    photographerUrl: p.photographer_url || null,
    sourceUrl: p.url || null,
    caption: (p.alt || '').slice(0, 80),
    id: String(p.id),
    width: p.width,
  }));
}

// ASSETS.md rule: prefer no prominent identifiable faces. We can't see the photo,
// but the caption usually names people — bias away from those candidates.
const PEOPLE = /\b(person|people|man|woman|women|men|boy|girl|kid|kids|child|children|group|crowd|portrait|hijab|selfie|face|model|couple|tourist|tourists|runner|runners|guy|lady|wearing|posing|human)\b/i;
const looksLikePeople = (caption) => PEOPLE.test(caption || '');

/**
 * Pick a photo for an item: try the specific query then the category fallback,
 * preferred provider first. Prefer a candidate that is (a) not already used this run
 * and (b) not obviously a photo of people. Degrades gracefully: person-free-but-used
 * → unused-with-people → the very first hit, rather than ever leaving a field blank.
 */
async function pick(cfg, item, usedIds) {
  const order = PROVIDER === 'pexels' ? [pexelsPick] : PROVIDER === 'unsplash' ? [unsplashPick] : [unsplashPick, pexelsPick];
  let firstSeen = null;
  let unusedPeople = null; // best "unused but has people" fallback
  for (const q of [cfg.query(item), cfg.fallback(item)].filter(Boolean)) {
    for (const fn of order) {
      const list = await fn(q).catch((e) => { console.log(`    (${fn.name} error: ${e.message})`); return []; });
      for (const c of list) {
        const cand = { ...c, query: q };
        if (!firstSeen) firstSeen = cand;
        const used = usedIds.has(`${c.provider}:${c.id}`);
        if (!used && !looksLikePeople(c.caption)) return cand;      // ideal: fresh + no people
        if (!used && !unusedPeople) unusedPeople = cand;            // remember as a fallback
      }
    }
  }
  return unusedPeople || firstSeen; // no person-free option anywhere — take a fresh one, else the best
}

// ── Credits ──────────────────────────────────────────────────────────────────
function loadCredits() {
  if (!existsSync(CREDITS_PATH)) return {};
  try { return JSON.parse(readFileSync(CREDITS_PATH, 'utf8')); } catch { return {}; }
}
function saveCredits(credits) {
  writeFileSync(CREDITS_PATH, JSON.stringify(credits, null, 2) + '\n');
}
/** Rewrite the auto-managed attribution block in ASSETS.md from the credits map. */
function writeAttributionBlock(credits) {
  const START = '<!-- AUTO-CREDITS:START -->';
  const END = '<!-- AUTO-CREDITS:END -->';
  const rows = Object.entries(credits)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([slug, c]) => `| \`${slug}\` | ${c.type} | [${c.photographer}](${c.photographerUrl || c.sourceUrl || '#'}) | ${c.provider} | [source](${c.sourceUrl || '#'}) |`);
  const block = [
    START,
    '_Auto-generated by `scripts/source-images.mjs`. Do not edit by hand — re-run the script._',
    '',
    '| Item | Type | Photographer | Source | Link |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
    END,
  ].join('\n');

  let md = existsSync(ASSETS_MD) ? readFileSync(ASSETS_MD, 'utf8') : '# ASSETS\n';
  if (md.includes(START) && md.includes(END)) {
    md = md.replace(new RegExp(`${START}[\\s\\S]*?${END}`), block);
  } else {
    md = md.replace(/\s*$/, '') + `\n\n## Attribution — auto-sourced imagery\n\n${block}\n`;
  }
  writeFileSync(ASSETS_MD, md);
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log(APPLY ? '▶ APPLY — will download, upload to CMP, and record credits' : '▶ DRY RUN — nothing downloaded or uploaded (add --apply)');
  if (ONLY && !TYPES[ONLY]) { console.error(`✖ --type must be one of: ${Object.keys(TYPES).join(', ')}`); process.exit(1); }

  // Which items already have a genuine per-item image in CMP? (folder leaf == item name, and it holds ≥1 asset)
  const assets = await cmpAssets();
  const filledLeaves = new Set(assets.map((a) => normalise(folderLeaf(a.file_location))).filter(Boolean));
  console.log(`CMP: ${assets.length} existing image assets across ${filledLeaves.size} item folders\n`);

  const roots = await cmpChildren(null);
  const root = roots.find((f) => f.name === ROOT_NAME);
  if (!root) throw new Error(`CMP root folder "${ROOT_NAME}" not found — run: npm run cmp-folders -- --apply`);

  const credits = loadCredits();
  const summary = { sourced: 0, skipped: 0, missed: 0, failed: 0 };
  const usedIds = new Set(); // photos chosen this run — never assign the same shot twice
  let processed = 0;

  for (const [typeKey, cfg] of Object.entries(TYPES)) {
    if (ONLY && ONLY !== typeKey) continue;

    const rootKids = await cmpChildren(root.id);
    let section = rootKids.find((f) => f.name.toLowerCase() === cfg.section.toLowerCase());
    if (!section && APPLY) {
      const { status, json } = await cmpPost('/v3/folders', { name: cfg.section, parent_folder_id: root.id });
      if (status !== 201) throw new Error(`section "${cfg.section}" create failed: ${status}`);
      section = json;
    }
    const sectionKids = section ? await cmpChildren(section.id) : [];
    console.log(`── ${cfg.label} (${cfg.items.length})`);

    for (const item of cfg.items) {
      if (processed >= LIMIT) break;
      const leaf = normalise(item.displayName);

      if (!FORCE && filledLeaves.has(leaf)) { console.log(`  ○ ${item.displayName} — already has an image`); summary.skipped++; continue; }
      processed++;

      const chosen = await pick(cfg, item, usedIds);
      if (!chosen) { console.log(`  ✖ ${item.displayName} — no photo found`); summary.missed++; continue; }
      usedIds.add(`${chosen.provider}:${chosen.id}`);

      const filename = `${item.slug}-1.jpg`;
      const detail = `${chosen.provider}:${chosen.id} "${chosen.caption || '—'}" by ${chosen.photographer} [q: ${chosen.query}]`;

      if (!APPLY) { console.log(`  → ${item.displayName}  ⟵  ${detail}\n      ${chosen.sourceUrl || chosen.downloadUrl}`); summary.sourced++; continue; }

      try {
        const folderId = await ensureItemFolder(section.id, sectionKids, item.displayName);
        const imgRes = await fetch(chosen.downloadUrl);
        if (!imgRes.ok) throw new Error(`image download ${imgRes.status}`);
        const buf = Buffer.from(await imgRes.arrayBuffer());
        const assetId = await cmpUpload(buf, filename, folderId);
        if (chosen.trackUrl) await fetch(`${chosen.trackUrl}&client_id=${process.env.UNSPLASH_ACCESS_KEY}`).catch(() => {}); // Unsplash guideline
        credits[item.slug] = {
          type: cfg.label, assetId, provider: chosen.provider,
          photographer: chosen.photographer, photographerUrl: chosen.photographerUrl, sourceUrl: chosen.sourceUrl,
        };
        console.log(`  ✔ ${item.displayName} (${Math.round(buf.length / 1024)}KB)  ⟵  ${detail}`);
        summary.sourced++;
      } catch (e) {
        console.log(`  ✖ ${item.displayName} — ${e.message}`);
        summary.failed++;
      }
    }
    console.log('');
    if (processed >= LIMIT) { console.log(`(reached --limit=${LIMIT})`); break; }
  }

  if (APPLY) { saveCredits(credits); writeAttributionBlock(credits); console.log(`Credits written to ${CREDITS_PATH} and ASSETS.md`); }

  console.log(
    `\n${APPLY ? 'Done' : 'Dry run complete'} — ${summary.sourced} ${APPLY ? 'uploaded' : 'would source'}, ` +
      `${summary.skipped} already had one, ${summary.missed} no photo, ${summary.failed} failed`,
  );
  if (!APPLY && summary.sourced > 0) console.log('Re-run with --apply to download + upload these (then: npm run attach-assets -- --apply).');
  if (summary.failed > 0) process.exitCode = 1;
}

main().catch((err) => { console.error(`✖ ${err.message}`); process.exit(1); });
