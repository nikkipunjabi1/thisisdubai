import { contentType } from '@optimizely/cms-sdk';
import { SeoMetadataContract } from './SeoMetadata';
import { PointOfInterestContentType } from './PointOfInterest';
import { EventContentType } from './Event';
import { TourContentType } from './Tour';
import { HotelContentType } from './Hotel';

/**
 * Itinerary — a curated multi-day plan. Also the output shape of the AI Trip
 * Planner (see docs/AI-SEARCH.md). Kept flat for now (a mixed list of stops);
 * a per-day sub-component can be added later if authors need day grouping.
 */
export const ItineraryContentType = contentType({
  key: 'Itinerary',
  displayName: 'Itinerary',
  baseType: '_page',
  extends: SeoMetadataContract,
  properties: {
    title: { type: 'string', displayName: 'Title', group: 'content', sortOrder: 1, isRequired: true, indexingType: 'searchable', isLocalized: true },
    summary: { type: 'string', displayName: 'Summary', group: 'content', sortOrder: 2, indexingType: 'searchable', isLocalized: true },
    heroImage: { type: 'contentReference', allowedTypes: ['_image'], displayName: 'Hero image', group: 'content', sortOrder: 3 },
    durationDays: { type: 'integer', displayName: 'Duration (days)', group: 'content', sortOrder: 4, minimum: 1 },
    highlights: { type: 'array', displayName: 'Highlights', group: 'content', sortOrder: 5, items: { type: 'string' }, isLocalized: true },
    stops: {
      type: 'array',
      displayName: 'Stops',
      group: 'content',
      sortOrder: 6,
      items: {
        type: 'content',
        allowedTypes: [PointOfInterestContentType, EventContentType, TourContentType, HotelContentType],
      },
    },
  },
});
