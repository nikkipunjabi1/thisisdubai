import { cache } from 'react';
import { getClient } from '@optimizely/cms-sdk';
import type { SectionCardItem } from './sections';
import { cachedGraphRead } from './cache';

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
 * 2. **Stop words are stripped before querying** — see `normalizeQuery`.
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
const STOP_WORDS = new Set([
  'a', 'about', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'been', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'for', 'from', 'get', 'go', 'had', 'has', 'have', 'how',
  'i', 'if', 'in', 'into', 'is', 'it', 'its', 'me', 'my', 'of', 'on', 'or', 'our', 'out', 'over',
  'should', 'so', 'some', 'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they',
  'this', 'to', 'up', 'us', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'who', 'why',
  'will', 'with', 'would', 'you', 'your',
]);

/**
 * Reduce a raw user query to its content words. Falls back to the original text if
 * stripping would leave nothing (e.g. someone searches literally for "where"), so a
 * query never silently becomes a blank search.
 */
export function normalizeQuery(raw: string): string {
  const words = raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const kept = words.filter((w) => !STOP_WORDS.has(w));
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

const GROUP_META: Record<SearchGroupKey, { label: string; href: string }> = {
  places: { label: 'Places to Visit', href: '/places-to-visit' },
  events: { label: 'Events', href: '/events' },
  neighbourhoods: { label: 'Neighbourhoods', href: '/neighbourhoods' },
};

type ResultNode = {
  name?: string | null;
  summary?: string | null;
  priceBand?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  _score?: number | null;
  _metadata?: { displayName?: string | null; url?: { default?: string | null } | null } | null;
};

const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

/** Small contextual line per result type — an event's dates, a place's price band. */
function metaFor(key: SearchGroupKey, node: ResultNode): string | null {
  if (key === 'events') {
    const start = fmtDate(node.startDate);
    if (!start) return null;
    const end = fmtDate(node.endDate);
    return end && end !== start ? `${start} – ${end}` : start;
  }
  if (key === 'places') {
    const band = node.priceBand;
    if (!band) return null;
    return band === 'free' ? 'Free' : band;
  }
  return null;
}

const SEARCH_QUERY = `query($q: String!, $w: Float!, $limit: Int!) {
  places: PointOfInterest(where: { _fulltext: { match: $q } }, orderBy: { _ranking: SEMANTIC, _semanticWeight: $w }, limit: $limit) {
    items { name summary priceBand _score _metadata { displayName url { default } } }
  }
  events: Event(where: { _fulltext: { match: $q } }, orderBy: { _ranking: SEMANTIC, _semanticWeight: $w }, limit: $limit) {
    items { name summary startDate endDate _score _metadata { displayName url { default } } }
  }
  neighbourhoods: Area(where: { _fulltext: { match: $q } }, orderBy: { _ranking: SEMANTIC, _semanticWeight: $w }, limit: $limit) {
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
  cachedGraphRead(async (rawQuery: string, limit: number = DEFAULT_LIMIT): Promise<SearchResults> => {
    const query = rawQuery.trim();
    const normalizedQuery = normalizeQuery(query);
    const empty: SearchResults = { query, normalizedQuery, groups: [], total: 0 };
    if (!normalizedQuery) return empty;

    try {
      const data = (await getClient().request(SEARCH_QUERY, {
        q: normalizedQuery,
        w: SEMANTIC_WEIGHT,
        limit,
      })) as Record<SearchGroupKey, { items?: ResultNode[] } | undefined>;

      const groups = (Object.keys(GROUP_META) as SearchGroupKey[])
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
            path: node._metadata!.url!.default!,
            meta: metaFor(key, node),
          }));
          return { key, ...GROUP_META[key], items };
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
  }, ['semantic-search']),
);
