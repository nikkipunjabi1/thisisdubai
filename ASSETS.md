# Assets & Attributions

_Every image on This is Dubai is **royalty-free** and credited here. This file is both the
**sourcing sheet** (what to download and where it goes) and the **attribution log** (filled in
once an image is chosen). Referenced by README.md and docs/BRAINSTORM.md §"Asset & legal hygiene"._

> ⚠️ **Legal hygiene (non-negotiable for this repo).** Royalty-free only — Unsplash or Pexels.
> No official tourism-authority photography, no trademarked logos or branding, and no images
> whose subject is primarily a brand mark. Photographs *of real places* are fine and are used
> descriptively. Prefer images without prominent identifiable faces (no model release here).
> Binary files are **not** committed to this repo — they live in CMP/the CMS DAM.

## Why this is a manual step

The Optimizely **Content Management API cannot upload binaries** — its media endpoint
(`/content/{key}/versions/{version}/media`) is **GET only**, and creating an image content item
requires an `initialVersion.media.key` that must already exist. So assets are uploaded through
CMP / the CMS UI by a human, and the code then references them. See docs/OPTIMIZELY-BEST-PRACTICES.md.

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
