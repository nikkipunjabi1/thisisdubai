import { cookies, draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { type NextRequest } from 'next/server';
import { verifyShareToken, type VerifyResult } from '@/lib/preview-token';
import { PREVIEW_SCOPE_COOKIE } from '@/lib/draft';
import { DEFAULT_LOCALE, isLocale, withLocale } from '@/lib/i18n';

/**
 * Stakeholder preview — link CONSUMPTION (Layer 2, docs/PREVIEW-WORKFLOW.md).
 *
 * A reviewer with no CMS login opens `/preview/share?token=<signed>`. We verify the
 * signed token, and on success enable Next.js Draft Mode (a cookie) and redirect to the
 * content's page. Draft Mode is what flips the data layer to draft reads (src/lib/draft.ts).
 *
 * We also stash the token itself in a companion cookie, because Draft Mode's own cookie
 * carries no payload — it says "this visitor may see drafts" but not WHICH item they may
 * see. Keeping the signed token means every page re-verifies the signature and expiry on
 * each request and only serves the one content key the link was minted for.
 *
 * Excluded from locale routing by the proxy matcher, so it runs as-is.
 */
export const dynamic = 'force-dynamic';

function invalid(reason: 'malformed' | 'bad-signature' | 'expired'): Response {
  const expired = reason === 'expired';
  return new Response(
    expired ? 'This preview link has expired.' : 'This preview link is invalid.',
    {
      status: expired ? 410 : 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow' },
    },
  );
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? '';

  let result: VerifyResult;
  try {
    result = verifyShareToken(token);
  } catch {
    // Thrown only if PREVIEW_SIGNING_SECRET is unset (fail-closed) — treat as invalid.
    return invalid('bad-signature');
  }
  if (!result.ok) return invalid(result.reason);

  // Enable Draft Mode and record what this link is scoped to, then redirect to the
  // previewed page. `redirect()` throws NEXT_REDIRECT, so it must sit OUTSIDE the
  // try/catch above.
  (await draftMode()).enable();
  (await cookies()).set(PREVIEW_SCOPE_COOKIE, token, {
    httpOnly: true, // the token is server-side state; no client code needs to read it
    secure: true,
    sameSite: 'lax', // survives the redirect below and normal in-site navigation
    path: '/',
    // Expire the cookie with the token, so a stale browser can't keep asking.
    maxAge: Math.max(0, result.payload.exp - Math.floor(Date.now() / 1000)),
  });
  const locale = isLocale(result.payload.locale) ? result.payload.locale : DEFAULT_LOCALE;
  const dest = result.payload.path ? withLocale(locale, result.payload.path) : withLocale(locale, '/');
  redirect(dest);
}
