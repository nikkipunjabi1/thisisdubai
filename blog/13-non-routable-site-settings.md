---
title: "The page that shouldn't have a URL: best-practice global site settings in Optimizely SaaS CMS"
status: draft
audience: Optimizely community / dev.to / LinkedIn (long-form)
author: Nikki Punjabi
tags: [optimizely, saas-cms, optimizely-graph, content-modeling, seo, multisite]
---

> **Draft for review.** Screenshot placeholders are marked 📷; swap in real captures from your own
> Optimizely SaaS instance before publishing.

## Every site has this pile of settings

Think about the handful of values that belong to a *site* rather than to any one page. The site name.
A tagline that shows up in the browser tab. The master "should search engines crawl this yet?" switch.
Maybe a default social share image, or a support email in the footer. They're small, they change
rarely, and every page needs them.

The requirement sounds trivial: edit these in **one** place, read them on **every** page. And yet it
is one of the easiest things to model badly on any CMS. I've seen it done as a top-level page (which
promptly leaks a public URL nobody wanted), as a scatter of fields duplicated across templates (change
one, forget the other five), or as environment config that editors can't touch without a developer.

On Optimizely SaaS I wanted three things from this singleton: editors can find and change it in one
publish, it is **impossible to reach on the public web**, and it stays correct the day the project
grows to more than one site. This post is how I landed on that, and the couple of traps that cost me
an afternoon each.

## Why it's trickier than it looks on SaaS

The instinct carried over from classic Optimizely is to make a "Settings" page and hang it somewhere
near the root of the tree. That instinct is exactly wrong here, for two reasons that are specific to a
headless SaaS setup.

First, in a headless world **anything in the routing tree is a candidate for a URL.** If your frontend
has a catch-all route resolving CMS content by path (and most headless Optimizely frontends do), then
a settings *page* is one careless slug away from rendering as a real, indexable page. Global config
rendering as public HTML is the kind of leak nobody notices until it shows up in a search result.

Second, everything you want to read has to come back through **Optimizely Graph**, and Graph has
opinions about what is queryable and how you scope a query. "Just grab the one settings record" is a
one-liner that quietly breaks the moment a second site exists. More on that below.

## Where it belongs, and where it doesn't

Global settings are **data, not a page**, so they have no business in the routing tree at all. The
right home on SaaS is a **shared block** (a component content type with no URL of its own) living in
the **Shared Blocks (Assets) panel**, grouped in its own folder so editors can find it.

```
Shared Blocks ▸ For This Application ▸ Site Configurations ▸ Site Settings
```

Editors manage it from the Shared Blocks panel: no page-tree entry, no non-routable page to explain,
no per-type access grants to configure. It's a singleton they open, edit, and publish. That one block
drives the global **title template** (something like `<page> | <tagline> | <site name>`), so a
rebrand is a single publish, and it holds the global crawl switch that governs whether the site is
allowed into search at all.

📷 **[Screenshot: the Shared Blocks (Assets) panel with a "Site Configurations" folder containing the
Site Settings block.]**

📷 **[Screenshot: the Site Settings block open in the editor, showing fields like site name, tagline,
and the crawl on/off toggle.]**

## Keeping it off the public web

A shared block already has no URL, which is most of the battle. But there's a subtlety: shared blocks
*do* surface in Graph (that's the whole point, since I query them for the settings), and a catch-all
frontend router can, in theory, be handed a block's internal path and try to render it.

So I don't rely on "blocks happen not to route." I guard the router explicitly, and I guard by **base
type** rather than by the specific content type's name:

```ts
// Routable content is _experience / _page only. Everything else 404s.
const NON_ROUTABLE = new Set(['_Component', '_Folder']);
```

The router checks the resolved content's base types against that set and returns a 404 for anything
non-routable, in both the request handler and wherever the frontend pre-generates static paths.
Guarding by base type is the important decision here: it catches *every* block and folder
automatically, so a new component type added six months from now is excluded without anyone
remembering to add it to a list. Deny-by-default beats maintain-a-list every time.

## The multisite-safe query

Here's the one that looks finished but isn't. The obvious way to fetch a singleton is an unscoped query
with `limit: 1`: return the one settings record. That's correct with exactly one site, and silently
wrong the moment a second site is added, because now there are two settings blocks and `limit: 1`
returns whichever one Graph feels like handing you.

The fix is to scope the query to the **current site's Start Page subtree**, using the metadata path
(the block's ancestor chain) rather than its immediate container:

```graphql
query($startPath: String!) {
  SiteConfiguration(where: { _metadata: { path: { eq: $startPath } } }, limit: 1) {
    items { siteName titleTagline titleSeparator }
  }
}
```

Matching on `path` (the ancestor chain) rather than the direct container means the query resolves
whether the block sits directly under the Start Page or one folder deeper, so I can reorganise the Assets
panel without breaking the read. And because the frontend already resolves the Start Page from the
current host, each site reads *its own* settings with no code change the day the project goes
multisite. The multisite-safety is a free side effect of scoping correctly on day one, which is exactly
when it's cheapest to get right.

📷 **[Screenshot: an Optimizely Graph query in the GraphQL explorer returning a single scoped
SiteConfiguration record.]**

## What broke, and the fixes

Three things tripped me up. Each is the kind of thing you only learn by hitting it.

**A block isn't queryable in Graph until it opts in.** I modeled the settings type, pushed it, and
`SiteConfiguration` simply wasn't a queryable root type in Graph; the query errored on an unknown
type. The cause: a component content type doesn't get exposed to Graph until it declares a composition
behaviour. Adding an `elementEnabled` behaviour surfaced it. It's the same requirement any
data-carrying block has to satisfy; I just hadn't expected a settings object to need it.

**Base types are immutable, so "move it" is really "recreate it."** I had originally prototyped these
settings as a page type, then decided they belonged on a block. You can't edit a content type's base
type: page to component isn't an in-place change. It's a delete-and-recreate under a new type key,
carrying the authored values across, sequenced carefully around a config push so you don't lose the
data mid-migration. Worth knowing before you commit to a base type, because changing your mind later is
a small project rather than an edit.

**The title template doesn't wrap the home page.** Once the settings drove a global title template, I
noticed the homepage was missing its brand suffix while every other page had it. This is a headless
framework quirk, not an Optimizely one: because the home page shares the root layout's route segment,
the framework's title *template* skips it. The fix is to build the home page's title explicitly from
the same settings, so the brand suffix is applied by hand exactly where the template can't reach.

**And then I proved the guard actually holds.** After wiring the base-type router guard, I didn't
assume. I hit the settings block's internal asset path directly and confirmed a real 404. A settings
object that quietly renders as a public page is precisely the leak that goes unnoticed until it's
indexed, so "guard, then verify the guard" is worth the two minutes.

📷 **[Screenshot: a browser showing a 404 response when hitting the settings block's path directly,
confirming it has no public URL.]**

## The cheat-sheet

If I were handing this to another team starting a SaaS build, it's five lines:

| Decision | Do this |
|---|---|
| Where do global settings live? | A **shared block** in the Assets panel, in its own folder, never a page |
| How do you keep them off the web? | Guard the router by **base type** (`_Component`, `_Folder` → 404), not by name |
| How do you read the singleton? | Scope by the **Start Page subtree** (`_metadata.path`), never an unscoped `limit: 1` |
| Why is it not queryable? | A component must declare a **composition behaviour** to appear in Graph |
| Can you change your mind on the type? | **Base types are immutable**; moving a page to a block is delete + recreate |

## Closing thoughts

None of this is difficult once you've seen it, but almost every piece is a decision you'd rather make
on day one than discover in month three: the routing leak, the immutable base type, the unscoped query
that works right up until it doesn't. The through-line is a single mental model worth adopting early:
**global settings are data, not a page.** Once you treat them that way, they land in the Assets panel,
stay off the public web by default, and scale to multisite without a rewrite.

I'd love to hear how other teams handle site-wide configuration on Optimizely SaaS, especially anyone
running genuinely multisite. Do you scope the same way, or have you found a cleaner pattern? What did
your settings model look like before it settled?

## Related reading

- *Server-rendered SEO + JSON-LD on every Optimizely SaaS page*: where these settings actually get
  consumed to build titles and metadata.
- *Modeling high-volume content as blocks, not pages*: the same "content, not a page" instinct applied
  at scale.
- For the specifics of composition behaviours, base types, and Graph querying, see the official
  Optimizely SaaS CMS documentation.

---

_Have a correction or a better way to frame any of this? Reach out; I keep these posts updated as the
platform evolves._
