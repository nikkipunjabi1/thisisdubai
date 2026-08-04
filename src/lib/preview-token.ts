import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Signed, expiring share tokens for the stakeholder preview module (Layer 2 in
 * docs/PREVIEW-WORKFLOW.md): a durable, login-free link an author sends to a reviewer
 * so they can see the *unpublished* draft of one content item, for a limited window.
 *
 * The token is a compact JWT-lite: `base64url(payload).base64url(HMAC-SHA256(payload))`.
 * It carries no secret and grants no Graph access by itself — it only authorizes the
 * server to render ONE content item's draft until it expires. The Graph draft-read
 * credentials stay server-side (never in the token, never in the browser).
 *
 * SERVER ONLY — imports node:crypto and reads PREVIEW_SIGNING_SECRET. Never import
 * this into a client component.
 */

export type SharePayload = {
  /** CMS content key the link may preview (scopes the link to one item). */
  key: string;
  /** Locale to render. */
  locale: string;
  /** A pinned version for a frozen snapshot, or 'latest' to always show the newest draft. */
  version: string;
  /** Locale-neutral app path to redirect to. Optional: a brand-new page has no URL yet. */
  path?: string;
  /** Expiry, epoch seconds. */
  exp: number;
};

/** Default link lifetime: 7 days (see PREVIEW-WORKFLOW.md "Key design decisions"). */
export const DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60;

const nowSecondsDefault = () => Math.floor(Date.now() / 1000);

function getSecret(): string {
  const s = process.env.PREVIEW_SIGNING_SECRET;
  // Fail closed: refuse to sign or verify with an empty secret, so a misconfigured
  // deploy can't mint forgeable links or accept unsigned ones.
  if (!s) throw new Error('PREVIEW_SIGNING_SECRET is not set — refusing to sign/verify preview links.');
  return s;
}

function sign(body: string): string {
  return createHmac('sha256', getSecret()).update(body).digest('base64url');
}

/**
 * Mint a signed share token. `nowSeconds` is injectable for deterministic tests.
 */
export function signShareToken(
  input: Omit<SharePayload, 'exp'> & { exp?: number },
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
  nowSeconds: number = nowSecondsDefault(),
): string {
  const payload: SharePayload = { ...input, exp: input.exp ?? nowSeconds + ttlSeconds };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

export type VerifyResult =
  | { ok: true; payload: SharePayload }
  | { ok: false; reason: 'malformed' | 'bad-signature' | 'expired' };

/**
 * Verify a share token: checks the HMAC (timing-safe) THEN the expiry. Returns a typed
 * result rather than throwing, so the route can respond 404/410 without leaking which
 * check failed. `nowSeconds` is injectable for deterministic tests.
 */
export function verifyShareToken(token: string, nowSeconds: number = nowSecondsDefault()): VerifyResult {
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { ok: false, reason: 'malformed' };
  const [body, providedSig] = parts;

  const expectedSig = sign(body);
  const a = Buffer.from(providedSig, 'base64url');
  const b = Buffer.from(expectedSig, 'base64url');
  // Length check first: timingSafeEqual throws on length mismatch.
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: 'bad-signature' };

  let payload: SharePayload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  if (typeof payload.exp !== 'number' || payload.exp < nowSeconds) {
    return { ok: false, reason: 'expired' };
  }
  return { ok: true, payload };
}
