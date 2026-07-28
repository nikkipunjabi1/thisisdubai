# Content Architecture — the author-first CMS structure

_How content is organized in the CMS so **content authors** can find, add and update things
intuitively, and so URLs, faceting, and global settings all follow from one deliberate tree.
Supersedes the ad-hoc flat layout we started with. Pairs with CONTENT-MODEL.md (types),
LISTING-PATTERN.md (listings), SEO.md._

> **We always follow Optimizely CMS best practices and keep content organized.** Pages live in a
> routing tree that mirrors the site URLs; shared blocks are grouped into named folders in the
> assets area ("Tag - Taxonomy", "Site Configurations"). Crucially, **folders live on the
> assets/blocks side, never in the Pages tree** — the Pages panel is a routing view that doesn't
> render folders, so a large page section stays flat and is navigated by search + tag facets (§10).
> Every structural change is made through that lens — a tidy, predictable tree a content author
> (not a developer) can navigate. See OPTIMIZELY-BEST-PRACTICES.md §2 for the modelling rules.

## 1. Goals (authoring-first)
- **Group by kind** — an author adding a place goes to *Places to Visit*; adding a tag goes to
  *Taxonomy*. No hunting through a flat root.
- **Separate concerns** — site **pages** (nav) vs **taxonomy** (data) vs **settings** (config) live
  in clearly-labelled containers.
- **Tree = URL** — each section is a page whose children are its items, so the content tree mirrors
  the site URLs (editor-managed, no hardcoded routes).
- **One obvious home** for global settings.

## 2. The tree (multisite-ready)
Every site lives under its own **site-root node**, so the CMS is multisite-ready from day one —
adding *This is Abu Dhabi* later is just another sibling subtree, no rework (see §8).
```
PAGES tree
Root
└─ This is Dubai            HomePage Experience  ← Home = Site Root = Start Page  → /
   ├─ Places to Visit       PlacesToVisit  (Experience/VB canvas)  → /places-to-visit
   │   └─ Point of Interest…                                        → /places-to-visit/<slug>
   ├─ Events                Events         (Experience/VB canvas)  → /events
   │   └─ Event…                                                    → /events/<slug>
   ├─ Neighbourhoods        Neighbourhoods (Experience/VB canvas)  → /neighbourhoods
   │   └─ Area… (Downtown, Marina, Old Dubai)                       → /neighbourhoods/<slug>
   └─ Articles              Articles       (Experience/VB canvas)  → /articles
       └─ Article…          (flat — NOT folder-bucketed, §10)      → /articles/<slug>/

SHARED BLOCKS — "For This Application" (app assets folder, /SysSiteAssets/), NOT in the page tree.
Grouped into named folders (best practice — never flat):
   ├─ Site Configurations   [folder]
   │   └─ Site Settings      SiteConfiguration (_component singleton)  brand / SEO / crawl
   └─ Tag - Taxonomy        [folder]
       └─ Tag… (Landmarks, Beaches, Festivals, Luxury…)  TagTerm (_component)  facets + AI search
```
Global config + taxonomy are **shared blocks** (`_component`) in the application's shared-assets
folder, so editors manage them from the Shared Blocks panel — no page tree, no non-routable pages,
no per-type access grants. Each kind sits in its **own named folder** (`Site Configurations`,
`Tag - Taxonomy`) rather than flat under "For This Application", so authors always know where a new
tag or a settings edit lives. References to tags still filter by `key` (facets) regardless of which
folder holds them, and the settings singleton is fetched scoped to the Start Page subtree via
`_metadata.path`.
- **Home IS the site root** (one node, e.g. "This is Dubai"): it's the Start Page the Application
  binds its host(s) to (`localhost:3000` dev, the Vercel domain in prod) AND it parents the section
  pages. URLs resolve relative to it → Home = `/`, children = `/<segment>`. No separate SiteRoot node,
  and no Application rebind when restructuring (Home never moves).
- **An Experience CAN parent pages** once it declares **`mayContainTypes`** — verified. (The earlier
  "not allowed under parent" error was simply a missing `mayContainTypes`, not an Experience limitation.)
  So `HomePage.mayContainTypes` lists the four section experiences (PlacesToVisit, Events,
  Neighbourhoods, Articles).
- **Section pages** are Visual Builder **experiences** (`PlacesToVisit`, `Events`, `Neighbourhoods`,
  `Articles`) that share the listing pattern: a `SectionListing` block on the canvas + top/bottom
  composition zones, `mayContainTypes` their item type. See LISTING-PATTERN.md.
- **Taxonomy & Settings live *per site*** (as shared blocks under each site's application) so each
  site owns its own tags, brand and SEO — clean multisite isolation.
- **Shared-block folders** (`Site Configurations`, `Tag - Taxonomy`) are `SysContentFolder`s created
  once in the Shared Blocks UI; the seed only parents blocks into them (see `scripts/seed.mjs`
  `TAG_TAXONOMY`). **Articles are flat** under the Articles experience — no `_folder` buckets in the
  Pages tree, which the SaaS CMS won't render (§10).

## 3. Taxonomy — `Tag` (shared block `TagTerm`, in the "Tag - Taxonomy" folder)
- Type **`TagTerm`** (base **`_component`**), grouped under the **"Tag - Taxonomy"** folder in the
  application's shared-assets area ("For This Application"). Fields: `name`, `slug`, `dimension`
  (theme / cuisine / audience / amenity / interest / season / accessibility), `description`,
  `synonyms`, `parent` (self, for hierarchy), `featured`, `icon`.
- **Why a shared block, not a page:** taxonomy has no page of its own, so authors shouldn't hunt the
  page tree or need per-type access grants to add a term. As a shared block it's created/edited from
  the **Shared Blocks panel**, and it filters + resolves fine — a POI/Event/Article `tags` reference
  facets by `key` (`tags: { key: { eq } }`). This disproves the earlier belief that a filterable
  taxonomy had to be `_page`. (`compositionBehaviors: ['elementEnabled']` is what exposes the block as
  a Graph root type for the facet list.)
- **Organized in a folder, not flat.** All 24 terms live under "Tag - Taxonomy" so the panel stays
  legible and there's one obvious home for "add a new tag". Moving a term between folders never changes
  its `key`, so facets/references are unaffected.
- Referenced by items via a **`tags`** field (`array` of `contentReference` → `TagTerm`). Powers the
  listing facets (grouped by `dimension`) and AI/semantic search (`synonyms`/`description`).

## 4. Global settings — `SiteConfiguration` singleton (in the "Site Configurations" folder)
- Type **`SiteConfiguration`** (base **`_component`**), a single shared block under the
  **"Site Configurations"** folder — authors edit brand/SEO in one place from the Shared Blocks panel.
- Fields: `siteName` ("This is Dubai"), `titleTagline`, `titleSeparator`, `allowSearchIndexing`
  (global crawl switch, default OFF). Drives the global title template
  (`<page> | <tagline> | <siteName>`) → rebrand in one publish. Fetched scoped to the Start Page
  subtree via `_metadata.path`, so multisite instances each read their own settings.

## 5. Authoring workflows (the test of the design)
- **Add a place:** Places to Visit → New → *Point of Interest*; set fields, pick `tags`, publish → live at
  `/places-to-visit/<slug>`, appears in the listing + facets automatically.
- **Add a tag:** Shared Blocks → *For This Application* → **Tag - Taxonomy** → New → *Tag (Taxonomy term)*;
  set `dimension`, publish. Immediately available as a facet — no page, no access grant.
- **Add an article:** Pages tree → **Articles** → **＋ Create** (or ⋯ → New) → *Article*; fill
  title/body/heroImage, pick `tags`, publish → live at `/articles/<slug>/`. Articles are flat (no year
  folders — §10); categorization is the `tags` reference, and the section is navigated by search + facets.
- **Edit global branding/SEO:** Shared Blocks → *For This Application* → **Site Configurations** →
  *Site Settings*. One publish rebrands every page title.
- **Add a new section (e.g. Hotels):** new section experience + card + config entry (LISTING-PATTERN §8);
  author creates the section and adds children.

## 6. Naming & conventions
- Section URLs: `/places-to-visit`, `/events`, `/neighbourhoods`, `/articles` (kebab-case, plural).
- Item `routeSegment` = slug of the name. Tags: kebab-case slug. Article year folders: the 4-digit year.
- Shared-block folders named for authors ("Tag - Taxonomy", "Site Configurations").

## 7. Migration

### Phase 1 — site-root restructure ✅ DONE
Home (renamed **"This is Dubai"**) is the site root: `HomePage.mayContainTypes` added, Places to Visit +
Areas + Events re-parented under it, **Site Settings singleton** created (siteName "This is Dubai"). Root
now has one content child. Home stays the Start Page at `/`, so **no Application rebind** was needed;
all URLs verified clean (`/`, `/places-to-visit`, `/places-to-visit/<slug>`). Global title now reads from
CMS Site Settings.

### Phase 2 — sections + taxonomy [next]
1. **Types** (`config push --force`): `_folder` type; `Tag` (`_page`); `EventsPage`, `NeighbourhoodsPage`
   (+ their components); a **`tags`** field (`contentReference`→`Tag`) on POI & Event; add
   EventsPage/NeighbourhoodsPage to `HomePage.mayContainTypes`.
2. **Seed:** **Taxonomy** + **Settings** folders (move Site Settings into Settings); **Events** +
   **Neighbourhoods** section pages under Home; the **Tag** terms (incl. *Festivals*).
3. **Re-parent + tag:** Areas → Neighbourhoods, Events → Events; tag Food/Shopping Festival → *Festivals*.
4. **Verify:** `/events`, `/neighbourhoods` + children resolve; facets (Tag/Area/price) resolve; taxonomy
   pages noindex.
5. **Docs:** fold taxonomy/CMA/multisite gotchas into OPTIMIZELY-BEST-PRACTICES.md + CONTENT-MODEL.md.

_Then_ resume the listing-pattern build (breadcrumbs, composition zones, pagination, sort, filters) on
this clean, multisite-ready structure. (Dormant `_component` `Category` + its 6 stuck items: delete later
via interactive `content delete`.)

## 8. Multisite (future — structured for it now)
Each destination is a self-contained subtree + its own Application:
```
Root
├─ This is Dubai      SiteRoot   → Application A: thisisdubai.com      → Home + sections + Taxonomy + Settings
├─ This is Abu Dhabi  SiteRoot   → Application B: visitabudhabi.com   → its own Home + sections + …
└─ This is Sharjah    SiteRoot   → …
```
- **Per-site isolation:** each site owns its Home, sections, Tags, and Site Settings — so brand, SEO,
  taxonomy and content never collide across sites. Add a site = add a SiteRoot subtree + an Application.
- **Frontend:** the Next.js app is host-aware — `getContentByPath` already resolves by path **and**
  `url.base` (host). Multisite adds a host→site map; the same components render every site.
- **Localization** (EN→AR later) is a language variation *within* a site, orthogonal to multisite.
- We build **only This is Dubai now**, but in this layout, so nothing needs re-parenting when more
  destinations arrive.

---

## 9. Writing content via the CMA

Everything below was pinned down empirically against the live API (the error messages are
quoted because they are the fastest way back to the answer). Reference implementation:
`scripts/data/_helpers.mjs` and `scripts/seed.mjs`.

### Property write-shapes

Every property value is wrapped in `{ value: … }`:

```jsonc
"name":       { "value": "Burj Khalifa" },                       // string
"latitude":   { "value": 25.197197 },                            // float
"accolades":  { "value": ["Tallest building in the world"] },    // array of string
"area":       { "value": "cms://content/<KEY>" },                // single reference
"tags":       { "value": ["cms://content/<KEY>", "…"] },         // list of references
"images":     { "value": ["cms://content/DamImageSource/<ID>"] },// list of DAM images
"body":       { "value": { "html": "<p>…</p><h2>…</h2>" } }      // richText — see below
```

### Rich text takes `{ html }`, not a string and not a node tree

This one is not guessable. A bare HTML string is rejected, and so is a pre-built Slate-style
node tree:

```
400 InvalidModel — "Could not read value as 'RichText'. Expected object with an 'html' property."
```

The correct shape is `{ value: { html: "<p>…</p>" } }`. The CMS **parses the markup server-side**
into its own node tree, and Graph then returns both representations:

```graphql
body { html }   # the HTML you wrote back
body { json }   # { type: "richText", children: [ { type: "paragraph", … } ] }
```

Render the `json` half with the SDK's `<RichText>` (wrapped by `@/components/ui/Prose`), never
the `html` half via `dangerouslySetInnerHTML`.

### A new version REPLACES the whole property bag

`POST /content/{key}/versions` is not a patch. Any property you omit is blanked on the new
version. This bites hard when two writers touch the same items — the seed owns the text fields,
`attach-assets.mjs` owns the image fields — so **both do read-merge-write**:

```js
const current  = await api('GET', `/content/${key}/versions`);
const existing = current.json?.items?.[0]?.properties ?? {};
await api('POST', `/content/${key}/versions`, {
  locale, displayName, routeSegment,          // routeSegment MUST be re-sent or the URL changes
  properties: { ...existing, ...mine },       // mine wins; everything else carries forward
});
```

Without this, re-running the seed silently wipes every attached image.

### Other gotchas

- `GET /content/{key}` returns **metadata only** — no properties. Properties live on the
  version: `GET /content/{key}/versions` → `items[0].properties`.
- `displayName` is required on every version write; `routeSegment` must be re-sent or the item's
  URL changes.
- **An unset content reference is not null.** Graph returns `{ "key": null, "url": { "default": null } }`
  — a truthy object. Always test `key` (or `url.default`) when checking whether a reference field
  is empty.
- The CMA rate-limits bursts with 429; back off and retry (both scripts self-throttle).
- A **trashed key can never be re-created**, which is why content keys are namespaced
  `md5("<type>:<slug>")` rather than `md5(slug)`.

---

## 10. Scaling a section — why we do NOT bucket with folders (SaaS CMS)

Optimizely's classic guidance is to keep **no more than ~100 immediate children** per
container, and the classic remedy is organisational **folders** (year/month for editorial).
On the SaaS CMS that remedy is a **trap for pages**, and we hit it:

> ⚠️ **A `_folder` is invisible in the SaaS CMS Pages tree.** The left **Pages** panel is a
> **routing** view — it renders only routable content (`_experience` / `_page`). A `_folder` is
> non-routable, so it never appears there, **and everything nested under it disappears with it**.
> We bucketed the 10 articles into a year `Folder`; the result was an *Articles* node with no
> expandable children and no way for an author to reach or create an article from the tree.
> Folders are an **assets-side** concept — they render fine in the **Shared Blocks / Media**
> panel (that is exactly why `Tag - Taxonomy` and `Site Configurations` work), but they do **not**
> belong in the page hierarchy.

**The rule:** never place a `_folder` in the routing (Pages) tree. If content is a page, it stays
a direct child of a routable parent.

### What we do instead — flat articles

```
Home (/)
└─ Articles            [Articles experience]   /articles
   ├─ Article                                  /articles/<slug>/
   ├─ Article                                  /articles/<slug>/
   └─ …
```

Articles are **direct children of the Articles experience** — visible in the Pages tree, created
in one step (*Articles → ⁺ Create → Article*). Categorization is the `tags` reference (topical);
structural bucketing is intentionally dropped. This is the SaaS-native shape: the Pages panel is
**search-first** (the tree has a search box), so a large flat section is navigated by search + tag
facets, not by drilling folders. `scripts/flatten-articles.mjs` performed the one-time migration
(re-parent → Articles, then delete the empty year folders); `seed.mjs` now seeds articles flat.

**If year archives are ever wanted** (for `/articles/2026/` URLs or an SEO archive page), add a
**routable year _page_** that lists that year — never a `_folder`. A real page shows in the tree,
serves a URL, and doubles as a landing page. That is the only correct way to reintroduce a
`/articles/<year>/` segment here.

### The querying consequence (still true, and why the listing engine is robust)

The listing engine matches children by **`_metadata.path`** (the ancestor chain), not by direct
`container`. That was originally needed for bucketed sections, and it keeps the engine correct
whether a section is flat or (via routable sub-pages) nested:

| Query | Flat | (if ever nested) |
|---|---|---|
| `_metadata: { container: { eq: sectionKey } }` | matches | misses nested |
| `_metadata: { path: { eq: sectionKey } }` | matches | matches |

`src/lib/sections.ts` matches on `path` throughout — one query serves either shape.

> ⚠️ **`path` includes SELF.** `_Page(where: { path: { eq: sectionKey } }, limit: 1)` returns
> the *section experience itself*, not a child — which made `detectChildType` detect nothing
> and silently emptied **every** listing on the site. It now fetches several items and takes
> the first whose `types` name a known child type. If you touch that query, re-check all four
> section listings, not just the one you changed.

### Cache gotcha

`unstable_cache` keys did not change when the query did, so the old (correct-looking) results
survived the edit and the listings stayed wrong after the fix. Clearing `.next/cache` requires
the dev server to be **stopped** — deleting it under a running server is not enough. This is
the second time this has bitten on this project; assume any listing-query change needs a
stop → clear → start cycle before you trust what you see.
