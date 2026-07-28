import { contentType, damAssets, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import { SectionShell } from '@/components/ui/SectionShell';
import { JsonLd } from '@/components/ui/JsonLd';
import { DetailHero } from '@/components/media/DetailHero';
import { Prose } from '@/components/ui/Prose';
import { SeoMetadataContract } from './SeoMetadata';

/**
 * Area — a Dubai neighbourhood / region (e.g. Downtown, Marina, Deira).
 * Routable page; Points of Interest, Hotels and Events reference it.
 */
export const AreaContentType = contentType({
  key: 'Area',
  displayName: 'Area / Neighbourhood',
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
    description: {
      type: 'richText',
      displayName: 'Description',
      group: 'content',
      sortOrder: 3,
    },
    heroImage: {
      type: 'contentReference',
      allowedTypes: ['_image'],
      displayName: 'Hero image',
      group: 'content',
      sortOrder: 4,
    },
    latitude: {
      type: 'float',
      displayName: 'Latitude',
      group: 'content',
      sortOrder: 5,
      minimum: -90,
      maximum: 90,
    },
    longitude: {
      type: 'float',
      displayName: 'Longitude',
      group: 'content',
      sortOrder: 6,
      minimum: -180,
      maximum: 180,
    },
  },
});

export default function Area({ content }: { content: ContentProps<typeof AreaContentType> }) {
  const { pa } = getPreviewUtils(content);
  // getAlt prefers the AltText authored on the DAM asset, falling back to the name.
  const { getAlt } = damAssets(content);
  const hasGeo = content.latitude != null && content.longitude != null;
  const mapUrl = hasGeo
    ? `https://www.google.com/maps/search/?api=1&query=${content.latitude},${content.longitude}`
    : null;
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
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
        <DetailHero
          src={content.heroImage?.url?.default}
          alt={getAlt(content.heroImage, content.name ?? 'Neighbourhood')}
        />
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
        <div className="mt-12" {...pa('description')}>
          <Prose content={content.description?.json} />
        </div>

        {mapUrl ? (
          <dl className="mt-10 border-t border-line pt-8">
            <dt className="eyebrow">Location</dt>
            <dd className="mt-1 text-lg">
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                View on map →
              </a>
            </dd>
          </dl>
        ) : null}
      </article>
    </SectionShell>
  );
}
