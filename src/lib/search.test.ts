import { describe, it, expect } from 'vitest';
import {
  normalizeQuery,
  isGroupKey,
  searchFacets,
  filterByType,
  type SearchResults,
} from './search';

/**
 * Stop-word stripping is what makes semantic ranking usable: BM25 scores on
 * stop words dwarf the semantic signal, so "swimming in the sea" ranked a
 * historical district above every beach until "in"/"the" were removed.
 */
describe('normalizeQuery', () => {
  it('removes stop words from a natural-language query', () => {
    expect(normalizeQuery('swimming in the sea')).toBe('swimming sea');
    expect(normalizeQuery('where can I see the tallest tower')).toBe('see tallest tower');
  });

  it('keeps meaningful words untouched', () => {
    expect(normalizeQuery('traditional heritage')).toBe('traditional heritage');
  });

  it('lowercases and collapses punctuation and whitespace', () => {
    expect(normalizeQuery('  Rooftop,   DINING!  ')).toBe('rooftop dining');
  });

  it('preserves hyphenated and numeric terms', () => {
    expect(normalizeQuery('family-friendly beaches')).toBe('family-friendly beaches');
    expect(normalizeQuery('top 10 views')).toBe('top 10 views');
  });

  it('falls back to the original words when a query is ALL stop words', () => {
    // Otherwise searching "where to go" would silently become a blank query.
    expect(normalizeQuery('where to go')).toBe('where to go');
  });

  it('returns an empty string for empty input', () => {
    expect(normalizeQuery('   ')).toBe('');
  });

  it('does not strip Arabic content words when defaulting to the English set', () => {
    // English stop words never match Arabic tokens, so an AR query is safe even
    // without passing the locale — nothing is lost.
    expect(normalizeQuery('السباحة في البحر')).toBe('السباحة في البحر');
  });

  it('strips Arabic function words when the AR locale is passed', () => {
    // "في" (in) is an Arabic stop word; the content words survive.
    expect(normalizeQuery('السباحة في البحر', 'ar')).toBe('السباحة البحر');
    expect(normalizeQuery('أين المطاعم على السطح', 'ar')).toBe('المطاعم السطح');
  });

  it('falls back to the original words when an AR query is ALL stop words', () => {
    expect(normalizeQuery('في من على', 'ar')).toBe('في من على');
  });
});

/**
 * Result type-facets (the `?in=` filter on /search). The counts must come from the
 * FULL result set and filtering must recompute the total, so the chip bar stays
 * stable while the displayed groups narrow.
 */
const sampleResults = (): SearchResults => ({
  query: 'beach',
  normalizedQuery: 'beach',
  total: 5,
  groups: [
    { key: 'places', label: 'Places to Visit', href: '/places-to-visit', items: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] as never },
    { key: 'neighbourhoods', label: 'Neighbourhoods', href: '/neighbourhoods', items: [{ name: 'D' }, { name: 'E' }] as never },
  ],
});

describe('isGroupKey', () => {
  it('accepts valid section keys', () => {
    expect(isGroupKey('places')).toBe(true);
    expect(isGroupKey('events')).toBe(true);
    expect(isGroupKey('neighbourhoods')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isGroupKey('hotels')).toBe(false);
    expect(isGroupKey('')).toBe(false);
    expect(isGroupKey(undefined)).toBe(false);
    expect(isGroupKey(null)).toBe(false);
  });
});

describe('searchFacets', () => {
  it('reports per-type counts and labels from the full result set', () => {
    expect(searchFacets(sampleResults())).toEqual([
      { key: 'places', label: 'Places to Visit', count: 3 },
      { key: 'neighbourhoods', label: 'Neighbourhoods', count: 2 },
    ]);
  });
});

describe('filterByType', () => {
  it('narrows to the selected type and recomputes the total', () => {
    const filtered = filterByType(sampleResults(), 'places');
    expect(filtered.groups.map((g) => g.key)).toEqual(['places']);
    expect(filtered.total).toBe(3);
  });

  it('returns results unchanged for an unset or invalid facet', () => {
    const full = sampleResults();
    expect(filterByType(full, undefined)).toEqual(full);
    expect(filterByType(full, 'hotels')).toEqual(full);
    expect(filterByType(full, '')).toEqual(full);
  });

  it('leaves the facet counts of the full set intact (filter does not mutate)', () => {
    const full = sampleResults();
    filterByType(full, 'places');
    expect(searchFacets(full)).toHaveLength(2);
    expect(full.total).toBe(5);
  });
});
