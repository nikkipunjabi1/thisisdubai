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

Three operations, with different answers:

| Operation | Automatable? | Why |
|-----------|:---:|-----|
| **Create folders** in CMP | ✅ **Yes** | `POST /v3/folders { name, parent_folder_id }` → 201. Implemented: `npm run cmp-folders -- --apply`. |
| **Upload** a binary into CMP/the DAM | ⚠️ **Yes via CMP** (not via the CMA) | Three steps: `GET /v3/upload-url` returns a presigned Google Cloud Storage URL plus a `key`; POST the binary there; then `POST /v3/assets { key, title, folder_id }` registers it. **The CMA cannot** — its media endpoint (`/content/{key}/versions/{version}/media`) is GET-only (`put?: never; post?: never` in its OpenAPI contract). The earlier "impossible" verdict in this file was drawn from the CMA alone and was wrong about CMP. |
| **Attach** an existing DAM asset to a content item | ✅ **Yes** | It's just a property write, which the CMA does fine. |

> **So why aren't images uploaded automatically?** The blocker is not the API — it's the
> **source**. Picking 144 correctly-licensed, genuinely relevant photographs needs either an
> Unsplash/Pexels **API key** (both are free but must be registered by a human) or a person
> choosing them. Scraping either site is not an option: it breaks their terms and both sit
> behind bot detection. Add `UNSPLASH_ACCESS_KEY` or `PEXELS_API_KEY` to `.env` and the
> sourcing step becomes scriptable — the search terms are already derivable from each item's
> name and tags.

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

## Attribution — auto-sourced imagery

<!-- AUTO-CREDITS:START -->
_Auto-generated by `scripts/source-images.mjs`. Do not edit by hand — re-run the script._

| Item | Type | Photographer | Source | Link |
| --- | --- | --- | --- | --- |
| `abra-creek-crossing` | Point of Interest | [Adamant Edindon](https://www.pexels.com/@adamant-edindon-779703529) | pexels | [source](https://www.pexels.com/photo/boats-in-canal-in-united-emirates-20542413/) |
| `ain-dubai` | Point of Interest | [Rcastro creative](https://www.pexels.com/@rcastro-creative-530099892) | pexels | [source](https://www.pexels.com/photo/skyscraper-and-ferris-wheel-on-sea-coast-at-sunset-16681448/) |
| `al-ahmadiya-school` | Point of Interest | [Walid Ahmad](https://www.pexels.com/@walidphotoz) | pexels | [source](https://www.pexels.com/photo/traditional-architecture-in-dubai-s-historic-al-fahidi-quarter-33665954/) |
| `al-barsha` | Neighbourhood | [MAMADO UAE](https://www.pexels.com/@wathegony) | pexels | [source](https://www.pexels.com/photo/busy-street-scene-in-dubai-with-high-rise-buildings-32660887/) |
| `al-mamzar-beach-park` | Point of Interest | [Thushara   shaji](https://www.pexels.com/@thushara-shaji-2156415173) | pexels | [source](https://www.pexels.com/photo/beautiful-al-mamzar-beach-sunset-in-dubai-34345411/) |
| `al-marmoom` | Neighbourhood | [Eslam Mohammed Abdelmaksoud](https://www.pexels.com/@eslames1) | pexels | [source](https://www.pexels.com/photo/golden-sand-dunes-in-al-ain-desert-at-sunset-28718301/) |
| `al-marmoom-desert-conservation-reserve` | Point of Interest | [Denys Gromov](https://www.pexels.com/@jdgromov) | pexels | [source](https://www.pexels.com/photo/antelope-drinking-out-of-a-street-on-a-safari-7101145/) |
| `al-qudra-lakes` | Point of Interest | [The Lazy Artist Gallery](https://www.pexels.com/@thelazyartist) | pexels | [source](https://www.pexels.com/photo/oasis-in-desert-area-in-cloudy-weather-1117481/) |
| `al-quoz` | Neighbourhood | [Kadir Avşar](https://www.pexels.com/@kadiravsarr) | pexels | [source](https://www.pexels.com/photo/an-aerial-view-of-a-building-with-a-large-square-in-the-middle-14749843/) |
| `al-seef` | Point of Interest | [aboodi vesakaran](https://www.pexels.com/@aboodi) | pexels | [source](https://www.pexels.com/photo/al-seef-heritage-hotel-in-dubai-11755215/) |
| `al-shindagha-museum` | Point of Interest | [Eslam Mohammed Abdelmaksoud](https://www.pexels.com/@eslames1) | pexels | [source](https://www.pexels.com/photo/historical-architecture-at-al-shindagha-museum-28406955/) |
| `alserkal-avenue` | Point of Interest | [Lajos Kristóf Kántor](https://www.pexels.com/@lajos-kristof-kantor-2158796893) | pexels | [source](https://www.pexels.com/photo/modern-dubai-boulevard-with-skyscrapers-36339267/) |
| `aquaventure-waterpark` | Point of Interest | [Rick Josey](https://www.pexels.com/@rick-josey-130171209) | pexels | [source](https://www.pexels.com/photo/double-waterslide-at-the-atlantis-bahamas-12359638/) |
| `art-dubai` | Event | [aboodi vesakaran](https://www.pexels.com/@aboodi) | pexels | [source](https://www.pexels.com/photo/abstract-stainless-steel-sculpture-in-dubai-uae-18620033/) |
| `at-the-top-sky` | Point of Interest | [Nishant Vyas](https://www.pexels.com/@nishantvy) | pexels | [source](https://www.pexels.com/photo/modern-architectural-detail-of-burj-khalifa-at-night-36909907/) |
| `atlantis-the-palm` | Point of Interest | [Mikhail Nilov](https://www.pexels.com/@mikhail-nilov) | pexels | [source](https://www.pexels.com/photo/hotel-atlantis-in-dubai-at-sunset-8319463/) |
| `aya-universe` | Point of Interest | [AJ  Ahamad](https://www.pexels.com/@aj-ahamad-767001191) | pexels | [source](https://www.pexels.com/photo/modern-playground-in-dubai-residential-area-29247929/) |
| `bay-avenue-park` | Point of Interest | [Kate Trysh](https://www.pexels.com/@katetrysh) | pexels | [source](https://www.pexels.com/photo/palm-tree-boulevard-with-blank-white-billboards-along-the-urban-street-road-28028559/) |
| `best-views-in-dubai` | Article | [Aleksandar Pasaric](https://www.pexels.com/@apasaric) | pexels | [source](https://www.pexels.com/photo/view-of-cityscape-325185/) |
| `bluewaters-beach` | Point of Interest | [Anisha Dahiya](https://www.pexels.com/@anisha-dahiya-2147722286) | pexels | [source](https://www.pexels.com/photo/ain-dubai-ferris-wheel-at-night-in-uae-29731165/) |
| `bluewaters-island` | Neighbourhood | [Denys Gromov](https://www.pexels.com/@jdgromov) | pexels | [source](https://www.pexels.com/photo/huge-white-ferris-wheel-in-dubai-uae-4584928/) |
| `bur-dubai-grand-mosque` | Point of Interest | [Kirandeep Singh Walia](https://www.pexels.com/@kirandeepsingh) | pexels | [source](https://www.pexels.com/photo/sharjah-grand-mosque-in-united-arab-emirates-11143082/) |
| `burj-park` | Point of Interest | [Lajos Kristóf Kántor](https://www.pexels.com/@lajos-kristof-kantor-2158796893) | pexels | [source](https://www.pexels.com/photo/burj-khalifa-and-reflection-in-dubai-36339269/) |
| `business-bay` | Neighbourhood | [Walid Ahmad](https://www.pexels.com/@walidphotoz) | pexels | [source](https://www.pexels.com/photo/cityscape-of-dubai-under-a-dramatic-sky-17238022/) |
| `city-walk` | Neighbourhood | [Diego F. Parra](https://www.pexels.com/@diego-f-parra-33199) | pexels | [source](https://www.pexels.com/photo/glass-dome-walls-and-buildings-under-clear-sky-15478472/) |
| `coca-cola-arena` | Point of Interest | [Mitchell Luo](https://www.pexels.com/@mitchel3uo) | pexels | [source](https://www.pexels.com/photo/green-chairs-on-stadium-6998683/) |
| `coffee-museum` | Point of Interest | [The Lazy Artist Gallery](https://www.pexels.com/@thelazyartist) | pexels | [source](https://www.pexels.com/photo/woman-holding-cup-of-coffee-and-reading-book-4545869/) |
| `creek-park` | Point of Interest | [Kate Trysh](https://www.pexels.com/@katetrysh) | pexels | [source](https://www.pexels.com/photo/scenic-view-of-dubai-creek-with-traditional-dhow-28515818/) |
| `deira` | Neighbourhood | [Kate Trysh](https://www.pexels.com/@katetrysh) | pexels | [source](https://www.pexels.com/photo/waterfront-harbor-skyline-with-traditional-drifting-fishing-boat-on-the-sea-27522502/) |
| `deira-clocktower` | Point of Interest | [Kirandeep Singh Walia](https://www.pexels.com/@kirandeepsingh) | pexels | [source](https://www.pexels.com/photo/deira-twin-towers-on-sea-coast-in-dubai-19913932/) |
| `desert-in-a-day` | Article | [The Lazy Artist Gallery](https://www.pexels.com/@thelazyartist) | pexels | [source](https://www.pexels.com/photo/blue-car-on-the-road-1559179/) |
| `dubai-aquarium` | Point of Interest | [Dawid Tkocz](https://www.pexels.com/@dawidtkocz) | pexels | [source](https://www.pexels.com/photo/vibrant-red-jellyfish-in-dubai-aquarium-display-35665818/) |
| `dubai-art-scene` | Article | [Denys Gromov](https://www.pexels.com/@jdgromov) | pexels | [source](https://www.pexels.com/photo/glass-sculpture-on-the-street-4550735/) |
| `dubai-butterfly-garden` | Point of Interest | [Chandra Prasad](https://www.pexels.com/@chandra-prasad-2160300844) | pexels | [source](https://www.pexels.com/photo/close-up-of-three-owl-butterflies-feeding-in-dubai-36625383/) |
| `dubai-creek-golf-yacht-club` | Point of Interest | [Khuram Naseem](https://www.pexels.com/@khuramnaseemfilms) | pexels | [source](https://www.pexels.com/photo/golfer-teeing-off-with-dubai-skyline-in-background-37825475/) |
| `dubai-creek-harbour` | Neighbourhood | [Yassen Kounchev](https://www.pexels.com/@yassen-kounchev-889850329) | pexels | [source](https://www.pexels.com/photo/dubai-creek-harbour-at-sunset-19845370/) |
| `dubai-desert-conservation-reserve` | Point of Interest | [Denys Gromov](https://www.pexels.com/@jdgromov) | pexels | [source](https://www.pexels.com/photo/gazelles-in-the-desert-4813557/) |
| `dubai-design-week` | Event | [Denys Gromov](https://www.pexels.com/@jdgromov) | pexels | [source](https://www.pexels.com/photo/photograph-of-lights-in-tubes-8312016/) |
| `dubai-dolphinarium` | Point of Interest | [Efrem  Efre](https://www.pexels.com/@efrem-efre-2786187) | pexels | [source](https://www.pexels.com/photo/group-of-dolphins-jumping-out-of-swimming-pool-26436663/) |
| `dubai-fitness-challenge` | Event | [Kate Trysh](https://www.pexels.com/@katetrysh) | pexels | [source](https://www.pexels.com/photo/morning-waterfront-promenade-with-palm-trees-and-jogger-on-modern-marina-walkway-27504018/) |
| `dubai-frame` | Point of Interest | [Bee Captures](https://www.pexels.com/@bee-captures-3626300) | pexels | [source](https://www.pexels.com/photo/spectacular-fireworks-at-dubai-frame-30034153/) |
| `dubai-garden-glow` | Point of Interest | [Diego F. Parra](https://www.pexels.com/@diego-f-parra-33199) | pexels | [source](https://www.pexels.com/photo/dubai-miracle-garden-in-summer-15131322/) |
| `dubai-harbour` | Point of Interest | [Mahmoud Alsakhnini](https://www.pexels.com/@mahmoud-alsakhnini-5767275) | pexels | [source](https://www.pexels.com/photo/brown-boat-on-seashore-5939895/) |
| `dubai-ice-rink` | Point of Interest | [Pavel Danilyuk](https://www.pexels.com/@pavel-danilyuk) | pexels | [source](https://www.pexels.com/photo/person-riding-a-zamboni-on-an-ice-skating-rink-6539485/) |
| `dubai-international-boat-show` | Event | [AJ  Ahamad](https://www.pexels.com/@aj-ahamad-767001191) | pexels | [source](https://www.pexels.com/photo/a-yacht-in-a-city-19159184/) |
| `dubai-jazz-festival` | Event | [Drinu Cutajar](https://www.pexels.com/@drinu-cutajar-347725497) | pexels | [source](https://www.pexels.com/photo/emirates-boeing-777-on-airport-runway-32622848/) |
| `dubai-marathon` | Event | [Rockwell branding agency](https://www.pexels.com/@rockwell-branding-agency-85164430) | pexels | [source](https://www.pexels.com/photo/cruise-ships-moored-in-dubai-19612315/) |
| `dubai-marina-mall` | Point of Interest | [jc dubi](https://www.pexels.com/@jc-dubi-205977) | pexels | [source](https://www.pexels.com/photo/high-rise-building-near-body-of-water-during-night-time-713458/) |
| `dubai-miracle-garden` | Point of Interest | [Nishant Vyas](https://www.pexels.com/@nishantvy) | pexels | [source](https://www.pexels.com/photo/vibrant-flower-display-at-dubai-miracle-garden-36871353/) |
| `dubai-on-a-budget` | Article | [Denys Gromov](https://www.pexels.com/@jdgromov) | pexels | [source](https://www.pexels.com/photo/dubai-skyline-with-tall-buildings-and-water-28350363/) |
| `dubai-opera` | Point of Interest | [JESHOOTS.com](https://www.pexels.com/@jeshoots-com-147458) | pexels | [source](https://www.pexels.com/photo/black-concrete-buildings-under-cloudy-sky-442579/) |
| `dubai-public-beaches-guide` | Article | [Vika Glitter](https://www.pexels.com/@vika-glitter-392079) | pexels | [source](https://www.pexels.com/photo/scenic-beach-and-mosque-with-city-skyline-36094292/) |
| `dubai-rugby-sevens` | Event | [Milan Kiro](https://www.pexels.com/@milan-kiro-14866370) | pexels | [source](https://www.pexels.com/photo/uae-national-flags-on-dubai-beach-with-burj-al-arab-29188670/) |
| `dubai-safari-park` | Point of Interest | [Magda Ehlers](https://www.pexels.com/@magda-ehlers-pexels) | pexels | [source](https://www.pexels.com/photo/animal-statues-in-outdoor-zoo-exhibit-35012778/) |
| `dubai-summer-surprises` | Event | [Aleksandar Pasaric](https://www.pexels.com/@apasaric) | pexels | [source](https://www.pexels.com/photo/burj-al-arab-saudi-823696/) |
| `dubai-tennis-championships` | Event | [The Lazy Artist Gallery](https://www.pexels.com/@thelazyartist) | pexels | [source](https://www.pexels.com/photo/aerial-photography-basketball-court-1598347/) |
| `dubai-water-canal` | Point of Interest | [Walid Ahmad](https://www.pexels.com/@walidphotoz) | pexels | [source](https://www.pexels.com/photo/water-and-city-17285751/) |
| `dubai-with-kids` | Article | [Hugo Sykes](https://www.pexels.com/@hugosykes) | pexels | [source](https://www.pexels.com/photo/man-with-daughters-on-promenade-in-dubai-19350915/) |
| `dubai-world-trade-centre` | Point of Interest | [Walid Ahmad](https://www.pexels.com/@walidphotoz) | pexels | [source](https://www.pexels.com/photo/modern-architecture-and-traditional-boats-in-dubai-31146745/) |
| `dubailand` | Neighbourhood | [Kate Trysh](https://www.pexels.com/@katetrysh) | pexels | [source](https://www.pexels.com/photo/stunning-panoramic-view-of-city-skyline-with-skyscrapers-and-blue-sky-27206533/) |
| `eating-in-dubai` | Article | [Denys Gromov](https://www.pexels.com/@jdgromov) | pexels | [source](https://www.pexels.com/photo/person-holding-a-slice-of-pizza-12645182/) |
| `eid-al-fitr-dubai` | Event | [Timur Weber](https://www.pexels.com/@timur-weber) | pexels | [source](https://www.pexels.com/photo/father-and-son-sitting-at-the-table-9127752/) |
| `emirates-festival-of-literature` | Event | [aboodi vesakaran](https://www.pexels.com/@aboodi) | pexels | [source](https://www.pexels.com/photo/books-stored-in-bookcases-in-a-library-18620051/) |
| `etihad-museum` | Point of Interest | [Miguel Cuenca](https://www.pexels.com/@miguel-cuenca-67882473) | pexels | [source](https://www.pexels.com/photo/photo-of-a-museum-building-13396890/) |
| `expo-city` | Neighbourhood | [Diego F. Parra](https://www.pexels.com/@diego-f-parra-33199) | pexels | [source](https://www.pexels.com/photo/sustainability-pavilion-in-dubai-15177911/) |
| `expo-city-dubai` | Point of Interest | [Image Hunter](https://www.pexels.com/@image-hunter-281453274) | pexels | [source](https://www.pexels.com/photo/view-of-dome-and-pavilion-at-the-expo-city-in-dubai-13012258/) |
| `gitex-global` | Event | [Magda Ehlers](https://www.pexels.com/@magda-ehlers-pexels) | pexels | [source](https://www.pexels.com/photo/dubai-downtown-skyline-with-busy-roads-35027037/) |
| `global-village` | Point of Interest | [Nipun Sandaru](https://www.pexels.com/@nipun-sandaru-2158400918) | pexels | [source](https://www.pexels.com/photo/charming-architectural-scene-in-dubai-s-global-village-37485056/) |
| `hatta` | Neighbourhood | [Abed Ismail](https://www.pexels.com/@abed-ismail) | pexels | [source](https://www.pexels.com/photo/the-hatta-mountain-in-dubai-10004805/) |
| `hatta-dam` | Point of Interest | [Eslam Mohammed Abdelmaksoud](https://www.pexels.com/@eslames1) | pexels | [source](https://www.pexels.com/photo/scenic-aerial-view-of-hatta-lake-dubai-31169361/) |
| `hatta-heritage-village` | Point of Interest | [Salman Av](https://www.pexels.com/@salman-av-2323323) | pexels | [source](https://www.pexels.com/photo/tower-with-flag-under-cloudscape-sharjah-united-arab-emirates-6259274/) |
| `hatta-wadi-hub` | Point of Interest | [Eslam Mohammed Abdelmaksoud](https://www.pexels.com/@eslames1) | pexels | [source](https://www.pexels.com/photo/scenic-view-of-hatta-lake-in-dubai-31169358/) |
| `heritage-house` | Point of Interest | [Walid Ahmad](https://www.pexels.com/@walidphotoz) | pexels | [source](https://www.pexels.com/photo/traditional-wooden-door-in-dubai-s-historic-area-33230887/) |
| `hero-dubai-desert-classic` | Event | [MART  PRODUCTION](https://www.pexels.com/@mart-production) | pexels | [source](https://www.pexels.com/photo/photo-of-sand-dunes-in-a-desert-8869381/) |
| `img-worlds-of-adventure` | Point of Interest | [Mikhail Nilov](https://www.pexels.com/@mikhail-nilov) | pexels | [source](https://www.pexels.com/photo/atlantis-hotel-in-dubai-8319454/) |
| `jbr` | Neighbourhood | [Anton Massalov](https://www.pexels.com/@antonhansenphotography) | pexels | [source](https://www.pexels.com/photo/stunning-dubai-marina-skyline-waterfront-view-29353234/) |
| `jebel-ali` | Neighbourhood | [Hasham Khosa](https://www.pexels.com/@hasham4367) | pexels | [source](https://www.pexels.com/photo/aerial-view-of-traffic-on-dubai-highway-35284999/) |
| `jumeirah` | Neighbourhood | [Magda Ehlers](https://www.pexels.com/@magda-ehlers-pexels) | pexels | [source](https://www.pexels.com/photo/modern-jumeirah-architectural-landmark-dubai-35171473/) |
| `jumeirah-corniche` | Point of Interest | [Eslam Mohammed Abdelmaksoud](https://www.pexels.com/@eslames1) | pexels | [source](https://www.pexels.com/photo/abu-dhabi-corniche-28406816/) |
| `jumeirah-mosque` | Point of Interest | [Mahmoud Alaydi](https://www.pexels.com/@malaydi) | pexels | [source](https://www.pexels.com/photo/dome-of-the-sheikh-zayed-grand-mosque-abu-dhabi-7941689/) |
| `kidzania-dubai` | Point of Interest | [AJ  Ahamad](https://www.pexels.com/@aj-ahamad-767001191) | pexels | [source](https://www.pexels.com/photo/vibrant-dubai-marina-skyline-at-night-30554306/) |
| `kite-beach` | Point of Interest | [Denys Gromov](https://www.pexels.com/@jdgromov) | pexels | [source](https://www.pexels.com/photo/man-is-holding-a-kite-on-seashore-7816077/) |
| `la-mer` | Point of Interest | [Courtney RA](https://www.pexels.com/@courtney-ra-1608069) | pexels | [source](https://www.pexels.com/photo/beachside-tiki-hut-bar-on-sandy-shore-37088029/) |
| `laguna-waterpark` | Point of Interest | [Mikhail Nilov](https://www.pexels.com/@mikhail-nilov) | pexels | [source](https://www.pexels.com/photo/aquaventure-waterpark-in-dubai-8319455/) |
| `legoland-dubai` | Point of Interest | [Milan Kiro](https://www.pexels.com/@milan-kiro-14866370) | pexels | [source](https://www.pexels.com/photo/uae-flags-displayed-on-a-sandy-dubai-beach-29188668/) |
| `legoland-water-park` | Point of Interest | [Magda Ehlers](https://www.pexels.com/@magda-ehlers-pexels) | pexels | [source](https://www.pexels.com/photo/stunning-view-of-burj-al-arab-and-water-park-35171472/) |
| `love-lake-dubai` | Point of Interest | [Ashal Abbas](https://www.pexels.com/@ashal-abbas-2623660) | pexels | [source](https://www.pexels.com/photo/islands-on-desert-5855866/) |
| `madinat-jumeirah` | Point of Interest | [Denys Gromov](https://www.pexels.com/@jdgromov) | pexels | [source](https://www.pexels.com/photo/madinat-jumeirah-hotel-by-marina-in-dubai-uae-4852758/) |
| `mall-of-the-emirates` | Point of Interest | [Heinz Klier](https://www.pexels.com/@heinz-klier-261981) | pexels | [source](https://www.pexels.com/photo/majestic-glass-dome-at-mall-of-the-emirates-37271379/) |
| `marina-beach` | Point of Interest | [Denys Gromov](https://www.pexels.com/@jdgromov) | pexels | [source](https://www.pexels.com/photo/modern-skyscrapers-and-beach-in-dubai-united-arab-emirates-4768984/) |
| `mercato-shopping-mall` | Point of Interest | [Daniel  ..](https://www.pexels.com/@daniel-736236834) | pexels | [source](https://www.pexels.com/photo/hall-in-dubai-mall-18669645/) |
| `motiongate-dubai` | Point of Interest | [aboodi vesakaran](https://www.pexels.com/@aboodi) | pexels | [source](https://www.pexels.com/photo/wooden-old-fashioned-cart-12984936/) |
| `museum-of-illusions-dubai` | Point of Interest | [MAMADO UAE](https://www.pexels.com/@wathegony) | pexels | [source](https://www.pexels.com/photo/dubai-museum-of-the-future-architecture-32690046/) |
| `nakheel-mall` | Point of Interest | [Dina](https://www.pexels.com/@dina-872032140) | pexels | [source](https://www.pexels.com/photo/palm-trees-by-modern-dubai-mall-in-uae-19749291/) |
| `new-years-eve-dubai` | Event | [Marvin  Sacdalan](https://www.pexels.com/@marvin-sacdalan-276316567) | pexels | [source](https://www.pexels.com/photo/fireworks-over-the-buildings-13076922/) |
| `old-dubai-in-a-morning` | Article | [MAMADO UAE](https://www.pexels.com/@wathegony) | pexels | [source](https://www.pexels.com/photo/traditional-architecture-in-al-fahidi-dubai-at-dawn-29401696/) |
| `palm-west-beach` | Point of Interest | [Nelemson G](https://www.pexels.com/@nelemson) | pexels | [source](https://www.pexels.com/photo/scenic-view-of-palm-jumeirah-beach-in-dubai-29212684/) |
| `perfume-souk` | Point of Interest | [Kate Trysh](https://www.pexels.com/@katetrysh) | pexels | [source](https://www.pexels.com/photo/vibrant-spice-market-in-dubai-souq-28515826/) |
| `pier-7` | Point of Interest | [Selim Karadayı](https://www.pexels.com/@selimkrdy) | pexels | [source](https://www.pexels.com/photo/vibrant-dubai-marina-at-night-with-illuminated-skyline-29561721/) |
| `quoz-arts-fest` | Event | [Yan Krukau](https://www.pexels.com/@yankrukov) | pexels | [source](https://www.pexels.com/photo/man-in-black-t-shirt-and-black-sunglasses-using-audio-mixer-9005452/) |
| `ramadan-in-dubai` | Event | [aboodi vesakaran](https://www.pexels.com/@aboodi) | pexels | [source](https://www.pexels.com/photo/dubai-ramadan-kareem-illuminated-sign-at-night-31215846/) |
| `ramadan-in-dubai-visitors` | Article | [Kate Trysh](https://www.pexels.com/@katetrysh) | pexels | [source](https://www.pexels.com/photo/urban-outdoor-park-with-palm-trees-and-high-rise-buildings-decorated-with-string-lights-27277169/) |
| `ras-al-khor-wildlife-sanctuary` | Point of Interest | [Denys Gromov](https://www.pexels.com/@jdgromov) | pexels | [source](https://www.pexels.com/photo/flamingos-in-water-12898628/) |
| `real-madrid-world` | Point of Interest | [Lajos Kristóf Kántor](https://www.pexels.com/@lajos-kristof-kantor-2158796893) | pexels | [source](https://www.pexels.com/photo/santiago-bernabeu-stadium-in-madrid-on-a-summer-day-37174993/) |
| `riverland-dubai` | Point of Interest | [The Lazy Artist Gallery](https://www.pexels.com/@thelazyartist) | pexels | [source](https://www.pexels.com/photo/aerial-photo-of-lake-1488087/) |
| `safa-park` | Point of Interest | [Alexander Shabanov](https://www.pexels.com/@alexander-shabanov-2151372921) | pexels | [source](https://www.pexels.com/photo/stunning-view-of-dubai-skyline-from-a-park-37173167/) |
| `saruq-al-hadid-museum` | Point of Interest | [Atoosa Ryanne Arfa](https://www.pexels.com/@atoosa-ryanne-arfa-889847941) | pexels | [source](https://www.pexels.com/photo/national-museum-of-qatar-in-doha-25781448/) |
| `sheikh-saeed-al-maktoum-house` | Point of Interest | [Jestin Antony](https://www.pexels.com/@jestin-antony-602690562) | pexels | [source](https://www.pexels.com/photo/traditional-architecture-in-historic-middle-eastern-alley-36149325/) |
| `ski-dubai` | Point of Interest | [Denys Gromov](https://www.pexels.com/@jdgromov) | pexels | [source](https://www.pexels.com/photo/modern-high-rise-buildings-near-a-body-of-water-4491948/) |
| `sky-views-dubai` | Point of Interest | [Heinz Klier](https://www.pexels.com/@heinz-klier-261981) | pexels | [source](https://www.pexels.com/photo/ain-dubai-the-world-s-tallest-ferris-wheel-30690139/) |
| `skydive-dubai` | Point of Interest | [Ralph Burrows](https://www.pexels.com/@ralphburrows) | pexels | [source](https://www.pexels.com/photo/parachuters-on-air-5035655/) |
| `sole-dxb` | Event | [Mohd Atir](https://www.pexels.com/@mohdatir) | pexels | [source](https://www.pexels.com/photo/airplane-on-tarmac-at-dubai-international-airport-38593294/) |
| `souk-al-bahar` | Point of Interest | [Pavlo Luchkovski](https://www.pexels.com/@pashal) | pexels | [source](https://www.pexels.com/photo/city-at-waterfront-337932/) |
| `souk-madinat-jumeirah` | Point of Interest | [Magda Ehlers](https://www.pexels.com/@magda-ehlers-pexels) | pexels | [source](https://www.pexels.com/photo/souk-madinat-jumeirah-entrance-with-palm-trees-35171474/) |
| `spice-souk` | Point of Interest | [AXP Photography](https://www.pexels.com/@axp-photography-500641970) | pexels | [source](https://www.pexels.com/photo/display-of-dried-spices-16412108/) |
| `sunset-beach` | Point of Interest | [Selim Karadayı](https://www.pexels.com/@selimkrdy) | pexels | [source](https://www.pexels.com/photo/sunset-view-of-dubai-eye-ferris-wheel-at-beach-29561719/) |
| `textile-souk` | Point of Interest | [Kate Trysh](https://www.pexels.com/@katetrysh) | pexels | [source](https://www.pexels.com/photo/sleeping-cats-in-dubai-textile-market-scene-28515814/) |
| `the-beach-at-jbr` | Point of Interest | [Frederick Cana](https://www.pexels.com/@frederick-cana-2149043416) | pexels | [source](https://www.pexels.com/photo/modern-skyscrapers-in-dubai-marina-at-daytime-30445927/) |
| `the-green-planet` | Point of Interest | [Denys Gromov](https://www.pexels.com/@jdgromov) | pexels | [source](https://www.pexels.com/photo/the-green-planet-in-dubai-4835292/) |
| `the-lost-chambers-aquarium` | Point of Interest | [Pixabay](https://www.pexels.com/@pixabay) | pexels | [source](https://www.pexels.com/photo/ammonites-221219/) |
| `the-pointe` | Point of Interest | [Denys Gromov](https://www.pexels.com/@jdgromov) | pexels | [source](https://www.pexels.com/photo/time-lapse-photography-of-ferris-wheel-during-night-time-7974825/) |
| `the-view-at-the-palm` | Point of Interest | [Nelemson G](https://www.pexels.com/@nelemson) | pexels | [source](https://www.pexels.com/photo/aerial-view-of-palm-jumeirah-islands-in-dubai-29212700/) |
| `the-walk-at-jbr` | Point of Interest | [Denys Gromov](https://www.pexels.com/@jdgromov) | pexels | [source](https://www.pexels.com/photo/city-buildings-under-the-blue-sky-4531667/) |
| `theatre-of-digital-art` | Point of Interest | [Denys Gromov](https://www.pexels.com/@jdgromov) | pexels | [source](https://www.pexels.com/photo/a-3d-model-of-earth-in-expo-2020-12381329/) |
| `three-days-in-dubai` | Article | [Tima Miroshnichenko](https://www.pexels.com/@tima-miroshnichenko) | pexels | [source](https://www.pexels.com/photo/statue-of-a-hand-with-three-finger-salute-between-buildings-under-blue-sky-7169931/) |
| `vr-park-dubai` | Point of Interest | [Lajos Kristóf Kántor](https://www.pexels.com/@lajos-kristof-kantor-2158796893) | pexels | [source](https://www.pexels.com/photo/palm-tree-lined-walkway-in-dubai-park-36339290/) |
| `waterfront-market` | Point of Interest | [Ayrat](https://www.pexels.com/@ayrat-244411276) | pexels | [source](https://www.pexels.com/photo/a-river-in-a-city-19136333/) |
| `wild-wadi-waterpark` | Point of Interest | [Denys Gromov](https://www.pexels.com/@jdgromov) | pexels | [source](https://www.pexels.com/photo/people-enjoying-the-waterpark-4957436/) |
| `xline-dubai-marina` | Point of Interest | [Denys Gromov](https://www.pexels.com/@jdgromov) | pexels | [source](https://www.pexels.com/photo/dubai-marina-dubai-uae-28350360/) |
| `zabeel` | Neighbourhood | [The Lazy Artist Gallery](https://www.pexels.com/@thelazyartist) | pexels | [source](https://www.pexels.com/photo/aerial-photo-of-lake-1488087/) |
| `zabeel-park` | Point of Interest | [Denys Gromov](https://www.pexels.com/@jdgromov) | pexels | [source](https://www.pexels.com/photo/the-dubai-frame-4612430/) |
<!-- AUTO-CREDITS:END -->
