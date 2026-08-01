import Link from 'next/link';
import { Wordmark } from '@/components/ui/Wordmark';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { withLocale, type Locale } from '@/lib/i18n';

/**
 * SiteHeader — sticky top chrome: the (original) This is Dubai wordmark + primary
 * nav. Nav is data-driven so new sections (Events, Areas…) slot in as they ship.
 * Links are locale-prefixed (`withLocale`) so navigation stays within the active
 * locale — a cross-locale jump only happens via the LocaleSwitcher (full reload).
 * Labels are localized in L3; for now they're English regardless of locale.
 */
const NAV: { href: string; label: string }[] = [
  { href: '/', label: 'Home' },
  { href: '/places-to-visit', label: 'Places to Visit' },
  { href: '/neighbourhoods', label: 'Neighbourhoods' },
  { href: '/events', label: 'Events' },
  { href: '/articles', label: 'Articles' },
];

export function SiteHeader({ locale, pathname }: { locale: Locale; pathname: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-page items-center justify-between px-6 py-4 md:px-10 lg:px-16">
        <Link
          href={withLocale(locale, '/')}
          aria-label="This is Dubai — home"
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
                <span className="sr-only sm:not-sr-only">Search</span>
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
