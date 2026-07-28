// READ-ONLY inspection: dump the shared-assets ("For This Application") folder tree
// and the Articles content tree, so we can see exactly where TagTerm / SiteConfiguration
// blocks and Article pages currently live (and which folders already exist).
//
// Run: node --env-file=.env scripts/inspect-tree.mjs

// Gateway already includes the /content/v2 path.
const GRAPH = (process.env.OPTIMIZELY_GRAPH_GATEWAY || 'https://cg.optimizely.com/content/v2').replace(/\/$/, '');
const KEY = process.env.OPTIMIZELY_GRAPH_SINGLE_KEY;
const SITE_ASSETS = '8ce609ddb1984b04a99c5764a540d313';

if (!KEY) { console.error('✖ Missing OPTIMIZELY_GRAPH_SINGLE_KEY'); process.exit(1); }

async function gql(query, variables) {
  const r = await fetch(`${GRAPH}?auth=${KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors) console.error('GraphQL errors:', JSON.stringify(j.errors).slice(0, 400));
  return j.data;
}

const META = `_metadata { key displayName container url { default hierarchical } types }`;

(async () => {
  // 1) Everything whose container is the app shared-assets folder (direct children).
  const inAssets = await gql(`{
    _Content(where: { _metadata: { container: { eq: "${SITE_ASSETS}" } } }, limit: 100) {
      items { ${META} }
    }
  }`);
  console.log('\n=== Direct children of shared-assets folder (For This Application) ===');
  for (const it of inAssets?._Content?.items ?? []) {
    console.log(`  [${(it._metadata.types || []).join(',')}] ${it._metadata.displayName}  key=${it._metadata.key}`);
  }

  // 2) All TagTerm blocks — where do they actually sit (container)?
  const tags = await gql(`{ TagTerm(limit: 100) { items { ${META} } } }`);
  console.log('\n=== All TagTerm blocks (container = parent folder key) ===');
  for (const it of tags?.TagTerm?.items ?? []) {
    console.log(`  ${it._metadata.displayName.padEnd(22)} container=${it._metadata.container}`);
  }

  // 3) SiteConfiguration.
  const cfg = await gql(`{ SiteConfiguration(limit: 20) { items { ${META} } } }`);
  console.log('\n=== SiteConfiguration ===');
  for (const it of cfg?.SiteConfiguration?.items ?? []) {
    console.log(`  ${it._metadata.displayName}  container=${it._metadata.container}  key=${it._metadata.key}`);
  }

  // 4) Any _folder instances anywhere (so we can see "Tag - Taxonomy" / "Site Configurations").
  const folders = await gql(`{
    _Content(where: { _metadata: { types: { eq: "_folder" } } }, limit: 100) {
      items { ${META} }
    }
  }`);
  console.log('\n=== All _folder instances ===');
  for (const it of folders?._Content?.items ?? []) {
    console.log(`  ${it._metadata.displayName.padEnd(28)} key=${it._metadata.key}  container=${it._metadata.container}`);
  }

  // 5) Articles — where do they live + their containers (year folders?).
  const articles = await gql(`{ Article(limit: 100) { items { title ${META} } } }`);
  console.log('\n=== Articles (title · container · url) ===');
  for (const it of articles?.Article?.items ?? []) {
    console.log(`  ${(it.title || it._metadata.displayName || '').slice(0, 40).padEnd(42)} container=${it._metadata.container}  url=${it._metadata.url?.hierarchical || it._metadata.url?.default}`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
