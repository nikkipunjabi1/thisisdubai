/**
 * Access-control primitives for the stakeholder preview module (Layer 2,
 * docs/PREVIEW-WORKFLOW.md §"Access control: org-network-only by default").
 *
 * EDGE-SAFE. This module is imported by `src/proxy.ts`, which runs in the Edge runtime,
 * so it must have ZERO Node-only or SDK dependencies: no `node:crypto`, no `@optimizely/*`,
 * no `next/headers`. Signature verification (which does need `node:crypto`) stays in
 * `src/lib/preview-token.ts` and runs server-side; this file only carries the small,
 * dependency-free pieces the edge gate needs.
 */

/**
 * Who may open a share link.
 *  - `internal`  — org-network-only. IP-gated in `src/proxy.ts`; the DEFAULT for new links.
 *  - `shareable` — login-free from anywhere (explicit opt-in for external reviewers).
 * The mode is baked into the signed token payload, so the URL cannot escalate it.
 */
export type PreviewMode = 'internal' | 'shareable';

/** Cookie holding the signed share token; also the per-request draft scope (draft.ts). */
export const PREVIEW_SCOPE_COOKIE = '__preview_share';

/**
 * Read the access `mode` from a share token WITHOUT verifying its signature.
 *
 * This is NOT a security check. The HMAC is verified server-side before any draft is ever
 * served (src/lib/draft.ts `getDraftScope`). This decode only decides whether the network
 * gate applies: a forged `mode: 'shareable'` would skip the gate but still render nothing,
 * because the bad signature fails the real check downstream.
 *
 * Fail-safe: a missing, empty, or unparseable mode is treated as `internal` — the more
 * restrictive choice — so a malformed or legacy (mode-less) token is gated, never leaked.
 */
export function readTokenMode(token: string | null | undefined): PreviewMode {
  if (!token) return 'internal';
  const body = token.split('.')[0];
  if (!body) return 'internal';
  try {
    const json = JSON.parse(base64urlToUtf8(body)) as { mode?: unknown };
    return json?.mode === 'shareable' ? 'shareable' : 'internal';
  } catch {
    return 'internal';
  }
}

/** Parse the `PREVIEW_ALLOWED_IPS` env (comma-separated) into a trimmed, non-empty list. */
export function parseAllowList(raw: string | undefined | null): string[] {
  return (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Decide whether the requester may open an INTERNAL (org-network-only) preview link,
 * from the forwarding headers and the configured allowlist. Pure, so it is unit-tested
 * directly (see preview-access.test.ts); the proxy just feeds it real request values.
 *
 * Rules, in order:
 *   1. No proxy hop at all (`x-forwarded-for` and `x-real-ip` both absent) → a direct
 *      connection, i.e. local `next dev`. Allowed, so internal previews work out of the
 *      box in development. Every deployed environment sits behind a platform proxy that
 *      always sets `x-forwarded-for`, so this branch never opens the gate in production.
 *   2. Loopback (`127.0.0.1`, `::1`) → allowed.
 *   3. Otherwise the client IP (the LEFT-most `x-forwarded-for` entry — the client as
 *      seen by the platform edge, which overwrites/appends it) must be in the allowlist.
 *   4. Fail-safe: a proxy hop IS present but the allowlist is empty → denied, so a
 *      misconfigured deploy locks internal previews down rather than leaking them.
 *
 * Caveat: `x-forwarded-for` is only trustworthy behind a proxy that rewrites it (Vercel
 * does). If the app were exposed WITHOUT such a proxy, a client could spoof it. See
 * docs/PREVIEW-WORKFLOW.md for the threat model.
 */
export function isInternalAccessAllowed(opts: {
  xff: string | null;
  xreal: string | null;
  allowList: string[];
}): boolean {
  const { xff, xreal, allowList } = opts;
  if (!xff && !xreal) return true; // direct / local dev
  const ip = (xff?.split(',')[0] ?? xreal ?? '').trim();
  if (ip === '127.0.0.1' || ip === '::1') return true; // loopback
  if (allowList.length === 0) return false; // proxy present, nothing allowlisted → deny
  return allowList.includes(ip);
}

function base64urlToUtf8(b64url: string): string {
  const b64 = b64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(b64url.length / 4) * 4, '=');
  // `atob` + `TextDecoder` are available in the Edge runtime; `Buffer` is not guaranteed.
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
