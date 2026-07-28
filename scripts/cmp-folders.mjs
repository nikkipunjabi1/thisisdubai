// Creates the CMP folder tree that scripts/attach-assets.mjs matches against.
//
//   npm run cmp-folders             # DRY RUN — show what would be created
//   npm run cmp-folders -- --apply  # create the missing folders
//
// The folder list is derived from the seed data (same source as
// docs/ASSET-MANIFEST.md), so it cannot drift from the content. Idempotent: it
// walks the existing tree first and only creates what is missing, so re-running
// after adding content tops the tree up rather than duplicating it.
//
// CMP API notes (all verified against the live API):
//   - Auth is OAuth client-credentials against
//     https://accounts.cmp.optimizely.com/o/oauth2/v1/token  (note the /v1/).
//   - GET  /v3/folders                          → ROOT folders only.
//   - GET  /v3/folders?parent_folder_id=<id>     → that folder's CHILDREN only.
//     There is no recursive listing; the tree has to be walked level by level.
//   - POST /v3/folders { name, parent_folder_id } → 201, returns { id, path, … }.
//   - DELETE /v3/folders/<id> → 204.

import { areas } from './data/areas.mjs';
import { pois } from './data/pois/index.mjs';
import { events } from './data/events.mjs';
import { articles } from './data/articles/index.mjs';

const BASE = (process.env.CMP_API_URL || 'https://api.cmp.optimizely.com').replace(/\/$/, '');
const TOKEN_URL = 'https://accounts.cmp.optimizely.com/o/oauth2/v1/token';
const ROOT_NAME = process.env.CMP_ROOT_FOLDER || 'This is Dubai';
const APPLY = process.argv.includes('--apply');

if (!process.env.CMP_CLIENT_ID || !process.env.CMP_CLIENT_SECRET) {
  console.error('✖ Missing CMP_CLIENT_ID / CMP_CLIENT_SECRET. See .env.example.');
  process.exit(1);
}

/** The tree we want, as [section, ...leaf names]. A section of '' means directly under root. */
const WANTED = [
  ['', ['Homepage', 'Places to Visit', 'Neighbourhoods', 'Events', 'Articles']],
  ['Places To Visit', pois.map((p) => p.displayName)],
  ['Neighbourhoods', areas.map((a) => a.displayName)],
  ['Events', events.map((e) => e.displayName)],
  ['Articles', articles.map((a) => a.displayName)],
];

let token;
const auth = async () => {
  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: process.env.CMP_CLIENT_ID,
      client_secret: process.env.CMP_CLIENT_SECRET,
    }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`CMP token failed: ${r.status} ${JSON.stringify(j).slice(0, 200)}`);
  token = j.access_token;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, path, body, attempt = 1) {
  const r = await fetch(BASE + path, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (r.status === 429 && attempt <= 5) {
    await sleep(1000 * attempt);
    return api(method, path, body, attempt + 1);
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

/** Children of a folder (or the root listing when parentId is null). Paged. */
async function children(parentId) {
  const out = [];
  let url = parentId ? `/v3/folders?parent_folder_id=${parentId}` : '/v3/folders';
  while (url) {
    const { json } = await api('GET', url);
    out.push(...(json?.data ?? []));
    const next = json?.pagination?.next;
    url = next ? next.replace(BASE, '') : null;
  }
  return out;
}

async function ensure(name, parentId, existing, created) {
  const hit = existing.find((f) => f.name.toLowerCase() === name.toLowerCase());
  if (hit) return hit.id;
  if (!APPLY) {
    created.push(name);
    return null; // nothing to descend into on a dry run
  }
  const { status, json } = await api('POST', '/v3/folders', { name, parent_folder_id: parentId });
  if (status !== 201) {
    console.log(`✖ "${name}" — ${status} ${JSON.stringify(json).slice(0, 160)}`);
    return null;
  }
  created.push(name);
  existing.push(json);
  return json.id;
}

async function main() {
  await auth();
  console.log(`CMP → ${BASE}${APPLY ? '' : '  — DRY RUN (nothing will be created)'}\n`);

  const roots = await children(null);
  let root = roots.find((f) => f.name === ROOT_NAME);
  const created = [];

  if (!root) {
    if (!APPLY) {
      console.log(`· root "${ROOT_NAME}" would be created`);
    } else {
      const { status, json } = await api('POST', '/v3/folders', { name: ROOT_NAME, parent_folder_id: null });
      if (status !== 201) throw new Error(`root create failed: ${status} ${JSON.stringify(json)}`);
      root = json;
      created.push(ROOT_NAME);
    }
  }
  if (!root) {
    console.log('\n(dry run cannot descend without a root — run with --apply)');
    return;
  }
  console.log(`root: ${root.path}  (${root.id})\n`);

  const rootKids = await children(root.id);
  let existingCount = 0;

  for (const [section, leaves] of WANTED) {
    let parentId = root.id;
    let siblings = rootKids;

    if (section) {
      parentId = await ensure(section, root.id, rootKids, created);
      if (!parentId) {
        console.log(`${section.padEnd(18)} → parent missing (dry run); ${leaves.length} child folders pending`);
        continue;
      }
      siblings = await children(parentId);
    }

    const before = created.length;
    for (const leaf of leaves) {
      const had = siblings.some((f) => f.name.toLowerCase() === leaf.toLowerCase());
      if (had) existingCount += 1;
      else await ensure(leaf, parentId, siblings, created);
    }
    const label = section || '(root level)';
    console.log(`${label.padEnd(18)} ${leaves.length} wanted · ${created.length - before} ${APPLY ? 'created' : 'to create'}`);
  }

  console.log(
    `\n${APPLY ? 'Created' : 'Would create'} ${created.length} folder(s); ${existingCount} already existed.`,
  );
  if (!APPLY) console.log('Re-run with --apply to create them.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
