import Link from 'next/link';
import { Wordmark } from '@/components/ui/Wordmark';
import { withLocale, type Locale } from '@/lib/i18n';

/**
 * SiteFooter — site-wide footer with the wordmark, nav, and the generic
 * "unofficial demo" disclaimer (no specific tourism entity called out).
 * Links are locale-prefixed so the footer stays within the active locale.
 */
const FOOTER_NAV: { href: string; label: string }[] = [
  { href: '/', label: 'Home' },
  { href: '/places-to-visit', label: 'Places to Visit' },
];

export function SiteFooter({ locale }: { locale: Locale }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto max-w-page px-6 py-14 md:px-10 lg:px-16">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-sm">
            <Wordmark />
            <p className="mt-4 text-sm text-muted">
              An independent demo exploring travel &amp; tourism experiences, built on Optimizely
              SaaS CMS with a Next.js frontend.
            </p>
          </div>
          <nav aria-label="Footer">
            <ul className="flex flex-col gap-3 text-sm">
              {FOOTER_NAV.map((item) => (
                <li key={item.href}>
                  <Link href={withLocale(locale, item.href)} className="text-muted transition hover:text-accent">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="mt-12 border-t border-line pt-6 text-xs text-muted">
          <p>
            Unofficial, independent demo — not affiliated with, sponsored by, or endorsed by any
            tourism authority, destination brand, or government entity. For learning and showcase
            purposes only.
          </p>
          <p className="mt-2">© {year} — a demo project. All branding is original.</p>
        </div>
      </div>
    </footer>
  );
}
