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

/**
 * Article detail — `/articles/<year>/<month>/<slug>`.
 *
 * Articles are shared BLOCKS (`ArticlePost`), which have no CMS URL, so this route owns
 * routing: it resolves the block by `slug` (the year/month segments are cosmetic — they
 * come from `publishDate`). See docs/CONTENT-ARCHITECTURE.md §10.
 */

type Params = { year: string; month: string; slug: string };
type Props = { params: Promise<Params> };

// Prerender every published article (no searchParams here, so static generation is safe).
// New/edited articles render on demand via dynamicParams and refresh via the data cache.
export const dynamicParams = true;
export async function generateStaticParams() {
  if (!process.env.APPLICATION_HOST) return [];
  return getAllArticleParams();
}

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [article, settings] = await Promise.all([getArticleBySlug(slug), getSiteSettings()]);
  if (!article) return {};
  return buildContentMetadata(
    {
      metaTitle: article.metaTitle,
      metaDescription: article.metaDescription ?? article.excerpt,
      noindex: article.noindex,
      nofollow: article.nofollow,
      // Articles use the hero as the social share image (every article has one).
      ogImage: article.heroUrl ? { url: { default: article.heroUrl } } : null,
    },
    settings,
    article.title,
  );
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const related = await getPlacesByKeys(article.relatedPlaceKeys);
  const published = fmtDate(article.publishDate);

  const crumbs = [
    { name: 'Home', url: '/' },
    { name: 'Articles', url: '/articles' },
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
                {[published, article.author ? `By ${article.author}` : null].filter(Boolean).join(' · ')}
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
              <h2 className="eyebrow">Places mentioned</h2>
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
