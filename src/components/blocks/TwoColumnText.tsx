import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { Prose } from '@/components/ui/Prose';
import {
  SectionShell,
  type SectionTheme,
  type SectionWidth,
  type SectionSpacing,
} from '@/components/ui/SectionShell';
import { LayoutDisplayTemplate } from './LayoutDisplayTemplate';

/**
 * TwoColumnText — two side-by-side columns of rich text, no media. Author-first name
 * ("Two Column Text", not "SplitTextBlockV2"): it says exactly what the author gets.
 * Columns stack on mobile. Naming/variant rationale: docs/OPTIMIZELY-BEST-PRACTICES.md.
 */
export const TwoColumnTextContentType = contentType({
  key: 'TwoColumnText',
  displayName: 'Two Column Text',
  baseType: '_component',
  compositionBehaviors: ['sectionEnabled', 'elementEnabled'],
  properties: {
    leftColumn: { type: 'richText', displayName: 'Left column', group: 'content', sortOrder: 1 },
    rightColumn: { type: 'richText', displayName: 'Right column', group: 'content', sortOrder: 2 },
  },
});

type Props = {
  content: ContentProps<typeof TwoColumnTextContentType>;
  displaySettings?: ContentProps<typeof LayoutDisplayTemplate>;
};

export default function TwoColumnText({ content, displaySettings }: Props) {
  return (
    <SectionShell
      theme={(displaySettings?.theme as SectionTheme) ?? 'inherit'}
      width={(displaySettings?.width as SectionWidth) ?? 'contained'}
      spacing={(displaySettings?.spacing as SectionSpacing) ?? 'normal'}
    >
      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <Prose content={content.leftColumn?.json} />
        <Prose content={content.rightColumn?.json} />
      </div>
    </SectionShell>
  );
}
