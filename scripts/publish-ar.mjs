// publish-ar.mjs — bulk-publish the Arabic (ar) versions of every content item,
// via the Content Management API (CMA).
//
//   npm run publish:ar                    # DRY RUN — list every ar DRAFT that would be published
//   npm run publish:ar -- --apply         # publish each newest ar draft
//   npm run publish:ar -- --type=PointOfInterest   # limit to one type (repeatable)
//   npm run publish:ar -- --locale=ar     # target locale (default: ar)
//
// The workflow this supports: an author translates items in the CMS and leaves each
// Arabic version in DRAFT. When translation is done, this sweeps the whole site and
// publishes every ar draft in one pass. Safe to re-run: items whose newest ar version
// is already published are reported and skipped, so it is idempotent.
//
// How it finds the work:
//   1. DISCOVERY (Optimizely Graph). Every translatable item already has a published EN
//      version, so it is queryable via the delivery API. We page through `_Content` to
//      get the complete set of content keys (folders excluded). Graph only sees PUBLISHED
//      content, so it cannot see ar drafts — it is used purely to enumerate keys.
//   2. DECISION (CMA). For each key we GET `/content/{key}/versions`, take the NEWEST ar
//      version (highest version id — the list is not ordered and interleaves locales), and:
//        • no ar version at all      → not translated yet, skipped
//        • newest ar is 'published'  → already done, skipped
//        • newest ar is 'previous'   → superseded with nothing newer, skipped (nothing to do)
//        • newest ar is 'draft'/etc. → PUBLISH TARGET
//   3. PUBLISH (CMA). `POST /content/{key}/versions/{version}:publish` on that exact version.
//
// Safety: dry-by-default (publishes only with --apply). A publish that fails validation
// (e.g. a required ar field left empty) is reported per item and the sweep continues; the
// script exits non-zero if any publish failed, so a run is either clean or it tells you
// exactly which items still need attention in the CMS.

const CMA = (process.env.OPTIMIZELY_CMS_API_URL || 'https://api.cms.optimizely.com').replace(/\/$/, '');
const CLIENT_ID = process.env.OPTIMIZELY_CMS_CLIENT_ID;
const CLIENT_SECRET = process.env.OPTIMIZELY_CMS_CLIENT_SECRET;
const GRAPH_GATEWAY = (process.env.OPTIMIZELY_GRAPH_GATEWAY || '').replace(/\/$/, '');
const GRAPH_KEY = process.env.OPTIMIZELY_GRAPH_SINGLE_KEY;

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const LOCALE = (args.find((a) => a.startsWith('--locale=')) ?? '--locale=ar').slice(9);
const ONLY = args.filter((a) => a.startsWith('--type=')).map((a) => a.slice(7));
const wanted = (type) => ONLY.length === 0 || ONLY.includes(type);

// Base types that are never translatable content pages — organisational folders.
const FOLDER_TYPES = new Set(['SysContentFolder', '_Folder']);

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('✖ Missing OPTIMIZELY_CMS_CLIENT_ID / OPTIMIZELY_CMS_CLIENT_SECRET in the environment.');
  process.exit(1);
}
if (!GRAPH_GATEWAY || !GRAPH_KEY) {
  console.error('✖ Missing OPTIMIZELY_GRAPH_GATEWAY / OPTIMIZELY_GRAPH_SINGLE_KEY (needed to discover content keys).');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Discovery: every content key, via Graph delivery ───────────────────────────
async function discoverKeys() {
  // GRAPH_GATEWAY may already carry the `/content/v2` path; resolving against its
  // origin normalises both `https://host` and `https://host/content/v2` to one endpoint.
  const url = `${new URL('/content/v2', GRAPH_GATEWAY).href}?auth=${GRAPH_KEY}`;
  const query = `query($skip:Int!){ _Content(limit:100, skip:$skip){ total items { _metadata { key displayName types } } } }`;
  const byKey = new Map();
  let skip = 0;
  let total = Infinity;
  while (skip < total) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { skip } }),
    });
    const json = await res.json();
    if (json.errors) throw new Error(`Graph discovery failed: ${JSON.stringify(json.errors).slice(0, 240)}`);
    const { items, total: t } = json.data._Content;
    total = t;
    for (const it of items) {
      const m = it._metadata;
      if (!m?.key || byKey.has(m.key)) continue;
      const types = m.types ?? [];
      if (types.some((x) => FOLDER_TYPES.has(x))) continue; // skip folders
      const primary = types.find((x) => !x.startsWith('_')) ?? types[0] ?? '?';
      byKey.set(m.key, { key: m.key, label: m.displayName ?? m.key, type: primary });
    }
    skip += 100;
    if (items.length === 0) break;
  }
  return [...byKey.values()].filter((c) => wanted(c.type)).sort((a, b) => a.type.localeCompare(b.type) || a.label.localeCompare(b.label));
}

// ── CMA ─────────────────────────────────────────────────────────────────────
async function getToken() {
  const res = await fetch(`${CMA}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
  });
  if (!res.ok) throw new Error(`Token request failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

async function api(token, method, path, body, attempt = 1) {
  const res = await fetch(`${CMA}/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 429 && attempt <= 6) {
    await sleep(1500 * attempt);
    return api(token, method, path, body, attempt + 1);
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

const isTarget = (v) => v.locale === LOCALE || v.locale?.name === LOCALE;

/**
 * Decide what to do with one key's ar versions.
 * Returns { action: 'publish'|'published'|'none'|'stale'|'error', version?, msg }.
 */
async function inspect(token, key) {
  const r = await api(token, 'GET', `/content/${key}/versions`);
  if (r.status !== 200) return { action: 'error', msg: `versions ${r.status}: ${JSON.stringify(r.json).slice(0, 140)}` };
  const ar = (r.json?.items ?? []).filter(isTarget).sort((a, b) => Number(b.version) - Number(a.version));
  const newest = ar[0];
  if (!newest) return { action: 'none', msg: `no ${LOCALE} version` };
  if (newest.status === 'published') return { action: 'published', version: newest.version, msg: `already published (v${newest.version})` };
  if (newest.status === 'previous') return { action: 'stale', version: newest.version, msg: `newest ${LOCALE} is 'previous' (v${newest.version}) — nothing to publish` };
  return { action: 'publish', version: newest.version, status: newest.status, msg: `${newest.status} v${newest.version}` };
}

async function publish(token, key, version) {
  const r = await api(token, 'POST', `/content/${key}/versions/${version}:publish`, {});
  const ok = r.status === 200 || r.status === 204;
  return { ok, msg: ok ? `published v${version}` : `publish ${r.status}: ${JSON.stringify(r.json).slice(0, 180)}` };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const mode = APPLY ? 'APPLY (publishing)' : 'DRY RUN';
  console.log(`Publish ${LOCALE} → ${CMA}   ${mode}`);
  console.log('Discovering content keys via Graph…');
  const candidates = await discoverKeys();
  console.log(`${candidates.length} content items${ONLY.length ? ` (types: ${ONLY.join(', ')})` : ''}\n`);

  const token = await getToken();
  const counts = { publish: 0, published: 0, none: 0, stale: 0, failed: 0 };

  for (const c of candidates) {
    const r = await inspect(token, c.key);

    if (r.action === 'error') {
      counts.failed += 1;
      console.log(`  ✖ ${c.type.padEnd(16)} ${c.label} — ${r.msg}`);
      continue;
    }
    if (r.action === 'published') {
      counts.published += 1;
      console.log(`  = ${c.type.padEnd(16)} ${c.label} — ${r.msg}`);
      continue;
    }
    if (r.action === 'none') {
      counts.none += 1;
      console.log(`  · ${c.type.padEnd(16)} ${c.label} — ${r.msg}`);
      continue;
    }
    if (r.action === 'stale') {
      counts.stale += 1;
      console.log(`  ⚠ ${c.type.padEnd(16)} ${c.label} — ${r.msg}`);
      continue;
    }

    // action === 'publish'
    if (!APPLY) {
      counts.publish += 1;
      console.log(`  + ${c.type.padEnd(16)} ${c.label} — would publish ${r.msg}`);
      continue;
    }
    const pr = await publish(token, c.key, r.version);
    if (pr.ok) counts.publish += 1;
    else counts.failed += 1;
    console.log(`  ${pr.ok ? '✔' : '✖'} ${c.type.padEnd(16)} ${c.label} — ${pr.msg}`);
    await sleep(120); // be gentle with the CMA
  }

  const verb = APPLY ? 'Published' : 'Would publish';
  console.log(
    `\n${verb}: ${counts.publish}` +
      ` · already published: ${counts.published}` +
      ` · not translated (${LOCALE}): ${counts.none}` +
      (counts.stale ? ` · stale: ${counts.stale}` : '') +
      (counts.failed ? ` · FAILED: ${counts.failed}` : ''),
  );
  if (!APPLY && counts.publish > 0) console.log(`\nReview the list above, then run:  npm run publish:ar -- --apply`);
  if (counts.failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
