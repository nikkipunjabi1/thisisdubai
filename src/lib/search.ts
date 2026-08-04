import { cache } from 'react';
import { getClient } from '@optimizely/cms-sdk';
import type { SectionCardItem } from './sections';
import { cachedGraphRead } from './cache';
import { graphLocale, htmlLang, toAppPath, withLocale, DEFAULT_LOCALE, type Locale } from './i18n';
import { t } from './messages';

/**
 * Semantic search over the CMS, powered by Optimizely Graph's vector ranking
 * (`_ranking: SEMANTIC`). One federated request queries every searchable section
 * type, so a single round-trip returns Places, Events and Neighbourhoods.
 *
 * Two deliberate design decisions, both established by measuring against real
 * content (see docs/AI-SEARCH.md):
 *
 * 1. **Per-type queries, not the `_Content` interface.** `_Content` also matches
 *    non-routable shared blocks — `TagTerm` scored 115 on "traditional culture and
 *    heritage" and would have topped the results with an unclickable card. Querying
 *    concrete types also lets us project type-specific fields (price, event dates).
 *
 * 2. **Stop words are stripped before querying** — see `normalizeQuery`. The
 *    stop-word set is per-locale: the English list must NOT be applied to an Arabic
 *    query (it wouldn't match Arabic tokens anyway, but Arabic has its OWN function
 *    words — في، من، على… — that hurt BM25 the same way "in"/"the" do in English).
 *
 * The query is federated PER LOCALE (`locale: en|ar` on every sub-query), so an
 * Arabic search ranks against the Arabic index; where a document has no Arabic
 * translation yet, Graph's English fallback keeps it findable.
 *
 * Scores are NOT comparable across types (Graph normalizes BM25 per index — the
 * same query scored an Area 13.7 and a POI 1.5), so results are returned GROUPED
 * by type and ranked within each group. Merging them into one list would invent a
 * ranking the data doesn't support.
 */

/** How much meaning-vs-keyword to blend. 0.5 favours meaning without ignoring exact terms. */
const SEMANTIC_WEIGHT = 0.5;
const DEFAULT_LIMIT = 12;

/**
 * Vector search always returns *nearest* neighbours, so a weak query still comes
 * back with a long tail of near-zero matches ("traditional heritage" returned hits
 * scoring 0.185, 0.039, 0.006, 0.003 — only the first is a real match).
 *
 * We drop anything scoring below this fraction of its group's TOP score. A relative
 * floor is used rather than an absolute one because Graph's scores are not on a fixed
 * scale — measured top scores ranged from 0.185 to 1538 across queries — and because
 * an absolute floor destroys good results: "swimming sea" scores its beaches at
 * 0.092/0.078, which any floor high enough to suppress noise would also delete.
 *
 * Known limitation: this trims tails, it does not detect nonsense. Most gibberish
 * ("asdfgh", "quantum blockchain accounting") already returns zero results, but a
 * near-miss token like "zzzzqqq" returns a flat spread of low scores that no relative
 * floor can distinguish. Worth re-tuning once there is substantially more content.
 */
const RELATIVE_SCORE_FLOOR = 0.1;

/**
 * Graph's `_fulltext` match is BM25-scored, and stop words wreck natural-language
 * queries: "swimming in the sea" ranked a historical district top (score 7.5) purely
 * because "in"/"the" matched, while the beaches it should surface scored ~0.2. BM25
 * magnitudes dwarf the semantic contribution, which is also why `_semanticWeight`
 * appears to have no effect on unfiltered queries. Removing stop words lets the
 * semantic signal decide: "swimming sea" → Jumeirah Beach + Palm Jumeirah.
 */
const STOP_WORDS_EN = new Set([
  'a', 'about', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'been', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'for', 'from', 'get', 'go', 'had', 'has', 'have', 'how',
  'i', 'if', 'in', 'into', 'is', 'it', 'its', 'me', 'my', 'of', 'on', 'or', 'our', 'out', 'over',
  'should', 'so', 'some', 'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they',
  'this', 'to', 'up', 'us', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'who', 'why',
  'will', 'with', 'would', 'you', 'your',
]);

/**
 * Arabic function words — prepositions, conjunctions, pronouns and interrogatives that
 * carry no topical meaning and would skew BM25 exactly as English stop words do. The
 * bare definite article "ال" is intentionally omitted: it's a prefix (الشاطئ = the
 * beach), not a standalone token, so listing it here would never match and stripping
 * it would need morphological analysis we don't do. Spelling variants with/without
 * hamza (إلى/الى, أو/او, أن/ان) are both listed since authors and users mix them.
 */
const STOP_WORDS_AR = new Set([
  'في', 'من', 'على', 'عن', 'إلى', 'الى', 'و', 'أو', 'او', 'ثم', 'مع', 'عند', 'حتى',
  'هذا', 'هذه', 'ذلك', 'تلك', 'التي', 'الذي', 'الذين', 'ما', 'ماذا', 'أين', 'اين',
  'كيف', 'متى', 'هل', 'كان', 'كانت', 'هو', 'هي', 'هم', 'نحن', 'أنا', 'انا', 'لا',
  'أن', 'ان', 'إن', 'ان', 'قد', 'كل', 'بعض', 'غير', 'بين', 'به', 'لها', 'له',
]);

const STOP_WORDS: Record<Locale, Set<string>> = { en: STOP_WORDS_EN, ar: STOP_WORDS_AR };

/**
 * Reduce a raw user query to its content words, using the locale's stop-word set.
 * Falls back to the original text if stripping would leave nothing (e.g. someone
 * searches literally for "where"), so a query never silently becomes a blank search.
 * `\p{L}` keeps Arabic letters, and `toLowerCase()` is a no-op on Arabic script.
 */
export function normalizeQuery(raw: string, locale: Locale = DEFAULT_LOCALE): string {
  const stop = STOP_WORDS[locale] ?? STOP_WORDS_EN;
  const words = raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const kept = words.filter((w) => !stop.has(w));
  return (kept.length > 0 ? kept : words).join(' ');
}

export type SearchGroupKey = 'places' | 'events' | 'neighbourhoods';

export type SearchGroup = {
  key: SearchGroupKey;
  label: string;
  /** Section landing page, so an author-visible "browse all" link stays CMS-driven. */
  href: string;
  items: SectionCardItem[];
};

export type SearchResults = {
  /** What the user typed. */
  query: string;
  /** What we actually sent to Graph (stop words removed). */
  normalizedQuery: string;
  groups: SearchGroup[];
  total: number;
};

/** Section landing paths (locale-neutral); `search()` prefixes them per locale. */
const GROUP_HREF: Record<SearchGroupKey, string> = {
  places: '/places-to-visit',
  events: '/events',
  neighbourhoods: '/neighbourhoods',
};

/** Group heading — reuses the nav labels so search + menu never drift. */
const groupLabel = (key: SearchGroupKey, m: ReturnType<typeof t>): string =>
  key === 'places' ? m.nav.places : key === 'events' ? m.nav.events : m.nav.neighbourhoods;

type ResultNode = {
  name?: string | null;
  summary?: string | null;
  priceBand?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  _score?: number | null;
  _metadata?: { displayName?: string | null; url?: { default?: string | null } | null } | null;
};

const fmtDate = (iso: string | null | undefined, locale: Locale) =>
  iso
    ? new Date(iso).toLocaleDateString(htmlLang(locale), { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

/** Small contextual line per result type — an event's dates, a place's price band. */
function metaFor(key: SearchGroupKey, node: ResultNode, locale: Locale): string | null {
  if (key === 'events') {
    const start = fmtDate(node.startDate, locale);
    if (!start) return null;
    const end = fmtDate(node.endDate, locale);
    return end && end !== start ? `${start} – ${end}` : start;
  }
  if (key === 'places') {
    const band = node.priceBand;
    if (!band) return null;
    return band === 'free' ? t(locale).listing.free : band;
  }
  return null;
}

/**
 * Federated semantic query, built per locale. The `locale:` arg on each sub-query
 * ranks against that language's index (Arabic content where translated, English
 * fallback otherwise). `graphLocale` yields the bare Graph enum (en/ar), so it's
 * interpolated — a GraphQL enum can't be passed as a String variable.
 */
const searchQuery = (locale: Locale) => `query($q: String!, $w: Float!, $limit: Int!) {
  places: PointOfInterest(locale: ${graphLocale(locale)}, where: { _fulltext: { match: $q } }, orderBy: { _ranking: SEMANTIC, _semanticWeight: $w }, limit: $limit) {
    items { name summary priceBand _score _metadata { displayName url { default } } }
  }
  events: Event(locale: ${graphLocale(locale)}, where: { _fulltext: { match: $q } }, orderBy: { _ranking: SEMANTIC, _semanticWeight: $w }, limit: $limit) {
    items { name summary startDate endDate _score _metadata { displayName url { default } } }
  }
  neighbourhoods: Area(locale: ${graphLocale(locale)}, where: { _fulltext: { match: $q } }, orderBy: { _ranking: SEMANTIC, _semanticWeight: $w }, limit: $limit) {
    items { name summary _score _metadata { displayName url { default } } }
  }
}`;

/**
 * Drop the low-relevance tail. Graph returns results already sorted by score, so the
 * first item sets the bar for the rest of its group.
 */
function dropWeakMatches(nodes: ResultNode[]): ResultNode[] {
  const top = nodes[0]?._score ?? 0;
  if (top <= 0) return nodes;
  return nodes.filter((node) => (node._score ?? 0) >= top * RELATIVE_SCORE_FLOOR);
}

/**
 * Run a semantic search across every section type. Guarded so a Graph hiccup
 * degrades to "no results" rather than a 500 — consistent with the listing engine.
 * Cached per request so metadata + page share one call.
 */
export const search = cache(
  cachedGraphRead(
    async (
      rawQuery: string,
      locale: Locale = DEFAULT_LOCALE,
      limit: number = DEFAULT_LIMIT,
    ): Promise<SearchResults> => {
      const query = rawQuery.trim();
      const normalizedQuery = normalizeQuery(query, locale);
      const empty: SearchResults = { query, normalizedQuery, groups: [], total: 0 };
      if (!normalizedQuery) return empty;

      const m = t(locale);
      try {
        const data = (await getClient().request(searchQuery(locale), {
          q: normalizedQuery,
          w: SEMANTIC_WEIGHT,
          limit,
        })) as Record<SearchGroupKey, { items?: ResultNode[] } | undefined>;

        const groups = (Object.keys(GROUP_HREF) as SearchGroupKey[])
          .map((key) => {
            // A result with no URL can't be navigated to — drop it rather than render
            // a dead card. Filter that BEFORE thresholding so an unroutable top hit
            // can't set the bar for everything else.
            const routable = (data?.[key]?.items ?? []).filter(
              (node) => node._metadata?.url?.default,
            );
            const items = dropWeakMatches(routable).map((node) => ({
              name: node.name ?? node._metadata?.displayName ?? 'Untitled',
              summary: node.summary ?? null,
              // CMS URLs are master-locale (unprefixed); prefix per locale so an
              // Arabic result links to /ar/… not the English page.
              path: toAppPath(locale, node._metadata!.url!.default!),
              meta: metaFor(key, node, locale),
            }));
            return { key, label: groupLabel(key, m), href: withLocale(locale, GROUP_HREF[key]), items };
          })
          .filter((group) => group.items.length > 0);

        return {
          query,
          normalizedQuery,
          groups,
          total: groups.reduce((sum, group) => sum + group.items.length, 0),
        };
      } catch {
        return empty;
      }
    },
    ['semantic-search'],
  ),
);

/** Type guard for a search group key — validates the `?in=` facet param from the URL. */
export function isGroupKey(value: string | undefined | null): value is SearchGroupKey {
  return value === 'places' || value === 'events' || value === 'neighbourhoods';
}

/** One entry in the result type-filter bar: a section, its label, and its result count. */
export type SearchFacet = { key: SearchGroupKey; label: string; count: number };

/**
 * Per-type result counts for the facet bar. Read this from the FULL results (before
 * `filterByType`), so each chip shows how many results that section has regardless of
 * which facet is currently selected.
 */
export function searchFacets(results: SearchResults): SearchFacet[] {
  return results.groups.map((group) => ({ key: group.key, label: group.label, count: group.items.length }));
}

/**
 * Narrow results to a single section type when a valid `?in=` facet is selected;
 * recomputes `total` for the narrowed set. An unset or invalid key returns the results
 * unchanged, so the default view still shows every group.
 */
export function filterByType(results: SearchResults, inKey: string | undefined | null): SearchResults {
  if (!isGroupKey(inKey)) return results;
  const groups = results.groups.filter((group) => group.key === inKey);
  return { ...results, groups, total: groups.reduce((sum, group) => sum + group.items.length, 0) };
}
