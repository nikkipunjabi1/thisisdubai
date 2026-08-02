import { cache } from 'react';
import type { Metadata } from 'next';
import { getClient } from '@optimizely/cms-sdk';
import { cachedGraphRead, CACHE_TAGS } from './cache';
import {
  LOCALES,
  DEFAULT_LOCALE,
  htmlLang,
  ogLocale,
  withLocale,
  splitLocale,
  graphLocale,
  type Locale,
} from './i18n';

/**
 * Global SEO/branding settings, sourced from the CMS `SiteSettings` singleton.
 * The site name + tagline drive EVERY page's <title> via a Next.js title template,
 * so rebranding is a single CMS publish — no per-page edits. Falls back to sensible
 * defaults if the SiteSettings item isn't published yet (so titles always work).
 */
export type SiteSettings = {
  siteName: string;
  titleTagline: string;
  titleSeparator: string;
};

const DEFAULTS: SiteSettings = {
  siteName: 'This is Dubai',
  titleTagline: 'Unofficial Travel & Tourism Guide',
  titleSeparator: '|',
};

/**
 * The current site's Start Page key (the content at "/"). Site Settings lives
 * somewhere UNDER the Start Page (directly, or inside a "Settings" folder), so we
 * scope the settings lookup to that subtree — this is what makes it multisite-safe
 * (each site resolves ITS OWN settings; when the frontend becomes host-aware, "/"
 * already resolves per host). Cached per request.
 */
const getStartPageKey = cache(
  cachedGraphRead(
    async (): Promise<string | null> => {
      try {
        const content = await getClient().getContentByPath('/');
        const node = content[0] as { _metadata?: { key?: string } } | undefined;
        return node?._metadata?.key ?? null;
      } catch {
        return null;
      }
    },
    ['start-page-key'],
    [CACHE_TAGS.content],
  ),
);

export const getSiteSettings = cache(
  cachedGraphRead(
    async (): Promise<SiteSettings> => {
      try {
        const startKey = await getStartPageKey();
        // Scope Site Settings to this site's Start Page SUBTREE (best practice). We match
        // on `_metadata.path` (the ancestor chain) rather than the direct `container`, so
        // it resolves whether Site Settings sits directly under the start page or inside a
        // "Settings" folder. Falls back to an unscoped singleton lookup if "/" can't resolve.
        const data = (await getClient().request(
          startKey
            ? `query($c: String!) { SiteConfiguration(where: { _metadata: { path: { eq: $c } } }, limit: 1) { items { siteName titleTagline titleSeparator } } }`
            : `query { SiteConfiguration(limit: 1) { items { siteName titleTagline titleSeparator } } }`,
          startKey ? { c: startKey } : {},
        )) as { SiteConfiguration?: { items?: Array<Partial<SiteSettings>> } };
        const s = data?.SiteConfiguration?.items?.[0] ?? {};
        return {
          siteName: s.siteName || DEFAULTS.siteName,
          titleTagline: s.titleTagline || DEFAULTS.titleTagline,
          titleSeparator: s.titleSeparator || DEFAULTS.titleSeparator,
        };
      } catch {
        return DEFAULTS;
      }
    },
    ['site-settings'],
    [CACHE_TAGS.settings, CACHE_TAGS.content],
  ),
);

/** Next.js title template — the page title fills `%s`, e.g. "Homepage | Unofficial Travel & Tourism Guide | This is Dubai". */
export function buildTitleTemplate(s: SiteSettings): string {
  const sep = ` ${s.titleSeparator} `;
  return ['%s', s.titleTagline, s.siteName].filter(Boolean).join(sep);
}

/** Default title for pages that don't set their own (e.g. the site root). */
export function buildTitleDefault(s: SiteSettings): string {
  const sep = ` ${s.titleSeparator} `;
  return [s.siteName, s.titleTagline].filter(Boolean).join(sep);
}

/**
 * Full, explicit title for a specific page. Used by the ROOT/home page — which,
 * being the same route segment as the root layout, does NOT inherit Next's title
 * template — so we build the same "<page> | <tagline> | <site name>" string here.
 * Nested pages don't need this; they set a plain `title` and inherit the template.
 */
export function buildPageTitle(s: SiteSettings, pageTitle: string): string {
  return buildTitleTemplate(s).replace('%s', pageTitle);
}

/** The SEO fields authored on a page (from the `SeoMetadata` contract). */
export type PageSeo = {
  metaTitle?: string | null;
  metaDescription?: string | null;
  noindex?: boolean | null;
  nofollow?: boolean | null;
  /**
   * "Social share image". NOTE: an unset content reference is NOT null — Graph
   * returns `{ key: null, url: { default: null } }` — so always read `url.default`
   * rather than testing the property itself for truthiness.
   */
  ogImage?: { url?: { default?: string | null } | null } | null;
};

/**
 * Normalize a locale-neutral content path for use in `hreflang`/canonical URLs:
 * leading slash, no trailing slash (except root), and any locale prefix stripped
 * (so a CMS `/ar/…` url or an app `/en/…` path both reduce to the shared path).
 */
function barePath(path: string): string {
  const stripped = splitLocale(path.startsWith('/') ? path : `/${path}`).path;
  return stripped === '/' ? '/' : stripped.replace(/\/+$/, '');
}

/**
 * The `alternates` block for a page: a self-referencing canonical in the current
 * locale, plus one `hreflang` per locale and an `x-default` (→ the default locale).
 * Search engines use these to serve the right language and to avoid treating
 * `/en/…` and `/ar/…` as duplicate content. URLs are locale-prefixed **app** paths,
 * resolved to absolute by the root layout's `metadataBase`.
 *
 * `path` is locale-neutral (e.g. `/places-to-visit/burj-khalifa`); it's normalized
 * here, so callers can pass a raw slug join.
 */
export function localeAlternates(locale: Locale, path: string): NonNullable<Metadata['alternates']> {
  const bare = barePath(path);
  const languages: Record<string, string> = {};
  for (const loc of LOCALES) languages[htmlLang(loc)] = withLocale(loc, bare);
  languages['x-default'] = withLocale(DEFAULT_LOCALE, bare);
  return { canonical: withLocale(locale, bare), languages };
}

/**
 * Build Next.js `Metadata` for a page from its authored SEO fields + global
 * settings. `metaTitle` is the page-specific SEGMENT only (e.g. "Home"); the
 * global tagline + site name are always appended, so a rebrand stays a single
 * publish. If `metaTitle` is blank we fall back to `fallbackSegment`.
 *
 * We emit `title.absolute` (the fully composed string) rather than relying on
 * Next's title template, so it's correct on the root page too (the template
 * doesn't wrap same-route-segment routes).
 *
 * Pass `route` (the current `locale` + the locale-neutral content `path`) to emit
 * per-locale `hreflang`/canonical alternates and `og:locale` — everything a
 * bilingual page needs for search + social. Omit it for routes with no localized
 * twin (e.g. the noindex search page).
 */
export function buildContentMetadata(
  seo: PageSeo | null | undefined,
  settings: SiteSettings,
  fallbackSegment: string,
  route?: { locale: Locale; path: string },
): Metadata {
  const segment = (seo?.metaTitle ?? '').trim() || fallbackSegment;
  const title = buildPageTitle(settings, segment);
  const meta: Metadata = {
    title: { absolute: title },
  };
  if (seo?.metaDescription) meta.description = seo.metaDescription;
  if (seo?.noindex || seo?.nofollow) {
    meta.robots = { index: !seo?.noindex, follow: !seo?.nofollow };
  }
  if (route) meta.alternates = localeAlternates(route.locale, route.path);

  // Open Graph / Twitter, so the authored "Social share image" actually reaches
  // social previews (docs/SEO.md §"Non-negotiables"). Emitted even without an
  // image so shared links still carry a title + description. `og:locale` (+ the
  // other locales as `alternateLocale`) tells social platforms the language.
  const image = seo?.ogImage?.url?.default ?? undefined;
  meta.openGraph = {
    title,
    ...(seo?.metaDescription ? { description: seo.metaDescription } : {}),
    ...(image ? { images: [{ url: image }] } : {}),
    ...(route
      ? {
          locale: ogLocale(route.locale),
          alternateLocale: LOCALES.filter((l) => l !== route.locale).map(ogLocale),
        }
      : {}),
  };
  meta.twitter = {
    card: image ? 'summary_large_image' : 'summary',
    title,
    ...(seo?.metaDescription ? { description: seo.metaDescription } : {}),
    ...(image ? { images: [image] } : {}),
  };
  return meta;
}

/**
 * Every routable content path for the sitemap, as locale-neutral bare paths
 * (`/`, `/places-to-visit`, `/places-to-visit/burj-khalifa`…). Queried once in the
 * default locale — the AR twin of each is derived by `withLocale` in the sitemap,
 * since a translated page shares the same path under its `/ar` prefix.
 *
 * Pages carry a `_metadata.url.default`; we page through `_Content` collecting them
 * and drop anything non-routable (shared blocks, folders, media — they have no
 * public URL). Article BODIES are shared blocks with no CMS URL, so they're added
 * separately from their app routes. Guarded → empty list (sitemap degrades, never 500s).
 */
export const getSitemapPaths = cache(
  cachedGraphRead(
    async (): Promise<string[]> => {
      const PAGE = 100; // Graph's max limit
      const MAX_PAGES = 6; // safety cap (≤600 URLs) — well above the current corpus
      const paths = new Set<string>(['/']); // home is always present
      try {
        for (let page = 0; page < MAX_PAGES; page++) {
          const data = (await getClient().request(
            `query($skip: Int!, $limit: Int!) {
              _Content(
                locale: ${graphLocale(DEFAULT_LOCALE)},
                where: { _metadata: { url: { default: { exist: true } } } },
                skip: $skip, limit: $limit
              ) { items { _metadata { url { default } types } } }
            }`,
            { skip: page * PAGE, limit: PAGE },
          )) as {
            _Content?: {
              items?: Array<{ _metadata?: { url?: { default?: string | null } | null; types?: string[] | null } }>;
            };
          };
          const items = data?._Content?.items ?? [];
          for (const item of items) {
            const url = item._metadata?.url?.default;
            const types = item._metadata?.types ?? [];
            // Keep real pages/experiences; skip blocks, folders and media assets.
            if (!url) continue;
            if (types.some((t) => NON_SITEMAP_TYPES.has(t))) continue;
            paths.add(barePath(url));
          }
          if (items.length < PAGE) break; // last page reached
        }
      } catch {
        // fall through — return whatever we have (at least home)
      }
      return [...paths];
    },
    ['sitemap-paths'],
    [CACHE_TAGS.content],
  ),
);

/** Base types with no crawlable public URL — excluded from the sitemap. */
const NON_SITEMAP_TYPES = new Set(['_Component', '_Folder', '_Image', '_Media', '_Video']);
