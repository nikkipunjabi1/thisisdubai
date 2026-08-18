import { displayTemplate } from '@optimizely/cms-sdk';

/**
 * LayoutDisplayTemplate — the shared "how it looks" settings every Visual Builder
 * block exposes to authors: Light/Dark theme, Full-width/Contained, and vertical
 * spacing. Default template for all `_component` types; its values arrive on each
 * component as `displaySettings` and are applied via <SectionShell>. This is the
 * single source of the Light/Dark + Full/Container controls (COMPONENT-STANDARDS.md §3).
 */
export const LayoutDisplayTemplate = displayTemplate({
  key: 'LayoutDisplayTemplate',
  displayName: 'Layout',
  isDefault: true,
  baseType: '_component',
  settings: {
    theme: {
      editor: 'select' as const,
      displayName: 'Theme',
      sortOrder: 0,
      choices: {
        inherit: { displayName: 'Inherit', sortOrder: 0 },
        light: { displayName: 'Light', sortOrder: 1 },
        dark: { displayName: 'Dark', sortOrder: 2 },
      },
    },
    width: {
      editor: 'select' as const,
      displayName: 'Width',
      sortOrder: 1,
      choices: {
        contained: { displayName: 'Contained', sortOrder: 0 },
        full: { displayName: 'Full width', sortOrder: 1 },
      },
    },
    spacing: {
      editor: 'select' as const,
      displayName: 'Spacing',
      sortOrder: 2,
      choices: {
        compact: { displayName: 'Compact', sortOrder: 0 },
        normal: { displayName: 'Normal', sortOrder: 1 },
        spacious: { displayName: 'Spacious', sortOrder: 2 },
      },
    },
  },
});
