import { cache } from 'react';
import { getClient } from '@optimizely/cms-sdk';
import { cachedGraphRead } from './cache';

/** One breadcrumb. `url` is null for the current (last) page, which is not linked. */
export type Crumb = { name: string; url: string | null };

// Types that exist in the tree but must never be a breadcrumb link (folders, config).
const NON_ROUTABLE = new Set(['SiteSettings', 'Tag', 'Folder', '_Folder']);

/**
 * Build the breadcrumb trail for a page from the CMS content tree — the canonical,
 * data-driven trail used by EVERY listing + detail page (addresses the "no way back
 * to Home" gap). We resolve each ancestor by its cumulative URL in ONE Graph query,
 * so it works at any depth and always reflects the tree the authors manage.
 *
 * `Home` is always the first crumb; the current page is the last and is not linked.
 * Falls back to the URL segment (title-cased) if an ancestor can't be resolved, so a
 * trail always renders.
 */
export const getBreadcrumbs = cache(
  cachedGraphRead(async (currentUrl: string): Promise<Crumb[]> => {
  const clean = currentUrl.replace(/^\/|\/$/g, '');
  const segments = clean ? clean.split('/') : [];
  if (segments.length === 0) return [{ name: 'Home', url: null }];

  // Cumulative ancestor URLs: "/a/", "/a/b/", … (Graph stores a trailing slash).
  const urls = segments.map((_, i) => `/${segments.slice(0, i + 1).join('/')}/`);

  let byUrl = new Map<string, { displayName?: string; types?: string[] }>();
  try {
    const data = (await getClient().request(
      `query($u: [String!]!) {
        _Content(where: { _metadata: { url: { default: { in: $u } } } }) {
          items { _metadata { displayName types url { default } } }
        }
      }`,
      { u: urls },
    )) as { _Content?: { items?: Array<{ _metadata?: { displayName?: string; types?: string[]; url?: { default?: string } } }> } };
    byUrl = new Map(
      (data?._Content?.items ?? [])
        .filter((i) => i._metadata?.url?.default)
        .map((i) => [i._metadata!.url!.default as string, i._metadata!]),
    );
  } catch {
    // Network/Graph error → fall back to segment labels below.
  }

  const titleCase = (seg: string) => seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const crumbs: Crumb[] = [{ name: 'Home', url: '/' }];
  urls.forEach((u, idx) => {
    const meta = byUrl.get(u);
    // Skip non-routable ancestors (folders never appear as breadcrumb links).
    if (meta?.types?.some((t) => NON_ROUTABLE.has(t))) return;
    const isLast = idx === urls.length - 1;
    crumbs.push({ name: meta?.displayName || titleCase(segments[idx]), url: isLast ? null : u });
  });
  return crumbs;
  }, ['breadcrumbs']),
);
