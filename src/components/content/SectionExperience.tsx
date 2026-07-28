import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import {
  OptimizelyComposition,
  type ComponentContainerProps,
  getPreviewUtils,
} from '@optimizely/cms-sdk/react/server';
import { SeoMetadataContract } from './SeoMetadata';
import { PointOfInterestContentType } from './PointOfInterest';
import { AreaContentType } from './Area';
import { EventContentType } from './Event';

/**
 * Section experiences — the Visual Builder version of the listing/section pages.
 * Each is a routable `_experience` (its own canvas) that PARENTS its items and is
 * composed in Visual Builder: authors drop a Hero, a Section Heading, the
 * `SectionListing` block (the grid), and RichText — in any order, above/below the
 * list. The three types differ only in which child they accept (mayContainTypes),
 * so the CMS tree still mirrors the URLs (items are children → /section/<slug>).
 *
 * They share ONE renderer (below): the page = whatever the author composed. This
 * replaces the old fixed `_page` listing types (PlacesToVisitPage, …).
 */
const internalTitle = {
  internalTitle: {
    type: 'string' as const,
    displayName: 'Internal title',
    description: 'Editor-only label; not shown on the page.',
    group: 'content',
    sortOrder: 1,
  },
};

export const PlacesToVisitContentType = contentType({
  key: 'PlacesToVisit',
  displayName: 'Places to Visit (Section)',
  baseType: '_experience',
  extends: SeoMetadataContract,
  mayContainTypes: [PointOfInterestContentType],
  properties: internalTitle,
});

export const NeighbourhoodsContentType = contentType({
  key: 'Neighbourhoods',
  displayName: 'Neighbourhoods (Section)',
  baseType: '_experience',
  extends: SeoMetadataContract,
  mayContainTypes: [AreaContentType],
  properties: internalTitle,
});

export const EventsContentType = contentType({
  key: 'Events',
  displayName: 'Events (Section)',
  baseType: '_experience',
  extends: SeoMetadataContract,
  mayContainTypes: [EventContentType],
  properties: internalTitle,
});

export const ArticlesContentType = contentType({
  key: 'Articles',
  displayName: 'Articles (Section)',
  baseType: '_experience',
  extends: SeoMetadataContract,
  // Articles live as shared BLOCKS (`ArticlePost`) in the Assets panel, not as page
  // children — so this experience contains no page types. It's purely the listing
  // page; the SectionListing block surfaces the article blocks (docs §10).
  mayContainTypes: [],
  properties: internalTitle,
});

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return <div {...pa(node)}>{children}</div>;
}

/** Shared renderer for all three section experiences — renders the authored canvas. */
export default function SectionExperience({
  content,
}: {
  content: ContentProps<typeof PlacesToVisitContentType>;
}) {
  return (
    <OptimizelyComposition
      nodes={content.composition?.nodes ?? []}
      ComponentWrapper={ComponentWrapper}
    />
  );
}
