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

## Gotcha 3 — Visual Builder blocks localize *differently* — don't force `isLocalized` on them

Try that same `isLocalized` pass on your VB blocks (Hero, Section Heading, Rich Text) and the push
reports a **breaking change** it won't apply. That's the CMS telling you something real: **Visual
Builder content is localized at the *composition* level, not per field.** You create the language
version of the *experience* and re-author its canvas; the inline component values are held
per-language by the experience — there's no `[CultureSpecific]` flag to set on a block property.

Proof from Graph after translating the home experience's Arabic canvas:

```json
{ "_metadata": { "locale": "ar" },
  "composition": { "nodes": [ { "component": { "heading": "دبي الحقيقية، بدون تزييف." } } ] } }
```

So: `isLocalized` on **standalone content types** (POI, Event, Article, Hotel, Tag, SEO contract);
**nothing** on VB blocks/experiences — translate those by authoring the language version.

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
