// Creates a section landing page as a Visual Builder `_experience`, with a seeded
// canvas (Section Heading + Section Listing), under Home.
//
//   npm run create-section                    # DRY RUN — list what would be created
//   npm run create-section -- --apply         # create every missing section
//   npm run create-section -- --apply --only=articles
//
// This is the reusable successor to scripts/migrate-experiences.mjs, which was a
// ONE-TIME migration (it moved children off old `_page` listing types and deleted
// them). New sections have no old page to migrate, so they just need creating.
//
// Idempotent: an existing key returns 409 and is left alone.
//
// After running, authors enrich the canvas in Visual Builder — add a Hero above
// the heading, RichText below the listing, reorder, etc. The seeded canvas is a
// starting point, not a fixed template.

import { createHash, randomUUID } from 'node:crypto';

const CMA = (process.env.OPTIMIZELY_CMS_API_URL || 'https://api.cms.optimizely.com').replace(/\/$/, '');
const CLIENT_ID = process.env.OPTIMIZELY_CMS_CLIENT_ID;
const CLIENT_SECRET = process.env.OPTIMIZELY_CMS_CLIENT_SECRET;
const HOME = process.env.SEED_HOME || '71792f1b444e4d6d9a77c41c47c4cf7e';
const LOCALE = process.env.SEED_LOCALE || 'en';

const APPLY = process.argv.includes('--apply');
const ONLY = process.argv.find((a) => a.startsWith('--only='))?.slice(7);

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('✖ Missing OPTIMIZELY_CMS_CLIENT_ID / OPTIMIZELY_CMS_CLIENT_SECRET.');
  process.exit(1);
}

const keyFor = (s) => createHash('md5').update(s).digest('hex');
// The composition node id must be a UUID; derive it from the content key so a
// re-run produces a stable canvas rather than a new one each time.
const asUuid = (k) => `${k.slice(0, 8)}-${k.slice(8, 12)}-${k.slice(12, 16)}-${k.slice(16, 20)}-${k.slice(20)}`;
const V = (value) => ({ value });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Sections that are NOT part of the original three. `type` must be a registered
 * `_experience` content type whose `mayContainTypes` accepts the child type.
 */
const SECTIONS = [
  {
    id: 'articles',
    seg: 'articles',
    type: 'Articles',
    name: 'Articles',
    heading: 'Stories from the city',
    intro:
      'Guides, deep dives and practical advice — written to be useful before you book and once you have landed.',
    metaDescription:
      'Dubai guides and stories — neighbourhoods, food, culture, budgets and practical advice for planning a trip.',
  },
];

async function getToken() {
  const r = await fetch(`${CMA}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
  });
  if (!r.ok) throw new Error(`token ${r.status} ${await r.text()}`);
  return (await r.json()).access_token;
}

async function api(t, m, p, b, extra = {}, attempt = 1) {
  const r = await fetch(`${CMA}/v1${p}`, {
    method: m,
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', ...extra },
    body: b === undefined ? undefined : JSON.stringify(b),
  });
  if (r.status === 429 && attempt <= 6) {
    await sleep(1500 * attempt);
    return api(t, m, p, b, extra, attempt + 1);
  }
  const text = await r.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: r.status, json };
}

async function publishLatest(t, key) {
  const versions = await api(t, 'GET', `/content/${key}/versions`);
  const version = versions.json?.items?.[0]?.version;
  if (!version) return 'no-version';
  const pub = await api(t, 'POST', `/content/${key}/versions/${version}:publish`, {});
  return pub.status === 204 || pub.status === 200 ? 'published' : `publish ${pub.status}`;
}

/** Section Heading + Section Listing, matching the three existing sections. */
function buildComposition(s, key) {
  const layout = {
    displayTemplate: 'LayoutDisplayTemplate',
    settings: { theme: 'inherit', width: 'contained', spacing: 'normal' },
  };
  return {
    id: asUuid(key),
    displayName: s.name,
    nodeType: 'experience',
    layoutType: 'outline',
    nodes: [
      {
        id: randomUUID(),
        displayName: 'Section Heading',
        nodeType: 'component',
        displaySettings: layout,
        component: {
          contentType: 'SectionHeading',
          properties: { eyebrow: V(s.name), heading: V(s.heading), intro: V(s.intro) },
        },
      },
      {
        id: randomUUID(),
        displayName: 'Section Listing',
        nodeType: 'component',
        displaySettings: layout,
        // `source` points the listing at THIS page, so it lists its own children.
        component: {
          contentType: 'SectionListing',
          properties: { source: V(`cms://content/${key}`), pageSize: V('9') },
        },
      },
    ],
  };
}

async function create(t, s) {
  const key = keyFor(`${s.id}-exp`);
  console.log(`\n=== ${s.name} (/${s.seg}) ===`);
  console.log(`  key ${key}`);

  if (!APPLY) {
    console.log('  · dry run — would create under Home and publish');
    return;
  }

  const body = {
    key,
    contentType: s.type,
    container: HOME,
    initialVersion: {
      locale: LOCALE,
      displayName: s.name,
      routeSegment: s.seg,
      composition: buildComposition(s, key),
      properties: { metaDescription: V(s.metaDescription) },
    },
  };

  const r = await api(t, 'POST', '/content', body);
  if (r.status === 201) {
    console.log(`  ✔ created — ${await publishLatest(t, key)}`);
  } else if (r.status === 409) {
    console.log('  = already exists (left alone)');
  } else {
    console.log(`  ✖ create ${r.status}: ${JSON.stringify(r.json).slice(0, 400)}`);
    process.exitCode = 1;
  }
}

(async () => {
  const wanted = ONLY ? SECTIONS.filter((s) => s.id === ONLY) : SECTIONS;
  if (!wanted.length) {
    console.error(`✖ no section matches --only=${ONLY}. Known: ${SECTIONS.map((s) => s.id).join(', ')}`);
    process.exit(1);
  }
  console.log(`Creating section experiences on ${CMA}${APPLY ? '' : ' — DRY RUN'}`);
  const t = APPLY ? await getToken() : null;
  for (const s of wanted) await create(t, s);
  console.log(APPLY ? '\nDone.' : '\nDry run — re-run with --apply.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
