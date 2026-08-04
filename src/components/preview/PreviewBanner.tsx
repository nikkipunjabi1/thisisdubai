import { draftMode } from 'next/headers';
import { t } from '@/lib/messages';
import type { Locale } from '@/lib/i18n';

/**
 * Shown only while Next.js Draft Mode is enabled (i.e. a stakeholder opened a signed
 * preview link — see docs/PREVIEW-WORKFLOW.md). Makes it unmistakable that the page is
 * an UNPUBLISHED draft, and offers a one-click exit that clears Draft Mode.
 *
 * Reading `draftMode()` is a dynamic call, but the root layout already reads request
 * headers (for the locale), so the app renders dynamically regardless — this adds no
 * caching regression. Returns null (nothing rendered) on the normal published site.
 */
export async function PreviewBanner({ locale }: { locale: Locale }) {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return null;
  const m = t(locale);
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-accent px-4 py-2 text-center text-sm font-medium text-bg"
    >
      <span>{m.preview.banner}</span>
      {/* A full navigation to the API route (it disables Draft Mode then redirects),
          not a client-side page transition — so a plain anchor is correct here. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/api/preview/exit" className="underline underline-offset-2 hover:no-underline">
        {m.preview.exit}
      </a>
    </div>
  );
}
