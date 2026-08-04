import { describe, it, expect } from 'vitest';
import { decodeCmsPreviewToken, isPlausibleCmsPreviewToken } from './cms-preview-token';

/**
 * Fixture shaped like a real CMS `preview_token` (captured from the editor, values
 * scrubbed): HS256 JWT, `iss`/`aud` of `graph`, a service `sub`, an `appKey` naming the
 * Graph application, and a 300-second window.
 */
const APP_KEY = 'test-app-key';
const NOW = 1_785_840_000;

function makeToken(claims: Record<string, unknown>): string {
  const part = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${part({ alg: 'HS256', typ: 'JWT' })}.${part(claims)}.not-a-real-signature`;
}

const liveToken = makeToken({
  appKey: APP_KEY,
  sub: 'search-indexer',
  nbf: NOW - 10,
  exp: NOW + 290,
  iat: NOW - 10,
  iss: 'graph',
  aud: 'graph',
});

describe('decodeCmsPreviewToken', () => {
  it('reads the claims out of a JWT', () => {
    expect(decodeCmsPreviewToken(liveToken)).toMatchObject({ appKey: APP_KEY, iss: 'graph' });
  });

  it('returns null for things that are not JWTs', () => {
    expect(decodeCmsPreviewToken('')).toBeNull();
    expect(decodeCmsPreviewToken('abc')).toBeNull();
    expect(decodeCmsPreviewToken('a.b')).toBeNull();
    expect(decodeCmsPreviewToken('a.!!!not-base64!!!.c')).toBeNull();
  });
});

describe('isPlausibleCmsPreviewToken', () => {
  it('accepts a live token for this instance', () => {
    expect(isPlausibleCmsPreviewToken(liveToken, APP_KEY, NOW)).toBe(true);
  });

  it('rejects an empty token without any further work', () => {
    expect(isPlausibleCmsPreviewToken('', APP_KEY, NOW)).toBe(false);
  });

  it('rejects an expired token, allowing for clock skew', () => {
    const expired = makeToken({ appKey: APP_KEY, nbf: NOW - 600, exp: NOW - 300 });
    expect(isPlausibleCmsPreviewToken(expired, APP_KEY, NOW)).toBe(false);
    // Just inside the skew window is still allowed through to Graph.
    const justExpired = makeToken({ appKey: APP_KEY, exp: NOW - 30 });
    expect(isPlausibleCmsPreviewToken(justExpired, APP_KEY, NOW)).toBe(true);
  });

  it('rejects a token that is not valid yet', () => {
    const future = makeToken({ appKey: APP_KEY, nbf: NOW + 600, exp: NOW + 900 });
    expect(isPlausibleCmsPreviewToken(future, APP_KEY, NOW)).toBe(false);
  });

  it('rejects a token minted for a different Graph application', () => {
    const foreign = makeToken({ appKey: 'someone-elses-app', exp: NOW + 290 });
    expect(isPlausibleCmsPreviewToken(foreign, APP_KEY, NOW)).toBe(false);
  });

  /**
   * The pre-filter is a cheap reject, not the authority. Graph is. So anything we cannot
   * positively disprove has to pass through, or an undocumented format change at
   * Optimizely's end would silently disable link generation for every author.
   */
  it('lets unrecognised shapes through for Graph to judge', () => {
    expect(isPlausibleCmsPreviewToken('not-a-jwt-at-all', APP_KEY, NOW)).toBe(true);
    const noClaims = makeToken({});
    expect(isPlausibleCmsPreviewToken(noClaims, APP_KEY, NOW)).toBe(true);
  });

  it('does not reject on appKey when we have none configured', () => {
    const foreign = makeToken({ appKey: 'someone-elses-app', exp: NOW + 290 });
    expect(isPlausibleCmsPreviewToken(foreign, undefined, NOW)).toBe(true);
  });
});
