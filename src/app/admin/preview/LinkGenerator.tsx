'use client';

import { useActionState, useMemo, useState } from 'react';
import { generateLink, type GenerateState } from './actions';
import type { DraftItem } from '@/lib/draft';

/**
 * The author-facing half of the admin UI: pick an item that has unpublished edits, choose
 * how long the link should live, get a URL to send.
 *
 * One form, not one per row. `useActionState` is a hook, so a form per row would mean a
 * variable number of hooks; instead the list sets `selected` and a single form carries it
 * in hidden fields.
 */

const TTL_OPTIONS = [
  { label: '24 hours', value: 24 * 60 * 60 },
  { label: '7 days', value: 7 * 24 * 60 * 60 },
  { label: '30 days', value: 30 * 24 * 60 * 60 },
];

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard needs a secure context and permission; the input stays selectable
          // so a manual copy always works.
          setCopied(false);
        }
      }}
      className="shrink-0 rounded-full border border-line px-4 py-2 text-sm transition hover:border-accent"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export function LinkGenerator({ items, total }: { items: DraftItem[]; total: number }) {
  const [state, formAction, pending] = useActionState<GenerateState, FormData>(generateLink, {});
  const [selected, setSelected] = useState<DraftItem | null>(items[0] ?? null);
  const [filter, setFilter] = useState('');

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) => i.displayName.toLowerCase().includes(q) || i.url.toLowerCase().includes(q),
    );
  }, [items, filter]);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      {/* ---- Item picker ---- */}
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl">Items with unpublished edits</h2>
          <p className="text-xs text-muted">
            {total > items.length ? `showing ${items.length} of ${total}, newest first` : `${items.length} items`}
          </p>
        </div>

        <label htmlFor="filter" className="sr-only">
          Filter items
        </label>
        <input
          id="filter"
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by name or path…"
          className="mt-4 w-full rounded-lg border border-line bg-surface px-3 py-2 text-fg outline-none focus:border-accent"
        />

        {visible.length === 0 ? (
          <p className="mt-6 text-sm text-muted">
            {items.length === 0
              ? 'Nothing is in draft right now. Edit and save an item in the CMS without publishing, then reload.'
              : 'No items match that filter.'}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-lg border border-line">
            {visible.map((item) => {
              const isSelected = selected?.key === item.key && selected?.locale === item.locale;
              return (
                <li key={`${item.key}:${item.locale}:${item.version}`}>
                  <button
                    type="button"
                    onClick={() => setSelected(item)}
                    aria-pressed={isSelected}
                    className={`flex w-full items-baseline justify-between gap-4 px-4 py-3 text-left transition hover:bg-surface ${
                      isSelected ? 'bg-surface' : ''
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{item.displayName}</span>
                      <span className="block truncate text-xs text-muted">{item.url}</span>
                    </span>
                    <span className="shrink-0 text-right text-xs text-muted">
                      <span className="rounded-full border border-line px-2 py-0.5 uppercase">{item.locale}</span>
                      <span className="mt-1 block tabular-nums">v{item.version}</span>
                      <span className="block">{relativeTime(item.lastModified)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ---- Link builder ---- */}
      <section>
        <h2 className="text-xl">Create a share link</h2>

        {!selected ? (
          <p className="mt-4 text-sm text-muted">Choose an item on the left.</p>
        ) : (
          <form action={formAction} className="mt-4">
            <input type="hidden" name="key" value={selected.key} />
            <input type="hidden" name="locale" value={selected.locale} />
            <input type="hidden" name="path" value={selected.url} />
            <input type="hidden" name="label" value={selected.displayName} />

            <div className="rounded-lg border border-line bg-surface px-4 py-3">
              <p className="text-sm font-medium">{selected.displayName}</p>
              <p className="mt-1 truncate text-xs text-muted">{selected.url}</p>
              <p className="mt-1 text-xs text-muted">
                {selected.locale.toUpperCase()} · draft v{selected.version}
              </p>
            </div>

            <fieldset className="mt-5">
              <legend className="text-sm font-medium">Version</legend>
              <label className="mt-2 flex items-start gap-2 text-sm">
                <input type="radio" name="version" value="latest" defaultChecked className="mt-1" />
                <span>
                  Latest draft
                  <span className="block text-xs text-muted">
                    Keeps showing new edits, so you can keep working after sending the link.
                  </span>
                </span>
              </label>
              <label className="mt-3 flex items-start gap-2 text-sm">
                <input type="radio" name="version" value={selected.version} className="mt-1" />
                <span>
                  Pin v{selected.version}
                  <span className="block text-xs text-muted">
                    A frozen snapshot of exactly what you see now.
                  </span>
                </span>
              </label>
            </fieldset>

            <label htmlFor="ttl" className="mt-5 block text-sm font-medium">
              Link expires after
            </label>
            <select
              id="ttl"
              name="ttl"
              defaultValue={TTL_OPTIONS[1].value}
              className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2 text-fg outline-none focus:border-accent"
            >
              {TTL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={pending}
              className="mt-6 w-full rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-bg transition hover:opacity-90 disabled:opacity-50"
            >
              {pending ? 'Signing…' : 'Create link'}
            </button>
          </form>
        )}

        {state.error && (
          <p role="alert" className="mt-4 rounded-lg border border-line bg-surface px-3 py-2 text-sm">
            {state.error}
          </p>
        )}

        {state.url && (
          <div className="mt-6 rounded-lg border border-accent px-4 py-3">
            <p className="text-sm font-medium">Link for {state.label}</p>
            <div className="mt-3 flex gap-2">
              <label htmlFor="generated" className="sr-only">
                Generated preview link
              </label>
              <input
                id="generated"
                readOnly
                value={state.url}
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-xs"
              />
              <CopyButton value={state.url} />
            </div>
            <p className="mt-3 text-xs text-muted">
              Expires {state.expiresAt ? new Date(state.expiresAt).toLocaleString() : ''}. Anyone with
              this link can read this one item until then, with no CMS login.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
