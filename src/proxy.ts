import { NextResponse, type NextRequest } from 'next/server';
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n';

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
  const first = pathname.split('/')[1];

  if (isLocale(first)) {
    const headers = new Headers(req.headers);
    headers.set('x-locale', first);
    // The current path, so the root layout can build the language switcher's target
    // (the same page in the other locale) and per-page hreflang alternates (L5).
    headers.set('x-pathname', pathname);
    return NextResponse.next({ request: { headers } });
  }

  const url = req.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!api|_next|preview|styleguide|.*\\..*).*)'],
};
