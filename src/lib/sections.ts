import { cache } from 'react';
import { getClient } from '@optimizely/cms-sdk';
import { cachedGraphRead } from './cache';
import { articleHref } from './articles';

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
  slug?: string | null;
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
export type ChildType = 'PointOfInterest' | 'Area' | 'Event' | 'ArticlePost';
// Note the image field differs by type: POI/Event author a list (`images`), Area and
// ArticlePost a single `heroImage`. Both resolve to a CMP CDN URL via `url { default }`.
// ArticlePost is a shared BLOCK (no CMS URL) with editorial field names (`title`/`excerpt`,
// ALIASED to name/summary) — plus `slug`/`publishDate`, from which the card's href is
// synthesized (articleHref). One card component still serves every section.
const TYPE_FIELDS: Record<ChildType, string> = {
  PointOfInterest: 'name summary priceBand images { url { default } }',
  Area: 'name summary heroImage { url { default } }',
  Event: 'name summary startDate endDate images { url { default } }',
  ArticlePost: 'name: title summary: excerpt publishDate slug heroImage { url { default } }',
};
/** Which facets each child type supports (drives the FilterControls UI). */
export const TYPE_FACETS: Record<ChildType, Array<'tag' | 'price'>> = {
  PointOfInterest: ['price', 'tag'],
  Event: ['tag'],
  ArticlePost: ['tag'],
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

/**
 * Detect the concrete child type of a section by peeking at one descendant.
 *
 * Matches on `_metadata.path` (the ancestor chain) rather than `container` (the
 * direct parent), so it still works when items are bucketed into folders — see
 * docs/CONTENT-ARCHITECTURE.md §10. Verified: `container` finds only direct
 * children, `path` finds everything beneath the section.
 */
export const detectChildType = cache(
  cachedGraphRead(async (containerKey: string): Promise<ChildType | null> => {
    try {
      // NOTE: `_metadata.path` is the ancestor chain INCLUDING SELF, so this query
      // always returns the section experience itself among the results. We therefore
      // fetch a handful and take the first item whose types name a known child type —
      // taking `limit: 1` here silently returns the section and detects nothing,
      // which empties every listing.
      const data = (await getClient().request(
        `query($c: String!) { _Page(where: { _metadata: { path: { eq: $c } } }, limit: 5) { items { _metadata { types } } } }`,
        { c: containerKey },
      )) as { _Page?: { items?: Array<{ _metadata?: { types?: string[] } }> } };
      const known: ChildType[] = ['PointOfInterest', 'Area', 'Event'];
      for (const item of data?._Page?.items ?? []) {
        const hit = known.find((t) => (item._metadata?.types ?? []).includes(t));
        if (hit) return hit;
      }
      // Block-backed sections (Articles): the experience parents no pages — its items are
      // `ArticlePost` shared blocks (in the Assets panel, not the tree). Detect by the
      // source's OWN type. See docs/CONTENT-ARCHITECTURE.md §10.
      const src = (await getClient().request(
        `query($c: String!) { _Content(where: { _metadata: { key: { eq: $c } } }, limit: 1) { items { _metadata { types } } } }`,
        { c: containerKey },
      )) as { _Content?: { items?: Array<{ _metadata?: { types?: string[] } }> } };
      if ((src?._Content?.items?.[0]?._metadata?.types ?? []).includes('Articles')) return 'ArticlePost';
      return null;
    } catch {
      return null;
    }
  }, ['section-child-type']),
);

/**
 * Type-aware, server-paginated + FILTERED descendants query for the SectionListing
 * block — the listing engine for every section. It auto-detects the child type
 * (POI/Area/Event/Article) so it can query the concrete type and apply type-specific
 * facet filters (`tags.key`, `priceBand`) that the `_Page` interface can't express.
 * Matches DESCENDANTS via `_metadata.path`, so folder bucketing is transparent.
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

    // Page-based sections match DESCENDANTS by `_metadata.path` (ancestor chain). Article
    // BLOCKS aren't under the section in the content tree (they live in the Assets panel),
    // so for `ArticlePost` we query the type directly — no path filter. See §10.
    const wheres: string[] = [];
    const decls = ['$skip: Int!', '$limit: Int!'];
    const vars: Record<string, unknown> = { skip, limit };
    if (childType !== 'ArticlePost') {
      wheres.push('_metadata: { path: { eq: $c } }');
      decls.push('$c: String!');
      vars.c = containerKey;
    }

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

    const whereClause = wheres.length ? `where: { ${wheres.join(', ')} }, ` : '';
    const data = (await getClient().request(
      `query(${decls.join(', ')}) {
        ${childType}(${whereClause}orderBy: ${orderBy}, skip: $skip, limit: $limit) {
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
          : childType === 'ArticlePost'
            ? fmtDate(n.publishDate)
            : priceMeta(n.priceBand);
      const card = toCard({ ...n, name: n.name ?? n._metadata?.displayName ?? 'Untitled' }, meta);
      // Blocks have no CMS URL — build the article href from slug + publishDate.
      if (childType === 'ArticlePost') card.path = articleHref(n.slug ?? '', n.publishDate);
      return card;
    });
    return { items, total: result?.total ?? items.length, childType };
  } catch {
    return { items: [], total: 0, childType };
  }
}, ['section-children']);
