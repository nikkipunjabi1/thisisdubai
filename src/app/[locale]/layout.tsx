import React from 'react';
import { notFound } from 'next/navigation';
import { isLocale, LOCALES } from '@/lib/i18n';

/**
 * Locale segment. Every visitor page lives under `/en/...` or `/ar/...` (the middleware
 * redirects unprefixed paths to the default locale). This layout just validates the
 * prefix — `<html lang dir>` is set by the ROOT layout from the `x-locale` header, since
 * it sits above this segment. An unknown prefix (`/fr/...`) 404s instead of leaking to a
 * broken render.
 */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return children;
}
