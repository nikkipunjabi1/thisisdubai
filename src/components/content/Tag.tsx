import { contentType } from '@optimizely/cms-sdk';

/**
 * Tag — the live, faceted, hierarchical taxonomy term (replaces the dormant
 * `_component` Category).
 *
 * Modelled as a **shared block** (`_component`), grouped under the **"Tag - Taxonomy"**
 * folder in the app's shared-assets area ("For This Application"). Editors add/edit
 * taxonomy from the Shared Blocks panel — no page tree, no non-routable pages, no
 * per-type access grants. (Grouping blocks into named folders rather than dumping them
 * flat is the Optimizely CMS best practice — see docs/CONTENT-ARCHITECTURE.md §3.)
 *
 * References to a Tag still resolve + FILTER by key (`tags: { key: { eq } }`), which is
 * what powers the listing facets — disproving the earlier belief that a filterable
 * taxonomy had to be `_page`. `dimension` lets one type drive several independent facets
 * (themes, cuisines, audiences…); `synonyms` + `description` feed AI/semantic search.
 *
 * Key `TagTerm` (not the retired `_page` `Tag`): base types are immutable, so the block
 * couldn't reuse the old key. `compositionBehaviors` is required for a block to be exposed
 * as a Graph root type (for the facet list) + creatable as a shared block.
 */
export const TagContentType = contentType({
  key: 'TagTerm',
  displayName: 'Tag (Taxonomy term)',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: {
    name: {
      type: 'string',
      displayName: 'Name',
      group: 'content',
      sortOrder: 1,
      isRequired: true,
      indexingType: 'searchable',
      isLocalized: true, // translatable per language
    },
    slug: {
      type: 'string',
      displayName: 'Slug',
      description: 'URL-safe identifier, e.g. "fine-dining".',
      group: 'content',
      sortOrder: 2,
      isRequired: true,
    },
    dimension: {
      type: 'string',
      format: 'selectOne',
      displayName: 'Taxonomy dimension',
      description: 'Which facet this term belongs to. Enables multiple independent filters.',
      group: 'content',
      sortOrder: 3,
      isRequired: true,
      enum: [
        { value: 'theme', displayName: 'Theme (beach, culture, adventure, luxury…)' },
        { value: 'cuisine', displayName: 'Cuisine (for dining)' },
        { value: 'audience', displayName: 'Audience (family, couples, solo, business)' },
        { value: 'amenity', displayName: 'Amenity (for hotels)' },
        { value: 'interest', displayName: 'Interest (art, history, sport…)' },
        { value: 'season', displayName: 'Season / best time' },
        { value: 'accessibility', displayName: 'Accessibility' },
        { value: 'eventType', displayName: 'Event type (festival, concert, sport…)' },
      ],
    },
    description: {
      type: 'string',
      displayName: 'Description',
      description: 'Short definition — UI tooltips + grounding context for AI.',
      group: 'content',
      sortOrder: 4,
      indexingType: 'searchable',
      isLocalized: true, // translatable per language
    },
    synonyms: {
      type: 'array',
      displayName: 'Synonyms',
      description: 'Alternate terms for semantic search + AI matching (e.g. Michelin → "fine dining").',
      group: 'content',
      sortOrder: 5,
      items: { type: 'string' },
      isLocalized: true, // AR needs its own synonyms for semantic search (L4)
    },
    parent: {
      type: 'contentReference',
      allowedTypes: ['_self'],
      displayName: 'Parent tag',
      description: 'Optional parent for hierarchy (e.g. Dining → Fine dining).',
      group: 'content',
      sortOrder: 6,
    },
    featured: {
      type: 'boolean',
      displayName: 'Featured',
      description: 'Surface this term in primary navigation / filter chips.',
      group: 'content',
      sortOrder: 7,
    },
    icon: {
      type: 'string',
      displayName: 'Icon',
      description: 'Optional icon name or emoji for chips/cards.',
      group: 'content',
      sortOrder: 8,
    },
  },
});
