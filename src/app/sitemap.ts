import type { MetadataRoute } from 'next';
import { config } from '@optimizely/cms-sdk';
import { getSitemapPaths } from '@/lib/seo';
import { getAllArticleParams } from '@/lib/articles';
import { LOCALES, DEFAULT_LOCALE, htmlLang, withLocale } from '@/lib/i18n';

/*
  Bilingual sitemap — one entry per content path, each carrying `hreflang`
  alternates for every locale (+ `x-default` → the default locale via the entry's
  own `url`). Search engines use these to serve the right language and to avoid
  treating `/en/…` and `/ar/…` as duplicates. A translated page shares its path
  under the `/ar` prefix, so the AR twin is derived, not separately queried.

  Advertised to crawlers by `robots.ts` ONLY when indexing is allowed (the demo is
  blocked by default), so this staying live is harmless. URLs must be absolute, so
  the whole sitemap is gated on APPLICATION_HOST.
*/
export const dynamic = 'force-dynamic';

// Configure Graph only when a key is present (mirrors robots.ts) — a build with no
// secrets must not throw at module load; getSitemapPaths then degrades to just home.
const graphApiKey = process.env.OPTIMIZELY_GRAPH_SINGLE_KEY;
if (graphApiKey) {
  config({ apiKey: graphApiKey, graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = process.env.APPLICATION_HOST?.replace(/\/$/, '');
  if (!host) return []; // hreflang URLs must be absolute — nothing useful without a host

  // Page/experience paths from Graph, plus article app routes (articles are shared
  // blocks with no CMS URL, so their routes are synthesized from publishDate + slug).
  const [pagePaths, articleParams] = await Promise.all([getSitemapPaths(), getAllArticleParams()]);
  const articlePaths = articleParams.map(({ year, month, slug }) => `/articles/${year}/${month}/${slug}`);
  const barePaths = [...new Set([...pagePaths, ...articlePaths])];

  return barePaths.map((bare) => ({
    // `url` doubles as the x-default target — point it at the default locale.
    url: `${host}${withLocale(DEFAULT_LOCALE, bare)}`,
    changeFrequency: 'weekly',
    alternates: {
      languages: Object.fromEntries(
        LOCALES.map((loc) => [htmlLang(loc), `${host}${withLocale(loc, bare)}`]),
      ),
    },
  }));
}
