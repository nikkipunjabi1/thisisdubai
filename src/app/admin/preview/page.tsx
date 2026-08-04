import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin-session';
import { listDraftItems } from '@/lib/draft';
import { logout } from './actions';
import { LoginForm } from './LoginForm';
import { LinkGenerator } from './LinkGenerator';

/**
 * Preview-link admin UI — Phase 4 of the stakeholder preview module
 * (docs/PREVIEW-WORKFLOW.md). Replaces the curl command authors previously needed:
 * sign in once, pick an item that has unpublished edits, get a shareable link.
 *
 * This page enumerates unpublished content, so it is gated on a signed session cookie
 * and marked `noindex` (the proxy also forces `X-Robots-Tag` for `/admin`, and
 * `robots.txt` disallows it). It renders nothing but a login form until authenticated:
 * the draft listing is fetched only AFTER the session check.
 */
export const metadata: Metadata = {
  title: 'Preview links — This is Dubai',
  robots: { index: false, follow: false },
};

/** Reads a cookie and hits Graph uncached, so it can never be prerendered or shared. */
export const dynamic = 'force-dynamic';

export default async function PreviewAdminPage() {
  const session = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  const signedIn = verifyAdminSession(session);

  let items: Awaited<ReturnType<typeof listDraftItems>> | null = null;
  let loadError: string | null = null;
  if (signedIn) {
    try {
      items = await listDraftItems();
    } catch (error) {
      console.error('[admin/preview] could not list draft items:', error);
      loadError =
        'Could not read drafts from Optimizely Graph. Check OPTIMIZELY_GRAPH_APP_KEY / OPTIMIZELY_GRAPH_SECRET.';
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="eyebrow">Stakeholder preview</p>
          <h1 className="mt-2 text-3xl">Preview links</h1>
        </div>
        {signedIn && (
          <form action={logout}>
            <button
              type="submit"
              className="rounded-full border border-line px-4 py-2 text-sm transition hover:border-accent"
            >
              Sign out
            </button>
          </form>
        )}
      </div>

      <p className="mt-4 max-w-[62ch] text-sm text-muted">
        Generate a durable, login-free link so a reviewer with no CMS account can see unpublished
        content before you publish it. The link is signed, scoped to one item, expires, and is never
        indexed by search engines.
      </p>

      <div className="mt-12">
        {!signedIn ? (
          <LoginForm />
        ) : loadError ? (
          <p role="alert" className="rounded-lg border border-line bg-surface px-4 py-3 text-sm">
            {loadError}
          </p>
        ) : (
          <LinkGenerator items={items?.items ?? []} total={items?.total ?? 0} />
        )}
      </div>
    </div>
  );
}
