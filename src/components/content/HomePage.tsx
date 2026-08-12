import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import {
  OptimizelyComposition,
  type ComponentContainerProps,
  getPreviewUtils,
} from '@optimizely/cms-sdk/react/server';
import { SeoMetadataContract } from './SeoMetadata';
import { AreaContentType } from './Area';
import { EventContentType } from './Event';
import {
  PlacesToVisitContentType,
  NeighbourhoodsContentType,
  EventsContentType,
  ArticlesContentType,
} from './SectionExperience';
import { ThingsToDoPageContentType } from './ThingsToDoPage';

/**
 * HomePage — the site's home experience AND its site root (one node, e.g.
 * "This is Dubai"). It's the Start Page (`/`) an Application binds its host to,
 * and it also PARENTS the section pages, so the content tree is
 * `Root → This is Dubai → {sections}` and URLs resolve relative to here.
 * Multisite = one HomePage site-root + Application per destination.
 * Authors compose the home canvas from the blocks in src/components/blocks/.
 */
export const HomePageContentType = contentType({
  key: 'HomePage',
  displayName: 'Home / Site Root',
  baseType: '_experience',
  extends: SeoMetadataContract,
  // The site root contains the section pages. Tags + Site Settings are now shared
  // blocks (app assets), not page children — so the page tree is just the sections.
  mayContainTypes: [
    PlacesToVisitContentType,
    NeighbourhoodsContentType,
    EventsContentType,
    ArticlesContentType,
    ThingsToDoPageContentType, // the "Things to Do" campaign landing page lives under Home
    AreaContentType,
    EventContentType,
  ],
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

export default function HomePage({
  content,
}: {
  content: ContentProps<typeof HomePageContentType>;
}) {
  return (
    <OptimizelyComposition
      nodes={content.composition.nodes ?? []}
      ComponentWrapper={ComponentWrapper}
    />
  );
}
