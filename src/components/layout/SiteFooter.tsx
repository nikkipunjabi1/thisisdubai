import Link from 'next/link';
import { Wordmark } from '@/components/ui/Wordmark';
import { withLocale, type Locale } from '@/lib/i18n';
import { t } from '@/lib/messages';
import { getSiteChrome, type FooterColumn, type ResolvedLink } from '@/lib/navigation';

/**
 * SiteFooter — wordmark + CMS-editable footer columns + the "unofficial demo" disclaimer.
 * Columns come from Site Settings → Navigation (each an optional heading + links to pages
 * picked from the content tree). Falls back to a built-in single column when unconfigured.
 */
function FooterLink({ link }: { link: ResolvedLink }) {
  const cls = 'text-muted transition hover:text-accent';
  const target = link.newTab ? '_blank' : undefined;
  const rel = link.newTab ? 'noopener noreferrer' : undefined;
  return link.external ? (
    <a href={link.href} target={target} rel={rel} className={cls}>
      {link.label}
    </a>
  ) : (
    <Link href={link.href} target={target} rel={rel} className={cls}>
      {link.label}
    </Link>
  );
}

export async function SiteFooter({ locale }: { locale: Locale }) {
  const m = t(locale);
  const year = new Date().getFullYear();
  const { footerGroups } = await getSiteChrome(locale);

  // Fallback: the built-in single column when nothing is configured in the CMS.
  const defaultColumns: FooterColumn[] = [
    {
      heading: null,
      links: [
        { label: m.nav.home, href: withLocale(locale, '/'), external: false, newTab: false },
        { label: m.nav.places, href: withLocale(locale, '/places-to-visit'), external: false, newTab: false },
      ],
    },
  ];
  const columns = footerGroups.length > 0 ? footerGroups : defaultColumns;

  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto max-w-page px-6 py-14 md:px-10 lg:px-16">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-sm">
            <Wordmark />
            <p className="mt-4 text-sm text-muted">{m.footer.tagline}</p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:gap-16">
            {columns.map((col, i) => (
              <div key={i}>
                {col.heading ? (
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg/70">{col.heading}</p>
                ) : null}
                <ul className="flex flex-col gap-3 text-sm">
                  {col.links.map((link, li) => (
                    <li key={li}>
                      <FooterLink link={link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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
