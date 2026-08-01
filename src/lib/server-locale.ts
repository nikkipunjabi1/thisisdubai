import 'server-only';
import { headers } from 'next/headers';
import { DEFAULT_LOCALE, isLocale, type Locale } from './i18n';

/**
 * The active locale for the current request, read from the `x-locale` header the proxy
 * stamps. Use this in server components that render DEEP in a Visual Builder composition
 * (e.g. `SectionListing`), where the route's `locale` param can't be threaded as a prop.
 *
 * Note: this reads `headers()`, so it must NOT be called inside `unstable_cache`
 * (`cachedGraphRead`) — pass the resolved locale in as an argument instead.
 */
export async function getRequestLocale(): Promise<Locale> {
  const value = (await headers()).get('x-locale');
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
