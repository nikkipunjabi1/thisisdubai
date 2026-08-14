import { contentType } from '@optimizely/cms-sdk';
import { NavMenuItemContentType, NavGroupContentType } from './Navigation';

/**
 * SiteSettings — a singleton global config item, modelled as a **shared block**
 * (`_component`) living in the application's shared-assets folder ("For This
 * Application"). This is the natural home for page-less global config: editors find
 * and edit it from the Shared Blocks panel — no page tree, no per-type access grants.
 *
 * Drives site-wide SEO/crawl behaviour. `allowSearchIndexing` is the master crawl
 * switch: treated as OFF by default (see src/app/robots.ts), so the demo is NOT
 * indexed until someone explicitly turns it on for a launch. Fetched by
 * src/lib/seo.ts (scoped to the site's Start Page subtree via `_metadata.path`).
 */
export const SiteSettingsContentType = contentType({
  // New key: base types are immutable, so the block can't reuse the retired `_page`
  // `SiteSettings` key. The GraphQL root type is therefore `SiteConfiguration`.
  key: 'SiteConfiguration',
  displayName: 'Site Settings',
  baseType: '_component',
  // Exposed as a Graph root type + creatable as a shared block. `sectionEnabled` (not
  // `elementEnabled`) because this block now holds list properties (the nav below), and an
  // element-enabled component may not have an array/content-list property. It's config, not
  // a visual element, so authors won't actually place it on a canvas either way.
  compositionBehaviors: ['sectionEnabled'],
  properties: {
    // --- Global branding used in every page's <title> ---
    siteName: {
      type: 'string',
      displayName: 'Site name',
      description:
        'Appended to every page title, e.g. "…| This is Dubai". Change here to rebrand the whole site in one publish.',
      group: 'content',
      sortOrder: 1,
      isLocalized: true, // translatable per language
    },
    titleTagline: {
      type: 'string',
      displayName: 'Title tagline',
      description: 'Optional middle segment of the title, e.g. "Unofficial Travel & Tourism Guide".',
      group: 'content',
      sortOrder: 2,
      isLocalized: true, // translatable per language
    },
    titleSeparator: {
      type: 'string',
      displayName: 'Title separator',
      description: 'Separator between title segments (default "|").',
      group: 'content',
      sortOrder: 3,
    },
    // --- Crawl control ---
    allowSearchIndexing: {
      type: 'boolean',
      displayName: 'Allow search-engine indexing (global)',
      description:
        'OFF for the demo so crawlers do not index it. Turn ON only for a real launch. ' +
        'When OFF, robots.txt disallows all crawlers and every page is served noindex.',
      group: 'seo',
      sortOrder: 1,
    },
    robotsTxtCustom: {
      type: 'string',
      displayName: 'Custom robots.txt additions',
      description: 'Optional extra lines appended to the generated robots.txt (when indexing is allowed).',
      group: 'seo',
      sortOrder: 2,
    },
    // --- Top Navigation (the "Top Navigation" tab) ---
    // Header mega-menu: an ordered list of top-level items; each may carry a dropdown of
    // links (NavMenuItem.children). Reorder / add / remove right here in the editor.
    headerMenu: {
      type: 'array',
      displayName: 'Header menu',
      description:
        'The primary navigation. Drag to reorder. Add “Dropdown links” to an item to turn it into a mega-menu dropdown. Leave the whole list empty to use the built-in default nav.',
      group: 'topNavigation',
      sortOrder: 1,
      items: { type: 'component', contentType: NavMenuItemContentType },
    },
    showSearch: {
      type: 'boolean',
      displayName: 'Show search in the header',
      description: 'Turn the header search control on or off. Defaults to on when unset.',
      group: 'topNavigation',
      sortOrder: 2,
    },
    languageSwitchLabel: {
      type: 'string',
      displayName: 'Language name (this language)',
      description:
        'The name of THIS language, in its own script (e.g. "English" on the English version, "العربية" on the Arabic version). The switcher shows the OTHER language\'s name, taken from that language\'s value here.',
      group: 'topNavigation',
      sortOrder: 3,
      isLocalized: true,
    },

    // --- Footer (the "Footer" tab) ---
    // A list of columns, each a heading + its links.
    footerGroups: {
      type: 'array',
      displayName: 'Footer columns',
      description:
        'Each entry is a footer column (a heading plus its links). Leave empty to use the built-in default footer.',
      group: 'footer',
      sortOrder: 1,
      items: { type: 'component', contentType: NavGroupContentType },
    },

    // --- Cookie Consent Banner (the "Cookie Consent Banner" tab) ---
    // SKELETON ONLY: fields are authored now; the front-end banner is a later sprint.
    cookieConsentEnabled: {
      type: 'boolean',
      displayName: 'Enable cookie consent banner',
      description: 'Skeleton for a future release. No front-end yet.',
      group: 'cookieConsent',
      sortOrder: 1,
    },
    cookieConsentMessage: {
      type: 'string',
      displayName: 'Message',
      description: 'The consent text shown in the banner.',
      group: 'cookieConsent',
      sortOrder: 2,
      isLocalized: true,
    },
    cookieAcceptLabel: {
      type: 'string',
      displayName: 'Accept button label',
      group: 'cookieConsent',
      sortOrder: 3,
      isLocalized: true,
    },
    cookieDeclineLabel: {
      type: 'string',
      displayName: 'Decline button label',
      group: 'cookieConsent',
      sortOrder: 4,
      isLocalized: true,
    },
    cookiePolicyLinkLabel: {
      type: 'string',
      displayName: 'Policy link label',
      description: 'e.g. "Privacy policy".',
      group: 'cookieConsent',
      sortOrder: 5,
      isLocalized: true,
    },
    cookiePolicyPage: {
      type: 'contentReference',
      displayName: 'Policy page',
      description: 'The privacy/cookie policy page (picked from the content tree).',
      group: 'cookieConsent',
      sortOrder: 6,
    },

    // --- Announcement Bar (the "Announcement Bar" tab) ---
    // SKELETON ONLY: a site-wide alert/notice strip. Front-end component is a later sprint.
    announcementEnabled: {
      type: 'boolean',
      displayName: 'Show announcement bar',
      description: 'Skeleton for a future release. No front-end yet.',
      group: 'announcementBar',
      sortOrder: 1,
    },
    announcementMessage: {
      type: 'string',
      displayName: 'Message',
      description: 'The alert/notice text.',
      group: 'announcementBar',
      sortOrder: 2,
      isLocalized: true,
    },
    announcementTone: {
      type: 'string',
      format: 'selectOne',
      displayName: 'Tone',
      description: 'Visual style of the bar (used by the future front-end).',
      group: 'announcementBar',
      sortOrder: 3,
      enum: [
        { value: 'info', displayName: 'Info' },
        { value: 'success', displayName: 'Success' },
        { value: 'warning', displayName: 'Warning' },
        { value: 'critical', displayName: 'Critical' },
      ],
    },
    announcementLinkLabel: {
      type: 'string',
      displayName: 'Link label (optional)',
      group: 'announcementBar',
      sortOrder: 4,
      isLocalized: true,
    },
    announcementLinkPage: {
      type: 'contentReference',
      displayName: 'Link page (optional)',
      description: 'Where the announcement links to (picked from the content tree).',
      group: 'announcementBar',
      sortOrder: 5,
    },
    announcementDismissible: {
      type: 'boolean',
      displayName: 'Allow visitors to dismiss it',
      group: 'announcementBar',
      sortOrder: 6,
    },
  },
});
