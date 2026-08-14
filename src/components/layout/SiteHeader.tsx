import Link from 'next/link';
import { Wordmark } from '@/components/ui/Wordmark';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { PrimaryNav } from '@/components/layout/PrimaryNav';
import { withLocale, type Locale } from '@/lib/i18n';
import { t } from '@/lib/messages';
import { getSiteChrome, getLanguageLabels, type HeaderItem } from '@/lib/navigation';

/**
 * SiteHeader — sticky top chrome: wordmark + primary nav + (optional) search + language
 * switcher. The nav is CMS-editable (Site Settings → Navigation): top-level items can carry
 * a dropdown (mega menu), links point at pages picked from the content tree. When no menu is
 * configured, we fall back to the built-in default nav below so the header is never empty.
 * Search visibility and the language name both come from Site Settings too.
 */
export async function SiteHeader({ locale, pathname }: { locale: Locale; pathname: string }) {
  const m = t(locale);
  const [chrome, languageLabels] = await Promise.all([getSiteChrome(locale), getLanguageLabels()]);

  // Fallback to the built-in nav when nothing is configured in the CMS.
  const defaultNav: HeaderItem[] = [
    { href: '/', label: m.nav.home },
    { href: '/things-to-do', label: m.nav.thingsToDo },
    { href: '/places-to-visit', label: m.nav.places },
    { href: '/neighbourhoods', label: m.nav.neighbourhoods },
    { href: '/events', label: m.nav.events },
    { href: '/articles', label: m.nav.articles },
  ].map((i) => ({ label: i.label, href: withLocale(locale, i.href), external: false, newTab: false, children: [] }));

  const items = chrome.headerMenu.length > 0 ? chrome.headerMenu : defaultNav;

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
        <nav aria-label="Primary" className="flex items-center gap-6">
          <PrimaryNav items={items} />
          <div className="flex items-center gap-6 text-sm">
            {chrome.showSearch ? (
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
                <span className="sr-only sm:not-sr-only">{m.nav.search}</span>
              </Link>
            ) : null}
            <LocaleSwitcher locale={locale} pathname={pathname} labels={languageLabels} />
          </div>
        </nav>
      </div>
    </header>
  );
}
