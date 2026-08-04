# Sprints — This is Dubai

_Small, credit-efficient sprints. Each sprint has a single clear goal, a short task list, a
concrete **deliverable**, and an **exit check**. **I always ask before starting a new phase.**_

## Credit discipline (how we keep cost low)
- One sprint at a time; stop at the exit check and summarize briefly.
- Reuse the research/docs already produced — no re-fetching what we know.
- Targeted edits over full rewrites; batch independent work; avoid redundant re-reads.
- Detail the **current + next** sprint; keep later sprints as light headlines until they're up.
- Verify with the cheapest sufficient check (typecheck/lint/one query) before moving on.
- **Effort tags:** 🟢 small · 🟡 medium · 🔴 large (large sprints get split further when reached).

Legend: `[ ]` todo · `[~]` in progress · `[x]` done · 🚦 = phase gate (I ask you before starting).

> **▶ Resume order — start here next (in this order):**
> 1. **S3.1a — Preview access hardening (Internal-default)** — the immediate next sprint.
> 2. **TTD-2 — Author the Things-to-Do pages** — after S3.1a.
>
> Both are "ask before starting" per the standing rule.

---

## Phase 0 — Foundations 🟢 (planning)
- [x] Kickoff decisions, research, and the full planning doc set.
- [x] SDK decision: **official `@optimizely/cms-sdk`** (demo = reference); skills via marketplace.
- [x] **S0.1** Draft blog post #1 ("building in the open") → `blog/01-building-this-is-dubai-in-the-open.md`. 🟢
- [x] **S0.2** Add the **Optimizely CMS Skills** — installed to `~/.claude/skills/` (all 4:
  setup/model/model-react/preview). 🟢

## 🚦 Phase 1 — Scaffold & baseline running  _(ask before starting)_
Goal: a fresh official-SDK Next.js app runs locally against your dev CMS and deploys to Vercel,
with Visual Builder + live preview confirmed working — **before** we add This is Dubai specifics.

- [x] **S1.1 — Scaffold with the official SDK** 🟡 ✅
  Scaffolded `nextjs-starter` (Next 16.2.1, React 19.2, `@optimizely/cms-sdk` 2.1) into the repo
  root; added `.env.example`, `type-check`/`opti-*` scripts, gitignore updates; documented the real
  structure in ARCHITECTURE.md §2/§5. **Exit met:** `npm run type-check` + `npm run build` clean.
- [x] **S1.2 — Connect CMS + Graph** 🟢 ✅
  `.env` filled with dev-CMS credentials; the app renders real content from the dev CMS via Graph
  (home experience, all section listings, detail pages). **Exit met:** pages load real CMS data;
  Graph queries return items across every content type.
- [x] **S1.3 — Verify Visual Builder + live preview** 🟡 ✅
  CMS Application configured for preview at local HTTPS; on-page editing + live preview confirmed
  working. The stakeholder-preview module (S3.1) is built directly into this preview pane. **Exit
  met:** live preview refreshes on edit; no blank-screen/communication/CSP errors.
- [ ] **S1.4 — Deploy to Vercel** 🟢 _(deferred — see note)_
  Tasks: import repo to Vercel (Hobby); set env vars; deploy; wire the Graph publish webhook →
  revalidation route. Deliverable: prod + preview URLs live. Exit: a publish in CMS revalidates
  the live page.
  ⏸ **Deliberately deferred.** We build the complete site locally against the SaaS CMS first, then
  deploy to Vercel once it's feature-complete. The revalidation route (`/api/revalidate`) is already
  built and waiting; deploying is a config step, not a code step.
- [ ] **S1.5 — Blog #2 outline** (official-SDK setup & gotchas). 🟢
- 🏁 Phase-1 baseline **verified end-to-end locally** (SDK scaffold + CMS/Graph + live VB preview);
  ARCHITECTURE.md updated with the real scaffold + SDK APIs. Vercel deploy (S1.4) is the one
  remaining item, intentionally held until the site is complete.

## 🚦 Phase 2 — Content model + multi-page site  _(ask before starting)_
Goal: This is Dubai content types, the luxury design system, and all page templates — a real
multi-page site. 🔴 → split into these sprints:

- [x] **S2.1 — Design foundation + layout primitives** 🟡 ✅
  Tailwind v4 + tokens (light/dark via `@theme inline`), Fraunces + Hanken Grotesk (`next/font`),
  `<SectionShell>`/`<Container>`/`<Grid>`/`<Wordmark>`, `/styleguide`. **Exit met:** styleguide
  renders; grid + light/dark theming verified in-browser; build/type-check/lint green.
- [x] **S2.2 — Content types (data) in CMS** 🟡 ✅
  9 code-first types in `src/components/content/` (SeoMetadata contract + Category, Area,
  PointOfInterest, Event, Article, Tour, Hotel, Itinerary), pushed via `config push`. Config glob
  retargeted to `content/` so demo types aren't recreated. **Exit met:** all 9 verified in CMS via
  `config pull`. (Graph exposes `_<Type>` after schema propagation ~minutes + once content exists.)
- [x] **S2.3 — VB sections + first components + display templates** 🟡 ✅
  `LayoutDisplayTemplate` (theme/width/spacing = the Light/Dark + Full/Container controls) +
  `Hero` (key `HeroBanner`) + `SectionHeading` + `RichTextBlock`, all wired to `<SectionShell>`
  from `displaySettings`; pushed (13 types + 1 template); build/type-check green. Blocks under
  `src/components/blocks/`; glob + layout.tsx registrations updated. `POICardGrid` moved to S2.5
  (data-driven cards; build with real seed content). **Verify-in-VB** needs S1.3 live preview + S2.4.
- [~] **S2.4 — Home page experience** 🟡 _(code done; CMS authoring is the user's step)_
  ✅ `HomePage` `_experience` type (extends SEO) + React component (`OptimizelyComposition`),
  pushed; `/` renders the published Home via `getContentByPath('/')` with a graceful fallback.
  ⏭ **User (CMS UI):** create the "This is Dubai" application (host `localhost:3000`, HTTPS, preview
  tokens) + a Home experience as its start page (our API key can't create content/apps —
  Forbidden). Then compose it in VB → completes S1.3 (live preview) + verifies the display settings.
- [ ] **S2.5 — Listing pages + faceting** (Places/Events/Articles/Tours/Hotels) + **`POICardGrid`**
      VB block (data-driven cards, image/URL binding solved with real content) 🟡
- [ ] **S2.6 — Detail pages** per type 🟡
- [ ] **S2.7 — SEO helpers** (`buildMetadata`, `buildJsonLd`, sitemap, OG images) per SEO.md 🟡
- [ ] **S2.8 — Seed content + royalty-free imagery + `ASSETS.md`** 🟡
- [ ] **S2.9 — Blog #3 + #4 outlines** (content modeling; SEO/JSON-LD) 🟢
- 🏁 Phase-2 done = full site renders from CMS, styled, SEO on every page.

## 🚦 Phase 2.5 — Content at scale  _(in progress)_
_Rationale: search relevance, facets and pagination can't be judged on 16 items. Everything
downstream (semantic search tuning, AI retrieval, the MCP server) needs a realistic corpus._

> **Sourcing rule.** Content here is **originally authored**. visitdubai.com and similar
> destination sites are the official tourism authority's copy and imagery — off-limits per
> ASSETS.md, and their sites block automated access anyway (403 + `robots.txt`). Place names,
> coordinates, opening hours and price bands are *facts* and are used descriptively.

- [x] **SC1 — Depth in the live sections** ✅
  101 Places to Visit · 19 Neighbourhoods · 20 Events · 24 Tags, all with authored rich-text
  bodies. Body renderers added to POI/Event/Area detail pages (`<Prose>`); seed refactored to
  `scripts/data/`; `npm run asset-manifest` generates the CMP upload manifest.
- [x] **SC2 — Articles section** ✅ _(code end-to-end; content is a later pass)_
  Built and registered: `ArticlePost` shared block + `Articles` `_experience` + `ArticleDetail`,
  `articleHref` routing, card + listing wiring, nav entry. Content so far is the first "guides"
  batch only (`scripts/data/articles/`); growing toward the ~100 long-form target is a content
  pass, not code.
- [~] **SC3 — "Things to Do" campaign** (Visual Builder) 🔴 — _reconceived_
  **Not** a new `Tour` listing (the earlier plan). It's a curated **campaign over existing
  content**: a landing page plus themed sub-pages (New & Trending, Dubai Attractions, Arts &
  Culture, Wellness), each pulling tagged Places/Events/Articles, with a video hero and reusable
  highlight cards. Routed by the existing `[...slug]` catch-all — no new Next routes. (The `Tour`
  content type still exists but is not used for this; a Tours listing can come later if wanted.)
  - [x] **TTD-1 — Model + blocks** ✅ (branch `feat/things-to-do-campaign`)
    `ThingsToDoPage` `_experience` + four blocks: **ThingsToDoHero** (YouTube background video;
    owns the page's single `<h1>`), **CuratedContentRail** (source = Latest / By tag /
    Hand-picked across Places/Neighbourhoods/Events/Articles; section-only), **VideoEmbed**
    (inline YouTube with autoplay/mute/loop/start/hide-related + click-to-load facade),
    **HighlightCard** (reusable **shared** block for "For This Application"). Helpers
    `src/lib/youtube.ts` (+9 tests) + `src/lib/curated.ts`. Pushed to the CMS. SEO: hero = the
    only `<h1>`, rails `<h2>`, cards `<h3>`. Type-check/lint/64 tests/build green.
  - [ ] **TTD-2 — Author the pages** 🟡 _(after S3.1a Preview access hardening — ask before starting)_
    A reviewable, **dry-run-first** seed script (USER runs) that creates the 5 `ThingsToDoPage`
    experiences at their URLs + a couple of shared `HighlightCard` blocks; add a "Things to Do"
    nav entry; compose the landing page in Visual Builder; then **browser-verify** (hero video
    plays muted/looped, rails resolve to real cards, single-`<h1>` check, RTL/AR).
  - [ ] **TTD-3 — Imagery + AR + blog** 🟡
    Poster/hero imagery, an AR pass of the new block strings, and a blog outline ("configurable
    campaign pages in Visual Builder" — candidate for BLOG-PLAN).
- [ ] **SC4 — Content quality pass** 🟡
  Tag/facet coverage across the full corpus, `relatedPlaces` cross-links, and a re-verification
  of semantic search + the relevance floor at ~250 items rather than 16.
- [ ] **SC5 — Imagery** 🟡 _(runs in parallel; blocked on uploads)_
  144 CMP folders per `docs/ASSET-MANIFEST.md` → `npm run attach-assets -- --apply`.
- 🏁 Phase-2.5 done = ~250 published items, every image field filled, facets meaningful.

## 🚦 Phase 3 — Optimizely superpowers  _(ask before starting)_
- [x] **S3.1 — Stakeholder preview-link module** (the headline feature) 🔴
  ✅ **Shipped** (branch `feat/stakeholder-preview`). Phase 1 signed tokens
  (`src/lib/preview-token.ts`); Phase 2 share routes + Draft Mode + localized banner + noindex;
  Phase 3 real draft reads (`src/lib/draft.ts`, App key + Secret over HTTP Basic, uncached,
  scoped to one item); Phase 4 **"Share with a stakeholder" button in the CMS preview pane**
  (`src/app/preview/StakeholderLinkPanel.tsx`), authenticated by the CMS `preview_token`
  (`src/lib/cms-preview-token.ts`) so authors never handle a secret.
  Gotchas that cost real time, all written up in `docs/PREVIEW-WORKFLOW.md`: drafts can carry a
  LOWER version number than the published version; version locale metadata is unreliable so
  scope/locale must be matched on `url.default` **per row**; SaaS CMS has no UI extensibility,
  so the preview pane is the only in-CMS surface. Blog drafted
  (`blog/shareable-stakeholder-previews-optimizely-saas.md`), needs screenshots.
- [ ] **S3.1a — Preview access hardening (Internal-default)** 🟡 _(▶ NEXT — resume here)_
  Make preview links **Internal (org-network-only) by default**, Shareable only by explicit
  opt-in. Full design + caveats in `docs/PREVIEW-WORKFLOW.md` §"Access control: org-network-only by
  default". Tasks: a `mode` claim on the signed token (so the URL can't escalate it); an
  IP-allowlist gate in `src/proxy.ts` on `/preview*` (`PREVIEW_ALLOWED_IPS`, `403` off-network,
  trusting only the platform's client-IP hop); an **Internal/Shareable toggle in
  `StakeholderLinkPanel` defaulting to Internal**; tests + in-browser verification. The
  `frame-ancestors` CSP (`next.config.ts`) already shipped as related surface hardening.
- [~] **S3.2 — Semantic search** (autocomplete, synonyms, boosting, facets) 🔴
  ✅ **Core shipped:** `/search` — server-rendered, URL-driven (`?q=`), one federated Graph query
  across POI/Event/Area with `_ranking: SEMANTIC`, results grouped by type, `noindex`, breadcrumbs,
  header entry point. Verified semantic (not keyword) matching: "skyscraper" → Burj Khalifa,
  "fish tank" → The Dubai Mall. See `src/lib/search.ts` + AI-SEARCH.md §"What shipped".
  ✅ **Result type facets** shipped too (branch `feat/search-type-facets`, PR #60): a `?in=` chip
  bar over `/search`, counts from the full result set, zero-JS, `searchFacets`/`filterByType` in
  `src/lib/search.ts`.
  ⏭ **Still to do:** autocomplete, synonyms dictionary, boosting/date-decay, and pagination of results.
- [ ] **S3.3 — AR semantic search + localization showcase** 🟡
- [ ] **S3.4 — Performance + accessibility pass** (CWV, images, a11y) 🟡
- [ ] (optional) **S3.5 — Multisite** 🟡
- 🏁 + Blog #5–#8 outlines.

## 🚦 Phase 4 — AI features (Claude)  _(ask before starting)_
- [ ] **S4.1 — AI Search** (Graph retrieval → Claude → cards) 🔴 — AI-SEARCH.md
- [ ] **S4.2 — AI Trip Planner** (→ `Itinerary`) 🔴
- [ ] **S4.3 — "This is Dubai Concierge" MCP server** (Graph-backed tools; stdio → remote HTTP on
      Vercel / claude.ai connector; reuses the AI retrieval layer) 🔴 — MCP-SERVER.md
- [ ] **S4.4 — AI observability + guardrails** (Langfuse; prompts-as-CMS-content; safety rails) 🟡 — AI-PLATFORM.md
- [ ] **S4.5 — Opal for Arabic translation** (guided) 🟡

## 🚦 Phase 5 — Give back / MVP  _(ask before starting)_
- [ ] **S5.1 — Extract + open-source the preview-link module** 🔴
- [ ] **S5.2 — Publish + MVP retrospective post** 🟢

---

### Sprint ritual
Start: restate the sprint goal + task list. End: run the exit check, summarize what shipped +
what's next, flag any blog trigger, then **stop and ask** before the next sprint/phase.
