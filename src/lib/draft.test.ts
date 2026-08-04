import { describe, it, expect } from 'vitest';
import { selectDraftVersion, rowsOnPath, type VersionRow } from './draft';

/**
 * The version picker is the one piece of draft logic with real branching, and the one
 * that quietly breaks the whole feature when it's wrong: pick the published version and
 * the reviewer sees a "draft" that is identical to the live page.
 *
 * The fixtures mirror the real instance (Burj Khalifa, 2026-08-04): a Draft at version
 * 1377 sitting alongside the Published 1378, i.e. version numbers do NOT order by
 * recency or by status.
 */
const row = (over: Partial<VersionRow>): VersionRow => ({
  version: '1',
  status: 'Draft',
  locale: 'en',
  lastModified: '2026-01-01T00:00:00.000Z',
  ...over,
});

const DRAFT = row({ version: '1377', status: 'Draft', lastModified: '2026-08-04T07:45:11.078Z' });
const PUBLISHED = row({ version: '1378', status: 'Published', lastModified: '2026-08-03T13:48:06.226Z' });

describe('selectDraftVersion', () => {
  it("picks the unpublished version for 'latest', even when its number is lower", () => {
    expect(selectDraftVersion([DRAFT, PUBLISHED], 'latest')?.version).toBe('1377');
  });

  it('is order-independent', () => {
    expect(selectDraftVersion([PUBLISHED, DRAFT], 'latest')?.version).toBe('1377');
  });

  it('returns null when nothing is unpublished, so the caller renders the live page', () => {
    expect(selectDraftVersion([PUBLISHED], 'latest')).toBeNull();
  });

  it('ignores superseded history', () => {
    const previous = row({ version: '999', status: 'Previous', lastModified: '2026-08-05T00:00:00.000Z' });
    expect(selectDraftVersion([previous, PUBLISHED], 'latest')).toBeNull();
  });

  it('picks the most recently edited unpublished version', () => {
    const older = row({ version: '1300', status: 'Draft', lastModified: '2026-07-01T00:00:00.000Z' });
    const inReview = row({ version: '1310', status: 'Ready', lastModified: '2026-08-04T09:00:00.000Z' });
    expect(selectDraftVersion([older, DRAFT, inReview], 'latest')?.version).toBe('1310');
  });

  it('pins an explicit version for a frozen snapshot, published or not', () => {
    expect(selectDraftVersion([DRAFT, PUBLISHED], '1378')?.version).toBe('1378');
  });

  it('returns null when a pinned version is gone', () => {
    expect(selectDraftVersion([DRAFT, PUBLISHED], '404')).toBeNull();
  });

  it('returns null for an empty version list', () => {
    expect(selectDraftVersion([], 'latest')).toBeNull();
  });
});

/**
 * Regression fixture from the live instance (AYA Universe, 2026-08-04). One item's
 * versions report DIFFERENT urls and an unreliable `locale`: the first row is the
 * Arabic path but is labelled `en`.
 *
 * The original code picked one representative row's url and compared that to the page
 * being rendered. With this ordering the representative was the `/ar/…` row, the scope
 * check failed, and the preview silently rendered published content. Locale filtering
 * and scope enforcement both have to be per row, on the url.
 */
const AYA: VersionRow[] = [
  { version: '1485', status: 'Published', locale: 'en', lastModified: '2026-08-03T13:48:31.717Z', url: '/ar/places-to-visit/aya-universe/' },
  { version: '1484', status: 'Draft', locale: 'en', lastModified: '2026-08-04T10:39:27.797Z', url: '/places-to-visit/aya-universe/' },
  { version: '1040', status: 'Draft', locale: 'en', lastModified: '2026-07-29T11:18:49.463Z', url: '/places-to-visit/aya-universe/' },
  { version: '1485', status: 'Published', locale: 'en', lastModified: '2026-08-03T13:48:31.717Z', url: '/places-to-visit/aya-universe/' },
];

describe('rowsOnPath', () => {
  it("keeps only the requested page's versions when another locale's url sorts first", () => {
    const rows = rowsOnPath(AYA, '/places-to-visit/aya-universe/');
    expect(rows.map((r) => r.version)).toEqual(['1484', '1040', '1485']);
  });

  it('selects the newest draft for that page (the end-to-end regression)', () => {
    expect(selectDraftVersion(rowsOnPath(AYA, '/places-to-visit/aya-universe/'), 'latest')?.version).toBe('1484');
  });

  it('narrows to the other locale by url alone, despite every row claiming locale en', () => {
    const rows = rowsOnPath(AYA, '/ar/places-to-visit/aya-universe/');
    expect(rows.map((r) => r.version)).toEqual(['1485']);
    // No unpublished version on the Arabic path, so the reviewer gets the live page.
    expect(selectDraftVersion(rows, 'latest')).toBeNull();
  });

  it('tolerates trailing-slash differences between route paths and Graph urls', () => {
    expect(rowsOnPath(AYA, '/places-to-visit/aya-universe')).toHaveLength(3);
  });

  it('matches nothing when the reviewer navigates to another page (scope enforcement)', () => {
    expect(rowsOnPath(AYA, '/places-to-visit/somewhere-else/')).toEqual([]);
  });

  it('ignores rows with no url', () => {
    expect(rowsOnPath([{ version: '1', status: 'Draft', locale: 'en' }], '/x/')).toEqual([]);
  });

  it('treats the site root consistently', () => {
    const home: VersionRow[] = [{ version: '9', status: 'Draft', locale: 'en', url: '/' }];
    expect(rowsOnPath(home, '/')).toHaveLength(1);
  });
});
