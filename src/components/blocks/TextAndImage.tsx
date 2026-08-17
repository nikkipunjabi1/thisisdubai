import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import Image from 'next/image';
import { Prose } from '@/components/ui/Prose';
import {
  SectionShell,
  type SectionTheme,
  type SectionWidth,
  type SectionSpacing,
} from '@/components/ui/SectionShell';
import { LayoutDisplayTemplate } from './LayoutDisplayTemplate';

/**
 * TextAndImage — one column of rich text beside one image. The left/right split is a
 * VARIANT (a `layout` dropdown), not a second component — one of the core best practices:
 * layout-only differences live inside the component. See docs/OPTIMIZELY-BEST-PRACTICES.md.
 */
export const TextAndImageContentType = contentType({
  key: 'TextAndImage',
  displayName: 'Text and Image',
  baseType: '_component',
  compositionBehaviors: ['sectionEnabled', 'elementEnabled'],
  properties: {
    text: { type: 'richText', displayName: 'Text', group: 'content', sortOrder: 1 },
    image: {
      type: 'contentReference',
      allowedTypes: ['_image'],
      displayName: 'Image',
      group: 'content',
      sortOrder: 2,
    },
    layout: {
      type: 'string',
      format: 'selectOne',
      displayName: 'Layout',
      description: 'Which side the image sits on. Columns stack on mobile regardless.',
      group: 'content',
      sortOrder: 3,
      enum: [
        { value: 'imageRight', displayName: 'Image right' },
        { value: 'imageLeft', displayName: 'Image left' },
      ],
    },
  },
});

type Props = {
  content: ContentProps<typeof TextAndImageContentType>;
  displaySettings?: ContentProps<typeof LayoutDisplayTemplate>;
};

export default function TextAndImage({ content, displaySettings }: Props) {
  const { src } = getPreviewUtils(content);
  const img = src(content.image);
  const imageLeft = content.layout === 'imageLeft';

  return (
    <SectionShell
      theme={(displaySettings?.theme as SectionTheme) ?? 'inherit'}
      width={(displaySettings?.width as SectionWidth) ?? 'contained'}
      spacing={(displaySettings?.spacing as SectionSpacing) ?? 'normal'}
    >
      <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
        <div className={imageLeft ? 'md:order-2' : undefined}>
          <Prose content={content.text?.json} />
        </div>
        <div className={imageLeft ? 'md:order-1' : undefined}>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-surface">
            {img ? (
              <Image src={img} alt="" fill className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-desert-night to-obsidian" />
            )}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
