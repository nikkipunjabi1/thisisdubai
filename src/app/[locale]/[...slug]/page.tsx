import { cache } from 'react';
import type { Metadata } from 'next';
import { getClient } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { notFound } from 'next/navigation';
import { getSiteSettings, buildContentMetadata, type PageSeo } from '@/lib/seo';
import { getBreadcrumbs } from '@/lib/breadcrumbs';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { seedListingState } from '@/lib/listing-context';
import { cachedGraphRead } from '@/lib/cache';
import { getDraftContentByPath } from '@/lib/draft';
import { cmsContentPath, isLocale, withLocale, DEFAULT_LOCALE } from '@/lib/i18n';

// Fetch a path's content once per request (React `cache`), reused across requests
// (`cachedGraphRead`). The localized path itself is the locale signal — `/ar/...` vs
// `/...` differ, so keying on path alone keeps EN and AR responses distinct in cache.
const getPublishedByPath = cache(
  cachedGraphRead((path: string) => getClient().getContentByPath(path), ['content-by-path']),
);

/**
 * The page's content, honouring a stakeholder preview link.
 *
 * In Draft Mode with a valid, in-scope share token this returns the UNPUBLISHED version
 * read straight from Graph (uncached, super-user credential, server-side only). In every
 * other case — including a preview link scoped to a different page, or an item with no
 * pending edits — it falls through to the normal cached published read, so the public
 * site is untouched. The path carries the locale, so no separate locale argument is
 * needed. See src/lib/draft.ts and docs/PREVIEW-WORKFLOW.md.
 */
const getByPath = async (path: string) =>
  (await getDraftContentByPath(path)) ?? (await getPublishedByPath(path));

// Content that must NEVER be served as a public page — shared blocks (Site Settings,
// Tag taxonomy terms) and any organizational folder, caught by BASE TYPE.
const NON_ROUTABLE_TYPES = new Set(['_Component', '_Folder']);
const isNonRoutable = (types: string[] = []) => types.some((t) => NON_ROUTABLE_TYPES.has(t));

export const dynamicParams = true;

/**
 * Reads `searchParams` (the listing engine's ?page/?sort/?tag state), so it is
 * request-time. `force-dynamic` stops Next prerendering it (which would 500 with
 * DYNAMIC_SERVER_USAGE); the Graph reads underneath are cached across requests.
 */
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string; slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const [content, settings] = await Promise.all([
    getByPath(cmsContentPath(locale, slug)),
    getSiteSettings(),
  ]);
  const node = content[0] as
    | (PageSeo & { name?: string; _metadata?: { displayName?: string; types?: string[] } })
    | undefined;
  if (!node || isNonRoutable(node._metadata?.types)) return {};
  const fallback = node.name ?? node._metadata?.displayName ?? 'This is Dubai';
  return buildContentMetadata(node, settings, fallback, { locale, path: `/${slug.join('/')}` });
}

export default async function Page({ params, searchParams }: Props) {
  const { locale: raw, slug } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const sp = await searchParams;

  // Seed request-scoped listing state so the SectionListing block (rendered deep in the
  // VB composition, where searchParams don't reach) can paginate. `path` keeps the locale
  // prefix so pagination links stay in-locale.
  const page = Math.max(1, Number.parseInt(String(sp.page ?? '1'), 10) || 1);
  const query: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (k !== 'page' && typeof v === 'string') query[k] = v;
  }
  seedListingState({ page, path: withLocale(locale, `/${slug.join('/')}`), query });

  const path = cmsContentPath(locale, slug);
  const [content, crumbs] = await Promise.all([
    getByPath(path),
    getBreadcrumbs(path, locale),
  ]);

  const node = content[0] as { _metadata?: { types?: string[] } } | undefined;
  if (!node || isNonRoutable(node._metadata?.types)) {
    notFound();
  }

  return (
    <>
      <Breadcrumbs crumbs={crumbs} />
      <OptimizelyComponent content={content[0]} />
    </>
  );
}
