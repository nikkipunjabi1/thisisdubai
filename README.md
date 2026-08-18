# This is Dubai — Optimizely SaaS CMS + Next.js Demo

> ⚠️ **Unofficial, independent demo project — for learning and showcase purposes only.** Built on
> **Optimizely SaaS CMS**, **Optimizely Graph**, and **Optimizely Visual Builder** with a
> **Next.js** frontend (targeting Vercel). All branding here is **original**; imagery is **royalty-free**
> only (see `ASSETS.md`). Real place names/facts are used descriptively.

Repo: https://github.com/nikkipunjabi1/thisisdubai · Deployment target: Vercel (Hobby/free tier) — planned; the app currently runs locally against the SaaS CMS while the site is built out.

## Why this project exists

1. **Learn** the Optimizely SaaS stack deeply (CMS, Graph, Visual Builder, multisite,
   localization, personalization).
2. **Build** something genuinely cool — a beautiful, fast, content-rich tourism site with
   semantic search and (later) an AI trip planner powered by Claude.
3. **Share** with the Optimizely community — blog the journey, publish a module/plugin, and
   work toward **Optimizely MVP** recognition.

## What we're showcasing

- ✅ Optimizely **Graph** — GraphQL content delivery + **bilingual (EN/AR) semantic search** with result type facets
- ✅ Optimizely **Visual Builder** — on-page editing, experiences, sections, components
- ✅ A reusable, server-rendered **listing engine** (section pages as experiences + `SectionListing` block)
- ✅ **CMP/DAM → SaaS CMS** bulk imagery pipeline (source → upload → attach, responsive AVIF)
- ✅ **Next.js** App Router best practices (RSC, Graph-read caching, on-demand revalidation, Core Web Vitals)
- ✅ A distinctive **sleek-modern-luxury** design system (not a generic AI-looking template)
- ✅ **SEO on every page, server-rendered** — title/meta/OG + JSON-LD in the initial HTML
- ✅ **EN + AR localization** — `[locale]` routing, RTL shell, locale-aware data + strings, **hreflang/sitemap SEO**
- ✅ **Stakeholder preview-before-publish** — durable, shareable, login-free preview links (signed token → Draft Mode → server-side draft read)
- 🔜 **Full AR content translation** — done in the CMS UI with the built-in Opal/AI translate (no bulk translate-item API) + Blog #12
- 🔜 **AI Search** (Claude-powered) over Events / Articles / Tours / Hotels / Places
- 🔜 **AI Trip Planner** (outputs an `Itinerary`) + a reusable **community module/plugin**

## Docs

| Doc | Purpose |
|-----|---------|
| [docs/BRAINSTORM.md](docs/BRAINSTORM.md) | Vision, ideas, open questions, "what are we missing" |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Phased plan from small → full site → AI features |
| [docs/SPRINTS.md](docs/SPRINTS.md) | Small credit-efficient sprints + exit checks + phase gates |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Tech stack, repo structure, integration patterns |
| [docs/CONTENT-MODEL.md](docs/CONTENT-MODEL.md) | Content types, components, taxonomy |
| [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) | Sleek-modern-luxury brand, tokens, typography, grid |
| [docs/COMPONENT-STANDARDS.md](docs/COMPONENT-STANDARDS.md) | Component best practices, Light/Dark + Full/Container display settings, grid |
| [docs/PREVIEW-WORKFLOW.md](docs/PREVIEW-WORKFLOW.md) | Stakeholder preview-before-publish workflow (shipped) |
| [docs/PREVIEW-MODULE-PACKAGING.md](docs/PREVIEW-MODULE-PACKAGING.md) | Plan to extract the preview module as a reusable package |
| [docs/LOCALIZATION.md](docs/LOCALIZATION.md) | EN/AR localization architecture (routing, RTL, data, strings, SEO) |
| [docs/SEO.md](docs/SEO.md) | Server-rendered SEO tags + JSON-LD requirements |
| [docs/AI-SEARCH.md](docs/AI-SEARCH.md) | AI search + trip planner (Graph semantic + Claude; no pgvector) |
| [docs/AI-PLATFORM.md](docs/AI-PLATFORM.md) | AI observability, prompt admin, guardrails, safety, scaling |
| [docs/MCP-SERVER.md](docs/MCP-SERVER.md) | "This is Dubai Concierge" MCP server (Graph-backed tools) |
| [docs/OPTIMIZELY-RESEARCH.md](docs/OPTIMIZELY-RESEARCH.md) | Findings from official docs + reference repos |
| [docs/OPTIMIZELY-BEST-PRACTICES.md](docs/OPTIMIZELY-BEST-PRACTICES.md) | Playbook: modeling, VB, Graph, SEO, perf, security, gotchas |
| [docs/QUALITY.md](docs/QUALITY.md) | Testing/CI strategy + quality gates |
| [docs/BLOG-PLAN.md](docs/BLOG-PLAN.md) | Community blogging cadence toward MVP |
| [scripts/README.md](scripts/README.md) | Plain-language index of every automation script (for PMs/BAs/new joiners) |

## Status

🟢 **Phase 3 — a content-rich site on Optimizely SaaS + Next.js.** Built on the official
`@optimizely/cms-sdk`, running locally against the SaaS CMS. Vercel deployment is planned once the
site is feature-complete (the on-demand revalidation webhook is already built and waiting).

**Shipped so far:**
- **Content model + Visual Builder** — pages / experiences / components, a shared display-template
  system, and non-routable site settings.
- **Listing engine** — section pages as experiences with a droppable `SectionListing` block
  (server-side pagination, sort, faceted filters); high-volume articles modeled as blocks, not pages.
- **Imagery pipeline** — CMP/DAM sourcing → upload → attach, delivered as responsive AVIF via `next/image`.
- **Semantic search** on Optimizely Graph (`_ranking: SEMANTIC`), now **bilingual EN/AR**, with
  result **type facets** (`?in=`).
- **Stakeholder preview-before-publish** — durable, login-free share links: a signed token flips
  Next.js Draft Mode, the server reads the unpublished draft from Graph (App key + Secret over HTTP
  Basic, uncached, scoped to one item), a localized "PREVIEW" banner + `noindex` guard it, and authors
  generate links from a **"Share with a stakeholder" button inside the CMS preview pane** (no admin
  page, no secret in the author's hands). See [docs/PREVIEW-WORKFLOW.md](docs/PREVIEW-WORKFLOW.md).
- **Performance** — cross-request Graph-read caching + a publish webhook for on-demand revalidation.
- **Server-rendered SEO** — title/meta/OG + JSON-LD on every page, plus **hreflang alternates and a
  bilingual sitemap**; EN `metaTitle`/`metaDescription` populated across all routable items.
- **Localization (EN + AR)** — `[locale]` routing, RTL shell, locale-aware data layer, a UI string
  catalog, Arabic search, and localization SEO. **Complete (L0–L6):** the full corpus is translated
  and published (187 EN = 187 AR), slugs aligned across locales, language switch has no 404s.
  Publish + slug-align run via `npm run publish:ar` / `npm run align:ar-slugs` ([scripts/README.md](scripts/README.md)).

**In progress / next:**
- **AI features** — Claude-powered search + trip planner, and a reusable community module.
- **Packaging the preview module** for other teams — see
  [docs/PREVIEW-MODULE-PACKAGING.md](docs/PREVIEW-MODULE-PACKAGING.md).

The build is documented in the open — see [docs/BLOG-PLAN.md](docs/BLOG-PLAN.md) for the post series
and [docs/SPRINTS.md](docs/SPRINTS.md) for the sprint history.
