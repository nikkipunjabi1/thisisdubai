import { contentType, damAssets, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import { SectionShell } from '@/components/ui/SectionShell';
import { JsonLd } from '@/components/ui/JsonLd';
import { DetailHero } from '@/components/media/DetailHero';
import { Prose } from '@/components/ui/Prose';
import { SeoMetadataContract } from './SeoMetadata';
import { AreaContentType } from './Area';
import { TagContentType } from './Tag';

/** Event — a dated "what's on" happening (festival, exhibition, concert, dining event). */
export const EventContentType = contentType({
  key: 'Event',
  displayName: 'Event',
  baseType: '_page',
  extends: SeoMetadataContract,
  properties: {
    name: { type: 'string', displayName: 'Name', group: 'content', sortOrder: 1, isRequired: true, indexingType: 'searchable', isLocalized: true },
    summary: { type: 'string', displayName: 'Summary', group: 'content', sortOrder: 2, indexingType: 'searchable', isLocalized: true },
    body: { type: 'richText', displayName: 'Body', group: 'content', sortOrder: 3, isLocalized: true },
    images: { type: 'array', displayName: 'Images', group: 'content', sortOrder: 4, items: { type: 'contentReference', allowedTypes: ['_image'] } },
    startDate: { type: 'dateTime', displayName: 'Start date', group: 'content', sortOrder: 5, isRequired: true },
    endDate: { type: 'dateTime', displayName: 'End date', group: 'content', sortOrder: 6 },
    area: { type: 'contentReference', allowedTypes: [AreaContentType], displayName: 'Area / venue', group: 'content', sortOrder: 7 },
    tags: { type: 'array', displayName: 'Tags', description: 'Taxonomy terms (event type, audience…) — power filtering/facets + AI search.', group: 'content', sortOrder: 8, items: { type: 'contentReference', allowedTypes: [TagContentType] } },
    // Denormalized tag names + synonyms, indexed for search (see PointOfInterest.tsx for why).
    // Auto-populated by scripts/seed.mjs from the event's tags; not authored by hand.
    searchKeywords: { type: 'string', displayName: 'Search keywords (auto)', description: 'Auto-derived from tags for semantic search — do not edit by hand.', group: 'seo', sortOrder: 20, indexingType: 'searchable' },
    ticketUrl: { type: 'url', displayName: 'Ticket URL', group: 'content', sortOrder: 9 },
  },
});

const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

export default function Event({ content }: { content: ContentProps<typeof EventContentType> }) {
  const { pa } = getPreviewUtils(content);
  // getAlt prefers the AltText authored on the DAM asset, falling back to the name.
  const { getAlt } = damAssets(content);
  const hero = content.images?.[0];
  const start = fmt(content.startDate);
  const end = fmt(content.endDate);
  const dates = start ? (end && end !== start ? `${start} – ${end}` : start) : null;
  const ticket = content.ticketUrl?.default ?? undefined;
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: content.name,
    ...(content.summary ? { description: content.summary } : {}),
    ...(content.startDate ? { startDate: content.startDate } : {}),
    ...(content.endDate ? { endDate: content.endDate } : {}),
  };

  return (
    <SectionShell theme="dark" spacing="spacious">
      <JsonLd data={jsonLd} />
      <article className="mx-auto max-w-page px-6 md:px-10 lg:px-16">
        <DetailHero src={hero?.url?.default} alt={getAlt(hero, content.name ?? 'Event')} />
        <header className="max-w-3xl">
          {dates ? <p className="eyebrow">{dates}</p> : null}
          <h1 className="mt-4 text-[clamp(2.5rem,6vw,4.5rem)]" {...pa('name')}>
            {content.name}
          </h1>
          {content.summary ? (
            <p className="mt-6 text-xl text-muted" {...pa('summary')}>
              {content.summary}
            </p>
          ) : null}
        </header>
        <div className="mt-12" {...pa('body')}>
          <Prose content={content.body?.json} />
        </div>

        {ticket ? (
          <div className="mt-10 border-t border-line pt-8">
            <a
              href={ticket}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-full bg-champagne px-7 py-3 text-sm font-semibold text-obsidian transition hover:bg-champagne-hi"
            >
              Tickets &amp; info →
            </a>
          </div>
        ) : null}
      </article>
    </SectionShell>
  );
}
