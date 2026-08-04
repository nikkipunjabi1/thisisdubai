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

**How it works:**
1. **Generate a signed link.** A route `/api/preview/share` (author-triggered) mints a **signed
   token** (JWT/HMAC, server-side secret) encoding `{ contentKey, version | "latest-draft",
   locale, exp }`. Returns a URL like:
   `https://this-is-dubai.vercel.app/preview/share?token=<signed>`.
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

## Build phase
Implemented in **Phase 3** (after the site + content model exist), but the route + draft-mode
scaffolding is stubbed in **Phase 1/2** since the baseline already has `/preview`. This is the
**#1 module/blog candidate** — see BLOG-PLAN.md and ROADMAP Phase 5.

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
