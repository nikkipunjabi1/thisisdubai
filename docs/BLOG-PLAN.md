# Blog & Community Plan — toward Optimizely MVP

_Goal: consistent, genuinely useful community content that documents building This is Dubai.
I (Claude) will nudge you to blog at the trigger points below — especially anything **new**, a
**challenge solved**, or a **reusable module** created._

## Why blogging matters here
Optimizely MVP is awarded for community contribution — content, code, and helping others.
A public build-in-the-open project is one of the strongest, most sustainable ways to earn it.

## Where to publish
- **Optimizely community / World** — primary (counts most toward MVP).
- **dev.to** and/or personal blog — reach + SEO.
- **LinkedIn** — short posts linking to the long-form; visibility with the Opti ecosystem.
- **GitHub repo** — the code + README is itself a contribution (template/module).

## Blogging trigger checklist (Claude will flag these)
Blog when we hit any of:
- 🆕 **Something new** — a feature/API we used that isn't well documented publicly.
- 🧩 **A challenge solved** — a setup gotcha, an integration quirk, a workaround.
- 🔧 **A reusable module** — anything extractable others could use.
- 🎯 **A phase completed** — natural milestone recap.
- 📊 **A measurable result** — perf win, search relevance improvement, experiment outcome.

## Planned posts (mapped to roadmap)
| # | Working title | Trigger | Phase |
|---|---------------|---------|-------|
| 1 | Why I'm building This is Dubai on Optimizely SaaS (in the open) | Kickoff | 0 |
| 2 | Optimizely SaaS CMS + Visual Builder on Vercel with Next.js — setup & gotchas _(draft: blog/02-optimizely-saas-visual-builder-nextjs-vercel-setup.md)_ | Challenge | 1 |
| 2b | **Connecting a Next.js app to Optimizely CMS SaaS for live Visual Builder preview** — Application + preview tokens, local HTTPS (mkcert), and the registry-must-mirror-the-model gotcha (`13 errors in the GraphQL query` / `GraphMissingContentTypeError`) _(draft: blog/02b-live-visual-builder-preview-nextjs.md)_ | 🧩 Challenge solved | 2 |
| 3 | Content modeling for Visual Builder: pages vs experiences vs components _(draft: blog/03-content-modeling-pages-experiences-components.md)_ | New/learning | 2 |
| 4 | Server-rendered SEO + JSON-LD for every Optimizely SaaS page (Next.js) _(draft: blog/04-server-rendered-seo-jsonld.md)_ | New/learning | 2 |
| 5 | **Shareable stakeholder previews for Optimizely SaaS + Next.js** (preview-before-publish) | New (headline) | 3 |
| 6 | **Semantic search with Optimizely Graph — a practical guide** — the four-line switch (`_ranking: SEMANTIC`), proving it's really semantic with a `RELEVANCE` control, and 3 undocumented gotchas (stop words drown the semantic signal + make `_semanticWeight` look broken; `_Content` surfaces non-routable taxonomy blocks; scores aren't comparable across types) + why a relevance floor must be relative, not absolute. _(draft: blog/06-semantic-search-optimizely-graph.md)_ | New (headline) | 3 |
| 7 | EN + AR semantic search & localization on Optimizely SaaS | New/learning | 3 |
| 8 | **Fast AND fresh on Optimizely SaaS + Next.js** — Core Web Vitals via three levers: caching Graph reads across requests (`unstable_cache` + tags), on-demand revalidation with a Graph publish webhook (`revalidateTag(_, 'max')`, secret-gated), and responsive AVIF image delivery (CMP JPEG → `next/image` resize+re-encode per device; 342 KB → 32 KB on a phone). Includes the Next 16 single-arg `revalidateTag` gotcha + the unset-reference-is-truthy trap. _(draft: blog/08-core-web-vitals-graph-caching-revalidation-images.md)_ | 🎯 Result / 🧩 Challenge | 3 |
| 9 | Building an AI Trip Planner on Optimizely Graph + Claude | New (headline) | 4 |
| 9b | Building an Optimizely Graph **MCP server** (content as tools for any AI) | New (headline) | 4 |
| 10 | Using Optimizely Opal for Arabic translation | New/learning | 4 |
| 11 | I open-sourced a stakeholder-preview module for Optimizely SaaS — here's how | Module | 5 |
| 12 | **From CMP/DAM to Optimizely SaaS CMS: a bulk imagery pipeline (source → upload → attach)** — the CMP↔CMS asset flow end to end: why the CMA can't upload binaries but CMP's 3-step presigned POST can, attach as a `cms://content/DamImageSource/<id>` property write, and 3 gotchas (GET-with-JSON-content-type 400s; "publish latest" ≠ publish `items[0]` → 20 images stranded as drafts; an unset reference is truthy). _(draft: blog/12-cmp-dam-to-saas-cms-bulk-imagery.md)_ | 🧩 Challenge solved / New | 3 |
| 14 | **A Reusable, Server-Rendered Listing Engine on Optimizely SaaS + Visual Builder** — section pages as experiences, the grid as a `SectionListing` block, request-scoped state via React `cache()`, server-side pagination/sort/faceted filters, and 3 hard-won gotchas (cascade-delete on parent delete, `limit`≤100, `indexingType`/reference-`key` filtering). _(draft: blog/14-listing-engine-visual-builder.md)_ | 🎯 Phase + 🧩 Challenge | 3 |
| 13 | **The Page That Shouldn't Have a URL: Best-Practice Site Settings in Optimizely SaaS CMS** — where global settings belong in the content tree, how to keep them off the public web (non-routable / router-excluded), the placement + security guardrails, and the multisite-safe GraphQL query (scope by Start Page key). Includes the options considered + the test queries proving no public URL. _(draft: blog/13-non-routable-site-settings.md)_ | 🧩 Challenge / New | 2 |
| 15 | **Thousands of Articles in Optimizely SaaS CMS: model them as blocks, not pages** — why folders can't live in the SaaS Pages tree, why a flat page-per-article doesn't scale, and the fix: articles as shared blocks foldered by year/month in the Assets panel, with the Next.js app owning `/articles/<year>/<month>/<slug>` routing (resolve by `slug`, URL from `publishDate`). The two failed attempts, the doc quotes that settle it, and how the listing detects a block-backed section. _(draft: blog/15-articles-as-blocks-not-pages.md)_ | 🧩 Challenge solved + 🎯 Phase | 3 |

## Post skeleton (reuse for each)
1. The problem / what I set out to do
2. Context (Optimizely SaaS + the specific feature)
3. How I did it — code, config, screenshots
4. What broke and how I fixed it (the most valuable part)
5. Result + what's next
6. Links: repo, live demo, related docs

## Cadence
Aim for **1 post per completed phase** minimum; capture drafts/outlines *as we build* (not
after) so nothing is lost. Keep a `blog/` folder of drafts in the repo.

## Assets for posts
Screenshots, short screen-recordings (the `gif_creator` browser tool is handy), and
before/after perf numbers. Keep them in `blog/assets/`.
