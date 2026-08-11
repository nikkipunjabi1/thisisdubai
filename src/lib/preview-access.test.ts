import { describe, it, expect } from 'vitest';
import {
  readTokenMode,
  parseAllowList,
  isInternalAccessAllowed,
  type PreviewMode,
} from './preview-access';

/** Build a token whose payload carries `mode` (signature is irrelevant to readTokenMode). */
function tokenWithMode(mode?: PreviewMode | string): string {
  const payload: Record<string, unknown> = { key: 'k', locale: 'en', version: 'latest', exp: 1 };
  if (mode !== undefined) payload.mode = mode;
  return `${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature-ignored`;
}

describe('readTokenMode (unverified payload decode)', () => {
  it('reads an explicit shareable mode', () => {
    expect(readTokenMode(tokenWithMode('shareable'))).toBe('shareable');
  });

  it('reads an explicit internal mode', () => {
    expect(readTokenMode(tokenWithMode('internal'))).toBe('internal');
  });

  it('fails safe to internal for a legacy token with no mode', () => {
    expect(readTokenMode(tokenWithMode(undefined))).toBe('internal');
  });

  it('fails safe to internal for an unknown mode value', () => {
    expect(readTokenMode(tokenWithMode('public'))).toBe('internal');
  });

  it('fails safe to internal for null / empty / malformed tokens', () => {
    expect(readTokenMode(null)).toBe('internal');
    expect(readTokenMode('')).toBe('internal');
    expect(readTokenMode('not-base64url.$$$')).toBe('internal');
  });
});

describe('parseAllowList', () => {
  it('splits, trims and drops empties', () => {
    expect(parseAllowList(' 1.2.3.4 , 5.6.7.8 ,')).toEqual(['1.2.3.4', '5.6.7.8']);
  });
  it('returns [] for undefined / empty', () => {
    expect(parseAllowList(undefined)).toEqual([]);
    expect(parseAllowList('')).toEqual([]);
  });
});

describe('isInternalAccessAllowed (strictly allowlist-only, no localhost bypass)', () => {
  const allowList = ['154.16.203.12'];

  it('allows an allowlisted client IP (left-most x-forwarded-for entry)', () => {
    expect(
      isInternalAccessAllowed({ xff: '154.16.203.12, 10.0.0.1', xreal: null, allowList }),
    ).toBe(true);
  });

  it('blocks an off-network client IP', () => {
    expect(isInternalAccessAllowed({ xff: '203.0.113.9', xreal: null, allowList })).toBe(false);
  });

  it('ignores a spoofed allowlisted IP that is not the left-most (client) hop', () => {
    // The platform edge puts the real client first; a trailing match must not pass.
    expect(
      isInternalAccessAllowed({ xff: '203.0.113.9, 154.16.203.12', xreal: null, allowList }),
    ).toBe(false);
  });

  it('blocks a direct/local connection (treated as 127.0.0.1) unless loopback is allowlisted', () => {
    // No proxy hop → resolves to 127.0.0.1, which is NOT auto-allowed anymore.
    expect(isInternalAccessAllowed({ xff: null, xreal: null, allowList })).toBe(false);
    expect(isInternalAccessAllowed({ xff: '127.0.0.1', xreal: null, allowList })).toBe(false);
    // ...but works once 127.0.0.1 is explicitly added (the documented local-preview path).
    expect(
      isInternalAccessAllowed({ xff: null, xreal: null, allowList: ['127.0.0.1'] }),
    ).toBe(true);
    expect(
      isInternalAccessAllowed({ xff: '127.0.0.1', xreal: null, allowList: ['127.0.0.1'] }),
    ).toBe(true);
  });

  it('fails safe: an empty allowlist blocks everything, including loopback', () => {
    expect(isInternalAccessAllowed({ xff: '203.0.113.9', xreal: null, allowList: [] })).toBe(false);
    expect(isInternalAccessAllowed({ xff: null, xreal: null, allowList: [] })).toBe(false);
    expect(isInternalAccessAllowed({ xff: '127.0.0.1', xreal: null, allowList: [] })).toBe(false);
  });

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    expect(isInternalAccessAllowed({ xff: null, xreal: '154.16.203.12', allowList })).toBe(true);
    expect(isInternalAccessAllowed({ xff: null, xreal: '203.0.113.9', allowList })).toBe(false);
  });
});
