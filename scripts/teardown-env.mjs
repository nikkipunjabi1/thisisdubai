// teardown-env.mjs — DELETE ALL CONTENT ITEMS from a throwaway CMS instance, via the CMA.
//
// Purpose: we stand up a SECOND Optimizely SaaS instance to demonstrate a real
// Dev -> UAT -> Production promotion. This is the clean-up half: when the demo is over,
// wipe that instance so nothing is left behind.
//
//   npm run teardown:env -- --env=uat                       # DRY RUN — list what would be deleted
//   npm run teardown:env -- --env=uat --confirm-host=<host> --apply
//
// Then delete the content TYPES with the CLI's own destructive command:
//   node --env-file=.env.uat ./node_modules/@optimizely/cms-cli/bin/run.js danger delete-all-content-types
// (Types cannot be removed while instances of them still exist, so CONTENT GOES FIRST.)
//
// ─────────────────────────────────────────────────────────────────────────────
// SAFETY. This deletes content irreversibly. Four independent guards, all must pass:
//   1. DRY RUN BY DEFAULT — nothing is deleted without `--apply`.
//   2. EXPLICIT ENV FILE  — `--env=uat` reads `.env.uat`. It will NOT read the default
//      `.env`, so the primary instance cannot be targeted by forgetting a flag.
//   3. HOST CONFIRMATION  — you must pass `--confirm-host=<the instance host>` and it must
//      match the host in that env file. Copy/pasting the wrong env file therefore fails.
//   4. PROTECTED-HOST DENYLIST — if the target host matches the host in the default `.env`
//      (the primary instance), the script refuses outright, even with every other flag.
//
// Deletion order is DEEPEST-PATH-FIRST so children go before their parents (the CMA
// refuses to delete a container that still has children).
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const ENV_NAME = (args.find((a) => a.startsWith('--env=')) ?? '').slice(6);
const CONFIRM_HOST = (args.find((a) => a.startsWith('--confirm-host=')) ?? '').slice(15);

if (!ENV_NAME) {
  console.error('✖ Refusing to run without --env=<name>. Example: --env=uat (reads .env.uat)');
  process.exit(1);
}

/** Minimal .env parser — we deliberately read the file ourselves rather than --env-file, so the
 *  script can compare the TARGET env against the DEFAULT env and refuse to nuke the primary. */
function readEnvFile(path) {
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    return null;
  }
  const out = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    out[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
  return out;
}

const hostOf = (env) => {
  const url = env?.OPTIMIZELY_CMS_URL || env?.OPTIMIZELY_CMS_API_URL || '';
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
};

const envPath = `.env.${ENV_NAME}`;
const target = readEnvFile(envPath);
if (!target) {
  console.error(`✖ Could not read ${envPath}. Create it with the throwaway instance's credentials.`);
  process.exit(1);
}

const targetHost = hostOf(target);
if (!targetHost) {
  console.error(`✖ ${envPath} has no usable OPTIMIZELY_CMS_URL.`);
  process.exit(1);
}

// Guard 4: never the primary instance.
const primaryHost = hostOf(readEnvFile('.env'));
if (primaryHost && primaryHost === targetHost) {
  console.error(
    `✖ REFUSING: ${envPath} points at ${targetHost}, which is the SAME host as the default .env\n` +
      `  (the primary instance). Teardown is only for a throwaway environment.`,
  );
  process.exit(1);
}

// Guard 3: host confirmation.
if (APPLY && CONFIRM_HOST !== targetHost) {
  console.error(
    `✖ REFUSING: --confirm-host did not match.\n` +
      `  target host : ${targetHost}\n` +
      `  you passed  : ${CONFIRM_HOST || '(nothing)'}\n` +
      `  Re-run with --confirm-host=${targetHost} if you really mean to wipe it.`,
  );
  process.exit(1);
}

const CMA = (target.OPTIMIZELY_CMS_API_URL || 'https://api.cms.optimizely.com').replace(/\/$/, '');
const CLIENT_ID = target.OPTIMIZELY_CMS_CLIENT_ID;
const CLIENT_SECRET = target.OPTIMIZELY_CMS_CLIENT_SECRET;
const GRAPH_GATEWAY = (target.OPTIMIZELY_GRAPH_GATEWAY || '').replace(/\/$/, '');
const GRAPH_KEY = target.OPTIMIZELY_GRAPH_SINGLE_KEY;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(`✖ ${envPath} is missing OPTIMIZELY_CMS_CLIENT_ID / OPTIMIZELY_CMS_CLIENT_SECRET.`);
  process.exit(1);
}
if (!GRAPH_GATEWAY || !GRAPH_KEY) {
  console.error(`✖ ${envPath} is missing OPTIMIZELY_GRAPH_GATEWAY / OPTIMIZELY_GRAPH_SINGLE_KEY.`);
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getToken() {
  const res = await fetch(`${CMA}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
  });
  if (!res.ok) throw new Error(`Token request failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

async function api(token, method, path, attempt = 1) {
  const res = await fetch(`${CMA}/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (res.status === 429 && attempt <= 6) {
    await sleep(1500 * attempt);
    return api(token, method, path, attempt + 1);
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

/** Every content item on the target instance, with its path depth (for delete ordering). */
async function discover() {
  const url = `${new URL('/content/v2', GRAPH_GATEWAY).href}?auth=${GRAPH_KEY}`;
  const query = `query($skip:Int!){ _Content(limit:100, skip:$skip){ total items { _metadata { key displayName types url { default } } } } }`;
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
      const path = m.url?.default ?? '';
      byKey.set(m.key, {
        key: m.key,
        label: m.displayName ?? m.key,
        type: (m.types ?? []).find((x) => !x.startsWith('_')) ?? '?',
        depth: path.split('/').filter(Boolean).length,
      });
    }
    skip += 100;
    if (items.length === 0) break;
  }
  // Deepest first so children are removed before their containers.
  return [...byKey.values()].sort((a, b) => b.depth - a.depth);
}

async function main() {
  console.log(
    `Teardown CONTENT on "${ENV_NAME}"\n` +
      `  CMS host : ${targetHost}\n` +
      `  CMA      : ${CMA}\n` +
      `  mode     : ${APPLY ? '*** APPLY (deleting) ***' : 'DRY RUN'}\n`,
  );

  const items = await discover();
  console.log(`${items.length} content items found (deepest path first)\n`);

  if (!APPLY) {
    for (const i of items) console.log(`  - ${String(i.type).padEnd(18)} ${i.label}`);
    console.log(
      `\nDRY RUN — nothing deleted.\nTo really wipe it:\n` +
        `  npm run teardown:env -- --env=${ENV_NAME} --confirm-host=${targetHost} --apply\n` +
        `Then remove the content TYPES:\n` +
        `  node --env-file=${envPath} ./node_modules/@optimizely/cms-cli/bin/run.js danger delete-all-content-types`,
    );
    return;
  }

  const token = await getToken();
  let deleted = 0;
  let failed = 0;
  for (const i of items) {
    const r = await api(token, 'DELETE', `/content/${i.key}`);
    const ok = r.status === 200 || r.status === 204 || r.status === 404; // 404 = already gone
    if (ok) {
      deleted += 1;
      console.log(`  ✔ deleted ${String(i.type).padEnd(18)} ${i.label}`);
    } else {
      failed += 1;
      console.log(`  ✖ ${String(i.type).padEnd(18)} ${i.label} — ${r.status}: ${JSON.stringify(r.json).slice(0, 140)}`);
    }
    await sleep(100);
  }

  console.log(`\nDeleted: ${deleted}${failed ? ` · FAILED: ${failed}` : ''}`);
  console.log(
    `\nNow remove the content TYPES:\n` +
      `  node --env-file=${envPath} ./node_modules/@optimizely/cms-cli/bin/run.js danger delete-all-content-types`,
  );
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
