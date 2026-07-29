---
title: "Server-rendered SEO + JSON-LD for every Optimizely SaaS page (Next.js)"
status: draft
audience: Optimizely community / dev.to / LinkedIn (long-form)
author: Nikki Punjabi
tags: [optimizely, saas-cms, seo, json-ld, nextjs, generatemetadata, robots]
---

> **Draft for your review.** Edit the voice/details freely before publishing.

> ⚠️ _Independent, unofficial learning project — not affiliated with any tourism authority or brand.
> Original wordmark and royalty-free assets only._

## What I set out to do

Give every page real, server-rendered SEO — title, description, canonical, Open Graph, structured
data — sourced from the CMS, in the **initial HTML** (never client-only), with a **global title
template** so a rebrand is a single publish, and a **fail-closed** crawl policy so a demo never
leaks into search.

## How I did it

**1. `generateMetadata()` on every route.** Each page builds its `Metadata` from its authored SEO
fields (a `SeoMetadata` contract: `metaTitle`, `metaDescription`, `noindex`, `nofollow`, canonical,
OG image) plus global settings.

**2. Global title template from a CMS singleton.** The root layout sets `title.template` from a
`SiteConfiguration` block, so every child page's title becomes
`"<page> | <tagline> | <site name>"` and rebranding is one publish:

```ts
// root layout
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings(); // { siteName, titleTagline, titleSeparator }
  return { title: { template: buildTitleTemplate(s), default: buildTitleDefault(s) } };
}
```

**3. JSON-LD per type.** A small server `<JsonLd>` component emits schema.org structured data —
`TouristAttraction` for places, `Event`, `Article`, `BreadcrumbList` for the breadcrumb trail — in
the server-rendered HTML.

**4. Robots, fail-closed.** A global crawl switch in CMS settings (default **OFF**) drives a
`robots.ts` that **disallows everything** until indexing is explicitly enabled; per-page
`noindex`/`nofollow` layer on top via the SEO fields.

## The gotchas (the actually-useful part)

> 🧩 **The title template does NOT wrap the root page.** Next's `title.template` only applies to
> *nested* segments — the page that shares the root layout's segment (your `/` home) is **not**
> wrapped. Build the home page's title explicitly from the same settings
> (`buildPageTitle(settings, "Home")`), or emit `title.absolute`, or the homepage silently loses the
> tagline/brand suffix.

> 🧩 **Robots must fail closed, and it's the most likely thing to crash your build.** `robots.ts`
> runs at module load with no `try/catch` around client construction — and **the SDK throws on an
> empty Graph key**, so in a CI build without secrets it crashes before returning anything.
> Lazy-init: only build the client if the key is present; if it's missing, return `Disallow: /`.
> Fail closed both ways — no secret *and* switch-off both mean "don't index."

> 🧩 **An unset content reference is not null.** Graph returns
> `{ "key": null, "url": { "default": null } }` — a *truthy object*. When deciding whether an OG
> image / hero is set, test `key` (or `url.default`), not the object itself, or you'll render broken
> image metadata.

> 🧩 **Scope the settings singleton by the Start Page subtree** (`_metadata.path` eq the "/" key),
> not an unscoped `limit: 1`. It's the same query that makes the whole thing multisite-safe later —
> each site resolves *its own* brand/SEO — and it still works whether settings sit directly under the
> start page or inside a folder.

## Result

Every page ships correct `<title>`, description, canonical, OG/Twitter, and JSON-LD in the initial
HTML; the site name/tagline change in one publish; and the demo stays out of search until I flip one
switch. Verified by viewing source (not the hydrated DOM) and with a structured-data validator.

## Links
- Repo: _this-is-dubai_ — see `src/lib/seo.ts`, `src/app/robots.ts`, and `docs/SEO.md`.
- Related: post #13 (keeping the settings singleton off the public web).
