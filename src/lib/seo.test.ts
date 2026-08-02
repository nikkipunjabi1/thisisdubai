import { describe, it, expect } from 'vitest';
import { localeAlternates } from './seo';

/**
 * hreflang/canonical correctness is what stops search engines treating `/en/…` and
 * `/ar/…` as duplicate content. The path normalization matters: callers pass raw slug
 * joins (and occasionally a CMS `/ar/…` url), all of which must reduce to the same
 * locale-neutral path so every locale's alternate lines up.
 */
describe('localeAlternates', () => {
  it('emits a self-referencing canonical in the current locale', () => {
    expect(localeAlternates('ar', '/places-to-visit/burj-khalifa').canonical).toBe(
      '/ar/places-to-visit/burj-khalifa',
    );
    expect(localeAlternates('en', '/places-to-visit/burj-khalifa').canonical).toBe(
      '/en/places-to-visit/burj-khalifa',
    );
  });

  it('emits one hreflang per locale plus an x-default → the default locale', () => {
    const { languages } = localeAlternates('en', '/events');
    expect(languages).toEqual({
      'en-GB': '/en/events',
      'ar-AE': '/ar/events',
      'x-default': '/en/events',
    });
  });

  it('normalizes the home path', () => {
    expect(localeAlternates('en', '/')).toEqual({
      canonical: '/en',
      languages: { 'en-GB': '/en', 'ar-AE': '/ar', 'x-default': '/en' },
    });
  });

  it('strips a trailing slash so alternates never double up', () => {
    expect(localeAlternates('en', '/neighbourhoods/').canonical).toBe('/en/neighbourhoods');
  });

  it('reduces a locale-prefixed input to the shared path (idempotent)', () => {
    // A CMS `/ar/…` url or an app `/en/…` path must both collapse to the same twin set.
    expect(localeAlternates('ar', '/ar/events').languages).toEqual({
      'en-GB': '/en/events',
      'ar-AE': '/ar/events',
      'x-default': '/en/events',
    });
  });
});
