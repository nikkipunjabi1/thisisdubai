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

**Status: built and working (Phases 1-4).** Authors generate links from the **"Share with a
stakeholder" button in the CMS preview pane**.

**How it works:**
1. **Generate a signed link.** While editing, the author clicks **"Share with a stakeholder"**
   in the CMS preview pane and picks a lifetime. A **signed token** (HMAC, server-side secret)
   encoding `{ key, locale, version | "latest", path, exp }` is minted and shown as a copyable
   URL: `https://this-is-dubai.vercel.app/preview/share?token=<signed>`. No login, no secret:
   the request is authenticated by the CMS's own `preview_token`.
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
4. **You cannot filter a version list by locale at all. Filter by URL instead.** Two
   separate traps here, found a day apart:
   - The `locale` query ARGUMENT does not narrow versions under super-user auth. A
     single-key lookup returns one row per locale; the same lookup with App key + Secret
     returns `en` and `ar` versions interleaved. (Same trap that bit `scripts/seo-fill.mjs`.)
   - `_metadata.locale` in the `where` clause is **also** unreliable: an item can have a
     version whose `url.default` is the Arabic path while its metadata says `en`. Filtering
     on it drops the version you want, or keeps one you don't.

   So the version list is fetched for ALL locales and narrowed on `url.default`, which is
   reliable because the routing model already gives every locale variant its own path. That
   single filter does double duty as the locale selector and the scope check.

**Scoping.** Draft Mode's own cookie carries no payload — it means "may see drafts", not
"may see *this* draft". So the signed token is kept in a second httpOnly cookie and
re-verified on every request; a page only renders draft content when one of the token
item's versions has exactly the URL being rendered. A reviewer who navigates elsewhere sees
the normal published site (verified: a preview link for one POI shows published content on
another).

The scope check must be applied **per version row**, not by picking one row as
representative of the item. The first cut took the first row that had a URL and compared
that; when an item's `/ar` version happened to sort first, the check failed and the preview
silently rendered published content. `rowsOnPath` in `src/lib/draft.ts` is the fix, with a
regression test built from the real version list that exposed it.

**Verifying a preview by eye.** Check a field the author actually edited. `<meta
name="description">` comes from `metaDescription`, so editing only `Summary` correctly
leaves the meta tag unchanged. Comparing the wrong field makes a working preview look
broken (and, worse, can make a broken one look fine).

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

## The author's UI (Phase 4): a button inside the CMS preview pane

`src/app/preview/StakeholderLinkPanel.tsx` + `src/app/preview/actions.ts`.

While an author edits a page, the CMS renders our app in its preview pane. A small
**"Share with a stakeholder"** button sits in the corner of that pane: click it, choose
"latest draft" or a pinned version, choose 24 hours / 7 days / 30 days, copy the link.
The author never leaves the CMS and **never types a secret**.

### Why it lives there, and not in the CMS chrome

The obvious ask is a "Create preview link" item in the CMS UI itself, the way the CMS 12
add-on [advanced-reviews](https://github.com/barteksekula/advanced-reviews) does it. That is
not buildable on SaaS:

- `advanced-reviews` is a **CMS 12** add-on. It plugs into the editor via `[IFrameComponent]`,
  `ProtectedModuleOptions` and the Dojo/ASP.NET UI framework.
- **SaaS CMS has no UI extensibility.** Optimizely's docs state you cannot add custom editors,
  and the 2026 SaaS release notes contain nothing about add-ons, custom content actions, or
  menu items.
- `cms_get_content_preview_url` looks promising but is an **Opal chat** system tool that
  returns the same short-lived authenticated preview URL. Still five minutes, still needs a
  CMS login. Not a stakeholder link.

The preview pane is the only surface where we can put an author-facing control that is still
*inside* the CMS, and it has the advantage of being exactly where the author already is.

### Why there is no login

The CMS appends `preview_token` to the preview URL, a JWT it issues to an authenticated
editor session. Possession of an unexpired one is proof the request came from somebody logged
into the CMS, so **the CMS login is the login**. That is what let us delete the admin page and
its shared password.

Verified against the live instance: the token is HS256, `iss`/`aud` of `graph`, an `appKey`
claim equal to our Graph application key, and a **300-second** lifetime. It is signed with our
own Graph secret (base64-decoded), so it *can* be checked locally with no network call.

**We deliberately do not rely on that signature.** The signing key is an undocumented
implementation detail Optimizely can change; what is documented is that the token goes to
Graph as `Authorization: Bearer …`. So `verifyCmsPreviewToken` asks Graph, and treats only an
explicit 401/403 as a rejection. The local checks in `isPlausibleCmsPreviewToken` run first
purely to avoid a round trip on obvious junk, and are lenient by design: anything we cannot
positively disprove is passed to Graph, so a format change degrades to an extra network call
rather than to a dead feature. Network errors fail closed.

**What the token proves, and what it does not.** It proves a live authenticated editor session
against this instance, right now. It does **not** identify the user (`sub` is a service
subject, not a person) and it carries no content key, so it does not prove rights to the
specific item. That is a real limitation, not an oversight: it is the same attribution gap the
shared secret had, minus the secret in the author's hands.

### Known gaps (fine for a demo, worth naming before anyone reuses this)
- **No per-user attribution.** Link generation cannot be traced to an individual author.
  Closing this needs identity the CMS does not give us in the preview token.
- **Links are not logged or revocable before expiry.** Rotating `PREVIEW_SIGNING_SECRET`
  invalidates every outstanding link at once, which is the emergency lever.
- **The button only appears where the CMS renders us**, so an item with no configured preview
  URL, or a bulk job, still needs `/api/preview/share`.

### The machine-facing route
`/api/preview/share` is unchanged and still guarded by `Authorization: Bearer
<PREVIEW_ADMIN_SECRET>`, for CI and scripts. That secret is no longer part of any human
workflow.

---

## Access control: org-network-only by default

A preview link renders **unpublished** content to a viewer with **no login**, so the default
posture is **restricted, not open**. Every link is minted in one of two modes, and the author UI
**defaults to the restricted one** — you have to deliberately choose to make a link public.

| Mode | Who can open it | When to use | Default |
|---|---|---|---|
| **Internal** (org-network-only) | Only requests from allow-listed organization egress IPs (office network / VPN) | Day-to-day review by staff | ✅ **default** |
| **Shareable** (login-free) | Anyone with the link | An external stakeholder who has no CMS login **and** isn't on the network | opt-in, chosen per link |

### How "Internal" is enforced
The gate lives **at the edge** in `src/proxy.ts` (pure, unit-tested helpers in
`src/lib/preview-access.ts`). It fires at the **two points where a login-free draft is served**:

1. **Link consumption** — `GET /preview/share?token=…`, where the scope cookie is about to be set.
2. **Every subsequent draft page view** — a locale page (`/en/…`, `/ar/…`) carrying Next's Draft
   Mode cookie plus the `__preview_share` scope cookie. The gate re-checks here too, so an
   off-network reviewer who already holds the cookie is stopped mid-session, not just at step 1.

At both points the client IP is matched against `PREVIEW_ALLOWED_IPS` (comma-separated). Off-network
requests get a **`403` before any draft is read**; the **public site is never touched** (the gate
only runs when a share token / draft cookie is present).

- **Layer 1 (the CMS editor's own `/preview` iframe) is deliberately NOT IP-gated.** It's
  authenticated by the CMS's short-lived `preview_token`, and an author may legitimately edit from
  anywhere; that path stays out of the proxy matcher. Only the Layer-2 login-free surface is gated.
- **Mode lives in the signed token** (`mode: 'internal' | 'shareable'`), so it can't be escalated
  by editing the URL: a validly-signed `internal` token opened off-network is still refused. The
  edge reads `mode` from the payload *unverified* (defence-in-depth only) and **fails safe to
  `internal`** for any legacy/missing/garbled value — the HMAC is still verified server-side before
  a draft is read, so a forged `shareable` skips the gate but renders nothing.
- **Strictly allow-list only — no localhost bypass.** An internal link opens ONLY from an IP in
  `PREVIEW_ALLOWED_IPS`, in every environment. An empty list **denies everything** (fail-safe), and
  a direct local connection (`next dev`) is treated as `127.0.0.1`, so to preview internal links on
  localhost you add `127.0.0.1` (and `::1`) to the list. This is deliberate: it lets the deny path
  be exercised from a normal browser, not just via a spoofed `x-forwarded-for` header.
- **Shareable** links skip the IP gate but keep every other control (short TTL, single-item scope,
  `noindex`, the httpOnly scope cookie).

### Caveats (this is a posture, not authentication)
- **Corporate egress IPs rotate and are shared.** An allow-list authorizes a *network*, not a
  *person* — lean on the short TTL + item scope alongside it, never on the IP alone.
- **`x-forwarded-for` is only trustworthy behind a known proxy.** On Vercel, use the platform's
  client-IP signal and ignore client-supplied XFF hops, or the allow-list is spoofable.
- **Internal mode blocks legitimate *remote* reviewers by design.** That's the whole point; reach
  for **Shareable** for them, as a conscious choice.

### Stronger option (genuinely sensitive / embargoed drafts)
Put the preview behind an **identity-aware proxy** (Cloudflare Access, or Vercel SSO / password
protection) instead of an IP list — real per-user auth, at the cost of the login-free
convenience. That's deploy-time config, not app code, and would *replace* the IP gate for Internal
mode rather than stack on it.

### Related hardening already in place
- **`frame-ancestors` CSP** (`next.config.ts`) restricts who may *embed* the app to `'self'` + the
  Optimizely CMS. That's a different axis (anti-clickjacking) from *who may open* a link, but it's
  part of the same "lock down preview surfaces" story.

**Status: built and working (S3.1a).** Shipped: the `mode` claim on the signed token (defaulting to
`internal` in both link generators — the CMS panel action and the machine `/api/preview/share`
route); the edge IP gate + `PREVIEW_ALLOWED_IPS` in `src/proxy.ts` / `src/lib/preview-access.ts`,
enforced at link consumption and on every draft page view; and the Internal/Shareable toggle in
`StakeholderLinkPanel`, **defaulting to Internal**. Covered by unit tests (`preview-access.test.ts`,
`preview-token.test.ts`) and an end-to-end proxy matrix.

---

## Key design decisions
- **Token signing:** HMAC-signed (or JWT) with a server secret (`PREVIEW_SIGNING_SECRET`), short
  default TTL, explicit `contentKey`+`locale` scope (a link previews only its item).
- **Version targeting:** default to "latest draft" so re-edits after sharing stay visible without
  reissuing the link; optionally pin a version for a frozen snapshot.
- **New pages not yet routable:** a brand-new page may not have a public URL yet. The preview
  route renders by `contentKey` directly (via `getContentById`), so it works before first publish.
- **Access control (default = restricted):** links are minted **Internal (org-network-only)** by
  default and only made **Shareable** by explicit author opt-in — see "Access control:
  org-network-only by default" above. Optionally add a passphrase and log link generation for
  auditability.
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
| 4 | "Share with a stakeholder" button inside the CMS preview pane, authenticated by the CMS preview token | `src/app/preview/StakeholderLinkPanel.tsx`, `src/app/preview/actions.ts`, `src/lib/cms-preview-token.ts` |

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
