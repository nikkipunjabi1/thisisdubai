---
title: "A Reusable, Server-Rendered Listing Engine on Optimizely SaaS + Visual Builder"
status: draft
audience: Optimizely community / dev.to / LinkedIn (long-form)
author: Nikki Punjabi
tags: [optimizely, saas-cms, optimizely-graph, visual-builder, listing, pagination, faceted-search]
---

> **Draft for review.** Screenshot placeholders are marked 📷; swap in real captures from your own
> Optimizely SaaS instance before publishing.

## The page every content site has to get right

Almost every site I have ever built has the same workhorse page: a **listing**. A catalogue of
products, an index of articles, a directory of locations: the shape is always the same. A hero at
the top, a line or two of intro copy, a grid of cards, and controls to **page, sort, and filter**.

It sounds like the easy part of the build. It rarely is. The moment a listing has real volume behind
it, the interesting questions arrive all at once: where does the paging state live, do you filter on
the client or the server, how do editors control what appears, and how do you keep the whole thing
fast, shareable, and crawlable?

I wanted to solve this **once** (a single reusable listing engine on Optimizely SaaS CMS that I
could point at any section of a site) rather than hand-building a bespoke page for every index. The
goals were specific:

- editors compose the page in **Visual Builder** (hero above, rich text below the grid),
- it is **fully server-rendered and URL-driven**: shareable, cacheable, no client-side data fetching,
- pagination, sort, and **faceted filters** all run **server-side** through Optimizely Graph,
- and the **content tree mirrors the URLs**, so authoring stays intuitive.

Here is how it came together, and (more usefully) the three things that broke along the way, so
they don't cost you the time they cost me.

## Why this is trickier than it looks on Optimizely SaaS

On a classic, template-driven CMS you would reach for a controller, read the query string, run a
paged query, and render. On Optimizely SaaS with a headless frontend and Visual Builder in the mix,
two constraints reshape the whole design.

First, the listing grid isn't a page template you own end to end; it's a **component dropped onto a
canvas** by an author, rendered from somewhere deep inside a Visual Builder composition. That has
consequences for how state reaches it (see gotcha #1).

Second, all the paging, sorting, and filtering has to go through **Optimizely Graph**, which has its
own rules about what is filterable, how references are queried, and how much it will return in one
call. Those rules are easy to design around once you know them, and genuinely surprising when you
don't.

## The core design: section pages are experiences, the grid is a droppable component

The key decision, and the one that made everything else fall into place: each **section page** (the
index for a category of content) is a Visual Builder **Experience** (a composed, routable canvas),
and the grid itself is a single **listing component** that an author drops onto that canvas.

That framing pays off immediately. "Content above the grid" and "content below the grid" stop being
special cases; they're just other components placed before or after the listing on the canvas. A
hero, an intro paragraph, an FAQ block below the results: all author-composed, none of it
hard-coded.

📷 **[Screenshot: a section/listing page open on the Visual Builder canvas, with a hero component,
the listing component, and a rich-text component stacked in the composition.]**

One shared renderer drives every section, so a product index, an article index, and a location
index all run through the same code path. The listed items are modeled as **children of the section
page**, which keeps the content tree and the public URLs in lockstep: `/products` is the parent of
`/products/some-item`, and the breadcrumb trail falls out of the tree for free.

The component itself stays deliberately thin. It carries a **source reference** (which section it
lists) and a CMS-managed **page size**, and delegates the real work to one query helper that
auto-detects the child content type and then paginates, sorts, and filters server-side.

📷 **[Screenshot: the listing component's settings in the editor, showing the source reference and the
page-size control an author can set.]**

## Gotcha #1: request state can't reach a component inside a composition

Pagination, sort, and filter state all live in the **URL**, something like
`?page=2&sort=-name&tag=featured`. That's the right call: the state is shareable, bookmarkable, and
cacheable, with no client JavaScript involved.

The problem is getting that state to the grid. In a modern headless framework, the query-string
parameters are handed to you **only at the route level**, the top of the page. But my grid renders
*deep inside* the Visual Builder composition, several layers down, and the composition renderer
doesn't forward arbitrary props down to the components it draws. The one place that has the URL state
and the one place that needs it never meet.

The fix is a small **request-scoped store**. The route (the single place that receives the URL
parameters) seeds a per-request object; the listing component, wherever it happens to sit in the
tree, reads from it. The critical property is that the store is **fresh for every request**, so there
is no chance of one visitor's paging state leaking into another's. Conceptually it's tiny:

```ts
// One request-scoped object: the route seeds it, the component reads it.
seedListingState({ page, sort, filters });  // called once, at the route
const state = getListingState();            // read inside the listing component
```

That single pattern unlocked pagination, sort, *and* filters without shipping a line of client-side
data fetching. If you take one thing from this post, take this: **when a component needs request
context it can't be handed directly, a request-scoped store beats prop-drilling through a renderer
you don't control.**

## Gotcha #2: deleting a parent page cascade-deletes its children

This is the one that actually hurt. While migrating a set of older listing pages over to the new
Experience-based model, I had a script whose job was to find each old page's children, move them, then
delete the emptied parent.

The "find the children" query silently came back **empty**, so the script concluded there was
nothing to move and cheerfully **deleted the parent pages while they still had children, taking every
child down with them.** A whole section's worth of content, gone in one run.

Two lessons came out of that, both now permanent guards in any migration I write:

1. **Optimizely Graph caps how much it returns in one call, and asking for more is an *error*, not a
   silent clamp.** My query requested more items than the per-query limit allows. Instead of
   returning the maximum, the call failed, and my code treated "the query errored" as "there are no
   children." That misread is what triggered the cascade.
2. **Never delete a container on an empty result you haven't verified.** A destructive step must
   distinguish "confirmed empty" from "the query failed." The rule now is simple: if the child query
   returned an error, **skip the delete** rather than assume the container is safe to remove.

Recovery happened to be clean because the content was re-seedable, but that was luck, not design. A
five-line guard is always cheaper than a restore.

> **The cheap guard:** before any cascade-capable delete, treat a query *error* and an *empty result*
> as two different things. Only the second one is ever safe to act on.

## Gotcha #3: not every field is filterable, and references filter by key

Building the facets surfaced two more Optimizely Graph modelling surprises worth knowing before you
start.

**A scalar field isn't filterable until it's indexed for querying.** I expected to filter on a simple
category field straight away, but it wasn't in the filter input at all, because the property hadn't
been marked as queryable in the content model. Adding that, then re-publishing the content so it
re-indexes, is what makes a field show up as a filter. Worth flagging to your team: changing a
field's indexing behaviour is a **breaking** configuration change, so it needs a forced schema push,
not an ordinary one.

**A content reference filters by its key, not by a friendly field.** When a facet is backed by a
reference (say, a set of tags or categories that are themselves content) you can't filter by a
readable field like a slug. Graph filters that reference by its **key**. The clean pattern is to keep
the URL human-readable (`?tag=featured`) and resolve that slug to the underlying key just before
querying. Readable URLs, correct query, no compromise on either.

There's a related subtlety on the query itself. A **generic content interface** only exposes
interface-level fields for filtering (the shared metadata) so it can't filter on the type-specific
fields the facets actually need. To filter on those, you have to query the **concrete content type**.
That's why the engine peeks at one child to detect its type, then queries that type directly.

📷 **[Screenshot: the content model showing a field's indexing/queryable setting in Optimizely SaaS.]**

📷 **[Screenshot: the finished listing page with active facets: sort control, filter chips, and
pagination, all reflected in the URL.]**

## Two smaller wins worth stealing

- **Breadcrumbs straight from the tree.** Because items are children of their section, a single
  breadcrumb component can resolve every ancestor by its cumulative URL and emit `BreadcrumbList`
  structured data, automatically, on every listing and detail page, with no per-page wiring.
- **No scroll jank on sort/filter/paging.** When those controls are ordinary navigation links, the
  default behaviour resets scroll on navigation and the page jumps to the top on every interaction.
  Opting out of that scroll reset keeps the reader exactly where they were: a one-line fix that
  makes the whole thing feel like an app.

## The engine, at a glance

| Concern | How it's handled |
|---|---|
| Page composition | Section page is a Visual Builder **Experience**; the grid is a droppable component |
| Above/below the grid | Just other components on the canvas: hero, rich text, FAQ |
| Request state (page/sort/filters) | URL-driven, handed to a **request-scoped store** the component reads |
| Pagination & sort | **Server-side** through Optimizely Graph |
| Faceted filters | Server-side; scalar fields must be **queryable**, references filter by **key** |
| Type-specific filtering | Detect the child type, then query the **concrete type**, not the interface |
| URLs & tree | Items are **children** of the section, so tree and URLs stay in lockstep |
| Breadcrumbs & SEO | Derived from the tree; structured data emitted automatically |

## A migration checklist, learned the hard way

- **Treat a query error and an empty result as different things.** Never let "the query failed" masquerade as "nothing's there," especially before a delete.
- **Guard every cascade-capable delete.** If the child lookup didn't cleanly succeed, don't remove the container.
- **Respect Graph's per-query limit.** Asking for more than it allows fails the call; page through instead of over-fetching.
- **Mark fields queryable *before* you build the facet.** And remember it's a breaking schema change, so plan the forced push and the re-index.
- **Keep URLs human, keys internal.** Resolve readable slugs to reference keys at query time.

## Closing thoughts

The satisfying part of this build wasn't any single query; it was that **one component now powers
every section of the site**. An author composes a canvas, drops the listing on it, points it at a
source, and gets server-side pagination, sorting, and faceted filters, all URL-driven and
server-rendered, with cards that mirror the content tree. Adding a brand-new section is a new
Experience, a card, and a config entry, not a new build.

Almost everything hard here came down to two mindset shifts: **push request state through a
request-scoped store instead of fighting the renderer**, and **respect what Optimizely Graph will and
won't do**: its query limits, its indexing rules, its key-based references. Neither is difficult once
named; both are expensive to discover mid-project.

I'd love to hear how other teams have approached reusable listings on Optimizely SaaS, especially
how you handle faceted filtering at scale, and whether you've found a cleaner way to get request state
into a composed component. What worked for you, and what didn't?

---

**Related reading**

- *From Content Areas to the Visual Builder canvas*: rethinking page composition in Optimizely SaaS
- *Modeling high-volume content as blocks, not pages* in Optimizely SaaS
- *Server-rendered SEO + JSON-LD on every Optimizely SaaS page*
- *Diagnosing Optimizely Graph performance*

For the specifics of indexing behaviour, query limits, and the composition APIs, see the official
Optimizely SaaS CMS documentation.
