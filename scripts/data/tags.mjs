// Tag taxonomy — shared blocks (`TagTerm`, baseType `_component`) living in the
// application shared-assets folder. These power the listing facets and give the
// semantic search real filter dimensions.
//
// `dimension` groups terms into facet families (theme / audience / interest /
// cuisine / eventType). `synonyms` are indexed so a search for "kids" finds the
// Family tag even though the word never appears in the term itself.

import { S } from './_helpers.mjs';

const tag = (slug, displayName, dimension, description, synonyms, icon, featured = false) => ({
  slug,
  displayName,
  props: {
    name: S(displayName),
    slug: S(slug),
    dimension: S(dimension),
    description: S(description),
    synonyms: S(synonyms),
    icon: S(icon),
    ...(featured ? { featured: S(true) } : {}),
  },
});

export const tags = [
  // — theme ————————————————————————————————————————————————
  tag('landmarks', 'Landmarks', 'theme', 'Iconic sights and must-see attractions.', ['icon', 'attraction', 'must-see', 'sight'], '🏙️', true),
  tag('beaches', 'Beaches', 'theme', 'Sun, sand and the Arabian Gulf.', ['waterfront', 'sea', 'coast', 'swimming', 'shore'], '🏖️', true),
  tag('luxury', 'Luxury', 'theme', 'Premium, five-star and exclusive experiences.', ['premium', 'five-star', 'exclusive', 'VIP', 'upscale'], '✨', true),
  tag('desert', 'Desert', 'theme', 'Dunes, wadis and the landscape beyond the city.', ['dunes', 'sand', 'safari', 'outback', 'wilderness'], '🐪', true),
  tag('architecture', 'Architecture', 'theme', 'Buildings worth the trip on their own.', ['design', 'building', 'skyline', 'structure'], '🏛️'),
  tag('views', 'Views', 'theme', 'Observation decks, high floors and long horizons.', ['viewpoint', 'panorama', 'observation deck', 'skyline', 'vista'], '🔭'),
  tag('free-to-visit', 'Free to Visit', 'theme', 'Costs nothing to enter.', ['free', 'no cost', 'budget', 'cheap'], '🆓', true),

  // — interest ——————————————————————————————————————————————
  tag('culture-heritage', 'Culture & Heritage', 'interest', 'History, museums and Emirati tradition.', ['history', 'museum', 'tradition', 'heritage', 'historic'], '🕌'),
  tag('museums', 'Museums', 'interest', 'Collections, galleries and permanent exhibitions.', ['gallery', 'exhibition', 'collection', 'archive'], '🖼️'),
  tag('art-design', 'Art & Design', 'interest', 'Contemporary art, studios and creative districts.', ['gallery', 'creative', 'studio', 'exhibition', 'sculpture'], '🎨'),
  tag('shopping', 'Shopping', 'interest', 'Malls, souks and independent retail.', ['mall', 'souk', 'market', 'retail', 'bazaar'], '🛍️', true),
  tag('wildlife', 'Wildlife & Nature', 'interest', 'Animals, aquariums, gardens and reserves.', ['animals', 'nature', 'garden', 'zoo', 'aquarium', 'birds'], '🦩'),
  tag('nightlife', 'Nightlife', 'interest', 'Evenings out — bars, shows and late openings.', ['bar', 'evening', 'night', 'lounge', 'club'], '🌙'),

  // — activity ——————————————————————————————————————————————
  tag('adventure', 'Adventure', 'interest', 'Adrenaline, heights and speed.', ['thrill', 'adrenaline', 'extreme', 'skydiving', 'zipline'], '🪂', true),
  tag('outdoors', 'Outdoors', 'interest', 'Parks, trails, water and open air.', ['park', 'walk', 'hike', 'trail', 'cycling', 'green'], '🌳'),
  tag('waterparks', 'Waterparks', 'interest', 'Slides, wave pools and lazy rivers.', ['slides', 'pool', 'aquapark', 'water slides'], '🌊'),
  tag('sports', 'Sports', 'interest', 'Racing, golf, motorsport and stadium events.', ['golf', 'racing', 'motorsport', 'stadium', 'match'], '🏇'),
  tag('wellness', 'Wellness', 'interest', 'Spas, retreats and slower days.', ['spa', 'relax', 'retreat', 'massage', 'calm'], '🧘'),

  // — cuisine ——————————————————————————————————————————————
  tag('fine-dining', 'Fine Dining', 'cuisine', 'High-end and award-winning restaurants.', ['Michelin', 'haute cuisine', 'gourmet', 'starred', 'tasting menu'], '🍽️', true),
  tag('street-food', 'Street Food', 'cuisine', 'Markets, canteens and casual local eating.', ['casual', 'cheap eats', 'market food', 'shawarma', 'canteen'], '🥙'),

  // — audience ——————————————————————————————————————————————
  tag('family', 'Family', 'audience', 'Great for kids and families.', ['kids', 'children', 'family-friendly', 'toddlers', 'teens'], '👨‍👩‍👧'),

  // — eventType —————————————————————————————————————————————
  tag('festivals', 'Festivals', 'eventType', 'City-wide festivals and seasonal celebrations.', ['festival', 'celebration', 'seasonal'], '🎉', true),
  tag('live-music', 'Live Music', 'eventType', 'Concerts, gigs and touring acts.', ['concert', 'gig', 'band', 'music', 'tour'], '🎤'),
  tag('exhibitions', 'Exhibitions', 'eventType', 'Trade shows, expos and temporary shows.', ['expo', 'trade show', 'fair', 'convention'], '📅'),
];
