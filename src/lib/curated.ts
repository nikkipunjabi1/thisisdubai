import { getClient } from '@optimizely/cms-sdk';
import { cachedGraphRead } from './cache';
import { articleHref } from './articles';
import type { SectionCardItem } from './sections';
import { graphLocale, htmlLang, toAppPath, DEFAULT_LOCALE, type Locale } from './i18n';

/**
 * Curated content for the "Things to Do" campaign rails. A rail shows a small, hand-tuned
 * set of existing content (Places / Neighbourhoods / Events / Articles) chosen one of three
 * ways: the LATEST N, everything under a TAG, or a HAND-PICKED list. This is the read half
 * of the CuratedContentRail block; the block itself only maps author config → these args.
 *
 * Deliberately separate from `sections.ts` (which lists a section's *children* by container
 * path): here the items can come from anywhere in the tree, so we query the concrete type
 * directly with an optional tag filter, and never touch `_metadata.path`.
 */

/** The author-facing content collections a rail can pull from. */
export type CuratedType = 'places' | 'neighbourhoods' | 'events' | 'articles';
/** How the rail chooses its items. */
export type CuratedSource = 'latest' | 'tag' | 'handpicked';

/** A card plus its CMS key, so hand-picked results can be re-sorted to the author's order. */
export type CuratedCardItem = SectionCardItem & { key: string | null };

type TypeDef = {
  graphType: 'PointOfInterest' | 'Area' | 'Event' | 'ArticlePost';
  /** Field projection for a card. Always includes `_metadata { key url { default } }`. */
  fields: string;
  /** Only POI / Event / Article carry `tags` (Area does not). */
  hasTags: boolean;
};

const TYPES: Record<CuratedType, TypeDef> = {
  places: {
    graphType: 'PointOfInterest',
    fields: 'name summary images { url { default } } _metadata { key url { default } }',
    hasTags: true,
  },
  neighbourhoods: {
    graphType: 'Area',
    fields: 'name summary heroImage { url { default } } _metadata { key url { default } }',
    hasTags: false,
  },
  events: {
    graphType: 'Event',
    fields: 'name summary startDate endDate images { url { default } } _metadata { key url { default } }',
    hasTags: true,
  },
  articles: {
    // Article is a shared BLOCK with editorial field names (title/excerpt), aliased to the
    // common card shape; it has no CMS URL, so its href is synthesized from slug + publishDate.
    graphType: 'ArticlePost',
    fields: 'name: title summary: excerpt publishDate slug heroImage { url { default } } _metadata { key url { default } }',
    hasTags: true,
  },
};

type RawImage = { url?: { default?: string | null } | null } | null;
type RawNode = {
  name?: string | null;
  summary?: string | null;
  images?: RawImage[] | null;
  heroImage?: RawImage;
  startDate?: string | null;
  endDate?: string | null;
  publishDate?: string | null;
  slug?: string | null;
  _metadata?: { key?: string | null; url?: { default?: string | null } | null } | null;
};

const leadImage = (n: RawNode): string | null =>
  n.images?.find((i) => i?.url?.default)?.url?.default ?? n.heroImage?.url?.default ?? null;

const fmtDate = (iso: string | null | undefined, locale: Locale): string | null =>
  iso
    ? new Date(iso).toLocaleDateString(htmlLang(locale), { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

function eventMeta(n: RawNode, locale: Locale): string | null {
  const start = fmtDate(n.startDate, locale);
  if (!start) return null;
  const end = fmtDate(n.endDate, locale);
  return end && end !== start ? `${start} – ${end}` : start;
}

function toCard(n: RawNode, type: CuratedType, locale: Locale): CuratedCardItem {
  const name = n.name ?? 'Untitled';
  let path = toAppPath(locale, n._metadata?.url?.default ?? '#');
  let meta: string | null = null;
  if (type === 'articles') {
    path = articleHref(n.slug ?? '', n.publishDate, locale);
    meta = fmtDate(n.publishDate, locale);
  } else if (type === 'events') {
    meta = eventMeta(n, locale);
  }
  return { name, summary: n.summary ?? null, path, meta, imageUrl: leadImage(n), key: n._metadata?.key ?? null };
}

export type CuratedArgs = {
  type: CuratedType;
  source: CuratedSource;
  count: number;
  /** Tag `_metadata.key` (from the rail's tag reference), used when `source === 'tag'`. */
  tagKey?: string | null;
  /** Content keys, used when `source === 'handpicked'`. */
  keys?: string[];
};

/**
 * Fetch the cards for one rail. Guarded so a Graph hiccup or a misconfigured rail degrades
 * to an empty list (the block then renders nothing) rather than throwing the page.
 */
export const getCuratedItems = cachedGraphRead(async function getCuratedItems(
  { type, source, count, tagKey, keys = [] }: CuratedArgs,
  locale: Locale = DEFAULT_LOCALE,
): Promise<CuratedCardItem[]> {
  const def = TYPES[type];
  if (!def) return [];
  const limit = Math.min(Math.max(Math.trunc(count) || 4, 1), 12);

  try {
    const wheres: string[] = [];
    const decls: string[] = ['$limit: Int!'];
    const vars: Record<string, unknown> = { limit };

    if (source === 'handpicked') {
      if (!keys.length) return [];
      wheres.push('_metadata: { key: { in: $keys } }');
      decls.push('$keys: [String!]!');
      vars.keys = keys;
    } else if (source === 'tag') {
      // Area has no tags — a tag rail over Neighbourhoods just falls back to "latest".
      if (def.hasTags && tagKey) {
        wheres.push('tags: { key: { eq: $tagKey } }');
        decls.push('$tagKey: String!');
        vars.tagKey = tagKey;
      }
    }

    const whereClause = wheres.length ? `where: { ${wheres.join(', ')} }, ` : '';
    // "Latest" = newest created first; hand-picked is re-sorted to author order below.
    const data = (await getClient().request(
      `query(${decls.join(', ')}) {
        ${def.graphType}(locale: ${graphLocale(locale)}, ${whereClause}orderBy: { _metadata: { created: DESC } }, limit: $limit) {
          items { ${def.fields} }
        }
      }`,
      vars,
    )) as Record<string, { items?: RawNode[] } | undefined>;

    let items = (data?.[def.graphType]?.items ?? []).map((n) => toCard(n, type, locale));

    if (source === 'handpicked' && keys.length) {
      const order = new Map(keys.map((k, i) => [k, i]));
      items = items.sort((a, b) => (order.get(a.key ?? '') ?? 999) - (order.get(b.key ?? '') ?? 999));
    }
    return items.slice(0, limit);
  } catch {
    return [];
  }
}, ['curated-items']);
