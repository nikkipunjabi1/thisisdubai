import { cache } from 'react';
import type { Metadata } from 'next';
import { getClient } from '@optimizely/cms-sdk';
import { cachedGraphRead, CACHE_TAGS } from './cache';

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
 * Build Next.js `Metadata` for a page from its authored SEO fields + global
 * settings. `metaTitle` is the page-specific SEGMENT only (e.g. "Home"); the
 * global tagline + site name are always appended, so a rebrand stays a single
 * publish. If `metaTitle` is blank we fall back to `fallbackSegment`.
 *
 * We emit `title.absolute` (the fully composed string) rather than relying on
 * Next's title template, so it's correct on the root page too (the template
 * doesn't wrap same-route-segment routes).
 */
export function buildContentMetadata(
  seo: PageSeo | null | undefined,
  settings: SiteSettings,
  fallbackSegment: string,
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

  // Open Graph / Twitter, so the authored "Social share image" actually reaches
  // social previews (docs/SEO.md §"Non-negotiables"). Emitted even without an
  // image so shared links still carry a title + description.
  const image = seo?.ogImage?.url?.default ?? undefined;
  meta.openGraph = {
    title,
    ...(seo?.metaDescription ? { description: seo.metaDescription } : {}),
    ...(image ? { images: [{ url: image }] } : {}),
  };
  meta.twitter = {
    card: image ? 'summary_large_image' : 'summary',
    title,
    ...(seo?.metaDescription ? { description: seo.metaDescription } : {}),
    ...(image ? { images: [image] } : {}),
  };
  return meta;
}
