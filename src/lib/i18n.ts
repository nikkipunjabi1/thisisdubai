/**
 * Localization primitives for the EN + AR build.
 *
 * This is the single source of truth for "what locales exist" and the pure
 * helpers that routing, layout, data loaders, and the message catalog all share.
 * It intentionally has NO dependency on Graph/Next so it can be imported from
 * middleware (Edge), server components, and client components alike.
 *
 * URL model: every visitor route is prefixed with the locale segment —
 * `/en/places-to-visit/...` and `/ar/places-to-visit/...`. `/` redirects to the
 * default locale (see middleware in Sprint L1). The CMS content path itself is
 * NOT prefixed (Graph paths stay `/places-to-visit/burj-al-arab/`); the locale is
 * passed to Graph as the `locale` argument, and the prefix is an app-owned routing
 * concern layered on top. So the round trip is:
 *   incoming `/ar/places-to-visit/burj-al-arab/`
 *     → splitLocale() → { locale: 'ar', path: '/places-to-visit/burj-al-arab/' }
 *     → getContentByPath(path, { locale: graphLocale('ar') })
 */

export const LOCALES = ['en', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];

/** The locale `/` redirects to, and the fallback when detection is ambiguous. */
export const DEFAULT_LOCALE: Locale = 'en';

/** Locales that render right-to-left. Drives `<html dir>` and layout mirroring. */
const RTL_LOCALES = new Set<Locale>(['ar']);

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** `<html dir>` value for a locale. */
export function dir(locale: Locale): 'rtl' | 'ltr' {
  return RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';
}

/**
 * BCP-47 tag for `<html lang>` and `Intl` formatting. Kept separate from the
 * route segment so the short URL segment (`ar`) can map to a region-specific tag
 * (`ar-AE`) for correct date/number formatting without lengthening the URL.
 */
const HTML_LANG: Record<Locale, string> = {
  en: 'en-GB',
  ar: 'ar-AE',
};
export function htmlLang(locale: Locale): string {
  return HTML_LANG[locale];
}

/**
 * The value passed to Graph / the SDK's `locale` option. Graph's `Locales` enum
 * for this instance must expose the exact language enabled in the CMS — update
 * this map if the CMS uses `ar-AE`/`ar_AE` rather than plain `ar` (confirm via the
 * `__type(name:"Locales")` introspection probe). This is the ONE place that
 * mapping lives, so Sprint L2's loaders stay CMS-tag-agnostic.
 */
const GRAPH_LOCALE: Record<Locale, string> = {
  en: 'en',
  ar: 'ar',
};
export function graphLocale(locale: Locale): string {
  return GRAPH_LOCALE[locale];
}

/**
 * Split a locale prefix off an incoming pathname.
 * `/ar/places-to-visit/x/` → { locale: 'ar', path: '/places-to-visit/x/' }
 * `/en`                     → { locale: 'en', path: '/' }
 * `/places-to-visit/x/`     → { locale: null, path: '/places-to-visit/x/' } (unprefixed)
 * Returns `locale: null` when the first segment is not a known locale, so the
 * caller (middleware) can decide to redirect to the default-locale URL.
 */
export function splitLocale(pathname: string): { locale: Locale | null; path: string } {
  const segments = pathname.split('/'); // ['', 'ar', 'places-to-visit', ...]
  const first = segments[1];
  if (isLocale(first)) {
    const rest = '/' + segments.slice(2).join('/');
    return { locale: first, path: rest === '/' ? '/' : rest.replace(/\/+$/, '/') };
  }
  return { locale: null, path: pathname };
}

/**
 * Build a locale-prefixed app URL from a CMS content path.
 * `withLocale('ar', '/places-to-visit/x/')` → `/ar/places-to-visit/x/`
 * A leading slash on `path` is required (that's how Graph returns them).
 */
export function withLocale(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return clean === '/' ? `/${locale}` : `/${locale}${clean}`;
}

/**
 * The equivalent URL for the SAME content path in another locale — used by the
 * language switcher and by `hreflang` alternates (Sprint L5).
 */
export function alternateHref(pathname: string, target: Locale): string {
  const { path } = splitLocale(pathname);
  return withLocale(target, path);
}

/**
 * The CMS content path (`_metadata.url.default`) for a locale + the app's slug segments.
 * The CMS leaves the **default** locale's URLs unprefixed (`/places-to-visit/x/`) and gives
 * every other locale its own segment (`/ar/places-to-visit/x/`) — the Optimizely
 * master-language convention. The app always routes with a prefix (`/en/...` or `/ar/...`),
 * so this rebuilds the CMS-side path: drop the prefix for the default locale, keep it otherwise.
 * `segments = []` yields the home path (`/` for en, `/ar/` for ar).
 */
export function cmsContentPath(locale: Locale, segments: string[]): string {
  const joined = segments.filter(Boolean).join('/');
  const body = joined ? `${joined}/` : '';
  return locale === DEFAULT_LOCALE ? `/${body}` : `/${locale}/${body}`;
}

/**
 * Convert a CMS `url.default` to the locale-prefixed **app** path used for links.
 * The CMS leaves the default locale's URLs unprefixed (`/places-to-visit/x/`) and gives
 * others a segment (`/ar/places-to-visit/x/`), but every app link must carry the prefix —
 * so this adds `/en` for the default locale and leaves an existing `/ar` intact. Non-path
 * values (`#`, external URLs) pass through untouched.
 */
export function toAppPath(locale: Locale, cmsUrl: string): string {
  if (!cmsUrl.startsWith('/')) return cmsUrl;
  return withLocale(locale, splitLocale(cmsUrl).path);
}

/** Locale-aware date formatting. Replaces the 5 hardcoded `toLocaleDateString('en-GB')` sites. */
export function formatDate(locale: Locale, value: string | number | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString(htmlLang(locale), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
