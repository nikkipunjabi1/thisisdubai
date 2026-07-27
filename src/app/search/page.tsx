import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionShell } from '@/components/ui/SectionShell';
import { SectionCardGrid } from '@/components/content/SectionCard';
import { SearchBox } from '@/components/ui/SearchBox';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { search } from '@/lib/search';
import { getSiteSettings, buildPageTitle } from '@/lib/seo';

/**
 * /search — semantic search results, 100% server-rendered and URL-driven (`?q=`).
 * Matching runs on Optimizely Graph's vector ranking, so queries match on MEANING:
 * "skyscraper" finds Burj Khalifa and "fish tank" finds The Dubai Mall, even though
 * neither word appears in the content.
 *
 * Results are grouped by section because Graph scores aren't comparable across types
 * (see src/lib/search.ts). Search result pages are `noindex` per docs/SEO.md — they're
 * thin/duplicate content and shouldn't be crawled.
 */

type Props = { searchParams: Promise<{ q?: string | string[] }>; };

const readQuery = (q: string | string[] | undefined) =>
  (Array.isArray(q) ? q[0] : q ?? '').trim();

/** Queries that show off semantic matching against the seeded content. */
const SUGGESTIONS = ['skyscraper', 'fish tank', 'traditional heritage', 'swimming sea'];

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = readQuery((await searchParams).q);
  const settings = await getSiteSettings();
  return {
    title: {
      absolute: buildPageTitle(settings, query ? `Search: ${query}` : 'Search'),
    },
    description: 'Search places to visit, events and neighbourhoods across This is Dubai.',
    // Search results are thin/duplicate content — never index them (docs/SEO.md §7).
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const query = readQuery((await searchParams).q);
  const results = query ? await search(query) : null;

  return (
    <>
      <Breadcrumbs
        crumbs={[
          { name: 'Home', url: '/' },
          { name: 'Search', url: null },
        ]}
      />
      <SectionShell theme="dark" spacing="spacious">
        <header className="max-w-3xl">
          <p className="eyebrow">Search</p>
          <h1 className="mt-4 text-[clamp(2.5rem,6vw,4.5rem)]">
            {query ? 'Results' : 'What are you looking for?'}
          </h1>
          <p className="mt-6 text-xl text-muted">
            Powered by Optimizely Graph&rsquo;s semantic search — it matches on meaning, not just
            keywords.
          </p>
        </header>

        <div className="mt-10 max-w-3xl">
          <SearchBox defaultValue={query} autoFocus={!query} />
        </div>

        {/* No query yet — invite the user in with queries that demonstrate semantics. */}
        {!results ? (
          <div className="mt-10 max-w-3xl">
            <p className="text-sm text-muted">Try one of these:</p>
            <ul className="mt-4 flex flex-wrap gap-3">
              {SUGGESTIONS.map((s) => (
                <li key={s}>
                  <Link
                    href={`/search?q=${encodeURIComponent(s)}`}
                    className="inline-block rounded-full border border-line px-4 py-2 text-sm text-fg transition hover:border-accent hover:text-accent"
                  >
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {results && results.total === 0 ? (
          <div className="mt-12 max-w-3xl border-t border-line pt-10">
            <p className="text-2xl">
              No matches for <span className="text-accent">&ldquo;{results.query}&rdquo;</span>.
            </p>
            <p className="mt-4 text-muted">
              Try fewer or more general words — or browse{' '}
              <Link href="/places-to-visit" className="text-accent hover:underline">
                Places to Visit
              </Link>
              ,{' '}
              <Link href="/events" className="text-accent hover:underline">
                Events
              </Link>{' '}
              and{' '}
              <Link href="/neighbourhoods" className="text-accent hover:underline">
                Neighbourhoods
              </Link>
              .
            </p>
          </div>
        ) : null}

        {results && results.total > 0 ? (
          <div className="mt-12 space-y-16">
            <p className="text-sm text-muted">
              {results.total} {results.total === 1 ? 'result' : 'results'} for{' '}
              <span className="text-fg">&ldquo;{results.query}&rdquo;</span>
            </p>
            {results.groups.map((group) => (
              <section key={group.key} aria-labelledby={`results-${group.key}`}>
                <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4 border-t border-line pt-8">
                  <h2 id={`results-${group.key}`} className="text-3xl md:text-4xl">
                    {group.label}
                    <span className="ml-3 align-middle text-base text-muted">
                      {group.items.length}
                    </span>
                  </h2>
                  <Link
                    href={group.href}
                    className="text-sm font-medium text-accent transition hover:translate-x-0.5"
                  >
                    Browse all {group.label} →
                  </Link>
                </div>
                <SectionCardGrid items={group.items} />
              </section>
            ))}
          </div>
        ) : null}
      </SectionShell>
    </>
  );
}
