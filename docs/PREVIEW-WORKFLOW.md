# Stakeholder Preview & Publish Workflow

_Standard requirement: authors must be able to **share a link to unpublished content** (a new
page, or new/edited components on a page) with stakeholders **before** it goes live. Stakeholders
review via the link; once approved, the author publishes and it appears live._

This is a first-class feature of This is Dubai — and a strong **community-module / MVP** candidate,
because Optimizely SaaS CMS does **not** ship a durable, login-free, shareable preview link out of
the box (its built-in preview token is short-lived, ~5 min, tied to the editor session).

---

## The two layers of preview

### Layer 1 — Built-in on-page editing preview (works out of the box)
- The CMS editor iframes our app at `/preview?key=…&ver=…&loc=…&ctx=edit&preview_token=…`.
- The `preview_token` (~5 min, refreshed on save) authorizes Graph to return the **draft
  version**; the `communicationinjector.js` script bridges edits live.
- ✅ Great for the **author** while editing. ❌ Not shareable with external stakeholders (token
  expires fast, requires the editor context). Comes free with the forked baseline.

### Layer 2 — Durable, shareable stakeholder preview links (we build this)
The thing you actually asked for. A link an author generates and sends to a stakeholder who has
**no CMS login**, that stays valid for a chosen window (e.g. 7 days) and always shows the
**current unpublished draft** of that content.

**Status: built and working (Phases 1-4).** `/admin/preview` is the author's UI.

**How it works:**
1. **Generate a signed link.** The author opens **`/admin/preview`**, signs in with
   `PREVIEW_ADMIN_SECRET`, picks an item that has unpublished edits, and chooses a lifetime.
   A **signed token** (HMAC, server-side secret) encoding
   `{ key, locale, version | "latest", path, exp }` is minted and shown as a copyable URL:
   `https://this-is-dubai.vercel.app/preview/share?token=<signed>`.
   The `/api/preview/share` route does the same thing for machines (CI, scripts), authenticated
   with `Authorization: Bearer <PREVIEW_ADMIN_SECRET>`.
2. **Stakeholder opens the link.** The `/preview/share` route:
   - verifies the signed token (rejects expired/tampered) — no CMS auth needed by the viewer;
   - enables **Next.js Draft Mode** (sets the draft cookie), stores the signed token in a
     companion `__preview_share` cookie, and redirects to the content's path;
   - the page, in draft mode, fetches that **specific draft version** from **Optimizely Graph
     using the server-side App key + Secret** (super-user can read unpublished). See
     "How the draft read actually works" below.
3. **Rendering.** Draft-mode pages render **dynamically** (`force-dynamic`, no cache) so the
   stakeholder always sees the latest saved draft, including new/edited components. A subtle
   "PREVIEW — not yet published" banner is shown.
4. **Approve → Publish.** Author publishes in the CMS → the Graph **publish webhook** hits
   `/api/content/publish` → `revalidatePath` → the live (non-preview) URL now shows the content.
   The preview link then simply matches live.

**Why this is safe:** the viewer never gets Graph credentials; the signed token only unlocks
draft rendering of one content item for a limited time. The Graph secret/app-key stays
**server-side only**.

---

---

## How the draft read actually works (Phase 3, validated against the live CMS)

Implemented in `src/lib/draft.ts`. Four findings from the spike shaped it, and all four
contradict the assumption the design started with:

1. **The SDK cannot read drafts for us.** `@optimizely/cms-sdk` v2 sends either
   `Authorization: epi-single <key>` (published only) or `Bearer <previewToken>` (the CMS
   editor's ~5-minute token). There is no `enablePreview()` and no HMAC support, so neither
   auth mode survives a durable, login-free link.
2. **Basic auth is enough — no HMAC signing needed.** Graph accepts
   `Authorization: Basic base64(APP_KEY:SECRET)` and returns unpublished versions with it.
   `DraftGraphClient` overrides only `request()` to send that header; every other SDK method
   (query generation, content-type resolution, response shaping) is reused unchanged.
3. **Pick the draft by STATUS, never by version number.** On the live instance Burj Khalifa
   has `Draft` at version **1377** sitting next to `Published` at **1378** — the draft's
   number is *lower*. Version numbers order by neither recency nor status. We filter
   `_metadata.status notIn ["Previous"]` and take the newest non-`Published` row by
   `lastModified`.
4. **The `locale` query ARGUMENT does not filter versions under super-user auth** — a
   single-key lookup returns one row per locale, but the same lookup with App key + Secret
   returns `en` and `ar` versions interleaved. Locale must go in the `where` clause as
   `_metadata.locale`. (Same trap that bit `scripts/seo-fill.mjs`.)

**Scoping.** Draft Mode's own cookie carries no payload — it means "may see drafts", not
"may see *this* draft". So the signed token is kept in a second httpOnly cookie and
re-verified on every request; a page only renders draft content when the token's `key`
resolves to the page being rendered. A reviewer who navigates elsewhere sees the normal
published site (verified: a preview link for Burj Khalifa shows published content on Burj
Al Arab).

**Fallbacks.** The draft read returns null — and the page renders published content — when
the link is absent/expired/out of scope, when the item has no unpublished version (e.g. the
Arabic Burj Khalifa, which has no draft), or when the Graph read fails. A preview link never
500s; failures are logged server-side.

**Caching.** Draft reads bypass `cachedGraphRead` entirely and send `cache=false` to Graph.
`unstable_cache` is keyed on path and shared across visitors, so caching a draft there would
leak unpublished content onto the public site.

**Not covered yet:** a brand-new page that has no URL yet (there is no route to render it by
key alone), and listing/section data, which stays published by design — a share link previews
one item, not the whole site.

---

## The author's UI (Phase 4)

`/admin/preview` — `src/app/admin/preview/`. Replaces the curl command.

- **Sign in** with `PREVIEW_ADMIN_SECRET`, exchanged for an 8-hour signed session cookie
  (`src/lib/admin-session.ts`), so the secret is typed once instead of pasted per request.
  Admin sessions and share tokens are HMACs under the **same** secret, so the session body is
  prefixed with a domain string — without it, any reviewer's 7-day share token would be a valid
  admin session. There is a test asserting exactly that.
- **Pick an item** from the list of everything that currently has an unpublished draft, newest
  edit first, filterable by name or path. The query is `types eq "_page"` + `status eq "Draft"`:
  experiences carry both `_Experience` and `_Page`, so one `eq` covers pages and experiences
  while excluding blocks, taxonomy, folders and media. (`types` with `in: [...]` silently
  matches nothing — use `eq`.)
- **Choose the version**: "latest draft" (keeps tracking new edits after the link is sent) or a
  pinned version (frozen snapshot). **Choose a lifetime**: 24 hours / 7 days / 30 days.
- The generated URL is shown with a copy button and its expiry in local time.

**Guarding it.** Every server action re-verifies the session — a server action is a POST
endpoint, so "the form isn't rendered" is not access control. The page fetches the draft list
only *after* the session check, so an unauthenticated request never touches Graph and the HTML
contains no content titles. `/admin` is excluded from locale routing in `src/proxy.ts`, forced
to `X-Robots-Tag: noindex, nofollow` there, `noindex` in its own metadata, and disallowed in
`robots.txt`.

**Known gaps** (fine for a demo, worth naming before anyone reuses this):
- A single shared secret, not per-user accounts, so link generation is not attributable. Real
  deployments should put this behind the same SSO as the CMS.
- No rate limiting on sign-in. The defence is a long random secret plus a timing-safe compare;
  a serverless in-memory counter would be per-instance and mostly theatre.
- Generated links aren't logged or revocable before expiry. Rotating `PREVIEW_SIGNING_SECRET`
  invalidates all of them at once, which is the emergency lever.

---

## Key design decisions
- **Token signing:** HMAC-signed (or JWT) with a server secret (`PREVIEW_SIGNING_SECRET`), short
  default TTL, explicit `contentKey`+`locale` scope (a link previews only its item).
- **Version targeting:** default to "latest draft" so re-edits after sharing stay visible without
  reissuing the link; optionally pin a version for a frozen snapshot.
- **New pages not yet routable:** a brand-new page may not have a public URL yet. The preview
  route renders by `contentKey` directly (via `getContentById`), so it works before first publish.
- **Access hardening (optional):** add a light gate (link + optional passphrase) if stakeholders
  are external; log link generation for auditability.
- **Revalidation on publish:** already handled by the baseline's `createPublishApi` +
  `opti-graph webhook:create`; we confirm `optimizePublish` targets the right paths.

## Vercel free-tier notes
- Draft Mode + dynamic rendering + serverless routes all work on **Hobby (free)**.
- Every git push already gets a **Vercel deployment preview URL** — useful for *code* review, but
  distinct from *content* preview (Layer 2 above). Don't conflate them for stakeholders.
- Hobby is non-commercial use; a learning/demo tourism site qualifies. Watch function
  execution/bandwidth limits (fine for this scale). No cron/queue needed for this feature.

## Build phases — all complete
| Phase | What landed | Where |
|---|---|---|
| 1 | Signed, expiring share tokens (HMAC-SHA256, fail-closed, timing-safe) | `src/lib/preview-token.ts` |
| 2 | Share-link routes, Draft Mode, localized banner, `noindex` | `src/app/preview/share/`, `src/app/api/preview/`, `src/components/preview/`, `src/proxy.ts` |
| 3 | Real draft reads via App key + Secret; scoped to one item | `src/lib/draft.ts` |
| 4 | Author UI to generate links, with sign-in | `src/app/admin/preview/`, `src/lib/admin-session.ts` |

Still the **#1 module/blog candidate** — see BLOG-PLAN.md (post #13) and ROADMAP Phase 5.

## Validated against the live CMS
- ✅ Exact call to fetch a **specific draft version** — resolved in Phase 3, see "How the draft
  read actually works" above. (Not HMAC and not `enablePreview()`; both turned out not to exist
  in `@optimizely/cms-sdk` v2.)
- ✅ Content **status/versioning** model: `Draft` / `Published` / `Previous` on
  `_metadata.status`, filterable with `eq` and `notIn`. The link targets the newest
  non-`Published` version rather than a named "Ready for review" status, so it keeps working
  whatever review states the CMS later exposes.

## Still to validate
- Whether the SaaS CMS "Applications" preview-URL config can point at our `/preview/share`
  generator, or whether we drive link generation entirely from our own admin UI/route (Phase 4).
