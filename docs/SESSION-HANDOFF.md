# Session Handoff — This is Dubai (Optimizely SaaS CMS + Next.js)

> ✅ **RESOLVED — the handed-off work is merged.** The stakeholder preview module (Phases 1–4 +
> the article/URL-less-block fix) shipped to `main` in **PR #61**; the `feat/stakeholder-preview`
> branch is deleted. The "resume on this branch / PR open, NOT merged" instructions below are
> **historical** — kept for the write-up and the gotchas, which are the durable value here. The
> canonical, current state lives in `docs/PREVIEW-WORKFLOW.md`, `docs/SPRINTS.md`, `README.md`, and
> `docs/PREVIEW-MODULE-PACKAGING.md`. Open follow-ups (screenshots + publish blog #13, package the
> module) are unchanged and listed under "NEXT" below.

_Originally written to transfer context to a fresh Claude session (new account)._

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

- **Phase 4 — author UI. DONE, then REDESIGNED.** The first cut was `/admin/preview`, a separate
  page where the author pasted `PREVIEW_ADMIN_SECRET`. The user rightly rejected that: authors
  should not handle secrets, and link creation belongs in the CMS. **That page and
  `src/lib/admin-session.ts` are deleted.**
  - **Now:** a "Share with a stakeholder" button in the CMS **preview pane**
    (`src/app/preview/StakeholderLinkPanel.tsx` + `actions.ts`). One click while editing,
    pick latest-vs-pinned and 24h/7d/30d, copy. **No login, no secret.**
  - **Authenticated by the CMS's own `preview_token`** (`src/lib/cms-preview-token.ts`,
    + `.test.ts`, 9 tests). Verified on the live instance: HS256, `iss`/`aud` = `graph`,
    `appKey` = our Graph app key, **300s** lifetime, signed with `OPTIMIZELY_GRAPH_SECRET`
    (base64-decoded). We do NOT rely on that signature (undocumented); we send the token to
    Graph and treat only 401/403 as rejection. Local checks are a lenient pre-filter only.
  - **Why not a real CMS button:** SaaS CMS has **no UI extensibility** (no add-ons, no custom
    editors/menu items; nothing in the 2026 release notes). `advanced-reviews` is a CMS 12
    add-on using `[IFrameComponent]`/Dojo. `cms_get_content_preview_url` is an Opal chat tool
    returning the same 5-minute URL. The preview pane is the only in-CMS surface available.
  - **Verified:** panel renders only when a `preview_token` is present; a minted token is
    accepted by Graph (which also confirmed the signing scheme); expired + garbage tokens are
    rejected 401; a link generated from the panel renders the draft while the live page does
    not. Earlier AR proof still holds (`شارع السركال` vs published "Alserkal Avenue").
  - `PREVIEW_ADMIN_SECRET` now guards ONLY `/api/preview/share` (CI/scripts). No human path.

- **Blog #13 — DONE (draft).** `blog/shareable-stakeholder-previews-optimizely-saas.md`, ~3,050
  words, TPM voice, generic, zero em-dashes, 4 `📷` placeholders to capture. Status in
  `BLOG-PLAN.md` moved to "Draft ready". **Needs the user's review + screenshots before publishing.**

- **Copy button fix.** `navigator.clipboard` silently fails inside the CMS iframe: the async
  Clipboard API needs `allow="clipboard-write"` on the iframe, which the CMS owns and we cannot
  set. Now falls back to select + `document.execCommand('copy')`, and if both fail it selects the
  text and tells the user to press Ctrl/Cmd+C.

### NEXT — the preview module is complete (Phases 1-4 + blog draft + packaging plan) and **merged** (PR #61).
Open follow-ups, in rough priority order:
1. **Capture the 4 `📷` screenshots** and review `blog/shareable-stakeholder-previews-optimizely-saas.md`,
   then publish. Zero em-dashes verified; do not introduce any.
2. **Package the module for other teams** — full plan in `docs/PREVIEW-MODULE-PACKAGING.md`.
   Verdict: possible; ~60% ships as a framework-free npm core, ~25% as a Next.js adapter, ~15% is
   always host-app integration. Recommended: npm package **plus** a public reference repo, with a
   Claude Code skill as a fast follow. Six open questions listed there (ownership/scope, whether
   Optimizely will ship UI extensibility, per-user attribution, link revocation storage, other
   framework adapters, licensing). Nothing built yet.
3. Rendering a **brand-new page that has no URL yet** (needs a render-by-key route).
4. Hardening gaps in `PREVIEW-WORKFLOW.md`: no per-user attribution (the CMS preview token
   identifies a session, not a person), no link revocation before expiry.

### Gotcha for the next session: stale Turbopack cache
`/en/search` started throwing `ReferenceError: require is not defined` from a Next internal
chunk. **Not a code bug** — the dev server had run for hours across many edits including
directory deletions. `npm run build` passed cleanly, which is the quickest way to tell.
Fix: stop the dev server, `rm -rf .next/dev`, restart. Suspect this whenever an error's frames
are all ignore-listed Next internals.

### Generating a link
Normally: open the page in the **CMS editor** and click **"Share with a stakeholder"** in the
preview pane. Nothing to sign into.

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
  Visual Builder, Next.js App Router (Vercel is the deploy target, not yet deployed). Built in the
  open toward Optimizely MVP.
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
- Nothing outstanding. `feat/stakeholder-preview` merged (PR #61) and its branch is deleted, along
  with the other recent feature branches (search facets, SEO script, blog rewrites, README) — all on
  `main`. Local `main` is in sync with `origin/main`.
