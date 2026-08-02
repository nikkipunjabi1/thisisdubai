import Link from 'next/link';
import { controlHref, type ListingState } from '@/lib/listing-context';
import type { SortKey, ChildType, TagOption, Filters } from '@/lib/sections';
import { TYPE_FACETS } from '@/lib/sections';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n';
import { t } from '@/lib/messages';

const chipBase = 'rounded-full border px-3 py-1 text-sm transition';
const chipOff = `${chipBase} border-line text-muted hover:border-accent hover:text-accent`;
const chipOn = `${chipBase} border-accent bg-surface font-medium text-accent`;

/**
 * ListingControls — the server-rendered listing toolbar (no client JS). Row 1: result
 * count + sort. Row 2: facet filters for the section's child type (price, tags) with
 * a toggle-off + a "Clear all". Every control is a query-string <Link> (scroll={false}
 * so the page doesn't jump), and changing any of them resets to page 1 (controlHref).
 */
export function ListingControls({
  state,
  total,
  activeSort,
  childType,
  tags,
  filters,
  locale = DEFAULT_LOCALE,
}: {
  state: ListingState;
  total: number;
  activeSort: SortKey;
  childType: ChildType | null;
  tags: TagOption[];
  filters: Filters;
  locale?: Locale;
}) {
  const m = t(locale);
  const facets = childType ? TYPE_FACETS[childType] : [];
  const hasActive = Boolean(filters.tag || filters.price);
  const SORTS: { key: SortKey; label: string }[] = [
    { key: 'name', label: m.listing.sortAsc },
    { key: '-name', label: m.listing.sortDesc },
    { key: 'newest', label: m.listing.sortNewest },
  ];
  const PRICE_OPTIONS: { value: string; label: string }[] = [
    { value: 'free', label: m.listing.free },
    { value: '$$', label: '$$' },
    { value: '$$$', label: '$$$' },
    { value: '$$$$', label: '$$$$' },
  ];

  return (
    <div className="mb-8 border-b border-line pb-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted">
          <span className="text-fg">{total}</span> {total === 1 ? m.listing.result : m.listing.results}
        </p>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted">{m.listing.sort}</span>
          <ul className="flex items-center gap-1">
            {SORTS.map((s) => {
              const active = s.key === activeSort;
              return (
                <li key={s.key}>
                  <Link
                    href={controlHref(state, { sort: s.key === 'name' ? null : s.key })}
                    scroll={false}
                    aria-current={active ? 'true' : undefined}
                    className={active ? chipOn : chipOff}
                  >
                    {s.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {facets.length > 0 ? (
        <div className="mt-5 flex flex-col gap-3">
          {facets.includes('price') ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm text-muted">{m.listing.price}</span>
              {PRICE_OPTIONS.map((p) => {
                const active = filters.price === p.value;
                return (
                  <Link
                    key={p.value}
                    href={controlHref(state, { price: active ? null : p.value })}
                    scroll={false}
                    aria-pressed={active}
                    className={active ? chipOn : chipOff}
                  >
                    {p.label}
                  </Link>
                );
              })}
            </div>
          ) : null}
          {facets.includes('tag') && tags.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm text-muted">{m.listing.tags}</span>
              {tags.map((t) => {
                const active = filters.tag === t.slug;
                return (
                  <Link
                    key={t.slug}
                    href={controlHref(state, { tag: active ? null : t.slug })}
                    scroll={false}
                    aria-pressed={active}
                    className={active ? chipOn : chipOff}
                  >
                    {t.name}
                  </Link>
                );
              })}
            </div>
          ) : null}
          {hasActive ? (
            <Link href={controlHref(state, { tag: null, price: null })} scroll={false} className="self-start text-sm text-accent hover:underline">
              {m.listing.clearAll}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
