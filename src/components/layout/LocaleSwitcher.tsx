import { alternateHref, LOCALES, type Locale } from '@/lib/i18n';

/** Each locale labelled in its OWN script, so an Arabic reader recognises العربية. */
const NATIVE_NAME: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
};

/**
 * Language switcher — jumps to the SAME page in the other locale.
 *
 * Deliberately a plain `<a>`, NOT `next/link`: a soft (client-side) navigation does not
 * re-run the root layout, so `<html lang dir>` would keep the previous direction (English
 * text rendered RTL, and vice-versa). A full reload re-renders the document with the new
 * locale's `dir`/`lang` and Arabic fonts. This is the one intentional cross-locale jump —
 * every other link stays within the active locale.
 */
export function LocaleSwitcher({ locale, pathname }: { locale: Locale; pathname: string }) {
  return (
    <div className="flex items-center gap-2 text-sm" role="group" aria-label="Language">
      {LOCALES.map((l, i) => (
        <span key={l} className="flex items-center gap-2">
          {i > 0 ? <span aria-hidden className="text-line">·</span> : null}
          {l === locale ? (
            <span aria-current="true" className="text-fg">
              {NATIVE_NAME[l]}
            </span>
          ) : (
            <a
              href={alternateHref(pathname, l)}
              hrefLang={l}
              lang={l}
              className="text-muted transition hover:text-accent"
            >
              {NATIVE_NAME[l]}
            </a>
          )}
        </span>
      ))}
    </div>
  );
}
