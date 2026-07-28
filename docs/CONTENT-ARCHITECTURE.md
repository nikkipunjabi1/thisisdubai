# Content Architecture — the author-first CMS structure

_How content is organized in the CMS so **content authors** can find, add and update things
intuitively, and so URLs, faceting, and global settings all follow from one deliberate tree.
Supersedes the ad-hoc flat layout we started with. Pairs with CONTENT-MODEL.md (types),
LISTING-PATTERN.md (listings), SEO.md._

> **We always follow Optimizely CMS best practices and keep content organized.** Nothing is
> ever dumped flat: pages live in a tree that mirrors the site URLs, shared blocks are grouped
> into named folders ("Tag - Taxonomy", "Site Configurations"), and any section that would pass
> ~100 children is bucketed into folders (§10). Every structural change here is made through that
> lens — a tidy, predictable tree that a content author (not a developer) can navigate. See
> OPTIMIZELY-BEST-PRACTICES.md §2 for the modelling rules this rests on.

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
       └─ 2026 / 2027 …     Folder (year bucket, §10)              → /articles/<year>/
           └─ Article…                                              → /articles/<year>/<slug>/

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
  `TAG_TAXONOMY`). **Article year buckets** use the custom `Folder` type (routable segment — §10).

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
- **Add an article:** Pages tree → **Articles** → the **year folder** matching its publish date (create
  the folder if the year is new) → New → *Article*; fill title/body/heroImage, pick `tags`, publish →
  live at `/articles/<year>/<slug>/`. Categorization is the `tags` reference (topical) + the year folder
  (structural) — see §10 for why year, not category, is the bucket.
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

## 10. Scaling a section past ~100 items — folder bucketing

Optimizely's long-standing guidance is to keep **no more than ~100 immediate children**
under a single container. Past that the *editor* tree is what degrades first — expanding a
node with thousands of children is slow in edit mode — rather than delivery, which is
paginated and indifferent. The standard remedy is organisational folders: **year/month for
editorial, category for products**.

Articles are planned to reach 1000+, so they are bucketed. Places to Visit (101) sits at the
line and is left flat for now; it can adopt the same mechanism (bucketed by Area) without any
code change, because the listing engine is already folder-transparent.

### The structure

```
Home (/)
└─ Articles            [Articles experience]   /articles
   ├─ Folder "2026"                            → contributes /2026/
   │   ├─ Article                              /articles/2026/<slug>/
   │   └─ …
   └─ Folder "2027"
```

Buckets are **year-of-publishDate**. A publish year never changes, so an article's URL is
stable — unlike a category bucket, which would move the URL whenever the article is
recategorised. Taxonomy is handled by `Tag` instead, which is free to change.

### Verified behaviour (do not assume any of this)

- **A folder DOES contribute a URL segment.** It is *not* URL-transparent. A folder is
  created with an auto-derived `routeSegment` (from its display name), and descendants
  inherit it: an Article under folder "2026" resolves to `/articles/2026/<slug>/`. This is
  the standard editorial URL shape, so it is a feature here — but it must be a deliberate
  choice, not a surprise.
- **The folder itself is not a page.** `[...slug]` lists folder types in
  `NON_ROUTABLE_TYPES`, so `/articles/2026` returns 404. Confirmed.
- **`_folder` is non-localized.** Sending `locale` on a version write is rejected: *"A locale
  should not be provided when creating content of a non-localized content type."*
- **Folders are created already published and cannot be published again** — a publish attempt
  returns *"Unable to transition the status…"*. So the seed creates them and skips publish.
- **`mayContainTypes` is enforced in both directions.** The parent must allow the folder
  (`Articles.mayContainTypes` includes `Folder`) *and* the folder must allow the child
  (`Folder.mayContainTypes` includes `Article` and `_self`). Missing either yields
  *"Content type 'X' is not allowed to be created under parent of content type 'Y'"*.

### The querying consequence

Bucketing breaks any query that matches on the **direct parent**. Measured on the live data
immediately after the 10 articles moved into their year folder:

| Query | Result |
|---|---|
| `_metadata: { container: { eq: articlesKey } }` | **0** |
| `_metadata: { path: { eq: articlesKey } }` | **10** |

`_metadata.path` is the ancestor chain, so `src/lib/sections.ts` matches on `path`
throughout. One query then serves flat *and* bucketed sections.

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
