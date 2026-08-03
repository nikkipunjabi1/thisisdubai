---
title: "Content modeling for Visual Builder: pages vs experiences vs components (Optimizely SaaS)"
status: draft
audience: Optimizely community / dev.to / LinkedIn (long-form)
author: Nikki Punjabi
tags: [optimizely, saas-cms, visual-builder, content-modeling, cms-sdk, contracts]
---

> **Draft for review.** Screenshot placeholders are marked 📷, swap in real captures from your own
> Optimizely SaaS instance before publishing.

## The decision you make once and live with for months

Every Optimizely SaaS project starts with the same fork in the road: you sit down to model the
content, and the very first question is which **base type** each thing should be. A landing page, an
article, a reusable hero, a taxonomy term, the global site settings: each one is a page, an
experience, a component, or a folder, and the SDK makes you commit that choice in code.

It feels like a small decision. It is not. Base types are effectively immutable: you cannot change a
type's base type in place, so getting it wrong means a delete-and-recreate migration once real content
exists. I learned that the slow way. This post is the mental model I wish I'd had on day one: **when
to reach for a page, an experience, a component, a folder, and a contract to tie them together.**

## Why this is trickier than it looks on SaaS

On classic Optimizely, "page vs block" was a fairly intuitive split and the tree forgave a lot. On
SaaS CMS with Visual Builder, the base types carry more weight and a few of the rules are genuinely
counter-intuitive:

- A **component (block)** isn't just a presentational widget any more; it can be a first-class,
  queryable data type, which blurs the old "page = data, block = layout" instinct.
- **Folders don't live in the Pages tree.** They organise assets and shared blocks, so where you put
  something and how you organise it are two separate decisions.
- The choice you make interacts with routing, with Optimizely Graph, and with how authors compose
  pages in Visual Builder, all at once.

So the base type isn't a labelling exercise. It decides whether something gets a URL, whether it's
queryable, where an author finds it, and how expensive it is to change later.

## The base types, in plain terms

- **`_page`**: routable content the CMS owns the URL for. Its position in the Pages tree *is* its
  URL. Reach for it when something is canonical and individually addressable and its layout is fixed
  (think: a product detail page, an article with a set template, a section landing page you don't want
  authors rearranging).
- **`_experience`**: a routable **Visual Builder canvas**, a composition of nodes (sections to
  elements) the author arranges. Use it for pages whose layout the author composes: marketing landing
  pages, a section/listing page built from dropped-in components.
- **`_component`**: a **block**, a reusable content unit with **no URL of its own**. Two flavours in
  practice: *presentational* blocks dropped on a canvas (a hero, a section heading, a rich-text block),
  and *data-record* blocks (taxonomy terms, a config singleton, high-volume content records).
- **`_folder`**: an **organisational container**. The SaaS detail that trips everyone up: folders
  live in the **assets / shared-blocks panel**, **not** the Pages tree, and never affect routing.
- **`_image` / `_media` / `_video`**: the asset types uploaded content resolves to. Register at least
  an image media type (`baseType: '_image'`, empty `properties`) so uploads have somewhere to land.

And the glue that keeps the whole model consistent: a **contract**, a reusable property set (for
example an `SeoMetadata` contract) that types can `extend`, so every page carries the same SEO fields
without copy-pasting field definitions across a dozen types.

📷 **[Screenshot: the content-type list in the Optimizely SaaS admin, showing types grouped by base
type (pages, experiences, and components) side by side.]**

## How I decide, in practice

Rather than memorise the base types, I map each thing onto them with a couple of questions. As a
worked example, imagine a fairly ordinary content site: a home page, a few section pages, some detail
records, and a handful of reusable blocks:

- **The home page and section pages** whose layout authors compose → **`_experience`**, and one shared
  renderer can drive all the section pages.
- **Detail records with a fixed template** (each one a canonical URL under its section) → **`_page`**.
- **Presentational blocks** (hero, heading, rich text, a listing block) → **`_component`** with a
  composition behaviour so authors can drop them onto a canvas.
- **Data-record blocks** (a taxonomy term type, a global-settings singleton, a high-volume content
  type) → **`_component`**, grouped into named folders in the shared-blocks panel.

📷 **[Screenshot: the shared-blocks (assets) panel with named folders grouping data-record
components (the organisation the Pages tree can't give you).]**

## What broke, and the rules that came out of it

The model above looks tidy in hindsight. Getting there cost me a few sharp lessons, and these are the
ones worth writing on a sticky note.

> 🧩 **A `_component` can be a first-class, queryable, filterable data type, not just a block on a
> canvas.** The catch: it's only exposed as an Optimizely Graph **root type** if it declares a
> composition behaviour (conceptually, one line marking it element-enabled). That single declaration is
> what lets you query the type directly and filter references by key. I'd wrongly believed a filterable
> taxonomy *had* to be a `_page`. It doesn't.

> 🧩 **Base types are immutable.** You cannot change a type's base type in place; you delete and
> recreate. To avoid a destructive, gated migration on live content, introduce a **new key** and cut
> over (old type → new type), then retire the old type once its instances are gone.

> 🧩 **`extend` a contract; don't repeat fields.** A shared SEO contract keeps metadata consistent
> across every page and gives you a single place to evolve it. Copy-pasted fields drift; a contract
> doesn't.

> 🧩 **Model deliberately, up front.** Adding a required field (or changing indexing) to a type that
> already has content is a *breaking* change to push: it can need a force flag and risk data loss.
> Back up your config first, and prefer getting the shape right before content exists.

> 🧩 **Put layout choices in display templates, not content fields.** A single shared display template
> bound to the component base type gives every block the same Theme (light/dark) and Width controls;
> the author's picks arrive as display settings. Route it all through one shared layout primitive so
> components never hand-roll width and theming.

📷 **[Screenshot: a display template's controls in the editor, Theme and Width options an author
picks, kept out of the content fields.]**

## The heuristic I use now

When a new type shows up, I run it through one question and I'm done:

> **Does this thing need its own URL?**
> **Yes** → is the layout author-composed? `_experience`. Fixed? `_page`.
> **No** → `_component` (a block: presentational, or a data record organised in asset folders).
> **Organising many of them?** → asset **folders**, never the Pages tree.

📷 **[Screenshot: the Visual Builder canvas for an experience, with presentational components dropped
into sections (the author-composed layout that pushes you toward `_experience`).]**

## Closing thoughts

The payoff of getting this right early is a content model that reads cleanly, mirrors the site's URLs
where it should, and keeps high-volume and config content as blocks, out of the routing tree, where
it would only cause trouble. It becomes the quiet foundation that the listing pages, SEO, and search
all build on top of.

The mistake I see teams make is treating base types as a formality and reaching for `_page` by reflex
because that's the classic-CMS habit. On SaaS, the interesting move is realising how much a
`_component` can do. Model deliberately, lean on contracts, and question whether a thing really needs a
URL before you give it one.

I'd love to hear how other teams draw these lines, especially where you've landed on components as
data types versus pages. What's your default, and what made you change it?

---

## Related reading

- From Content Areas to the Visual Builder canvas: rethinking page composition on Optimizely SaaS
- Modeling high-volume content as blocks, not pages
- Best-practice global site settings with no public URL

For the authoritative rules on base types, contracts, and indexing, see the official Optimizely SaaS
CMS documentation.
