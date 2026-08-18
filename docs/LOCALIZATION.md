# Localization — EN + AR (Arabic) on Optimizely SaaS + Next.js

_Status: **COMPLETE (L0–L6 + L-mod).** Full bilingual EN/AR site is live: the whole corpus is
translated and published (187 EN = 187 AR, verified via Graph), every AR page slug matches its EN
twin, and language switching works site-wide with no 404s. Operational tooling and gotchas below._

This is the plan and the record of decisions for adding Arabic alongside English. It exists
because the routing, RTL, data, search, and SEO layers all touch each other — the map is worth
having in one place.

## Decisions (locked with the user)

| Decision | Choice | Why |
|---|---|---|
| **URL strategy** | Locale prefix on **both** languages: `/en/...` and `/ar/...`; `/` → `/en` | Clean, SEO-friendly (`hreflang`), shareable AR URLs. Needs a `[locale]` route segment + middleware. |
| **Scope of AR** | **Full** translation of the ~250-item corpus | Real bilingual site, not a token demo. Heaviest piece → sequenced last (L6). |
| **AR authoring / translation** | **Opal, directly in the CMS** (user-driven) | Keeps translation in the editor workflow; no bulk CMA translation script from the app side. |
| **String catalog** | **Lightweight hand-rolled** typed dictionary (`src/lib/i18n/messages/{en,ar}.ts`) + a tiny `t(locale, key)` | Matches the project's dependency-light, hand-rolled style. Our routing is a custom `[locale]` segment + middleware, so `next-intl`'s routing/middleware would fight it. Only one real plural ("N results") — not worth an ICU runtime. Revisit if pluralization/formatting needs grow. |

## Spike findings (L0) — the mechanism works; the CMS gates it

- **SDK supports locale.** `@optimizely/cms-sdk@^2.2.0` exposes `locale` on `getContentByPath(path, { locale })`, `getContent`, `getItems`, `getPath`. So threading a locale through the loaders is a supported, first-class path.
- **⚠️ Arabic is NOT enabled in the CMS instance yet — this is the gate for L2/L6.** Probing Graph:
  - `__type(name:"Locales")` returns only **`['ALL', 'NEUTRAL', 'en']`**.
  - All 192 content items report `_metadata.locale = 'en'`.
  - Querying `PointOfInterest(locale: ar)` hard-errors: `Value "ar" does not exist in "Locales" enum`.
- **Unblock step (CMS admin, user-driven):** Settings → Languages → add/enable **Arabic** (recommend `ar-AE` for a Dubai site; plain `ar` is fine), enable it on the **site/start page**, and set English as the fallback so untranslated fields degrade gracefully. Graph then re-exposes the enum with the new tag.
- **After enabling, confirm the exact tag** (`ar` vs `ar-AE` vs `ar_AE`) and set it in **one place**: `GRAPH_LOCALE` in [`src/lib/i18n.ts`](../src/lib/i18n.ts). Everything downstream is tag-agnostic.

### Verify AR is live (re-run after enabling)
```bash
cd <repo> && set -a && . ./.env && set +a && \
curl -s "${OPTIMIZELY_GRAPH_GATEWAY}?auth=${OPTIMIZELY_GRAPH_SINGLE_KEY}" \
  -H 'Content-Type: application/json' \
  --data '{"query":"{ __type(name:\"Locales\"){ enumValues{ name } } }"}'
```
Success = `ar` (or `ar_AE`) appears in the enum.

## Foundations shipped in L0

- **[`src/lib/i18n.ts`](../src/lib/i18n.ts)** — the single source of truth, no Graph/Next deps (Edge-safe for middleware):
  `LOCALES`, `Locale`, `DEFAULT_LOCALE`, `isLocale`, `dir()`, `htmlLang()` (`en-GB` / `ar-AE`),
  `graphLocale()` (the one CMS-tag mapping), `splitLocale()`, `withLocale()`, `alternateHref()`
  (for the switcher + `hreflang`), and `formatDate()` (replaces the 5 hardcoded `en-GB` date sites).

## Sprint plan

| Sprint | Ships | Blocked by AR-in-CMS? |
|---|---|---|
| **L0 · Spike + foundations** ✅ | Mechanism verified; `src/lib/i18n.ts`; this doc. | — |
| **L1 · Routing + RTL shell** | `src/app/[locale]/` segment (home, `[...slug]`, articles, search moved under it); `middleware.ts` (`/`→`/en`, validate locale); dynamic `<html lang dir>`; Arabic web font subset. `/en` + `/ar` resolve; RTL flips on `/ar`. | No — builds against EN content; RTL is CSS/markup. |
| **L2 · Locale-aware data** | `locale` arg into all 12 loaders + the GraphQL `locale:` arg + into **every `cachedGraphRead` keyParts** (else EN/AR collide in cache); locale-aware dates. `/ar` serves AR variants (falls back to EN per CMS fallback). | **Yes.** |
| **L3 · UI string catalog** | `src/lib/i18n/messages/{en,ar}.ts` + `t()`; extract nav/footer/search/controls/breadcrumb strings; AR translations of chrome. | No (chrome strings are ours). |
| **L4 · AR semantic search** | `locale` into the 3 search sub-queries + `$loc` var + keyParts; AR stop-word path (the English `STOP_WORDS` list must not strip AR); localize search UI + group labels + hrefs. → **Blog #7.** | **Yes** (needs AR content to search). |
| **L5 · SEO** | `hreflang` alternates (en↔ar), per-locale canonical, `og:locale`, per-locale sitemap entries. | Partial — markup can land pre-content. |
| **L6 · Full AR translation** ✅ | ~250 items translated in the CMS via **Opal (user-driven)**, published (`publish:ar`) + slugs aligned (`align:ar-slugs`). 187 EN = 187 AR. → **Blog #10.** | **Yes.** |

## Known touch-points (from the L0 codebase map)

- **Root layout** `src/app/layout.tsx:139–143` — hardcodes `lang="en"`, has **no `dir`**; fonts load `subsets:['latin']` only (need an Arabic-capable subset). Layout is currently synchronous and can't receive a locale param → the `[locale]` segment fixes this.
- **12 Graph loaders** — `src/lib/{pois,articles,sections,search,breadcrumbs,seo}.ts`; none pass `locale` today.
- **Cache** `src/lib/cache.ts` — `keyParts` is a static `string[]` at wrap time; locale must be appended to every one.
- **Search** `src/lib/search.ts` — 3 federated sub-queries, no locale; `STOP_WORDS`/`normalizeQuery` are English-only; `GROUP_META` labels + `href`s are hardcoded English.
- **Dates** — `toLocaleDateString('en-GB')` hardcoded in 5 spots (`sections.ts:58`, `search.ts:118`, `components/content/Article.tsx:54`, `components/content/Event.tsx:34`, `articles/[year]/[month]/[slug]/page.tsx:33`).
- **Inline UI strings** — `SiteHeader`, `SiteFooter`, `search/page.tsx`, `SearchBox`, `ListingControls`, `Wordmark`, breadcrumbs. No catalog exists.

## L-mod — content-model localization pass (`isLocalized`) — DONE (Wave A)

Fields were **shared across languages** by default (no `isLocalized` anywhere), so an Arabic
version could only mirror the English value — you couldn't author distinct AR text. Fix:
`isLocalized: true` (= "Unique value per language" = `[CultureSpecific]`) on the translatable
properties, in code, then `npm run opti-push`.

**Field policy:** translate human-readable text; keep references/numbers/geo/dates/enums/URLs/
booleans/auto-derived fields **shared** (maintain once). Localized: name/title, summary/excerpt,
body/description, accolades, openingHours, amenities, highlights, Tag name/description/**synonyms**,
SiteSettings siteName/titleTagline, and SeoMetadata **metaTitle/metaDescription**. Shared: images,
area, tags, lat/long, priceBand, dates, URLs, slug, author, `searchKeywords` (auto — regenerate AR
copies in L4), `internalTitle` (editor-only). `Category` skipped (dormant/legacy).

**Two gotchas found during the push:**
1. **Adding `isLocalized` to a populated property is flagged "breaking / potential data loss" and
   needs `--force`.** The CLI can't tell the safe direction from the destructive one. Optimizely's
   semantics: **OFF→ON preserves** existing values (they become the master-language version);
   **ON→OFF deletes** them (all languages, permanent). So `--force` for OFF→ON is documented-safe —
   **never** run it in the ON→OFF direction on populated fields. Verified here: before/after counts
   identical (POI 101 / Event 20 / Area 19 / TagTerm 24 / ArticlePost 10) and sample fields intact.
2. **VB blocks/experiences don't use per-field `isLocalized` — DEFERRED to Wave B.** `HeroBanner`
   (and the other composition components) reported the breaking change and were reverted. Visual
   Builder content is localized at the **composition level**: create the language version of the
   *experience* and re-author its canvas — the inline component values are held per-language by the
   experience, not by a `[CultureSpecific]` flag on the block property. So the blocks (Hero,
   SectionHeading, RichTextBlock, SectionListing) and experiences (HomePage, section pages) stay
   un-flagged; their SEO fields still localize via the SeoMetadata contract.

**Still open after this pass:** Graph shows `ar total: 0` — the AR **content sync/index** issue is
independent of the schema and remains gated on **Settings → Languages → Apply Changes** (re-index).

## Verified AR delivery behaviour (post-enable + isLocalized)

Confirmed against Graph with the single key:
- **AR is indexed** — `_Content(locale: ar) = 180`, matching EN per type (POI 101, Event 20, Area 19,
  TagTerm 24, ArticlePost 10, HomePage 1).
- **CMS emits `/ar/`-prefixed URLs for Arabic automatically.** `_metadata.url.default` is
  `/ar/places-to-visit/…` for AR vs `/places-to-visit/…` (unprefixed) for EN. So the AR locale prefix
  already lives in the CMS URL model — **L1 routing must reconcile this**: EN needs an app-added `/en`,
  AR already carries `/ar` from the CMS. (Don't blindly strip+re-add the same way for both.)
- **English fallback is active.** Querying `locale: ar` for an untranslated item returns the **EN**
  content version (`_metadata.locale: en`) carrying the AR `/ar/…` URL — so AR pages render in English
  until translated, never blank. Good enough to ship routing before translation is complete.
- **Only the home experience is actually translated so far** — `HomePage` returns a real `locale: ar`
  version with Arabic composition (`heading: "دبي الحقيقية، بدون تزييف."`). **0 of 101 POIs** have a
  real AR version yet (all fall back to EN). Bulk translation is L6.
- **`isLocalized` is decided by RETRIEVAL, not base type (verified in the CMS).** Anything queried as
  its own content needs the flag — that includes the root-exposed shared `_component` blocks
  `ArticlePost` (title/excerpt/body = `isLocalized: true`) and `TagTerm` (name/description/synonyms =
  `true`), same as page types. **Inline VB canvas components** (`HeroBanner`, `SectionHeading`,
  `RichTextBlock`, `SectionListing`) are `isLocalized: false` and `opti-push` refuses to change that
  (breaking) — they localize via the *experience's* composition language version (the home page's
  Arabic block text proves it). So there is **no drift**: code and CMS agree on every type.

## L1 — routing + RTL shell — DONE

Every visitor page now lives under a locale prefix; `/` redirects to `/en`.

- **`src/proxy.ts`** (Next 16 renamed `middleware` → `proxy`) — redirects unprefixed paths to
  the default locale (`/` → `/en`, `/places-to-visit/x` → `/en/places-to-visit/x`) and stamps the
  active locale on an `x-locale` request header. Matcher skips `api`, `_next`, `preview`,
  `styleguide`, and file paths (`/robots.txt`).
- **`src/app/layout.tsx`** (now async) reads `x-locale` (it sits above `[locale]` and can't read the
  param) and sets `<html lang dir>` — verified `lang="en-GB" dir="ltr"` vs `lang="ar-AE" dir="rtl"`.
  Loads Noto Kufi/Sans Arabic; `globals.css` re-points `--font-display`/`--font-body` under
  `:root[dir='rtl']` so the whole RTL tree switches fonts with one attribute.
- **`src/app/[locale]/`** — home, `[...slug]`, `articles`, `search` moved under the segment;
  `[locale]/layout.tsx` 404s an unknown prefix. Content resolves by the **localized path** via
  `cmsContentPath(locale, segments)` — `getContentByPath` matches on `_metadata.url.default`, and the
  `/ar` prefix in the path is the locale signal (its options type has no `locale` field, and a raw
  Graph `_Content(where url=/ar/…)` with no locale arg resolves the item, so the path alone suffices).
- **Verified:** `/` → 307 `/en`; `/en` + `/ar` homes and `…/burj-khalifa` detail pages all 200; `/ar`
  renders RTL with real Arabic where translated (home) and EN fallback elsewhere.

**Deferred to L2/L3** (shell renders correctly meanwhile): deep loaders (`getSectionChildren`,
`getBreadcrumbs`, `getArticleBySlug`, `search`) aren't locale-threaded yet — listings/breadcrumbs on
`/ar` show EN data; nav/footer/card links (`SiteHeader`/`SiteFooter`/`SectionCard`) aren't
locale-prefixed yet, so some in-page links bounce through the `/ → /en` redirect.

## L2 — locale-aware data layer + language switcher — DONE

- **L2.1 — chrome + switcher.** `SiteHeader`/`SiteFooter`/`Wordmark` links are locale-prefixed
  (`withLocale`), so in-locale navigation stays same-direction — fixing the stale-`dir` bug (English
  page rendering RTL after soft-navigating from `/ar`). A new `LocaleSwitcher` (EN · العربية) is the
  only cross-locale jump: a **plain `<a>` (full reload)** so the root layout re-renders `<html lang dir>`
  and Arabic fonts. `proxy.ts` also stamps `x-pathname` so the switcher targets the same page.
- **L2.2 — data layer.** `locale` is threaded through `getSectionChildren`, `getTags`,
  `getBreadcrumbs`, `getArticleBySlug`, `getPlacesByKeys` — each Graph query passes
  `locale: en|ar` (and locale is folded into the `cachedGraphRead` key). `toAppPath(locale, url)`
  maps a CMS `url.default` to the locale-prefixed app path (adds `/en` for the unprefixed default
  locale, keeps `/ar`), so every card/breadcrumb/related link stays in-locale. `SectionListing`
  reads the request locale via `getRequestLocale()` (server-only `x-locale` read) because it renders
  deep in a VB composition where the route param can't be threaded. Dates format per locale.
- **Verified:** `/ar/places-to-visit` 200 with `/ar` card + breadcrumb links; `/en` gives `/en`.
- **Deferred:** search results paths + labels (that's L4, AR semantic search); UI string labels still
  English regardless of locale (L3). `src/components/content/Article.tsx` (rare composed-block path)
  still defaults to EN for related places.

## L3 — UI string catalog — DONE

The chrome the app renders itself (not CMS content) is now localized via a lightweight,
dependency-free catalog: **`src/lib/messages.ts`** — `en` is the source-of-truth shape,
`ar: Messages` forces every key, and `t(locale)` returns the whole dictionary
(`const m = t(locale); m.nav.home`; interpolated strings are functions,
`m.footer.copyright(year)`).

Localized: `SiteHeader` nav + Search + home aria; `SiteFooter` nav + tagline + disclaimer +
copyright; the `/search` page (eyebrow, prompt, powered-by, "no matches", browse links,
result count) + `SearchBox` (placeholder, button, locale-aware action); `ListingControls`
(result count, Sort, Price, Tags, Clear-all, sort labels, "Free"); breadcrumb "Home"; and
detail micro-labels on POI/Event/Area/Article (Price, Opening hours, Location, View on map,
Tickets, Places mentioned, "By …"). Detail components read the locale via `getRequestLocale()`
(they render via `OptimizelyComponent`, so no prop to thread). Dates on Event/Article now use
`formatDate(locale, …)`. Verified: `/ar` chrome renders Arabic, `/en` unchanged, build green.

**Deferred:** the `/search` example-query chips (tied to AR search behaviour → L4); AR strings
are a solid first pass — refine in-editor / via Opal.

## L4 — AR semantic search — DONE

The whole search surface is now locale-aware (`src/lib/search.ts` + `src/app/[locale]/search/page.tsx`):

- **Federated query per locale.** Each sub-query (PointOfInterest / Event / Area) now carries
  `locale: en|ar`, so ranking runs against that language's Graph index; untranslated docs still
  surface via the fallback language. `locale` is a GraphQL **enum**, so it's interpolated
  (`graphLocale(locale)`), not bound as a variable. `locale` is also folded into the
  `cachedGraphRead` key (a runtime arg), so EN and AR results cache separately.
- **Per-locale stop words.** `normalizeQuery(raw, locale)` strips `STOP_WORDS[locale]`. The English
  set no-ops on Arabic (so AR *looked* handled while noise words passed through) — Arabic gets its own
  function-word set (`في، من، على، إلى…`). The bare definite article `ال` is intentionally omitted:
  it's a **prefix** (`الشاطئ`), never a standalone token, so listing it would never match. Default arg
  is EN, so the existing `normalizeQuery` tests + callers are untouched.
- **Locale-correct output.** Result cards go through `toAppPath(locale, url)` (so an AR hit links to
  `/ar/…`, not the English page), group headings reuse the nav labels via `t(locale)` (search + menu
  never drift), the price-band "Free" meta uses `t(locale).listing.free`, dates use `htmlLang(locale)`,
  and the example-query chips are per-locale (`m.search.suggestions`).
- **Verified (curl):** `/en/search?q=skyscraper` → English labels, `/en/…` cards, "Free";
  `/ar/search?q=ناطحة سحاب` → Arabic labels (أماكن للزيارة…), `/ar/…` cards, "مجاني"; AR suggestion
  chips render + point at `/ar/search`. Tests: 9 passing (3 new AR cases); `tsc` clean.

## L5 — Localization SEO (hreflang + sitemap) — DONE

Everything a bilingual site needs for search + social to serve the right language and NOT treat
`/en/…` and `/ar/…` as duplicate content. All in `src/lib/seo.ts` + the page `generateMetadata`s +
a new `src/app/sitemap.ts`:

- **Per-page `hreflang` + canonical.** `buildContentMetadata(..., { locale, path })` now emits
  `alternates` via `localeAlternates(locale, barePath)`: a self-referencing `canonical` in the current
  locale, one `hreflang` per locale (`en-GB`, `ar-AE`), and `x-default` → the default locale. `path`
  is locale-neutral and normalized (`barePath`: strips any locale prefix + trailing slash), so callers
  pass a raw slug join and a CMS `/ar/…` url or app `/en/…` path both reduce to the same twin set.
  Wired into home, `[...slug]`, and article routes. The `noindex` `/search` page passes no `route`
  (no localized twin needed).
- **`og:locale`.** Open Graph gets `locale: ogLocale(locale)` (`en_GB`/`ar_AE` — underscore form,
  derived from the one `HTML_LANG` map so it never drifts) + the other locales as `alternateLocale`.
- **`metadataBase`.** Set in the root layout from `APPLICATION_HOST` (omitted when unset — CI/local —
  so Next emits relative URLs instead of throwing). This is what makes canonical/hreflang/OG absolute.
- **Bilingual sitemap.** `src/app/sitemap.ts` emits one entry per content path with `hreflang`
  alternates for every locale (Next renders them as `xhtml:link`); `url` doubles as `x-default`
  (default locale). Paths come from `getSitemapPaths()` (pages the CMS gives a `url.default`, paged
  through `_Content`, non-routable base types filtered) **plus** article app routes (blocks have no CMS
  URL → synthesized from `getAllArticleParams`). Gated on `APPLICATION_HOST` (hreflang URLs must be
  absolute); Graph client configured in-module like `robots.ts`. `robots.ts` still advertises it only
  when indexing is allowed (demo stays blocked by default).
- **Verified:** `/en` POI head → `canonical=/en/…`, `hreflang` en-GB/ar-AE/x-default, `og:locale
  en_GB` + alt `ar_AE`; `/ar` twin → `canonical=/ar/…`, `og:locale ar_AE` + alt `en_GB`.
  `/sitemap.xml` 200; the underlying url-exists Graph query returns **145 routable pages** (populates
  fully in prod where `APPLICATION_HOST` is set; empty-but-valid locally where it isn't). Tests: 14
  passing (5 new `localeAlternates` cases); `tsc` clean.

## L6 — bulk AR translation + operational tooling — DONE

Translation itself happens in the CMS (Opal, user-driven). What the app side owns is the **operational
tooling** to get a translated corpus live cleanly, plus the gotchas that surfaced doing it.
**Outcome:** 187 EN = 187 AR published (Graph parity), all slugs aligned (`align:ar-slugs` reports 0 to
fix), locale switch has no 404s. The 2 `ThingsToDoPage` experiences' AR slugs were corrected in the CMS
(the script skips experiences on purpose, to avoid overwriting fresher published content with a stale draft).

### Nav model is now per-language (`headerMenu` / `footerGroups`)
The header menu and footer columns are lists of inline components (`NavMenuItem` / `NavGroup`) held on
`SiteConfiguration`. A component **list is stored as one value**, so its per-language switch lives on
the **list property**, not on the nested block. `isLocalized` on `NavMenuItem.label` alone did nothing
(the CMS showed the Arabic label greyed out); the fix was `isLocalized: true` on `headerMenu` and
`footerGroups` in [`SiteSettings.tsx`](../src/components/content/SiteSettings.tsx), then
`opti-push --force` (shared→localized is breaking). After the flip, EN keeps its authored nav; the AR
version starts empty and **falls back to the built-in default nav** (`src/lib/navigation.ts`), which
is already localized via page names / the string catalog — so AR nav reads correctly with no manual
authoring. (Header item labels are `isRequired`, so there's no "empty → page name" shortcut for the top
bar; author them per language only if you want custom AR labels.)

### Scripts (both dry-run by default, idempotent — see [scripts/README.md](../scripts/README.md))
- **`npm run publish:ar`** — after translators leave AR versions as **drafts**, this discovers every
  content key via Graph and publishes each newest AR draft in one pass (`--apply`). Skips items already
  published; `--type` / `--locale` filters.
- **`npm run align:ar-slugs`** — makes each AR page's URL segment match its EN one. Run it as the
  **last step of every translation batch** (see gotcha below). Only rewrites the PUBLISHED AR version;
  unfinished translations (no published AR version, incl. VB experiences being worked on) are skipped;
  publishes a specific version id and polls for it (safe against CMA read-after-write lag). Experiences
  are skipped from the rewrite path (their composition doesn't round-trip through the properties bag) —
  set those slugs in the CMS on publish.

### Gotchas found (also in OPTIMIZELY-BEST-PRACTICES.md §12)
1. **AR URL segments auto-diverge.** Optimizely generates a translated version's `routeSegment` from
   its display name, so any hand-shortened EN slug (`dubai-mall`, `jbr`, `al-marmoom`) gets a different
   AR path (`al-marmoom--the-desert`) and 404s when the app swaps only the locale prefix. `align-ar-slugs`
   normalises them. Root cause is by design (localized URLs are a platform feature); we standardise on
   shared slugs because the routing + hreflang assume identical paths across locales.
2. **Don't machine-translate enum/select values.** Translating a VB composition turned `collection`
   `places`→`أماكن`, `source` `latest`→`أحدث`, `layout` `imageLeft`→`صورة يسارية` — all invalid, so the
   page refused to publish (`The value '…' for property 'collection' is not valid`). Enum values are
   machine tokens; scope the translation to visible text only (headings, rich text, CTA labels, meta)
   and leave selects/references/URLs untouched. Fix corrupted ones by re-selecting the dropdowns in the
   CMS to match the English page.

## Related docs
- `docs/ROADMAP.md` (Phase 3 — Localization), `docs/SPRINTS.md` (S4.5 Opal), `docs/OPTIMIZELY-RESEARCH.md:113–124` (Graph 28-language semantic support + `locale` recipe), `docs/OPTIMIZELY-BEST-PRACTICES.md:91` (`hreflang`), `docs/BLOG-PLAN.md` (#7, #10), `scripts/README.md` (script index).
