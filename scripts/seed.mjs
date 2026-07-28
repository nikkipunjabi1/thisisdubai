// Seed script — creates + publishes content in Optimizely SaaS CMS via the
// Content Management API (CMA). Run: `npm run seed` (loads .env).
//
// Auth: OAuth client-credentials (OPTIMIZELY_CMS_CLIENT_ID/SECRET) against the
// SaaS gateway. Flow per item: POST /v1/content (draft) -> publish the version.
// Idempotent: deterministic keys (md5 of "<type>:<slug>"); an item that already
// exists (409) is PATCHed to its container and given a fresh published version.
//
// Content tree (CMS-managed URLs):
//   Home (/)
//   ├─ Places to Visit (/places-to-visit)   [PlacesToVisit experience]
//   │   └─ <PointOfInterest>                (/places-to-visit/<slug>)
//   ├─ Neighbourhoods (/neighbourhoods)     [Neighbourhoods experience]
//   │   └─ <Area>                           (/neighbourhoods/<slug>)
//   └─ Events (/events)                     [Events experience]
//       └─ <Event>                          (/events/<slug>)
// Tags are shared blocks (_component) in the application shared-assets folder.
//
// The seed DATA lives in scripts/data/ — see that directory for the content itself.
// Property write-shapes (including the non-obvious rich text one) are in
// scripts/data/_helpers.mjs.
//
// Flags:
//   --type=poi|event|area|tag|article   seed only one collection (repeatable)
//   --dry-run                   print what would be written, touch nothing

import { keyFor, areaKey, poiKey, eventKey, tagKey, articleBlockKey } from './data/_helpers.mjs';
import { areas } from './data/areas.mjs';
import { tags } from './data/tags.mjs';
import { pois } from './data/pois/index.mjs';
import { events } from './data/events.mjs';
import { articles } from './data/articles/index.mjs';

const GATEWAY = (process.env.OPTIMIZELY_CMS_API_URL || 'https://api.cms.optimizely.com').replace(/\/$/, '');
const CLIENT_ID = process.env.OPTIMIZELY_CMS_CLIENT_ID;
const CLIENT_SECRET = process.env.OPTIMIZELY_CMS_CLIENT_SECRET;
const LOCALE = process.env.SEED_LOCALE || 'en';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ONLY = args.filter((a) => a.startsWith('--type=')).map((a) => a.slice(7));
const wanted = (kind) => ONLY.length === 0 || ONLY.includes(kind);

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('✖ Missing OPTIMIZELY_CMS_CLIENT_ID / OPTIMIZELY_CMS_CLIENT_SECRET in the environment.');
  process.exit(1);
}

// Shared blocks live in the application shared-assets folder ("For This Application",
// /SysSiteAssets/) and are grouped into named sub-folders — Optimizely CMS best practice,
// never dump blocks flat. Shared-block folders are `SysContentFolder`s; the CMA can create
// them (see ensureSharedFolder) or they can be made once in the Shared Blocks UI. Override
// per-environment via env.
const SITE_ASSETS = process.env.SEED_SITE_ASSETS || '8ce609ddb1984b04a99c5764a540d313'; // "For This Application"
const TAG_TAXONOMY = process.env.SEED_TAG_TAXONOMY || '1064637c853e49519f4d5ebf29d227df'; // "Tag - Taxonomy"
const ARTICLES_FOLDER = process.env.SEED_ARTICLES_FOLDER || '7c829c4df9e4af6481bca15d4c45aefa'; // "Articles" (shared-block folder)
// Section pages are Visual Builder EXPERIENCES (created by scripts/migrate-experiences.mjs).
// Their child items are parented to these keys → URLs stay /<section>/<slug>.
const PLACES_KEY = keyFor('places-to-visit-exp');
const NEIGHBOURHOODS_KEY = keyFor('neighbourhoods-exp');
const EVENTS_KEY = keyFor('events-exp');

async function getToken() {
  const res = await fetch(`${GATEWAY}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
  });
  if (!res.ok) throw new Error(`Token request failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(token, method, path, body, extraHeaders = {}, attempt = 1) {
  const res = await fetch(`${GATEWAY}/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...extraHeaders },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  // The CMA rate-limits bursts (429). Back off and retry so the seed self-throttles.
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

/**
 * Ensure a shared-block folder (`SysContentFolder`) exists in the Assets panel and return
 * its key. Unlike page-tree `_folder`s, these DO render in the Shared Blocks panel — the
 * supported way to organise blocks at scale (Articles → year → month). Non-localized and
 * created already-published, so no locale + no publish step. Idempotent (409 = exists).
 */
async function ensureSharedFolder(token, { key, displayName, container }) {
  if (DRY_RUN) {
    console.log(`· Shared folder      "${displayName}" — would ensure`);
    return key;
  }
  const r = await api(token, 'POST', '/content', {
    key,
    contentType: 'SysContentFolder',
    container,
    initialVersion: { displayName },
  });
  if (r.status === 201) console.log(`✔ Shared folder      "${displayName}" — created`);
  else if (r.status !== 409) {
    failures += 1;
    console.log(`✖ Shared folder      "${displayName}" — ${r.status}: ${JSON.stringify(r.json).slice(0, 200)}`);
  }
  return key;
}

async function publishLatest(token, key) {
  const versions = await api(token, 'GET', `/content/${key}/versions`);
  const version = versions.json?.items?.[0]?.version;
  if (!version) return `⚠ no version to publish`;
  const pub = await api(token, 'POST', `/content/${key}/versions/${version}:publish`, {});
  // Publish succeeds with 204 (No Content) or 200.
  return pub.status === 204 || pub.status === 200
    ? 'published'
    : `publish ${pub.status}: ${JSON.stringify(pub.json).slice(0, 160)}`;
}

let failures = 0;

async function upsert(token, { slug, key: providedKey, contentType, container, routable, displayName, properties, reparent }) {
  const key = providedKey || keyFor(slug);
  const version = { locale: LOCALE, displayName, ...(routable ? { routeSegment: slug } : {}), properties };

  if (DRY_RUN) {
    console.log(`· ${contentType.padEnd(18)} "${displayName}" — would write ${Object.keys(properties).join(', ')}`);
    return;
  }

  const create = await api(token, 'POST', '/content', { key, contentType, container, initialVersion: version });

  if (create.status === 201) {
    const state = await publishLatest(token, key);
    console.log(`✔ ${contentType.padEnd(18)} "${displayName}" — created + ${state}`);
    return;
  }
  if (create.status === 409) {
    // Already exists → make it current: (optionally) re-parent, then write a fresh
    // version and publish.
    if (reparent && container) {
      await api(token, 'PATCH', `/content/${key}`, { container }, { 'Content-Type': 'application/merge-patch+json' });
    }
    // READ-MERGE-WRITE, not overwrite. A new version replaces the WHOLE property
    // bag, so writing only the seed's properties would silently blank anything the
    // seed doesn't know about — in particular the DAM images attached by
    // scripts/attach-assets.mjs (`images`, `heroImage`, `ogImage`). Seed values win
    // on the fields the seed owns; everything else is carried forward untouched.
    const current = await api(token, 'GET', `/content/${key}/versions`);
    const existing = current.json?.items?.[0]?.properties ?? {};
    const nv = await api(token, 'POST', `/content/${key}/versions`, {
      ...version,
      properties: { ...existing, ...properties },
    });
    if (nv.status !== 201 && nv.status !== 200) {
      failures += 1;
      console.log(`✖ ${contentType.padEnd(18)} "${displayName}" — new version ${nv.status}: ${JSON.stringify(nv.json).slice(0, 300)}`);
      return;
    }
    const state = await publishLatest(token, key);
    console.log(`↻ ${contentType.padEnd(18)} "${displayName}" — updated + ${state}`);
    return;
  }
  failures += 1;
  console.log(`✖ ${contentType.padEnd(18)} "${displayName}" — create ${create.status}: ${JSON.stringify(create.json).slice(0, 400)}`);
}

/**
 * Fail fast on data problems the CMA would only report one item at a time:
 * duplicate slugs (a silent overwrite, since the key is derived from the slug) and
 * `area` references pointing at a neighbourhood that isn't in the seed.
 */
function validate() {
  const problems = [];
  const areaSlugs = new Set(areas.map((a) => a.slug));

  for (const [label, list] of [['area', areas], ['tag', tags], ['poi', pois], ['event', events], ['article', articles]]) {
    const seen = new Set();
    for (const item of list) {
      if (seen.has(item.slug)) problems.push(`duplicate ${label} slug: ${item.slug}`);
      seen.add(item.slug);
    }
  }

  // An `area` property holds "cms://content/<md5(area:<slug>)>" — map keys back to slugs.
  const keyToSlug = new Map(areas.map((a) => [areaKey(a.slug), a.slug]));
  for (const list of [pois, events]) {
    for (const item of list) {
      const ref = item.props.area?.value;
      if (!ref) continue;
      const refKey = String(ref).replace('cms://content/', '');
      if (!keyToSlug.has(refKey)) problems.push(`${item.slug}: area reference not in seed (${refKey})`);
    }
  }
  if (areaSlugs.size !== areas.length) problems.push('area slugs are not unique');

  // Same check for tag references — a typo'd tag slug would otherwise fail one
  // item at a time, 100 items into the run.
  const tagKeyToSlug = new Map(tags.map((t) => [tagKey(t.slug), t.slug]));
  for (const list of [pois, events, articles]) {
    for (const item of list) {
      for (const ref of item.props.tags?.value ?? []) {
        const refKey = String(ref).replace('cms://content/', '');
        if (!tagKeyToSlug.has(refKey)) problems.push(`${item.slug}: unknown tag reference (${refKey})`);
      }
    }
  }

  // Articles cross-link to POIs; a typo'd slug would fail one item at a time.
  const poiKeyToSlug = new Map(pois.map((p) => [poiKey(p.slug), p.slug]));
  for (const a of articles) {
    for (const ref of a.props.relatedPlaces?.value ?? []) {
      const refKey = String(ref).replace('cms://content/', '');
      if (!poiKeyToSlug.has(refKey)) problems.push(`${a.slug}: relatedPlaces points at a POI not in the seed (${refKey})`);
    }
  }

  if (problems.length) {
    console.error(`✖ Seed data invalid:\n  ${problems.join('\n  ')}`);
    process.exit(1);
  }
}

async function main() {
  validate();
  console.log(
    `Seeding → ${GATEWAY} (locale ${LOCALE})${DRY_RUN ? ' — DRY RUN' : ''}\n` +
      `${areas.length} neighbourhoods · ${tags.length} tags · ${pois.length} places · ${events.length} events · ${articles.length} articles\n`,
  );
  const token = DRY_RUN ? null : await getToken();

  // Neighbourhoods first: POIs and Events hold references to them, and a reference
  // to a key that does not exist yet is rejected.
  if (wanted('area')) {
    for (const a of areas) {
      await upsert(token, { slug: a.slug, key: areaKey(a.slug), contentType: 'Area', container: NEIGHBOURHOODS_KEY, routable: true, displayName: a.displayName, properties: a.props, reparent: true });
    }
  }
  // Tags → shared blocks (_component) grouped under the "Tag - Taxonomy" folder
  // (non-routable). `reparent: true` keeps them tucked in the folder on re-runs.
  if (wanted('tag')) {
    for (const t of tags) {
      await upsert(token, { slug: t.slug, key: tagKey(t.slug), contentType: 'TagTerm', container: TAG_TAXONOMY, routable: false, displayName: t.displayName, properties: t.props, reparent: true });
    }
  }
  if (wanted('poi')) {
    for (const p of pois) {
      await upsert(token, { slug: p.slug, key: poiKey(p.slug), contentType: 'PointOfInterest', container: PLACES_KEY, routable: true, displayName: p.displayName, properties: p.props, reparent: true });
    }
  }
  if (wanted('event')) {
    for (const e of events) {
      await upsert(token, { slug: e.slug, key: eventKey(e.slug), contentType: 'Event', container: EVENTS_KEY, routable: true, displayName: e.displayName, properties: e.props, reparent: true });
    }
  }

  if (wanted('article')) {
    // Articles are SHARED BLOCKS (`ArticlePost` `_component`) in the Shared Blocks (Assets)
    // panel, foldered Articles → <year> → <month>. Folders there DO render (unlike the Pages
    // tree) and scale to thousands. The folder is editorial only — the URL
    // (/articles/<year>/<month>/<slug>) is derived by the app from `publishDate` + `slug`.
    // See docs/CONTENT-ARCHITECTURE.md §10.
    const ym = (a) => {
      const d = String(a.props.publishDate?.value ?? '');
      return { y: d.slice(0, 4) || 'undated', m: d.slice(5, 7) || '00' };
    };
    const yearKey = (y) => keyFor(`articlefolder:${y}`);
    const monthKey = (y, m) => keyFor(`articlefolder:${y}:${m}`);

    await ensureSharedFolder(token, { key: ARTICLES_FOLDER, displayName: 'Articles', container: SITE_ASSETS });
    for (const y of new Set(articles.map((a) => ym(a).y))) {
      await ensureSharedFolder(token, { key: yearKey(y), displayName: y, container: ARTICLES_FOLDER });
    }
    for (const s of new Set(articles.map((a) => { const { y, m } = ym(a); return `${y}/${m}`; }))) {
      const [y, m] = s.split('/');
      await ensureSharedFolder(token, { key: monthKey(y, m), displayName: m, container: yearKey(y) });
    }
    for (const a of articles) {
      const { y, m } = ym(a);
      await upsert(token, { slug: a.slug, key: articleBlockKey(a.slug), contentType: 'ArticlePost', container: monthKey(y, m), routable: false, displayName: a.displayName, properties: a.props, reparent: true });
    }
  }

  console.log(`\nDone.${failures ? ` ${failures} item(s) failed.` : ''}`);
  if (failures) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
