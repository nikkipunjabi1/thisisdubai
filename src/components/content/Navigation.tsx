import { contentType } from '@optimizely/cms-sdk';

/**
 * CMS-editable navigation model for the header mega-menu and the footer columns.
 *
 * These are pure DATA components: they are never placed on a Visual Builder canvas and are
 * never rendered on their own. They exist only as inline `component` lists INSIDE the Site
 * Settings block (src/components/content/SiteSettings.tsx), so an editor manages the whole
 * nav from one place, no separate shared blocks to hunt for. Rendering lives in
 * src/components/layout/SiteHeader.tsx / SiteFooter.tsx, read via src/lib/navigation.ts.
 *
 * Modelling notes:
 * - `NavLink` has no list property, so it can stay `elementEnabled` (matches TagTerm).
 * - `NavMenuItem` and `NavGroup` DO hold a list, and an element-enabled component may not
 *   have an array/content-list property, so they are `sectionEnabled` instead.
 * - Labels/headings are `isLocalized` so each language gets its own text; `url` is not
 *   localized (the same path serves every locale; the app adds the `/ar` prefix at render).
 */

/** A single leaf link (used in a header dropdown and in a footer column). */
export const NavLinkContentType = contentType({
  key: 'NavLink',
  displayName: 'Navigation link',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: {
    label: {
      type: 'string',
      displayName: 'Label',
      group: 'content',
      sortOrder: 1,
      isRequired: true,
      isLocalized: true,
    },
    url: {
      type: 'string',
      displayName: 'URL or path',
      description:
        'An internal path like "/events" (the language prefix is added automatically), or a full "https://…" URL.',
      group: 'content',
      sortOrder: 2,
      isRequired: true,
    },
    openInNewTab: {
      type: 'boolean',
      displayName: 'Open in a new tab',
      group: 'content',
      sortOrder: 3,
    },
  },
});

/**
 * A top-level HEADER entry. With no children it renders as a plain link; with children it
 * becomes a dropdown (the "mega menu"). `url` is optional so a parent can be a dropdown
 * trigger only (no destination of its own).
 */
export const NavMenuItemContentType = contentType({
  key: 'NavMenuItem',
  displayName: 'Header menu item',
  baseType: '_component',
  compositionBehaviors: ['sectionEnabled'],
  properties: {
    label: {
      type: 'string',
      displayName: 'Label',
      group: 'content',
      sortOrder: 1,
      isRequired: true,
      isLocalized: true,
    },
    url: {
      type: 'string',
      displayName: 'URL or path (optional)',
      description:
        'Where the top-level item links to. Leave empty to make it a dropdown-only parent.',
      group: 'content',
      sortOrder: 2,
    },
    children: {
      type: 'array',
      displayName: 'Dropdown links',
      description: 'Optional. Add links here to turn this item into a dropdown.',
      group: 'content',
      sortOrder: 3,
      items: { type: 'component', contentType: NavLinkContentType },
    },
  },
});

/** A FOOTER column: an optional heading plus its list of links. */
export const NavGroupContentType = contentType({
  key: 'NavGroup',
  displayName: 'Footer column',
  baseType: '_component',
  compositionBehaviors: ['sectionEnabled'],
  properties: {
    heading: {
      type: 'string',
      displayName: 'Column heading',
      group: 'content',
      sortOrder: 1,
      isLocalized: true,
    },
    links: {
      type: 'array',
      displayName: 'Links',
      group: 'content',
      sortOrder: 2,
      items: { type: 'component', contentType: NavLinkContentType },
    },
  },
});
