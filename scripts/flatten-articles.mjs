// Flatten Articles: move every Article out of its year `_folder` and directly under
// the Articles experience, so articles are visible + authorable in the SaaS CMS Pages
// tree (the Pages panel is a ROUTING tree — it never renders `_folder`, so bucketed
// articles were unreachable). URLs simplify /articles/<year>/<slug>/ → /articles/<slug>/.
//
//   node --env-file=.env scripts/flatten-articles.mjs            # reparent articles → Articles experience
//   node --env-file=.env scripts/flatten-articles.mjs --prune    # then delete the now-empty year folders (GUARDED)
//
// Idempotent. See docs/CONTENT-ARCHITECTURE.md §10.

import { createHash } from 'node:crypto';

const CMA = (process.env.OPTIMIZELY_CMS_API_URL || 'https://api.cms.optimizely.com').replace(/\/$/, '');
const CLIENT_ID = process.env.OPTIMIZELY_CMS_CLIENT_ID;
const CLIENT_SECRET = process.env.OPTIMIZELY_CMS_CLIENT_SECRET;
const GRAPH = (process.env.OPTIMIZELY_GRAPH_GATEWAY || 'https://cg.optimizely.com/content/v2').replace(/\/$/, '');
const GRAPH_KEY = process.env.OPTIMIZELY_GRAPH_SINGLE_KEY;
const keyFor = (s) => createHash('md5').update(s).digest('hex');

const ARTICLES_KEY = keyFor('articles-exp');                    // the Articles experience
const YEAR_FOLDERS = [                                          // the two stray "2026" folders
  '0523741f1d4bce77c3da3e93a5a87fe7',
  '168abba79be86960e3c6db7e147722de',
];
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
const childrenOf = (c) => graph(`{ _Content(where: { _metadata: { container: { eq: "${c}" } } }, limit: 100) { items { _metadata { key displayName } } } }`);
async function publishLatest(t, key) {
  const v = await api(t, 'GET', `/content/${key}/versions`);
  const ver = v.json?.items?.[0]?.version;
  if (!ver) return 'no-version';
  const p = await api(t, 'POST', `/content/${key}/versions/${ver}:publish`, {});
  return p.status === 204 || p.status === 200 ? 'published' : `publish ${p.status}`;
}

(async () => {
  const t = await token();

  // 1) Reparent every Article directly under the Articles experience.
  const arts = (await graph(`{ Article(limit: 100) { items { title _metadata { key displayName container } } } }`))?.Article?.items ?? [];
  const toMove = arts.filter((a) => a._metadata.container !== ARTICLES_KEY);
  console.log(`Reparenting ${toMove.length}/${arts.length} article(s) → Articles experience (${ARTICLES_KEY})\n`);
  for (const a of toMove) {
    const key = a._metadata.key;
    const patch = await api(t, 'PATCH', `/content/${key}`, { container: ARTICLES_KEY }, { 'Content-Type': 'application/merge-patch+json' });
    const pub = patch.status === 200 || patch.status === 204 ? await publishLatest(t, key) : '—';
    console.log(`  ${(a.title || a._metadata.displayName || '').slice(0, 40).padEnd(42)} PATCH ${patch.status}  ${pub}`);
  }

  // 2) Optional prune of the now-empty year folders — GUARDED against cascade delete.
  if (PRUNE) {
    console.log('\nPrune: empty year folders');
    for (const f of YEAR_FOLDERS) {
      const kids = (await childrenOf(f))?._Content?.items ?? [];
      if (kids.length > 0) {
        console.log(`  ✖ ${f} — ABORT, ${kids.length} child(ren) present; refusing (would cascade).`);
        continue;
      }
      const d = await api(t, 'DELETE', `/content/${f}`);
      console.log(`  DELETE ${f} → ${d.status} ${d.status >= 400 ? JSON.stringify(d.json).slice(0, 140) : '(empty, removed)'}`);
    }
    console.log('\nThen delete the retired type:  DELETE /v1/contenttypes/Folder');
  } else {
    console.log('\n(skip prune — pass --prune to delete the now-empty year folders)');
  }
})().catch((e) => { console.error(e); process.exit(1); });
