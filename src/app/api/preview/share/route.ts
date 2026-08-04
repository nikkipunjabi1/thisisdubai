import { type NextRequest, NextResponse } from 'next/server';
import { signShareToken, DEFAULT_TTL_SECONDS } from '@/lib/preview-token';
import { DEFAULT_LOCALE } from '@/lib/i18n';

/**
 * Stakeholder preview — link GENERATION (author-triggered, docs/PREVIEW-WORKFLOW.md).
 *
 * Mints a signed, expiring share link for one content item. Guarded by PREVIEW_ADMIN_SECRET
 * (fail-closed): without it, or with a wrong `auth`, this returns 401 so random callers
 * can't mint links to arbitrary drafts. Phase 4 replaces the raw `auth` query with a
 * proper authenticated admin UI; for now it drives testing + a copy-paste workflow.
 *
 *   GET /api/preview/share?auth=<secret>&key=<contentKey>&locale=en&version=latest&path=/places-to-visit/x&ttl=604800
 *   → { "url": "https://<host>/preview/share?token=…", "expiresInSeconds": 604800 }
 */
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const admin = process.env.PREVIEW_ADMIN_SECRET;
  const provided = req.nextUrl.searchParams.get('auth');
  if (!admin || provided !== admin) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: { 'X-Robots-Tag': 'noindex' } });
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
