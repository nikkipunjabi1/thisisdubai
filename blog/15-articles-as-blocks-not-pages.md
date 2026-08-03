---
title: "Modeling high-volume content as blocks, not pages, in Optimizely SaaS CMS"
status: draft
audience: Optimizely community / dev.to / LinkedIn (long-form)
author: Nikki Punjabi
tags: [optimizely, saas-cms, optimizely-graph, visual-builder, nextjs, content-modeling, information-architecture]
---

> **Draft for review.** Screenshot placeholders are marked 📷, swap in real captures from your own
> Optimizely SaaS instance before publishing.

## The scenario: a section that has to scale to thousands

Sooner or later a project needs a content type that grows without limit: an articles section, a
knowledge base, a product catalogue, a press archive. Something editorial or record-like that starts
at a few dozen items and is expected to reach thousands, with clean, dated URLs like
`/articles/2026/06/<slug>`.

It sounds routine. On Optimizely SaaS CMS it sent me down two dead ends before the way out changed how
I think about "content" versus "pages" entirely. Here's the whole thing, mistakes included, because
on this one the mistakes are the useful part.

## Why it's trickier than it looks on SaaS

Optimizely's long-standing guidance is to keep roughly **100 children per container** and bucket
beyond that (by year and month, for anything dated). On classic CMS you'd reach for folders in the
tree and move on. On SaaS, two facts collide:

- The **Pages tree is a routing view**: it renders only routable content.
- **Folders aren't routable**, and they don't live in the Pages tree at all.

So the obvious "just add year folders under the section" move quietly breaks, and it breaks in a way
that still *looks* healthy in the API. That's what makes it worth writing down.

## Attempt 1: year folders in the Pages tree (looked right, was invisible)

I made a folder per year under the section and parented the records into it. In Optimizely Graph it
looked perfect: everything resolved at the expected dated URLs, the folder contributed the path
segment, every query returned what I expected.

Then I opened the CMS editor. The **section node had no expandable children.** No year folder, no
records, no way for an author to reach or create one from the tree.

> **The Pages tree renders only routable content** (experiences and pages). A folder is not routable,
> so it never shows there, **and everything nested under it disappears with it.** I'd made the entire
> section unauthorable while it looked perfectly healthy in the API.

The documentation is explicit once you go looking: folders organise media files and shared blocks and
live **in the assets panel**, and renaming or moving them never breaks content links, because they're
organisational and never affect routing. That's exactly why data-record folders elsewhere (a taxonomy
group, a settings group) work fine: they're on the **assets / blocks** side, not in the Pages tree.
**Rule learned: never put a folder in the Pages tree.**

📷 **[Screenshot: the Pages tree with the section node collapsed and empty (no expandable children),
next to the same content resolving fine in a Graph query.]**

## Attempt 2: flat pages under the section (authorable, but doesn't scale)

Fine: drop the folders and leave the records as flat page children of the section experience. Now
they're visible and one click to create. But this walks straight into the ~100-per-node limit at the
planned scale: the editor tree degrades, and you're back to the exact problem folders were meant to
solve, except folders aren't allowed here.

So a page-per-record is a dead end at scale. The thing to question wasn't *where* the records go in the
tree. It was whether a record should be a **page** at all.

## The fix: the record is *content*, not a page

Model each record as a **shared block** (a `_component`). Blocks live in the **shared-blocks (assets)
panel**, where folders *are* supported and scale, so you get exactly the year/month organisation you
wanted, in the one place the CMS is happy to show it:

| Layer | Where it lives | What's there |
|---|---|---|
| Pages tree | Section experience | the listing page, at `/articles` |
| Shared blocks | Application ▸ Articles ▸ 2026 ▸ 06 | the record blocks, foldered by date |
| Public URL | owned by the app | `/articles/2026/06/<slug>` |

The catch (and the thing that makes this design click) is that a **block has no URL of its own.** The
documentation is blunt about it: you can't access blocks through a unique URL; they're included as part
of other content. So the **app owns routing**, not the CMS:

- The block carries a `slug` field marked **queryable**, so a frontend route can look it up in Graph
  by slug.
- The `/<year>/<month>/` segments are derived from the block's **publish date**, *not* from its folder.
  The folder is purely editorial: moving a block between folders never changes its URL.

Conceptually, the app builds the URL rather than reading it from the CMS:

```ts
// blocks have no CMS URL; the app derives it from slug + publish date
articleHref(slug, publishDate) // → /articles/<yyyy>/<mm>/<slug>
```

📷 **[Screenshot: the shared-blocks panel showing the Articles ▸ 2026 ▸ 06 folder hierarchy with
record blocks inside (the scalable organisation the Pages tree couldn't give).]**

Two more details that mattered:

- **The block must declare a composition behaviour** (element-enabled). Without one, a `_component`
  isn't exposed as an Optimizely Graph **root type**, so you can't query the type at all. It's the same
  trick that turns a taxonomy component into a queryable type: a `_component` can absolutely be a
  first-class, filterable content type.
- **Base types are immutable.** You can't turn an existing `_page` into a `_component`; you delete and
  recreate. To avoid gating every step on a destructive delete, introduce a *new* key alongside the old
  page type, cut the frontend over, then retire the legacy type and its instances once they're empty.

## Wiring the listing to a block-backed section

There's one integration wrinkle worth flagging. A reusable listing component typically finds a
section's children by matching on their tree path. But the record **blocks aren't under the section in
the tree**, so a path match finds nothing.

The fix is small: detect that the listing's source is the block-backed section (by its own type) and,
for that case, query the record type directly with no path filter, then synthesise each card's link
from the block's slug and publish date.

📷 **[Screenshot: the listing page rendering the block-backed records (paged, sorted, and faceted)
with dated URLs, none of which correspond to a node in the Pages tree.]**

The detail route is then an ordinary dynamic route (`/articles/[year]/[month]/[slug]`): resolve the
block by slug, render its body, breadcrumb, and structured data, and build metadata from the block's
SEO fields. Because the URLs are derived rather than tree-owned, they can be prerendered from the full
list of slugs.

## The result

- Editors add a record under **Shared Blocks → Application → Articles → `<year>` / `<month>` → Create
  Shared Block**, set the slug and publish date, and publish. It appears in the listing and at its URL
  automatically.
- The listing shows the blocks (paged, sorted, faceted) with dated links; the detail pages render the
  full records.
- The section scales to thousands without a single folder in the Pages tree, and the tree itself stays
  tiny: a home page plus a handful of section experiences.

## The lesson I'll keep

> On a SaaS CMS, "where does this content go in the tree?" is often the wrong question. Ask whether it
> belongs in the tree at all.

Uniform, high-volume content is *data*. Model it as blocks, organise it with asset folders, and let the
app own the URLs. The Pages tree is for the things that genuinely earn a routable node, not for the
long tail of records that only ever appear inside a listing.

I'd love to hear how other teams have modelled high-volume sections on SaaS, where you drew the
page-versus-block line, and whether you let the CMS or the app own the URLs. What worked?

---

## Related reading

- Content modeling for Visual Builder: pages vs experiences vs components
- A reusable, server-rendered listing engine on Optimizely SaaS + Visual Builder
- Best-practice global site settings with no public URL

For the authoritative rules on blocks, folders, and routable content, see the official Optimizely SaaS
CMS documentation.
