// align-ar-slugs.mjs — make each Arabic page's URL segment match its English one,
// via the Content Management API (CMA).
//
//   npm run align:ar-slugs              # DRY RUN — list every ar page whose slug differs from en
//   npm run align:ar-slugs -- --apply   # rewrite the ar routeSegment to match en, then publish
//
// Why this exists: the app's i18n routing (and the hreflang alternates) assume the content
// path is identical across locales and only the /en/ or /ar/ prefix changes. But when an
// Arabic version is created, Optimizely auto-generates its URL segment from the display name.
// Wherever the English slug was hand-shortened (e.g. "dubai-mall", "jbr", "al-marmoom"), the
// Arabic page lands on a different path (e.g. "al-marmoom--the-desert") and 404s when reached
// by switching language. This normalises every Arabic slug to the English one.
//
// How it works:
//   1. DISCOVERY (Graph): enumerate every content key.
//   2. COMPARE (CMA): for each key, compare the PUBLISHED ar version's routeSegment to the
//      newest en version's routeSegment. Only the PUBLISHED ar slug matters, because that is
//      what the live site serves. Keys with NO published ar version (a translation still in
//      draft, e.g. a Visual Builder experience being worked on) are left untouched — we never
//      publish work in progress. Experiences are also skipped from the rewrite path (their
//      composition does not round-trip through the properties bag).
//   3. FIX (CMA): if a draft already carries the correct slug, just publish it; otherwise
//      read-merge-write a new ar version from the PUBLISHED version's properties with the EN
//      routeSegment, then publish it. Publishing targets a specific version id and polls for
//      the just-created version, so it is safe against CMA read-after-write lag.
//
// Safety: dry-by-default (writes only with --apply). Translations are never touched — only the
// slug changes. Idempotent: once aligned, a re-run reports "already aligned" and does nothing.

const CMA = (process.env.OPTIMIZELY_CMS_API_URL || 'https://api.cms.optimizely.com').replace(/\/$/, '');
const CLIENT_ID = process.env.OPTIMIZELY_CMS_CLIENT_ID;
const CLIENT_SECRET = process.env.OPTIMIZELY_CMS_CLIENT_SECRET;
const GRAPH_GATEWAY = (process.env.OPTIMIZELY_GRAPH_GATEWAY || '').replace(/\/$/, '');
const GRAPH_KEY = process.env.OPTIMIZELY_GRAPH_SINGLE_KEY;

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const EN = 'en', AR = 'ar';
const FOLDER_TYPES = new Set(['SysContentFolder', '_Folder']);

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('✖ Missing OPTIMIZELY_CMS_CLIENT_ID / OPTIMIZELY_CMS_CLIENT_SECRET.');
  process.exit(1);
}
if (!GRAPH_GATEWAY || !GRAPH_KEY) {
  console.error('✖ Missing OPTIMIZELY_GRAPH_GATEWAY / OPTIMIZELY_GRAPH_SINGLE_KEY.');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isLoc = (v, loc) => v.locale === loc || v.locale?.name === loc;
const newest = (versions, loc) =>
  versions.filter((v) => isLoc(v, loc)).sort((a, b) => Number(b.version) - Number(a.version))[0];

async function discoverKeys() {
  const url = `${new URL('/content/v2', GRAPH_GATEWAY).href}?auth=${GRAPH_KEY}`;
  const query = `query($skip:Int!){ _Content(limit:100, skip:$skip){ total items { _metadata { key displayName types } } } }`;
  const out = new Map();
  let skip = 0, total = Infinity;
  while (skip < total) {
    const json = await (await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables: { skip } }) })).json();
    if (json.errors) throw new Error(`Graph discovery failed: ${JSON.stringify(json.errors).slice(0, 200)}`);
    const { items, total: t } = json.data._Content;
    total = t;
    for (const it of items) {
      const m = it._metadata;
      if (!m?.key || out.has(m.key)) continue;
      const types = m.types ?? [];
      if (types.some((x) => FOLDER_TYPES.has(x))) continue;
      out.set(m.key, { key: m.key, label: m.displayName ?? m.key, isExperience: types.includes('_Experience') });
    }
    skip += 100;
    if (items.length === 0) break;
  }
  return [...out.values()];
}

async function getToken() {
  const res = await fetch(`${CMA}/oauth/token`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET }) });
  if (!res.ok) throw new Error(`Token request failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

async function api(token, method, path, body, attempt = 1) {
  const res = await fetch(`${CMA}/v1${path}`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (res.status === 429 && attempt <= 6) { await sleep(1500 * attempt); return api(token, method, path, body, attempt + 1); }
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, json };
}

async function publishVersion(token, key, version) {
  const pub = await api(token, 'POST', `/content/${key}/versions/${version}:publish`, {});
  return { ok: pub.status === 200 || pub.status === 204, status: pub.status, json: pub.json };
}

/** Poll for an ar version newer than `prevMax` (handles CMA read-after-write lag). */
async function waitForNewArVersion(token, key, prevMax) {
  for (let i = 0; i < 8; i++) {
    const r = await api(token, 'GET', `/content/${key}/versions`);
    const v = newest(r.json?.items ?? [], AR);
    if (v && Number(v.version) > prevMax) return v;
    await sleep(600);
  }
  return null;
}

async function main() {
  console.log(`Align ar slugs → ${CMA}   ${APPLY ? 'APPLY' : 'DRY RUN'}\nDiscovering content keys via Graph…`);
  const keys = await discoverKeys();
  console.log(`${keys.length} content items\n`);
  const token = await getToken();
  const counts = { fixed: 0, aligned: 0, notPublished: 0, noPair: 0, skippedExp: 0, failed: 0 };

  for (const k of keys) {
    const r = await api(token, 'GET', `/content/${k.key}/versions`);
    if (r.status !== 200) { counts.failed += 1; console.log(`  ✖ ${k.label} — versions ${r.status}`); continue; }
    const items = r.json?.items ?? [];
    const en = newest(items, EN);
    const arVersions = items.filter((v) => isLoc(v, AR)).sort((a, b) => Number(b.version) - Number(a.version));
    if (!en || arVersions.length === 0) { counts.noPair += 1; continue; }

    const target = en.routeSegment ?? '';
    const pub = arVersions.find((v) => v.status === 'published');
    // Never publish work in progress: a page with no published ar version is an unfinished
    // translation. Its slug will be correct when the author publishes it (we align it then).
    if (!pub) { counts.notPublished += 1; continue; }
    if ((pub.routeSegment ?? '') === target) { counts.aligned += 1; continue; }

    const top = arVersions[0];

    // Case A: a draft already carries the correct slug (e.g. an earlier run that raced on
    // publish). Just publish that draft.
    if ((top.routeSegment ?? '') === target && top.status !== 'published') {
      if (!APPLY) { counts.fixed += 1; console.log(`  + ${k.label}  (publish existing draft v${top.version} → '${target}')`); continue; }
      const pr = await publishVersion(token, k.key, top.version);
      if (pr.ok) { counts.fixed += 1; console.log(`  ✔ ${k.label} — published draft v${top.version} → '${target}'`); }
      else { counts.failed += 1; console.log(`  ✖ ${k.label} — publish ${pr.status}: ${JSON.stringify(pr.json).slice(0, 160)}`); }
      await sleep(120);
      continue;
    }

    // Case B: needs a new version. Experiences carry a composition that does not round-trip
    // through the properties bag, so we do not rewrite them here — fix those in the CMS.
    if (k.isExperience) {
      counts.skippedExp += 1;
      console.log(`  ⚠ ${k.label} — experience, live slug '${pub.routeSegment}' ≠ '${target}'. Set the URL segment in the CMS.`);
      continue;
    }

    if (!APPLY) { counts.fixed += 1; console.log(`  + ${k.label}\n      ar '${pub.routeSegment ?? ''}'  →  '${target}'`); continue; }

    // Read the PUBLISHED version's properties (the live content), write a new ar version with
    // the corrected slug, then publish that exact version (poll for it first).
    const full = await api(token, 'GET', `/content/${k.key}/versions/${pub.version}`);
    const src = full.status === 200 ? full.json : pub;
    const prevMax = Math.max(...arVersions.map((v) => Number(v.version)));
    const nv = await api(token, 'POST', `/content/${k.key}/versions`, {
      locale: AR,
      displayName: src.displayName ?? k.label,
      routeSegment: target,
      properties: src.properties ?? {},
    });
    if (nv.status !== 201 && nv.status !== 200) {
      counts.failed += 1;
      console.log(`  ✖ ${k.label} — new version ${nv.status}: ${JSON.stringify(nv.json).slice(0, 200)}`);
      continue;
    }
    const created = await waitForNewArVersion(token, k.key, prevMax);
    if (!created) { counts.failed += 1; console.log(`  ✖ ${k.label} — new version never appeared`); continue; }
    const pr = await publishVersion(token, k.key, created.version);
    if (pr.ok) { counts.fixed += 1; console.log(`  ✔ ${k.label} — ar slug → '${target}' (published v${created.version})`); }
    else { counts.failed += 1; console.log(`  ✖ ${k.label} — publish ${pr.status}: ${JSON.stringify(pr.json).slice(0, 160)}`); }
    await sleep(120);
  }

  const verb = APPLY ? 'Fixed' : 'Would fix';
  console.log(
    `\n${verb}: ${counts.fixed} · already aligned: ${counts.aligned} · ar not published (WIP, skipped): ${counts.notPublished}` +
      ` · no en/ar pair: ${counts.noPair}${counts.skippedExp ? ` · experiences to fix in CMS: ${counts.skippedExp}` : ''}${counts.failed ? ` · FAILED: ${counts.failed}` : ''}`,
  );
  if (!APPLY && counts.fixed > 0) console.log('\nReview the list above, then run:  npm run align:ar-slugs -- --apply');
  if (counts.failed) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
