import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import Link from 'next/link';
import {
  SectionShell,
  type SectionTheme,
  type SectionWidth,
  type SectionSpacing,
} from '@/components/ui/SectionShell';
import { LayoutDisplayTemplate } from './LayoutDisplayTemplate';
import { SectionCard } from '@/components/content/SectionCard';
import { getCuratedItems, type CuratedType, type CuratedSource } from '@/lib/curated';
import { getRequestLocale } from '@/lib/server-locale';
import { TagContentType } from '@/components/content/Tag';
import { PointOfInterestContentType } from '@/components/content/PointOfInterest';
import { AreaContentType } from '@/components/content/Area';
import { EventContentType } from '@/components/content/Event';
import { ArticlePostContentType } from '@/components/content/Article';

/**
 * CuratedContentRail — the configurable "top N" rail for campaign pages. The author chooses
 * WHAT (Places / Neighbourhoods / Events / Articles) and HOW to pick it: the LATEST few, a
 * TAG (taxonomy) query, or a HAND-PICKED list. Cards link to each item's own detail page, so
 * the campaign never duplicates content — it curates it. Renders its heading as <h2>.
 */
export const CuratedContentRailContentType = contentType({
  key: 'CuratedContentRail',
  displayName: 'Curated Content Rail',
  baseType: '_component',
  compositionBehaviors: ['sectionEnabled', 'elementEnabled'],
  properties: {
    heading: { type: 'string', displayName: 'Heading', group: 'content', sortOrder: 1, isLocalized: true },
    intro: {
      type: 'string',
      displayName: 'Intro (optional)',
      group: 'content',
      sortOrder: 2,
      isLocalized: true,
    },
    collection: {
      type: 'string',
      format: 'selectOne',
      displayName: 'Content type',
      description: 'Which kind of content this rail shows.',
      group: 'content',
      sortOrder: 3,
      enum: [
        { value: 'places', displayName: 'Places to Visit' },
        { value: 'neighbourhoods', displayName: 'Neighbourhoods' },
        { value: 'events', displayName: 'Events' },
        { value: 'articles', displayName: 'Articles' },
      ],
    },
    source: {
      type: 'string',
      format: 'selectOne',
      displayName: 'How to choose items',
      description: 'Latest = newest first. By tag = everything with a taxonomy tag. Hand-picked = the exact items you choose.',
      group: 'content',
      sortOrder: 4,
      enum: [
        { value: 'latest', displayName: 'Latest' },
        { value: 'tag', displayName: 'By tag (taxonomy)' },
        { value: 'handpicked', displayName: 'Hand-picked' },
      ],
    },
    tag: {
      type: 'contentReference',
      allowedTypes: [TagContentType],
      displayName: 'Tag (when “By tag”)',
      group: 'content',
      sortOrder: 5,
    },
    // NOTE: must NOT be named `items` — that key is reserved on element-enabled
    // components (they use `items` for composition), so the CMS rejects it.
    picks: {
      type: 'array',
      displayName: 'Hand-picked items (when “Hand-picked”)',
      description: 'Pick the exact items, in order. Ignored for Latest / By tag.',
      group: 'content',
      sortOrder: 6,
      items: {
        type: 'content',
        allowedTypes: [
          PointOfInterestContentType,
          AreaContentType,
          EventContentType,
          ArticlePostContentType,
        ],
      },
    },
    count: {
      type: 'integer',
      displayName: 'How many to show',
      description: 'Defaults to 4.',
      group: 'content',
      sortOrder: 7,
      minimum: 1,
      maximum: 12,
    },
    ctaLabel: { type: 'string', displayName: '“View all” label', group: 'content', sortOrder: 8, isLocalized: true },
    ctaUrl: { type: 'url', displayName: '“View all” link', group: 'content', sortOrder: 9 },
  },
});

type Props = {
  content: ContentProps<typeof CuratedContentRailContentType>;
  displaySettings?: ContentProps<typeof LayoutDisplayTemplate>;
};

export default async function CuratedContentRail({ content, displaySettings }: Props) {
  const { pa } = getPreviewUtils(content);
  const locale = await getRequestLocale();

  const type = (content.collection ?? 'places') as CuratedType;
  const source = (content.source ?? 'latest') as CuratedSource;
  const count = content.count ?? 4;
  const tagKey = (content.tag as { key?: string } | undefined)?.key ?? null;
  const keys = ((content.picks ?? []) as Array<{ key?: string }>)
    .map((i) => i?.key)
    .filter((k): k is string => Boolean(k));

  const items = await getCuratedItems({ type, source, count, tagKey, keys }, locale);
  if (items.length === 0) return null; // an empty/misconfigured rail renders nothing

  const viewAll = content.ctaLabel && content.ctaUrl?.default ? content.ctaUrl.default : null;

  return (
    <SectionShell
      theme={(displaySettings?.theme as SectionTheme) ?? 'inherit'}
      width={(displaySettings?.width as SectionWidth) ?? 'contained'}
      spacing={(displaySettings?.spacing as SectionSpacing) ?? 'normal'}
    >
      {content.heading || content.intro ? (
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            {content.heading ? (
              <h2 className="text-3xl md:text-4xl" {...pa('heading')}>
                {content.heading}
              </h2>
            ) : null}
            {content.intro ? (
              <p className="mt-3 max-w-[60ch] text-muted" {...pa('intro')}>
                {content.intro}
              </p>
            ) : null}
          </div>
          {viewAll ? (
            <Link
              href={viewAll}
              className="shrink-0 text-sm font-medium text-accent transition hover:translate-x-0.5"
              {...pa('ctaLabel')}
            >
              {content.ctaLabel} →
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <SectionCard key={item.key ?? item.path} item={item} />
        ))}
      </div>

      {viewAll ? (
        <div className="mt-8 sm:hidden">
          <Link href={viewAll} className="text-sm font-medium text-accent">
            {content.ctaLabel} →
          </Link>
        </div>
      ) : null}
    </SectionShell>
  );
}
