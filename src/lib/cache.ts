import { unstable_cache } from 'next/cache';

/**
 * Cross-request caching for Optimizely Graph reads.
 *
 * Why this exists: Graph answers in ~0.5–1s even for a trivial query (measured
 * TTFB; DNS+TLS is ~50ms, so it's service time, not network). A single content
 * page makes ~9 Graph calls — `getContentByPath` alone costs two round trips (a
 * metadata lookup, then the content query) — which put every page navigation at
 * ~3s. React's `cache()` only dedupes WITHIN one request, so it doesn't help the
 * next navigation.
 *
 * `unstable_cache` persists across requests, so a page is only slow the first
 * time anyone visits it. Published content changes rarely, so this is the right
 * trade: correctness is preserved by a short revalidate window, and made instant
 * by the publish webhook at `src/app/api/revalidate/route.ts`, which calls
 * `revalidateTag` on these tags (configure the CMS webhook → GRAPH_CACHE_SECONDS
 * can then be raised freely). See docs/ARCHITECTURE.md §11.
 *
 * NOTE: preview/draft rendering must never be cached — it uses
 * `getPreviewContent` in src/app/preview/page.tsx and deliberately doesn't go
 * through here.
 */

/** Tags let the publish webhook drop everything in one call. */
export const CACHE_TAGS = {
  content: 'cms-content',
  settings: 'cms-settings',
} as const;

/**
 * How long cached Graph reads stay fresh (seconds). Short by default so authors
 * see published changes quickly while we don't yet have webhook revalidation;
 * raise it once the webhook lands. Override with GRAPH_CACHE_SECONDS.
 */
const DEFAULT_REVALIDATE = 60;

export const revalidateSeconds = (() => {
  const raw = Number.parseInt(process.env.GRAPH_CACHE_SECONDS ?? '', 10);
  return Number.isFinite(raw) && raw >= 0 ? raw : DEFAULT_REVALIDATE;
})();

/**
 * Wrap a Graph-backed loader so its result is reused across requests.
 *
 * `keyParts` must capture every argument that changes the result — they become
 * the cache key. Guarded loaders (ours all catch and return a fallback) will
 * cache their fallback too, which is why callers keep their try/catch: a cached
 * empty result is preferable to hammering a struggling Graph on every request.
 */
export function cachedGraphRead<Args extends unknown[], Result>(
  loader: (...args: Args) => Promise<Result>,
  keyParts: string[],
  tags: string[] = [CACHE_TAGS.content],
): (...args: Args) => Promise<Result> {
  return unstable_cache(loader, keyParts, { revalidate: revalidateSeconds, tags });
}
