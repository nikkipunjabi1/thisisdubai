import { cache } from 'react';
import { getClient } from '@optimizely/cms-sdk';
import { cachedGraphRead } from './cache';
import { getScopedDraftContent } from './draft';
import { graphLocale, withLocale, DEFAULT_LOCALE, type Locale } from './i18n';

/**
 * Article data access. Articles are shared BLOCKS (`ArticlePost` `_component`), so they
 * have no CMS URL and can't be fetched with `getContentByPath` — the app owns routing and
 * resolves a block by its `slug`. The `/<year>/<month>/` URL segments come from
 * `publishDate` (see `articleHref`), not from the block's folder (docs/CONTENT-ARCHITECTURE.md §10).
 */

/** Build an article's public URL from its slug + publishDate (year/month), locale-prefixed. */
export function articleHref(slug: string, publishDate?: string | null, locale: Locale = DEFAULT_LOCALE): string {
  const iso = String(publishDate ?? '');
  const y = iso.slice(0, 4) || 'undated';
  const m = iso.slice(5, 7) || '00';
  return withLocale(locale, `/articles/${y}/${m}/${slug}`);
}

export type ArticleDetail = {
  slug: string;
  title: string;
  excerpt: string | null;
  bodyJson: unknown;
  author: string | null;
  publishDate: string | null;
  heroUrl: string | null;
  heroAlt: string;
  relatedPlaceKeys: string[];
  // SEO (from the SeoMetadata contract) for generateMetadata.
  metaTitle: string | null;
  metaDescription: string | null;
  noindex: boolean | null;
  nofollow: boolean | null;
};

/* eslint-disable @typescript-eslint/no-explicit-any */

/** One article by slug, with everything the detail route + its metadata need. Cached. */
export const getArticleBySlug = cache(
  cachedGraphRead(async (slug: string, locale: Locale = DEFAULT_LOCALE): Promise<ArticleDetail | null> => {
    try {
      const data = (await getClient().request(
        `query($s: String!) {
          ArticlePost(locale: ${graphLocale(locale)}, where: { slug: { eq: $s } }, limit: 1) {
            items {
              slug title excerpt author publishDate
              metaTitle metaDescription noindex nofollow
              body { json }
              heroImage { url { default } }
              relatedPlaces { key }
            }
          }
        }`,
        { s: slug },
      )) as any;
      const it = data?.ArticlePost?.items?.[0];
      if (!it) return null;
      return toArticleDetail(it);
    } catch {
      return null;
    }
  }, ['article-by-slug']),
);

/** Shape a raw `ArticlePost` (delivery query or draft read) into what the route needs. */
function toArticleDetail(it: any): ArticleDetail {
  return {
    slug: it.slug,
    title: it.title ?? 'Article',
    excerpt: it.excerpt ?? null,
    bodyJson: it.body?.json ?? null,
    author: it.author ?? null,
    publishDate: it.publishDate ?? null,
    heroUrl: it.heroImage?.url?.default ?? null,
    heroAlt: it.title ?? 'Article',
    relatedPlaceKeys: (it.relatedPlaces ?? []).map((p: any) => p?.key).filter((k: unknown): k is string => Boolean(k)),
    metaTitle: it.metaTitle ?? null,
    metaDescription: it.metaDescription ?? null,
    noindex: it.noindex ?? null,
    nofollow: it.nofollow ?? null,
  };
}

/**
 * The article for this route, honouring a stakeholder preview link.
 *
 * Articles are shared blocks with no CMS URL, so the draft layer cannot match them by
 * path. It hands back whatever the link is scoped to and we confirm here that it really
 * is this article, by slug. Without that check one article's link would preview them all.
 *
 * Falls through to the normal cached published read in every other case.
 */
export async function getArticleForRoute(
  slug: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<ArticleDetail | null> {
  const draft = (await getScopedDraftContent()) as any;
  if (draft?.slug === slug) return toArticleDetail(draft);
  return getArticleBySlug(slug, locale);
}

/** All articles as {year, month, slug} — for the detail route's generateStaticParams. */
export const getAllArticleParams = cachedGraphRead(async (): Promise<Array<{ year: string; month: string; slug: string }>> => {
  try {
    const data = (await getClient().request(
      `query { ArticlePost(limit: 100) { items { slug publishDate } } }`,
      {},
    )) as any;
    return (data?.ArticlePost?.items ?? [])
      .filter((a: any) => a?.slug)
      .map((a: any) => {
        const iso = String(a.publishDate ?? '');
        return { year: iso.slice(0, 4) || 'undated', month: iso.slice(5, 7) || '00', slug: a.slug as string };
      });
  } catch {
    return [];
  }
}, ['article-params']);
