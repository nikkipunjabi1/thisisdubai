import { contentType, damAssets, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import { SectionShell } from '@/components/ui/SectionShell';
import { JsonLd } from '@/components/ui/JsonLd';
import { Prose } from '@/components/ui/Prose';
import { DetailHero } from '@/components/media/DetailHero';
import { priceLabel } from '@/lib/pois';
import { SeoMetadataContract } from './SeoMetadata';
import { AreaContentType } from './Area';
import { TagContentType } from './Tag';

/**
 * PointOfInterest — a place to visit / thing to do (the "Places to visit" type).
 * Geo-aware (lat/lng) so we can rank "nearest" in AI search (see docs/AI-SEARCH.md).
 */
export const PointOfInterestContentType = contentType({
  key: 'PointOfInterest',
  displayName: 'Point of Interest',
  baseType: '_page',
  extends: SeoMetadataContract,
  properties: {
    name: {
      type: 'string',
      displayName: 'Name',
      group: 'content',
      sortOrder: 1,
      isRequired: true,
      indexingType: 'searchable',
    },
    summary: {
      type: 'string',
      displayName: 'Summary',
      group: 'content',
      sortOrder: 2,
      indexingType: 'searchable',
    },
    body: {
      type: 'richText',
      displayName: 'Body',
      group: 'content',
      sortOrder: 3,
    },
    images: {
      type: 'array',
      displayName: 'Images',
      group: 'content',
      sortOrder: 4,
      items: { type: 'contentReference', allowedTypes: ['_image'] },
    },
    area: {
      type: 'contentReference',
      allowedTypes: [AreaContentType],
      displayName: 'Area',
      group: 'content',
      sortOrder: 5,
    },
    tags: {
      type: 'array',
      displayName: 'Tags',
      description: 'Taxonomy terms (theme, cuisine, audience…) — power filtering/facets + AI search.',
      group: 'content',
      sortOrder: 6,
      items: { type: 'contentReference', allowedTypes: [TagContentType] },
    },
    latitude: {
      type: 'float',
      displayName: 'Latitude',
      group: 'content',
      sortOrder: 7,
      minimum: -90,
      maximum: 90,
    },
    longitude: {
      type: 'float',
      displayName: 'Longitude',
      group: 'content',
      sortOrder: 8,
      minimum: -180,
      maximum: 180,
    },
    priceBand: {
      type: 'string',
      format: 'selectOne',
      displayName: 'Price band',
      group: 'content',
      sortOrder: 9,
      // Queryable so the listing can facet-filter on it (where: { priceBand: { eq } }).
      indexingType: 'queryable',
      enum: [
        { value: 'free', displayName: 'Free' },
        { value: '$', displayName: '$' },
        { value: '$$', displayName: '$$' },
        { value: '$$$', displayName: '$$$' },
        { value: '$$$$', displayName: '$$$$' },
      ],
    },
    accolades: {
      type: 'array',
      displayName: 'Accolades',
      description: 'e.g. "Michelin Star", "UNESCO World Heritage"',
      group: 'content',
      sortOrder: 10,
      items: { type: 'string' },
    },
    openingHours: {
      type: 'string',
      displayName: 'Opening hours',
      group: 'content',
      sortOrder: 11,
    },
  },
});

export default function PointOfInterest({
  content,
}: {
  content: ContentProps<typeof PointOfInterestContentType>;
}) {
  const { pa } = getPreviewUtils(content);
  // getAlt prefers the AltText authored on the DAM asset, falling back to the name.
  const { getAlt } = damAssets(content);
  const hero = content.images?.[0];
  const price = priceLabel(content.priceBand ?? null);
  const accolades = (content.accolades ?? []).filter((a): a is string => Boolean(a));
  const hasGeo = content.latitude != null && content.longitude != null;
  const mapUrl = hasGeo
    ? `https://www.google.com/maps/search/?api=1&query=${content.latitude},${content.longitude}`
    : null;

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: content.name,
    ...(content.summary ? { description: content.summary } : {}),
    ...(hasGeo
      ? { geo: { '@type': 'GeoCoordinates', latitude: content.latitude, longitude: content.longitude } }
      : {}),
  };

  return (
    <SectionShell theme="dark" spacing="spacious">
      <JsonLd data={jsonLd} />
      <article className="mx-auto max-w-page px-6 md:px-10 lg:px-16">
        <DetailHero src={hero?.url?.default} alt={getAlt(hero, content.name ?? 'Place to visit')} />
        <header className="max-w-3xl">
          <h1 className="text-[clamp(2.5rem,6vw,4.5rem)]" {...pa('name')}>
            {content.name}
          </h1>
          {content.summary ? (
            <p className="mt-6 text-xl text-muted" {...pa('summary')}>
              {content.summary}
            </p>
          ) : null}
        </header>

        {accolades.length > 0 ? (
          <ul className="mt-8 flex flex-wrap gap-2">
            {accolades.map((a) => (
              <li
                key={a}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-sm text-accent"
              >
                <span aria-hidden>★</span>
                {a}
              </li>
            ))}
          </ul>
        ) : null}

        <dl className="mt-10 grid max-w-xl grid-cols-1 gap-x-8 gap-y-4 border-t border-line pt-8 sm:grid-cols-2">
          {price ? (
            <div>
              <dt className="eyebrow">Price</dt>
              <dd className="mt-1 text-lg">{price}</dd>
            </div>
          ) : null}
          {content.openingHours ? (
            <div>
              <dt className="eyebrow">Opening hours</dt>
              <dd className="mt-1 text-lg">{content.openingHours}</dd>
            </div>
          ) : null}
          {mapUrl ? (
            <div>
              <dt className="eyebrow">Location</dt>
              <dd className="mt-1 text-lg">
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  View on map →
                </a>
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-12" {...pa('body')}>
          <Prose content={content.body?.json} />
        </div>
      </article>
    </SectionShell>
  );
}
