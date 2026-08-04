import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import {
  SectionShell,
  type SectionTheme,
  type SectionWidth,
  type SectionSpacing,
} from '@/components/ui/SectionShell';
import { LayoutDisplayTemplate } from './LayoutDisplayTemplate';
import { YouTubeFacade } from './YouTubeFacade';
import { parseYouTubeId, youTubeEmbedUrl, youTubeThumb } from '@/lib/youtube';
import { getRequestLocale } from '@/lib/server-locale';
import { t } from '@/lib/messages';

/**
 * VideoEmbed — an inline YouTube video block for the page body (distinct from the background
 * hero). Exposes every playback parameter we genuinely control: autoplay (muted), start
 * muted, loop, start time, and hiding end-screen suggestions.
 *
 * When NOT autoplaying it renders a click-to-load facade (poster + play button) so the page
 * ships no YouTube JS until a viewer plays it. The optional caption is a <figcaption>, never
 * a heading, so this block never competes with the page's single <h1>.
 */
export const VideoEmbedContentType = contentType({
  key: 'VideoEmbed',
  displayName: 'Video (YouTube)',
  baseType: '_component',
  compositionBehaviors: ['sectionEnabled', 'elementEnabled'],
  properties: {
    youtubeId: {
      type: 'string',
      displayName: 'YouTube video ID or URL',
      group: 'content',
      sortOrder: 1,
      isRequired: true,
    },
    caption: { type: 'string', displayName: 'Caption (optional)', group: 'content', sortOrder: 2, isLocalized: true },
    autoplay: {
      type: 'boolean',
      displayName: 'Autoplay (muted)',
      description: 'Autoplay forces mute — browsers block unmuted autoplay. Skips the click-to-play poster.',
      group: 'content',
      sortOrder: 3,
    },
    mute: { type: 'boolean', displayName: 'Start muted', group: 'content', sortOrder: 4 },
    loop: { type: 'boolean', displayName: 'Loop', group: 'content', sortOrder: 5 },
    hideRelated: {
      type: 'boolean',
      displayName: 'Hide related videos at the end',
      description: 'On by default. YouTube limits end-screen suggestions to this channel — it cannot remove them entirely.',
      group: 'content',
      sortOrder: 6,
    },
    startSeconds: {
      type: 'integer',
      displayName: 'Start at (seconds)',
      group: 'content',
      sortOrder: 7,
      minimum: 0,
    },
  },
});

type Props = {
  content: ContentProps<typeof VideoEmbedContentType>;
  displaySettings?: ContentProps<typeof LayoutDisplayTemplate>;
};

export default async function VideoEmbed({ content, displaySettings }: Props) {
  const { pa } = getPreviewUtils(content);
  const locale = await getRequestLocale();
  const id = parseYouTubeId(content.youtubeId);

  const autoplay = !!content.autoplay;
  const hideRelated = content.hideRelated !== false; // default on
  const opts = {
    mute: !!content.mute,
    loop: !!content.loop,
    hideRelated,
    start: content.startSeconds ?? undefined,
  };

  return (
    <SectionShell
      theme={(displaySettings?.theme as SectionTheme) ?? 'inherit'}
      width={(displaySettings?.width as SectionWidth) ?? 'contained'}
      spacing={(displaySettings?.spacing as SectionSpacing) ?? 'normal'}
    >
      <figure className="mx-auto max-w-4xl">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-obsidian" {...pa('youtubeId')}>
          {!id ? (
            <div className="absolute inset-0 grid place-content-center text-sm text-muted">
              {/* Empty/invalid id — keep the frame so the layout doesn't jump in the editor. */}
              YouTube video ID or URL required.
            </div>
          ) : autoplay ? (
            <iframe
              src={youTubeEmbedUrl(id, { ...opts, autoplay: true })}
              title={content.caption || t(locale).media.playVideo}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          ) : (
            // Facade plays on click, so force autoplay=1 on the src it will mount.
            <YouTubeFacade
              src={youTubeEmbedUrl(id, { ...opts, autoplay: true })}
              thumb={youTubeThumb(id)}
              label={content.caption || t(locale).media.playVideo}
            />
          )}
        </div>
        {content.caption ? (
          <figcaption className="mt-3 text-center text-sm text-muted" {...pa('caption')}>
            {content.caption}
          </figcaption>
        ) : null}
      </figure>
    </SectionShell>
  );
}
