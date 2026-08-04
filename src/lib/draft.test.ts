import { describe, it, expect } from 'vitest';
import { selectDraftVersion, type VersionRow } from './draft';

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
