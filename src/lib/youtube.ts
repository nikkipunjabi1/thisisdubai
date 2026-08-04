/**
 * YouTube embed helpers — a tiny, dependency-free layer shared by the video Hero and the
 * inline Video block. Kept pure (no React, no env) so it is unit-testable and reusable.
 *
 * Privacy + UX notes baked in here so every embed behaves consistently:
 * - We always embed via `youtube-nocookie.com` (no tracking cookie until the viewer plays).
 * - `rel=0` limits end-screen suggestions to the SAME channel. Since 2018 YouTube no longer
 *   lets an embed remove related videos entirely — this is the strongest control available.
 * - Unmuted autoplay is blocked by browsers, so `autoplay` implies `mute`.
 */

/** Accept a bare 11-char id OR any common YouTube URL and return the id (or null). */
export function parseYouTubeId(input: string | null | undefined): string | null {
  if (!input) return null;
  const s = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/v\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export type YouTubeOptions = {
  autoplay?: boolean;
  mute?: boolean;
  loop?: boolean;
  controls?: boolean;
  /** Seconds to start at. */
  start?: number;
  /** Default true. When false, `rel=1` (broader suggestions). */
  hideRelated?: boolean;
  /**
   * Background-hero mode: forces muted, autoplaying, looping, chromeless playback.
   * Overrides the individual flags so a hero can never show controls or sound.
   */
  background?: boolean;
};

/** Build a privacy-friendly `youtube-nocookie.com` embed URL with the given options. */
export function youTubeEmbedUrl(id: string, opts: YouTubeOptions = {}): string {
  const bg = !!opts.background;
  const autoplay = bg ? true : !!opts.autoplay;
  // Browsers block unmuted autoplay, so autoplay always implies mute.
  const mute = bg ? true : autoplay ? true : !!opts.mute;
  const loop = bg ? true : !!opts.loop;
  const controls = bg ? false : opts.controls ?? true;
  const hideRelated = opts.hideRelated !== false;

  const p = new URLSearchParams();
  p.set('rel', hideRelated ? '0' : '1');
  p.set('modestbranding', '1');
  p.set('playsinline', '1');
  if (autoplay) p.set('autoplay', '1');
  if (mute) p.set('mute', '1');
  if (!controls) p.set('controls', '0');
  // Looping a single video requires `playlist=<id>` — YouTube's documented quirk.
  if (loop) {
    p.set('loop', '1');
    p.set('playlist', id);
  }
  if (opts.start && opts.start > 0) p.set('start', String(Math.floor(opts.start)));
  if (bg) {
    p.set('disablekb', '1');
    p.set('fs', '0');
    p.set('iv_load_policy', '3'); // hide video annotations
  }
  return `https://www.youtube-nocookie.com/embed/${id}?${p.toString()}`;
}

/** Poster thumbnail for the click-to-load facade (plain <img>, no cookie). */
export function youTubeThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
