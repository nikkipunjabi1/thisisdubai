import Image from 'next/image';

/**
 * CmsImage — the one place CMS/DAM imagery is rendered.
 *
 * Images authored in CMP resolve through Graph to a CDN URL on
 * `images{n}.cmp.optimizely.com` (covered by the `**.optimizely.com` remotePattern
 * in next.config.ts). The image reference exposes only `key` and `url` — no alt text
 * and **no intrinsic dimensions** — so we use `fill` inside a caller-sized, positioned
 * box rather than passing width/height we'd have to invent.
 *
 * `alt` is required and comes from the content item's name: these images illustrate
 * the thing the card or page is about, so the name is the accurate description.
 * Renders nothing when there's no image, letting callers show their own fallback.
 */
export function CmsImage({
  src,
  alt,
  sizes,
  priority = false,
  className = '',
}: {
  src?: string | null;
  alt: string;
  /** Tell the browser how wide this renders, so it downloads the right size. */
  sizes: string;
  /** Set on a page's above-the-fold hero only — it disables lazy loading. */
  priority?: boolean;
  className?: string;
}) {
  if (!src) return null;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={`object-cover ${className}`}
    />
  );
}
