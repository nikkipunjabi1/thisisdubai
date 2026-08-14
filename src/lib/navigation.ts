import { cache } from 'react';
import { getClient } from '@optimizely/cms-sdk';
import { graphLocale, toAppPath, LOCALES, type Locale } from './i18n';

/**
 * Reads the CMS-editable header/footer navigation and header chrome (search toggle, language
 * name) from the Site Settings block, locale-aware. The model lives in
 * src/components/content/Navigation.tsx; rendering is SiteHeader.tsx / SiteFooter.tsx.
 *
 * A link points at a PAGE picked from the content tree; we read that reference's own
 * `url.default` and run it through `toAppPath` so the href is correct for the active locale
 * (and keeps working if the page is moved/renamed). `externalUrl` is the off-site escape
 * hatch. Empty lists are returned as-is so the caller can fall back to its built-in default.
 *
 * Published-only (single delivery key), which is what the live site should render.
 */

export type ResolvedLink = { label: string; href: string; external: boolean; newTab: boolean };
export type HeaderItem = {
  label: string;
  href: string | null; // null = a dropdown-only parent (no destination of its own)
  external: boolean;
  newTab: boolean;
  children: ResolvedLink[];
};
export type FooterColumn = { heading: string | null; links: ResolvedLink[] };
export type SiteChrome = {
  headerMenu: HeaderItem[];
  footerGroups: FooterColumn[];
  showSearch: boolean;
};

type RawLink = {
  label?: string | null;
  externalUrl?: string | null;
  openInNewTab?: boolean | null;
  page?: { url?: { default?: string | null } | null } | null;
};
type RawMenuItem = RawLink & { children?: RawLink[] | null };
type RawGroup = { heading?: string | null; links?: RawLink[] | null };
type RawSettings = {
  showSearch?: boolean | null;
  headerMenu?: RawMenuItem[] | null;
  footerGroups?: RawGroup[] | null;
};

/** Title-case the last path segment, as a last-resort label when none was authored. */
function labelFromHref(href: string): string {
  const seg = href.replace(/[/?#].*$/, '').split('/').filter(Boolean).pop() ?? '';
  const words = seg.replace(/[-_]+/g, ' ').trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Link';
}

/** Resolve one raw link to an href (external wins over page); null when it points nowhere. */
function resolveLink(raw: RawLink, locale: Locale): ResolvedLink | null {
  const external = (raw.externalUrl ?? '').trim();
  const pageUrl = raw.page?.url?.default ?? '';
  const href = external || (pageUrl ? toAppPath(locale, pageUrl) : '');
  if (!href) return null;
  const label = (raw.label ?? '').trim() || labelFromHref(href);
  return { label, href, external: Boolean(external), newTab: Boolean(raw.openInNewTab) };
}

const CHROME_QUERY = (locale: Locale) => `query {
  SiteConfiguration(locale: ${graphLocale(locale)}, limit: 1) {
    items {
      showSearch
      headerMenu {
        label externalUrl openInNewTab page { url { default } }
        children { label externalUrl openInNewTab page { url { default } } }
      }
      footerGroups {
        heading
        links { label externalUrl openInNewTab page { url { default } } }
      }
    }
  }
}`;

/**
 * Header + footer nav and the search toggle for `locale`. Deduped per request. Returns empty
 * lists (not defaults) when unconfigured, so SiteHeader/SiteFooter apply their own fallback.
 */
export const getSiteChrome = cache(async (locale: Locale): Promise<SiteChrome> => {
  const empty: SiteChrome = { headerMenu: [], footerGroups: [], showSearch: true };
  try {
    const data = (await getClient().request(CHROME_QUERY(locale), {})) as {
      SiteConfiguration?: { items?: RawSettings[] };
    };
    const s = data?.SiteConfiguration?.items?.[0];
    if (!s) return empty;

    const headerMenu: HeaderItem[] = (s.headerMenu ?? [])
      .map((item): HeaderItem | null => {
        const children = (item.children ?? [])
          .map((c) => resolveLink(c, locale))
          .filter((c): c is ResolvedLink => c !== null);
        const self = resolveLink(item, locale);
        // Keep an item if it links somewhere OR is a dropdown parent; drop empties.
        if (!self && children.length === 0) return null;
        return {
          label: (item.label ?? '').trim() || self?.label || 'Menu',
          href: self?.href ?? null,
          external: self?.external ?? false,
          newTab: self?.newTab ?? false,
          children,
        };
      })
      .filter((i): i is HeaderItem => i !== null);

    const footerGroups: FooterColumn[] = (s.footerGroups ?? [])
      .map((g): FooterColumn => ({
        heading: (g.heading ?? '').trim() || null,
        links: (g.links ?? []).map((l) => resolveLink(l, locale)).filter((l): l is ResolvedLink => l !== null),
      }))
      .filter((g) => g.links.length > 0);

    return { headerMenu, footerGroups, showSearch: s.showSearch ?? true };
  } catch {
    return empty;
  }
});

/**
 * The language NAME for every locale, in its own script, from each locale version's
 * `languageSwitchLabel`. The switcher on locale X shows the OTHER locales' names from here.
 * Falls back to a built-in native name when unset.
 */
const NATIVE_NAME: Record<Locale, string> = { en: 'English', ar: 'العربية' };

export const getLanguageLabels = cache(async (): Promise<Record<Locale, string>> => {
  const labels = { ...NATIVE_NAME };
  await Promise.all(
    LOCALES.map(async (l) => {
      try {
        const data = (await getClient().request(
          `query { SiteConfiguration(locale: ${graphLocale(l)}, limit: 1) { items { languageSwitchLabel } } }`,
          {},
        )) as { SiteConfiguration?: { items?: Array<{ languageSwitchLabel?: string | null }> } };
        const v = (data?.SiteConfiguration?.items?.[0]?.languageSwitchLabel ?? '').trim();
        if (v) labels[l] = v;
      } catch {
        // keep the native-name fallback for this locale
      }
    }),
  );
  return labels;
});
