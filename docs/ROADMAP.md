# Roadmap — This is Dubai

_Phased plan. Each phase ends with a working, deployable state and (usually) a blog post._

> **Where we are:** the app runs locally against the SaaS CMS with the official SDK; Phases 0 → 2.5
> are done and Phase 3 (Optimizely superpowers) is **in progress** — semantic search + result facets
> and the stakeholder preview module have shipped. The **one deferred baseline item is the Vercel
> deploy** (Phase 1): we build the full site locally first, then deploy. This file is the high-level
> plan; **`docs/SPRINTS.md` is the live, sprint-by-sprint tracker.**

## Phase 0 — Foundations (planning) ✅
- [x] Kickoff decisions locked
- [ ] Research digested into OPTIMIZELY-RESEARCH.md + ARCHITECTURE.md
- [ ] Content model drafted (CONTENT-MODEL.md)
- [ ] Design system direction drafted (DESIGN-SYSTEM.md)
- [ ] Repo created on GitHub + Vercel project linked
- **Blog:** _"Why I'm building This is Dubai on Optimizely SaaS — a public learning project."_

## Phase 1 — Baseline running
- [x] Scaffold the official `@optimizely/cms-sdk` Next.js app, running locally against the dev CMS
      (we scaffolded `nextjs-starter`, not a fork of `cms-saas-vercel-demo`)
- [x] Confirm Graph connection (env vars, real queries return data across every type)
- [x] Confirm Visual Builder preview + on-page editing works end-to-end
- [ ] **Deploy to Vercel (preview + prod)** — _deferred: we finish building the site locally first,
      then deploy. The `/api/revalidate` publish webhook is already built and waiting._
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
- [x] **Articles** section stood up end-to-end (code); bulk long-form content is a later pass
- [~] **Things to Do** campaign (Visual Builder) — a curated landing + themed sub-pages (New &
      Trending, Dubai Attractions, Arts & Culture, Wellness) over existing content, with a video
      hero and reusable highlight cards. **TTD-1 (model + blocks) and TTD-2 (pages authored +
      published, nav wired) shipped**; TTD-3 (imagery/AR/campaign blog) next. See SPRINTS.md
      §Phase 2.5 SC3.
- [ ] Imagery: 144 CMP folders (`docs/ASSET-MANIFEST.md`) → `npm run attach-assets -- --apply`
- [ ] Content quality pass: facet coverage, cross-links, re-verify search relevance at scale
- **Why:** relevance tuning, facets and pagination are untestable on 16 items — and every
  Phase-3/4 feature (semantic search, AI retrieval, the MCP server) reads from this corpus.
- See **SPRINTS.md §Phase 2.5** for the sprint breakdown.

## Phase 3 — Optimizely superpowers 🟡 _current_
- [x] **Stakeholder preview links** — durable, shareable, login-free preview-before-publish.
      Signed token → Next Draft Mode → draft read from Graph with the App key + Secret over
      **HTTP Basic** (not HMAC: the SDK supports neither, and Basic needs no request signing),
      + "PREVIEW" banner + noindex. Authors generate links from a **"Share with a stakeholder"
      button in the CMS preview pane**, authenticated by the CMS's own `preview_token`, so there
      is no admin page and no secret in the author's hands. Hardened since with a signed
      Internal/Shareable access mode (Internal = org-network-only, IP-gated at the edge, the
      default) and a `frame-ancestors` CSP. See PREVIEW-WORKFLOW.md.
      **(Primary module/blog candidate — one combined blog drafted, publishing next.)**
- [x] **Semantic search** page (autocomplete, synonyms, faceting) — the headline feature
      (shipped S3.2; taxonomy synonyms denormalized into `searchKeywords`. See docs/AI-SEARCH.md.)
- [ ] **Localization**: EN + **AR semantic search** on showcase pages (RTL); Opal AR translation
      path scoped (guided)
- [ ] **Multisite** (optional): stand up a second site on the same instance
- [ ] Personalization/experimentation hook (at least one visible experiment)
- [~] Performance pass: Core Web Vitals, image optimization, webhook revalidation (Vercel free)
      — **done:** on-demand revalidation webhook (`/api/revalidate` → `revalidateTag`), AVIF+WebP
      image formats, LCP hero `priority` + responsive `sizes`/lazy cards (measured: detail hero
      ~33KB, AVIF ~13% under WebP). _Remaining: full-page CWV/Lighthouse pass under load._
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
