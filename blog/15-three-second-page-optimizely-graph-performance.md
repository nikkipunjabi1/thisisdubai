---
title: "The Three-Second Page: Diagnosing Optimizely Graph Performance in Next.js (and the 500 My Build Didn't Catch)"
status: draft
audience: Optimizely community / dev.to / LinkedIn (long-form)
author: Nikki Punjabi
tags: [optimizely, saas-cms, optimizely-graph, nextjs, performance, caching, unstable_cache, app-router]
---

> **Draft for your review.** Edit the voice/details freely before publishing. The "my build said
> success while every page 500'd" section works well as a standalone LinkedIn post.

> ⚠️ _Independent, unofficial learning project — not affiliated with any tourism authority or brand.
> Original wordmark and royalty-free assets only._

## The symptom

My site had grown nicely: Visual Builder listing pages, breadcrumbs, CMS-driven site settings,
semantic search. Then I clicked a link in the main navigation and waited. And waited. Next.js's
little "Rendering" indicator sat in the corner for **about three seconds**, on every single
navigation.

Nothing about the page looked expensive. The content is tiny — ten places, three events, three
neighbourhoods. So where were three seconds going?

The answer turned out to be two completely separate problems, and finding the second one was a
genuine "oh no" moment.

## Step one: measure the thing itself, not your feelings about it

My first instinct was "Graph must be slow." That's a hypothesis, not a measurement, so I timed a
deliberately trivial query — one item, one field:

```graphql
query { PointOfInterest(limit: 1) { items { name } } }
```

```
dns=0.002s  connect=0.018s  tls=0.047s  ttfb=1.005s  total=1.006s
```

That breakdown is the whole story. DNS, TCP and TLS together are **under 50ms** — the network is
fine, and this isn't a geography problem. But **time-to-first-byte is a full second**. That's
Optimizely Graph's own service time for a query that could not be smaller.

Across many samples, Graph answered in **0.44s–1.05s**. So the currency I had to budget in wasn't
bytes or query complexity. It was **round trips**.

## Step two: count the round trips (there were about nine)

Once you know each call costs ~½–1 second, the page's shape matters enormously. Here's what one
listing page was actually doing:

1. `getContentByPath(path)` — the page content
2. `getContentByPath('/')` — resolve the start page, to scope site settings
3. `SiteConfiguration` — the site settings singleton (brand, title template)
4. `_Content` — resolve breadcrumb ancestors
5. `_Page` — detect the section's child type
6. `PointOfInterest` — the actual listing query
7. `TagTerm` — the tag vocabulary for the filter UI

And a detail that surprised me: **`getContentByPath` is not one request.** The SDK first fetches
content-type metadata, *then* issues the real content query. So calls 1 and 2 are two round trips
each. That's **nine**, most of them one after another.

Nine sequential half-second calls is a three-second page. Mystery solved — and notice that no
individual piece of code was doing anything unreasonable. This is an emergent problem.

## Fix one: `cache()` is not the cache you think it is

I already had React's `cache()` wrapped around every one of these loaders, and I'd been quietly
assuming that was my caching story. It isn't.

**`cache()` from React dedupes within a single request.** If two components ask for site settings
while rendering one page, Graph is hit once. That's genuinely useful — and it does *nothing* for
the next navigation. Every new request starts with a cold slate, and pays all nine calls again.

What I actually needed was a cache that survives **across** requests — `unstable_cache`:

```ts
import { unstable_cache } from 'next/cache';

export const CACHE_TAGS = { content: 'cms-content', settings: 'cms-settings' } as const;

export function cachedGraphRead<Args extends unknown[], Result>(
  loader: (...args: Args) => Promise<Result>,
  keyParts: string[],
  tags: string[] = [CACHE_TAGS.content],
) {
  return unstable_cache(loader, keyParts, { revalidate: 60, tags });
}
```

Then each loader gets both layers — `cache()` outside for per-request dedupe, `cachedGraphRead`
inside for cross-request reuse:

```ts
const getByPath = cache(
  cachedGraphRead((path: string) => getClient().getContentByPath(path), ['content-by-path']),
);
```

Published content changes rarely, so this is a sound trade: a short revalidate window keeps things
fresh, and the **tags** mean a publish webhook can invalidate everything in one `revalidateTag`
call once that's wired up.

One rule worth stating explicitly: **preview and draft rendering must never go through this.**
Draft content is request-specific by definition. My `/preview` route uses a different SDK call and
deliberately bypasses the cache entirely.

## Fix two: parallelise what was never sequential to begin with

Caching helps the *second* visitor. The first still pays. So I looked at what was needlessly
chained, and found two waterfalls that existed purely because I'd written `await` twice in a row:

```ts
// Before — breadcrumbs waited on content for no reason
const content = await getByPath(path);
const crumbs  = await getBreadcrumbs(path);

// After
const [content, crumbs] = await Promise.all([getByPath(path), getBreadcrumbs(path)]);
```

Same in the listing block, where the tag vocabulary was waiting on the children query despite not
depending on it. Two `Promise.all`s, two fewer seconds on a cold render.

## Fix three: the production 500 my build reported as a success

Here's the part I didn't see coming.

While benchmarking I built for production and measured `/places-to-visit` at 3.2 seconds. Later,
almost by accident, I printed the **status code** alongside the timing:

```
/                                status=200 time=0.002s
/places-to-visit                 status=500 time=0.446s
/places-to-visit/burj-khalifa    status=500 time=0.605s
```

**Every CMS page in production was returning HTTP 500.** And this had nothing to do with my
caching work — I checked out clean `main` and reproduced it there too. Production had been broken
for a while.

The log said:

```
digest: 'DYNAMIC_SERVER_USAGE'
```

The cause: my catch-all route reads `searchParams` — that's how the listing engine gets `?page`,
`?sort` and `?tag` — while also exporting `generateStaticParams`. Next.js therefore still attempted
to prerender the route, hit request-time data, and the bailout surfaced as a server error.

The fix is one line, stating what was already true:

```ts
// This route reads searchParams, so it is request-time by nature.
export const dynamic = 'force-dynamic';
```

The performance then comes from **data** caching rather than route caching — which is exactly what
fix one and two were for.

What makes this worth writing up isn't the fix, it's the failure mode:

- `next build` reported **success**
- `next dev` worked **perfectly**
- only a production *runtime* request failed

If you have a catch-all content route that reads `searchParams`, go and check a production build
right now. I'll wait.

## The lesson that cost me the most: a 500 is fast

My original "3.2 second baseline" was partly **measuring error pages**. Errors return quickly.
They look like perfectly reasonable numbers in a timing column. I spent real effort optimising
against a baseline that was partly fiction, and I only caught it because I eventually printed
status codes next to the times.

So: **assert correctness in your benchmark, not just latency.** Every performance check I run now
prints the status code and greps for a known string from the page. If your "after" number is
wonderful, confirm the page still contains its content before celebrating.

(A related trap from the same session: I started a second server on a port the first one still
held, `EADDRINUSE`'d, didn't notice, and measured the *old* process against a rebuilt `.next`. If
a result looks too good, verify you're measuring what you think you are.)

## The numbers

Production build, all responses verified 200 and content-checked:

| | Before | After (cold) | After (warm) |
|---|---|---|---|
| `/places-to-visit` | 500 / ~3s | 1.36s | **12ms** |
| `/neighbourhoods` | 500 / ~3s | 0.46s | **9ms** |
| Detail page | 500 / ~3s | 0.58s | **6ms** |

And the thing I actually noticed in the first place — the RSC payload Next fetches on a nav click —
went from ~3s to **17–55ms**.

## What I'd tell past me

1. **Budget round trips, not payload size.** If your CMS API costs ~1s a call, architecture is
   about *how many times you ask*, not how much you fetch.
2. **Know which cache you're using.** React `cache()` = one request. `unstable_cache` = across
   requests. They solve different problems and it's easy to think you have the second when you
   only have the first.
3. **`await` twice in a row is a decision.** Ask whether the second call truly needs the first.
4. **A green build is not a working site.** Check a production build's runtime, not just its exit
   code.
5. **Benchmarks must assert correctness**, or you will eventually optimise an error page.

## What's next

The cache window is currently time-based (60s), which means an author publishes and waits up to a
minute. The tags are already in place, so the proper fix is wiring Optimizely Graph's publish
webhook to `revalidateTag` — instant invalidation, no polling, and no stale content. That's the
next post.

_Repo: github.com/nikkipunjabi1/thisisdubai — built in the open toward Optimizely MVP._
