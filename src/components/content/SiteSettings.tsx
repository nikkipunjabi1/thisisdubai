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
    // --- Navigation (the "Navigation" tab) ---
    // Header mega-menu: an ordered list of top-level items; each may carry a dropdown of
    // links (NavMenuItem.children). Reorder / add / remove right here in the editor.
    headerMenu: {
      type: 'array',
      displayName: 'Header menu',
      description:
        'The primary navigation. Drag to reorder. Add “Dropdown links” to an item to turn it into a mega-menu dropdown. Leave the whole list empty to use the built-in default nav.',
      group: 'navigation',
      sortOrder: 1,
      items: { type: 'component', contentType: NavMenuItemContentType },
    },
    // Footer: a list of columns, each a heading + its links.
    footerGroups: {
      type: 'array',
      displayName: 'Footer columns',
      description:
        'Each entry is a footer column (a heading plus its links). Leave empty to use the built-in default footer.',
      group: 'navigation',
      sortOrder: 2,
      items: { type: 'component', contentType: NavGroupContentType },
    },
  },
});
