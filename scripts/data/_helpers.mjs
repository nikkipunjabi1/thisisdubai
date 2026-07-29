// Shared property-shape helpers for the seed data modules.
//
// Every CMA property value is wrapped in `{ value: … }`. The shapes below were
// each confirmed against the live API — see docs/CONTENT-ARCHITECTURE.md
// §"Writing content via the CMA" for the failures that pinned them down.

import { createHash } from 'node:crypto';

export const keyFor = (slug) => createHash('md5').update(slug).digest('hex');

/** Scalar, array or url property. A url is written as a plain string. */
export const S = (value) => ({ value });

/**
 * Rich text. The CMA rejects both a bare HTML string ("Expected object with an
 * 'html' property") and a pre-built node tree — it wants `{ html }`, and parses
 * the markup into its own node tree server-side. Graph then returns BOTH
 * `body { html }` and `body { json }`, and the SDK's <RichText> renders the json.
 */
export const RT = (html) => ({ value: { html } });

// Namespaced content keys. The original md5(<slug>) keys were trashed by an early
// migration cascade and a trashed key can never be re-created, so every type gets
// its own namespace.
export const areaKey = (slug) => keyFor(`area:${slug}`);
export const poiKey = (slug) => keyFor(`poi:${slug}`);
export const eventKey = (slug) => keyFor(`event:${slug}`);
export const tagKey = (slug) => keyFor(`tagblock:${slug}`);
export const articleKey = (slug) => keyFor(`article:${slug}`); // LEGACY `_page` Article instances
// Article shared blocks (ArticlePost `_component`) — see docs/CONTENT-ARCHITECTURE.md §10.
export const articleBlockKey = (slug) => keyFor(`articleblock:${slug}`);

/** Single content reference → an Area. */
export const REF = (slug) => ({ value: `cms://content/${areaKey(slug)}` });

/** List of content references → Tag shared blocks. */
export const TAGREFS = (slugs) => ({ value: slugs.map((s) => `cms://content/${tagKey(s)}`) });

/**
 * Build a PointOfInterest seed record. Keeping the call sites declarative means the
 * data files below read as content, not as plumbing — and every POI is forced to
 * carry a summary AND a body, which is what the listing cards and detail pages need.
 */
export function poi(slug, displayName, { name, summary, body, area, tags = [], lat, lng, priceBand, openingHours, accolades }) {
  return {
    slug,
    displayName,
    tagSlugs: tags, // raw slugs, so the seed can denormalize tag vocab into `searchKeywords`
    props: {
      name: S(name ?? displayName),
      summary: S(summary),
      body: RT(body),
      ...(area ? { area: REF(area) } : {}),
      ...(tags.length ? { tags: TAGREFS(tags) } : {}),
      ...(lat != null ? { latitude: S(lat) } : {}),
      ...(lng != null ? { longitude: S(lng) } : {}),
      ...(priceBand ? { priceBand: S(priceBand) } : {}),
      ...(openingHours ? { openingHours: S(openingHours) } : {}),
      ...(accolades?.length ? { accolades: S(accolades) } : {}),
    },
  };
}

/** Build an Event seed record. `startDate` is required by the content type. */
export function event(slug, displayName, { name, summary, body, startDate, endDate, area, tags = [], ticketUrl }) {
  return {
    slug,
    displayName,
    tagSlugs: tags, // raw slugs, so the seed can denormalize tag vocab into `searchKeywords`
    props: {
      name: S(name ?? displayName),
      summary: S(summary),
      body: RT(body),
      startDate: S(startDate),
      ...(endDate ? { endDate: S(endDate) } : {}),
      ...(area ? { area: REF(area) } : {}),
      ...(tags.length ? { tags: TAGREFS(tags) } : {}),
      ...(ticketUrl ? { ticketUrl: S(ticketUrl) } : {}),
    },
  };
}

/** List of content references → Points of Interest (an Article's `relatedPlaces`). */
export const POIREFS = (slugs) => ({ value: slugs.map((s) => `cms://content/${poiKey(s)}`) });

/**
 * Build an Article seed record. Note the field names differ from the other types —
 * `title`/`excerpt` rather than `name`/`summary`, because that is what reads
 * correctly for editorial. The listing query aliases them (src/lib/sections.ts).
 */
export function article(slug, displayName, { title, excerpt, body, author, publishDate, tags = [], relatedPlaces = [] }) {
  return {
    slug,
    displayName,
    props: {
      slug: S(slug), // drives the app URL /articles/<year>/<month>/<slug> (blocks have no CMS URL)
      title: S(title ?? displayName),
      excerpt: S(excerpt),
      body: RT(body),
      ...(author ? { author: S(author) } : {}),
      ...(publishDate ? { publishDate: S(publishDate) } : {}),
      ...(tags.length ? { tags: TAGREFS(tags) } : {}),
      ...(relatedPlaces.length ? { relatedPlaces: POIREFS(relatedPlaces) } : {}),
    },
  };
}

/** Build an Area (neighbourhood) seed record. Note: the rich text field is `description`. */
export function area(slug, displayName, { name, summary, description, lat, lng }) {
  return {
    slug,
    displayName,
    props: {
      name: S(name ?? displayName),
      summary: S(summary),
      description: RT(description),
      ...(lat != null ? { latitude: S(lat) } : {}),
      ...(lng != null ? { longitude: S(lng) } : {}),
    },
  };
}
