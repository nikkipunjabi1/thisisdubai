// Generates the CMP upload manifest from the seed data.
//
//   npm run asset-manifest            → rewrite docs/ASSET-MANIFEST.md
//   npm run asset-manifest -- --paths → print bare folder paths (one per line)
//
// WHY THIS EXISTS: scripts/attach-assets.mjs joins a CMP folder to a CMS item by
// comparing the folder's LAST SEGMENT to the item's display name. So the folder
// names have to match the seed data exactly, or every item degrades to a guessed
// match. Rather than maintain that list by hand, we derive it — the manifest can
// never drift from the content.
//
// Feed `--paths` to mkdir if you want to build the tree locally before uploading:
//   npm run asset-manifest -- --paths | xargs -d '\n' -I{} mkdir -p "cmp-upload{}"

import { writeFileSync } from 'node:fs';
import { areas } from './data/areas.mjs';
import { tags } from './data/tags.mjs';
import { tagKey } from './data/_helpers.mjs';
import { pois } from './data/pois/index.mjs';
import { events } from './data/events.mjs';
import { articles } from './data/articles/index.mjs';

const ROOT = process.env.CMP_ROOT_FOLDER || 'This is Dubai';

/**
 * The CMS image field each type carries. POIs and Events take a LIST (`images`),
 * Areas a single reference (`heroImage`); every routable type also has `ogImage`
 * from the SeoMetadata contract, which attach-assets fills from the same folder.
 */
const GROUPS = [
  { section: 'Places To Visit', field: 'Images (list) + Social share image', items: pois, kind: 'PointOfInterest' },
  { section: 'Neighbourhoods', field: 'Hero image + Social share image', items: areas, kind: 'Area' },
  { section: 'Events', field: 'Images (list) + Social share image', items: events, kind: 'Event' },
  { section: 'Articles', field: 'Hero image + Social share image', items: articles, kind: 'Article' },
];

// Landing pages and the home page aren't in the seed data (they're Visual Builder
// experiences created by migrate-experiences.mjs) but they DO carry ogImage, so they
// need folders too.
const LANDING = [
  { section: '', name: 'Homepage', note: 'Home experience — hero + social share image' },
  { section: '', name: 'Places to Visit', note: 'Section landing page — social share image' },
  { section: '', name: 'Neighbourhoods', note: 'Section landing page — social share image' },
  { section: '', name: 'Events', note: 'Section landing page — social share image' },
  { section: '', name: 'Articles', note: 'Section landing page — social share image' },
];

const folderFor = (section, name) => `/${ROOT}${section ? `/${section}` : ''}/${name}`;

const allPaths = [
  ...LANDING.map((l) => folderFor(l.section, l.name)),
  ...GROUPS.flatMap((g) => g.items.map((i) => folderFor(g.section, i.displayName))),
];

if (process.argv.includes('--paths')) {
  console.log(allPaths.join('\n'));
  process.exit(0);
}

// Tag slugs are stored as reference URIs; recover the readable slug for the hint column.
const TAG_BY_KEY = new Map(tags.map((t) => [tagKey(t.slug), t.slug]));
const tagSlugs = (item) =>
  (item.props.tags?.value ?? [])
    .map((ref) => TAG_BY_KEY.get(String(ref).replace('cms://content/', '')))
    .filter(Boolean);

const table = (group) => {
  const rows = group.items.map((item, i) => {
    const hint = tagSlugs(item).join(', ') || '—';
    return `| ${i + 1} | \`${folderFor(group.section, item.displayName)}\` | ${item.displayName} | ${hint} |`;
  });
  return [
    `### ${group.section} — ${group.items.length} folders`,
    '',
    `Field(s) filled: **${group.field}**`,
    '',
    '| # | CMP folder | CMS item | Subject hints (tags) |',
    '|---|------------|----------|----------------------|',
    ...rows,
    '',
  ].join('\n');
};

const doc = `<!-- GENERATED FILE — do not edit by hand.
     Regenerate with: npm run asset-manifest
     Source of truth: scripts/data/ -->

# CMP Asset Upload Manifest

_Auto-generated from \`scripts/data/\`. **Create these folders in CMP and drop at least one
image in each.** Then run \`npm run attach-assets -- --apply\` and every image field on every
item is filled._

**Total folders: ${allPaths.length}** — ${LANDING.length} landing pages · ${GROUPS.map((g) => `${g.items.length} ${g.section.toLowerCase()}`).join(' · ')}

## The rule that matters

\`attach-assets.mjs\` matches a CMP folder to a CMS item by comparing the folder's **last
path segment** to the item's **display name** (case, punctuation and leading articles are
ignored, then a ≥60% token-overlap fuzzy pass, then a guess). Filenames inside the folder are
irrelevant — put \`whatever-1.jpg\` in there if you like. Where a folder holds several images
the lowest numeric suffix wins, so re-runs are stable.

So: **name the folder after the item, not after the photo.**

## Specs

Landscape, **≥ 2000px wide**, JPEG, **under 1 MB** (Graph times out on larger items — see
docs/OPTIMIZELY-RESEARCH.md §B). Cards crop to 4:3 and detail heroes to 21:9, so keep the
subject centred and away from the edges.

## Legal hygiene — read before sourcing

Royalty-free only: **Unsplash or Pexels**. No official tourism-authority photography, no
trademarked logos, and nothing whose subject is primarily a brand mark. Photographs *of real
places* are fine and used descriptively. Record each credit in ASSETS.md. See ASSETS.md
§"Legal hygiene" for the full rule — it is non-negotiable for this repo.

---

### Landing pages — ${LANDING.length} folders

| # | CMP folder | Purpose |
|---|------------|---------|
${LANDING.map((l, i) => `| ${i + 1} | \`${folderFor(l.section, l.name)}\` | ${l.note} |`).join('\n')}

${GROUPS.map(table).join('\n')}---

_Regenerate after any change to \`scripts/data/\`: \`npm run asset-manifest\`._
`;

writeFileSync(new URL('../docs/ASSET-MANIFEST.md', import.meta.url), doc);
console.log(`✔ docs/ASSET-MANIFEST.md — ${allPaths.length} CMP folders`);
