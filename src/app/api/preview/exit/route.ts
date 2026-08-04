import { cookies, draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { type NextRequest } from 'next/server';
import { PREVIEW_SCOPE_COOKIE } from '@/lib/draft';

/**
 * Clears Draft Mode (the "Exit preview" link in the banner) and returns the viewer to
 * the normal, published site. `?redirect=` lets the banner send them back to the page
 * they were on; only same-site absolute paths are honoured (no open redirects).
 *
 * Both cookies go: Draft Mode's own bypass cookie AND the share-scope cookie holding the
 * signed token, so exiting leaves no preview state behind.
 */
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  (await draftMode()).disable();
  (await cookies()).delete(PREVIEW_SCOPE_COOKIE);
  const to = req.nextUrl.searchParams.get('redirect');
  redirect(to && to.startsWith('/') && !to.startsWith('//') ? to : '/');
}
