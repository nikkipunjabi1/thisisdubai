import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { type NextRequest } from 'next/server';
import { verifyShareToken, type VerifyResult } from '@/lib/preview-token';
import { DEFAULT_LOCALE, isLocale, withLocale } from '@/lib/i18n';

/**
 * Stakeholder preview — link CONSUMPTION (Layer 2, docs/PREVIEW-WORKFLOW.md).
 *
 * A reviewer with no CMS login opens `/preview/share?token=<signed>`. We verify the
 * signed token, and on success enable Next.js Draft Mode (a cookie) and redirect to the
 * content's page. Draft Mode is what flips the data layer to draft reads (Phase 3);
 * until then the page renders published content, but the flow + banner already work.
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

  // Enable Draft Mode, then redirect to the previewed page. `redirect()` throws
  // NEXT_REDIRECT, so it must sit OUTSIDE the try/catch above.
  (await draftMode()).enable();
  const locale = isLocale(result.payload.locale) ? result.payload.locale : DEFAULT_LOCALE;
  const dest = result.payload.path ? withLocale(locale, result.payload.path) : withLocale(locale, '/');
  redirect(dest);
}
