---
title: "Fast AND fresh on Optimizely SaaS + Next.js: caching Graph, on-demand revalidation, and responsive AVIF images"
status: draft
audience: Optimizely community / dev.to / LinkedIn (long-form)
author: Nikki Punjabi
tags: [optimizely, saas-cms, optimizely-graph, nextjs, core-web-vitals, performance, caching, cmp, dam]
---

> **Draft for your review.** Edit the voice/details freely before publishing. A LinkedIn variant
> can be spun off from the two "gotcha" boxes + the image size table.

> ⚠️ _Independent, unofficial learning project — not affiliated with any tourism authority or brand.
> Original wordmark and royalty-free assets only (Unsplash / Pexels), credited._

## The tension: a headless CMS is fast to build on, slow to read from

Optimizely Graph answers a trivial query in **~0.5–1s** (measured TTFB — DNS+TLS is ~50ms, so it's
service time, not the network). A single content page here makes **~9 Graph calls** —
`getContentByPath` alone is two round trips (a content-type metadata lookup, then the content query)
— which put every navigation at **~3 seconds**. Unacceptable for Core Web Vitals.

But the usual fix for that — cache aggressively — fights the reason you bought a CMS: editors expect
a publish to show up **now**, not in an hour. So the real goal is **fast *and* fresh**. Three levers
got me there, and the third is the one people always ask about: how a JPEG in the DAM becomes a tiny
AVIF sized for the phone in your hand.

## Lever 1 — Cache Graph reads across requests (not just within one)

React's `cache()` dedupes calls **within a single request**. It does nothing for the *next*
navigation. Next's `unstable_cache` persists **across** requests, so a page is slow only the first
time anyone visits it:

```ts
// src/lib/cache.ts — wrap any Graph-backed loader
export function cachedGraphRead(loader, keyParts, tags = [CACHE_TAGS.content]) {
  return unstable_cache(loader, keyParts, { revalidate: revalidateSeconds, tags });
}
```

Two design choices that matter:

- **`keyParts` must capture every argument** that changes the result — they *are* the cache key.
- **Guarded loaders cache their fallback too.** All our loaders `try/catch` and return a safe empty
  value; a cached empty result is better than hammering a struggling Graph on every request.

This alone takes navigation from ~3s to instant-after-first-visit. What it costs is freshness — which
is where lever 2 comes in.

## Lever 2 — On-demand revalidation: publish → live, no redeploy

With a time-based `revalidate` window, a publish shows up whenever the window lapses. Tolerable at 60s,
painful if you raise the TTL for speed. The fix is to **invalidate on publish** instead of on a timer,
so you can set a long TTL *and* stay instant. Every cached read is tagged (`cms-content`,
`cms-settings`), so one webhook call drops them all:

```ts
// src/app/api/revalidate/route.ts (GET or POST; secret via ?secret= or x-revalidate-secret header)
function authorized(req) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) return false;                 // fail closed: no secret → 401, never anonymous busting
  const provided = req.nextUrl.searchParams.get('secret') ?? req.headers.get('x-revalidate-secret') ?? '';
  const a = Buffer.from(provided), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);   // constant-time compare
}
// on success:
for (const tag of tags) revalidateTag(tag, 'max');
```

Point a CMS publish webhook at `https://<host>/api/revalidate?secret=<REVALIDATE_SECRET>` and you're
done — a publish purges the tag, the next request re-reads Graph once, everyone after that is instant.

### 🧩 Gotcha — Next 16 broke single-argument `revalidateTag`

On Next 16, `revalidateTag('cms-content')` still *works* but logs a deprecation warning and is going
away. The new signature is `revalidateTag(tag, profile)`, and for a publish webhook you want
**`'max'`** — "purge everything for this tag, regardless of cache-life profile." Don't reach for the
newer `updateTag`: it throws outside a Server Action, so it's unusable in a route handler. So:

```ts
revalidateTag(tag, 'max');   // ✅ route-handler-safe, purges fully
```

## Lever 3 — CMP JPEG → responsive AVIF, sized to the device

This is the question I get most: *the DAM stores a JPEG — how does the browser get a tiny WebP/AVIF?*

**The DAM does not convert anything.** CMP stores and serves the **original** — here a 2400px-wide
**JPEG, 342 KB**. The conversion happens in the **Next.js image optimizer** (running on your
server/Vercel), not in CMP. The flow:

1. Graph resolves the CMP reference to a CDN URL (`images{n}.cmp.optimizely.com/assets/<slug>.jpg/…`).
2. `next/image` doesn't load that URL directly — it rewrites it to
   `/_next/image?url=<cmp-jpeg>&w=<width>&q=75`.
3. The optimizer fetches the original **once**, resizes it to `w`, **re-encodes** it to AVIF or WebP
   based on the browser's `Accept` header, and **caches** the result. Every later request for that
   (width, format) is a cache hit.

```tsx
// src/components/media/CmsImage.tsx — the one place DAM imagery renders.
// The image reference exposes only { key, url } — no intrinsic dimensions — so we use
// `fill` inside a caller-sized box, and require a `sizes` so the browser downloads the right width.
<Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
```

Two knobs do the work:

- **`sizes` picks the width.** A card declares `sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw,
  100vw"`; the browser multiplies that by its **device pixel ratio** and asks the optimizer for the
  nearest width from Next's breakpoints (defaults: 640, 750, 828, 1080, 1200, 1920, 2048, 3840). So a
  phone fetches ~640px; a Retina desktop fetches ~1200–2048px. Nobody downloads 2400px to paint a
  360px card.
- **`formats` picks the codec.** One line — `images: { formats: ['image/avif', 'image/webp'] }` — makes
  the optimizer prefer AVIF and fall back to WebP. (Next's default is WebP-only; AVIF is opt-in.)

The measured result for that one 342 KB JPEG:

| Delivered to | Format | Bytes | vs original |
|---|---|---|---|
| CMP original (stored) | JPEG 2400px | 342 KB | — |
| Phone (~640px slot) | AVIF | **32 KB** | **−90%** |
| Desktop (~1200px slot) | AVIF | **73 KB** | **−79%** |
| AVIF-less browser | WebP | 84 KB | −75% |

The **LCP hero** on a detail page sets `priority` (skips lazy-loading, since it's above the fold);
cards omit it and lazy-load. Detail-page hero lands at **~33 KB**, DOMContentLoaded ~200 ms.

> **Note — the *first* load of each image is cold, and AVIF makes it colder.** The optimizer only
> caches *after* it has produced a variant. The first request for a given (image × width × format) must
> download the original from CMP and **re-encode** it before responding — and AVIF encoding is
> markedly heavier than WebP. Measured on this app:
>
> | Request | Cold (first ever) | Warm (cached) |
> | --- | --- | --- |
> | AVIF `w=828` | 1.59 s | 5 ms |
> | AVIF `w=2048` | 0.57 s | 6 ms |
>
> So AVIF trades a slower *first* encode for smaller bytes on every delivery — usually the right
> trade, but worth knowing.
>
> **Dev vs production:** in `next dev` the optimized-image cache doesn't survive a server restart, so
> you re-pay the cold cost after every restart (which is exactly why images feel slow on the first load
> after restarting). In production the variants persist (`images.minimumCacheTTL`), so only the **first
> visitor** of a given variant pays it and everyone else is instant. Mitigations if that first hit
> matters: keep `priority` on the LCP hero, raise `minimumCacheTTL` so variants live longer, or
> pre-warm critical images by requesting them at deploy time.

### 🧩 Gotcha — a DAM image reference has no width/height, and an unset one is *truthy*

Two traps unique to CMS image references:

- **No intrinsic dimensions.** The reference gives you `{ key, url }`, not `width`/`height`. Passing
  invented numbers to `next/image` distorts the crop; use `fill` inside a box whose aspect ratio *you*
  control (`aspect-[16/9]`, `object-cover`).
- **Unset ≠ null.** An empty reference comes back from Graph as `{ key: null, url: { default: null } }`
  — a **truthy object**. `Boolean(field)` therefore reports every blank image as "filled." Read
  `url.default` (for rendering) or `key` (for "is it set?"), never the property itself. This same bug
  had silently hidden every empty "Social share image" until I checked `key`.

## Result

- Navigation: ~3s → **instant after first visit**, and a publish is **live immediately** (webhook), so
  the cache TTL can be long without editors waiting.
- Images: a 342 KB DAM JPEG delivered as a **32 KB AVIF** on a phone — automatically, per device, with
  a WebP fallback — from a **one-line** config change plus a `sizes` string per component.

Fast and fresh, on the free tier. The pieces that made it work — `unstable_cache` + tags, a
secret-gated `revalidateTag(_, 'max')` webhook, and `next/image` doing the JPEG→AVIF resize the DAM
never has to — are all reusable on any Optimizely SaaS + Next.js build.

## Links

- Repo: _(this project)_
- Related: `src/lib/cache.ts`, `src/app/api/revalidate/route.ts`, `src/components/media/CmsImage.tsx`,
  docs/ROADMAP.md (Phase 3)
- Companion posts: **#12** getting images *into* the CMS (source → CMP upload → attach), **#06**
  semantic search, **#14** the listing engine
