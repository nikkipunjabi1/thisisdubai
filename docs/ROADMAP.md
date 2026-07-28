# Roadmap — This is Dubai

_Phased plan. Each phase ends with a working, deployable state and (usually) a blog post._

## Phase 0 — Foundations (planning) 🟡 _current_
- [x] Kickoff decisions locked
- [ ] Research digested into OPTIMIZELY-RESEARCH.md + ARCHITECTURE.md
- [ ] Content model drafted (CONTENT-MODEL.md)
- [ ] Design system direction drafted (DESIGN-SYSTEM.md)
- [ ] Repo created on GitHub + Vercel project linked
- **Blog:** _"Why I'm building This is Dubai on Optimizely SaaS — a public learning project."_

## Phase 1 — Baseline running
- [ ] Fork `cms-saas-vercel-demo`, get it running locally against your dev CMS
- [ ] Confirm Graph connection (env vars, a real query returns data)
- [ ] Confirm Visual Builder preview + on-page editing works end-to-end
- [ ] Deploy the untouched fork to Vercel (preview + prod)
- **Blog:** _"Getting Optimizely SaaS CMS + Visual Builder running on Vercel with Next.js"_
  (setup gotchas are gold for the community).

## Phase 2 — This is Dubai content model + multi-page site
- [ ] Define content types in SaaS CMS (PointOfInterest, Event, Article, Tour, Hotel, Area,
      Itinerary, HomePage + listing pages) with `SeoMetadata` on every routable type
- [ ] Define Visual Builder experiences/sections/components per **COMPONENT-STANDARDS.md**
- [ ] Build layout primitives: `<SectionShell>` (theme/width/spacing from `layoutProps`),
      `<Container>`, `<Grid>` (12-col); wire display templates for Light/Dark + Full-Width/Container
- [ ] Seed original demo content (~35 items across types) — royalty-free imagery, `ASSETS.md`
- [ ] Build page templates: Home, Listings (Places/Events/Articles/Tours/Hotels), Detail, Search
- [ ] Apply the **sleek-modern-luxury** design system (tokens, type, components, wordmark)
- [ ] **SEO on every page** (server-rendered): title/meta/canonical/OG + JSON-LD, sitemap, OG
      images (see SEO.md) — build shared `buildMetadata` + `buildJsonLd` helpers
- **Blog:** _"Content modeling for Visual Builder: pages vs experiences vs components"_

## Phase 2.5 — Content at scale
- [x] ~250-item corpus: **101 Places to Visit**, **19 Neighbourhoods**, **20 Events**, 24 Tags —
      all with authored rich-text bodies (originally written; see the sourcing rule in SPRINTS.md)
- [ ] **Articles** section stood up end-to-end + 100 long-form articles
- [ ] **Things to Do** section — the visitdubai.com `/things-to-do` equivalent, mapped to the
      existing `Tour` type (activities and experiences, as distinct from `PointOfInterest`
      landmarks) + ~30 tours
- [ ] Imagery: 144 CMP folders (`docs/ASSET-MANIFEST.md`) → `npm run attach-assets -- --apply`
- [ ] Content quality pass: facet coverage, cross-links, re-verify search relevance at scale
- **Why:** relevance tuning, facets and pagination are untestable on 16 items — and every
  Phase-3/4 feature (semantic search, AI retrieval, the MCP server) reads from this corpus.
- See **SPRINTS.md §Phase 2.5** for the sprint breakdown.

## Phase 3 — Optimizely superpowers
- [ ] **Stakeholder preview links** — durable, shareable, login-free preview-before-publish
      (signed token → Next Draft Mode → Graph HMAC draft render) + "PREVIEW" banner + noindex.
      See PREVIEW-WORKFLOW.md. **(Primary module/blog candidate.)**
- [ ] **Semantic search** page (autocomplete, synonyms, faceting) — the headline feature
- [ ] **Localization**: EN + **AR semantic search** on showcase pages (RTL); Opal AR translation
      path scoped (guided)
- [ ] **Multisite** (optional): stand up a second site on the same instance
- [ ] Personalization/experimentation hook (at least one visible experiment)
- [ ] Performance pass: Core Web Vitals, image optimization, webhook revalidation (Vercel free)
- [ ] Accessibility pass (WCAG 2.1 AA)
- **Blog:** _"Shareable stakeholder previews for Optimizely SaaS + Next.js"_ +
  _"Semantic search with Optimizely Graph"_

## Phase 4 — AI features (Claude)
- [ ] **AI Search**: NL query → Graph retrieval → Claude → rich result cards (AI-SEARCH.md)
- [ ] **AI Trip Planner**: constraints → itinerary grounded in CMS content
- [ ] **"This is Dubai Concierge" MCP server**: Graph-backed tools for any MCP client (stdio →
      remote HTTP on Vercel / claude.ai connector); OSS + MVP candidate (MCP-SERVER.md)
- [ ] **AI observability + guardrails**: Langfuse, prompts-as-CMS-content, safety rails (AI-PLATFORM.md)
- [ ] Evaluate **Opal** integration
- **Blog:** _"AI trip planner on Optimizely Graph + Claude"_ + _"Building an Optimizely Graph MCP server"_

## Phase 5 — Give back to the community
- [ ] Extract a reusable module/plugin (candidate: Graph semantic-search hook or JSON-LD
      generator for Opti content types)
- [ ] Publish (npm + Optimizely community + repo template)
- [ ] Write the MVP-application-worthy retrospective post
- **Blog:** _"I built and open-sourced a Visual Builder / Graph helper — here's how"_

---

### Definition of "done" per phase
Deployable to Vercel · no TypeScript/lint errors · Visual Builder still edits cleanly ·
Lighthouse ≥ 90 on key pages · a draft blog post outline exists.
