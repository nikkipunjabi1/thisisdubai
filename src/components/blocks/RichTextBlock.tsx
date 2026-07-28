import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import { Prose } from '@/components/ui/Prose';
import {
  SectionShell,
  type SectionTheme,
  type SectionSpacing,
} from '@/components/ui/SectionShell';
import { LayoutDisplayTemplate } from './LayoutDisplayTemplate';

/**
 * RichTextBlock — formatted editorial copy. Per COMPONENT-STANDARDS the reading
 * measure is protected, so it is always `contained` (width setting intentionally
 * not applied); theme + spacing still honour the display settings.
 */
export const RichTextBlockContentType = contentType({
  key: 'RichTextBlock',
  displayName: 'Rich Text',
  baseType: '_component',
  compositionBehaviors: ['sectionEnabled', 'elementEnabled'],
  properties: {
    body: { type: 'richText', displayName: 'Body', group: 'content', sortOrder: 1 },
  },
});

type Props = {
  content: ContentProps<typeof RichTextBlockContentType>;
  displaySettings?: ContentProps<typeof LayoutDisplayTemplate>;
};

export default function RichTextBlock({ content, displaySettings }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <SectionShell
      theme={(displaySettings?.theme as SectionTheme) ?? 'inherit'}
      width="contained"
      spacing={(displaySettings?.spacing as SectionSpacing) ?? 'normal'}
    >
      <div {...pa('body')}>
        {/* Shared with the detail pages so editorial copy looks identical everywhere. */}
        <Prose content={content.body?.json} className="mx-auto" />
      </div>
    </SectionShell>
  );
}
