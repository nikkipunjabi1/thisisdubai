import { alternateHref, LOCALES, type Locale } from '@/lib/i18n';

/** Built-in native names, used when a language has no CMS-configured name yet. */
const NATIVE_NAME: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
};

/**
 * Language switcher — shows the OTHER language(s) as a link to the same page in that locale.
 * On the English site it shows "العربية"; on the Arabic site it shows "English". The label is
 * the target language's own name, taken from that language's Site Settings
 * (`languageSwitchLabel`, via `labels`), so it is fully editable in the CMS.
 *
 * Deliberately a plain `<a>`, NOT `next/link`: a soft (client-side) navigation does not re-run
 * the root layout, so `<html lang dir>` would keep the previous direction. A full reload
 * re-renders the document with the new locale's `dir`/`lang` and correct fonts.
 */
export function LocaleSwitcher({
  locale,
  pathname,
  labels,
}: {
  locale: Locale;
  pathname: string;
  labels?: Partial<Record<Locale, string>>;
}) {
  const targets = LOCALES.filter((l) => l !== locale);
  return (
    <div className="flex items-center gap-3 text-sm" role="group" aria-label="Language">
      {targets.map((l) => (
        <a
          key={l}
          href={alternateHref(pathname, l)}
          hrefLang={l}
          lang={l}
          className="text-muted transition hover:text-accent"
        >
          {labels?.[l]?.trim() || NATIVE_NAME[l]}
        </a>
      ))}
    </div>
  );
}
