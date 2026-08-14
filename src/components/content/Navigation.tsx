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
 * Linking model: a link points at a PAGE chosen from the content tree (`page`), and its URL
 * is resolved automatically at render, so links never break when a page is moved or renamed
 * and the author never types a path. `externalUrl` is the escape hatch for off-site links.
 * `label` is an optional override; left empty, the page's own (localized) name is used.
 *
 * Modelling notes:
 * - All three carry NO composition behaviour (`compositionBehaviors: []`), so they never
 *   surface in the "Add Section" or inline element pickers — they are not page building
 *   blocks, only inline lists inside Site Settings. Inline `component` usage does not require
 *   a composition behaviour, so the nav still edits normally in the Site Settings editor.
 * - (Previously `NavLink` was `elementEnabled` and `NavMenuItem`/`NavGroup` `sectionEnabled`;
 *   that was only to satisfy the editor, and it leaked all three into the section picker.)
 */

/** Routable page/experience types an author can point a nav link at (content-tree picker). */
const LINK_TARGETS = [
  'HomePage',
  'PlacesToVisit',
  'Neighbourhoods',
  'Events',
  'Articles',
  'ThingsToDoPage',
  'PointOfInterest',
  'Event',
  'Area',
];

/** A single leaf link (used in a header dropdown and in a footer column). */
export const NavLinkContentType = contentType({
  key: 'NavLink',
  displayName: 'Navigation link',
  baseType: '_component',
  // No canvas placement: managed only as inline links inside Site Settings.
  compositionBehaviors: [],
  properties: {
    page: {
      type: 'contentReference',
      displayName: 'Page',
      description: 'Pick the page from the content tree. Its URL is used automatically.',
      group: 'content',
      sortOrder: 1,
      allowedTypes: LINK_TARGETS,
    },
    externalUrl: {
      type: 'string',
      displayName: 'External URL (optional)',
      description: 'Use instead of a page for an off-site link, e.g. https://instagram.com/…',
      group: 'content',
      sortOrder: 2,
    },
    label: {
      type: 'string',
      displayName: 'Label (optional)',
      description: 'Overrides the link text. Leave empty to use the page’s own name.',
      group: 'content',
      sortOrder: 3,
      isLocalized: true,
    },
    openInNewTab: {
      type: 'boolean',
      displayName: 'Open in a new tab',
      group: 'content',
      sortOrder: 4,
    },
  },
});

/**
 * A top-level HEADER entry. With no children it renders as a plain link; with children it
 * becomes a dropdown (the "mega menu"). `page`/`externalUrl` are optional so a parent can be
 * a dropdown trigger only (no destination of its own).
 */
export const NavMenuItemContentType = contentType({
  key: 'NavMenuItem',
  displayName: 'Header menu item',
  baseType: '_component',
  // No canvas placement: managed only as the inline header list inside Site Settings.
  compositionBehaviors: [],
  properties: {
    label: {
      type: 'string',
      displayName: 'Label',
      description: 'The text shown in the top bar.',
      group: 'content',
      sortOrder: 1,
      isRequired: true,
      isLocalized: true,
    },
    page: {
      type: 'contentReference',
      displayName: 'Page (optional)',
      description: 'Where the top-level item links to. Leave empty to make it a dropdown-only parent.',
      group: 'content',
      sortOrder: 2,
      allowedTypes: LINK_TARGETS,
    },
    externalUrl: {
      type: 'string',
      displayName: 'External URL (optional)',
      description: 'Use instead of a page for an off-site destination.',
      group: 'content',
      sortOrder: 3,
    },
    children: {
      type: 'array',
      displayName: 'Dropdown links',
      description: 'Optional. Add links here to turn this item into a dropdown.',
      group: 'content',
      sortOrder: 4,
      items: { type: 'component', contentType: NavLinkContentType },
    },
  },
});

/** A FOOTER column: an optional heading plus its list of links. */
export const NavGroupContentType = contentType({
  key: 'NavGroup',
  displayName: 'Footer column',
  baseType: '_component',
  // No canvas placement: managed only as the inline footer list inside Site Settings.
  compositionBehaviors: [],
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
