import { cache } from 'react';
import { cookies, draftMode } from 'next/headers';
import { GraphClient, getClient, type GraphSlot } from '@optimizely/cms-sdk';
import { verifyShareToken, type SharePayload } from './preview-token';
import { PREVIEW_SCOPE_COOKIE } from './preview-access';

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

// Canonical home is the edge-safe preview-access module (the proxy needs it too); re-export
// so existing server-side importers keep their `@/lib/draft` import path.
export { PREVIEW_SCOPE_COOKIE };

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
 * Keep only the versions whose OWN url is the page being rendered.
 *
 * This is both the locale filter and the scope check, and it has to be applied per row.
 * `_metadata.locale` cannot be trusted for either job: under super-user auth one item's
 * versions report inconsistent locales, and a version whose `url.default` is the Arabic
 * path can be labelled `en`. The URL is the reliable discriminator, because the routing
 * model already gives every locale variant its own path.
 *
 * The earlier version of this picked one representative row's url and compared that,
 * which silently rendered published content whenever the representative row happened to
 * be another locale's version.
 */
export function rowsOnPath(rows: VersionRow[], path: string): VersionRow[] {
  const target = normalizePath(path);
  return rows.filter((r) => r.url && normalizePath(r.url) === target);
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

const VERSIONS_QUERY = `query DraftVersions($key: String!) {
  _Content(
    where: {
      _metadata: {
        key: { eq: $key }
        status: { notIn: ["Previous"] }
      }
    }
    limit: 50
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
 * Fetch every non-superseded version of the scoped item, ALL locales.
 *
 * Deliberately unfiltered by locale. Neither way of asking Graph for one locale is
 * trustworthy here: the query's `locale` argument does not narrow versions at all under
 * super-user auth, and `_metadata.locale` in the `where` clause is inconsistent per
 * version (an item can have a version whose `url.default` is the Arabic path while its
 * metadata says `en`). `rowsOnPath` does the narrowing instead, on the one field that is
 * reliable. Superseded history is still excluded server-side to keep this small.
 */
async function fetchVersions(key: string): Promise<VersionRow[]> {
  const data = (await getDraftClient().request(VERSIONS_QUERY, { key })) as VersionsResponse;

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
 * The draft content for whatever the share link is scoped to, regardless of whether that
 * item has a CMS URL.
 *
 * `getDraftContentByPath` matches on `url.default`, which only works for content the CMS
 * gives a URL. High-volume content modelled as shared BLOCKS (articles here, see
 * docs/CONTENT-ARCHITECTURE.md) has no CMS URL at all: the app owns their routing. For
 * those, the URL cannot be the scope check, so this returns the scoped draft and leaves
 * the caller to confirm it is the item being rendered (by slug, say). The caller MUST do
 * that check: without it, one article's link would preview every article.
 *
 * Locale is narrowed with the token's own locale where the rows agree, and left alone when
 * they do not, since version locale metadata is not reliable (see `rowsOnPath`).
 */
export const getScopedDraftContent = cache(async (): Promise<Record<string, unknown> | null> => {
  const scope = await getDraftScope();
  if (!scope) return null;

  try {
    const rows = await fetchVersions(scope.key);
    const forLocale = rows.filter((r) => r.locale === scope.locale);
    const chosen = selectDraftVersion(forLocale.length > 0 ? forLocale : rows, scope.version);
    if (!chosen) return null;

    const content = await getDraftClient().getContent({ key: scope.key, version: chosen.version });
    return (content as Record<string, unknown>) ?? null;
  } catch (error) {
    console.error('[preview] scoped draft read failed, falling back to published content:', error);
    return null;
  }
});

/** A routable item with unpublished edits — one row in the admin UI's picker. */
export type DraftItem = {
  key: string;
  displayName: string;
  locale: string;
  version: string;
  lastModified: string;
  /** CMS path (`url.default`), locale-prefixed for non-default locales. */
  url: string;
};

/**
 * Every ROUTABLE item that currently has an unpublished draft, newest edit first.
 *
 * `types eq "_page"` is the right filter even though it reads narrow: experiences carry
 * both `_Experience` AND `_Page`, so one `eq` covers pages and experiences, while
 * excluding shared blocks, taxonomy terms, folders and media. (`types` supports `eq`;
 * an `in: [...]` list silently matches nothing, so don't reach for it.)
 *
 * Admin-only — this enumerates unpublished content and must never be exposed to a
 * reviewer or to the public site. Graph caps `limit` at 100.
 */
const DRAFT_ITEMS_QUERY = `query DraftItems {
  _Content(
    where: { _metadata: { types: { eq: "_page" }, status: { eq: "Draft" } } }
    orderBy: { _metadata: { lastModified: DESC } }
    limit: 100
  ) {
    items {
      _metadata {
        key
        displayName
        locale
        version
        lastModified
        url { default }
      }
    }
    total
  }
}`;

export async function listDraftItems(): Promise<{ items: DraftItem[]; total: number }> {
  const data = (await getDraftClient().request(DRAFT_ITEMS_QUERY, {})) as {
    _Content?: {
      total?: number;
      items?: {
        _metadata?: {
          key?: string;
          displayName?: string;
          locale?: string;
          version?: string;
          lastModified?: string;
          url?: { default?: string };
        };
      }[];
    };
  };

  const items = (data?._Content?.items ?? []).flatMap((item): DraftItem[] => {
    const m = item._metadata;
    if (!m?.key || !m.version || !m.url?.default) return [];
    return [
      {
        key: m.key,
        displayName: m.displayName ?? '(untitled)',
        locale: m.locale ?? '',
        version: m.version,
        lastModified: m.lastModified ?? '',
        url: m.url.default,
      },
    ];
  });

  return { items, total: data?._Content?.total ?? items.length };
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
  async (path: string): Promise<unknown[] | null> => {
    const scope = await getDraftScope();
    if (!scope) return null;

    try {
      const rows = await fetchVersions(scope.key);

      // Scope enforcement AND locale selection in one step: keep only the versions whose
      // own url is this page. A reviewer who navigated elsewhere matches nothing and gets
      // the published site; the other locale's versions of the same item drop out too.
      const candidates = rowsOnPath(rows, path);
      if (candidates.length === 0) return null;

      const chosen = selectDraftVersion(candidates, scope.version);
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
