// FINAL step of the article re-model: delete the legacy `_page` `Article` instances (now
// replaced by `ArticlePost` shared blocks) and then the `Article` content type. Articles
// have already moved to blocks + a dedicated route — nothing links to the old pages.
//
//   node --env-file=.env scripts/retire-legacy-articles.mjs          # DRY RUN — list what would be deleted
//   node --env-file=.env scripts/retire-legacy-articles.mjs --apply  # delete instances, then the type
//
// After this runs clean, remove `ArticleContentType` from src/components/content/Article.tsx
// and the two registries in src/app/layout.tsx, then `npm run opti-push`.

const CMA = (process.env.OPTIMIZELY_CMS_API_URL || 'https://api.cms.optimizely.com').replace(/\/$/, '');
const CLIENT_ID = process.env.OPTIMIZELY_CMS_CLIENT_ID;
const CLIENT_SECRET = process.env.OPTIMIZELY_CMS_CLIENT_SECRET;
const GRAPH = (process.env.OPTIMIZELY_GRAPH_GATEWAY || 'https://cg.optimizely.com/content/v2').replace(/\/$/, '');
const GRAPH_KEY = process.env.OPTIMIZELY_GRAPH_SINGLE_KEY;
const APPLY = process.argv.includes('--apply');

if (!CLIENT_ID || !CLIENT_SECRET) { console.error('✖ Missing OPTIMIZELY_CMS_CLIENT_ID / SECRET.'); process.exit(1); }
if (!GRAPH_KEY) { console.error('✖ Missing OPTIMIZELY_GRAPH_SINGLE_KEY.'); process.exit(1); }

async function token() {
  const r = await fetch(`${CMA}/oauth/token`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET }) });
  if (!r.ok) throw new Error(`token ${r.status}`);
  return (await r.json()).access_token;
}
async function del(t, path) {
  const r = await fetch(`${CMA}/v1${path}`, { method: 'DELETE', headers: { Authorization: `Bearer ${t}` } });
  return r.status;
}
async function graph(query) {
  const r = await fetch(`${GRAPH}?auth=${GRAPH_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
  return (await r.json())?.data;
}

(async () => {
  // Enumerate the legacy `_page` Article instances (the go-forward type is `ArticlePost`).
  const d = await graph(`{ Article(limit: 100) { items { _metadata { key displayName } } } }`);
  const items = d?.Article?.items ?? [];
  console.log(`Legacy _page Article instances found: ${items.length}${APPLY ? '' : '  — DRY RUN'}`);
  for (const it of items) console.log(`  ${it._metadata.displayName}  (${it._metadata.key})`);

  if (!APPLY) {
    console.log('\nRe-run with --apply to delete these instances, then the `Article` content type.');
    return;
  }

  const t = await token();
  for (const it of items) {
    console.log(`  DELETE ${it._metadata.displayName} → ${await del(t, `/content/${it._metadata.key}`)}`);
  }
  // The type can only be deleted once it has no (non-trashed) instances. May 409 briefly
  // while the deletes above are still trash-pinned — harmless, re-run later if so.
  console.log(`\nDELETE contenttype Article → ${await del(t, '/contenttypes/Article')} (409 = still trash-pinned; re-run later)`);
})().catch((e) => { console.error(e); process.exit(1); });
