import { contentType } from '@optimizely/cms-sdk';
import { SeoMetadataContract } from './SeoMetadata';
import { AreaContentType } from './Area';
import { CategoryContentType } from './Category';

/** Hotel — a place to stay. */
export const HotelContentType = contentType({
  key: 'Hotel',
  displayName: 'Hotel',
  baseType: '_page',
  extends: SeoMetadataContract,
  properties: {
    name: { type: 'string', displayName: 'Name', group: 'content', sortOrder: 1, isRequired: true, indexingType: 'searchable', isLocalized: true },
    summary: { type: 'string', displayName: 'Summary', group: 'content', sortOrder: 2, indexingType: 'searchable', isLocalized: true },
    body: { type: 'richText', displayName: 'Body', group: 'content', sortOrder: 3, isLocalized: true },
    images: { type: 'array', displayName: 'Images', group: 'content', sortOrder: 4, items: { type: 'contentReference', allowedTypes: ['_image'] } },
    area: { type: 'contentReference', allowedTypes: [AreaContentType], displayName: 'Area', group: 'content', sortOrder: 5 },
    starRating: { type: 'integer', displayName: 'Star rating', group: 'content', sortOrder: 6, minimum: 1, maximum: 5 },
    priceBand: {
      type: 'string',
      format: 'selectOne',
      displayName: 'Price band',
      group: 'content',
      sortOrder: 7,
      enum: [
        { value: '$', displayName: '$' },
        { value: '$$', displayName: '$$' },
        { value: '$$$', displayName: '$$$' },
        { value: '$$$$', displayName: '$$$$' },
      ],
    },
    amenities: { type: 'array', displayName: 'Amenities', group: 'content', sortOrder: 8, items: { type: 'string' }, isLocalized: true },
    latitude: { type: 'float', displayName: 'Latitude', group: 'content', sortOrder: 9, minimum: -90, maximum: 90 },
    longitude: { type: 'float', displayName: 'Longitude', group: 'content', sortOrder: 10, minimum: -180, maximum: 180 },
    bookingUrl: { type: 'url', displayName: 'Booking URL', group: 'content', sortOrder: 11 },
  },
});
