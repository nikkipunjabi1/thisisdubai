import Link from 'next/link';
import { Wordmark } from '@/components/ui/Wordmark';
import { withLocale, type Locale } from '@/lib/i18n';
import { t } from '@/lib/messages';

/**
 * SiteFooter — site-wide footer with the wordmark, nav, and the generic
 * "unofficial demo" disclaimer (no specific tourism entity called out).
 * Links are locale-prefixed so the footer stays within the active locale;
 * labels + copy come from the per-locale string catalog.
 */
export function SiteFooter({ locale }: { locale: Locale }) {
  const m = t(locale);
  const year = new Date().getFullYear();
  const FOOTER_NAV: { href: string; label: string }[] = [
    { href: '/', label: m.nav.home },
    { href: '/places-to-visit', label: m.nav.places },
  ];
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto max-w-page px-6 py-14 md:px-10 lg:px-16">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-sm">
            <Wordmark />
            <p className="mt-4 text-sm text-muted">{m.footer.tagline}</p>
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
          <p>{m.footer.disclaimer}</p>
          <p className="mt-2">{m.footer.copyright(year)}</p>
        </div>
      </div>
    </footer>
  );
}
