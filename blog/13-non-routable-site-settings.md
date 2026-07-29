---
title: "The page that shouldn't have a URL: best-practice Site Settings in Optimizely SaaS CMS"
status: draft
audience: Optimizely community / dev.to / LinkedIn (long-form)
author: Nikki Punjabi
tags: [optimizely, saas-cms, optimizely-graph, nextjs, content-modeling, seo, multisite]
---

> **Draft for your review.** Edit the voice/details freely before publishing.

> ⚠️ _Independent, unofficial learning project — not affiliated with any tourism authority or brand.
> Original wordmark and royalty-free assets only._

## What I set out to do

Every site needs global settings — site name, title tagline, the crawl on/off switch — edited in
**one** place and read on **every** page. Easy to model badly: as a page (leaks a public URL), or as
scattered fields. I wanted a singleton editors can find and change in one publish, that is
**impossible to reach on the public web**, and that stays correct when the project goes multisite.

## Where it belongs — and where it doesn't

Global settings are **data, not a page**, so they have no business in the routing tree. The right
home on SaaS is a **shared block** (`_component`, `SiteConfiguration`) in the **Shared Blocks
(Assets) panel**, grouped in a **"Site Configurations"** folder. Editors manage it from the Shared
Blocks panel — no page tree entry, no non-routable page, no per-type access grants.

```
Shared Blocks ▸ For This Application ▸ Site Configurations ▸ Site Settings   (SiteConfiguration block)
```

The block drives the global **title template** (`<page> | <tagline> | <site name>`) — so a rebrand
is a single publish — and holds the global crawl switch.

## Keeping it off the public web

A block already has no URL. But shared blocks *do* surface in Graph (that's the point — I query the
settings), and my catch-all `[...slug]` router could, in theory, be handed a block's path. So I
guard the router by **base type**, which catches every non-routable thing regardless of its specific
key:

```ts
// Routable content is _experience / _page only. Everything else 404s.
const NON_ROUTABLE_TYPES = new Set(['_Component', '_Folder']);
const isNonRoutable = (types = []) => types.some((t) => NON_ROUTABLE_TYPES.has(t));
// ...in the page + generateStaticParams: if (isNonRoutable(node._metadata?.types)) notFound();
```

Guarding by base type (`_Component`, `_Folder`) rather than by name means new blocks and folders are
excluded automatically — I never have to remember to add each one.

## The multisite-safe query

The trap is fetching the singleton with an unscoped `limit: 1` — fine with one site, wrong the moment
a second site has its own settings. Instead I scope to the current site's **Start Page subtree** via
`_metadata.path` (the ancestor chain), resolving the Start Page key from `"/"`:

```graphql
query($c: String!) {
  SiteConfiguration(where: { _metadata: { path: { eq: $c } } }, limit: 1) {
    items { siteName titleTagline titleSeparator }
  }
}
```

Matching on `path` (not the direct `container`) means it resolves whether the block sits directly
under the start page or inside the "Site Configurations" folder. When the frontend becomes
host-aware, `"/"` already resolves per host — so each site reads *its own* settings with no code
change.

## The gotchas (the actually-useful part)

> 🧩 **A `_component` isn't in the Graph schema until it declares a `compositionBehaviors`.** With
> none, `SiteConfiguration` simply wasn't a queryable root type. Adding `['elementEnabled']` exposed
> it (same requirement as any data-record block).

> 🧩 **Base types are immutable.** Moving settings from a `_page` to a `_component` isn't an edit —
> it's delete + recreate under a new key (`SiteSettings` → `SiteConfiguration`), preserving the
> authored values, in two phases around a `config push`.

> 🧩 **The title template doesn't wrap the root page.** Because the home page shares the root
> layout's segment, Next's `title.template` skips it — build its title explicitly from the same
> settings, or the homepage loses the brand suffix.

> 🧩 **Guard, then prove it.** After wiring the guard I actually hit the block's asset path and
> confirmed a 404 — a settings object that renders as a public page is exactly the kind of leak
> nobody notices until it's indexed.

## Result

One `SiteConfiguration` block, edited in the Shared Blocks panel, driving every page's title and the
crawl policy — with a base-type router guard proving it has no public URL, and a Start-Page-scoped
query that's multisite-safe from day one.

## Links
- Repo: _this-is-dubai_ — see `src/lib/seo.ts`, `src/app/[...slug]/page.tsx`, and
  `docs/CONTENT-ARCHITECTURE.md` §4.
- Related: post #4 (server-rendered SEO), #15 (articles as blocks — the same "content, not a page" idea at scale).
