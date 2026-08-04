'use client';

import { useState } from 'react';

/**
 * Click-to-load YouTube facade. Renders a lightweight poster + play button and only mounts
 * the real iframe after a click — so a page with several videos ships zero YouTube JS until
 * a viewer actually plays one (a real Core Web Vitals + privacy win). The `src` passed in
 * already carries `autoplay=1`, so playback starts immediately on that user gesture.
 */
export function YouTubeFacade({
  src,
  thumb,
  label,
}: {
  src: string;
  thumb: string;
  label: string;
}) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <iframe
        src={src}
        title={label}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={label}
      className="group absolute inset-0 h-full w-full cursor-pointer"
    >
      {/* Plain <img>: it's a cookieless poster, and next/image would need a remote-host
          allowlist entry just for the facade. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
      <span className="absolute inset-0 bg-obsidian/20 transition group-hover:bg-obsidian/10" />
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-content-center rounded-full bg-champagne text-obsidian shadow-lg transition group-hover:scale-110"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </button>
  );
}
