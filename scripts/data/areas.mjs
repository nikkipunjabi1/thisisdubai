// Neighbourhoods (`Area`) — 15 districts, each the parent "place" that POIs and
// Events point at via their `area` reference.
//
// Copy is original and descriptive; place names, coordinates and factual detail
// are used descriptively (see ASSETS.md §"Legal hygiene").

import { area } from './_helpers.mjs';

export const areas = [
  area('downtown-dubai', 'Downtown Dubai', {
    summary: 'The glittering heart of the city — Burj Khalifa, The Dubai Fountain and the Dubai Mall.',
    lat: 25.1972,
    lng: 55.2744,
    description: `<p>Downtown is the Dubai of the postcards: a dense, deliberately theatrical district built around the world's tallest building and arranged so that almost every sightline ends at it. It is compact enough to walk, which is unusual here, and most visitors spend their first evening in the city somewhere within a few hundred metres of the Burj Lake.</p>
<h2>What it feels like</h2>
<p>Polished and busy. Boulevards are wide and immaculately kept, the retail is relentless, and the crowd is overwhelmingly international. In the evening the whole district orients itself around the fountain shows, and the terraces along Souk Al Bahar fill an hour before sunset.</p>
<h2>Best for</h2>
<p>First-time visitors, skyline photography, high-end shopping and dining, and anyone who wants a lot of headline sights within a short walk. Less rewarding if you are after quiet or anything resembling old Dubai.</p>`,
  }),

  area('business-bay', 'Business Bay', {
    summary: 'A high-rise commercial district on the Dubai Water Canal, immediately south of Downtown.',
    lat: 25.1857,
    lng: 55.2766,
    description: `<p>Business Bay grew up as Downtown's working neighbour — a grid of office and residential towers wrapped around the Dubai Water Canal. In the last few years the canal-side promenade has turned it into somewhere people actually linger, with a run of independent cafés and restaurants at the base of the towers.</p>
<h2>What it feels like</h2>
<p>Corporate by day, considerably more relaxed after dark. The canal walk is the district's redeeming feature: several kilometres of landscaped waterfront, joggers and cyclists at either end of the day, and a genuinely good view back at the Downtown skyline.</p>
<h2>Best for</h2>
<p>Waterfront walks, brunch, and staying somewhere central without paying Downtown rates.</p>`,
  }),

  area('zabeel', 'Za’abeel', {
    summary: 'Home to the Dubai Frame, Zabeel Park and the Museum of the Future.',
    lat: 25.2298,
    lng: 55.3009,
    description: `<p>Za'abeel sits between old and new Dubai, and its landmarks make the point explicitly — the Dubai Frame was designed so that you look through it at the low-rise historic city on one side and the towers on the other. It is also home to the Museum of the Future, one of the few buildings in the city that people travel to see purely as architecture.</p>
<h2>What it feels like</h2>
<p>Green, by Dubai standards. Zabeel Park is one of the largest in the city and gives the district a civic, family-weekend quality that the glossier neighbourhoods lack.</p>
<h2>Best for</h2>
<p>Architecture, museums, and an afternoon in an actual park.</p>`,
  }),

  area('old-dubai', 'Old Dubai', {
    summary: 'Deira and Bur Dubai — historic souks, the Creek and traditional abra crossings.',
    lat: 25.2697,
    lng: 55.3094,
    description: `<p>Old Dubai is the city that existed before the oil money: a trading port on a saltwater creek, with the souks on one bank and the merchants' houses on the other. It is still a working district rather than a preserved one, which is exactly what makes it worth your time.</p>
<h2>What it feels like</h2>
<p>Dense, loud, and refreshingly unpolished. The lanes are narrow, the shopfronts are stacked three deep, and the crossing between the two banks is still made by abra — a wooden water taxi that costs a single dirham and has not been prettified for visitors.</p>
<h2>Best for</h2>
<p>History, markets, street food, photography, and understanding how the rest of the city got here. Give it a morning, and go early before the heat.</p>`,
  }),

  area('deira', 'Deira', {
    summary: 'The Creek’s northern bank — gold, spices and the city’s oldest trading streets.',
    lat: 25.2713,
    lng: 55.3095,
    description: `<p>Deira is where Dubai's merchant history is thickest on the ground. The gold, spice and perfume souks all sit within a few streets of each other, dhows still unload cargo along the Creek wharfage, and the surrounding blocks are a genuine working neighbourhood of small traders and canteens.</p>
<h2>What it feels like</h2>
<p>Cheerfully chaotic. Expect to be approached by shopkeepers, expect to haggle, and expect the spice souk to smell extraordinary. The wharfside in the early morning, with dhows being loaded by hand, is one of the best free sights in the city.</p>
<h2>Best for</h2>
<p>Souks, bargaining, street food, and photographers who prefer texture to skyline.</p>`,
  }),

  area('jumeirah', 'Jumeirah', {
    summary: 'A low-rise coastal strip of beaches, villas, mosques and the Burj Al Arab.',
    lat: 25.2048,
    lng: 55.2437,
    description: `<p>Jumeirah runs along the coast south-west of the centre: a long, low-rise band of villas, beach clubs and independent cafés, anchored at its southern end by the Burj Al Arab. It is the closest Dubai gets to a residential seaside neighbourhood.</p>
<h2>What it feels like</h2>
<p>Slower and greener than the tower districts. Public beaches here are genuinely public and well maintained, the Jumeirah Mosque is one of the few in the city that welcomes non-Muslim visitors on guided tours, and the whole strip is pleasant to drive or cycle at either end of the day.</p>
<h2>Best for</h2>
<p>Beach days, swimming, casual dining, and the classic Burj Al Arab photograph.</p>`,
  }),

  area('palm-jumeirah', 'Palm Jumeirah', {
    summary: 'The palm-shaped artificial archipelago of resorts, beaches and the Atlantis.',
    lat: 25.1124,
    lng: 55.139,
    description: `<p>Palm Jumeirah is the reclaimed island that made Dubai's reputation for building the improbable — a palm-shaped archipelago of sixteen fronds and a crescent breakwater, added to the coastline in the 2000s. The shape only really registers from the air or from a high floor, which is why the observation deck at its centre does such steady business.</p>
<h2>What it feels like</h2>
<p>Resort-dominated. The trunk is a busy road lined with towers; the fronds are private villas; the crescent is a run of large hotels. Palm West Beach and The Pointe are where the island feels most public.</p>
<h2>Best for</h2>
<p>Resorts, waterparks, beach clubs, and views back at the mainland skyline.</p>`,
  }),

  area('dubai-marina', 'Dubai Marina', {
    summary: 'A waterfront district of skyscrapers, promenades and yacht-lined canals.',
    lat: 25.0805,
    lng: 55.1403,
    description: `<p>Dubai Marina is an artificial canal cut inland from the Gulf and then built around densely — one of the highest concentrations of tall residential towers anywhere. The result is a genuine canyon of buildings with a seven-kilometre promenade running along the water at its base.</p>
<h2>What it feels like</h2>
<p>The most walkable district in the city, and the one that feels most lived-in after dark. The Marina Walk is busy every evening with residents, joggers and diners, and the water is constantly crossed by yachts and tour boats.</p>
<h2>Best for</h2>
<p>Evening strolls, waterfront dining, boat trips, and skyline photography from ground level.</p>`,
  }),

  area('jbr', 'Jumeirah Beach Residence', {
    summary: 'JBR — a beachfront strip of towers, open-air retail and the city’s most popular public beach.',
    lat: 25.0785,
    lng: 55.1338,
    description: `<p>JBR is the beach end of the Marina district: two parallel strips — The Walk, an open-air run of shops and restaurants, and The Beach, a landscaped public beachfront directly on the Gulf. Together they make the most reliably lively stretch of coast in Dubai.</p>
<h2>What it feels like</h2>
<p>Holiday-town energy, at scale. Expect crowds at weekends, a good deal of noise, watersports operators along the sand, and an outdoor cinema and splash park among the retail.</p>
<h2>Best for</h2>
<p>Families, swimming, casual eating, and people-watching. Not the place to come for quiet.</p>`,
  }),

  area('bluewaters-island', 'Bluewaters Island', {
    summary: 'A small island off JBR built around Ain Dubai, the world’s tallest observation wheel.',
    lat: 25.0785,
    lng: 55.1215,
    description: `<p>Bluewaters is a compact island just off the JBR shoreline, connected by road and by a pedestrian bridge, and built almost entirely around a single landmark: Ain Dubai, an observation wheel that stands over 250 metres tall.</p>
<h2>What it feels like</h2>
<p>Small, tidy and easy to cover on foot in an hour. A low-rise ring of restaurants and shops wraps the wheel, and the seaward side has a quiet promenade with a clear view back at the Marina towers.</p>
<h2>Best for</h2>
<p>Sunset views, an easy evening walk, and dinner with the skyline in front of you.</p>`,
  }),

  area('dubai-creek-harbour', 'Dubai Creek Harbour', {
    summary: 'A newer waterfront district upstream on the Creek, beside a protected flamingo sanctuary.',
    lat: 25.2048,
    lng: 55.3517,
    description: `<p>Dubai Creek Harbour is a large development upstream from the historic Creek, still filling in. What makes it worth the trip today is the combination of a wide, uncrowded waterfront promenade and its immediate neighbour: the Ras Al Khor Wildlife Sanctuary, a protected wetland where flamingos gather in the thousands.</p>
<h2>What it feels like</h2>
<p>Spacious and unusually quiet. The Creek Marina promenade has one of the best uninterrupted views of the Downtown skyline anywhere in the city, particularly at sunset.</p>
<h2>Best for</h2>
<p>Birdwatching, skyline photography, and a walk without crowds.</p>`,
  }),

  area('al-quoz', 'Al Quoz', {
    summary: 'An industrial quarter turned gallery district — warehouses, studios and independent coffee.',
    lat: 25.1435,
    lng: 55.2314,
    description: `<p>Al Quoz is a working industrial zone that has, in one specific corner, become the centre of Dubai's contemporary art scene. Alserkal Avenue — a converted marble factory compound — now holds galleries, project spaces, a cinema and a cluster of independent cafés.</p>
<h2>What it feels like</h2>
<p>Deliberately unglamorous. Warehouses, roller doors, and no attempt at polish, which is precisely the appeal. It is the one district where the city's creative community is visibly concentrated rather than dispersed.</p>
<h2>Best for</h2>
<p>Galleries, independent cinema, design shopping and coffee. Check opening hours — much of it is closed on Sunday and quiet during the day.</p>`,
  }),

  area('city-walk', 'City Walk & Al Wasl', {
    summary: 'A low-rise pedestrian district of boutiques, street art, arenas and indoor attractions.',
    lat: 25.2048,
    lng: 55.2612,
    description: `<p>City Walk is a purpose-built pedestrian quarter between Downtown and the coast — an open-air grid of boutiques, restaurants and street murals designed to be walked rather than driven. The surrounding Al Wasl area adds the Coca-Cola Arena, the city's main indoor concert venue, and a set of family attractions.</p>
<h2>What it feels like</h2>
<p>European-adjacent, and consciously so: low buildings, wide pavements, outdoor seating and a lot of public art. Comfortable in the cooler months, harder work in high summer.</p>
<h2>Best for</h2>
<p>Shopping without a mall, concerts, indoor attractions on a hot day, and an easy evening out.</p>`,
  }),

  area('expo-city', 'Expo City Dubai', {
    summary: 'The Expo 2020 site, kept on as a permanent district of pavilions and parkland.',
    lat: 24.9605,
    lng: 55.1508,
    description: `<p>Rather than demolish the Expo 2020 site, Dubai kept it — the central plaza, the flagship pavilions and the surrounding parkland are now a permanent district on the city's south-western edge. It is one of the few places here explicitly built around walking and shade.</p>
<h2>What it feels like</h2>
<p>Calm and generously planned. Al Wasl Plaza's latticed dome doubles as a projection surface after dark, and the sustainability and mobility pavilions remain open as permanent attractions.</p>
<h2>Best for</h2>
<p>Architecture, families, and a half-day away from the density of the centre. It is a long way out — allow for the drive or take the Metro.</p>`,
  }),

  area('al-barsha', 'Al Barsha', {
    summary: 'A residential inland district built around Mall of the Emirates and its indoor ski slope.',
    lat: 25.1181,
    lng: 55.2004,
    description: `<p>Al Barsha is where a large share of Dubai's middle-income residents actually live — apartment blocks, villa compounds, schools and clinics, with Mall of the Emirates and Ski Dubai as its landmarks. Further south, Al Barsha South holds the Miracle Garden and the Butterfly Garden.</p>
<h2>What it feels like</h2>
<p>Unglamorous and useful. There is little here designed for visitors beyond the mall and the gardens, which is precisely why it gives a clearer picture of ordinary Dubai than the coastal districts do.</p>
<h2>Best for</h2>
<p>Indoor skiing, shopping, seasonal flower gardens, and well-priced hotels a short Metro ride from the beach.</p>`,
  }),

  area('dubailand', 'Dubailand', {
    summary: 'A vast inland leisure zone holding Global Village, IMG Worlds and the safari park.',
    lat: 25.0699,
    lng: 55.3095,
    description: `<p>Dubailand is less a neighbourhood than a planning designation: an enormous inland tract set aside for leisure and entertainment developments, parts of it built out and parts still empty desert. What exists is significant — Global Village, IMG Worlds of Adventure and the Dubai Safari Park all sit within it.</p>
<h2>What it feels like</h2>
<p>Spread out and car-dependent. Attractions are separated by long stretches of road, so this is somewhere you visit for one specific thing rather than wander.</p>
<h2>Best for</h2>
<p>Theme parks, the seasonal Global Village, and wildlife. Plan around a single destination per trip and allow driving time.</p>`,
  }),

  area('jebel-ali', 'Jebel Ali', {
    summary: 'The south-western industrial and port district — home to Dubai Parks and Resorts.',
    lat: 24.9184,
    lng: 55.0093,
    description: `<p>Jebel Ali is Dubai's industrial engine: one of the largest container ports in the world, a free zone, and the power and desalination plants that keep the city running. For visitors, its relevance is Dubai Parks and Resorts — the multi-park complex holding Motiongate, Legoland and Real Madrid World.</p>
<h2>What it feels like</h2>
<p>Functional and very large. Nothing about the district invites strolling, but the parks themselves are self-contained and well built.</p>
<h2>Best for</h2>
<p>Theme parks, and only theme parks. About 40 minutes' drive from Downtown, further in traffic.</p>`,
  }),

  area('al-marmoom', 'Al Marmoom & the Desert', {
    summary: 'The protected desert interior — dunes, oryx, cycle tracks and man-made lakes.',
    lat: 24.7869,
    lng: 55.3752,
    description: `<p>South of the built city the emirate turns to open desert, and a large share of it is protected. Al Marmoom is the UAE's largest unfenced conservation reserve, covering around a tenth of Dubai's land area, with the Dubai Desert Conservation Reserve further east.</p>
<h2>What it feels like</h2>
<p>Genuinely empty. Dune, gravel plain and oasis, with reintroduced Arabian oryx and gazelle, dark skies at night, and the 86-kilometre Al Qudra cycle track running through it. The lakes — Al Qudra and Love Lake — are artificial and have become significant bird habitat.</p>
<h2>Best for</h2>
<p>Cycling, camping, stargazing and desert wildlife. Winter only: between May and September the daytime heat here is dangerous, not merely uncomfortable. Carry water, stay on marked tracks, and take everything out with you.</p>`,
  }),

  area('hatta', 'Hatta', {
    summary: 'A mountain exclave of Dubai in the Hajar range — wadis, a dam and hiking trails.',
    lat: 24.7973,
    lng: 56.1216,
    description: `<p>Hatta is a piece of Dubai that sits about 130 kilometres inland, surrounded by the Hajar Mountains near the Omani border. It looks and feels nothing like the rest of the emirate: bare rock, deep wadis, and a turquoise reservoir behind the Hatta Dam.</p>
<h2>What it feels like</h2>
<p>Genuinely rural. Mountain roads, a restored heritage village, and the kind of silence that does not exist on the coast. Winter weekends are busy with kayakers and mountain bikers; summer is punishingly hot.</p>
<h2>Best for</h2>
<p>Hiking, kayaking, mountain biking and a complete change of scene. Best visited between October and April, and worth an overnight rather than a day trip.</p>`,
  }),
];
