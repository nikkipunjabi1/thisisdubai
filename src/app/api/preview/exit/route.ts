import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { type NextRequest } from 'next/server';

/**
 * Clears Draft Mode (the "Exit preview" link in the banner) and returns the viewer to
 * the normal, published site. `?redirect=` lets the banner send them back to the page
 * they were on; only same-site absolute paths are honoured (no open redirects).
 */
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  (await draftMode()).disable();
  const to = req.nextUrl.searchParams.get('redirect');
  redirect(to && to.startsWith('/') && !to.startsWith('//') ? to : '/');
}
