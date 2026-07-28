---
title: "Thousands of Articles in Optimizely SaaS CMS: model them as blocks, not pages"
status: draft
audience: Optimizely community / dev.to / LinkedIn (long-form)
author: Nikki Punjabi
tags: [optimizely, saas-cms, optimizely-graph, visual-builder, nextjs, content-modeling, information-architecture]
---

> **Draft for your review.** Edit the voice/details freely before publishing. A LinkedIn variant
> can be spun off from the intro + the two "what didn't work" boxes.

> ⚠️ _Independent, unofficial learning project — not affiliated with any tourism authority or brand.
> Original wordmark and royalty-free assets only._

## What I set out to build

An Articles section — editorial guides and news — that scales to **thousands** of pieces without the
CMS becoming a swamp for editors, and with clean, dated URLs (`/articles/2026/06/dubai-on-a-budget`).

Sounds routine. It sent me down two dead ends first, and the way out changed how I think about
"content" vs "pages" on a SaaS CMS. Here's the whole thing, mistakes included — because the mistakes
are the useful part.

## Attempt 1 — year folders in the page tree (looked right, was invisible)

Optimizely's long-standing guidance is to keep **~100 children per container**, and bucket beyond
that (year/month for editorial). So I made a `Folder` (`_folder`) per year under the Articles
section and parented the articles into it. In Optimizely Graph it looked perfect — the articles
resolved at `/articles/2026/<slug>/`, the folder contributed the segment, everything queried fine.

Then I opened the CMS. The **Articles node had no expandable children.** No year folder, no
articles, no way for an author to reach or create one from the tree.

> **The Pages tree is a _routing_ view.** It renders only routable content (`_experience` / `_page`).
> A `_folder` is not routable, so it never shows there — **and everything nested under it disappears
> with it.** I had made the entire section unauthorable while it looked healthy in the API.

The docs are explicit once you go looking: folders *"organize media files"* and shared blocks and
live **in the assets panel**, and *"renaming or moving folders does not cause broken content
links"* — i.e. they're organizational and never affect routing. That's exactly why the `Tag -
Taxonomy` and `Site Configurations` folders I'd made earlier work: they're on the **assets/blocks**
side, not in the Pages tree. **Rule learned: never put a `_folder` in the Pages tree.**

## Attempt 2 — flat pages under the section (authorable, but doesn't scale)

Fine — drop the folders, leave articles as flat `_page` children of the Articles experience. Now
they're visible and one-click to create. But this walks straight into the ~100/node limit at the
planned scale (1000+): the editor tree degrades, and you're back to the problem folders were
supposed to solve — except you're not allowed to use folders here.

So a page-per-article is a dead end at scale. The thing to question wasn't *where* the articles go.
It was whether an article should be a **page** at all.

## The fix — an article is *content*, not a page

Model the article as a **shared block** (`_component`, key `ArticlePost`). Blocks live in the
**Shared Blocks (Assets) panel**, where folders *are* supported and scale — so I get exactly the
year/month organisation I wanted, in the one place the CMS is happy to show it:

```
Pages tree:    Home ▸ Articles              [experience]   → /articles   (the listing page)
Shared Blocks: For This Application ▸ Articles ▸ 2026 ▸ 06 ▸ "Dubai on a budget"   (ArticlePost)
Public URL:    /articles/2026/06/dubai-on-a-budget
```

The catch — and the thing that makes this design click — is that a **block has no URL**. From the
docs: *"You cannot access blocks directly through a unique URL. They must be included as part of
other content, like a page."* So the **app owns routing**, not the CMS:

- The block carries a `slug` field marked **`indexingType: 'queryable'`**, so a Next.js route can
  look it up in Graph: `ArticlePost(where: { slug: { eq: $s } })`.
- The `/<year>/<month>/` segments are derived from the block's **`publishDate`**, *not* from its
  folder. The folder is purely editorial — moving a block between folders never changes its URL.

```ts
// blocks have no CMS URL — the app builds it from slug + publishDate
export function articleHref(slug: string, publishDate?: string | null) {
  const iso = String(publishDate ?? '');
  return `/articles/${iso.slice(0, 4)}/${iso.slice(5, 7)}/${slug}`;
}
```

Two more details that mattered:

- **`compositionBehaviors: ['elementEnabled']`** on the block. Without a composition behaviour, a
  `_component` isn't exposed as a Graph **root type**, so you can't query `ArticlePost` at all. (Same
  trick I'd used to make `TagTerm` a queryable taxonomy — a `_component` can absolutely be a
  first-class, filterable content type.)
- **Base types are immutable.** You can't turn the existing `_page` `Article` into a `_component`;
  you delete and recreate. To avoid gating every step on a destructive delete, I introduced a *new*
  key (`ArticlePost`) alongside the old `Article`, cut the frontend over, then retired the legacy
  type + its instances — the same safe pattern as an earlier `Tag → TagTerm` move.

## Wiring the listing to a block-backed section

The listing engine (one reusable `SectionListing` block, see post #14) matched a section's children
by `_metadata.path`. Article **blocks aren't under the section in the tree**, so that finds nothing.
The fix is small: detect that the listing's source is the **Articles experience** (by its own type)
and, for that case, query the `ArticlePost` type directly — no path filter — then synthesise each
card's href from `slug` + `publishDate`:

```ts
// the Articles experience parents no pages — its "children" are ArticlePost blocks
const src = await getClient().request(
  `query($c:String!){ _Content(where:{_metadata:{key:{eq:$c}}}){ items{ _metadata{ types } } } }`,
  { c: containerKey },
);
if (src?._Content?.items?.[0]?._metadata?.types?.includes('Articles')) return 'ArticlePost';
```

The detail route is a plain `app/articles/[year]/[month]/[slug]/page.tsx`: resolve the block by
`slug`, render hero + rich-text body + related places + breadcrumb + `Article` JSON-LD, and
`generateMetadata` from the block's SEO fields. Prerendered with `generateStaticParams` over every
article slug — no `searchParams` on this route, so static generation is safe.

## Result

- Editors add an article under **Shared Blocks → For This Application → Articles → `<year>`/`<month>`
  → Create Shared Block → Article**, set `slug` + `publishDate`, publish. It appears in the listing
  and at its URL automatically.
- The `/articles` listing shows the blocks (paged, sorted, tag-faceted) with
  `/articles/<year>/<month>/<slug>` links; the detail pages render full articles.
- The section now scales to thousands without a single `_folder` in the Pages tree, and the page
  tree stays tiny: Home + a handful of section experiences.

The one-line lesson I'll keep: **on a SaaS CMS, "where does this content go in the tree?" is often
the wrong question. Ask whether it belongs in the tree at all.** Uniform, high-volume content is
data — model it as blocks, organise it with asset folders, and let the app own the URLs.

## Links
- Repo: _this-is-dubai_ (docs/CONTENT-ARCHITECTURE.md §10 for the full write-up)
- Related: post #14 (the listing engine), post #13 (non-routable Site Settings)
