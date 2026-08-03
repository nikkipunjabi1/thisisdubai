---
title: "Fast and Fresh on Optimizely SaaS + a Headless Frontend: Core Web Vitals in Practice"
status: draft
audience: Optimizely community / dev.to / LinkedIn (long-form)
author: Nikki Punjabi
tags: [optimizely, saas-cms, optimizely-graph, headless, core-web-vitals, performance, caching, images]
---

> **Draft for review.** Screenshot placeholders are marked 📷, so swap in real captures from your own
> Optimizely SaaS instance (and your browser's devtools/network panel) before publishing.

## The tension: a headless CMS is fast to build on, slow to read from

Here is a scenario every headless Optimizely team runs into. You have wired up a clean Next.js
frontend against Optimizely Graph, the content model is tidy, and then you open the network tab and
watch a single page take around **3 seconds** to render. Nothing is broken. The architecture is just
doing exactly what you told it to.

The arithmetic is unforgiving. Optimizely Graph answers a trivial query in roughly half a second to a
second of service time (I measured TTFB with DNS and TLS stripped out, so this is the service, not the
network). A typical content page doesn't make one query: it makes several. Resolving a page by path is
itself two round trips, a content-type metadata lookup followed by the content query. Add the queries
for navigation, global settings, related items, and a listing or two, and you can easily be at
**eight or nine Graph calls** for one navigation. Stack those up and you land at three seconds.

That is unacceptable for Core Web Vitals. But the obvious fix, cache aggressively, fights the reason
you bought a CMS in the first place: editors expect a publish to show up **now**, not whenever a cache
window happens to lapse. So the real goal isn't "fast." It's **fast *and* fresh**.

Three levers got me there. The first two are about content reads; the third is the one people always
ask about, namely how a large source image in the DAM becomes a tiny, correctly-sized file on the phone
in someone's hand.

📷 **[Screenshot: browser devtools network waterfall showing the stacked Graph calls for one page load, and the total time.]**

## Lever 1: cache content reads across requests, not just within one

The first trap is thinking you've already solved this. React's request-scoped memoization dedupes
identical calls **within a single render**. That's useful, but it does nothing for the *next*
navigation: every fresh request starts cold and pays the full Graph tax again.

What you want is a cache that persists **across** requests, so a given page is slow only the first time
*anyone* visits it, and instant for everyone after. In Next.js that's the persistent data cache; the
principle is the same on any headless stack. Wrap each Graph-backed loader so its result is stored and
keyed:

```ts
// Wrap any Graph-backed loader so its result persists across requests, keyed and tagged.
cachedRead(loader, keyParts, tags)
```

Two design choices matter more than the mechanism:

- **The key must capture every argument that changes the result.** The key parts *are* the cache key;
  miss one (a locale, a filter) and you'll serve one variant's data for another.
- **Cache the fallback too.** Every loader should wrap its Graph call in a try/catch and return a safe
  empty value on failure. A cached empty result is far better than hammering a struggling Graph on every
  single request while it's already having a bad day.

This alone takes navigation from around 3s to instant-after-first-visit. What it costs is freshness,
which is exactly what Lever 2 buys back.

## Lever 2: on-demand revalidation, so a publish goes live without a redeploy

With a purely time-based cache window, a publish appears whenever the window next lapses. At a 60-second
TTL that's tolerable; but if you lengthen the TTL to chase speed, editors start staring at stale pages
wondering why their change hasn't shown up.

The fix is to stop invalidating on a timer and start invalidating on the event that actually matters: a
publish. Tag every cached read by category (content, settings, and so on) and you can set a long TTL for
speed *and* still purge instantly the moment something changes. One webhook call drops every read
carrying that tag:

```ts
// On an authenticated publish webhook: purge everything tagged, fully.
for (const tag of tags) revalidateTag(tag);
```

The wiring is a small, secret-gated API route that the CMS calls on publish. Two things are
non-negotiable on that endpoint:

- **Fail closed.** If the shared secret isn't configured, return 401. Never allow anonymous cache
  busting. Compare the provided secret against the expected one in constant time so you're not leaking
  it a byte at a time through timing.
- **Prefer the secret in a header over the query string.** Secrets in URLs end up in logs.

Point a CMS publish webhook at that route, and the loop closes: a publish purges the tag, the very next
request re-reads Graph exactly once, and everyone after that is instant again.

📷 **[Screenshot: the Optimizely SaaS webhook/settings screen where the publish webhook URL is configured.]**

### 🧩 Gotcha: the revalidation signature is moving, so use the "purge everything" mode

If you're on a recent Next.js, `revalidateTag('some-tag')` with a single argument still works but logs
a deprecation warning and is on its way out. The newer signature takes a second argument, and for a
publish webhook the one you want is the mode that means "purge everything for this tag, regardless of
any cache-life profile." Resist reaching for the newer per-entry update API in a plain route handler; it
is designed for Server Actions and will throw outside one. The blunt, purge-everything call is the
route-handler-safe choice, and a publish webhook *wants* to be blunt.

The general lesson survives any specific API churn: **invalidate on the publish event, purge broadly,
and keep the invalidation call somewhere it's actually allowed to run.**

## Lever 3: a large source image becomes a tiny, device-sized one

This is the question I get most: *the DAM stores a big JPEG, so how does a phone end up downloading a
tiny AVIF?*

The key realisation is that the DAM doesn't convert anything. It stores and serves the *original*, say
a 2400px-wide JPEG weighing several hundred kilobytes. The conversion happens in your frontend's image
optimizer (running on your server or hosting platform), not in the CMS or DAM. The flow, in plain terms:

1. Graph resolves the image reference to a CDN URL pointing at the original binary.
2. Your image component doesn't load that URL directly. It rewrites the request to your optimizer,
   passing the target width and quality.
3. The optimizer fetches the original **once**, resizes it to the requested width, **re-encodes** it to
   a modern format (AVIF or WebP, chosen from the browser's `Accept` header), and **caches** the result.
   Every later request for that same width-and-format combination is a cache hit.

Two knobs do all the real work:

- **A `sizes` hint picks the width.** A card that declares something like `"(min-width:1024px) 33vw,
  (min-width:640px) 50vw, 100vw"` tells the browser how wide the image will actually paint; the browser
  multiplies that by its device pixel ratio and asks the optimizer for the nearest available width. A
  phone fetches a small variant; a Retina desktop fetches a larger one. Nobody downloads a 2400px
  original to paint a 360px-wide card.
- **A format setting picks the codec.** One line of config that prefers AVIF and falls back to WebP is
  usually all it takes. (AVIF is often opt-in, so it's worth checking your defaults.)

The measured result for one representative source image is the kind of number worth putting in a slide:

| Delivered to | Format | Bytes | vs original |
|---|---|---|---|
| DAM original (stored) | JPEG ~2400px | ~342 KB | (baseline) |
| Phone (~640px slot) | AVIF | **~32 KB** | **−90%** |
| Desktop (~1200px slot) | AVIF | **~73 KB** | **−79%** |
| AVIF-less browser | WebP | ~84 KB | −75% |

One more detail earns its keep: mark the above-the-fold hero image as high-priority so it skips
lazy-loading, and let everything below the fold lazy-load. That single distinction is often the
difference between a good and a poor Largest Contentful Paint.

📷 **[Screenshot: browser devtools network panel showing the same image requested at two widths and two formats, the tiny AVIF next to the large original.]**

### 🧩 Gotcha: the first load of each image is cold, and AVIF makes it colder

The optimizer only caches *after* it has produced a variant. The very first request for a given (image
× width × format) has to download the original from the DAM and re-encode it before it can respond, and
AVIF encoding is markedly heavier than WebP. I measured cold first-encodes of a second or more, against
warm cache hits of a few milliseconds.

So AVIF trades a slower *first* encode for smaller bytes on every subsequent delivery: usually the right
trade, but worth knowing. The nuance to internalise: in development the optimized-image cache often
doesn't survive a server restart, so you re-pay that cold cost constantly and images feel slow. In
production the variants persist, so only the *first visitor* of each variant pays, and everyone else is
instant. If that first hit matters, keep the hero high-priority, raise the cache lifetime so variants
live longer, or pre-warm your critical images at deploy time.

### 🧩 Gotcha: editing an image in place doesn't refresh, and the publish webhook won't save you

Here's one that cost me an afternoon. Crop or replace an image *in the DAM* and the site keeps serving
the old one; a server restart looks like the only cure. Two facts explain it:

- **The DAM URL is keyed on the asset ID, not a content hash.** An in-place edit reuses the *exact same
  URL*, so nothing downstream has any reason to think the bytes changed.
- **The optimizer caches by URL for a long default window** (often hours), and it tends to *override*
  the DAM's own cache headers within that window. Restarting "fixes" it only because it wipes the
  optimizer's on-disk image cache.

The subtle part: your publish webhook from Lever 2 does **not** help here. That clears the *content*
cache (the URL string) and the URL didn't change. The image-optimizer cache is a completely separate
layer.

The DAM usually *does* ship a changing ETag when the asset is modified; it's asking caches to
revalidate, and the optimizer just isn't listening inside its TTL window. So the pragmatic fix is to
shorten the optimizer's minimum cache window so it revalidates against that ETag; an unchanged image
then refreshes cheaply (no re-encode) and only a genuinely edited one is re-fetched. If you'd rather
have *instant* pickup and skip the shorter window entirely, publish the crop as a **new asset** (new ID,
new URL, fresh everywhere), which is how immutable-URL CDNs are meant to be used, and which your publish
webhook *does* make instant because the reference itself changes.

### 🧩 Gotcha: an image reference has no dimensions, and an unset one is *truthy*

Two traps are unique to CMS image references, and both bite quietly:

- **No intrinsic dimensions.** A CMS image reference typically gives you a key and a URL, not a width
  and height. Feeding invented numbers to an image component distorts the crop. Render it into a box
  whose aspect ratio *you* control (a fixed ratio plus a cover fit), rather than trusting dimensions
  that aren't there.
- **Unset is not null.** An empty image reference often comes back not as `null` but as an object with
  null fields inside it, which means a naive truthiness check reports every *blank* image as "filled."
  Read the actual key or URL field to decide whether an image is set; never test the reference object
  itself. This exact bug had silently hidden every empty social-share image on my site until I checked
  the key.

## The result

- **Navigation:** around 3s down to instant after the first visit, with a publish going live
  immediately via the webhook, so the cache TTL can be long *without* editors ever waiting on stale
  content.
- **Images:** a several-hundred-KB source JPEG delivered as a roughly **32 KB AVIF** on a phone,
  automatically, per device, with a WebP fallback, from essentially one line of config plus a `sizes`
  hint per component.

Fast and fresh, and none of it requires a premium tier. The three pieces that made it work (a
cross-request content cache with tags, a secret-gated purge-on-publish webhook, and an image optimizer
doing the resize-and-re-encode the DAM never has to) are all reusable on any Optimizely SaaS project
with a headless frontend.

## Closing thoughts

The thing I'd tell my past self is that "fast" and "fresh" only *feel* like opposites. The moment you
stop invalidating on a timer and start invalidating on the publish event, you can be aggressive about
caching without ever lying to an editor about whether their change went live. Everything else is
plumbing.

I'd love to hear how other teams have balanced this, especially how you handle the cold-image-encode
problem on a large content set, and whether you pre-warm, lengthen cache lifetimes, or just accept the
first-visitor cost. What worked on your build?

## Related reading

- **Diagnosing Optimizely Graph performance**: when slow navigations and a green build hide pages that
  struggle in production.
- **From CMP/DAM to Optimizely SaaS CMS: a bulk imagery pipeline**: getting the binaries *into* the CMS
  at scale in the first place.
- **Semantic search with Optimizely Graph**: a practical guide.
- For the exact, current APIs behind the caching and image behaviour described here, see the official
  Optimizely SaaS CMS documentation.

---

_Have a correction or a better way to frame any of this? Reach out, I keep these posts updated as the
platform evolves._
