import { contentType, damAssets, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import { SectionShell } from '@/components/ui/SectionShell';
import { JsonLd } from '@/components/ui/JsonLd';
import { DetailHero } from '@/components/media/DetailHero';
import { Prose } from '@/components/ui/Prose';
import { getPlacesByKeys } from '@/lib/pois';
import { SeoMetadataContract } from './SeoMetadata';
import { TagContentType } from './Tag';
import { PointOfInterestContentType } from './PointOfInterest';

/**
 * Article — editorial guide / news story.
 *
 * Note the field names differ from the other listable types: `title`/`excerpt`
 * rather than `name`/`summary`, because that is what reads correctly for
 * editorial. The listing query aliases them (see `src/lib/sections.ts`
 * `TYPE_FIELDS`) so one card component still serves every section.
 */
export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: '_page',
  extends: SeoMetadataContract,
  properties: {
    title: { type: 'string', displayName: 'Title', group: 'content', sortOrder: 1, isRequired: true, indexingType: 'searchable' },
    excerpt: { type: 'string', displayName: 'Excerpt', group: 'content', sortOrder: 2, indexingType: 'searchable' },
    body: { type: 'richText', displayName: 'Body', group: 'content', sortOrder: 3 },
    heroImage: { type: 'contentReference', allowedTypes: ['_image'], displayName: 'Hero image', group: 'content', sortOrder: 4 },
    author: { type: 'string', displayName: 'Author', group: 'content', sortOrder: 5 },
    publishDate: { type: 'dateTime', displayName: 'Publish date', group: 'content', sortOrder: 6 },
    // Taxonomy is `Tag` (shared blocks), NOT the dormant legacy `Category` type this
    // field originally pointed at — see docs/CONTENT-ARCHITECTURE.md §3. Using Tag
    // means articles share the same facets as everything else on the site.
    tags: {
      type: 'array',
      displayName: 'Tags',
      description: 'Taxonomy terms — power filtering/facets + AI search.',
      group: 'content',
      sortOrder: 7,
      items: { type: 'contentReference', allowedTypes: [TagContentType] },
    },
    // contentReference (a link), not `content` (which would embed the POI inline).
    relatedPlaces: {
      type: 'array',
      displayName: 'Related places',
      group: 'content',
      sortOrder: 8,
      items: { type: 'contentReference', allowedTypes: [PointOfInterestContentType] },
    },
  },
});

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

export default async function Article({ content }: { content: ContentProps<typeof ArticleContentType> }) {
  const { pa } = getPreviewUtils(content);
  const { getAlt } = damAssets(content);
  const published = fmtDate(content.publishDate);
  // A contentReference exposes only { url, item, key } — not the target's name —
  // so the labels come from a second, cached Graph read keyed on those references.
  const related = await getPlacesByKeys(
    (content.relatedPlaces ?? []).map((p) => p?.key).filter((k): k is string => Boolean(k)),
  );

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: content.title,
    ...(content.excerpt ? { description: content.excerpt } : {}),
    ...(content.author ? { author: { '@type': 'Person', name: content.author } } : {}),
    ...(content.publishDate ? { datePublished: content.publishDate } : {}),
    ...(content.heroImage?.url?.default ? { image: content.heroImage.url.default } : {}),
  };

  return (
    <SectionShell theme="dark" spacing="spacious">
      <JsonLd data={jsonLd} />
      <article className="mx-auto max-w-page px-6 md:px-10 lg:px-16">
        <DetailHero
          src={content.heroImage?.url?.default}
          alt={getAlt(content.heroImage, content.title ?? 'Article')}
        />
        <header className="max-w-3xl">
          {published || content.author ? (
            <p className="eyebrow">
              {[published, content.author ? `By ${content.author}` : null].filter(Boolean).join(' · ')}
            </p>
          ) : null}
          <h1 className="mt-4 text-[clamp(2.25rem,5vw,3.75rem)]" {...pa('title')}>
            {content.title}
          </h1>
          {content.excerpt ? (
            <p className="mt-6 text-xl text-muted" {...pa('excerpt')}>
              {content.excerpt}
            </p>
          ) : null}
        </header>

        <div className="mt-12" {...pa('body')}>
          <Prose content={content.body?.json} />
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
  );
}
