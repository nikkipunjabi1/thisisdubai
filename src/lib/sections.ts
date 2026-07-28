import { cache } from 'react';
import { getClient } from '@optimizely/cms-sdk';
import { cachedGraphRead } from './cache';

/**
 * Generic "children of a section page" queries for the listing pattern. Each
 * section page (Neighbourhoods, Events…) renders its child content as cards; we
 * query by the page's own key (`_metadata.container`). Guarded so a Graph hiccup
 * degrades to an empty list. URLs are CMS-driven (`_metadata.url.default`).
 */
export type SectionCardItem = {
  name: string;
  summary: string | null;
  path: string;
  meta: string | null; // small contextual line (e.g. an event date range)
  /**
   * CDN URL of the item's lead image, if authored. Optional so callers that don't
   * (yet) project imagery — e.g. the search results query — still type-check and
   * simply fall back to the monogram card.
   */
  imageUrl?: string | null;
};

/** An authored image reference, resolved by Graph to a CMP/DAM CDN URL. */
type ImageRef = { url?: { default?: string | null } | null } | null;

type Node = {
  name?: string | null;
  summary?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  publishDate?: string | null;
  images?: ImageRef[] | null;
  heroImage?: ImageRef;
  _metadata?: { url?: { default?: string | null } | null } | null;
};

/**
 * The lead image for a card. POI/Event author a list (`images` — first one wins);
 * Area authors a single `heroImage`. Handles either shape so one card serves all.
 */
const leadImage = (node: Node): string | null =>
  node.images?.find((i) => i?.url?.default)?.url?.default ?? node.heroImage?.url?.default ?? null;

function toCard(node: Node, meta: string | null = null): SectionCardItem {
  return {
    name: node.name ?? 'Untitled',
    summary: node.summary ?? null,
    path: node._metadata?.url?.default ?? '#',
    meta,
    imageUrl: leadImage(node),
  };
}

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

function eventMeta(node: Node): string | null {
  const start = fmtDate(node.startDate);
  if (!start) return null;
  const end = fmtDate(node.endDate);
  return end && end !== start ? `${start} – ${end}` : start;
}

type AnyChild = Node & { priceBand?: string | null; _metadata?: { url?: { default?: string | null } | null; displayName?: string | null; types?: string[] | null } | null };

const priceMeta = (band?: string | null) => (band && band !== 'free' ? band : band === 'free' ? 'Free' : null);

/** Supported sorts (interface-level `_metadata` fields, so every child type sorts). */
export type SortKey = 'name' | '-name' | 'newest';
const ORDER_BY: Record<SortKey, string> = {
  name: '{ _metadata: { displayName: ASC } }',
  '-name': '{ _metadata: { displayName: DESC } }',
  newest: '{ _metadata: { created: DESC } }',
};
export const isSortKey = (v: string | undefined): v is SortKey => v === 'name' || v === '-name' || v === 'newest';

/** The concrete child type of a section (drives type-specific filters + fields). */
export type ChildType = 'PointOfInterest' | 'Area' | 'Event' | 'Article';
// Note the image field differs by type: POI/Event author a list (`images`), Area and
// Article a single `heroImage`. Both resolve to a CMP CDN URL via `url { default }`.
// Article also names its text fields differently (`title`/`excerpt`, which is what
// reads correctly for editorial), so they're ALIASED to name/summary here — that
// keeps one card component serving every section.
const TYPE_FIELDS: Record<ChildType, string> = {
  PointOfInterest: 'name summary priceBand images { url { default } }',
  Area: 'name summary heroImage { url { default } }',
  Event: 'name summary startDate endDate images { url { default } }',
  Article: 'name: title summary: excerpt publishDate heroImage { url { default } }',
};
/** Which facets each child type supports (drives the FilterControls UI). */
export const TYPE_FACETS: Record<ChildType, Array<'tag' | 'price'>> = {
  PointOfInterest: ['price', 'tag'],
  Event: ['tag'],
  Article: ['tag'],
  Area: [],
};

export type Filters = { tag?: string; price?: string }; // tag = slug, price = band
export type SectionChildrenPage = { items: SectionCardItem[]; total: number; childType: ChildType | null };

export type TagOption = { name: string; slug: string; key: string };

/** All taxonomy terms (name/slug/key), for the tag facet UI + slug→key resolution. */
export const getTags = cache(
  cachedGraphRead(async (): Promise<TagOption[]> => {
    try {
      const data = (await getClient().request(
        `query { TagTerm(orderBy: { name: ASC }, limit: 100) { items { name slug _metadata { key } } } }`,
        {},
      )) as { TagTerm?: { items?: Array<{ name?: string; slug?: string; _metadata?: { key?: string } }> } };
      return (data?.TagTerm?.items ?? [])
        .filter((t) => t.slug && t._metadata?.key)
        .map((t) => ({ name: t.name ?? t.slug!, slug: t.slug!, key: t._metadata!.key! }));
    } catch {
      return [];
    }
  }, ['tags']),
);

/** Detect the concrete child type of a section by peeking at one child. */
export const detectChildType = cache(
  cachedGraphRead(async (containerKey: string): Promise<ChildType | null> => {
    try {
      const data = (await getClient().request(
        `query($c: String!) { _Page(where: { _metadata: { container: { eq: $c } } }, limit: 1) { items { _metadata { types } } } }`,
        { c: containerKey },
      )) as { _Page?: { items?: Array<{ _metadata?: { types?: string[] } }> } };
      const types = data?._Page?.items?.[0]?._metadata?.types ?? [];
      return (['PointOfInterest', 'Area', 'Event', 'Article'] as ChildType[]).find((t) => types.includes(t)) ?? null;
    } catch {
      return null;
    }
  }, ['section-child-type']),
);

/**
 * Type-aware, server-paginated + FILTERED children query for the SectionListing
 * block — the listing engine for every section. It auto-detects the child type
 * (POI/Area/Event) so it can query the concrete type and apply type-specific facet
 * filters (`tags.key`, `priceBand`) that the `_Page` interface can't express.
 * Server-side sort + skip/limit + total. Guarded → empty page.
 */
export const getSectionChildren = cachedGraphRead(async function getSectionChildren(
  containerKey: string,
  {
    skip = 0,
    limit = 12,
    sort = 'name',
    filters = {},
  }: { skip?: number; limit?: number; sort?: SortKey; filters?: Filters } = {},
): Promise<SectionChildrenPage> {
  const childType = await detectChildType(containerKey);
  if (!childType) return { items: [], total: 0, childType: null };

  try {
    const orderBy = ORDER_BY[sort] ?? ORDER_BY.name; // controlled value — safe to inline
    const facets = TYPE_FACETS[childType];

    const wheres = ['_metadata: { container: { eq: $c } }'];
    const decls = ['$c: String!', '$skip: Int!', '$limit: Int!'];
    const vars: Record<string, unknown> = { c: containerKey, skip, limit };

    if (filters.tag && facets.includes('tag')) {
      const tagKey = (await getTags()).find((t) => t.slug === filters.tag)?.key;
      if (tagKey) {
        wheres.push('tags: { key: { eq: $tagKey } }');
        decls.push('$tagKey: String!');
        vars.tagKey = tagKey;
      }
    }
    if (filters.price && facets.includes('price')) {
      wheres.push('priceBand: { eq: $price }');
      decls.push('$price: String!');
      vars.price = filters.price;
    }

    const data = (await getClient().request(
      `query(${decls.join(', ')}) {
        ${childType}(where: { ${wheres.join(', ')} }, orderBy: ${orderBy}, skip: $skip, limit: $limit) {
          total
          items { _metadata { displayName url { default } types } ${TYPE_FIELDS[childType]} }
        }
      }`,
      vars,
    )) as Record<string, { total?: number; items?: AnyChild[] } | undefined>;

    const result = data?.[childType];
    const items = (result?.items ?? []).map((n) => {
      const meta =
        childType === 'Event'
          ? eventMeta(n)
          : childType === 'Article'
            ? fmtDate(n.publishDate)
            : priceMeta(n.priceBand);
      return toCard({ ...n, name: n.name ?? n._metadata?.displayName ?? 'Untitled' }, meta);
    });
    return { items, total: result?.total ?? items.length, childType };
  } catch {
    return { items: [], total: 0, childType };
  }
}, ['section-children']);
