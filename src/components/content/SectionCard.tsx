import Link from 'next/link';
import { Grid } from '@/components/ui/Grid';
import { CmsImage } from '@/components/media/CmsImage';
import type { SectionCardItem } from '@/lib/sections';

/**
 * SectionCard / SectionCardGrid — the editorial, image-optional card used by
 * generic listing sections (Neighbourhoods, Events…). Same visual language as
 * POICard (monogram band + name + summary), with an optional `meta` line (e.g.
 * an event date). Links to the item's own CMS URL.
 */
export function SectionCard({ item }: { item: SectionCardItem }) {
  const initial = item.name.charAt(0).toUpperCase();
  return (
    <Link
      href={item.path}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface transition duration-300 hover:-translate-y-1 hover:border-accent focus-visible:-translate-y-1 focus-visible:border-accent focus-visible:outline-none"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-desert-night to-obsidian">
        {item.imageUrl ? (
          <CmsImage
            src={item.imageUrl}
            alt={item.name}
            // Cards sit on a 12-col grid: 3 across on desktop, 1 up on mobile.
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="transition duration-500 group-hover:scale-105"
          />
        ) : (
          /* No image authored yet — the monogram keeps the grid rhythm intact. */
          <span
            aria-hidden
            className="absolute inset-0 grid place-content-center font-display text-[5rem] leading-none text-champagne/15 transition duration-500 group-hover:scale-110 group-hover:text-champagne/25"
          >
            {initial}
          </span>
        )}
        {item.meta ? (
          <span className="absolute left-3 top-3 rounded-full bg-obsidian/70 px-3 py-1 text-xs font-semibold text-champagne backdrop-blur">
            {item.meta}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="text-2xl">{item.name}</h3>
        {item.summary ? <p className="line-clamp-2 text-sm text-muted">{item.summary}</p> : null}
        <span className="mt-auto pt-2 text-sm font-medium text-accent transition group-hover:translate-x-0.5">
          Explore →
        </span>
      </div>
    </Link>
  );
}

export function SectionCardGrid({ items }: { items: SectionCardItem[] }) {
  if (items.length === 0) {
    return <p className="text-muted">Nothing to show here yet. Check back soon.</p>;
  }
  return (
    <Grid>
      {items.map((item) => (
        <div key={item.path || item.name} className="col-span-4">
          <SectionCard item={item} />
        </div>
      ))}
    </Grid>
  );
}
