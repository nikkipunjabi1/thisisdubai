import { CmsImage } from './CmsImage';

/**
 * DetailHero — the lead image on a detail page (POI, Area, Event), so all three
 * share one cinematic treatment instead of hand-rolling their own (per
 * docs/COMPONENT-STANDARDS.md §1). Wider than the 4:3 cards on purpose: detail
 * pages get the editorial, full-measure crop the design system asks for.
 *
 * `priority` is on — this is above the fold, so it should not lazy-load.
 * Renders nothing when no image is authored, leaving the page's own heading intact.
 */
export function DetailHero({ src, alt }: { src?: string | null; alt: string }) {
  if (!src) return null;
  return (
    <div className="relative mb-12 aspect-[16/9] overflow-hidden rounded-xl bg-gradient-to-br from-desert-night to-obsidian lg:aspect-[21/9]">
      <CmsImage src={src} alt={alt} sizes="(min-width: 1240px) 1240px, 100vw" priority />
    </div>
  );
}
