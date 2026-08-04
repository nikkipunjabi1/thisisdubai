import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import {
  OptimizelyComposition,
  type ComponentContainerProps,
  getPreviewUtils,
} from '@optimizely/cms-sdk/react/server';
import { SeoMetadataContract } from './SeoMetadata';

/**
 * ThingsToDoPage — a reusable Visual Builder CAMPAIGN experience. One type powers the
 * "Things to Do" landing page and each themed sub-page (New & Trending, Dubai Attractions,
 * Arts & Culture, Wellness…). Unlike the section experiences, it parents no content: it is a
 * curated canvas of blocks (video Hero, Curated Content Rails, Video, Highlight Cards) that
 * link out to existing detail pages. Routing is handled by the `[...slug]` catch-all, so
 * creating one at `/things-to-do/...` in the CMS is all that's needed to publish a new page.
 *
 * SEO: the page's single <h1> comes from the ThingsToDoHero block. Every other block renders
 * <h2>/<h3>, so each page keeps exactly one top-level heading.
 */
export const ThingsToDoPageContentType = contentType({
  key: 'ThingsToDoPage',
  displayName: 'Things to Do (Campaign Page)',
  baseType: '_experience',
  extends: SeoMetadataContract,
  mayContainTypes: [],
  properties: {
    internalTitle: {
      type: 'string',
      displayName: 'Internal title',
      description: 'Editor-only label; not shown on the page.',
      group: 'content',
      sortOrder: 1,
    },
  },
});

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return <div {...pa(node)}>{children}</div>;
}

export default function ThingsToDoPage({
  content,
}: {
  content: ContentProps<typeof ThingsToDoPageContentType>;
}) {
  return (
    <OptimizelyComposition
      nodes={content.composition?.nodes ?? []}
      ComponentWrapper={ComponentWrapper}
    />
  );
}
