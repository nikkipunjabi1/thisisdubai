// Tidy the CMS "For This Application" shared-block tree so it follows Optimizely
// CMS best practice: shared blocks grouped into named folders, not dumped flat.
//
//   node --env-file=.env scripts/organize-shared-blocks.mjs            # reparent tags → "Tag - Taxonomy"
//   node --env-file=.env scripts/organize-shared-blocks.mjs --prune    # also delete the duplicate empty "2026" article folder
//
// Idempotent: a block already in the target folder is skipped. The prune step
// GUARDS against the past cascade-delete incident — it re-checks the folder is
// empty via Graph immediately before DELETE and aborts if anything is inside.

const CMA = (process.env.OPTIMIZELY_CMS_API_URL || 'https://api.cms.optimizely.com').replace(/\/$/, '');
const CLIENT_ID = process.env.OPTIMIZELY_CMS_CLIENT_ID;
const CLIENT_SECRET = process.env.OPTIMIZELY_CMS_CLIENT_SECRET;
const GRAPH = (process.env.OPTIMIZELY_GRAPH_GATEWAY || 'https://cg.optimizely.com/content/v2').replace(/\/$/, '');
const GRAPH_KEY = process.env.OPTIMIZELY_GRAPH_SINGLE_KEY;

// Live container keys (from scripts/inspect-tree.mjs).
const SITE_ASSETS = '8ce609ddb1984b04a99c5764a540d313';       // "For This Application" root
const TAG_TAXONOMY = '1064637c853e49519f4d5ebf29d227df';      // "Tag - Taxonomy" folder
const SITE_CONFIG_FOLDER = 'b534fa989cac4c87a8266a1b2622e1ac'; // "Site Configurations" folder (sibling of Tag - Taxonomy)
const DUP_YEAR_FOLDER = '168abba79be86960e3c6db7e147722de';   // stray empty "2026" (canonical is 0523741f…)

const PRUNE = process.argv.includes('--prune');

if (!CLIENT_ID || !CLIENT_SECRET) { console.error('✖ Missing OPTIMIZELY_CMS_CLIENT_ID / SECRET.'); process.exit(1); }
if (!GRAPH_KEY) { console.error('✖ Missing OPTIMIZELY_GRAPH_SINGLE_KEY.'); process.exit(1); }

async function token() {
  const r = await fetch(`${CMA}/oauth/token`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET }) });
  if (!r.ok) throw new Error(`token ${r.status}`);
  return (await r.json()).access_token;
}
async function api(t, m, p, b, extra = {}) {
  const r = await fetch(`${CMA}/v1${p}`, { method: m, headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', ...extra }, body: b === undefined ? undefined : JSON.stringify(b) });
  const txt = await r.text(); let j = null; try { j = txt ? JSON.parse(txt) : null; } catch { j = txt; }
  return { status: r.status, json: j };
}
async function graph(query) {
  const r = await fetch(`${GRAPH}?auth=${GRAPH_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
  const j = await r.json();
  if (j.errors) throw new Error('Graph error: ' + JSON.stringify(j.errors).slice(0, 300));
  return j.data;
}
const childrenOf = (container) => graph(`{ _Content(where: { _metadata: { container: { eq: "${container}" } } }, limit: 100) { items { _metadata { key displayName container } } } }`);

async function publishLatest(t, key) {
  const v = await api(t, 'GET', `/content/${key}/versions`);
  const ver = v.json?.items?.[0]?.version;
  if (!ver) return 'no-version';
  const p = await api(t, 'POST', `/content/${key}/versions/${ver}:publish`, {});
  return p.status === 204 || p.status === 200 ? 'published' : `publish ${p.status}`;
}

(async () => {
  const t = await token();

  // 0) Folders must stay direct children of the shared-assets root (siblings), never
  //    nested inside each other. Unconditional PATCH → root (idempotent; dodges Graph lag).
  for (const [label, folder] of [['Site Configurations', SITE_CONFIG_FOLDER], ['Tag - Taxonomy', TAG_TAXONOMY]]) {
    const patch = await api(t, 'PATCH', `/content/${folder}`, { container: SITE_ASSETS }, { 'Content-Type': 'application/merge-patch+json' });
    console.log(`Folder "${label}" → pinned under shared-assets root (PATCH ${patch.status})`);
  }

  // 1) Reparent every TagTerm block sitting flat in the shared-assets root into the Tag - Taxonomy folder.
  //    Only `_component` taxonomy blocks — NEVER folders (they are containers, not content).
  const flat = (await childrenOf(SITE_ASSETS))?._Content?.items ?? [];
  const tagsMeta = (await graph(`{ TagTerm(limit: 100) { items { _metadata { key displayName container } } } }`))?.TagTerm?.items ?? [];
  const flatKeys = new Set(flat.map((i) => i._metadata.key));
  const tags = tagsMeta.filter((i) => flatKeys.has(i._metadata.key)); // only tags still flat in the root
  console.log(`\nReparenting ${tags.length} TagTerm block(s) → Tag - Taxonomy (${TAG_TAXONOMY})`);
  for (const it of tags) {
    const key = it._metadata.key;
    const patch = await api(t, 'PATCH', `/content/${key}`, { container: TAG_TAXONOMY }, { 'Content-Type': 'application/merge-patch+json' });
    const pub = patch.status === 200 || patch.status === 204 ? await publishLatest(t, key) : '—';
    console.log(`  ${it._metadata.displayName.padEnd(22)} PATCH ${patch.status}  ${pub}`);
  }

  // 2) Optional prune of the stray empty year folder — GUARDED against cascade delete.
  if (PRUNE) {
    console.log('\nPrune: duplicate "2026" article folder');
    const kids = (await childrenOf(DUP_YEAR_FOLDER))?._Content?.items ?? [];
    if (kids.length > 0) {
      console.log(`  ✖ ABORT — folder has ${kids.length} child(ren); refusing to delete (would cascade). Children:`);
      for (const k of kids) console.log(`      - ${k._metadata.displayName} (${k._metadata.key})`);
    } else {
      const d = await api(t, 'DELETE', `/content/${DUP_YEAR_FOLDER}`);
      console.log(`  DELETE ${DUP_YEAR_FOLDER} → ${d.status} ${d.status >= 400 ? JSON.stringify(d.json).slice(0, 160) : '(empty, removed)'}`);
    }
  } else {
    console.log('\n(skip prune — pass --prune to remove the duplicate empty "2026" folder)');
  }
})().catch((e) => { console.error(e); process.exit(1); });
