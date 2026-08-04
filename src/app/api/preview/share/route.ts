import { type NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { signShareToken, DEFAULT_TTL_SECONDS } from '@/lib/preview-token';
import { DEFAULT_LOCALE } from '@/lib/i18n';

/**
 * Stakeholder preview — link GENERATION (author-triggered, docs/PREVIEW-WORKFLOW.md).
 *
 * Mints a signed, expiring share link for one content item. Authenticated with
 * PREVIEW_ADMIN_SECRET sent as a **Bearer token in the Authorization header** — never in
 * the URL, so the secret can't leak via proxy/access logs, browser history, or referrers.
 * Fail-closed: no secret configured, or a missing/wrong token, returns 401. Phase 4
 * replaces this with a proper authenticated admin UI.
 *
 *   GET /api/preview/share?key=<contentKey>&locale=en&version=latest&path=/places-to-visit/x&ttl=604800
 *   Header:  Authorization: Bearer <PREVIEW_ADMIN_SECRET>
 *   → { "url": "https://<host>/preview/share?token=…", "expiresInSeconds": 604800 }
 */
export const dynamic = 'force-dynamic';

/** Constant-time check of the Bearer token against PREVIEW_ADMIN_SECRET. Fail-closed. */
function isAuthorized(req: NextRequest): boolean {
  const admin = process.env.PREVIEW_ADMIN_SECRET;
  if (!admin) return false;
  const match = /^Bearer\s+(.+)$/i.exec(req.headers.get('authorization') ?? '');
  if (!match) return false;
  const provided = Buffer.from(match[1].trim());
  const expected = Buffer.from(admin);
  // timingSafeEqual throws on length mismatch, so guard first (length isn't secret).
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: 'unauthorized', hint: 'Send the admin secret as: Authorization: Bearer <PREVIEW_ADMIN_SECRET>' },
      { status: 401, headers: { 'X-Robots-Tag': 'noindex', 'WWW-Authenticate': 'Bearer' } },
    );
  }

  const sp = req.nextUrl.searchParams;
  const key = sp.get('key');
  if (!key) return NextResponse.json({ error: 'key is required' }, { status: 400 });

  const locale = sp.get('locale') || DEFAULT_LOCALE;
  const version = sp.get('version') || 'latest';
  const path = sp.get('path') || undefined;
  const ttlParam = Number(sp.get('ttl'));
  const ttl = Number.isFinite(ttlParam) && ttlParam > 0 ? ttlParam : DEFAULT_TTL_SECONDS;

  let token: string;
  try {
    token = signShareToken({ key, locale, version, path }, ttl);
  } catch {
    return NextResponse.json({ error: 'PREVIEW_SIGNING_SECRET is not configured' }, { status: 500 });
  }

  const origin = process.env.APPLICATION_HOST?.replace(/\/$/, '') || req.nextUrl.origin;
  return NextResponse.json({
    url: `${origin}/preview/share?token=${encodeURIComponent(token)}`,
    expiresInSeconds: ttl,
  });
}
