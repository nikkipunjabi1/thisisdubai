import { cache } from 'react';
import type { Metadata } from 'next';
import { getClient } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { getSiteSettings, buildContentMetadata, type PageSeo } from '@/lib/seo';
import { getDraftContentByPath } from '@/lib/draft';
import { cmsContentPath, isLocale, DEFAULT_LOCALE, type Locale } from '@/lib/i18n';

// Fetch the Home experience for a locale once per request; `generateMetadata` and the
// page both need it, and `cache()` dedupes the Graph call. The home path is
// locale-derived: `/` for the default locale, `/ar/` for Arabic (the CMS convention) —
// and the path itself is the locale signal, so no separate `locale` arg is needed.
//
// A stakeholder preview link scoped to the Home experience swaps in its UNPUBLISHED
// version (uncached, server-side credential); everything else reads published content
// exactly as before. See src/lib/draft.ts.
const getHome = cache(async (locale: Locale) => {
  const path = cmsContentPath(locale, []);
  const draft = await getDraftContentByPath(path);
  if (draft) return draft;
  try {
    return await getClient().getContentByPath(path);
  } catch {
    return [];
  }
});

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const [content, settings] = await Promise.all([getHome(locale), getSiteSettings()]);
  const seo = (content[0] ?? null) as PageSeo | null;
  return buildContentMetadata(seo, settings, 'Home', { locale, path: '/' });
}

/**
 * Site root for a locale (`/en`, `/ar`). Renders the published Home experience fetched
 * from Graph by its locale-specific path. Until it is composed + published, shows a
 * friendly placeholder. (Live editing happens via /preview; see docs/PREVIEW-WORKFLOW.md.)
 */
export default async function Home({ params }: Props) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const content = await getHome(locale);

  if (content.length > 0) {
    return <OptimizelyComponent content={content[0]} />;
  }

  return (
    <div className="under-construction">
      <h1>This is Dubai — coming together</h1>
      <p>
        The Home experience isn’t published yet. Compose it in Visual Builder and publish, or
        preview it live via <code>/preview</code>.
      </p>
    </div>
  );
}
