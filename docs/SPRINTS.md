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

> **▶ Resume order — start here next:**
>
> _Done & merged:_ S3.1a preview access hardening (PR #68/#69), TTD-2 authored the
> Things-to-Do pages (PR #70), S3.6 CMS-editable navigation (PR #74), S3.7 Site Settings
> tabs + Cookie/Announcement skeletons (merged), fix: hide Nav data components from the
> picker (PR #76).
>
> _In review:_ **S3.8 content-block library** (branch `feat/content-block-library`) — five new
> author-first blocks (Two Column Text, Text and Image, Text and Video, Quote, Callout) + the
> COMPONENT-NAMING.md best-practices doc, for the "Component Naming Conventions" blog. **Needs
> `opti-push`** (push before the app serves pages — see S3.8 rollout note). After push, capture the
> two CMS screenshots for the blog (picker list + a block editor field set).
>
> **Waiting on user CMS content, then verify (do not lose these):**
> - **`/ar` (RTL) navigation** — user populates the Arabic header/footer nav + language
>   labels; then verify dropdown direction, footer columns, and the "English" switcher in RTL.
> - **Footer columns** — user adds links (currently headings only, so the footer falls back
>   to the built-in default column until links exist).
>
> **Next, in order:**
> 1. **Announcement Bar + Cookie Consent Banner front-end** — the CMS fields exist (S3.7,
>    skeleton); build the front-end components that render them. Ask before starting.
> 2. **Publish the stakeholder-preview blog** — copy final; a SINGLE combined post
>    (`blog/shareable-stakeholder-previews-optimizely-saas.md`); pending the CMS-editor
>    screenshots before posting.
> 3. **TTD-3 — Imagery + AR + blog** — finish the campaign (hero videos/posters on all 5 pages,
>    HighlightCards onto the landing, AR content for RTL, browser-verify, campaign blog).
>
> "Ask before starting" per the standing rule.

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
  - [x] **TTD-2 — Author the pages** ✅ (branch `feat/ttd-2-author-things-to-do`, PR #70)
    `scripts/create-things-to-do.mjs` (dry-run-first, idempotent, USER-run) created the 5
    `ThingsToDoPage` experiences (landing + New & Trending / Dubai Attractions / Arts & Culture /
    Wellness) with a starter Hero + Curated Rails canvas, plus 3 shared `HighlightCard` blocks
    under "For This Application"; added the "Things to Do" nav entry (en/ar). Needed
    `HomePage.mayContainTypes += ThingsToDoPage` (landing under Home) and
    `ThingsToDoPage.mayContainTypes += ThingsToDoPage` (sub-pages nest for `/things-to-do/*` URLs).
    Browser-verified: single `<h1>` per page, rails resolve to real cards, all 5 URLs + `/ar`
    twins resolve. Also fixed the Video Hero to size container-relative (not `vh`) so it no longer
    balloons in the Visual Builder preview iframe.
  - [ ] **TTD-3 — Imagery + AR + blog** 🟡 _(the campaign finish — ask before starting)_
    Hero videos + poster imagery on all 5 pages, HighlightCards placed on the landing in VB, an AR
    pass of the new block strings, browser-verify + RTL, and a campaign blog ("configurable
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
- [x] **S3.1a — Preview access hardening (Internal-default)** ✅
  Preview links are now **Internal (org-network-only) by default**, Shareable only by explicit
  opt-in. Full design + caveats in `docs/PREVIEW-WORKFLOW.md` §"Access control: org-network-only by
  default". Shipped: a `mode` claim on the signed token (defaults to `internal`, so the URL can't
  escalate it — `src/lib/preview-token.ts`); an edge IP-allowlist gate in `src/proxy.ts` +
  `src/lib/preview-access.ts` (`PREVIEW_ALLOWED_IPS`, `403` off-network, enforced at link
  consumption **and** on every draft page view; fail-safe when the list is empty; loopback/local
  dev allowed); an **Internal/Shareable toggle in `StakeholderLinkPanel` defaulting to Internal**;
  and `mode` on the machine `/api/preview/share` route. Unit tests (`preview-access.test.ts`,
  `preview-token.test.ts`) + an end-to-end proxy matrix (7 cases). The `frame-ancestors` CSP
  (`next.config.ts`) shipped earlier as related surface hardening.
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
- [x] **S3.6 — CMS-editable navigation** ✅ (branch `feat/cms-editable-navigation`, in review)
  Header + footer nav are now edited in **Site Settings → Navigation**, no code/deploy.
  Model (`src/components/content/Navigation.tsx`): `NavLink` / `NavMenuItem` (with `children`
  = a dropdown → the header **mega menu**) / `NavGroup` (footer column), all inline
  `component` lists inside `SiteConfiguration` so the whole nav lives in one block. Links
  target a **page picked from the content tree** (contentReference), resolved to a
  locale-correct href at render (`src/lib/navigation.ts` → `toAppPath`), so links survive
  page moves/renames; `externalUrl` is the off-site escape hatch. Also added: a **search
  on/off toggle** (`showSearch`) and a **single-language switcher** whose label comes from
  each language's `languageSwitchLabel` (EN shows "العربية"/your value, AR shows "English").
  Accessible dropdown (`PrimaryNav`, hover + focus + Escape). Falls back to the built-in nav
  when unconfigured. Verified live on `/en` (dropdown, search hidden, CMS switcher label).
  Merged as **PR #74**. **Still pending (user CMS content, then verify):** `/ar` (RTL) nav +
  labels; footer column links (headings only so far → footer falls back to default).
- [x] **S3.7 — Site Settings tabs + Cookie/Announcement skeletons** ✅ (merged)
  Split the Site Settings "Navigation" tab into **Top Navigation** (headerMenu, showSearch,
  languageSwitchLabel) and **Footer** (footerGroups). Added two **skeleton-only** tabs on
  `SiteConfiguration` (fields authored in the CMS now, **no front-end yet**):
  **Cookie Consent Banner** (enabled, message, accept/decline labels, policy link label +
  policy page) and **Announcement Bar** (enabled, message, tone info/success/warning/critical,
  link label + link page, dismissible). Property groups declared in `optimizely.config.mjs`.
  **Follow-up sprint:** build the front-end components that render the cookie banner + the
  announcement bar (the fields are ready; the rendering is not built).
- [x] **S3.8 — Content-block library (author-first naming)** ✅ (branch `feat/content-block-library`)
  Added five new page content blocks with plain-English, author-first names, to round out the
  library and back the "Component Naming Conventions" blog: **Two Column Text**, **Text and Image**
  (image left/right = a `layout` variant), **Text and Video** (same, with a YouTube field),
  **Quote** (pull quote + optional attribution/role), **Callout** (heading + body + `tone` variant).
  **Rich Text** already existed. All are `_component` (`sectionEnabled` + `elementEnabled`), grouped
  under `content`, with minimal but functional server renders (SectionShell + Prose). Registered in
  `src/app/layout.tsx` (both registries); `tsc` + `opti-push --dryRun` clean.
  Deliberately KEPT the names **Highlight Card** and **Curated Content** (shipped, clear in-picker;
  renaming is a breaking migration for no gain) — documented in COMPONENT-NAMING.md.
  Also added the best-practices doc **docs/COMPONENT-NAMING.md** + a §13 summary in
  OPTIMIZELY-BEST-PRACTICES.md.
  **Requires `opti-push`** to create the 5 types in the CMS (may need `--force`; safe, no data lost).
  ⚠️ **Rollout order:** the app now queries these 5 types, so **push before the app serves pages** or
  experience queries 400 on the unknown types (the documented registry↔Graph coupling, §12).
  **Follow-up sprint (UI polish, later):** the renders are intentionally minimal; refine spacing,
  typography, and the Callout tones to the design system when we do a content-block visual pass.
  **User action for the naming blog:** after push, capture CMS screenshots — (1) the "Add Section"
  picker showing the clean content-block names in a list, and (2) a block editor field set (e.g.
  Text and Image showing the Layout dropdown; Callout showing Tone).
  **✅ Blog SHIPPED** (2026-08-15): "Component Naming Conventions for a CMS Website" published to the
  personal WordPress; final HTML archived at `blog/component-naming-conventions-cms-website.html`.
  All 5 screenshots captured + wired. Also proved (and documented in §12 / COMPONENT-NAMING.md) that
  Optimizely SaaS has **no component-picker thumbnail** — the CMA rejects a thumbnail field on push.
- 🏁 + Blog #5–#8 outlines.
- [x] **S3.9 — AR localization operations + code-first enablement** ✅ (branches
  `feat/ar-nav-localization-code-first` PR #78, `feat/ar-slug-alignment`)
  Operational tooling + fixes uncovered while the user runs the L6 AR translation in the CMS:
  - **Nav model per-language:** `SiteConfiguration.headerMenu` + `footerGroups` set `isLocalized`
    (localize the LIST, not the nested block); `opti-push --force`. EN nav intact; AR falls back to
    the localized default nav. See LOCALIZATION.md (L6).
  - **`npm run publish:ar`** — bulk-publish every AR draft in one pass (dry-run by default).
  - **`npm run align:ar-slugs`** — align AR URL segments to EN (fixes the auto-generated-slug 404,
    e.g. `/ar/neighbourhoods/al-marmoom` was 404). Run as the last step of a translation batch.
    Applied live: 20 leaf pages realigned; 5 VB campaign pages remain WIP.
  - Two gotchas documented (OPTIMIZELY-BEST-PRACTICES.md §12 + LOCALIZATION.md): AR slug auto-divergence;
    never machine-translate enum/select values (`places`→`أماكن` etc. fails validation).
  - **Team enablement:** "Code-First Content Modeling in Optimizely SaaS" — blog + diagram + PPT under
    `blog/` (`code-first-content-modeling.html`, `assets/code-first-diagram.png|svg`,
    `assets/code-first-content-modeling.pptx`).
  - **`scripts/README.md`** — plain-language index of all scripts (for PMs/BAs); README + CONTRIBUTING
    now enforce keeping it in sync.

## 🚦 Phase 3.5 — Search relevance  _(before any AI work)_

- [ ] **S3.10 — Semantic search relevance tuning** 🟡 _(next sprint; user-guided)_
  **Why it comes before Phase 4:** the AI features (S4.1 AI Search, S4.2 Trip Planner, S4.3 MCP
  server) all sit on top of the same retrieval layer. Feeding a weak result set into Claude just
  produces confident answers built on irrelevant content, so retrieval quality is a prerequisite,
  not a follow-up.

  **The symptom.** A natural-language query returns results with no relevance at all. Reference case:
  > `where can I see the world's tallest hotel in Dubai?`
  returns Events, which have nothing to do with the question.

  **Likely root cause (to confirm during the sprint).** `src/lib/search.ts` issues ONE federated
  query with a **separate sub-query per type** (`places` / `events` / `neighbourhoods` / …), each
  with its own `limit`. Every type therefore returns its own top-N *whatever the query is* — there
  is no cross-type relevance floor and no cross-type ranking. Scores are also not comparable across
  types, because Graph normalizes BM25 per index (already noted in the file's header comment). The
  result: an unrelated Event can outrank the actual answer purely because it was the best Event.

  **Candidate levers** (evaluate, do not assume):
  - A **score threshold / relevance floor** per group, so a type contributes nothing when nothing clears the bar.
  - Tune `_semanticWeight` (currently `SEMANTIC_WEIGHT = 0.5`) — the BM25 ↔ semantic blend.
  - **Cross-type ranking** — normalize per-type scores before interleaving, instead of concatenating groups.
  - **Query understanding** — strip question scaffolding ("where can I see…") before it reaches `_fulltext`.
  - **Field weighting / indexing** — make sure the fields that actually answer questions are the searchable ones.
  - Revisit **which types belong in a general search** at all.

  **Exit check:** the reference query returns hotel/POI content and **zero irrelevant Events**;
  a small regression set of EN + AR queries passes; no drop on the queries that already work today.

  **Approach:** the user will guide this one — diagnose against live Graph responses first, change
  nothing until the actual ranking behaviour is observed.

  **Blog trigger:** strong candidate — "why semantic search returns confidently wrong results, and
  how to tune it" is a genuinely under-written topic and pairs naturally with the AI-search post.

- [ ] **S3.11 — "This is Dubai" as a starter kit / reusable library** 🔵 _(brainstorm first, then build)_
  **The idea.** Someone clones the repo, fills in a handful of environment variables, runs **one
  command**, and ends up with a fully working Optimizely SaaS CMS instance: content types pushed,
  content items created, EN + AR language variants populated, everything published, and a Next.js
  front end that renders it. A genuine kick-start for anyone learning the SaaS stack, instead of the
  usual empty instance and a blank page.

  Plus a **second command that tears the whole instance back down** (content, then types, and the
  Graph index with it), so people can experiment freely and reset — or keep what they built and
  carry on with it as a real project.

  **Why this is worth doing.** It is the most reusable thing this project could give back to the
  community, and it is a strong MVP artefact. Most of the parts already exist in `/scripts` —
  `seed.mjs`, `create-section.mjs`, `attach-assets.mjs`, `source-images.mjs`, `seo-fill.mjs`,
  `publish-ar.mjs`, `align-ar-slugs.mjs`, `teardown-env.mjs` — but they are a sequence a newcomer has
  to know the order of. This sprint turns that sequence into a product.

  **Open questions to brainstorm (do not pre-decide these):**
  - **Shape:** a template repo ("Use this template"), an npm `create-` initializer, or a
    documented clone + `npm run setup`? Each has different maintenance and versioning costs.
  - **Idempotency + resumability:** the run is long and network-bound. Re-running after a failure
    must not duplicate content. Does it checkpoint, or is every step naturally idempotent?
  - **Ordering:** the model must land before anything queries it, and Graph indexing lags publish.
    Where do the waits go, and how does the script report progress over several minutes?
  - **Imagery:** we cannot ship royalty-free binaries for everyone. Source at setup time, ship a
    small bundled set, or degrade gracefully to placeholders?
  - **Content volume:** the full 187-item corpus, or a representative subset that is fast to
    install and fast to tear down? Possibly a `--full` flag.
  - **Teardown safety — the hard one.** `teardown-env.mjs` is destructive and today is protected by
    four guards that assume *our* setup (a known primary host in `.env`). For a stranger's machine
    the "protected host" concept does not exist. What replaces it? Probably: explicit
    `--confirm-host` typed by hand, a dry run by default, a printed inventory of exactly what will
    be deleted, and a refusal on any instance the setup script did not itself create (a marker item?).
  - **The "keep it" path:** how does someone graduate from sandbox to real project cleanly?
  - **Secrets hygiene:** `.env.example` must make it obvious which keys are needed and which CMS
    API-key scopes to grant — our own key is deliberately Forbidden from creating content
    *instances*, so a setup key needs broader scope. Document that trade-off honestly.
  - **Licensing + branding:** all branding here is original and imagery is royalty-free; a
    redistributable starter kit needs that stated explicitly, plus a clear "unofficial" notice.

  **Exit check:** a clean clone on a fresh Optimizely SaaS instance, with only `.env` filled in,
  reaches a browsable bilingual site in one command — verified by actually doing it on an unused
  instance. Then the teardown command returns that instance to empty.

  **Blog trigger:** yes, and a strong one — a runnable starter kit is the kind of contribution that
  gets used rather than just read.

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
