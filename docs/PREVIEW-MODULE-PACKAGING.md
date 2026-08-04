# Packaging the stakeholder preview module for other teams

_Planning document. Nothing here is built yet. The working implementation lives in this repo
(see `docs/PREVIEW-WORKFLOW.md`); this is the plan for turning it into something another team
can drop into their own Optimizely SaaS CMS project._

---

## 1. Is it possible?

**Yes, with one honest caveat: the module is CMS-agnostic but framework-coupled.**

Split the implementation into three layers and it becomes clear what can travel:

| Layer | Portable? | Why |
|---|---|---|
| **Signed share tokens** (`preview-token.ts`) | ✅ Fully | Node crypto + a secret. No CMS, no framework. |
| **CMS preview-token verification** (`cms-preview-token.ts`) | ✅ Fully | Just a Graph HTTP call. Works anywhere with the Graph credentials. |
| **Draft reads from Graph** (`draft.ts`) | ✅ Mostly | The queries and version-selection logic are universal. The SDK client subclass is tied to `@optimizely/cms-sdk` v2, which most SaaS + JS teams use anyway. |
| **Draft Mode + routes** (`/preview/share`, `/api/preview/exit`, proxy `noindex`) | ⚠️ Next.js only | Built on `next/headers` `draftMode()`. Other frameworks have equivalents (Nuxt preview mode, SvelteKit) but the code does not transfer. |
| **The author panel** (`StakeholderLinkPanel.tsx`) | ⚠️ React only | React + Tailwind classes. The logic is trivial; the markup would be re-authored per stack. |
| **Wiring into page data-loading** | ❌ Per project | Every app reads content differently. This is a documented integration step, not code we can ship. |

So roughly **60% ships as a library**, 25% ships as a Next.js adapter, and 15% is always
integration work in the host app. That last 15% is unavoidable and should be stated up front
rather than discovered by an adopter.

### Prerequisites an adopting team must already have
- Optimizely **SaaS CMS** (not CMS 12) with Optimizely Graph.
- Graph **App key + Secret** available server-side.
- **Live Preview configured** in CMS → Settings → Applications → Live Preview, with
  "Use Preview Tokens" enabled. The author button depends on the CMS sending `preview_token`.
- A **headless frontend they control**, currently Next.js App Router for the turnkey path.

---

## 2. How should we distribute it?

Four options were considered. The recommendation is **C (npm package) plus D (reference repo)**,
with A as a fast follow.

### A. Claude Code Skill (`optimizely-stakeholder-preview`)
- **Good:** Fits the existing `optimizely-setup` / `optimizely-model` / `optimizely-preview`
  skill family. An agent can wire the 15% of integration work that a library cannot do.
  Zero install friction for anyone already using Claude Code.
- **Bad:** Only reaches Claude Code users. Not a dependency you can version or patch centrally.
  Not discoverable by a team searching npm or GitHub.
- **Verdict:** Excellent *complement*, wrong as the only channel.

### B. Copy-paste reference in a blog post
- **Good:** Zero maintenance, widest reach.
- **Bad:** No versioning, no security patch path. Given this module handles a super-user
  credential and mints access tokens, "everyone forks a snapshot" is the wrong model for
  security fixes.
- **Verdict:** No, though the blog post should link to the real package.

### C. npm package — **recommended core**
Publish as a scoped package with subpath exports so a non-Next.js consumer can still use the
framework-free half:

```
@<scope>/optimizely-stakeholder-preview
  .                 → token signing/verification, draft reads, version selection (framework-free)
  ./next            → route handlers, draftMode() helpers, proxy noindex helper
  ./next/react      → the author panel component
```

- **Good:** Versioned, patchable, semver'd. Adopters get security fixes with `npm update`.
  Subpath exports keep the framework-free core usable by Nuxt/SvelteKit/Astro teams.
- **Bad:** Needs an owner, a release process, and a support surface.
- **Verdict:** The right primary channel.

### D. Public reference repository — **recommended companion**
A minimal working Next.js + SaaS CMS app that uses the package, deployable in minutes.
- Proves the integration end to end, gives adopters something to diff against, and is where
  issues get reproduced. This is how `advanced-reviews` earned trust in the CMS 12 world.

### Recommended sequence
1. **C** — extract the package, publish `0.1.0` with the framework-free core + Next adapter.
2. **D** — reference repo consuming the published package.
3. **A** — a skill that automates the integration steps in §4 against an existing codebase.
4. Blog post (already drafted) linking to all three.

---

## 3. What the package must NOT do

Worth fixing in the plan before code exists:

- **Never bundle or default any credential.** The package reads env vars the host provides and
  fails closed when they are missing. No fallback keys, ever.
- **Never expose a draft read to the client bundle.** The Graph App key + Secret path must be
  guarded so an accidental client import is a build error (`server-only`).
- **Never cache draft reads.** The host app's cache is the host app's business, but the package
  must document loudly that draft reads bypass shared caches, and its own helpers must set
  `cache: 'no-store'`.
- **Ship the noindex guardrail on by default**, not as an opt-in.

---

## 4. Step-by-step integration guide (target: ~30 minutes)

This is the guide the package README will carry. Written as the adopter experiences it.

### Step 0 — Prerequisites
Confirm the four prerequisites in §1. In particular open **CMS → Settings → Applications →
Live Preview** and check that "Use Preview Tokens" and "Preview URL format" are enabled, with a
format like `{host}/preview?key={key}&ver={version}&loc={locale}&ctx={context}`.

### Step 1 — Install
```bash
npm install @<scope>/optimizely-stakeholder-preview
```

### Step 2 — Environment variables
```bash
OPTIMIZELY_GRAPH_APP_KEY=      # server-only, reads unpublished content
OPTIMIZELY_GRAPH_SECRET=       # server-only
OPTIMIZELY_GRAPH_GATEWAY=      # optional, defaults to the production gateway
PREVIEW_SIGNING_SECRET=        # openssl rand -base64 32 — signs share links
PREVIEW_ADMIN_SECRET=          # optional: only needed for the CI/script route
APPLICATION_HOST=              # so links point at the deployed host, not localhost
```
Every one is server-scope. None may be prefixed `NEXT_PUBLIC_`.

### Step 3 — Mount the routes
Two route handlers, both one-liners re-exporting the package's handlers:
- `app/preview/share/route.ts` — link consumption: verifies the token, enables Draft Mode, redirects.
- `app/api/preview/exit/route.ts` — clears Draft Mode and the scope cookie.

Optionally `app/api/preview/share/route.ts` for the CI/script generator.

### Step 4 — Force `noindex` while in Draft Mode
In middleware/proxy, set `X-Robots-Tag: noindex, nofollow` whenever the Draft Mode cookie
(`__prerender_bypass`) is present. The package exports a helper for this. Also disallow
`/preview` in `robots.txt`.

### Step 5 — Branch your content reads (**the real integration work**)
Wherever the app loads the content for a route, ask the package for a draft first and fall back
to the normal published read:

```ts
const content = (await getDraftContentByPath(path)) ?? (await yourExistingPublishedRead(path));
```

Notes that save adopters a day:
- Pass the **full locale-qualified CMS path**. The package matches drafts on `url.default`,
  which is the only reliable locale discriminator.
- Do **not** route this through a shared cross-request cache. A cache keyed on path is shared
  by all visitors, so caching a draft publishes it.
- Do this for the routed page's own content only. Listings and navigation should stay published:
  a share link previews one item, not the whole site.

### Step 6 — Add the author panel
Render the package's panel in the preview route the CMS points at, passing the `preview_token`
from `searchParams`. It renders nothing when there is no token, so it never appears on the
public site.

### Step 7 — Add the "unpublished draft" banner
Render the package's banner (or your own) when Draft Mode is on, with an exit link. Localize it
if the site is multilingual.

### Step 8 — Verify
The acceptance test that actually catches bugs:
1. Edit an item in the CMS and **save without publishing**.
2. Click "Share with a stakeholder", create a link.
3. Open it in a **private window** (no CMS session).
4. Assert the page shows **the edit you made**, and the normal public URL **does not**.
5. Browse to a different page with the same link active: it must show published content.
6. Repeat all of the above in a **second locale**.

Testing that the page merely loads will pass even when the module is completely broken. See the
"what broke" notes in `docs/PREVIEW-WORKFLOW.md` for why.

---

## 5. Open questions to settle before building

1. **Scope/ownership** — who maintains and publishes it, and under what npm scope? This
   determines whether it can be recommended to clients.
2. **Optimizely's roadmap** — if SaaS CMS gains UI extensibility, the author panel should move
   into the CMS proper. Worth asking Optimizely before investing in the iframe approach.
3. **Per-user attribution** — the preview token identifies a session, not a person. Closing that
   gap needs something the CMS does not currently expose. Ship documented, revisit later.
4. **Link revocation** — currently only "rotate the signing secret", which invalidates all links.
   A revocation list needs storage, which turns a zero-infrastructure module into one with a
   database dependency. Probably an optional adapter rather than core.
5. **Framework adapters** — is there demand beyond Next.js? Do not build Nuxt/SvelteKit adapters
   speculatively; keep the core framework-free so they are cheap if asked for.
6. **Naming and licensing** — Apache-2.0 matches the Optimizely SDK ecosystem.

---

## 6. Rough effort estimate

| Task | Estimate |
|---|---|
| Extract core into a package, framework-free, with tests | 2 to 3 days |
| Next.js adapter (routes, Draft Mode helpers, proxy helper) | 1 to 2 days |
| React author panel, unstyled/themeable | 1 day |
| README + this integration guide + API docs | 1 day |
| Reference repository | 1 to 2 days |
| Claude Code skill | 1 day |

Call it **1.5 to 2 weeks** for a credible `0.1.0` plus reference app. The logic is proven and
the gotchas are documented, so most of that is packaging discipline rather than discovery.
