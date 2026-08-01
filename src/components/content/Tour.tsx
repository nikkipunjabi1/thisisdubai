import { contentType } from '@optimizely/cms-sdk';
import { SeoMetadataContract } from './SeoMetadata';
import { CategoryContentType } from './Category';
import { PointOfInterestContentType } from './PointOfInterest';

/** Tour — a curated experience / package that strings together points of interest. */
export const TourContentType = contentType({
  key: 'Tour',
  displayName: 'Tour / Experience',
  baseType: '_page',
  extends: SeoMetadataContract,
  properties: {
    name: { type: 'string', displayName: 'Name', group: 'content', sortOrder: 1, isRequired: true, indexingType: 'searchable', isLocalized: true },
    summary: { type: 'string', displayName: 'Summary', group: 'content', sortOrder: 2, indexingType: 'searchable', isLocalized: true },
    body: { type: 'richText', displayName: 'Body', group: 'content', sortOrder: 3, isLocalized: true },
    images: { type: 'array', displayName: 'Images', group: 'content', sortOrder: 4, items: { type: 'contentReference', allowedTypes: ['_image'] } },
    durationHours: { type: 'float', displayName: 'Duration (hours)', group: 'content', sortOrder: 5, minimum: 0 },
    priceFrom: { type: 'float', displayName: 'Price from', group: 'content', sortOrder: 6, minimum: 0 },
    highlights: { type: 'array', displayName: 'Highlights', group: 'content', sortOrder: 7, items: { type: 'string' }, isLocalized: true },
    stops: { type: 'array', displayName: 'Stops', group: 'content', sortOrder: 8, items: { type: 'content', allowedTypes: [PointOfInterestContentType] } },
    categories: { type: 'array', displayName: 'Categories', group: 'content', sortOrder: 9, items: { type: 'content', allowedTypes: [CategoryContentType] } },
    bookingUrl: { type: 'url', displayName: 'Booking URL', group: 'content', sortOrder: 10 },
  },
});
