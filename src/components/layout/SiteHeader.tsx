import Link from 'next/link';
import { Wordmark } from '@/components/ui/Wordmark';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { withLocale, type Locale } from '@/lib/i18n';
import { t } from '@/lib/messages';

/**
 * SiteHeader — sticky top chrome: the (original) This is Dubai wordmark + primary
 * nav. Nav is data-driven so new sections (Events, Areas…) slot in as they ship.
 * Links are locale-prefixed (`withLocale`) so navigation stays within the active
 * locale — a cross-locale jump only happens via the LocaleSwitcher (full reload).
 * Labels come from the per-locale string catalog (`t`).
 */
export function SiteHeader({ locale, pathname }: { locale: Locale; pathname: string }) {
  const m = t(locale);
  const NAV: { href: string; label: string }[] = [
    { href: '/', label: m.nav.home },
    { href: '/things-to-do', label: m.nav.thingsToDo },
    { href: '/places-to-visit', label: m.nav.places },
    { href: '/neighbourhoods', label: m.nav.neighbourhoods },
    { href: '/events', label: m.nav.events },
    { href: '/articles', label: m.nav.articles },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-page items-center justify-between px-6 py-4 md:px-10 lg:px-16">
        <Link
          href={withLocale(locale, '/')}
          aria-label={m.nav.homeAria}
          className="transition hover:opacity-80"
        >
          <Wordmark />
        </Link>
        <nav aria-label="Primary">
          <ul className="flex items-center gap-6 text-sm">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={withLocale(locale, item.href)} className="text-muted transition hover:text-accent">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              {/* Search sits apart from the section links — it's an action, not a destination. */}
              <Link
                href={withLocale(locale, '/search')}
                className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-muted transition hover:border-accent hover:text-accent"
              >
                <svg
                  aria-hidden
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className="size-4"
                >
                  <circle cx="9" cy="9" r="6" />
                  <path d="m13.5 13.5 3.5 3.5" strokeLinecap="round" />
                </svg>
                {/* Icon-only on narrow screens — the header nav is already tight there. */}
                <span className="sr-only sm:not-sr-only">{m.nav.search}</span>
              </Link>
            </li>
            <li>
              <LocaleSwitcher locale={locale} pathname={pathname} />
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
