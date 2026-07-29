---
title: "Content modeling for Visual Builder: pages vs experiences vs components (Optimizely SaaS)"
status: draft
audience: Optimizely community / dev.to / LinkedIn (long-form)
author: Nikki Punjabi
tags: [optimizely, saas-cms, visual-builder, content-modeling, cms-sdk, contracts]
---

> **Draft for your review.** Edit the voice/details freely before publishing.

> ⚠️ _Independent, unofficial learning project — not affiliated with any tourism authority or brand.
> Original wordmark and royalty-free assets only._

## What I set out to do

Model a real content site on Optimizely SaaS in code, and actually understand the base types —
because choosing the wrong one is expensive to undo. This is the mental model I wish I'd had on day
one: **when to use a page, an experience, a component (block), a folder — and a contract.**

## The base types, in plain terms

- **`_page`** — routable content the CMS owns the URL for. Its position in the Pages tree *is* its
  URL. Use it for canonical, individually-addressable things (a place, an event, an area).
- **`_experience`** — a routable **Visual Builder canvas**: a composition of nodes (sections →
  elements) the author arranges. Use it for pages whose layout the author composes — landing pages
  and section/listing pages.
- **`_component`** — a **block**: a reusable content unit with **no URL of its own**. Two flavours in
  practice: *presentational* blocks dropped on a canvas (Hero, Section Heading, Rich Text), and
  *data-record* blocks (taxonomy terms, config singletons, high-volume content).
- **`_folder`** — an **organisational container**. Critical SaaS detail: folders live in the
  **assets/Shared-Blocks panel**, **not** the Pages tree, and never affect routing.
- **`_image` / `_media` / `_video`** — asset types uploaded content resolves to. Register at least
  `ImageMedia` (`baseType: '_image'`, empty `properties`).

And the glue: **`contract()`** — a reusable property set (mine is `SeoMetadata`) that types
`extends`, so every page carries the same SEO fields without copy-paste.

## How I mapped my site onto them

- **HomePage** and the section pages (**PlacesToVisit / Neighbourhoods / Events / Articles**) →
  **`_experience`** (composed in Visual Builder; one shared renderer drives all the section pages).
- **PointOfInterest / Area / Event** → **`_page`** (each is a URL, a child of its section).
- Presentational blocks (**Hero, SectionHeading, RichTextBlock, SectionListing**) → **`_component`**
  with `compositionBehaviors: ['sectionEnabled', 'elementEnabled']` so authors can drop them on a canvas.
- Data-record blocks — **TagTerm** (taxonomy), **SiteConfiguration** (global settings singleton),
  **ArticlePost** (editorial content at scale) → **`_component`**, grouped into named folders in the
  Shared Blocks panel.

## The non-obvious rules I learned

> 🧩 **A `_component` can be a first-class, queryable, filterable data type — not just a block on a
> canvas.** The catch: it's only exposed as a **Graph root type** if it declares a
> `compositionBehaviors` (e.g. `['elementEnabled']`). That single line is what lets you query
> `TagTerm` / `ArticlePost` directly and filter references by `key`. (I'd wrongly believed a
> filterable taxonomy *had* to be a `_page`.)

> 🧩 **Base types are immutable.** You cannot change a type's base type in place — you delete and
> recreate. To avoid a destructive, gated migration, introduce a **new key** and cut over
> (`Tag → TagTerm`, `Article → ArticlePost`), then retire the old type once its instances are gone.

> 🧩 **`extends` a contract, don't repeat fields.** `SeoMetadata` as a `contract()` keeps SEO
> consistent across every page and is a single place to evolve it.

> 🧩 **Model deliberately, up front.** Adding a required field (or changing indexing) to a type that
> already has content is a *breaking* `config push` (needs `--force`, risks data loss). Do a
> `config pull --json` backup first, and prefer getting the shape right before content exists.

> 🧩 **Put layout choices in display templates, not content fields.** A single shared display
> template bound to `baseType: '_component'` gives every block the same Theme (light/dark) + Width
> controls; author picks arrive as `displaySettings`. Route it all through one `<SectionShell>`
> primitive so components never hand-roll width/theming.

## The heuristic I use now

> **Does this thing need its own URL?** Yes → `_page` (fixed layout) or `_experience` (author-composed
> layout). No → `_component` (a block: presentational, or a data record organised in asset folders).
> Organising many of them? → asset **folders** (never the Pages tree).

## Result

A content model that reads cleanly, mirrors the site's URLs where it should, and keeps
high-volume/config content as blocks out of the routing tree — the foundation the listing engine,
SEO, and search all build on.

## Links
- Repo: _this-is-dubai_ — see `docs/CONTENT-MODEL.md` and `docs/CONTENT-ARCHITECTURE.md`.
- Related: post #13 (Site Settings as a non-routable block), #14 (listing engine), #15 (articles as blocks).
