---
title: "Server-rendered SEO and JSON-LD on every Optimizely SaaS page (headless)"
status: draft
audience: Optimizely community / dev.to / LinkedIn (long-form)
author: Nikki Punjabi
tags: [optimizely, saas-cms, seo, json-ld, headless, structured-data, robots]
---

> **Draft for review.** Screenshot placeholders are marked 📷; swap in real captures from your own
> Optimizely SaaS instance before publishing.

## The SEO that only exists after JavaScript runs

Here's a failure mode I've watched catch out more than one headless build. The site looks perfect: open
any page, view it in the browser, the title bar reads correctly, the social preview looks sharp in the
share dialog. Everyone signs off. Then weeks later someone notices the pages aren't ranking, and the
link previews in Slack and LinkedIn are blank.

The cause is almost always the same. All that SEO (the title, the description, the Open Graph tags,
the structured data) was being set on the client, after hydration. A human with a browser sees it. A
crawler that reads the *initial HTML* and moves on sees an empty shell. On a headless frontend in front
of Optimizely SaaS, getting SEO into that first server response is the whole game, and it takes a
little deliberate wiring.

What I wanted was unglamorous but complete: every page ships a real title, description, canonical, Open
Graph and Twitter tags, plus schema.org JSON-LD, all in the server-rendered HTML, all sourced from the
CMS. A **global title template** so a rebrand is one publish. And a crawl policy that **fails closed**,
so a not-yet-launched environment can't accidentally end up in search.

## Why headless makes this trickier

On a traditional server-rendered CMS, the platform stamps SEO into the page for you. Go headless and
that responsibility moves entirely to your frontend, which is fine, except that the two audiences for
a page now pull in opposite directions.

Your framework's default instinct is to be interactive: fetch, hydrate, update the document head. That
serves the human perfectly and the crawler not at all. Getting metadata into the *initial* response
means every route has to resolve its SEO data on the server, before the response is sent, including
values that live in two different places at once: per-page fields the author fills in, and site-wide
settings that live somewhere else entirely. Reconciling "this page's title" with "the global template
that wraps it" is where most of the fiddly bits hide.

## The approach, in four moves

**1. Resolve metadata on the server, for every route.** Each page builds its metadata on the server
from its own authored SEO fields (a small reusable SEO contract carrying meta title, description,
`noindex` / `nofollow` flags, a canonical URL, and an OG image reference) merged with the global
settings. The key discipline is that this runs server-side per route, so the tags are in the HTML
before it ships, not painted on afterwards.

📷 **[Screenshot: the SEO fields group on a content type in the Optimizely editor: meta title,
description, canonical, no-index toggle, OG image.]**

**2. A global title template from a CMS singleton.** The root layout reads a site-settings block and
sets a title *template* from it, so every child page's title comes out as
`<page> | <tagline> | <site name>` without each page repeating the brand. Conceptually it's just:

```ts
// Root layout: brand suffix comes from CMS settings, applied to every nested page.
title: { template: `%s | ${settings.tagline} | ${settings.siteName}` }
```

Because the suffix lives in the CMS, rebranding the whole site is a single publish rather than a code
change.

**3. JSON-LD per content type.** A small **server-rendered** component emits schema.org structured data
matched to what the page actually is: an `Article` for an article, an appropriate place or event type
for those, and a `BreadcrumbList` for the breadcrumb trail. Because it renders on the server, the
structured data is in the initial HTML where validators and crawlers read it.

📷 **[Screenshot: a rich-results / structured-data validator showing valid JSON-LD detected for a
published page.]**

**4. Robots, failing closed.** A single global crawl switch in the CMS settings, defaulting to **OFF**,
drives the site's robots output. Until someone explicitly turns crawling on, the site disallows
everything; per-page `noindex` / `nofollow` then layer on top for finer control. The default matters:
the safe state is "not indexed," and you opt *into* visibility rather than remembering to opt out.

📷 **[Screenshot: the global crawl toggle in the CMS site-settings block, defaulted to off.]**

## What broke, and the fixes

This is the part I'd have wanted to read first. Four things bit me, and none were obvious up front.

**The title template silently skips the home page.** Every page got its brand suffix except the
homepage, which came out bare. The reason is a framework quirk: a title *template* only wraps *nested*
route segments, and the home page shares the root layout's own segment, so the template never applies to
it. The fix is to build the homepage title explicitly from the same settings: apply the suffix by hand
for that one page. Easy to miss precisely because it's the one page you look at most and stop
scrutinising.

**Robots is the most likely thing to crash your build.** The robots logic runs at module load, and if
it constructs the CMS/Graph client eagerly, an environment without a Graph key (a CI build without
production secrets, say) throws before it can return anything, failing the whole build. The fix is to
lazy-init: only build the client when the key is present, and if it's missing, return "disallow
everything." That way a missing secret and an off switch both resolve to the same safe answer (don't
index), and the build survives either way.

**An unset content reference is not null.** This one wasted real time. When an author leaves an OG image
or hero reference empty, Graph doesn't return `null`; it returns an *object* whose inner fields are
null, something like `{ key: null, url: { default: null } }`. That object is truthy, so a naive "is the
image set?" check passes and you emit broken image metadata pointing at nothing. Test the inner value
(the `key` or the resolved URL), never the wrapping object.

**Scope the settings singleton correctly, or multisite bites later.** Reading the global settings with
an unscoped "give me the one record" query works with a single site and breaks the day a second one
exists. Scope it to the current site's Start Page subtree instead. It's the same query that makes the
whole SEO setup multisite-safe for free (each site resolves its own brand and metadata), and it keeps
working whether the settings block sits directly under the start page or inside a folder. (I wrote up
that settings model in its own post; see below.)

## How I verified it

The one habit that catches all of the above: check the *source*, not the rendered DOM. View the raw
HTML the server returned, not the inspector's post-hydration tree, and confirm the title, meta,
canonical, OG tags, and JSON-LD are all present in that first response. Then run a page through a
structured-data validator to confirm the JSON-LD parses. If it's only there in the hydrated DOM, a
crawler won't see it, and "looks right in the browser" will have lied to you.

## The checklist

| Goal | The move | The trap it avoids |
|---|---|---|
| SEO in the initial HTML | Resolve metadata server-side per route | Client-only tags a crawler never sees |
| One-publish rebrand | Global title template from a CMS singleton | Brand string duplicated across templates |
| Rich results | Server-rendered JSON-LD per content type | Structured data that only exists post-hydration |
| No accidental indexing | Crawl switch defaulting **off**, fail-closed | A pre-launch environment leaking into search |
| Correct image metadata | Test the reference's inner value, not the object | Broken OG images from a truthy-but-empty reference |
| Multisite-ready | Scope settings to the Start Page subtree | An unscoped `limit: 1` returning the wrong site |

## Closing thoughts

Server-rendered SEO on a headless stack isn't hard, but it is unforgiving: the difference between "in
the initial HTML" and "added after hydration" is invisible in a browser and decisive to a crawler. The
mindset that kept me honest was to treat every SEO concern as something the *server* must have already
answered by the time the response leaves, and to verify it by reading the raw source, not the DOM.

I'd love to hear how other teams handle this on Optimizely SaaS, particularly how you're generating
JSON-LD per content type, and whether you fail your crawl policy open or closed. Anyone found a cleaner
way to handle the home-page title exception?

## Related reading

- *Best-practice global site settings with no public URL*: the settings singleton this post reads
  from, and how to keep it off the public web and multisite-safe.
- *Content modeling for Visual Builder*: where the per-page SEO fields fit alongside pages,
  experiences, and components.
- For the details of metadata resolution, robots, and Graph querying, see the official Optimizely SaaS
  CMS documentation.

---

_Have a correction or a better way to frame any of this? Reach out; I keep these posts updated as the
platform evolves._
