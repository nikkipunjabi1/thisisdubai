---
title: "From Content Areas to the Visual Builder Canvas: Rethinking Page Composition in Optimizely SaaS CMS"
status: draft
audience: Optimizely community / dev.to / LinkedIn (long-form)
author: Nikki Punjabi
tags: [optimizely, saas-cms, visual-builder, content-area, composition, migration, cms-12]
---

> **Draft for review.** Screenshot placeholders are marked 📷 — swap in real captures from your own
> Optimizely SaaS instance before publishing.

## The moment it stops feeling familiar

If you have spent any time building on Optimizely CMS 11 or 12, you know the **ContentArea** the way
you know your own front door. A page type declares one, editors drag blocks into it, and your Razor
views render them top to bottom. It is the workhorse of almost every Optimizely site ever shipped.

So the first time you open **Optimizely SaaS CMS** with **Visual Builder**, it feels familiar — for
about five minutes. You go looking for the ContentArea on your page, and it simply isn't there. The
building blocks have new names, they are assembled in a different way, and there is a panel called the
**Outline** that has no real equivalent in the classic editor.

I want to be honest about why this post exists: I spent longer than I would like to admit hunting for
"the ContentArea" on an Experience before I accepted it wasn't coming back. Nothing here is *hard*
once the model clicks — but the mental shift is real, and it trips up experienced Optimizely
developers precisely because they already have strong instincts from the classic stack. This is the
side-by-side I wish someone had put in front of me on day one.

> _One honest caveat up front: Visual Builder also shipped for PaaS CMS 12, so "CMS 12 vs SaaS" is not
> a perfectly clean line. What I'm really contrasting is the **classic ContentArea + blocks** model
> that most CMS 11/12 sites are built on, with the **Visual Builder composition** model that is
> front-and-centre in SaaS._

## The old model, in one paragraph

In classic Optimizely, a page type declares a **`ContentArea`** property. In the editor, that property
is a **drop zone**: authors drag **blocks** — reusable content items with no URL of their own — into
it, one after another. Layout mostly lives in **MVC / Razor templates** and block views; the
ContentArea itself just decides *which* blocks appear and *in what order*. An `AllowedTypes` attribute
governs which block types are permitted in a given area. The unit of composition, the thing everyone
thinks in, is **"a block in a content area."**

That model is linear and it is flat. A content area is an ordered list. It served us well for a decade.

## The new model: an Experience is a canvas, not a property bag

In Visual Builder, a composed page is an **Experience** — a routable **canvas**. There is no
ContentArea property to bind to. Instead, the page owns a **composition**: a **tree of nodes** the
author arranges visually. The hierarchy looks like this:

```
Experience
└─ Section          (a full-width horizontal band)
   └─ Row
      └─ Column
         └─ Element  (a component: Hero, Heading, Rich Text, a listing…)
```

You don't "add a block to a content area." You **drop a component onto a grid** — pick a section
layout, then place elements into its rows and columns. The unit of composition becomes **"an element
on a canvas."** That single change is the whole shift, and almost every other difference falls out of
it.

📷 **[Screenshot: a composed Experience on the Visual Builder canvas — Sections stacked vertically,
each holding rows and columns of components.]**

## The Outline: the thing the classic editor never had

Because a composition is a **node tree**, Visual Builder gives you the **Outline** panel — a
structural, collapsible view of that tree (Section → Row → Column → Element). It is not decoration. On
a dense page it is the fastest way to:

- **Select** an element you can't easily click on the canvas — a thin spacer, an empty column.
- **Reorder or re-nest** nodes by dragging in the tree instead of wrestling the canvas.
- **See the structure** at a glance — how many sections, what is nested where.

Think of the Outline as the DOM-inspector view of your page's layout. The closest thing the classic
editor offered was the linear list of blocks inside a ContentArea — but that was a *flat list*, not a
tree, because content areas don't nest sections, rows, and columns. Once you start reaching for the
Outline early, dense pages stop being frustrating.

📷 **[Screenshot: the Outline panel open beside the canvas, showing the Section → Row → Column →
Element hierarchy for the current page.]**

## Why your block "isn't showing up": components opt in

Here is the gotcha that cost me the most time. In classic CMS, an `AllowedTypes` attribute on the
content area decides which blocks are permitted. In Visual Builder, the relationship is inverted: **the
component declares where it is allowed to live.** A presentational block won't appear in the component
picker at all until its content type opts in — conceptually, one small declaration on the type:

```ts
// Roughly: "this component may be dropped as a section AND as an element on the canvas."
compositionBehaviors: ['sectionEnabled', 'elementEnabled']
```

Forget that line and you will swear the block is broken, because it never shows up in the picker.
There is no `AllowedTypes` on a content area anymore — the permission moved onto the component itself.

📷 **[Screenshot: the component picker in Visual Builder, showing which components are available to
drop — and, by implication, which types have opted in.]**

## Layout moved out of content fields and into display templates

In classic Optimizely, it was common to add fields — or pick a specific block view — to control
things like width or theme. That habit does not translate cleanly. In Visual Builder, layout and
styling belong to **display templates**: a template bound to a base type supplies controls such as
Theme (light/dark) and Width, and the author's choices arrive on the node as **display settings**. The
component itself stops hand-rolling layout and just renders content; the template and the settings
decide how it sits on the page.

This is genuinely better once it clicks — presentation is separated from content — but it is a real
change of habit for anyone used to "just add a field for it."

📷 **[Screenshot: a component's display-template controls in the editor — Theme and Width options an
author can pick.]**

## What it looks like on the delivery side (kept deliberately high-level)

You do not have to take the composition on faith. It is delivered as structured data — a set of
composition nodes — and Optimizely's SDK renders that tree for you. In practice the entire page render
comes down to handing the composition's nodes to one component:

```tsx
// The whole Experience = render its composition node tree.
<OptimizelyComposition nodes={composition.nodes} />
```

The important idea, not the syntax: **the Outline you see in the editor and the tree your front end
renders are the same node structure.** One data shape, two audiences — authors in the editor,
components on delivery. That symmetry is what makes Visual Builder feel clean once you stop looking for
the old ContentArea.

## The mental-model shifts worth writing on a sticky note

If I could hand my past self five sentences, it would be these:

- **Stop looking for the ContentArea.** An Experience has no ContentArea property. Its layout *is* the
  composition. If a page's layout is author-composed, you want an Experience, and you compose it on the
  canvas.
- **"Block" became "component/element," and it's opt-in.** A component won't appear in the picker
  until it declares its composition behaviours. This is the single most common "why isn't it working"
  moment.
- **Layout lives in display templates, not content fields.** Theme and width are author choices
  supplied by a template, not properties you bolt onto the content type.
- **The tree nests; the old list didn't.** Section → Row → Column → Element is real nesting with grid
  semantics. If you keep thinking "flat ordered list of blocks," you will under-use sections and end
  up fighting the layout.
- **Not everything belongs on the canvas.** Structured relationships — tags, related items, config —
  are still data references, not elements dropped on a grid. The canvas is for *composed layout*;
  references are for *data links*. Conflating the two is the classic-CMS habit that travels worst,
  because a ContentArea was often quietly used for both.

## A side-by-side cheat-sheet

| Classic CMS 11/12 | Optimizely SaaS · Visual Builder |
|---|---|
| Page type with a **ContentArea** property | **Experience** with a **composition** (a canvas) |
| Drag **blocks** into a content area | Drop **components (elements)** onto a **grid** |
| Flat, ordered list of blocks | **Node tree**: Section → Row → Column → Element |
| _(no equivalent)_ | **Outline** panel — the node tree, for select / reorder / nest |
| `AllowedTypes` on the content area | Component declares its own **composition behaviours** |
| Layout in Razor / block views | **Display templates** + display settings on the node |
| Blocks rendered by controllers / partials | The SDK renders the composition's nodes |

## Closing thoughts

The migration cost here is not technical difficulty — it is *unlearning*. Once you stop hunting for
the ContentArea and start thinking **"compose a canvas of components, and use the Outline to manage its
tree,"** Visual Builder is genuinely faster to author in, and the delivery side is clean, headless, and
code-first. The teams that struggle are the ones trying to force the old flat, block-in-content-area
mental model onto a tool that fundamentally works as a nested canvas.

If you are planning a move from classic Optimizely to SaaS, budget time for this conceptual shift in
your onboarding — not for the tooling, but for the mindset. It is the cheapest lesson to teach up
front and the most expensive one to let people discover mid-project.

I'd love to hear how other teams have handled this transition — especially how you brought classic-CMS
developers up to speed on the composition model. What clicked, and what didn't?

---

_Have a correction or a better way to frame any of this? Reach out — I keep these posts updated as the
platform evolves._
