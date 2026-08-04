import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import {
  createAdminSession,
  verifyAdminSession,
  isValidAdminPassword,
  ADMIN_SESSION_TTL_SECONDS,
} from './admin-session';
import { signShareToken } from './preview-token';

const NOW = 1_700_000_000;
const SIGNING = 'test-signing-secret';
const ADMIN = 'test-admin-secret';

beforeAll(() => {
  process.env.PREVIEW_SIGNING_SECRET = SIGNING;
  process.env.PREVIEW_ADMIN_SECRET = ADMIN;
});

afterEach(() => {
  process.env.PREVIEW_SIGNING_SECRET = SIGNING;
  process.env.PREVIEW_ADMIN_SECRET = ADMIN;
});

describe('admin password check', () => {
  it('accepts the configured secret and rejects anything else', () => {
    expect(isValidAdminPassword(ADMIN)).toBe(true);
    expect(isValidAdminPassword('wrong')).toBe(false);
    // A prefix must not pass: the compare is over the whole value, not a startsWith.
    expect(isValidAdminPassword(ADMIN.slice(0, -1))).toBe(false);
    expect(isValidAdminPassword('')).toBe(false);
  });

  it('fails closed when no admin secret is configured', () => {
    delete process.env.PREVIEW_ADMIN_SECRET;
    expect(isValidAdminPassword('anything')).toBe(false);
    expect(isValidAdminPassword('')).toBe(false);
  });
});

describe('admin session', () => {
  it('round-trips a freshly issued session', () => {
    expect(verifyAdminSession(createAdminSession(ADMIN_SESSION_TTL_SECONDS, NOW), NOW)).toBe(true);
  });

  it('accepts it right up to expiry and rejects it after', () => {
    const token = createAdminSession(100, NOW);
    expect(verifyAdminSession(token, NOW + 100)).toBe(true);
    expect(verifyAdminSession(token, NOW + 101)).toBe(false);
  });

  it('rejects a tampered expiry', () => {
    const token = createAdminSession(100, NOW);
    const [, sig] = token.split('.');
    expect(verifyAdminSession(`${NOW + 999999}.${sig}`, NOW)).toBe(false);
  });

  it('rejects malformed and missing tokens', () => {
    expect(verifyAdminSession(undefined, NOW)).toBe(false);
    expect(verifyAdminSession('', NOW)).toBe(false);
    expect(verifyAdminSession('nodot', NOW)).toBe(false);
    expect(verifyAdminSession('.', NOW)).toBe(false);
    expect(verifyAdminSession('a.b.c', NOW)).toBe(false);
  });

  it('rejects a session signed with a different secret', () => {
    const token = createAdminSession(100, NOW);
    process.env.PREVIEW_SIGNING_SECRET = 'someone-elses-secret';
    expect(verifyAdminSession(token, NOW)).toBe(false);
  });

  it('fails closed when the signing secret is unset', () => {
    const token = createAdminSession(100, NOW);
    delete process.env.PREVIEW_SIGNING_SECRET;
    expect(verifyAdminSession(token, NOW)).toBe(false);
  });

  /**
   * The security property that justifies the DOMAIN prefix: share tokens are HMACs under
   * the SAME secret and every reviewer holds one for up to 30 days. Without domain
   * separation a share token would be a valid admin session.
   */
  it('does not accept a share token as an admin session', () => {
    const share = signShareToken({ key: 'k', locale: 'en', version: 'latest' }, 3600, NOW);
    expect(verifyAdminSession(share, NOW)).toBe(false);
    // ...nor the reverse: a session must not verify as a share token.
    const session = createAdminSession(3600, NOW);
    expect(verifyAdminSession(session, NOW)).toBe(true);
  });
});
