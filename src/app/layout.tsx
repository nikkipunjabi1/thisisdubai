import React from 'react';

import { Fraunces, Hanken_Grotesk, Noto_Kufi_Arabic, Noto_Sans_Arabic } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import { DEFAULT_LOCALE, isLocale, dir, htmlLang, withLocale } from '@/lib/i18n';
import {
  BlankExperienceContentType,
  BlankSectionContentType,
  config,
  initContentTypeRegistry,
  initDisplayTemplateRegistry,
} from '@optimizely/cms-sdk';
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';

// System Visual Builder types (provided by the SDK / present in every SaaS instance).
import BlankExperience from '@/components/BlankExperience';
import BlankSection from '@/components/BlankSection';

// This is Dubai Visual Builder blocks (S2.3).
import SectionHeading, { SectionHeadingContentType } from '@/components/blocks/SectionHeading';
import RichTextBlock, { RichTextBlockContentType } from '@/components/blocks/RichTextBlock';
import Hero, { HeroBannerContentType } from '@/components/blocks/Hero';
import SectionListing, { SectionListingContentType } from '@/components/blocks/SectionListing';
import ThingsToDoHero, { ThingsToDoHeroContentType } from '@/components/blocks/ThingsToDoHero';
import CuratedContentRail, { CuratedContentRailContentType } from '@/components/blocks/CuratedContentRail';
import VideoEmbed, { VideoEmbedContentType } from '@/components/blocks/VideoEmbed';
import HighlightCard, { HighlightCardContentType } from '@/components/blocks/HighlightCard';
// Content-block library (author-first names; see docs/OPTIMIZELY-BEST-PRACTICES.md).
import TwoColumnText, { TwoColumnTextContentType } from '@/components/blocks/TwoColumnText';
import TextAndImage, { TextAndImageContentType } from '@/components/blocks/TextAndImage';
import TextAndVideo, { TextAndVideoContentType } from '@/components/blocks/TextAndVideo';
import Quote, { QuoteContentType } from '@/components/blocks/Quote';
import Callout, { CalloutContentType } from '@/components/blocks/Callout';
import { LayoutDisplayTemplate } from '@/components/blocks/LayoutDisplayTemplate';

// This is Dubai experiences, pages + media.
import HomePage, { HomePageContentType } from '@/components/content/HomePage';
import SectionExperience, {
  PlacesToVisitContentType,
  NeighbourhoodsContentType,
  EventsContentType,
  ArticlesContentType,
} from '@/components/content/SectionExperience';
import ThingsToDoPage, { ThingsToDoPageContentType } from '@/components/content/ThingsToDoPage';
import PointOfInterest, { PointOfInterestContentType } from '@/components/content/PointOfInterest';
import ImageMedia, { ImageMediaContentType } from '@/components/media/ImageMedia';

// Referenced by PointOfInterest (area/categories). Registered for query generation
// only — they're data on the POI, not rendered as their own components yet.
import Area, { AreaContentType } from '@/components/content/Area';
import { CategoryContentType } from '@/components/content/Category';
import { TagContentType } from '@/components/content/Tag';
import EventDetail, { EventContentType } from '@/components/content/Event';
import ArticleDetail, { ArticlePostContentType } from '@/components/content/Article';

import type { Metadata } from 'next';
import { getSiteSettings, buildTitleTemplate, buildTitleDefault } from '@/lib/seo';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { PreviewBanner } from '@/components/preview/PreviewBanner';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY || "your api key here",
  graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
});

// The registry must mirror the CMS content model: types registered here but
// absent from Graph make the delivery/preview query fail ("errors in the
// GraphQL query"); types in Graph but missing here throw
// GraphMissingContentTypeError when resolved. The scaffold's Mosey Bank demo
// types were deleted from the CMS, so they are intentionally NOT registered.
initContentTypeRegistry([
  BlankExperienceContentType,
  BlankSectionContentType,
  SectionHeadingContentType,
  RichTextBlockContentType,
  HeroBannerContentType,
  SectionListingContentType,
  ThingsToDoHeroContentType,
  CuratedContentRailContentType,
  VideoEmbedContentType,
  HighlightCardContentType,
  TwoColumnTextContentType,
  TextAndImageContentType,
  TextAndVideoContentType,
  QuoteContentType,
  CalloutContentType,
  HomePageContentType,
  PlacesToVisitContentType,
  NeighbourhoodsContentType,
  EventsContentType,
  ArticlesContentType,
  ThingsToDoPageContentType,
  PointOfInterestContentType,
  AreaContentType,
  EventContentType,
  ArticlePostContentType,
  TagContentType,
  CategoryContentType,
  ImageMediaContentType,
]);

initReactComponentRegistry({
  resolver: {
    BlankExperience,
    BlankSection,
    SectionHeading,
    RichTextBlock,
    HeroBanner: Hero,
    SectionListing,
    ThingsToDoHero,
    CuratedContentRail,
    VideoEmbed,
    HighlightCard,
    TwoColumnText,
    TextAndImage,
    TextAndVideo,
    Quote,
    Callout,
    HomePage,
    PlacesToVisit: SectionExperience,
    Neighbourhoods: SectionExperience,
    Events: SectionExperience,
    Articles: SectionExperience,
    ThingsToDoPage,
    PointOfInterest,
    Area,
    Event: EventDetail,
    ArticlePost: ArticleDetail,
    ImageMedia,
  },
});

initDisplayTemplateRegistry([LayoutDisplayTemplate]);

// Display: Fraunces — a characterful, high-contrast serif for luxe editorial headlines.
const displayFont = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
});

// Body: Hanken Grotesk — a clean, modern grotesk for comfortable reading.
const bodyFont = Hanken_Grotesk({
  variable: '--font-hanken',
  subsets: ['latin'],
});

// Arabic (RTL) counterparts — Latin fonts carry no Arabic glyphs. Noto Kufi for
// display headings, Noto Sans Arabic for body. Applied via `[dir='rtl']` token
// overrides in globals.css so the whole RTL tree switches with one attribute.
const displayFontArabic = Noto_Kufi_Arabic({
  variable: '--font-arabic-display',
  subsets: ['arabic'],
});
const bodyFontArabic = Noto_Sans_Arabic({
  variable: '--font-arabic-body',
  subsets: ['arabic'],
});

/**
 * Root metadata. The title TEMPLATE comes from global CMS SiteSettings, so every
 * page's title becomes "<page> | <tagline> | <site name>" and the site name is
 * changeable in one publish (no per-page edits). Pages set only their own `title`.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  // `metadataBase` makes every relative canonical/hreflang/OG URL absolute — a hard
  // requirement for hreflang alternates (L5). Sourced from APPLICATION_HOST; omitted
  // when unset (CI/local) so Next just uses relative URLs instead of throwing.
  const base = process.env.APPLICATION_HOST?.replace(/\/$/, '');
  return {
    ...(base ? { metadataBase: new URL(base) } : {}),
    title: {
      template: buildTitleTemplate(settings),
      default: buildTitleDefault(settings),
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The active locale is set on `x-locale` by the middleware (this layout sits above
  // the `[locale]` segment, so it can't read the route param). Non-localized routes
  // (`/preview`, `/styleguide`) have no header → default locale.
  const h = await headers();
  const headerLocale = h.get('x-locale');
  const locale = isLocale(headerLocale) ? headerLocale : DEFAULT_LOCALE;
  // Current path (set by the proxy) so the header's language switcher can target the
  // same page in the other locale. Falls back to the locale home for non-localized routes.
  const pathname = h.get('x-pathname') ?? withLocale(locale, '/');

  return (
    // Dark by default (obsidian + champagne luxury). Individual sections opt into
    // light via <SectionShell theme="light">. `dir`/`lang` drive RTL + font switching;
    // Arabic font variables are always loaded so `[dir='rtl']` can pick them up.
    <html
      lang={htmlLang(locale)}
      dir={dir(locale)}
      data-theme='dark'
      className={[
        displayFont.variable,
        bodyFont.variable,
        displayFontArabic.variable,
        bodyFontArabic.variable,
      ].join(' ')}
    >
      <body className='flex min-h-dvh flex-col bg-bg text-fg'>
        <PreviewBanner locale={locale} />
        <SiteHeader locale={locale} pathname={pathname} />
        <main className='flex-1'>{children}</main>
        <SiteFooter locale={locale} />
      </body>
    </html>
  );
}
