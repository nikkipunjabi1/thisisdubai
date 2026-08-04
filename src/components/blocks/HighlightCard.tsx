import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import Image from 'next/image';
import {
  SectionShell,
  type SectionTheme,
  type SectionWidth,
  type SectionSpacing,
} from '@/components/ui/SectionShell';
import { LayoutDisplayTemplate } from './LayoutDisplayTemplate';

/**
 * HighlightCard — a reusable, image-led promo card. Authored as a SHARED block (created once
 * under the application's "For This Application" content, then referenced on any campaign
 * page), so a single edit updates every page that uses it. Renders its title as <h3> to sit
 * cleanly under a rail's <h2> and the page's single <h1>.
 */
export const HighlightCardContentType = contentType({
  key: 'HighlightCard',
  displayName: 'Highlight Card',
  baseType: '_component',
  compositionBehaviors: ['sectionEnabled', 'elementEnabled'],
  properties: {
    image: {
      type: 'contentReference',
      allowedTypes: ['_image'],
      displayName: 'Image',
      group: 'content',
      sortOrder: 1,
    },
    eyebrow: { type: 'string', displayName: 'Eyebrow', group: 'content', sortOrder: 2, isLocalized: true },
    title: {
      type: 'string',
      displayName: 'Title',
      group: 'content',
      sortOrder: 3,
      isRequired: true,
      isLocalized: true,
    },
    body: { type: 'string', displayName: 'Body', group: 'content', sortOrder: 4, isLocalized: true },
    ctaLabel: { type: 'string', displayName: 'CTA label', group: 'content', sortOrder: 5, isLocalized: true },
    ctaUrl: { type: 'url', displayName: 'CTA link', group: 'content', sortOrder: 6 },
  },
});

type Props = {
  content: ContentProps<typeof HighlightCardContentType>;
  displaySettings?: ContentProps<typeof LayoutDisplayTemplate>;
};

export default function HighlightCard({ content, displaySettings }: Props) {
  const { pa, src } = getPreviewUtils(content);
  const img = src(content.image);
  const href = content.ctaUrl?.default ?? undefined;

  return (
    <SectionShell
      theme={(displaySettings?.theme as SectionTheme) ?? 'inherit'}
      width={(displaySettings?.width as SectionWidth) ?? 'contained'}
      spacing={(displaySettings?.spacing as SectionSpacing) ?? 'normal'}
    >
      <div className="grid items-center gap-8 overflow-hidden rounded-2xl border border-line bg-surface md:grid-cols-2">
        <div className="relative aspect-[4/3] md:aspect-auto md:h-full md:min-h-[20rem]">
          {img ? (
            <Image src={img} alt="" fill className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-desert-night to-obsidian" />
          )}
        </div>
        <div className="flex flex-col gap-4 p-8 md:p-10">
          {content.eyebrow ? (
            <p className="eyebrow" {...pa('eyebrow')}>
              {content.eyebrow}
            </p>
          ) : null}
          <h3 className="text-3xl md:text-4xl" {...pa('title')}>
            {content.title}
          </h3>
          {content.body ? (
            <p className="whitespace-pre-line text-muted" {...pa('body')}>
              {content.body}
            </p>
          ) : null}
          {content.ctaLabel && href ? (
            <a
              href={href}
              className="mt-2 inline-block w-fit rounded-full bg-champagne px-6 py-2.5 text-sm font-semibold text-obsidian transition hover:bg-champagne-hi"
              {...pa('ctaLabel')}
            >
              {content.ctaLabel}
            </a>
          ) : null}
        </div>
      </div>
    </SectionShell>
  );
}
