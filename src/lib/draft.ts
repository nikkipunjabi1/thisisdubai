import { cache } from 'react';
import { cookies, draftMode } from 'next/headers';
import { GraphClient, getClient, type GraphSlot } from '@optimizely/cms-sdk';
import { verifyShareToken, type SharePayload } from './preview-token';
import { graphLocale, type Locale } from './i18n';

/**
 * Draft (unpublished) content reads for the stakeholder preview module — Layer 2,
 * Phase 3 (docs/PREVIEW-WORKFLOW.md).
 *
 * SERVER ONLY. Reads OPTIMIZELY_GRAPH_APP_KEY / OPTIMIZELY_GRAPH_SECRET, which are
 * effectively super-user on Graph (they read unpublished content and can write the
 * index). They must never reach the browser: nothing here may be imported from a
 * client component, and no value derived from them is ever sent to the client.
 *
 * ## How a draft read is authorized
 * Two independent things must both be true before we serve unpublished content:
 *   1. Next.js **Draft Mode** is on (the `__prerender_bypass` cookie), and
 *   2. the companion `__preview_share` cookie holds a **valid, unexpired signed token**
 *      (src/lib/preview-token.ts) whose `key` matches the content being rendered.
 * Draft Mode alone is deliberately not enough — the signed token is what scopes a
 * shared link to ONE content item, so a reviewer who wanders to another page sees the
 * normal published site.
 *
 * ## Why a custom client
 * `@optimizely/cms-sdk` v2 authenticates Graph as either `epi-single <key>` (published
 * content only) or `Bearer <previewToken>` (the CMS editor's ~5-minute token). Neither
 * works for a durable, login-free link, so `DraftGraphClient` overrides `request()` to
 * authenticate with `Basic base64(appKey:secret)` — verified against the live instance:
 * it returns Draft/Previous versions that the single key cannot see. Everything else
 * (query generation, content-type resolution, response shaping) still comes from the
 * SDK, because those methods call `this.request`.
 *
 * ## Why draft reads are never cached
 * `cachedGraphRead` (`unstable_cache`) is keyed on path alone and shared across all
 * visitors — caching a draft there would leak unpublished content onto the public site.
 * Draft reads go straight to Graph with `cache=false` and are deduped only WITHIN a
 * request via React `cache()`.
 */

/** Cookie holding the signed share token, so a page can tell WHICH item is in scope. */
export const PREVIEW_SCOPE_COOKIE = '__preview_share';

/** Statuses that are not the draft we want: the live version and its superseded history. */
const PUBLISHED_STATUSES = new Set(['Published', 'Previous']);

function basicAuthHeader(): string {
  const appKey = process.env.OPTIMIZELY_GRAPH_APP_KEY;
  const secret = process.env.OPTIMIZELY_GRAPH_SECRET;
  // Fail closed: without both halves we do NOT silently fall back to the single key,
  // which would render published content while claiming to show a draft.
  if (!appKey || !secret) {
    throw new Error(
      'OPTIMIZELY_GRAPH_APP_KEY / OPTIMIZELY_GRAPH_SECRET are not set — refusing to attempt a draft read.',
    );
  }
  return `Basic ${Buffer.from(`${appKey}:${secret}`).toString('base64')}`;
}

/**
 * A GraphClient that authenticates with the super-user App key + Secret instead of the
 * published-only single key. Only `request()` changes; every higher-level SDK method
 * routes through it, so `getContent()` returns the SDK's usual shaped content object.
 */
class DraftGraphClient extends GraphClient {
  override async request(
    query: string,
    variables: unknown,
    _previewToken?: string,
    _cache?: boolean,
    slot?: GraphSlot,
  ): Promise<unknown> {
    const url = new URL(this.graphUrl);
    // Never let Graph serve a cached response for a draft: the whole point is that the
    // reviewer sees what the author saved seconds ago.
    url.searchParams.append('cache', 'false');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': this.userAgent,
      Authorization: basicAuthHeader(),
    };
    if (slot === 'New') headers['cg-query-new'] = 'true';

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
      cache: 'no-store',
    });

    const json = (await response.json().catch(() => null)) as {
      data?: unknown;
      errors?: unknown[];
    } | null;

    if (!response.ok) {
      throw new Error(`Optimizely Graph draft read failed (HTTP ${response.status}).`);
    }
    if (json?.errors?.length) {
      // Errors can echo the query but never the Authorization header, so this is safe
      // to log server-side; it's the only way to debug a draft-only schema mismatch.
      throw new Error(`Optimizely Graph draft read returned errors: ${JSON.stringify(json.errors).slice(0, 400)}`);
    }
    return json?.data;
  }
}

/**
 * The draft client, mirroring the published client's Graph URL and query-generation
 * settings so both produce identical queries — only the credential differs.
 */
const getDraftClient = cache((): DraftGraphClient => {
  const published = getClient();
  return new DraftGraphClient('', {
    graphUrl: published.graphUrl,
    maxFragmentThreshold: published.maxFragmentThreshold,
    expandContracts: published.expandContracts,
    host: published.host,
    cache: false,
  });
});

/** One row of `GET versions` metadata — the shape the version picker reasons about. */
export type VersionRow = {
  version: string;
  status: string;
  locale: string;
  lastModified?: string;
  url?: string;
};

/**
 * Choose which version a preview link should render.
 *
 * `requestedVersion === 'latest'` (the default) means "whatever is unpublished right
 * now", so re-edits after the link was sent stay visible without reissuing it. Anything
 * else pins a frozen snapshot.
 *
 * Selection is by STATUS, never by version number: the live instance has a Draft at
 * version 1377 sitting alongside the Published 1378, so "highest number wins" picks the
 * published version and the preview silently shows nothing new.
 *
 * Returns null when there is nothing unpublished to show — the caller then renders the
 * normal published page, which is the honest result for an item with no pending edits.
 */
export function selectDraftVersion(rows: VersionRow[], requestedVersion: string): VersionRow | null {
  if (requestedVersion && requestedVersion !== 'latest') {
    return rows.find((r) => r.version === requestedVersion) ?? null;
  }
  const unpublished = rows.filter((r) => !PUBLISHED_STATUSES.has(r.status));
  if (unpublished.length === 0) return null;
  // Newest edit wins. `lastModified` is an ISO-8601 UTC string, so lexicographic
  // comparison is chronological.
  return unpublished.reduce((newest, r) =>
    (r.lastModified ?? '') > (newest.lastModified ?? '') ? r : newest,
  );
}

/** Trailing slashes vary between our route paths and Graph's `url.default`. */
function normalizePath(path: string): string {
  const trimmed = path.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

/**
 * The verified share token for this request, or null when the visitor is on the normal
 * published site. Deduped per request: the page and `generateMetadata` both ask.
 */
export const getDraftScope = cache(async (): Promise<SharePayload | null> => {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return null;

  const token = (await cookies()).get(PREVIEW_SCOPE_COOKIE)?.value;
  if (!token) return null;

  try {
    const result = verifyShareToken(token);
    return result.ok ? result.payload : null;
  } catch {
    // Thrown only when PREVIEW_SIGNING_SECRET is unset (fail-closed).
    return null;
  }
});

const VERSIONS_QUERY = `query DraftVersions($key: String!, $locale: String!) {
  _Content(
    where: {
      _metadata: {
        key: { eq: $key }
        locale: { eq: $locale }
        status: { notIn: ["Previous"] }
      }
    }
    limit: 20
  ) {
    items {
      _metadata {
        key
        version
        status
        locale
        lastModified
        url { default }
      }
    }
  }
}`;

type VersionsResponse = {
  _Content?: {
    items?: {
      _metadata?: {
        version?: string;
        status?: string;
        locale?: string;
        lastModified?: string;
        url?: { default?: string };
      };
    }[];
  };
};

/**
 * Fetch the non-superseded versions of the scoped item.
 *
 * Filtering by `_metadata.locale` (not the query's `locale` argument) is deliberate:
 * under super-user auth the `locale` argument does NOT narrow which versions come back
 * — a Burj Khalifa lookup returns the `en` and `ar` versions interleaved — so the
 * `where` clause is the only reliable locale filter. Same trap the SEO script hit.
 */
async function fetchVersions(key: string, locale: Locale): Promise<VersionRow[]> {
  const data = (await getDraftClient().request(VERSIONS_QUERY, {
    key,
    locale: graphLocale(locale),
  })) as VersionsResponse;

  return (data?._Content?.items ?? []).flatMap((item) => {
    const m = item._metadata;
    if (!m?.version || !m.status) return [];
    return [
      {
        version: m.version,
        status: m.status,
        locale: m.locale ?? '',
        lastModified: m.lastModified,
        url: m.url?.default,
      },
    ];
  });
}

/**
 * The unpublished content for `path`, or null to fall back to the published read.
 *
 * Returns null (i.e. "render the normal page") when any of these hold, so the site
 * degrades to published content rather than erroring:
 *   - the visitor is not in a valid, unexpired preview link;
 *   - the page being rendered is not the item the link was scoped to;
 *   - the scoped item has no unpublished version;
 *   - the Graph draft read fails (misconfigured credentials, schema drift).
 */
export const getDraftContentByPath = cache(
  async (path: string, locale: Locale): Promise<unknown[] | null> => {
    const scope = await getDraftScope();
    if (!scope) return null;

    try {
      const rows = await fetchVersions(scope.key, locale);
      if (rows.length === 0) return null;

      // Scope enforcement: the link previews ONE item. If the reviewer navigated
      // somewhere else, the URLs won't match and they get the published site.
      const scopedUrl = rows.find((r) => r.url)?.url;
      if (!scopedUrl || normalizePath(scopedUrl) !== normalizePath(path)) return null;

      const chosen = selectDraftVersion(rows, scope.version);
      if (!chosen) return null;

      const content = await getDraftClient().getContent({
        key: scope.key,
        version: chosen.version,
      });
      // `getContentByPath` hands callers an array; match it so pages branch on one shape.
      return content ? [content] : null;
    } catch (error) {
      // Never 500 a preview: log for the operator, show published content to the viewer.
      console.error('[preview] draft read failed, falling back to published content:', error);
      return null;
    }
  },
);
