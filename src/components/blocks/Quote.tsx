import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import {
  SectionShell,
  type SectionTheme,
  type SectionSpacing,
} from '@/components/ui/SectionShell';
import { LayoutDisplayTemplate } from './LayoutDisplayTemplate';

/**
 * Quote — a large pull quote with optional attribution. Named for what it is, not its look
 * ("Quote", not "BigTextHighlight"), so it survives a redesign. Renders as a semantic
 * <figure>/<blockquote>, never a heading, so it never competes with the page's <h1>.
 */
export const QuoteContentType = contentType({
  key: 'Quote',
  displayName: 'Quote',
  baseType: '_component',
  compositionBehaviors: ['sectionEnabled', 'elementEnabled'],
  properties: {
    quote: {
      type: 'string',
      displayName: 'Quote',
      description: 'The pull quote itself.',
      group: 'content',
      sortOrder: 1,
      isRequired: true,
      isLocalized: true,
    },
    attribution: {
      type: 'string',
      displayName: 'Attribution (optional)',
      description: 'Who said it, e.g. a name.',
      group: 'content',
      sortOrder: 2,
      isLocalized: true,
    },
    role: {
      type: 'string',
      displayName: 'Role or source (optional)',
      description: 'e.g. a job title or publication.',
      group: 'content',
      sortOrder: 3,
      isLocalized: true,
    },
  },
});

type Props = {
  content: ContentProps<typeof QuoteContentType>;
  displaySettings?: ContentProps<typeof LayoutDisplayTemplate>;
};

export default function Quote({ content, displaySettings }: Props) {
  const { pa } = getPreviewUtils(content);
  const cite = [content.attribution, content.role].filter(Boolean).join(', ');

  return (
    <SectionShell
      theme={(displaySettings?.theme as SectionTheme) ?? 'inherit'}
      width="contained"
      spacing={(displaySettings?.spacing as SectionSpacing) ?? 'normal'}
    >
      <figure className="mx-auto max-w-3xl text-center">
        <blockquote className="font-display text-3xl leading-snug text-fg md:text-4xl" {...pa('quote')}>
          {content.quote ? `“${content.quote}”` : null}
        </blockquote>
        {cite ? (
          <figcaption className="mt-6 text-sm uppercase tracking-wide text-muted" {...pa('attribution')}>
            {cite}
          </figcaption>
        ) : null}
      </figure>
    </SectionShell>
  );
}
