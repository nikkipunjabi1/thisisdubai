---
title: "From Content Areas to the Visual Builder canvas: what actually changes moving to Optimizely SaaS CMS"
status: draft
audience: Optimizely community / dev.to / LinkedIn (long-form)
author: Nikki Punjabi
tags: [optimizely, saas-cms, cms-12, visual-builder, content-area, composition, migration]
---

> **Draft for your review.** Edit the voice/details freely before publishing.

> ⚠️ _Independent, unofficial learning project — not affiliated with any tourism authority or brand.
> Original wordmark and royalty-free assets only._

## Why this post

If your mental model of Optimizely is **CMS 11/12** — a page type with a **ContentArea** property,
editors dragging **blocks** into it, Razor views rendering the result — then Optimizely **SaaS CMS**
with **Visual Builder** feels familiar for about five minutes and then quietly *isn't*. The building
blocks have different names, they're assembled a different way, and there's a panel called the
**Outline** that has no real equivalent in the classic editor.

Nothing here is hard once it clicks. But I spent longer than I'd like to admit looking for "the
ContentArea" on an Experience and not finding one. This is the side-by-side I wish I'd read first.

_(Fair caveat: Visual Builder also shipped for PaaS CMS 12, so "CMS 12 vs SaaS" isn't a clean line.
I'm contrasting the **classic ContentArea + blocks** model most CMS 11/12 sites are built on with the
**Visual Builder composition** model that's front-and-centre in SaaS.)_

## The old model in one paragraph (CMS 11/12, classic)

A page type declares a **`ContentArea`** property. In the editor, that property is a **drop zone**;
authors drag **blocks** (reusable `IContent` items with no URL of their own) into it, top to bottom.
Layout mostly lives in **MVC/Razor templates** and block views; the ContentArea just decides *which
blocks, in what order*. On-page editing highlights those drop zones. The unit of composition is **"a
block in a content area."**

## The new model: an Experience is a *canvas*, not a property bag

In SaaS Visual Builder, a composed page is an **`_experience`** — a routable **Visual Builder canvas**.
There is no `ContentArea` property to bind to. Instead the page owns a **composition**: a **tree of
nodes** the author arranges visually. The hierarchy is:

```
Experience
└─ Section            (a full-width horizontal band)
   └─ Row
      └─ Column
         └─ Element   (a component — Hero, Section Heading, Rich Text…)
```

You don't "add a block to a content area." You **drop a component onto the grid** — pick a section
layout, then drop elements into rows/columns. The unit of composition is **"an element on a canvas."**
That's the whole shift, and every other difference falls out of it.

## The Outline: the thing CMS 12 never had

Because a composition is a **node tree**, Visual Builder gives you the **Outline** panel — a
structural, collapsible view of that tree (Section → Row → Column → Element). It's not decoration; on
a dense page it's the fastest way to:

- **select** an element you can't easily click on the canvas (a tiny spacer, an empty column),
- **reorder / re-nest** nodes by dragging in the tree rather than the canvas,
- **see the structure** at a glance — how many sections, what's nested where.

Think of the Outline as the DOM-inspector view of your page's layout. In the classic editor the
closest thing was the linear list of blocks in a ContentArea — but that's a flat list, not a tree,
because ContentAreas don't nest sections/rows/columns.

## What this looks like in code (the part that made it concrete for me)

The composition isn't a mystery format — it's delivered as `composition.nodes`, and the SDK renders
the tree for you. From this project's experience renderer:

```tsx
// The whole experience = render its composition node tree.
<OptimizelyComposition nodes={content.composition.nodes ?? []} ComponentWrapper={ComponentWrapper} />
```

```tsx
// A section = a grid of nodes (the rows/columns/elements beneath it).
<OptimizelyGridSection nodes={content.nodes} />
```

So the **Outline you see in the editor is literally `composition.nodes`** rendered as a tree. Same
data, two audiences. And a component only becomes **droppable** on the canvas when its content type
opts in via `compositionBehaviors`:

```ts
// A block that authors can drop as a section AND as an element on the canvas.
compositionBehaviors: ['sectionEnabled', 'elementEnabled']
```

That one line is the SaaS replacement for "this block is allowed in this ContentArea." There's no
`AllowedTypes` on a content area anymore; **the component declares where it can live.**

## The mental-model shifts that bit me

> 🧩 **Stop looking for the ContentArea.** An Experience has no ContentArea property. Its layout *is*
> the composition. If you're modelling a page whose layout authors compose, you want `_experience`,
> and you compose it on the canvas — not by adding a `ContentArea` field to a `_page`.

> 🧩 **"Block" → "component/element", and it's opt-in.** A presentational block is a `_component`, but
> it won't appear in the component picker until it declares `compositionBehaviors`
> (`sectionEnabled`/`elementEnabled`). Forget that and you'll swear the block "isn't showing up."

> 🧩 **Layout/style moved out of content fields into display templates.** In classic CMS you often
> added fields (or picked a block view) to control width/theme. In VB, a **display template** bound to
> the base type supplies Theme (light/dark) + Width controls, and the author's picks arrive as
> `displaySettings` on the node — so components don't hand-roll layout. (I route all of it through one
> `<SectionShell>` primitive.)

> 🧩 **Not everything should go on the canvas.** Structured relationships (a POI's tags, an article's
> related places) are still **references** (`contentReference` / arrays), *not* elements on a canvas.
> The canvas is for *composed layout*; references are for *data links*. Conflating the two is the
> classic-CMS habit that doesn't translate — a ContentArea was often (ab)used for both.

> 🧩 **The tree nests; the old list didn't.** Sections → rows → columns → elements is real nesting
> with grid semantics. If you think in "a flat ordered list of blocks," you'll under-use sections and
> end up fighting the layout. Reach for the Outline early.

## A quick cheat-sheet

| Classic CMS 11/12 | SaaS Visual Builder |
|---|---|
| Page type with a **ContentArea** property | **`_experience`** with a **composition** (canvas) |
| Drag **blocks** into a content area | Drop **components (elements)** onto a **grid** |
| Flat, ordered list of blocks | **Node tree**: Section → Row → Column → Element |
| _(no equivalent)_ | **Outline** panel = the node tree, for select/reorder/nest |
| `AllowedTypes` on the ContentArea | Component declares **`compositionBehaviors`** |
| Layout in Razor views / block views | **Display templates** + `displaySettings` on nodes |
| Blocks rendered by controllers/partials | `OptimizelyComposition` renders `composition.nodes` |

## Result

Once you stop hunting for the ContentArea and start thinking **"compose a canvas of components, and
use the Outline to manage its tree,"** SaaS Visual Builder is genuinely faster to author in — and the
delivery side (`composition.nodes` → `OptimizelyComposition`) is clean, headless, and code-first. The
migration cost isn't technical difficulty; it's unlearning "a block in a content area."

## Links
- Repo: _this-is-dubai_ — see `docs/CONTENT-MODEL.md`, `docs/CONTENT-ARCHITECTURE.md`.
- Related: **#3** Content modeling: pages vs experiences vs components (the SaaS base types in depth),
  **#14** the listing engine built as a droppable `SectionListing` component, **#2b** wiring live
  Visual Builder preview to a Next.js app.
