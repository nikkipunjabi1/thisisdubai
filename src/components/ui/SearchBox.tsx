import { withLocale, DEFAULT_LOCALE, type Locale } from '@/lib/i18n';
import { t } from '@/lib/messages';

/**
 * SearchBox — the site's search entry point. A plain GET <form> targeting the locale's
 * /search, so it works with zero client JavaScript and the resulting URL is shareable and
 * cacheable (the same URL-is-the-source-of-truth rule the listing engine follows).
 */
export function SearchBox({
  defaultValue = '',
  autoFocus = false,
  locale = DEFAULT_LOCALE,
}: {
  defaultValue?: string;
  autoFocus?: boolean;
  locale?: Locale;
}) {
  const m = t(locale);
  return (
    <form action={withLocale(locale, '/search')} method="get" role="search" className="flex w-full gap-3">
      <label htmlFor="site-search" className="sr-only">
        {m.search.boxLabel}
      </label>
      <input
        id="site-search"
        name="q"
        type="search"
        defaultValue={defaultValue}
        // Only set on /search itself, where the field IS the page's purpose — the
        // same convention a dedicated search page (e.g. a search engine) uses.
        autoFocus={autoFocus}
        placeholder={m.search.placeholder}
        className="min-w-0 flex-1 rounded-full border border-line bg-surface px-6 py-4 text-lg text-fg placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
      <button
        type="submit"
        className="shrink-0 rounded-full bg-champagne px-8 py-4 font-medium text-obsidian transition hover:bg-champagne-hi focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {m.search.button}
      </button>
    </form>
  );
}
