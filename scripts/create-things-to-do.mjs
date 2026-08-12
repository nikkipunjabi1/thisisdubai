// Seeds the "Things to Do" Visual Builder campaign: a landing page plus four themed
// sub-pages, each as a ThingsToDoPage `_experience` with a starter canvas (a video Hero
// that carries the page's single <h1>, then Curated Content Rails), and a handful of
// reusable HighlightCard shared blocks under "For This Application".
//
//   npm run create-things-to-do                 # DRY RUN — print exactly what would happen
//   npm run create-things-to-do -- --apply      # create everything missing, then publish
//   npm run create-things-to-do -- --apply --only=landing
//   npm run create-things-to-do -- --apply --only=highlights
//
// Modelled on scripts/create-section.mjs. Idempotent: an existing key returns 409 and is
// left alone, so re-running never duplicates or overwrites author edits.
//
// PREREQUISITE: the content types must be pushed first (`npm run opti-push`), including the
// ThingsToDoPage `mayContainTypes: ['ThingsToDoPage']` change that lets the sub-pages nest
// under the landing page (which is what gives them their `/things-to-do/<segment>` URLs).
//
// After running, authors finish the pages in Visual Builder: paste a real YouTube ID into
// each Hero (video is left empty here on purpose), drop the HighlightCards onto the landing
// page, set poster imagery (TTD-3), and reorder. The seeded canvas is a starting point.

import { createHash, randomUUID } from 'node:crypto';

const CMA = (process.env.OPTIMIZELY_CMS_API_URL || 'https://api.cms.optimizely.com').replace(/\/$/, '');
const CLIENT_ID = process.env.OPTIMIZELY_CMS_CLIENT_ID;
const CLIENT_SECRET = process.env.OPTIMIZELY_CMS_CLIENT_SECRET;
const HOME = process.env.SEED_HOME || '71792f1b444e4d6d9a77c41c47c4cf7e';
const SITE_ASSETS = process.env.SEED_SHARED || '8ce609ddb1984b04a99c5764a540d313'; // "For This Application" root
const LOCALE = process.env.SEED_LOCALE || 'en';

const APPLY = process.argv.includes('--apply');
const ONLY = process.argv.find((a) => a.startsWith('--only='))?.slice(7);

// Outcome tally, so a failed create can never be mistaken for a successful run (an inline
// ✖ line is easy to miss in a long log — the summary + non-zero exit make it unambiguous).
const tally = { created: 0, exists: 0, failed: 0 };
const failures = [];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('✖ Missing OPTIMIZELY_CMS_CLIENT_ID / OPTIMIZELY_CMS_CLIENT_SECRET.');
  process.exit(1);
}

const md5 = (s) => createHash('md5').update(s).digest('hex');
const pageKey = (id) => md5(`ttd:${id}`);
const cardKey = (id) => md5(`ttdcard:${id}`);
const tagRef = (slug) => `cms://content/${md5(`tagblock:${slug}`)}`; // Tag shared-block key
// A composition node id must be a UUID; derive it from the content key + index so a re-run
// yields a stable canvas rather than a fresh one each time.
const asUuid = (k) => `${k.slice(0, 8)}-${k.slice(8, 12)}-${k.slice(12, 16)}-${k.slice(16, 20)}-${k.slice(20)}`;
const nodeId = (key, i) => asUuid(md5(`${key}:node:${i}`));
const V = (value) => ({ value });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Layout display settings for a canvas node (Light/Dark, Contained/Full, spacing).
const layout = (width = 'contained', theme = 'inherit', spacing = 'normal') => ({
  displayTemplate: 'LayoutDisplayTemplate',
  settings: { theme, width, spacing },
});

// ── The campaign ────────────────────────────────────────────────────────────────────────
// Each page: a Hero (H1 + standfirst, video left empty for the author) then rails. A rail's
// `tag` is a slug from scripts/data/tags.mjs; `source: 'tag'` filters to it, 'latest' ignores
// it. Rails render <h2>, the Hero renders the only <h1>, so every page keeps a single H1.

const PAGES = [
  {
    id: 'landing',
    seg: 'things-to-do',
    parent: 'home',
    hero: {
      eyebrow: 'This is Dubai',
      heading: 'Things to Do in Dubai',
      standfirst: 'From record-breaking landmarks to quiet corners of the old city, here is how to spend your time.',
    },
    metaTitle: 'Things to Do in Dubai',
    metaDescription:
      'Ideas for your trip to Dubai: the top places to visit, upcoming events and the latest stories, all in one place.',
    rails: [
      { heading: 'Top places to visit', collection: 'places', source: 'latest', count: 4, ctaLabel: 'See all places', ctaUrl: '/places-to-visit' },
      { heading: 'Upcoming events', collection: 'events', source: 'latest', count: 4, ctaLabel: 'See all events', ctaUrl: '/events' },
      { heading: 'Latest stories', collection: 'articles', source: 'latest', count: 4, ctaLabel: 'Read more', ctaUrl: '/articles' },
    ],
  },
  {
    id: 'new-and-trending',
    seg: 'new-and-trending',
    parent: 'landing',
    hero: {
      eyebrow: 'Things to Do',
      heading: 'New & Trending',
      standfirst: 'The latest openings, attractions and events drawing crowds across the city right now.',
    },
    metaTitle: 'New & Trending in Dubai',
    metaDescription: 'The newest and most talked-about places and events in Dubai right now.',
    rails: [
      { heading: 'New places to visit', collection: 'places', source: 'latest', count: 6, ctaLabel: 'See all places', ctaUrl: '/places-to-visit' },
      { heading: "What's on now", collection: 'events', source: 'latest', count: 6, ctaLabel: 'See all events', ctaUrl: '/events' },
    ],
  },
  {
    id: 'dubai-attractions',
    seg: 'dubai-attractions',
    parent: 'landing',
    hero: {
      eyebrow: 'Things to Do',
      heading: 'Dubai Attractions',
      standfirst: 'The icons you came to see, and a few you did not know about.',
    },
    metaTitle: 'Dubai Attractions',
    metaDescription: 'Iconic Dubai landmarks and must-see attractions, from record-breaking towers to the best viewpoints.',
    rails: [
      { heading: 'Iconic landmarks', collection: 'places', source: 'tag', tag: 'landmarks', count: 8, ctaLabel: 'See all places', ctaUrl: '/places-to-visit' },
      { heading: 'Best views', collection: 'places', source: 'tag', tag: 'views', count: 4 },
    ],
  },
  {
    id: 'arts-and-culture',
    seg: 'arts-and-culture',
    parent: 'landing',
    hero: {
      eyebrow: 'Things to Do',
      heading: 'Arts & Culture',
      standfirst: "Museums, galleries, heritage districts and the city's creative scene.",
    },
    metaTitle: 'Arts & Culture in Dubai',
    metaDescription: 'Museums, galleries, heritage districts and creative spaces across Dubai.',
    rails: [
      { heading: 'Art & design', collection: 'places', source: 'tag', tag: 'art-design', count: 6 },
      { heading: 'Culture & heritage', collection: 'places', source: 'tag', tag: 'culture-heritage', count: 6, ctaLabel: 'See all places', ctaUrl: '/places-to-visit' },
    ],
  },
  {
    id: 'wellness-in-dubai',
    seg: 'wellness-in-dubai',
    parent: 'landing',
    hero: {
      eyebrow: 'Things to Do',
      heading: 'Wellness in Dubai',
      standfirst: 'Spas, retreats and slower days to reset.',
    },
    metaTitle: 'Wellness in Dubai',
    metaDescription: 'Spas, retreats and wellness experiences for a slower, calmer side of Dubai.',
    rails: [
      { heading: 'Wellness & spas', collection: 'places', source: 'tag', tag: 'wellness', count: 6, ctaLabel: 'See all places', ctaUrl: '/places-to-visit' },
    ],
  },
];

const HIGHLIGHTS = [
  { id: 'plan-48-hours', eyebrow: 'Plan', title: 'Your first 48 hours', body: 'A simple two-day plan covering the landmarks, the old city and one desert escape.', ctaLabel: 'Read the guide', ctaUrl: '/articles' },
  { id: 'getting-around', eyebrow: 'Practical', title: 'Getting around Dubai', body: 'Metro, taxis, water buses and when to just walk. What to use and when.', ctaLabel: 'See how', ctaUrl: '/articles' },
  { id: 'with-kids', eyebrow: 'For families', title: 'Dubai with kids', body: 'Waterparks, aquariums and easy wins that keep everyone happy.', ctaLabel: 'Explore', ctaUrl: '/things-to-do' },
];

// ── CMA plumbing (identical shape to scripts/create-section.mjs) ──────────────────────────
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

// ── Composition + create ──────────────────────────────────────────────────────────────────
function heroNode(page, key) {
  return {
    id: nodeId(key, 0),
    displayName: 'Video Hero',
    nodeType: 'component',
    displaySettings: layout('full', 'inherit', 'normal'),
    component: {
      contentType: 'ThingsToDoHero',
      properties: {
        eyebrow: V(page.hero.eyebrow),
        heading: V(page.hero.heading), // the page's single <h1>
        standfirst: V(page.hero.standfirst),
        showVideo: V(true), // video ON, but youtubeId left empty — the author pastes a real ID in VB
      },
    },
  };
}

function railNode(rail, key, i) {
  const props = {
    heading: V(rail.heading),
    collection: V(rail.collection),
    source: V(rail.source),
    count: V(rail.count),
  };
  if (rail.intro) props.intro = V(rail.intro);
  if (rail.source === 'tag' && rail.tag) props.tag = V(tagRef(rail.tag));
  if (rail.ctaLabel) props.ctaLabel = V(rail.ctaLabel);
  if (rail.ctaUrl) props.ctaUrl = V(rail.ctaUrl);
  return {
    id: nodeId(key, i + 1),
    displayName: rail.heading,
    nodeType: 'component',
    displaySettings: layout('contained', 'inherit', 'normal'),
    component: { contentType: 'CuratedContentRail', properties: props },
  };
}

function buildComposition(page, key) {
  return {
    id: asUuid(key),
    displayName: page.hero.heading,
    nodeType: 'experience',
    layoutType: 'outline',
    nodes: [heroNode(page, key), ...page.rails.map((r, i) => railNode(r, key, i))],
  };
}

async function createPage(t, page, containerKey) {
  const key = pageKey(page.id);
  const url = page.parent === 'home' ? `/${page.seg}` : `/things-to-do/${page.seg}`;
  console.log(`\n=== ${page.hero.heading}  (${url}) ===`);
  console.log(`  key ${key}  ·  hero H1 + ${page.rails.length} rail(s): ${page.rails.map((r) => `${r.collection}/${r.source}${r.tag ? `:${r.tag}` : ''}`).join(', ')}`);

  if (!APPLY) {
    console.log('  · dry run — would create under ' + (page.parent === 'home' ? 'Home' : 'the landing page') + ' and publish');
    return key;
  }

  const body = {
    key,
    contentType: 'ThingsToDoPage',
    container: containerKey,
    initialVersion: {
      locale: LOCALE,
      displayName: page.hero.heading,
      routeSegment: page.seg,
      composition: buildComposition(page, key),
      properties: {
        internalTitle: V(page.hero.heading),
        metaTitle: V(page.metaTitle),
        metaDescription: V(page.metaDescription),
      },
    },
  };

  const r = await api(t, 'POST', '/content', body);
  if (r.status === 201) {
    console.log(`  ✔ created — ${await publishLatest(t, key)}`);
    tally.created++;
  } else if (r.status === 409) {
    console.log('  = already exists (left alone)');
    tally.exists++;
  } else {
    console.log(`  ✖ create ${r.status}: ${JSON.stringify(r.json).slice(0, 400)}`);
    failures.push(`${page.hero.heading} (${url}) — HTTP ${r.status}`);
    tally.failed++;
    process.exitCode = 1;
  }
  return key;
}

async function createHighlight(t, card) {
  const key = cardKey(card.id);
  console.log(`\n--- Highlight card: ${card.title} ---`);
  console.log(`  key ${key}  ·  under "For This Application"`);

  if (!APPLY) {
    console.log('  · dry run — would create the shared block and publish');
    return;
  }

  const body = {
    key,
    contentType: 'HighlightCard',
    container: SITE_ASSETS,
    initialVersion: {
      locale: LOCALE,
      displayName: card.title,
      properties: {
        eyebrow: V(card.eyebrow),
        title: V(card.title),
        body: V(card.body),
        ctaLabel: V(card.ctaLabel),
        ctaUrl: V(card.ctaUrl),
      },
    },
  };

  const r = await api(t, 'POST', '/content', body);
  if (r.status === 201) {
    console.log(`  ✔ created — ${await publishLatest(t, key)}`);
    tally.created++;
  } else if (r.status === 409) {
    console.log('  = already exists (left alone)');
    tally.exists++;
  } else {
    console.log(`  ✖ create ${r.status}: ${JSON.stringify(r.json).slice(0, 400)}`);
    failures.push(`Highlight card "${card.title}" — HTTP ${r.status}`);
    tally.failed++;
    process.exitCode = 1;
  }
}

(async () => {
  const doPages = !ONLY || ONLY !== 'highlights';
  const doCards = !ONLY || ONLY === 'highlights';
  const wantedPages = ONLY && ONLY !== 'highlights' ? PAGES.filter((p) => p.id === ONLY) : PAGES;

  if (doPages && ONLY && ONLY !== 'highlights' && wantedPages.length === 0) {
    console.error(`✖ no page matches --only=${ONLY}. Known: ${PAGES.map((p) => p.id).join(', ')}, highlights`);
    process.exit(1);
  }

  console.log(`Creating the Things to Do campaign on ${CMA}${APPLY ? '' : ' — DRY RUN'}`);
  const t = APPLY ? await getToken() : null;

  // The landing page must exist before its sub-pages (it is their container). Always create
  // it first when the landing is in scope; a filtered sub-page run assumes it already exists.
  if (doPages) {
    const landing = wantedPages.find((p) => p.parent === 'home');
    const landingKey = landing ? await createPage(t, landing, HOME) : pageKey('landing');
    for (const page of wantedPages.filter((p) => p.parent !== 'home')) {
      await createPage(t, page, landingKey);
    }
  }

  if (doCards) {
    for (const card of HIGHLIGHTS) await createHighlight(t, card);
  }

  if (!APPLY) {
    console.log('\nDry run — re-run with --apply to write.');
    return;
  }

  console.log(`\n──────── Summary ────────`);
  console.log(`  created: ${tally.created}   already existed: ${tally.exists}   failed: ${tally.failed}`);
  if (failures.length) {
    console.log('\n✖ SOME ITEMS FAILED — the campaign is NOT fully created:');
    for (const f of failures) console.log(`    • ${f}`);
    console.log('\nFix the cause above, then re-run (idempotent — created items are left alone).');
  } else {
    console.log('\n✔ All done. Compose/refine the pages in Visual Builder next.');
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
