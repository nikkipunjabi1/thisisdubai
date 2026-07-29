// attach-assets.mjs — attach CMP (DAM) images to CMS content items, in bulk.
//
//   npm run attach-assets                    # DRY RUN: print the match table, write nothing
//   npm run attach-assets -- --apply         # write + publish
//   npm run attach-assets -- --apply --force # also replace fields that already have an image
//   npm run attach-assets -- --type=poi      # scope to one target (see TARGETS below)
//   npm run attach-assets -- --no-fallback   # don't guess; leave unmatched fields blank
//
// GOAL: no image field anywhere in the CMS is left blank.
//
// WHY this exists
// ---------------------------------------------------------------------------
// Uploading a binary CANNOT be automated: the CMS Management API's media endpoint
// (/content/{key}/versions/{version}/media) is GET-only, and creating an image item
// needs an `initialVersion.media.key` that must already exist. But ATTACHING an
// already-uploaded DAM asset is just a property write. So: a human uploads to CMP,
// this script attaches. See ASSETS.md.
//
// Write shape (learned the hard way — see ASSETS.md "Gotchas"):
//   properties: { images:  { value: ["cms://content/DamImageSource/<id>"] } }   // list
//   properties: { ogImage: { value:  "cms://content/DamImageSource/<id>"  } }   // single
// A CMP asset's `id` IS the DamImageSource key — no translation needed.

const CMS_GATEWAY = (process.env.OPTIMIZELY_CMS_API_URL || 'https://api.cms.optimizely.com').replace(/\/$/, '');
const CMP_BASE = (process.env.CMP_API_URL || 'https://api.cmp.optimizely.com').replace(/\/$/, '');
const CMP_TOKEN_URL = 'https://accounts.cmp.optimizely.com/o/oauth2/v1/token';
const GRAPH_URL = process.env.OPTIMIZELY_GRAPH_GATEWAY || 'https://cg.optimizely.com/content/v2';
const LOCALE = process.env.SEED_LOCALE || 'en';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const FORCE = args.includes('--force');
const NO_FALLBACK = args.includes('--no-fallback');
const ONLY = (args.find((a) => a.startsWith('--type=')) || '').split('=')[1] || null;

const required = {
  OPTIMIZELY_CMS_CLIENT_ID: process.env.OPTIMIZELY_CMS_CLIENT_ID,
  OPTIMIZELY_CMS_CLIENT_SECRET: process.env.OPTIMIZELY_CMS_CLIENT_SECRET,
  OPTIMIZELY_GRAPH_SINGLE_KEY: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY,
  CMP_CLIENT_ID: process.env.CMP_CLIENT_ID,
  CMP_CLIENT_SECRET: process.env.CMP_CLIENT_SECRET,
};
const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
  console.error(`✖ Missing in the environment: ${missing.join(', ')}`);
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Every place an image can live. `fields` are top-level content properties;
 * `componentFields` are image fields on blocks INSIDE a Visual Builder composition.
 * `section` is the CMP folder used as the fallback pool; `aliases` cover cases where
 * the item's name can't match its folder (the Home experience is called after the
 * site, so it would never find a folder named "Homepage").
 *
 * `ogImage` ("Social share image", from the SeoMetadata contract) is on EVERY
 * routable type, including the section landing experiences.
 */
const TARGETS = {
  poi: {
    graphType: 'PointOfInterest', label: 'Point of Interest', section: 'places to visit',
    fields: [{ name: 'images', multiple: true }, { name: 'ogImage', multiple: false }],
  },
  event: {
    graphType: 'Event', label: 'Event', section: 'events',
    fields: [{ name: 'images', multiple: true }, { name: 'ogImage', multiple: false }],
  },
  area: {
    graphType: 'Area', label: 'Neighbourhood', section: 'neighbourhoods',
    fields: [{ name: 'heroImage', multiple: false }, { name: 'ogImage', multiple: false }],
  },
  article: {
    // ArticlePost is a _component shared block (elementEnabled → Graph root type), so it
    // has no routeSegment; the READ-MERGE-WRITE below only sends routeSegment when present.
    graphType: 'ArticlePost', label: 'Article', section: 'articles',
    fields: [{ name: 'heroImage', multiple: false }, { name: 'ogImage', multiple: false }],
  },
  home: {
    graphType: 'HomePage', label: 'Home experience', section: 'homepage',
    aliases: ['homepage', 'home'],
    fields: [{ name: 'ogImage', multiple: false }],
    componentFields: { HeroBanner: ['backgroundImage'] },
  },
  'section-places': {
    graphType: 'PlacesToVisit', label: 'Places to Visit (section page)', section: 'places to visit',
    aliases: ['places to visit'], fields: [{ name: 'ogImage', multiple: false }],
  },
  'section-neighbourhoods': {
    graphType: 'Neighbourhoods', label: 'Neighbourhoods (section page)', section: 'neighbourhoods',
    aliases: ['neighbourhoods'], fields: [{ name: 'ogImage', multiple: false }],
  },
  'section-events': {
    graphType: 'Events', label: 'Events (section page)', section: 'events',
    aliases: ['events'], fields: [{ name: 'ogImage', multiple: false }],
  },
};

// ── CMP ─────────────────────────────────────────────────────────────────────
let cmpTokenCache;
async function cmpToken() {
  // CMP rate-limits token generation, so reuse until nearly expired (~30 day life).
  if (cmpTokenCache && cmpTokenCache.exp > Date.now()) return cmpTokenCache.tok;
  const res = await fetch(CMP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.CMP_CLIENT_ID,
      client_secret: process.env.CMP_CLIENT_SECRET,
    }),
  });
  const json = await res.json().catch(() => null);
  if (!json?.access_token) throw new Error(`CMP token failed: ${res.status} ${JSON.stringify(json).slice(0, 200)}`);
  cmpTokenCache = { tok: json.access_token, exp: Date.now() + (json.expires_in - 120) * 1000 };
  return cmpTokenCache.tok;
}

/** Every CMP image asset, following the offset/page_size `pagination.next` links. */
async function fetchCmpAssets() {
  const out = [];
  let path = '/v3/assets';
  for (let guard = 0; path && guard < 200; guard++) {
    const res = await fetch(`${CMP_BASE}${path}`, { headers: { Authorization: `Bearer ${await cmpToken()}` } });
    if (res.status === 429) { await sleep(2000); continue; }
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.data) throw new Error(`CMP assets failed: ${res.status} ${JSON.stringify(json).slice(0, 200)}`);
    out.push(...json.data);
    const next = json.pagination?.next;
    path = next ? next.replace(CMP_BASE, '') : null;
  }
  return out.filter((a) => a.type === 'image' && !a.is_archived);
}

// ── CMS ─────────────────────────────────────────────────────────────────────
async function graph(query, variables = {}) {
  const res = await fetch(GRAPH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `epi-single ${process.env.OPTIMIZELY_GRAPH_SINGLE_KEY}` },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(`Graph error: ${JSON.stringify(json.errors).slice(0, 300)}`);
  return json.data;
}

async function cmsToken() {
  const res = await fetch(`${CMS_GATEWAY}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: process.env.OPTIMIZELY_CMS_CLIENT_ID,
      client_secret: process.env.OPTIMIZELY_CMS_CLIENT_SECRET,
    }),
  });
  if (!res.ok) throw new Error(`CMS token failed: ${res.status}`);
  return (await res.json()).access_token;
}

async function cma(token, method, path, body, attempt = 1) {
  const res = await fetch(`${CMS_GATEWAY}/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 429 && attempt <= 6) {
    await sleep(1500 * attempt);
    return cma(token, method, path, body, attempt + 1);
  }
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, json };
}

/**
 * Is an image field actually filled?
 *
 * CAREFUL: an UNSET content reference does not come back as null — Graph returns
 * `{ key: null, url: { default: null } }`, which is a truthy object. Checking the
 * property for truthiness therefore reports every empty reference as filled (this
 * bug hid every blank "Social share image"). Only a non-null `key` means filled.
 */
const isFilled = (value, multiple) =>
  multiple ? (value ?? []).some((v) => v?.key) : Boolean(value?.key);

// ── Matching ────────────────────────────────────────────────────────────────
const normalise = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\b(the|a|an|of|and)\b/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

const folderLeaf = (loc) => (loc || '').split('/').filter(Boolean).pop() || '';

/**
 * Deterministic pick when a folder holds several shots: lowest numeric suffix first
 * (`-1` before `-2`), else alphabetical. Keeps re-runs stable so the grid doesn't
 * reshuffle on every run.
 */
function pickAsset(assets) {
  const rank = (t) => {
    const m = /-(\d+)\.[a-z0-9]+$/i.exec(t || '');
    return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
  };
  return [...assets].sort((a, b) => rank(a.title) - rank(b.title) || (a.title || '').localeCompare(b.title || ''))[0];
}

/**
 * Best asset group for an item, in descending confidence. Because the goal is that
 * no field is left blank, this GUESSES rather than giving up:
 *   exact → alias → fuzzy(≥60% tokens) → GUESS:section → GUESS:any
 * The 60% threshold stops "Dubai Marina" claiming "Dubai Marina Walk" for sharing
 * the word "dubai". Guess tiers are labelled so they're visible in the output.
 */
function matchAssets(name, groups, cfg, allAssets) {
  const target = normalise(name);
  if (groups.has(target)) return { assets: groups.get(target), confidence: 'exact' };

  for (const alias of cfg.aliases ?? []) {
    const key = normalise(alias);
    if (groups.has(key)) return { assets: groups.get(key), confidence: `alias(${alias})` };
  }

  const targetTokens = new Set(target.split(' ').filter(Boolean));
  let best = null;
  for (const [key, assets] of groups) {
    const tokens = key.split(' ').filter(Boolean);
    if (!tokens.length) continue;
    const overlap = tokens.filter((t) => targetTokens.has(t)).length;
    const score = overlap / Math.max(tokens.length, targetTokens.size);
    if (overlap > 0 && (!best || score > best.score)) best = { assets, score, key };
  }
  if (best && best.score >= 0.6) return { assets: best.assets, confidence: `fuzzy(${best.key})` };

  if (NO_FALLBACK) return null;

  if (cfg.section) {
    const inSection = allAssets.filter((a) => normalise(a.file_location).includes(normalise(cfg.section)));
    if (inSection.length) return { assets: inSection, confidence: 'GUESS:section' };
  }
  return allAssets.length ? { assets: allAssets, confidence: 'GUESS:any' } : null;
}

/**
 * Walk a Visual Builder composition and return the image slots declared in
 * `componentFields`, each with a `set()` that writes into the live tree. The tree
 * nests under varying keys depending on how the canvas was authored, so walk them all.
 */
function findCompositionImageSlots(node, componentFields, out = []) {
  if (!node || typeof node !== 'object') return out;

  const componentType = node.component?.contentType ?? node.componentType;
  const fields = componentType ? componentFields[componentType] : null;
  if (fields && node.component) {
    node.component.properties ??= {};
    for (const field of fields) {
      if (!node.component.properties[field]?.value) {
        out.push({ componentType, field, set: (uri) => { node.component.properties[field] = { value: uri }; } });
      }
    }
  }

  if (Array.isArray(node)) node.forEach((c) => findCompositionImageSlots(c, componentFields, out));
  for (const k of ['nodes', 'grids', 'rows', 'columns', 'elements']) {
    if (Array.isArray(node[k])) node[k].forEach((c) => findCompositionImageSlots(c, componentFields, out));
  }
  return out;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(APPLY ? '▶ APPLY — changes will be written and published' : '▶ DRY RUN — nothing will be written (add --apply)');
  if (ONLY && !TARGETS[ONLY]) {
    console.error(`✖ --type must be one of: ${Object.keys(TARGETS).join(', ')}`);
    process.exit(1);
  }

  const assets = await fetchCmpAssets();
  const groups = new Map();
  for (const a of assets) {
    const key = normalise(folderLeaf(a.file_location));
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(a);
  }
  console.log(`\nCMP: ${assets.length} image assets in ${groups.size} folders`);

  const token = APPLY ? await cmsToken() : await cmsToken(); // needed to read compositions too
  const summary = { filled: 0, skipped: 0, unmatched: 0, failed: 0 };
  const usedGroups = new Set();

  for (const [targetKey, cfg] of Object.entries(TARGETS)) {
    if (ONLY && ONLY !== targetKey) continue;

    const projection = cfg.fields
      .map((f) => `${f.name} { ${f.multiple ? 'key' : 'key'} }`)
      .join(' ');
    const data = await graph(
      `query { ${cfg.graphType}(limit: 100) { items { _metadata { key displayName } ${projection} } } }`,
    );
    const items = data[cfg.graphType]?.items ?? [];
    console.log(`\n── ${cfg.label} (${items.length})`);

    for (const item of items) {
      const name = item._metadata.displayName;
      const key = item._metadata.key;

      const match = matchAssets(name, groups, cfg, assets);
      if (match) usedGroups.add(normalise(folderLeaf(match.assets[0].file_location)));

      // Which top-level fields still need an image?
      const blankFields = cfg.fields.filter((f) => FORCE || !isFilled(item[f.name], f.multiple));

      // Composition slots (experiences only) need the CMA version to inspect.
      let version = null;
      let compositionSlots = [];
      if (cfg.componentFields) {
        const res = await cma(token, 'GET', `/content/${key}/versions`);
        version = res.json?.items?.[0];
        if (version?.composition) compositionSlots = findCompositionImageSlots(version.composition, cfg.componentFields);
      }

      if (!blankFields.length && !compositionSlots.length) {
        console.log(`  ○ ${name} — all image fields filled`);
        summary.skipped++;
        continue;
      }
      if (!match) {
        console.log(`  ✖ ${name} — nothing to attach (${[...blankFields.map((f) => f.name), ...compositionSlots.map((s) => s.field)].join(', ')} blank)`);
        summary.unmatched++;
        continue;
      }

      const asset = pickAsset(match.assets);
      const uri = `cms://content/DamImageSource/${asset.id}`;
      const where = [...blankFields.map((f) => f.name), ...compositionSlots.map((s) => `${s.componentType}.${s.field}`)].join(', ');
      const detail = `${asset.title}${match.assets.length > 1 ? ` (of ${match.assets.length})` : ''} [${match.confidence}]`;

      if (!APPLY) {
        console.log(`  → ${name} (${where})  ⟵  ${detail}`);
        summary.filled++;
        continue;
      }

      // READ-MERGE-WRITE. A new version must carry displayName (required) and
      // routeSegment (or the item's URL changes), and dropping existing properties
      // would blank required fields like `name`.
      if (!version) {
        const res = await cma(token, 'GET', `/content/${key}/versions`);
        version = res.json?.items?.[0];
      }
      if (!version) {
        console.log(`  ✖ ${name} — could not read current version`);
        summary.failed++;
        continue;
      }
      for (const slot of compositionSlots) slot.set(uri);

      const body = {
        locale: version.locale ?? LOCALE,
        displayName: version.displayName,
        ...(version.routeSegment ? { routeSegment: version.routeSegment } : {}),
        ...(version.composition ? { composition: version.composition } : {}),
        properties: { ...version.properties },
      };
      for (const f of blankFields) body.properties[f.name] = { value: f.multiple ? [uri] : uri };

      const created = await cma(token, 'POST', `/content/${key}/versions`, body);
      if (created.status >= 300) {
        console.log(`  ✖ ${name} — version create ${created.status}: ${JSON.stringify(created.json).slice(0, 160)}`);
        summary.failed++;
        continue;
      }
      // Publish the version we just created — the HIGHEST version number. Taking
      // items[0] from the list is unsafe (its order isn't guaranteed newest-first: for
      // items with extra drafts it can be the already-published version, so the publish
      // no-ops with 200 and our image write is stranded as an unpublished draft). Version
      // numbers are monotonic, so the create is always max(). `created.version` is not
      // reliably populated, hence the explicit max over the list.
      const vlist = (await cma(token, 'GET', `/content/${key}/versions`)).json?.items ?? [];
      const v = created.json?.version ?? vlist.map((x) => Number(x.version)).sort((a, b) => b - a)[0];
      const pub = v ? await cma(token, 'POST', `/content/${key}/versions/${v}:publish`, {}) : { status: 0 };
      const ok = pub.status === 200 || pub.status === 204;
      console.log(`  ${ok ? '✔' : '⚠'} ${name} (${where})  ⟵  ${detail}${ok ? '' : ` (publish ${pub.status})`}`);
      ok ? summary.filled++ : summary.failed++;
    }
  }

  const orphans = [...groups.keys()].filter((k) => !usedGroups.has(k));
  if (orphans.length) console.log(`\n⚠ CMP folders not matched to any item: ${orphans.join(', ')}`);

  console.log(
    `\n${APPLY ? 'Done' : 'Dry run complete'} — ${summary.filled} ${APPLY ? 'filled' : 'would fill'}, ` +
      `${summary.skipped} already complete, ${summary.unmatched} unmatched, ${summary.failed} failed`,
  );
  if (!APPLY && summary.filled > 0) console.log('Re-run with --apply to write these.');
  if (summary.failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(`✖ ${err.message}`);
  process.exit(1);
});
