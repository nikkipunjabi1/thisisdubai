// verify-content.mjs — READ-ONLY inventory of what is actually PUBLISHED on an instance,
// per locale, via Optimizely Graph. Writes nothing, deletes nothing, touches no CMS state.
//
//   npm run verify:content                       # inventory the primary instance (.env)
//   npm run verify:content:uat                   # inventory the UAT instance (.env.uat)
//   npm run verify:content -- --out=dev.json     # save the inventory as a snapshot
//   npm run verify:content:uat -- --compare=dev.json
//                                                # inventory UAT and diff it against that snapshot
//
// WHY THIS EXISTS
// The point of a content migration is that the target ends up equivalent to the source, and
// "equivalent" is not something you can eyeball across 187 items in two languages. This turns
// the four open questions from docs/ENVIRONMENTS.md into a command:
//
//   1. Did LANGUAGE VARIANTS survive?   → per-locale counts, side by side.
//   2. Did PUBLISH STATE survive?       → Graph only ever returns PUBLISHED content, so an item
//                                         appearing here IS the proof it is published. A draft is
//                                         simply absent. That makes the count the answer.
//   3. Did per-language routeSegment survive?
//                                       → we capture each item's URL per locale and flag any key
//                                         whose EN and AR paths differ once the locale prefix is
//                                         removed. That is exactly the mismatch that produced the
//                                         /ar/... 404s fixed in S3.9.
//   4. (Scope is answered by the import itself, not by this script.)
//
// Run it against DEV before a migration and against UAT after. Same numbers = a clean migration.

const GRAPH_GATEWAY = (process.env.OPTIMIZELY_GRAPH_GATEWAY || '').replace(/\/$/, '');
const GRAPH_KEY = process.env.OPTIMIZELY_GRAPH_SINGLE_KEY;
const LOCALES = ['en', 'ar'];
const FOLDER_TYPES = new Set(['SysContentFolder', '_Folder']);

const args = process.argv.slice(2);
const arg = (name) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const OUT = arg('out');
const COMPARE = arg('compare');

if (!GRAPH_GATEWAY || !GRAPH_KEY) {
  console.error('✖ Missing OPTIMIZELY_GRAPH_GATEWAY / OPTIMIZELY_GRAPH_SINGLE_KEY.');
  console.error('  Use the env-specific script (e.g. npm run verify:content:uat) so the right .env file is loaded.');
  process.exit(1);
}

// GRAPH_GATEWAY may already carry the `/content/v2` path; resolving against its origin
// normalises both `https://host` and `https://host/content/v2` to one endpoint.
const endpoint = `${new URL('/content/v2', GRAPH_GATEWAY).href}?auth=${GRAPH_KEY}`;

class LocaleNotEnabled extends Error {
  constructor(locale) {
    super(`Locale '${locale}' is not enabled on this instance`);
    this.locale = locale;
  }
}

async function inventory(locale) {
  const query = `query($skip:Int!){
    _Content(locale: ${locale}, limit: 100, skip: $skip) {
      total
      items { _metadata { key displayName types url { default } } }
    }
  }`;

  const items = new Map();
  let skip = 0;
  let total = Infinity;

  while (skip < total) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { skip } }),
    });
    const raw = await res.text();
    let json;
    try {
      json = JSON.parse(raw);
    } catch {
      throw new Error(`Graph ${res.status}: ${raw.slice(0, 200)}`);
    }

    // A locale the instance does not have is reported as an unknown enum value. That is a
    // configuration fact, not a script failure: LANGUAGES ARE AN INSTANCE SETTING and are NOT
    // carried over by `opti-push`, so a freshly promoted instance has the model but only its
    // default language. Surface it plainly and keep going with the locales that do exist.
    const errs = json.errors ?? [];
    if (errs.some((e) => /does not exist in .*Locales.* enum/i.test(e?.message ?? ''))) {
      throw new LocaleNotEnabled(locale);
    }
    if (errs.length) throw new Error(`Graph error: ${JSON.stringify(errs).slice(0, 300)}`);
    if (!res.ok) throw new Error(`Graph ${res.status}: ${raw.slice(0, 200)}`);

    const page = json.data._Content;
    total = page.total;
    for (const it of page.items) {
      const m = it._metadata;
      if (!m?.key || items.has(m.key)) continue;
      const types = m.types ?? [];
      if (types.some((t) => FOLDER_TYPES.has(t))) continue;
      items.set(m.key, {
        key: m.key,
        label: m.displayName ?? m.key,
        type: types.find((t) => !t.startsWith('_')) ?? types[0] ?? '?',
        url: m.url?.default ?? null,
      });
    }
    if (page.items.length === 0) break;
    skip += 100;
  }
  return items;
}

/** Strip the leading locale segment so EN and AR paths are comparable. */
const bare = (url) => (url ? url.replace(/^\/(en|ar)(?=\/|$)/, '') || '/' : null);

function countByType(items) {
  const counts = {};
  for (const it of items.values()) counts[it.type] = (counts[it.type] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

const pad = (s, n) => String(s).padEnd(n);

async function main() {
  // The Graph gateway host is the SAME for every instance — the single key is what selects
  // one. Printing the host alone would make two different instances look identical, so
  // identify the instance by a fingerprint of its key instead.
  const keyId = `…${GRAPH_KEY.slice(-6)}`;
  console.log(`\nGateway:  ${new URL(GRAPH_GATEWAY).host}  (shared across instances)`);
  console.log(`Instance: single key ${keyId}`);
  console.log('Source:   Optimizely Graph (PUBLISHED content only — drafts are invisible here)\n');

  const byLocale = {};
  const disabled = [];
  for (const locale of LOCALES) {
    try {
      byLocale[locale] = await inventory(locale);
    } catch (e) {
      if (!(e instanceof LocaleNotEnabled)) throw e;
      disabled.push(locale);
      byLocale[locale] = new Map();
    }
  }

  if (disabled.length) {
    console.log(`⚠ Locale(s) not enabled on this instance: ${disabled.join(', ')}`);
    console.log('  Languages are an INSTANCE setting — `opti-push` promotes the content model but');
    console.log('  NOT the language configuration. Enable them in the CMS before importing content,');
    console.log('  or the translated variants have nowhere to land:');
    console.log('    CMS → Settings → Languages → enable the language → set it Available.\n');
  }

  // ── Per-type counts, locales side by side ────────────────────────────────
  const types = [...new Set(LOCALES.flatMap((l) => [...byLocale[l].values()].map((i) => i.type)))].sort();
  console.log(`${pad('TYPE', 34)}${LOCALES.map((l) => pad(l.toUpperCase(), 8)).join('')}`);
  console.log('─'.repeat(34 + LOCALES.length * 8));
  for (const type of types) {
    const cells = LOCALES.map((l) => pad(countByType(byLocale[l])[type] ?? 0, 8)).join('');
    const counts = LOCALES.map((l) => countByType(byLocale[l])[type] ?? 0);
    const uneven = new Set(counts).size > 1;
    console.log(`${pad(type, 34)}${cells}${uneven ? '  ← locales differ' : ''}`);
  }
  console.log('─'.repeat(34 + LOCALES.length * 8));
  console.log(`${pad('TOTAL', 34)}${LOCALES.map((l) => pad(byLocale[l].size, 8)).join('')}\n`);

  // ── Slug alignment across locales (the S3.9 404 class of bug) ────────────
  const [primary, ...others] = LOCALES;
  const mismatches = [];
  const missing = [];
  for (const [key, en] of byLocale[primary]) {
    for (const other of others) {
      const alt = byLocale[other].get(key);
      if (!alt) {
        missing.push({ key, label: en.label, locale: other });
      } else if (bare(en.url) !== bare(alt.url)) {
        mismatches.push({ label: en.label, [primary]: en.url, [other]: alt.url });
      }
    }
  }

  if (missing.length) {
    console.log(`⚠ ${missing.length} item(s) published in ${primary} but NOT in the other locale(s):`);
    for (const m of missing.slice(0, 15)) console.log(`   [${m.locale}] ${m.label}`);
    if (missing.length > 15) console.log(`   … and ${missing.length - 15} more`);
    console.log('');
  } else {
    console.log(`✓ Every ${primary} item has a published counterpart in: ${others.join(', ')}\n`);
  }

  if (mismatches.length) {
    console.log(`⚠ ${mismatches.length} URL(s) differ between locales (this is what causes language-switch 404s):`);
    for (const m of mismatches.slice(0, 15)) {
      console.log(`   ${m.label}`);
      for (const l of LOCALES) console.log(`      ${l}: ${m[l]}`);
    }
    if (mismatches.length > 15) console.log(`   … and ${mismatches.length - 15} more`);
    console.log('\n   Fix with: npm run align:ar-slugs\n');
  } else {
    console.log('✓ URLs align across locales — no language-switch 404s.\n');
  }

  const snapshot = {
    gateway: new URL(GRAPH_GATEWAY).host,
    instance: `single key …${GRAPH_KEY.slice(-6)}`,
    localesNotEnabled: disabled,
    totals: Object.fromEntries(LOCALES.map((l) => [l, byLocale[l].size])),
    byType: Object.fromEntries(LOCALES.map((l) => [l, countByType(byLocale[l])])),
  };

  // ── Optional: diff against a snapshot from another instance ──────────────
  if (COMPARE) {
    const { readFileSync } = await import('node:fs');
    const before = JSON.parse(readFileSync(COMPARE, 'utf8'));
    console.log(`Comparing against ${COMPARE} (${before.instance ?? before.host ?? 'unknown source'})\n`);
    console.log(`${pad('TYPE', 34)}${pad('SOURCE', 10)}${pad('THIS', 10)}DELTA`);
    console.log('─'.repeat(62));
    let clean = true;
    for (const locale of LOCALES) {
      const src = before.byType?.[locale] ?? {};
      const dst = snapshot.byType[locale] ?? {};
      for (const type of [...new Set([...Object.keys(src), ...Object.keys(dst)])].sort()) {
        const a = src[type] ?? 0;
        const b = dst[type] ?? 0;
        if (a === b) continue;
        clean = false;
        console.log(`${pad(`${type} (${locale})`, 34)}${pad(a, 10)}${pad(b, 10)}${b - a > 0 ? '+' : ''}${b - a}`);
      }
    }
    console.log(clean ? '✓ Identical to the source snapshot — migration is complete.\n' : '\n⚠ Differences above. Migration is incomplete or partial.\n');
  }

  if (OUT) {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(OUT, JSON.stringify(snapshot, null, 2));
    console.log(`Snapshot written to ${OUT}\n`);
  }
}

main().catch((e) => {
  console.error(`✖ ${e.message}`);
  process.exit(1);
});
