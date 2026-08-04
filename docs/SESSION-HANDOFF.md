# Session Handoff — This is Dubai (Optimizely SaaS CMS + Next.js)

_Written to transfer context to a fresh Claude session (new account). Read this first, then
`docs/PREVIEW-WORKFLOW.md`, `docs/SPRINTS.md`, and `docs/BLOG-PLAN.md`._

## Resume checklist
1. Repo: `github.com/nikkipunjabi1/thisisdubai`. Active branch: **`feat/stakeholder-preview`**
   (`git checkout feat/stakeholder-preview && git pull`). The preview work lives here, not `main`.
2. `npm install`; ensure `.env` exists (see "Env vars" below — values are already set on the
   user's machine; a new machine needs them re-entered).
3. Dev server: **never** use `npm run dev` via Bash — use the preview/browser tooling
   (`preview_start {name:"dev"}`). It serves **HTTPS** at `https://localhost:3000`.
4. Tests: `npx vitest run`; typecheck: `npm run type-check`; lint: `npm run lint`.

## The task in flight: Stakeholder Preview module (Sprint S3.1)

A durable, **login-free, shareable** preview link so an external stakeholder (no CMS login) can
review **unpublished** content before publish. Distinct from the built-in Visual Builder preview,
which needs a CMS login and a ~5-min token (that's "Layer 1"; this is "Layer 2"). Full design:
`docs/PREVIEW-WORKFLOW.md`.

### Done + pushed (branch `feat/stakeholder-preview`, PR open, NOT merged)
- **Phase 1 — signed token lib.** `src/lib/preview-token.ts` (+ `.test.ts`, 8 tests). HMAC-SHA256
  JWT-lite `{key, locale, version, path, exp}`; `signShareToken` / `verifyShareToken`; fail-closed
  if `PREVIEW_SIGNING_SECRET` unset; timing-safe verify.
- **Phase 2 — link plumbing + Draft Mode.**
  - `src/app/preview/share/route.ts` — verify token → enable Next.js Draft Mode → redirect
    (`410` expired / `404` invalid, both `noindex`).
  - `src/app/api/preview/share/route.ts` — author link **generator**. Auth = **`Authorization:
    Bearer <PREVIEW_ADMIN_SECRET>`** header (NOT a URL param; timing-safe compare; fail-closed).
  - `src/app/api/preview/exit/route.ts` — clears Draft Mode (same-site redirects only).
  - `src/components/preview/PreviewBanner.tsx` — localized (en/ar) "unpublished draft" banner,
    shown only in Draft Mode; mounted in `src/app/layout.tsx`.
  - `src/proxy.ts` — forces `X-Robots-Tag: noindex` whenever the `__prerender_bypass` (Draft Mode)
    cookie is present.
  - Messages: `preview.banner` / `preview.exit` in `src/lib/messages.ts` (en + ar).
- **Verified:** typecheck/lint clean; token tests pass; in-browser the route mounts, rejects bad
  tokens (401/404), header auth enforced, no regression to the normal site.

- **Phase 3 — real draft reads. DONE.** `src/lib/draft.ts` (+ `.test.ts`, 8 tests).
  - The spike overturned the plan's assumptions: `@optimizely/cms-sdk` v2 has **no HMAC support
    and no `enablePreview()`** — `request()` only sends `epi-single <key>` or `Bearer
    <previewToken>`. But Graph accepts **`Authorization: Basic base64(APP_KEY:SECRET)`**, which
    returns unpublished versions. So `DraftGraphClient` subclasses `GraphClient` and overrides
    only `request()`; all SDK query generation is reused.
  - **Pick the draft by `_metadata.status`, never by version number** — live Burj Khalifa has
    Draft **1377** next to Published **1378**.
  - **Never filter a version list by locale — filter by `url.default`.** The `locale` query
    *argument* doesn't narrow versions under super-user auth, AND `_metadata.locale` in the
    `where` clause is wrong per version (an item can have a version whose URL is the `/ar` path
    but whose metadata says `en`). URL is the only reliable discriminator, and it doubles as the
    scope check. Apply it **per row**: the first cut picked one representative row's URL, which
    silently rendered published content whenever another locale's row sorted first.
  - The signed token is also stored in an httpOnly `__preview_share` cookie (Draft Mode's own
    cookie has no payload), re-verified per request, so a link previews **one item only**.
  - Wired into `src/app/[locale]/[...slug]/page.tsx` and `src/app/[locale]/page.tsx`; falls back
    to the cached published read whenever a draft isn't available. Listings stay published.
  - **Verified end to end:** share link → banner + the draft's `metaDescription` (published
    `…Dubai.` vs draft `…Dubai....`); a different page under the same cookie shows published;
    exit clears both cookies; AR (no draft) falls back cleanly; tampered token 404;
    `X-Robots-Tag: noindex, nofollow` present only in Draft Mode; `/en` `/ar` and section pages
    all still 200. Typecheck + lint clean, 39 tests pass.

- **Phase 4 — author UI. DONE.** `/admin/preview` (`src/app/admin/preview/`) +
  `src/lib/admin-session.ts` (+ `.test.ts`, 9 tests). Sign in with `PREVIEW_ADMIN_SECRET` → 8h
  signed session cookie; pick from the list of items with unpublished drafts (newest first,
  filterable); choose latest-vs-pinned version and 24h/7d/30d lifetime; copy the link.
  - **Domain separation matters:** admin sessions and share tokens are HMACs under the SAME
    secret, so the session body is prefixed `admin-session.v1.` — otherwise any reviewer's
    share token would be a valid admin session. There's a test for it.
  - Draft list query: `types eq "_page"` + `status eq "Draft"` (experiences carry `_Page` too;
    `types: { in: [...] }` silently matches nothing). Graph caps `limit` at 100.
  - `/admin` excluded from locale routing in `src/proxy.ts` + forced `X-Robots-Tag: noindex`,
    `noindex` metadata, and disallowed in `robots.txt`.
  - **Verified:** wrong secret rejected; unauthenticated page contains zero content titles and
    makes no Graph call; forged session rejected; sign-out clears the cookie; UI-generated EN
    link renders the draft; **AR link renders the unpublished Arabic translation**
    (`شارع السركال`) while the live page still shows "Alserkal Avenue". 48 tests pass.

- **Blog #13 — DONE (draft).** `blog/shareable-stakeholder-previews-optimizely-saas.md`, ~3,050
  words, TPM voice, generic, zero em-dashes, 4 `📷` placeholders to capture. Status in
  `BLOG-PLAN.md` moved to "Draft ready". **Needs the user's review + screenshots before publishing.**

### NEXT — the preview module is complete (Phases 1-4 + blog draft). Open follow-ups:
- Capture the 4 screenshots and review the blog draft, then publish.
- Rendering a **brand-new page that has no URL yet** (needs a render-by-key route).
- Hardening gaps named in `PREVIEW-WORKFLOW.md`: single shared secret rather than per-user
  accounts, no sign-in rate limit, no link revocation before expiry.

### Generating a link
Normally: open **`https://localhost:3000/admin/preview`** and sign in with `PREVIEW_ADMIN_SECRET`.

For scripts/CI, the machine-facing route still works (real Burj Khalifa POI key so it's meaningful):
```bash
curl -sk "https://localhost:3000/api/preview/share?key=78ba1519705591c08d21e02b45793831&locale=en&path=/places-to-visit/burj-khalifa" \
  -H "Authorization: Bearer <PREVIEW_ADMIN_SECRET>"
```
Returns `{url, expiresInSeconds}`; open `url` → redirect to the page + preview banner.

## Env vars (names only; values are secrets, kept in `.env`, which is gitignored)
- `OPTIMIZELY_CMS_URL`, `OPTIMIZELY_CMS_CLIENT_ID`, `OPTIMIZELY_CMS_CLIENT_SECRET` — CMA (content
  write) OAuth. Server-side.
- `OPTIMIZELY_GRAPH_SINGLE_KEY` — public, read-only, published-only. The **only** browser-safe key.
- `OPTIMIZELY_GRAPH_GATEWAY` — Graph endpoint.
- `OPTIMIZELY_GRAPH_APP_KEY` + `OPTIMIZELY_GRAPH_SECRET` — Graph super-user (reads drafts + writes).
  SERVER-SIDE ONLY. Used by `src/lib/draft.ts` as **HTTP Basic**, not HMAC (Basic is accepted and
  needs no request signing).
- `PREVIEW_SIGNING_SECRET` — signs the share links (HMAC). Server-side.
- `PREVIEW_ADMIN_SECRET` — Bearer token guarding the link generator.
- `APPLICATION_HOST`, `GRAPH_CACHE_SECONDS`, `SITE_INDEXABLE`, `REVALIDATE_SECRET` — see `.env.example`.

## Key facts / gotchas
- **Single key vs App key+Secret:** single key = published/public only (browser-safe). App
  key + Secret = super-user, reads unpublished + writes; server-side only. Graph accepts it as
  either HTTP **Basic** or HMAC — Basic needs no request signing, so that's what we use. (This is
  also blog #17's subject.)
- **Version numbers don't order by status or recency.** A `Draft` can have a LOWER version number
  than the `Published` one (live example: Burj Khalifa Draft 1377 / Published 1378). Always select
  on `_metadata.status`, and break ties on `lastModified`.
- **The app is already dynamically rendered** (root layout reads request headers for locale), so
  adding `draftMode()` reads adds no caching regression; speed comes from `cachedGraphRead`
  (`unstable_cache`), not static generation.
- **Content keys** are `md5("<type>:<slug>")` namespaced — see `scripts/data/_helpers.mjs`
  (`poiKey`, `areaKey`, `eventKey`, `articleBlockKey`). Home experience key: `71792f1b444e4d6d9a77c41c47c4cf7e`.
- **CMS content is localized:** items have interleaved `en` + `ar` versions; when picking a version
  from `GET /content/{key}/versions`, filter by `locale` and take the max version number (list order
  is NOT reliable). This bit the SEO script (see `scripts/seo-fill.mjs`).

## Broader project state
- **What it is:** an unofficial demo tourism site ("This is Dubai") on Optimizely SaaS CMS + Graph +
  Visual Builder, Next.js App Router on Vercel. Built in the open toward Optimizely MVP.
- **Localization (EN + AR):** L0–L5 done (routing, RTL, locale data, string catalog, AR semantic
  search, hreflang/sitemap). **L6 = full AR content translation is IN PROGRESS, done manually by the
  user in the CMS UI** using the built-in Opal/translate (there is NO bulk translate-item API).
- **SEO:** EN `metaTitle`/`metaDescription` filled + published across all routable items via
  `scripts/seo-fill.mjs` (dry-by-default; `--apply`; `--publish-only`). Done.
- **Search:** `/search` semantic (Graph `_ranking: SEMANTIC`) + type facets (`?in=`). Done.

## Standing rules (do not violate)
- **Claude never merges to `main`.** Commit + push + open PRs; the USER merges. Branch off `main`.
- **Bulk/destructive CMS writes** must be reviewable, named scripts the USER runs, **dry-run first**
  (see `scripts/*.mjs`). Secrets server-side only; `.env` gitignored.
- **Blogs:** Technical-Project-Manager voice, high-level, **generic (not tied to this project)**,
  screenshot-rich, **zero em-dashes** (the `—` character). Blogs **06 and 07 are published** — only
  touch on explicit instruction. Editorial standards live in `docs/BLOG-PLAN.md`.
- **Credits:** small sprints; ask before starting a new phase; verify with the cheapest sufficient
  check.
- Confirm before hard-to-reverse or outward-facing actions.

## Open PRs / branches to be aware of
- `feat/stakeholder-preview` — this work (Phases 1–2), PR open, awaiting user merge.
- Recent merged work is on `main` (search facets, SEO script, blog rewrites, README).
