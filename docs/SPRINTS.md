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
- [ ] **S1.2 — Connect CMS + Graph** 🟢
  Tasks: you fill `.env` with dev-CMS credentials; `optimizely-cms-cli login`; run dev; one real
  Graph query. Deliverable: local app renders content from your dev CMS. Exit: a page loads real
  CMS data; a Graph query returns items.
- [ ] **S1.3 — Verify Visual Builder + live preview** 🟡
  Tasks: use the **`optimizely-preview` skill**; configure the CMS Application → preview at local
  HTTPS; confirm click-to-edit. Deliverable: editing content in CMS shows in preview. Exit: live
  preview refresh works; no blank-screen/communication/CSP errors.
- [ ] **S1.4 — Deploy to Vercel** 🟢
  Tasks: import repo to Vercel (Hobby); set env vars; deploy; wire the Graph publish webhook →
  revalidation route. Deliverable: prod + preview URLs live. Exit: a publish in CMS revalidates
  the live page.
- [ ] **S1.5 — Blog #2 outline** (official-SDK setup & gotchas). 🟢
- 🏁 Phase-1 done = official-SDK baseline verified end-to-end + deployed; ARCHITECTURE.md updated
  with the real scaffold + SDK APIs.

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

## 🚦 Phase 3 — Optimizely superpowers  _(ask before starting)_
- [ ] **S3.1 — Stakeholder preview-link module** (the headline feature) 🔴
- [~] **S3.2 — Semantic search** (autocomplete, synonyms, boosting, facets) 🔴
  ✅ **Core shipped:** `/search` — server-rendered, URL-driven (`?q=`), one federated Graph query
  across POI/Event/Area with `_ranking: SEMANTIC`, results grouped by type, `noindex`, breadcrumbs,
  header entry point. Verified semantic (not keyword) matching: "skyscraper" → Burj Khalifa,
  "fish tank" → The Dubai Mall. See `src/lib/search.ts` + AI-SEARCH.md §"What shipped".
  ⏭ **Still to do:** autocomplete, synonyms dictionary, boosting/date-decay, facets on results,
  and pagination of results.
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
