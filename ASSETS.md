# Assets & Attributions

_Every image on This is Dubai is **royalty-free** and credited here. This file is both the
**sourcing sheet** (what to download and where it goes) and the **attribution log** (filled in
once an image is chosen). Referenced by README.md and docs/BRAINSTORM.md §"Asset & legal hygiene"._

> ⚠️ **Legal hygiene (non-negotiable for this repo).** Royalty-free only — Unsplash or Pexels.
> No official tourism-authority photography, no trademarked logos or branding, and no images
> whose subject is primarily a brand mark. Photographs *of real places* are fine and are used
> descriptively. Prefer images without prominent identifiable faces (no model release here).
> Binary files are **not** committed to this repo — they live in CMP/the CMS DAM.

> 📋 **The per-item sourcing list now lives in [docs/ASSET-MANIFEST.md](docs/ASSET-MANIFEST.md)**,
> which is **generated from `scripts/data/`** (`npm run asset-manifest`) so it can never drift
> from the content. It currently lists **144 CMP folders**. The hand-written tables further down
> this file cover only the original 16 items and are kept for their art-direction notes.
> This file remains the authority on **legal hygiene and attribution**.

## What is and isn't automatable

Two different operations, with different answers — this distinction is the whole story:

| Operation | Automatable? | Why |
|-----------|:---:|-----|
| **Upload** a binary into CMP/the DAM | ❌ **No** | The CMA's media endpoint (`/content/{key}/versions/{version}/media`) is **GET only** (`put?: never; post?: never` in its OpenAPI contract), and creating an image item needs an `initialVersion.media.key` that must already exist. |
| **Attach** an existing DAM asset to a content item | ✅ **Yes** | It's just a property write, which the CMA does fine. |

Attaching is a plain string URI, verified against live content:

```jsonc
// PointOfInterest / Event — a list
"images":    { "value": ["cms://content/DamImageSource/<CMP_ASSET_KEY>"] }
// Area — a single reference
"heroImage": { "value": "cms://content/DamImageSource/<CMP_ASSET_KEY>" }
```

So the sustainable division of labour is: **a human uploads to CMP, a script attaches.**

## ✅ Approach for bulk content: auto-attach from CMP (confirmed viable)

Agreed approach for the planned scale-up (**~100 POIs, ~20 Events, neighbourhoods, ~100+ Articles**).
Attaching 240+ images by hand in the CMS UI is not sensible; this replaces that with a matching script.

**Pipeline**

1. **Upload to CMP** in a sensible folder structure (per type, e.g. `POIs/`, `Events/`,
   `Neighbourhoods/`), with **filenames that carry the slug** — `burj-khalifa-2.jpg`. The filename is
   the join key, so this naming is the one thing the automation depends on.
2. **Enumerate CMP assets** via the CMP API → `{ id, filename, folder }`.
3. **Match** asset → content item, best-match wins:
   1. exact slug match on the filename stem (ignoring a `-1`/`-2` numeric suffix),
   2. else normalised-token overlap against the item's name,
   3. else fall back to any asset in the type's folder.
   _If several assets match, take any — a playground project tolerates an imperfect pick._
4. **Write** `cms://content/DamImageSource/{assetId}` into the right field for that type
   (`images` list vs `heroImage` single — see the table above), then publish the version.
5. **Report** a table of item → chosen asset → confidence, plus anything unmatched, so a wrong
   pick is easy to spot and re-run.

**Requirements before this can run**
- CMP API base URL + credentials (the CMS CLI client id/secret is **not** valid for CMP, and is
  separately **not** valid for Graph — verified 401 — so assume CMP needs its own credentials).
- Confirmation that the CMP asset `id` is the same key used in `cms://content/DamImageSource/<key>`.
  Strong evidence it is: Graph returns `06d864888a4311f19febba8dad112d3d` for Burj Khalifa's image
  and serves it from `images2.cmp.optimizely.com/assets/burj-khalifa-2.jpg/…`.

**Guardrails to build in** — an idempotent re-run (skip items that already have an image unless
`--force`), a `--dry-run` that prints the match table without writing, `--type` to scope a run, and
429 retry-with-backoff (the CMA rate-limits; `scripts/seed.mjs` already has this).

**Intended home:** `scripts/attach-assets.mjs`, reusing `seed.mjs`'s OAuth + `api()` helpers.

## Doing it by hand (small batches)

## Workflow

1. **Download** a suitable image from the search links below (pick the shot you like — the art
   direction column says what the composition needs to do).
2. **Upload to CMP**, then link/publish it into the CMS media library.
3. **Attach it to the CMS item** listed in the table, in the field named in the **Field** column.
   ⚠️ The field differs by type:
   - `PointOfInterest` → **Images** (a list — the first image is used as the card/hero)
   - `Event` → **Images** (a list)
   - `Area` → **Hero image** (a single reference)
4. **Record the credit** in the Attribution log at the bottom.

**Naming:** save each file as `<slug>.jpg` (matching the URL slug in the table) so the asset is
traceable back to its item — e.g. `burj-khalifa.jpg`.

**Specs:** landscape, **≥ 2000px wide**, JPEG, under ~1 MB where possible. Cards crop to **4:3**,
so keep the subject centred and avoid anything critical at the edges. (Graph times out on items
over 1 MB — see docs/OPTIMIZELY-RESEARCH.md §B.)

---

## Places to Visit (10) — field: **Images**

| # | CMS item | Page | Art direction | Search |
|---|----------|------|---------------|--------|
| 1 | Burj Khalifa | `/places-to-visit/burj-khalifa/` | The tower at blue hour or dusk; vertical subject in a landscape frame. Skyline context beats a tight crop. | [Unsplash](https://unsplash.com/s/photos/burj-khalifa) · [Pexels](https://www.pexels.com/search/burj%20khalifa/) |
| 2 | Burj Al Arab | `/places-to-visit/burj-al-arab/` | The sail silhouette, ideally from the beach with sea in the foreground. Warm light. | [Unsplash](https://unsplash.com/s/photos/burj-al-arab) · [Pexels](https://www.pexels.com/search/burj%20al%20arab/) |
| 3 | The Dubai Mall | `/places-to-visit/dubai-mall/` | Interior scale — the aquarium wall or atrium. Avoid shots dominated by retail logos. | [Unsplash](https://unsplash.com/s/photos/dubai-aquarium) · [Pexels](https://www.pexels.com/search/dubai%20mall/) |
| 4 | Palm Jumeirah | `/places-to-visit/palm-jumeirah/` | Aerial — the palm shape must read instantly. Daylight, clear water. | [Unsplash](https://unsplash.com/s/photos/palm-jumeirah) · [Pexels](https://www.pexels.com/search/palm%20jumeirah/) |
| 5 | Museum of the Future | `/places-to-visit/museum-of-the-future/` | The calligraphy-clad torus, full building in frame. Its silhouette is the story. | [Unsplash](https://unsplash.com/s/photos/museum-of-the-future-dubai) · [Pexels](https://www.pexels.com/search/museum%20of%20the%20future/) |
| 6 | Jumeirah Beach | `/places-to-visit/jumeirah-beach/` | White sand and sea with the skyline distant. Calm, spacious, lots of sky. | [Unsplash](https://unsplash.com/s/photos/jumeirah-beach) · [Pexels](https://www.pexels.com/search/jumeirah%20beach/) |
| 7 | Al Fahidi Historical Neighbourhood | `/places-to-visit/al-fahidi-neighbourhood/` | Wind-tower houses and narrow sandy lanes. Low-rise, textured, warm — the visual opposite of the towers. | [Unsplash](https://unsplash.com/s/photos/al-fahidi-dubai) · [Pexels](https://www.pexels.com/search/dubai%20wind%20tower/) |
| 8 | Gold Souk | `/places-to-visit/gold-souk/` | Gold jewellery behind glass, warm lamplight, market density. Avoid readable shop brand names. | [Unsplash](https://unsplash.com/s/photos/dubai-gold-souk) · [Pexels](https://www.pexels.com/search/gold%20souk/) |
| 9 | The Dubai Fountain | `/places-to-visit/the-dubai-fountain/` | Night, water jets lit, Burj Khalifa behind. Motion and light. | [Unsplash](https://unsplash.com/s/photos/dubai-fountain) · [Pexels](https://www.pexels.com/search/dubai%20fountain/) |
| 10 | Dubai Marina Walk | `/places-to-visit/dubai-marina-walk/` | The promenade at dusk — yachts, water, towers reflected. Human scale, not just skyline. | [Unsplash](https://unsplash.com/s/photos/dubai-marina-walk) · [Pexels](https://www.pexels.com/search/dubai%20marina/) |

## Events (3) — field: **Images**

| # | CMS item | Page | Art direction | Search |
|---|----------|------|---------------|--------|
| 11 | Dubai Food Festival | `/events/dubai-food-festival/` | Middle-Eastern / Emirati dishes, generous plating or a lively dining scene. Food is the hero. | [Unsplash](https://unsplash.com/s/photos/middle-eastern-food) · [Pexels](https://www.pexels.com/search/arabic%20food/) |
| 12 | Dubai Shopping Festival | `/events/dubai-shopping-festival/` | Fireworks over the city skyline — the festival's signature look. Night, celebratory. | [Unsplash](https://unsplash.com/s/photos/dubai-fireworks) · [Pexels](https://www.pexels.com/search/dubai%20fireworks/) |
| 13 | Dubai World Cup | `/events/dubai-world-cup/` | Racehorses mid-stride on turf, or a grandstand crowd. Motion and prestige. | [Unsplash](https://unsplash.com/s/photos/horse-racing) · [Pexels](https://www.pexels.com/search/horse%20racing/) |

## Neighbourhoods (3) — field: **Hero image** _(single reference, not a list)_

| # | CMS item | Page | Art direction | Search |
|---|----------|------|---------------|--------|
| 14 | Downtown Dubai | `/neighbourhoods/downtown-dubai/` | The Burj Khalifa + Fountain cluster as a *district*, not a single building. Wide. | [Unsplash](https://unsplash.com/s/photos/downtown-dubai) · [Pexels](https://www.pexels.com/search/downtown%20dubai/) |
| 15 | Dubai Marina | `/neighbourhoods/dubai-marina/` | Skyscraper canyon along the canal. Pick a different time of day from #10 so the two don't look duplicated. | [Unsplash](https://unsplash.com/s/photos/dubai-marina-skyline) · [Pexels](https://www.pexels.com/search/dubai%20marina%20skyline/) |
| 16 | Old Dubai | `/neighbourhoods/old-dubai/` | The Creek with abra water taxis, or souk frontage. Working, lived-in, historic. | [Unsplash](https://unsplash.com/s/photos/dubai-creek-abra) · [Pexels](https://www.pexels.com/search/old%20dubai/) |

> **Variety check before you commit:** #1, #14 and #9 can all end up as "Burj Khalifa at night", and
> #10 and #15 can both be "Dubai Marina towers". Vary time of day, distance and orientation so the
> listing grids don't look repetitive — the grid shows these side by side.

---

## Attribution log

Fill one row per image once chosen. Both licences permit free use without attribution, but we
credit anyway — it's good practice and it evidences the royalty-free claim.

| Slug (filename) | Attached to | Photographer | Source | Licence |
|-----------------|-------------|--------------|--------|---------|
| _e.g._ `burj-khalifa.jpg` | Burj Khalifa (POI) | _Name_ | _Unsplash URL_ | Unsplash Licence |
| | | | | |

**Licence references:** [Unsplash Licence](https://unsplash.com/license) ·
[Pexels Licence](https://www.pexels.com/license/)
