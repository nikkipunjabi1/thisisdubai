import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Sessions for the preview-link admin UI (`/admin/preview`), Phase 4 of the stakeholder
 * preview module (docs/PREVIEW-WORKFLOW.md).
 *
 * The author signs in once with PREVIEW_ADMIN_SECRET and gets a short-lived signed
 * cookie, so the secret is typed once rather than pasted into every request (which is
 * what the Phase 2/3 curl flow required). The cookie carries no privileges of its own:
 * it is an HMAC over an expiry, re-verified server-side on every action.
 *
 * ## Domain separation
 * Share tokens (src/lib/preview-token.ts) and admin sessions are both HMACs under the
 * SAME secret, so they are deliberately signed over different byte strings: an admin
 * session prefixes its body with `DOMAIN`. Without that, a 7-day share token, which any
 * reviewer holds, would be a syntactically valid admin session. Never remove the prefix.
 *
 * SERVER ONLY — reads PREVIEW_ADMIN_SECRET and PREVIEW_SIGNING_SECRET.
 */

/** Prefixed into the signed body so a share token can never be replayed as a session. */
const DOMAIN = 'admin-session.v1';

/** How long a sign-in lasts. Short enough that a shared laptop isn't a standing grant. */
export const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;

export const ADMIN_SESSION_COOKIE = '__preview_admin';

const nowSecondsDefault = () => Math.floor(Date.now() / 1000);

function getSigningSecret(): string {
  const s = process.env.PREVIEW_SIGNING_SECRET;
  if (!s) throw new Error('PREVIEW_SIGNING_SECRET is not set — refusing to issue/verify admin sessions.');
  return s;
}

function sign(body: string): string {
  return createHmac('sha256', getSigningSecret()).update(`${DOMAIN}.${body}`).digest('base64url');
}

/** Constant-time string compare that tolerates length mismatch (length is not secret). */
function safeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/**
 * Check a submitted password against PREVIEW_ADMIN_SECRET. Fail-closed: with no secret
 * configured, nothing authenticates (rather than everything).
 */
export function isValidAdminPassword(password: string): boolean {
  const admin = process.env.PREVIEW_ADMIN_SECRET;
  if (!admin) return false;
  return safeEquals(password, admin);
}

/** Mint a signed session token. `nowSeconds` is injectable for deterministic tests. */
export function createAdminSession(
  ttlSeconds: number = ADMIN_SESSION_TTL_SECONDS,
  nowSeconds: number = nowSecondsDefault(),
): string {
  const body = String(nowSeconds + ttlSeconds);
  return `${body}.${sign(body)}`;
}

/** True when the cookie is a well-formed, correctly signed, unexpired admin session. */
export function verifyAdminSession(token: string | undefined, nowSeconds: number = nowSecondsDefault()): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
  const [body, providedSig] = parts;

  let expectedSig: string;
  try {
    expectedSig = sign(body);
  } catch {
    // PREVIEW_SIGNING_SECRET unset — fail closed.
    return false;
  }
  if (!safeEquals(providedSig, expectedSig)) return false;

  const exp = Number.parseInt(body, 10);
  return Number.isFinite(exp) && exp >= nowSeconds;
}
