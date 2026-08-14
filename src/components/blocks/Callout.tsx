import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import { Prose } from '@/components/ui/Prose';
import {
  SectionShell,
  type SectionTheme,
  type SectionWidth,
  type SectionSpacing,
} from '@/components/ui/SectionShell';
import { LayoutDisplayTemplate } from './LayoutDisplayTemplate';

/**
 * Callout — a short highlighted block on a tinted background, for a tip, note, or warning.
 * The colour is a `tone` VARIANT (a dropdown), not four separate components — the same
 * best practice applied to Hero and TextAndImage. See docs/OPTIMIZELY-BEST-PRACTICES.md.
 */
export const CalloutContentType = contentType({
  key: 'Callout',
  displayName: 'Callout',
  baseType: '_component',
  compositionBehaviors: ['sectionEnabled', 'elementEnabled'],
  properties: {
    heading: {
      type: 'string',
      displayName: 'Heading (optional)',
      group: 'content',
      sortOrder: 1,
      isLocalized: true,
    },
    body: { type: 'richText', displayName: 'Body', group: 'content', sortOrder: 2 },
    tone: {
      type: 'string',
      format: 'selectOne',
      displayName: 'Tone',
      description: 'The background colour of the block.',
      group: 'content',
      sortOrder: 3,
      enum: [
        { value: 'info', displayName: 'Info' },
        { value: 'success', displayName: 'Success' },
        { value: 'warning', displayName: 'Warning' },
        { value: 'neutral', displayName: 'Neutral' },
      ],
    },
  },
});

/** Tone → left-border + tint. Inline styles keep this independent of the Tailwind palette. */
const TONE: Record<string, { border: string; bg: string }> = {
  info: { border: '#4a86c5', bg: 'rgba(74, 134, 197, 0.12)' },
  success: { border: '#4caf7d', bg: 'rgba(76, 175, 125, 0.12)' },
  warning: { border: '#eeae56', bg: 'rgba(238, 174, 86, 0.14)' },
  neutral: { border: '#8aa3bf', bg: 'rgba(138, 163, 191, 0.10)' },
};

type Props = {
  content: ContentProps<typeof CalloutContentType>;
  displaySettings?: ContentProps<typeof LayoutDisplayTemplate>;
};

export default function Callout({ content, displaySettings }: Props) {
  const { pa } = getPreviewUtils(content);
  const tone = TONE[content.tone ?? 'info'] ?? TONE.info;

  return (
    <SectionShell
      theme={(displaySettings?.theme as SectionTheme) ?? 'inherit'}
      width={(displaySettings?.width as SectionWidth) ?? 'contained'}
      spacing={(displaySettings?.spacing as SectionSpacing) ?? 'normal'}
    >
      <div
        className="rounded-2xl border-l-4 p-6 md:p-8"
        style={{ borderLeftColor: tone.border, backgroundColor: tone.bg }}
      >
        {content.heading ? (
          <h3 className="mb-2 text-xl font-semibold text-fg" {...pa('heading')}>
            {content.heading}
          </h3>
        ) : null}
        <Prose content={content.body?.json} />
      </div>
    </SectionShell>
  );
}
