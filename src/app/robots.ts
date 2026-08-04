import type { MetadataRoute } from 'next';
import { config, getClient } from '@optimizely/cms-sdk';

/*
  Demo-safe robots.txt — blocks ALL crawlers BY DEFAULT so the Vercel demo is
  not indexed. The global switch is CMS-controlled (SiteSettings.allowSearchIndexing),
  with an env fallback, and fails closed:

    CMS SiteSettings.allowSearchIndexing === true → allow
    env  SITE_INDEXABLE === 'true'               → allow
    anything else / any error                    → block all (safe default)

  See docs/SEO.md. Per-page noindex/nofollow is handled in page metadata (S2.7).
*/
export const dynamic = 'force-dynamic';

// Configure the Graph client ONLY when a key is actually present. Without one
// (e.g. CI / a build with no secrets) we skip config entirely and fail closed
// below — no dummy key, and the SDK never throws on an empty key at module load.
const graphApiKey = process.env.OPTIMIZELY_GRAPH_SINGLE_KEY;
if (graphApiKey) {
  config({ apiKey: graphApiKey, graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY });
}

async function indexingAllowed(): Promise<boolean> {
  if (process.env.SITE_INDEXABLE === 'true') return true;
  if (!graphApiKey) return false; // no Graph key → can't check the CMS switch → fail closed
  try {
    const client = getClient();
    const data = (await client.request(
      `query { SiteConfiguration(limit: 1) { items { allowSearchIndexing } } }`,
      {},
    )) as { SiteConfiguration?: { items?: Array<{ allowSearchIndexing?: boolean }> } };
    return Boolean(data?.SiteConfiguration?.items?.[0]?.allowSearchIndexing);
  } catch {
    return false; // fail closed — never accidentally allow crawling
  }
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  if (!(await indexingAllowed())) {
    // Block everything.
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  const host = process.env.APPLICATION_HOST?.replace(/\/$/, '');
  return {
    // `/admin` lists unpublished content and `/preview` serves it, so both stay
    // disallowed even when the site itself is indexable. Belt and braces: each also
    // sends `noindex` (page metadata + the proxy's X-Robots-Tag).
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/preview'] }],
    sitemap: host ? `${host}/sitemap.xml` : undefined,
  };
}
