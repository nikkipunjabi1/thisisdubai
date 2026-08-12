import { NextResponse, type NextRequest } from 'next/server';
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n';
import {
  PREVIEW_SCOPE_COOKIE,
  readTokenMode,
  parseAllowList,
  isInternalAccessAllowed,
} from '@/lib/preview-access';

/**
 * Network gate for the stakeholder preview module (Layer 2, docs/PREVIEW-WORKFLOW.md).
 *
 * A share link carries a signed `mode`: `internal` links (the default) may only be opened
 * from the org network — an IP allowlist (`PREVIEW_ALLOWED_IPS`) enforced here at the edge —
 * while `shareable` links are unrestricted. Returns a 403 to short-circuit, or null to let
 * the request continue. A missing/`shareable` token is never blocked; the mode read is
 * unverified and fail-safe (see readTokenMode) — the HMAC is checked server-side before any
 * draft is served, so this gate is defence-in-depth, not the authorization itself.
 *
 * This never touches Layer 1 (the CMS editor's own `/preview` iframe): that path is excluded
 * from the matcher and is authenticated by the CMS's short-lived `preview_token`, and an
 * author may legitimately edit from anywhere.
 */
function previewGate(req: NextRequest, token: string | null | undefined): NextResponse | null {
  if (!token) return null; // no share link in play
  if (readTokenMode(token) !== 'internal') return null; // shareable links are unrestricted

  const allowed = isInternalAccessAllowed({
    xff: req.headers.get('x-forwarded-for'),
    xreal: req.headers.get('x-real-ip'),
    allowList: parseAllowList(process.env.PREVIEW_ALLOWED_IPS),
  });
  if (allowed) return null;

  return new NextResponse(
    'This preview link is restricted to the organization network. Open it from an allowed network, or ask the author for a shareable link.',
    {
      status: 403,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    },
  );
}

/**
 * Locale routing. Every visitor page lives under a locale prefix (`/en/...`, `/ar/...`).
 *
 * - A path that already starts with a known locale passes through — we stamp the active
 *   locale onto a request header (`x-locale`) so the ROOT layout (which sits above the
 *   `[locale]` segment and can't read its param) can set `<html lang dir>`.
 * - A path with no locale prefix (including `/`) redirects to the default locale, so
 *   `/` → `/en` and `/places-to-visit/x` → `/en/places-to-visit/x`.
 *
 * The matcher excludes api routes, Next internals, the CMS-driven `/preview` and
 * `/styleguide` pages, and any file path (a dot in the last segment) such as
 * `/robots.txt` — none of which are locale-scoped.
 *
 * (Next 16 renamed the `middleware` file convention to `proxy`; same request-time hook.)
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Layer 2 link CONSUMPTION: the login-free cookie is about to be set here, so this is
  // where an internal link meets the network gate. (Layer 1's `/preview` iframe is excluded
  // from the matcher and never reaches this.)
  if (pathname === '/preview/share') {
    return previewGate(req, req.nextUrl.searchParams.get('token')) ?? NextResponse.next();
  }

  const first = pathname.split('/')[1];

  if (isLocale(first)) {
    const headers = new Headers(req.headers);
    headers.set('x-locale', first);
    // The current path, so the root layout can build the language switcher's target
    // (the same page in the other locale) and per-page hreflang alternates (L5).
    headers.set('x-pathname', pathname);
    const res = NextResponse.next({ request: { headers } });
    // While a stakeholder is in Draft Mode (the signed-preview cookie is set):
    if (req.cookies.has('__prerender_bypass')) {
      // Re-enforce the network gate on EVERY draft page view, not just at link consumption:
      // the signed token lives on in the scope cookie, so an off-network reviewer who already
      // holds the cookie is stopped here too.
      const gate = previewGate(req, req.cookies.get(PREVIEW_SCOPE_COOKIE)?.value);
      if (gate) return gate;
      // Belt-and-braces: force `noindex` on every page so unpublished content can never be
      // crawled — even if the site is otherwise indexable (SITE_INDEXABLE=true).
      res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    }
    return res;
  }

  const url = req.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // First entry: every visitor page, excluding api / Next internals / the CMS-driven
  // `/preview` (Layer 1) and `/styleguide` / file paths. Second entry re-includes ONLY
  // `/preview/share` (Layer 2 consumption) so the network gate above can run on it.
  matcher: ['/((?!api|_next|preview|styleguide|.*\\..*).*)', '/preview/share'],
};
