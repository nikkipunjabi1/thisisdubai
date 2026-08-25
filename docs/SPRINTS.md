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

## ✅ Phase 0 — Foundations  _(complete)_
- [x] Kickoff decisions, research, and the full planning doc set.
- [x] SDK decision: **official `@optimizely/cms-sdk`** (demo = reference); skills via marketplace.
- [x] **S0.1** Draft blog post #1 ("building in the open") → `blog/01-building-this-is-dubai-in-the-open.md`. 🟢
- [x] **S0.2** Add the **Optimizely CMS Skills** — installed to `~/.claude/skills/` (all 4:
  setup/model/model-react/preview). 🟢
- 🏁 **Phase 0 complete.** Planning docs, the official-SDK decision and the CMS skills are all in place.

## ✅ Phase 1 — Scaffold & baseline running  _(complete)_
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
- [x] **S1.4 — Deploy to Vercel** ✅ _(DEV live, 2026-08-18)_
  Deferred through Phases 2–3 by design (build the site locally against the SaaS CMS first), then
  done as part of the environment pipeline. **Live DEV: https://thisisdubai-dev.vercel.app**
  — Vercel project `thisisdubai-dev` → Instance 1, env vars set, EN/AR routes 200, Graph serving
  real content, RTL correct, absolute canonical + hreflang, 159-URL bilingual sitemap,
  `robots.txt` disallowing all (DEV is never indexed). Two fixes were needed to get there: SDK 2.2
  type compatibility (PR #83) and a missing `APPLICATION_HOST` (documented as a quiet-failure gotcha
  in [ENVIRONMENTS.md](ENVIRONMENTS.md)).
  ⚠️ **One piece of the original exit check is still open:** the Graph publish webhook is not yet
  pointed at the deployed DEV URL, so "publish in CMS revalidates the live page" is proven locally
  but not on Vercel. `/api/revalidate` is built; it needs the CMS webhook target + `REVALIDATE_SECRET`
  set per environment. Tracked as part of the UAT/environment work.
- [x] **S1.5 — Blog #2: official-SDK setup & gotchas** ✅
  The outline was superseded by a full draft, now brought to publish standard:
  `blog/02-optimizely-saas-visual-builder-nextjs-vercel-setup.md` plus the WordPress HTML.
  Covers the five gotchas (registry must mirror the model both ways, no `.env` from the scaffold,
  never configure Graph with a placeholder key, underscore-prefix rules in query field names,
  schema propagation delay) and the toolchain pins. Reworded to **schema-first with definitions in
  source control** rather than "code-first", which is the wrong term on SaaS. Zero em-dashes.
  **Phase 1 is now complete.**
- 🏁 Phase-1 baseline **verified end-to-end locally** (SDK scaffold + CMS/Graph + live VB preview);
  ARCHITECTURE.md updated with the real scaffold + SDK APIs. Vercel deploy (S1.4) landed later,
  with the environment pipeline. **Phase 1 is complete.**

## ✅ Phase 2 — Content model + multi-page site  _(complete)_
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
- [x] **S2.4 — Home page experience** ✅
  ✅ `HomePage` `_experience` type (extends SEO) + React component (`OptimizelyComposition`),
  pushed; `/` renders the published Home via `getContentByPath('/')` with a graceful fallback.
  ✅ **Done:** the application was created in the CMS (and again per environment for DEV/UAT, since
  the application and its hostname are instance configuration and do not promote), the Home
  experience is its start page, and it is composed in Visual Builder. 1 published `HomePage` in each
  of EN and AR.
- [x] **S2.5 — Listing pages + faceting** ✅
  Delivered as the reusable **listing engine**: section pages are Visual Builder experiences with a
  droppable `SectionListing` block (server-side pagination, sort, faceted filters), plus
  `POICardGrid` for data-driven cards. Search carries type facets via `?in=`.
- [x] **S2.6 — Detail pages per type** ✅
  Routed through the `[locale]/[...slug]` catch-all rather than one route per type, with a dedicated
  route for dated article URLs. Renderers exist for PointOfInterest, Area, Event and ArticlePost.
- [x] **S2.7 — SEO helpers** ✅
  `src/lib/seo.ts` provides `getSiteSettings`, `buildPageTitle`, `buildContentMetadata`,
  `localeAlternates` and `getSitemapPaths`, plus `src/app/sitemap.ts` and `robots.ts`. JSON-LD ships
  as a `<JsonLd>` component used by the detail types and breadcrumbs. _(The names differ from the
  `buildMetadata` / `buildJsonLd` sketched here originally; the capability is the same.)_
  Verified live: JSON-LD and `og:image` present, 159-URL bilingual sitemap.
- [x] **S2.8 — Seed content + royalty-free imagery + `ASSETS.md`** ✅
  `ASSETS.md` and `docs/ASSET-MANIFEST.md` in place; the CMP/DAM pipeline (source → upload → attach)
  is scripted. 187 published items per locale.
- [x] **S2.9 — Blog #3 + #4 outlines** ✅
  `blog/03-content-modeling-pages-experiences-components.md` and
  `blog/04-server-rendered-seo-jsonld.md`.
- 🏁 **Phase 2 complete.** The full site renders from the CMS, styled, with SEO on every page.

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

- [ ] **S3.12 — Commerce feature + "ready-made theme" — is there a product here?** 🔵 _(brainstorm)_
  **The idea.** Two related but separable ambitions:
  1. **A Commerce feature** — Product listing + detail pages and **Stripe** checkout, shipped as an
     *optional, toggleable feature* on top of the starter kit: content types, blocks, display
     templates and routes that someone enables and configures rather than builds.
  2. **A ready-made Optimizely SaaS theme** — enough polished, drag-and-drop components and page
     templates that a team can compose real pages in Visual Builder and go live in days.

  **Is it worth it? An honest read.** The theme half is the stronger idea and is *already most of the
  way there* — we have a design system, a display-template system, a content-block library with
  author-first naming, a listing engine, bilingual + RTL support, SEO and preview. Packaging that is
  a genuine gap in the Optimizely SaaS ecosystem, where most public examples are thin scaffolds.
  It also composes perfectly with the [S3.11] starter kit: the kit installs it, the theme is what
  you get.

  The commerce half is the riskier one, and worth being clear-eyed about before committing:
  - **Optimizely already sells Configured Commerce.** A Stripe side-door is a demo pattern, not a
    recommended architecture. Position it as "here is how you wire an external payment provider to
    a headless SaaS CMS", never as a commerce platform.
  - **Payments raise the stakes.** Real money means PCI scope, webhooks, idempotency, refunds, tax,
    order state that does **not** belong in the CMS. The honest scope is **Stripe Checkout / Payment
    Links** (Stripe hosts the payment page, we never touch card data) with the CMS owning the product
    *catalogue* only.
  - **Never bundle live keys or a live-mode default.** Test mode only, out of the box.

  **Questions to settle in the brainstorm:**
  - One deliverable or two? (theme first, commerce as an add-on, is the likely answer)
  - What is the smallest commerce slice that teaches something real — catalogue + Checkout, and
    where does order/inventory state live?
  - Is "feature toggle" a build-time flag, a separate package, or just content types you can decline
    to push? What does *not* installing it look like?
  - How many components make a theme feel complete without becoming a maintenance burden?
  - Distribution + versioning: how does someone take an update after they have customized it?

  **Dependency:** this sits on top of [S3.11] — build the starter kit first, then the theme it
  installs, then commerce as an optional feature. Do not start it in parallel.

  **Blog trigger:** yes, and probably the strongest MVP artefact of the whole project.

- [ ] **S3.13 — Make all site copy CMS-manageable (no hardcoded strings)** 🟡
  _(scheduled: **after** the UAT setup and the promotion blog are done)_
  Spotted on a fresh instance, where an unpopulated site exposes every string the code supplies
  rather than the CMS. Editors should be able to change any visible text without a deploy.

  **Audit first — the strings fall into three groups, and they are not all the same problem:**

  1. **Genuinely hardcoded copy that should move to the CMS.** The footer description, the
     unofficial-demo disclaimer and the copyright line live in `src/lib/messages.ts`. These are real
     site copy and belong on `SiteConfiguration` (already the home of `siteName`, `titleTagline`,
     the nav and the cookie/announcement text), localized per language.
  2. **UI chrome** — button labels, "Search", pagination, filter labels, aria-labels. Also in
     `src/lib/messages.ts`. Arguably these are *correctly* in code: they are product UI, not
     editorial content, and moving hundreds of micro-labels into the CMS creates an editing surface
     nobody wants to maintain. **Decide deliberately, per string, and write the rule down.**
  3. **Fallbacks that CANNOT come from the CMS.** `src/app/[locale]/page.tsx:54` renders
     "This is Dubai — coming together / The Home experience isn't published yet" when nothing is
     published. By definition this cannot be read from the CMS, because the CMS is what is empty.
     The fix is not to make it editable; it is to make it a **deliberate, presentable empty state**
     rather than developer scaffolding leaking to visitors — and, on a public environment, to
     consider whether it should be a 404 instead.

  **Tasks:** sweep the codebase for user-visible literals; classify each into the three groups;
  move group 1 onto `SiteConfiguration` (localized, `opti-push`) with the current text as the
  fallback default; redesign group 3's empty state; document the rule ("what belongs in the CMS vs
  what belongs in `messages.ts`") in COMPONENT-STANDARDS.md so it does not drift back.

  **Exit check:** on a freshly-seeded instance, every string a visitor can read is either editable in
  the CMS or a consciously-designed fallback — nothing is accidental developer copy.

  **Note:** this also directly improves [S3.11] (the starter kit) and [S3.12] (the theme). Anyone
  installing the kit gets an empty instance first, so what they see in that state *is* their first
  impression of the product.

- [ ] **S3.14 — Optimizely Forms on a headless build** 🟡 _(scope to be agreed)_
  The site has no forms yet, and any real project needs them (contact, enquiry, newsletter,
  campaign sign-up). Optimizely Forms supports headless use: a Forms Service API exposes the form
  structure, accepts submissions, and lists submitted data, with submissions viewable in the CMS and
  exportable to XLSX / CSV / JSON / XML.

  **The work is mostly on our side.** The CMS defines the form; the front end has to render it,
  validate it, submit it, and handle the response. Open questions before we start:
  - Render forms dynamically from the form definition, or hand-build components per form?
  - Where do submissions go: Forms storage only, or also a webhook / CRM / email?
  - Spam handling, and whether that conflicts with the no-CAPTCHA-for-accessibility position.
  - Multi-step forms, and whether we need them for this site.
  - EN + AR: labels, validation messages, and RTL layout for inputs.
  - Server-side validation and rate limiting on the submit path.

  **Exit check:** a working, accessible, bilingual form on the site, submissions visible in the CMS.

- [ ] **S3.15 — Corporate directory sign-in (Entra ID / AD) via Opti ID** 🟡 _(config + Optimizely Support, not a dev sprint)_
  Let CMS users sign in with their corporate identity instead of separate Optimizely accounts, and
  let group membership drive access. Handled through **Opti ID**, Optimizely's identity layer, so
  this is expected to be configuration and a support request rather than development. ("AD" here
  means **Microsoft Entra ID**, formerly Azure AD, which is what most organisations now mean by it.)

  **Raise with Optimizely Support to confirm before planning:** which identity providers and
  protocols are supported on our plan, whether group or role mapping is included or manual, what
  Optimizely configures versus what we do, and the lead time.

  **What we need ready on our side:** an identity admin who can register the application and consent
  to it, the tenant details, and an agreed mapping from directory groups to CMS roles. Decide the
  mapping before the call; it is the part that actually takes discussion.

  ⚠️ **Per instance, not promoted.** Identity is **instance configuration**, the same category as
  enabled languages and the application hostname (see [ENVIRONMENTS.md](ENVIRONMENTS.md)), so it has
  to be set up separately on DEV, UAT and PROD. Nothing carries it across, and non-production
  environments are the ones people forget until someone cannot log in.

  Also agree the break-glass path: at least one local administrator account that still works if the
  identity provider is unreachable.

  **Exit check:** a directory user signs in to the CMS with their corporate credentials and lands
  with the right permissions, on each configured environment.

- [ ] **S3.16 — Redirects module for a headless SaaS migration** 🔵 _(later stage; design first)_
  Nothing to do for this demo, but essential on any real migration project, and a strong candidate
  for a reusable module alongside [S3.11] / [S3.14].

  **The constraint that shapes it:** on a headless build the CMS never sees the request. A visitor
  hitting `/old-page` reaches Vercel and Next.js, not Optimizely. Redirects are therefore ours to
  own at the edge. The familiar PaaS add-ons (Geta NotFoundHandler, RedirectManager) are .NET
  modules that plug into the ASP.NET pipeline, so they cannot be used on SaaS at all. Assume nothing
  out of the box for legacy-URL redirects.

  **Proposed shape:**
  - A `Redirect` content type pushed with `opti-push` (from, to, 301/302, enabled, notes) so
    marketing can manage the list in the CMS after go-live.
  - Edge middleware checking an in-memory map, refreshed on publish through the existing
    revalidation webhook. Must be O(1) and must not add latency to normal requests. Do not query
    Graph per request, and do not put a large list in `next.config` (build times suffer).
  - A bulk CSV import script, idempotent. Nobody hand-types four thousand redirects.
  - A 404 fallback resolver for the tail we did not anticipate.

  **Migration realities to plan for:** source the list from the old CMS, a crawl, Search Console and
  analytics (analytics tells you which 200 URLs of 4,000 actually matter); flatten chains and kill
  loops before launch; decide how legacy URLs map onto our `/en` and `/ar` prefixes; normalise
  trailing slashes, case and query strings; do not bulk-redirect the tail to the homepage (Google
  treats it as a soft 404); keep redirects at least a year.

  **Exit check:** an automated test that walks the old-URL list and asserts each returns a 301 to a
  URL returning 200, with no chains. Run in CI before cutover and on a schedule afterwards. Same
  principle as `verify:content`: prove it with a command, not an opinion.

- [ ] **S3.17 — Personalization and Experimentation** 🟡 _(design decisions first)_
  Integrate the site with Optimizely's personalization and experimentation capability so we can
  target content and run tests. Anticipated from the start: `.env.example` already reserves
  `OPTIMIZELY_FX_SDK_KEY` and `OPTIMIZELY_FX_ACCESS_TOKEN`.

  **Decide which product, and where it runs.** These are not interchangeable on a headless build:
  - **Feature Experimentation (SDK)** can be evaluated **server-side** in RSC, so the visitor is
    bucketed before the HTML is produced. No flash, no layout shift.
  - **Web Experimentation (client-side snippet)** mutates the page after it loads. On an SSR site
    that means flicker (flash of original content) and a Core Web Vitals hit, which would undo the
    performance work already shipped. If it is needed, it needs a deliberate anti-flicker strategy.
  - **CMS-side audiences** are a third option worth checking: the SaaS import summary lists
    audiences as a first-class object, so Visual Builder may support audience-targeted variations
    without any SDK. Confirm what is actually supported before designing around it.

  **The hard part is caching, not targeting.** Every page is currently cached and largely static.
  A personalized page cannot be served from a shared cache keyed only on URL, or visitor A gets
  visitor B's variant. Options to weigh: cache per variant (cache key includes the bucket), keep
  personalization to islands that render client-side inside an otherwise cached page, or move the
  decision to the edge. Pick this before building anything; it shapes everything else.

  ⚠️ **Depends on cookie consent, which is currently a skeleton.** [S3.7] added the cookie-consent
  fields to `SiteConfiguration` but the front-end banner was never built. Behavioural targeting
  should not ship without working consent, so that banner becomes a prerequisite rather than a
  nice-to-have.

  **Also settle:** what the first real experiment is (a feature with no hypothesis is just extra
  complexity), how variants are authored (CMS content vs code), how results are read, and whether
  personalization applies per locale (an EN experiment may be meaningless for AR visitors).

  **Exit check:** one server-side experiment live on DEV with variants correctly bucketed, no
  flicker, no measurable CWV regression, and caching still behaving.

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
