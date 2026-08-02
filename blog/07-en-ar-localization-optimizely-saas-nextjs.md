---
title: "Localizing an Optimizely SaaS + Next.js site to Arabic: the five gotchas nobody warns you about"
status: draft
audience: Optimizely community / dev.to / LinkedIn (long-form)
author: Nikki Punjabi
tags: [optimizely, saas-cms, optimizely-graph, nextjs, localization, i18n, arabic, rtl, app-router]
---

> **Draft for review.** The sequel (**#7b**) covers Arabic *semantic search* once that ships;
> this post is the foundation — enabling the language, modelling for translation, and routing/RTL.

> ⚠️ _Independent, unofficial learning project — not affiliated with any tourism authority or brand.
> Original wordmark and royalty-free assets only (Unsplash / Pexels), credited._

## The goal

Take an English-only Optimizely SaaS CMS + Next.js App Router site and add **Arabic** — real
per-language content, `/en/…` and `/ar/…` URLs, right-to-left layout — without breaking the English
site or losing a single field of the ~250-item corpus. Simple enough on paper. In practice, five
things bit hard enough to be worth writing down.

## Gotcha 1 — Enabling a language doesn't put its content in Graph

You enable Arabic in **Settings → Languages**, publish an Arabic version of a page, and query Graph:

```graphql
{ _Content(locale: ar) { total } }   # → 0
```

Zero. The *schema* updated (Graph's `Locales` enum now lists `ar`), but **no Arabic content is
indexed**. The reason: CMS (SaaS) syncs to Graph with an **hourly delta** plus a **manual full sync**,
and a newly-enabled language is **not** backfilled by the delta. Per Optimizely's docs you must
*"re-run the Content Synchronization job to resynchronize contents in the language that has just been
enabled."* The trigger that actually does it is **Apply Changes** on the Languages page (and/or a
**Smooth Rebuild** → *Promote*). The content-sync job alone won't touch a language-config change.

**Tell:** the `Locales` enum shows `ar`, but `_Content(locale: ar).total` stays `0`. That's a sync
gap, not lag, and not your app.

## Gotcha 2 — Every field is *shared across languages* until you say otherwise

Create the Arabic version, type an Arabic title… and it changes the English one too. Because in
Optimizely a property is **shared across languages** unless it's marked **"Unique value per language"**
(`[CultureSpecific]`, the SDK's `isLocalized: true`). A site built English-first has this on **nothing**
— so an Arabic "version" can only mirror English.

The fix is a content-model pass: `isLocalized: true` on the *translatable* fields (name, summary,
body, SEO title/description, tag synonyms…) and **leave everything else shared** (references, geo,
prices, dates, URLs, slugs — you maintain those once):

```ts
summary: { type: 'string', displayName: 'Summary', indexingType: 'searchable', isLocalized: true },
latitude: { type: 'float', displayName: 'Latitude' /* shared — a number is a number */ },
```

**The dangerous half:** pushing this to a populated content type is flagged *"breaking — potential
data loss"* and needs `--force`. Direction is everything:

- **OFF → ON** (what you want): **preserves** existing values — English becomes the English version.
- **ON → OFF**: *"existing values are deleted"* — permanently, all languages.

The CLI can't tell the two apart, so it warns on both. OFF→ON with `--force` is safe — but snapshot
your counts before and after anyway. (I did; 101 POIs / 20 events / 19 areas, byte-identical after.)

## Gotcha 3 — "block" isn't the deciding factor — *how the block is used* is

Blocks are `_component` types, but they split into two groups that localize completely differently.
Getting this wrong is easy, because the intuitive rule ("blocks don't need the flag") is only *half*
right.

**Blocks queried as their own content DO need "Unique value per language."** A shared block that Graph
treats as a root type — here **`ArticlePost`** (articles) and **`TagTerm`** (taxonomy), both exposed
via `compositionBehaviors` and fetched directly — has its own content item with language versions,
exactly like a page. So its translatable fields (`title`, `excerpt`, `body`, tag `name`/`synonyms`…)
need `isLocalized: true` — set it in code and `--force` it through, same as a page type. Verified in
the CMS: `ArticlePost.title` and `TagTerm.name` are `isLocalized: true`.

**Inline Visual Builder canvas components do NOT — and the CMS won't let you.** The blocks you *drop
on an experience's canvas* — Hero, Section Heading, Rich Text, Section Listing — are a different
story. Add `isLocalized` to them and `opti-push` reports a **breaking change** it refuses to apply.
That's correct: their values live inside the **experience's composition**, which is itself
language-versioned. You translate them by creating the language version of the *experience* and
re-authoring its canvas — there's no per-field flag (the CMS keeps them `isLocalized: false`). Proof
from Graph, with the block property flags still `false`:

```json
{ "_metadata": { "locale": "ar" },
  "composition": { "nodes": [ { "component": { "heading": "دبي الحقيقية، بدون تزييف." } } ] } }
```

So the real rule is about **retrieval, not the base type**: anything you query as its own content
(pages *and* root-exposed shared blocks like `ArticlePost`/`TagTerm`) needs `isLocalized`; anything
that only exists as an inline node inside an experience's composition does not.

## Gotcha 4 — The CMS gives non-default locales a URL prefix; the default gets none

Check `_metadata.url.default` per locale and a pattern emerges:

| | Home | A place |
| --- | --- | --- |
| **en** (master) | `/` | `/places-to-visit/burj-khalifa/` |
| **ar** | `/ar/` | `/ar/places-to-visit/burj-khalifa/` |

The **master language is unprefixed**; every other locale carries its segment. This shapes routing:
if you want `/en/…` *and* `/ar/…` (both prefixed) in the app, English needs an **app-added** `/en`
while Arabic already carries `/ar` from the CMS. So the app→CMS path mapping is asymmetric — strip
the prefix for the default locale, keep it otherwise:

```ts
// default locale is unprefixed in the CMS; others carry their segment
export function cmsContentPath(locale, segments) {
  const body = segments.filter(Boolean).join('/');
  const tail = body ? `${body}/` : '';
  return locale === DEFAULT_LOCALE ? `/${tail}` : `/${locale}/${tail}`;
}
```

Bonus: `getContentByPath(path)` matches on `url.default` and takes **no locale argument** — the `/ar`
in the path *is* the locale signal. A raw `_Content(where: { url: { default: { eq: "/ar/…" } } })`
with no `locale:` arg resolves the item, so the localized path alone is enough.

## Gotcha 5 — The App Router root layout can't read `[locale]` (and Next 16 renamed middleware)

You want `<html lang dir>` to flip per locale. But the **root `app/layout.tsx` sits above the
`[locale]` segment**, so it never receives the param. The clean fix: let the request-time hook detect
the locale from the path and pass it down as a header the root layout reads.

```ts
// src/proxy.ts  — Next 16 renamed the `middleware` file convention to `proxy`
export function proxy(req: NextRequest) {
  const first = req.nextUrl.pathname.split('/')[1];
  if (isLocale(first)) {
    const headers = new Headers(req.headers);
    headers.set('x-locale', first);               // hand the locale to the root layout
    return NextResponse.next({ request: { headers } });
  }
  const url = req.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${req.nextUrl.pathname === '/' ? '' : req.nextUrl.pathname}`;
  return NextResponse.redirect(url);              // `/` → `/en`, `/x` → `/en/x`
}
```

```tsx
// app/layout.tsx (now async)
const locale = isLocale((await headers()).get('x-locale')) ? … : DEFAULT_LOCALE;
return <html lang={htmlLang(locale)} dir={dir(locale)} …>
```

RTL font switching is then a **one-attribute** trick — re-point the font tokens under `dir=rtl`
instead of touching every component:

```css
:root[dir='rtl'] {
  --font-display: var(--font-arabic-display), var(--font-fraunces), serif;
  --font-body: var(--font-arabic-body), var(--font-hanken), sans-serif;
}
```

One more, free of charge: a big App Router route move (deleting `app/page.tsx`, adding `app/[locale]/`)
can panic Turbopack's HMR (*"AppPageLoaderTree no longer exists"*). It's a stale-cache bug — `rm -rf
.next` and restart, not a code error.

## The bigger lesson: start i18n-ready even if you launch in one language

Everything above was a **retrofit** — bolting Arabic onto a site already ~50% built in English.
That's where the cost lives. The language *itself* is cheap to add whenever (a settings toggle + a
sync). What's expensive is retrofitting the **structure** onto populated data and shipped routes.

So the split that matters, when you start any new Optimizely SaaS + Next.js project:

**Structure on day 1 — painful to retrofit (do it even with one active locale):**

1. **Mark translatable fields `isLocalized: true` in the content model.** Retrofitting is a schema
   migration the CLI flags as *data loss* and forces across every populated item (Gotcha 2). Setting
   it up front costs nothing.
2. **Build the `[locale]` route segment + proxy** with just your default locale. Retrofitting means
   *moving every route* (deleting `app/page.tsx`, re-nesting `[...slug]`, articles, search…).
3. **Route internal links through a `withLocale()` helper** — never hardcode `/places-to-visit`.
   Retrofitting means touching *every* link (and until you do, on-locale nav leaks to the default
   locale and you get English-in-RTL).
4. **Centralize UI strings in a catalog** from the start — so adding a language is *data*, not a code
   refactor.
5. **Make `<html lang dir>` dynamic and write RTL-safe CSS** — logical properties (`margin-inline`,
   `text-align: start`), not `left`/`right`. Otherwise RTL is an audit later, not a flag flip.
6. **Locale-aware `Intl` date/number formatting** (not hardcoded `en-GB`), and **locale in cache keys.**

**Cheap to defer — it's content, not structure:** enabling the second language, authoring the
translations, configuring fallback, semantic search in the new language.

None of the day-1 items slow down a single-language launch. All of them save you a forced, data-loss-
flagged migration later. If there's one line to remember: **structure for multi-locale up front; defer
the content.**

## The recipe: turning on per-language fields (in code, one command)

Because content types here are defined in **code** (the SDK's `contentType({...})`), "Unique value per
language" is just a property flag — `isLocalized: true`. You set it on the translatable fields and
push; there's no per-field clicking in the CMS UI, and it applies uniformly to every page type **and**
every root-exposed shared block (`ArticlePost`, `TagTerm`). Localize the human-readable text; leave
structure shared:

```ts
export const HotelContentType = contentType({
  key: 'Hotel',
  baseType: '_page',
  extends: SeoMetadataContract,          // metaTitle/metaDescription localized ONCE, for every type
  properties: {
    name:       { type: 'string',   isLocalized: true, /* … */ },
    summary:    { type: 'string',   isLocalized: true },
    body:       { type: 'richText', isLocalized: true },
    amenities:  { type: 'array', items: { type: 'string' }, isLocalized: true },
    // shared — a number / reference / URL is the same in every language, maintain it once:
    starRating: { type: 'integer' },
    priceBand:  { type: 'string', format: 'selectOne', /* … */ },
    latitude:   { type: 'float' },
    longitude:  { type: 'float' },
    area:       { type: 'contentReference', /* … */ },
    images:     { type: 'array', items: { type: 'contentReference', /* … */ } },
    bookingUrl: { type: 'url' },
  },
});
```

One command syncs the whole model to the CMS:

```bash
npm run opti-push          # → optimizely-cms-cli config push optimizely.config.mjs
```

**Starting a new (multi-site / multi-locale) project? Do this on day 1, before there's content** — the
push is then a clean create, no warnings, and every language you enable later "just works." **Retrofitting
onto a type that already has data** (our case) trips the data-loss guard, so add `--force` — safe here
because OFF→ON *preserves* existing values (Gotcha 2), but snapshot your counts first:

```bash
npm run opti-push -- --force
```

**What to flag vs leave shared** — the split that saved us re-entering the same data in every language:

| `isLocalized: true` (translate) | Left shared (no flag) — and why |
|---|---|
| name / title, summary / excerpt, body | canonicalUrl, ogImage — not language-specific |
| SEO metaTitle / metaDescription (on the shared contract) | **slug** — the URL / filter key; forking it splits routing |
| accolades, amenities, highlights (human text) | references (images, area, tags, related) — maintain once |
| Tag name / description / **synonyms** (AR search needs its own) | numbers & geo (starRating, lat/long), enums (priceBand) |
| | dates (publishDate), URLs (bookingUrl), booleans (noindex) |
| | author (a proper noun), searchKeywords (auto-derived from tags) |

Two multipliers: putting `isLocalized` on the shared **`SeoMetadata` contract** localizes the SEO
title/description for *every* type that extends it, in one edit; and inline VB canvas blocks (Hero,
headings) need none of this — they localize via the experience's composition (Gotcha 3).

## Result

`/` → `/en`; `/en` and `/ar` both render; `<html>` is `lang="en-GB" dir="ltr"` vs
`lang="ar-AE" dir="rtl"`; Arabic pages show real Arabic where translated and **fall back to English**
(Graph delivery honours the fallback language) everywhere else — so the site is shippable long before
every item is translated. Bulk translation (via Opal) and Arabic *semantic search* are the next posts.

## Links
- Repo: _(this project)_
- Related: `src/proxy.ts`, `src/app/[locale]/`, `src/lib/i18n.ts`, `docs/LOCALIZATION.md`
- Companion posts: **#8** Core Web Vitals (caching + AVIF), **#6** semantic search, **#7b** Arabic
  semantic search (coming with L4)
