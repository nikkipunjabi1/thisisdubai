// seo-fill.mjs — populate EN (master) SEO fields (metaTitle + metaDescription) on
// every routable content item, via the Content Management API (CMA).
//
//   npm run seo:fill                 # DRY RUN — print the full review table, write nothing
//   npm run seo:fill -- --apply      # write + publish the EN version of each item
//   npm run seo:fill -- --apply --overwrite   # also replace SEO values already set
//   npm run seo:fill -- --type=poi   # limit to one collection (repeatable):
//                                    #   experience | poi | area | event | article
//
// Strategy (confirmed with the user):
//   • metaTitle       = the page's name/title, trimmed to <=70 chars. The app appends
//                       " | <tagline> | <siteName>" via the title template (src/lib/seo.ts),
//                       so this field holds the SEGMENT only, never the site name.
//   • metaDescription = the page's existing summary/excerpt, cleaned + trimmed to <=180.
//   • Section + Home experiences have no summary → hand-crafted copy (SEO_EXPERIENCES).
//   • FILL-EMPTY by default: never overwrite a value already authored (unless --overwrite).
//
// Safety: dry-by-default (writes only with --apply). Each write is a READ-MERGE-WRITE of a
// new EN version (existing properties carried forward, so DAM images / other fields are never
// blanked — same pattern as seed.mjs), then that exact version is published.
//
// Both metaTitle/metaDescription are `isLocalized`, so this writes the EN version only; the
// Arabic values are filled later by translating in the CMS (that is the next, manual step).

import { areaKey, poiKey, eventKey, articleBlockKey } from './data/_helpers.mjs';
import { areas } from './data/areas.mjs';
import { pois } from './data/pois/index.mjs';
import { events } from './data/events.mjs';
import { articles } from './data/articles/index.mjs';
import { createHash } from 'node:crypto';

const GATEWAY = (process.env.OPTIMIZELY_CMS_API_URL || 'https://api.cms.optimizely.com').replace(/\/$/, '');
const CLIENT_ID = process.env.OPTIMIZELY_CMS_CLIENT_ID;
const CLIENT_SECRET = process.env.OPTIMIZELY_CMS_CLIENT_SECRET;
const LOCALE = process.env.SEED_LOCALE || 'en';
const HOME = process.env.SEED_HOME || '71792f1b444e4d6d9a77c41c47c4cf7e';

const keyFor = (s) => createHash('md5').update(s).digest('hex');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const OVERWRITE = args.includes('--overwrite');
// Repair mode: don't write anything, just publish the newest EN version of each
// item (used to publish drafts left unpublished by an earlier run).
const PUBLISH_ONLY = args.includes('--publish-only');
const ONLY = args.filter((a) => a.startsWith('--type=')).map((a) => a.slice(7));
const wanted = (kind) => ONLY.length === 0 || ONLY.includes(kind);

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('✖ Missing OPTIMIZELY_CMS_CLIENT_ID / OPTIMIZELY_CMS_CLIENT_SECRET in the environment.');
  process.exit(1);
}

// ── SEO limits (mirror the SeoMetadata contract) ────────────────────────────────
const TITLE_MAX = 70;
const DESC_MAX = 180;

// ── Hand-crafted SEO for the experiences (no summary field to derive from) ───────
// metaTitle is the segment only; the tagline + site name are appended by the app.
const SEO_EXPERIENCES = {
  home: {
    metaTitle: 'Things to Do in Dubai',
    metaDescription:
      'Discover the best of Dubai: top attractions, distinctive neighbourhoods, events and local guides to help you plan an unforgettable trip.',
  },
  places: {
    metaTitle: 'Places to Visit in Dubai',
    metaDescription:
      "Explore Dubai's must-see attractions and hidden gems, from iconic landmarks to family-friendly days out, with practical visitor tips.",
  },
  neighbourhoods: {
    metaTitle: 'Dubai Neighbourhoods',
    metaDescription:
      "A guide to Dubai's neighbourhoods: where to stay, what to see and the character of each district, from the historic creek to the marina.",
  },
  events: {
    metaTitle: 'Events in Dubai',
    metaDescription:
      "What's on in Dubai: festivals, exhibitions, sport and cultural happenings, with the details you need to plan your visit.",
  },
  articles: {
    metaTitle: 'Dubai Guides & Stories',
    metaDescription:
      'Dubai guides and stories: neighbourhoods, food, culture, budgets and practical advice for planning a trip.',
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

/** Trim to <=max characters on a word boundary, dropping any dangling punctuation. */
function trimToWord(s, max) {
  const str = clean(s);
  if (str.length <= max) return str;
  let cut = str.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > max * 0.6) cut = cut.slice(0, lastSpace);
  return cut.replace(/[\s.,;:!\-–—]+$/, '');
}

async function getToken() {
  const res = await fetch(`${GATEWAY}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
  });
  if (!res.ok) throw new Error(`Token request failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

async function api(token, method, path, body, extraHeaders = {}, attempt = 1) {
  const res = await fetch(`${GATEWAY}/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...extraHeaders },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 429 && attempt <= 6) {
    await sleep(1500 * attempt);
    return api(token, method, path, body, extraHeaders, attempt + 1);
  }
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, json };
}

const isEn = (v) => v.locale === LOCALE || v.locale?.name === LOCALE;

/**
 * The latest EN version object for a key. Localized items interleave `ar` + `en`
 * versions and the list is NOT ordered by version number, so pick the EN version
 * with the highest version id (the true newest EN), not `items[0]`.
 */
async function latestEnVersion(token, key) {
  const r = await api(token, 'GET', `/content/${key}/versions`);
  if (r.status !== 200) return { error: r.status };
  const en = (r.json?.items ?? []).filter(isEn).sort((a, b) => Number(b.version) - Number(a.version));
  return en[0] ? { version: en[0] } : null;
}

/**
 * Publish the newest EN version of a key. This is the only reliable publish target:
 * the CMA create response does not carry a usable version id, and `items[0]` can be
 * an `ar` version once Arabic exists. Returns { ok, msg, already? }.
 */
async function publishNewestEn(token, key) {
  const r = await api(token, 'GET', `/content/${key}/versions`);
  if (r.status !== 200) return { ok: false, msg: `versions ${r.status}` };
  const en = (r.json?.items ?? []).filter(isEn).sort((a, b) => Number(b.version) - Number(a.version));
  const newest = en[0];
  if (!newest) return { ok: false, msg: 'no en version' };
  if (newest.status === 'published') return { ok: true, already: true, msg: `already published (v${newest.version})` };
  const pub = await api(token, 'POST', `/content/${key}/versions/${newest.version}:publish`, {});
  const ok = pub.status === 200 || pub.status === 204;
  return { ok, msg: ok ? `published v${newest.version}` : `publish ${pub.status}: ${JSON.stringify(pub.json).slice(0, 160)}` };
}

// ── Build the target list from the seed data + known experience keys ────────────
function targets() {
  const list = [];
  if (wanted('experience')) {
    list.push({ kind: 'experience', key: HOME, type: 'HomePage', label: 'Home / Site Root', seo: SEO_EXPERIENCES.home });
    list.push({ kind: 'experience', key: keyFor('places-to-visit-exp'), type: 'PlacesToVisit', label: 'Places to Visit', seo: SEO_EXPERIENCES.places });
    list.push({ kind: 'experience', key: keyFor('neighbourhoods-exp'), type: 'Neighbourhoods', label: 'Neighbourhoods', seo: SEO_EXPERIENCES.neighbourhoods });
    list.push({ kind: 'experience', key: keyFor('events-exp'), type: 'Events', label: 'Events', seo: SEO_EXPERIENCES.events });
    list.push({ kind: 'experience', key: keyFor('articles-exp'), type: 'Articles', label: 'Articles', seo: SEO_EXPERIENCES.articles });
  }
  const derive = (name, source) => ({
    metaTitle: trimToWord(name, TITLE_MAX),
    metaDescription: source ? trimToWord(source, DESC_MAX) : '',
  });
  if (wanted('area'))
    for (const a of areas)
      list.push({ kind: 'area', key: areaKey(a.slug), type: 'Area', label: a.displayName, seo: derive(a.props.name?.value ?? a.displayName, a.props.summary?.value) });
  if (wanted('poi'))
    for (const p of pois)
      list.push({ kind: 'poi', key: poiKey(p.slug), type: 'PointOfInterest', label: p.displayName, seo: derive(p.props.name?.value ?? p.displayName, p.props.summary?.value) });
  if (wanted('event'))
    for (const e of events)
      list.push({ kind: 'event', key: eventKey(e.slug), type: 'Event', label: e.displayName, seo: derive(e.props.name?.value ?? e.displayName, e.props.summary?.value) });
  if (wanted('article'))
    for (const ar of articles)
      list.push({ kind: 'article', key: articleBlockKey(ar.slug), type: 'ArticlePost', label: ar.displayName, seo: derive(ar.props.title?.value ?? ar.displayName, ar.props.excerpt?.value) });
  return list;
}

let counts = { filled: 0, skipped: 0, missing: 0, failed: 0, noSource: 0 };

async function processItem(token, item) {
  const { key, type, label, seo } = item;

  // Repair mode: publish the newest EN version (the SEO draft from an earlier run),
  // writing nothing new.
  if (PUBLISH_ONLY) {
    const r = await publishNewestEn(token, key);
    if (r.already) {
      counts.skipped += 1;
      console.log(`  = ${type.padEnd(16)} ${label} — ${r.msg}`);
    } else if (r.ok) {
      counts.filled += 1;
      console.log(`  ✔ ${type.padEnd(16)} ${label} — ${r.msg}`);
    } else {
      counts.failed += 1;
      console.log(`  ✖ ${type.padEnd(16)} ${label} — ${r.msg}`);
    }
    await sleep(120);
    return;
  }

  const found = token ? await latestEnVersion(token, key) : null;

  // In dry-run (no token) we can't read current values; assume empty so the table
  // shows what WOULD be written. With a token, honour fill-empty / --overwrite.
  const existingProps = found?.version?.properties ?? {};
  const hasTitle = !!clean(existingProps.metaTitle?.value);
  const hasDesc = !!clean(existingProps.metaDescription?.value);

  if (token && found?.error) {
    counts.missing += 1;
    console.log(`  ⚠ ${type.padEnd(16)} ${label} — not found (${found.error}), skipped`);
    return;
  }

  const setTitle = (OVERWRITE || !hasTitle) && !!seo.metaTitle;
  const setDesc = (OVERWRITE || !hasDesc) && !!seo.metaDescription;

  if (!seo.metaDescription && (OVERWRITE || !hasDesc)) counts.noSource += 1; // e.g. a page with no summary

  if (!setTitle && !setDesc) {
    counts.skipped += 1;
    console.log(`  = ${type.padEnd(16)} ${label} — already set, skipped`);
    return;
  }

  const seoProps = {};
  if (setTitle) seoProps.metaTitle = { value: seo.metaTitle };
  if (setDesc) seoProps.metaDescription = { value: seo.metaDescription };

  const parts = [];
  if (setTitle) parts.push(`title="${seo.metaTitle}"`);
  if (setDesc) parts.push(`desc(${seo.metaDescription.length})="${seo.metaDescription.slice(0, 96)}${seo.metaDescription.length > 96 ? '…' : ''}"`);

  if (!APPLY) {
    console.log(`  + ${type.padEnd(16)} ${label}\n      ${parts.join('\n      ')}`);
    counts.filled += 1;
    return;
  }

  // READ-MERGE-WRITE: carry the existing property bag + displayName/routeSegment forward,
  // add only the SEO fields, POST a new EN version, then publish THAT version.
  const v = found.version;
  const body = {
    locale: LOCALE,
    displayName: v.displayName ?? label,
    ...(v.routeSegment ? { routeSegment: v.routeSegment } : {}),
    properties: { ...existingProps, ...seoProps },
  };
  const nv = await api(token, 'POST', `/content/${key}/versions`, body);
  if (nv.status !== 201 && nv.status !== 200) {
    counts.failed += 1;
    console.log(`  ✖ ${type.padEnd(16)} ${label} — new version ${nv.status}: ${JSON.stringify(nv.json).slice(0, 240)}`);
    return;
  }
  // Publish the newest EN version (the draft we just created) — selected by a fresh
  // GET, since the create response carries no usable version id.
  const pr = await publishNewestEn(token, key);
  if (!pr.ok) counts.failed += 1;
  else counts.filled += 1;
  console.log(`  ${pr.ok ? '✔' : '✖'} ${type.padEnd(16)} ${label} — ${parts.join('; ')} — ${pr.msg}`);
  await sleep(120); // be gentle with the CMA
}

async function main() {
  const list = targets();
  const mode = PUBLISH_ONLY ? 'PUBLISH-ONLY (repair)' : APPLY ? `APPLY${OVERWRITE ? ' +overwrite' : ' (fill-empty)'}` : 'DRY RUN (fill-empty)';
  console.log(
    `SEO fill → ${GATEWAY} (locale ${LOCALE})  ${mode}\n` +
      `${list.length} items${ONLY.length ? ` (types: ${ONLY.join(', ')})` : ''}\n`,
  );
  const token = APPLY || PUBLISH_ONLY ? await getToken() : null;
  for (const item of list) await processItem(token, item);

  const verb = PUBLISH_ONLY ? 'Published' : APPLY ? 'Wrote' : 'Would write';
  const skipLabel = PUBLISH_ONLY ? 'already published' : 'already-set (skipped)';
  console.log(
    `\n${verb}: ${counts.filled}` +
      ` · ${skipLabel}: ${counts.skipped}` +
      (counts.noSource ? ` · no summary source (desc left blank): ${counts.noSource}` : '') +
      (counts.missing ? ` · not found: ${counts.missing}` : '') +
      (counts.failed ? ` · FAILED: ${counts.failed}` : ''),
  );
  if (!APPLY && !PUBLISH_ONLY) console.log('\nReview the table above, then run:  npm run seo:fill -- --apply');
  if (counts.failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
