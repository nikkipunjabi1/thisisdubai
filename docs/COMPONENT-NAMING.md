# Component Naming Conventions

_An author-first playbook for naming CMS components: the rules, a category taxonomy, the
variant-vs-component test, naming AI components, and picker thumbnails. Generic enough to
reuse on any DXP build; anchored to how this project actually names its blocks. Pairs with
COMPONENT-STANDARDS.md (how a block is built) and OPTIMIZELY-BEST-PRACTICES.md §2–§3._

## Why it matters

A component name is read by three different people, and it has to work for all three:

1. The **content author** who drags it onto a page and guesses what it does from the name alone.
2. The **developer** who finds it in the codebase, styles it, and maintains its variants for years.
3. The **designer** who is adding a variation and needs to know if it already exists.

If a name only makes sense to one of them, the library drifts: authors misuse components,
developers create duplicates ("Card Block" + "Card Block New"), and design invents parallel
versions that never match the CMS. Good naming is boring on purpose: clear, predictable, hard
to misread.

## The seven rules

1. **Name by purpose, not appearance.** "Blue Banner" is wrong the day the brand turns purple.
   "Promo Banner" survives the redesign.
2. **Author-first language.** The picker is used by marketers, not developers. "Two Column Text"
   beats "SplitContentBlockV2". Keep the technical suffix (`Block`, `Component`) in the codebase
   `key`, not the author-facing `displayName`.
3. **Consistent suffix or none, but pick one.** Do not mix "Hero Block", "Testimonial Component",
   and "FAQ Module". We drop suffixes from `displayName` entirely.
4. **Variants live inside the component, not as new components.** "Image Left" and "Image Right"
   are one component with a `layout` dropdown. This rule alone halves a library.
5. **Group logically.** Use a category prefix only when the CMS has no folders/groups. When it
   does (property groups, shared-block folders), use those instead.
6. **Test the name in the list, not on its own.** A name is read in an alphabetical dropdown next
   to forty others. "Highlight Card" reads fine alone and collides the moment it sits under "Card"
   and "Card Grid". Write the candidate into the full list and read it aloud before committing.
7. **A name without a thumbnail is half a label.** Authors scan the picker, they do not read it.
   See "Thumbnails" below.

## Category taxonomy

A rough shelf order for a page-building library. Not every project needs every shelf.

| Category | Examples |
|---|---|
| **Global** (site-wide fixtures, not on the page picker) | Top Navigation, Footer, Cookie Consent Banner, Announcement Bar |
| **Hero / Banner** | Hero (one component, layout + media variants), Campaign Hero (only if it has genuinely new fields) |
| **Content blocks** | Rich Text, Two Column Text, Text and Image, Text and Video, Quote, Callout |
| **Cards / Grids** | Card Grid (container), Card (child), Product/Article/Event Card (data-named) |
| **Media** | Image, Video, Image Gallery, Logo Strip |
| **Call to action** | CTA Banner, CTA Card |
| **Interactive** | Accordion, Tabs, Timeline, Stats, Testimonial, Testimonial Carousel |
| **Forms** | Contact Form, Newsletter Signup, Event Registration Form, Gated Content Form |
| **Listing / dynamic** | Article Listing, Event Listing, Related Content (filters live *inside* the component) |

**Global components stay out of the page picker.** Top Navigation, Footer, Cookie Banner, and any
alert bar appear on every page by default; they are site fixtures, not authorable sections. In this
project they live in the **Site Settings** block and their data models
(`NavLink`/`NavMenuItem`/`NavGroup`) carry **no composition behaviour**, so they never leak into the
"Add Section" picker. See `src/components/content/Navigation.tsx`.

## Variant vs. new component

The question every project hits: "can we just add a small variation?"

- Variant changes **layout only** (position, columns, alignment) → a dropdown on the existing
  component. In this repo, layout/theme/spacing come from the shared display template
  (`LayoutDisplayTemplate`); component-specific layout uses a `selectOne` property (see
  `TextAndImage.layout`, `Callout.tone`).
- Variant changes **content structure** (new fields, new data source, new author workflow) →
  probably a new component. `Text and Image` and `Text and Video` are two components because the
  media field differs; left/right stays a variant of each.
- Variant is a **temporary campaign** → build it as a variant behind a flag, or remove it after.
  Do not leave campaign components lying around for years.

## Naming AI components

Two rules that will not age badly:

- **Name for what the reader receives, not the technology that produced it.** "Recommended for You",
  not "AI Recommendations". Technology prefixes ("Web 2.0 Widget", "HTML5 Video Block") always end up
  embarrassing once the distinction stops mattering.
- **Keep the word "AI" only where disclosure is the point.** "AI Answer" and "AI Disclosure Notice"
  earn the prefix because the reader is entitled (sometimes legally required) to know the text was
  generated. A search box does not become "AI Search".

A generated "answer" component that has streamed body, citations, follow-up prompts, a disclosure
line, and a generating state is a genuinely new component, and its parts (Source Citations,
Follow-up Prompts) are **child** components, not standalone picker entries. Document what the author
can and cannot edit, plus the empty/error/timeout states, which generated components hit far more
often than a rich-text block.

## Thumbnails: the part everyone skips

Authors scan the picker for a shape, not a word. A preview image does more than any wording. Every
serious CMS supports one and almost nobody fills it in, because it falls in the gap between design
and development.

- **Use a plain wireframe, not the polished design.** It survives rebrands, reads at 120px, and
  communicates "where does my content go", which is the real question.
- **One aspect ratio for the whole set** (16:9 works). Export at 2x. SVG where the platform renders
  it, PNG where it does not.
- **File name matches the component**, in the platform's convention (`card-grid.svg`); several
  platforms auto-bind on filename.
- **Make it definition-of-done:** the deliverable is design + states + thumbnail; the component
  register has a thumbnail column; ticket acceptance includes the preview rendering in the picker,
  not just the component rendering on the page.

> Optimizely note: the preview/thumbnail mechanism differs between the older .NET/on-prem product
> and the newer SaaS/composable one. Confirm the current SDK/CLI support before building a thumbnail
> pipeline; treat wireframes in the field `description` as the fallback where no picker image exists.

## Worked examples from this build

- **"Curated Content"** takes a content type and three fill modes (Latest, By tag, Hand-picked). The
  name is ~70% right and, more importantly, the *shape* is right: one component with a content-type
  dropdown replaces the eight listing components many teams build. We keep the name (content is built
  on it; renaming is a breaking migration for no real gain).
- **"Highlight Card"** is image + eyebrow + title + body + one CTA, rendered as a wide feature panel.
  The pattern has an industry name (AEM calls it a **Teaser**, agencies a **Promo**). We keep
  "Highlight Card": it is already shipped with content, the name reads clearly in our picker, and it
  sits beside Curated Content rather than the Card/Card Grid family. The lesson for *new* builds:
  avoid putting "Card" in a name when "Card" already means the item inside a Card Grid.

**The general test:** before committing a name, write it into the full alphabetical picker list and
read it aloud. Collisions are invisible in a design file and obvious in a dropdown.

## Governance

- Designer proposes the name (and the thumbnail) at design time; developer validates it against the
  codebase and CMS constraints; the content lead signs off, because they are the daily user.
- Keep a component register (name, category, thumbnail, real screenshot, one-line "when to use").
  If it is not in the register, it does not exist yet.

## Checklist

1. Describes purpose, not appearance?
2. An author understands it without training?
3. Consistent with the pattern, and no collision when read in the alphabetical list?
4. Variants handled inside the component, not as separate entries?
5. Has a thumbnail, same ratio/style as the rest, rendering correctly in the picker?
6. In the component register with a screenshot and description?
7. Content lead signed off?

Yes to all seven → ship it.
