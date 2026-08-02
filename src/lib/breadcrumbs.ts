import { cache } from 'react';
import { getClient } from '@optimizely/cms-sdk';
import { cachedGraphRead } from './cache';
import { cmsContentPath, graphLocale, splitLocale, withLocale, DEFAULT_LOCALE, type Locale } from './i18n';
import { t } from './messages';

/** One breadcrumb. `url` is null for the current (last) page, which is not linked. */
export type Crumb = { name: string; url: string | null };

// Base types that exist in the tree but must never be a breadcrumb link — shared
// blocks (`_Component`: config, taxonomy) and folders (`_Folder`).
const NON_ROUTABLE = new Set(['_Component', '_Folder']);

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
  cachedGraphRead(async (currentUrl: string, locale: Locale = DEFAULT_LOCALE): Promise<Crumb[]> => {
  // Strip the locale prefix first, so ancestor computation is locale-agnostic (the AR
  // `/ar/` prefix would otherwise be mistaken for a first ancestor → a duplicate Home).
  const { path } = splitLocale(currentUrl);
  const clean = path.replace(/^\/|\/$/g, '');
  const segments = clean ? clean.split('/') : [];
  if (segments.length === 0) return [{ name: t(locale).crumbs.home, url: null }];

  // Ancestor URLs to MATCH in Graph — the CMS form (default locale unprefixed, others
  // carry their segment). App LINK urls are always prefixed (withLocale) below.
  const cmsUrls = segments.map((_, i) => cmsContentPath(locale, segments.slice(0, i + 1)));

  let byUrl = new Map<string, { displayName?: string; types?: string[] }>();
  try {
    const data = (await getClient().request(
      `query($u: [String!]!) {
        _Content(locale: ${graphLocale(locale)}, where: { _metadata: { url: { default: { in: $u } } } }) {
          items { _metadata { displayName types url { default } } }
        }
      }`,
      { u: cmsUrls },
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

  const crumbs: Crumb[] = [{ name: t(locale).crumbs.home, url: withLocale(locale, '/') }];
  segments.forEach((seg, idx) => {
    const meta = byUrl.get(cmsUrls[idx]);
    // Skip non-routable ancestors (folders never appear as breadcrumb links).
    if (meta?.types?.some((t) => NON_ROUTABLE.has(t))) return;
    const isLast = idx === segments.length - 1;
    const appUrl = withLocale(locale, `/${segments.slice(0, idx + 1).join('/')}/`);
    crumbs.push({ name: meta?.displayName || titleCase(seg), url: isLast ? null : appUrl });
  });
  return crumbs;
  }, ['breadcrumbs']),
);
