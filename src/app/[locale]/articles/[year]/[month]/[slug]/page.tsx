import type { Metadata } from 'next';
import type { ComponentProps } from 'react';
import { notFound } from 'next/navigation';
import { getArticleBySlug, getAllArticleParams } from '@/lib/articles';
import { getSiteSettings, buildContentMetadata } from '@/lib/seo';
import { getPlacesByKeys } from '@/lib/pois';
import { SectionShell } from '@/components/ui/SectionShell';
import { JsonLd } from '@/components/ui/JsonLd';
import { DetailHero } from '@/components/media/DetailHero';
import { Prose } from '@/components/ui/Prose';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { isLocale, withLocale, formatDate, DEFAULT_LOCALE, LOCALES } from '@/lib/i18n';
import { t } from '@/lib/messages';

/**
 * Article detail — `/<locale>/articles/<year>/<month>/<slug>`.
 *
 * Articles are shared BLOCKS (`ArticlePost`), which have no CMS URL, so this route owns
 * routing: it resolves the block by `slug` (year/month are cosmetic, from `publishDate`).
 * Locale-aware article CONTENT is threaded in L2; for now the block resolves in EN.
 */

type Params = { locale: string; year: string; month: string; slug: string };
type Props = { params: Promise<Params> };

// Prerender every published article per locale. New/edited articles render on demand.
export const dynamicParams = true;
export async function generateStaticParams() {
  if (!process.env.APPLICATION_HOST) return [];
  const params = await getAllArticleParams();
  // The route is nested under [locale], so each param set needs its locale.
  return LOCALES.flatMap((locale) => params.map((p) => ({ locale, ...p })));
}


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, year, month, slug } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const [article, settings] = await Promise.all([getArticleBySlug(slug, locale), getSiteSettings()]);
  if (!article) return {};
  return buildContentMetadata(
    {
      metaTitle: article.metaTitle,
      metaDescription: article.metaDescription ?? article.excerpt,
      noindex: article.noindex,
      nofollow: article.nofollow,
      ogImage: article.heroUrl ? { url: { default: article.heroUrl } } : null,
    },
    settings,
    article.title,
    { locale, path: `/articles/${year}/${month}/${slug}` },
  );
}

export default async function ArticlePage({ params }: Props) {
  const { locale: raw, slug } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const article = await getArticleBySlug(slug, locale);
  if (!article) notFound();

  const m = t(locale);
  const related = await getPlacesByKeys(article.relatedPlaceKeys, locale);
  const published = article.publishDate ? formatDate(locale, article.publishDate) : null;

  const crumbs = [
    { name: m.crumbs.home, url: withLocale(locale, '/') },
    { name: m.crumbs.articles, url: withLocale(locale, '/articles') },
    { name: article.title, url: null },
  ];

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    ...(article.excerpt ? { description: article.excerpt } : {}),
    ...(article.author ? { author: { '@type': 'Person', name: article.author } } : {}),
    ...(article.publishDate ? { datePublished: article.publishDate } : {}),
    ...(article.heroUrl ? { image: article.heroUrl } : {}),
  };

  return (
    <>
      <Breadcrumbs crumbs={crumbs} />
      <SectionShell theme="dark" spacing="spacious">
        <JsonLd data={jsonLd} />
        <article className="mx-auto max-w-page px-6 md:px-10 lg:px-16">
          <DetailHero src={article.heroUrl ?? undefined} alt={article.heroAlt} />
          <header className="max-w-3xl">
            {published || article.author ? (
              <p className="eyebrow">
                {[published, article.author ? m.detail.by(article.author) : null].filter(Boolean).join(' · ')}
              </p>
            ) : null}
            <h1 className="mt-4 text-[clamp(2.25rem,5vw,3.75rem)]">{article.title}</h1>
            {article.excerpt ? <p className="mt-6 text-xl text-muted">{article.excerpt}</p> : null}
          </header>

          <div className="mt-12">
            <Prose content={article.bodyJson as ComponentProps<typeof Prose>['content']} />
          </div>

          {related.length > 0 ? (
            <aside className="mt-16 border-t border-line pt-8">
              <h2 className="eyebrow">{m.detail.placesMentioned}</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {related.map((p) => (
                  <li key={p.path}>
                    <a
                      href={p.path}
                      className="inline-block rounded-full border border-line px-4 py-2 text-sm transition hover:border-accent hover:text-accent"
                    >
                      {p.name}
                    </a>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </article>
      </SectionShell>
    </>
  );
}
