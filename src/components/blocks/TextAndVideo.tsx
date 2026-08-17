import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { Prose } from '@/components/ui/Prose';
import {
  SectionShell,
  type SectionTheme,
  type SectionWidth,
  type SectionSpacing,
} from '@/components/ui/SectionShell';
import { LayoutDisplayTemplate } from './LayoutDisplayTemplate';
import { parseYouTubeId, youTubeEmbedUrl } from '@/lib/youtube';

/**
 * TextAndVideo — one column of rich text beside a video, mirroring TextAndImage so the two
 * feel like siblings to an author. The image/video split is intentionally TWO components
 * (different content structure: an image reference vs. a video), while left/right stays a
 * `layout` variant. See docs/OPTIMIZELY-BEST-PRACTICES.md.
 */
export const TextAndVideoContentType = contentType({
  key: 'TextAndVideo',
  displayName: 'Text and Video',
  baseType: '_component',
  compositionBehaviors: ['sectionEnabled', 'elementEnabled'],
  properties: {
    text: { type: 'richText', displayName: 'Text', group: 'content', sortOrder: 1 },
    youtubeId: {
      type: 'string',
      displayName: 'YouTube video ID or URL',
      group: 'content',
      sortOrder: 2,
      isRequired: true,
    },
    layout: {
      type: 'string',
      format: 'selectOne',
      displayName: 'Layout',
      description: 'Which side the video sits on. Columns stack on mobile regardless.',
      group: 'content',
      sortOrder: 3,
      enum: [
        { value: 'videoRight', displayName: 'Video right' },
        { value: 'videoLeft', displayName: 'Video left' },
      ],
    },
  },
});

type Props = {
  content: ContentProps<typeof TextAndVideoContentType>;
  displaySettings?: ContentProps<typeof LayoutDisplayTemplate>;
};

export default function TextAndVideo({ content, displaySettings }: Props) {
  const id = parseYouTubeId(content.youtubeId);
  const videoLeft = content.layout === 'videoLeft';

  return (
    <SectionShell
      theme={(displaySettings?.theme as SectionTheme) ?? 'inherit'}
      width={(displaySettings?.width as SectionWidth) ?? 'contained'}
      spacing={(displaySettings?.spacing as SectionSpacing) ?? 'normal'}
    >
      <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
        <div className={videoLeft ? 'md:order-2' : undefined}>
          <Prose content={content.text?.json} />
        </div>
        <div className={videoLeft ? 'md:order-1' : undefined}>
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-line bg-surface">
            {id ? (
              <iframe
                src={youTubeEmbedUrl(id)}
                title="Video"
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-desert-night to-obsidian" />
            )}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
