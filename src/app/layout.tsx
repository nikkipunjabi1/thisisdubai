import React from 'react';

import { Fraunces, Hanken_Grotesk } from 'next/font/google';
import './globals.css';
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
import { LayoutDisplayTemplate } from '@/components/blocks/LayoutDisplayTemplate';

// This is Dubai experiences, pages + media.
import HomePage, { HomePageContentType } from '@/components/content/HomePage';
import SectionExperience, {
  PlacesToVisitContentType,
  NeighbourhoodsContentType,
  EventsContentType,
  ArticlesContentType,
} from '@/components/content/SectionExperience';
import PointOfInterest, { PointOfInterestContentType } from '@/components/content/PointOfInterest';
import ImageMedia, { ImageMediaContentType } from '@/components/media/ImageMedia';

// Referenced by PointOfInterest (area/categories). Registered for query generation
// only — they're data on the POI, not rendered as their own components yet.
import Area, { AreaContentType } from '@/components/content/Area';
import { CategoryContentType } from '@/components/content/Category';
import { TagContentType } from '@/components/content/Tag';
import EventDetail, { EventContentType } from '@/components/content/Event';
import ArticleDetail, { ArticleContentType, ArticlePostContentType } from '@/components/content/Article';

import type { Metadata } from 'next';
import { getSiteSettings, buildTitleTemplate, buildTitleDefault } from '@/lib/seo';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';

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
  HomePageContentType,
  PlacesToVisitContentType,
  NeighbourhoodsContentType,
  EventsContentType,
  ArticlesContentType,
  PointOfInterestContentType,
  AreaContentType,
  EventContentType,
  ArticleContentType,
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
    HomePage,
    PlacesToVisit: SectionExperience,
    Neighbourhoods: SectionExperience,
    Events: SectionExperience,
    Articles: SectionExperience,
    PointOfInterest,
    Area,
    Event: EventDetail,
    Article: ArticleDetail,
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

/**
 * Root metadata. The title TEMPLATE comes from global CMS SiteSettings, so every
 * page's title becomes "<page> | <tagline> | <site name>" and the site name is
 * changeable in one publish (no per-page edits). Pages set only their own `title`.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: {
      template: buildTitleTemplate(settings),
      default: buildTitleDefault(settings),
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Dark by default (obsidian + champagne luxury). Individual sections opt into
    // light via <SectionShell theme="light">. Keeps the whole site cohesive and
    // removes any light gap below short pages.
    <html
      lang='en'
      data-theme='dark'
      className={[displayFont.variable, bodyFont.variable].join(' ')}
    >
      <body className='flex min-h-dvh flex-col bg-bg text-fg'>
        <SiteHeader />
        <main className='flex-1'>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
