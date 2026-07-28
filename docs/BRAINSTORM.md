# Brainstorm — This is Dubai

_Last updated: 2026-07-21_

## 1. The vision

Build **This is Dubai**, an original destination-marketing site for a fictional coastal-desert
emirate, on the Optimizely SaaS stack. It plays the same role visitdubai.com plays for Dubai:
inspire visitors, help them discover things to do, and plan a trip — but everything (brand,
copy, imagery, data) is original so it can be shared publicly.

We use it as a **living lab** to learn and demonstrate the full Optimizely SaaS capability set,
and we **blog the journey** to build toward Optimizely MVP.

### Guiding principles
- **Start small, ship often.** A working multi-page site first, then layer features.
- **Best practices only.** Next.js App Router + Optimizely's own reference patterns.
- **Design that doesn't look AI-generated.** Opinionated, editorial, distinctive.
- **Everything public-safe.** Original brand, royalty-free assets, open-source friendly.
- **Blog at milestones.** Especially anything new, any challenge solved, any reusable module.

## 2. Confirmed decisions

| Decision | Choice |
|----------|--------|
| Brand name | **"This is Dubai"** (unofficial demo) — original wordmark + royalty-free imagery; clear not-affiliated disclaimer. **No official logo / copyrighted photos in the public repo.** |
| Baseline codebase | **Official `@optimizely/cms-sdk`** (scaffold via `@optimizely/cms-create-app`); the `@remkoj` demo `cms-saas-vercel-demo` is a **reference only** |
| Dev tooling | **Optimizely CMS Skills** (`optimizely-setup/model/model-react/preview`) via `/plugin marketplace add episerver/content-js-sdk` |
| Repo | https://github.com/nikkipunjabi1/thisisdubai (user creates/pushes) |
| Hosting | **Vercel Hobby (free tier)** |
| First milestone | **Full multi-page site** (home + listing + detail page types) |
| Localization | **English first**, i18n-ready; add **AR semantic search** on showcase pages (Phase 3); use **Optimizely Opal for AR translation** later (guided) |
| Design direction | **Sleek, modern, luxury** (obsidian + champagne) — see DESIGN-SYSTEM.md |
| Content types | Add **Tour** + **Hotel** + **Itinerary**; rename Place → **PointOfInterest** at `/places-to-visit` |
| Module candidate | **Shareable stakeholder preview-link module** (primary); JSON-LD generator (secondary) |
| Infra ready | GitHub ✅ · Vercel ✅ · Graph semantic search ✅ · Visual Builder ✅ |

### Standard requirements (must-haves)
- **Preview before publish** — every new page / new component gets a **durable, shareable
  preview URL** for stakeholders; on approval, author publishes → live. See PREVIEW-WORKFLOW.md.
- **SEO on every page, server-rendered** — title, meta, canonical, OG/Twitter, **JSON-LD** all in
  the initial HTML; no page skipped. See SEO.md.

### Asset & legal hygiene (public repo)
Original "This is Dubai" wordmark (not the official trademarked logo). Royalty-free imagery only
(Unsplash/Pexels Dubai photos under free licenses) with attributions in `ASSETS.md`. Real place
names/facts used descriptively. Prominent "unofficial / not affiliated" disclaimer in the UI +
README. (If exact official assets are ever wanted, keep that to a **private, unpublished** build.)

## 3. Feature ideas (prioritized backlog)

### Tier 1 — Core site (Phase 1–2)
- Home page (hero, featured destinations, curated collections, events teaser)
- Things to do / Places to visit (listing + detail)
- Events & What's On (listing + detail, date-aware)
- Articles / News / Guides (editorial listing + detail)
- Neighborhoods / Areas (destination sub-pages)
- Search results page (Graph-powered filtering + faceting)
- Global nav, footer, breadcrumbs, SEO metadata, sitemap, OG images

### Tier 2 — Optimizely showcase (Phase 3)
- **Semantic search** with autocomplete + synonyms (Graph)
- **Visual Builder** experiences fully editable on-page
- **Multisite** (e.g., This is Dubai + a second micro-site) on one SaaS instance
- **Localization** (English + one more locale, e.g., Arabic RTL — great multisite story)
- **Personalization / experimentation** hooks (Optimizely's core differentiator)

### Tier 3 — AI features (Phase 4+)
- **AI Search** — Claude-powered natural-language search that returns rich cards
  (Events / Articles / News / Places) grounded in CMS content via Graph.
- **AI Trip Planner** — Claude builds an itinerary from Graph content (constraints:
  dates, interests, budget, pace); outputs a shareable day-by-day plan.
- Possible **Opal** integration (Optimizely's AI assistant) and/or a **community module**.

## 4. What are we missing? (my additions to your list)

Things worth planning for that weren't explicitly mentioned:

1. **Content modeling discipline** — Visual Builder needs a clean split between *pages*,
   *experiences*, *sections*, and *components*. Getting this right early avoids painful
   re-modeling. (See CONTENT-MODEL.md.)
2. **SEO from day one** — tourism sites live or die on organic search: metadata, structured
   data (JSON-LD for `TouristAttraction`, `Event`, `Article`), canonical URLs, sitemaps,
   hreflang for locales.
3. **Core Web Vitals / performance budget** — image optimization (next/image + Graph asset
   URLs), RSC streaming, caching strategy, and **Graph webhooks → on-demand revalidation**.
4. **Accessibility (WCAG 2.1 AA)** — a credibility signal for an MVP-facing project; also a
   good blog topic. Keyboard nav, contrast, focus states, RTL support.
5. **Preview & on-page editing UX** — the CMS editor must point at the Next.js preview route;
   draft mode + the Optimizely communication script must work. This is the #1 thing that
   silently breaks; we verify it explicitly.
6. **Governance / content ops** — who authors content, publishing workflow, and a small
   seed-content plan so the demo isn't empty.
7. **Analytics & measurement** — even lightweight (Vercel Analytics) so we can talk about
   outcomes when blogging; later, Optimizely Data Platform / experimentation results.
8. **Legal hygiene** — image licensing (Unsplash/Pexels license notes), no real This is Dubai
   trademarks/assets in the public repo. Keep an `ASSETS.md` with attributions.
9. **Environment & secrets strategy** — Graph single-key (public, read-only) vs app-key+secret
   (server-only); never leak the secret to the client. Document in ARCHITECTURE.md.
10. **CI/CD + preview deployments** — Vercel preview per PR; lint/typecheck/build gates.
11. **Reusable-module opportunity** — as we build, watch for a genuinely reusable helper
    (e.g., a Graph semantic-search React hook, a JSON-LD generator for Opti content types,
    a Visual Builder component-registry helper). That becomes the community module + blog.

## 5. Open questions (to resolve as we go)

- ~~Second locale strategy~~ → **Resolved:** EN first, AR semantic search on showcase pages in
  Phase 3, Opal for AR translation later.
- **Opal for AR translation** — confirm access/availability + integration path at Phase 3
  (I'll guide you then).
- AI provider wiring (Phase 4): Claude via a Next.js route handler; retrieval = Graph semantic
  query → context → Claude (vs. embeddings) — decide when we build it.
- Preview-link specifics to validate against the live CMS in Phase 1 (see PREVIEW-WORKFLOW.md).
- Where the blog lives: Optimizely community/World (primary) + dev.to + LinkedIn.

## 6. Reference sources

- `episerver/cms-saas-vercel-demo` — official Next.js + Graph + Visual Builder baseline
- `episerver/cms-visual-builder-hello-world` — minimal Visual Builder integration
- Optimizely Graph docs — overview, GraphQL, semantic search
- visitdubai.com/en — *structure & IA reference only* (not assets/branding)
- alirezahosseini/genesis-travel — design inspiration reference
