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
import { parseYouTubeId, youTubeEmbedUrl } from '@/lib/youtube';

/**
 * ThingsToDoHero — a full-bleed campaign hero with an optional YouTube BACKGROUND video
 * (muted, looping, chromeless), a poster-image fallback, and the page's single <h1>.
 *
 * The video is a background flourish, never the content: it plays muted/looped with no
 * controls, sits behind a legibility gradient, and is `aria-hidden` + non-focusable so it
 * adds nothing for assistive tech or keyboard users. If no video is set (or it's toggled
 * off), the poster image carries the hero — and doubles as the LCP image.
 */
export const ThingsToDoHeroContentType = contentType({
  key: 'ThingsToDoHero',
  displayName: 'Things to Do — Video Hero',
  baseType: '_component',
  compositionBehaviors: ['sectionEnabled', 'elementEnabled'],
  properties: {
    eyebrow: { type: 'string', displayName: 'Eyebrow', group: 'content', sortOrder: 1, isLocalized: true },
    heading: {
      type: 'string',
      displayName: 'Heading (page H1)',
      description: 'The single, top-level <h1> for this page. Every other block uses <h2>/<h3>.',
      group: 'content',
      sortOrder: 2,
      isRequired: true,
      isLocalized: true,
    },
    standfirst: {
      type: 'string',
      displayName: 'Standfirst',
      description: 'A short intro sentence under the heading.',
      group: 'content',
      sortOrder: 3,
      isLocalized: true,
    },
    youtubeId: {
      type: 'string',
      displayName: 'YouTube video ID or URL',
      description: 'Background video. Plays muted and looped. Leave empty to show only the poster image.',
      group: 'content',
      sortOrder: 4,
    },
    showVideo: {
      type: 'boolean',
      displayName: 'Show background video',
      description: 'On by default. Turn off to show only the poster image (also the mobile/low-data fallback).',
      group: 'content',
      sortOrder: 5,
    },
    posterImage: {
      type: 'contentReference',
      allowedTypes: ['_image'],
      displayName: 'Poster image (fallback / LCP)',
      group: 'content',
      sortOrder: 6,
    },
    ctaLabel: { type: 'string', displayName: 'CTA label', group: 'content', sortOrder: 7, isLocalized: true },
    ctaUrl: { type: 'url', displayName: 'CTA link', group: 'content', sortOrder: 8 },
  },
});

type Props = {
  content: ContentProps<typeof ThingsToDoHeroContentType>;
  displaySettings?: ContentProps<typeof LayoutDisplayTemplate>;
};

export default function ThingsToDoHero({ content, displaySettings }: Props) {
  const { pa, src } = getPreviewUtils(content);
  const poster = src(content.posterImage);
  const videoId = content.showVideo !== false ? parseYouTubeId(content.youtubeId) : null;
  const videoUrl = videoId ? youTubeEmbedUrl(videoId, { background: true }) : null;

  return (
    <SectionShell
      theme={(displaySettings?.theme as SectionTheme) ?? 'dark'}
      width={(displaySettings?.width as SectionWidth) ?? 'full'}
      spacing={(displaySettings?.spacing as SectionSpacing) ?? 'spacious'}
      // Height is CONTAINER-driven, not `vh`: the Visual Builder renders each block in a
      // preview iframe whose viewport height is not the visible canvas, so a bare `68vh`
      // there resolves against a huge viewport and the hero balloons. The clamp keeps ~68vh
      // on the real site but caps the extremes so the editor preview stays sane.
      className="relative isolate flex min-h-[clamp(28rem,68vh,46rem)] items-end overflow-hidden"
    >
      {/* Background layer: poster (always, as instant paint + fallback) then video over it.
          `container-type: size` makes the cover sizing below relative to THIS box (via cq*
          units) instead of the viewport, so the video fills the hero identically on the real
          site and inside the Visual Builder's preview iframe. */}
      <div className="absolute inset-0 -z-10 bg-obsidian [container-type:size]">
        {poster ? (
          <Image src={poster} alt="" fill priority className="object-cover" sizes="100vw" />
        ) : null}
        {videoUrl ? (
          <iframe
            src={videoUrl}
            title=""
            aria-hidden
            tabIndex={-1}
            allow="autoplay; encrypted-media; picture-in-picture"
            // Cover trick, container-relative: a 16:9 iframe sized to the larger of the
            // container's own dimensions in each axis (cqw/cqh), so it always fills the hero
            // without letterboxing, in any layout context.
            className="pointer-events-none absolute left-1/2 top-1/2 h-[max(100cqh,56.25cqw)] w-[max(100cqw,177.78cqh)] -translate-x-1/2 -translate-y-1/2"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/55 to-obsidian/20" />
      </div>

      <div className="mx-auto w-full max-w-page px-6 pb-6 md:px-10 lg:px-16">
        {content.eyebrow ? (
          <p className="eyebrow" {...pa('eyebrow')}>
            {content.eyebrow}
          </p>
        ) : null}
        <h1 className="mt-6 max-w-[18ch] text-[clamp(2.5rem,6vw,5.25rem)]" {...pa('heading')}>
          {content.heading}
        </h1>
        {content.standfirst ? (
          <p className="mt-6 max-w-[52ch] text-lg text-muted" {...pa('standfirst')}>
            {content.standfirst}
          </p>
        ) : null}
        {content.ctaLabel && content.ctaUrl?.default ? (
          <a
            href={content.ctaUrl.default}
            className="mt-10 inline-block rounded-full bg-champagne px-7 py-3 text-sm font-semibold text-obsidian transition hover:bg-champagne-hi"
            {...pa('ctaLabel')}
          >
            {content.ctaLabel}
          </a>
        ) : null}
      </div>
    </SectionShell>
  );
}
