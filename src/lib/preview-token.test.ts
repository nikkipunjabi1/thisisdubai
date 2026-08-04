import { describe, it, expect, beforeAll } from 'vitest';
import { signShareToken, verifyShareToken, DEFAULT_TTL_SECONDS } from './preview-token';

// A fixed secret + fixed clock make every assertion deterministic.
const NOW = 1_700_000_000;
beforeAll(() => {
  process.env.PREVIEW_SIGNING_SECRET = 'test-secret-do-not-use-in-prod';
});

describe('preview share token', () => {
  it('round-trips a payload and stamps the default expiry', () => {
    const token = signShareToken({ key: 'abc123', locale: 'en', version: 'latest' }, DEFAULT_TTL_SECONDS, NOW);
    const result = verifyShareToken(token, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.key).toBe('abc123');
      expect(result.payload.locale).toBe('en');
      expect(result.payload.version).toBe('latest');
      expect(result.payload.exp).toBe(NOW + DEFAULT_TTL_SECONDS);
    }
  });

  it('preserves an optional redirect path', () => {
    const token = signShareToken({ key: 'k', locale: 'ar', version: 'latest', path: '/places-to-visit/x' }, 60, NOW);
    const result = verifyShareToken(token, NOW);
    expect(result.ok && result.payload.path).toBe('/places-to-visit/x');
  });

  it('rejects a tampered payload (signature no longer matches)', () => {
    const token = signShareToken({ key: 'abc123', locale: 'en', version: 'latest' }, 60, NOW);
    const [body, sig] = token.split('.');
    const forgedBody = Buffer.from(JSON.stringify({ key: 'OTHER', locale: 'en', version: 'latest', exp: NOW + 60 })).toString('base64url');
    const result = verifyShareToken(`${forgedBody}.${sig}`, NOW);
    expect(result).toEqual({ ok: false, reason: 'bad-signature' });
    expect(body).not.toBe(forgedBody);
  });

  it('rejects a tampered signature', () => {
    const token = signShareToken({ key: 'k', locale: 'en', version: 'latest' }, 60, NOW);
    const [body] = token.split('.');
    const result = verifyShareToken(`${body}.YWJjZGVm`, NOW);
    expect(result.ok).toBe(false);
  });

  it('rejects an expired token', () => {
    const token = signShareToken({ key: 'k', locale: 'en', version: 'latest' }, 60, NOW);
    const result = verifyShareToken(token, NOW + 61); // one second past expiry
    expect(result).toEqual({ ok: false, reason: 'expired' });
  });

  it('accepts a token right up to its expiry second', () => {
    const token = signShareToken({ key: 'k', locale: 'en', version: 'latest' }, 60, NOW);
    expect(verifyShareToken(token, NOW + 60).ok).toBe(true);
  });

  it('rejects a malformed token (no signature segment)', () => {
    expect(verifyShareToken('not-a-token', NOW)).toEqual({ ok: false, reason: 'malformed' });
    expect(verifyShareToken('', NOW)).toEqual({ ok: false, reason: 'malformed' });
  });

  it('rejects a token signed with a different secret', () => {
    const token = signShareToken({ key: 'k', locale: 'en', version: 'latest' }, 60, NOW);
    const prev = process.env.PREVIEW_SIGNING_SECRET;
    process.env.PREVIEW_SIGNING_SECRET = 'a-different-secret';
    const result = verifyShareToken(token, NOW);
    process.env.PREVIEW_SIGNING_SECRET = prev;
    expect(result).toEqual({ ok: false, reason: 'bad-signature' });
  });
});
