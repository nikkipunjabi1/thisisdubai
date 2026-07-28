// Places to Visit — Palm Jumeirah, Dubai Marina, Bluewaters and JBR (20).

import { poi } from '../_helpers.mjs';

export const palmMarinaPois = [
  poi('palm-jumeirah', 'Palm Jumeirah', {
    summary: 'The palm-shaped archipelago of beaches, resorts and the Atlantis.',
    area: 'palm-jumeirah', tags: ['landmarks', 'beaches', 'luxury', 'architecture'],
    lat: 25.1124, lng: 55.139, priceBand: 'free', openingHours: 'Open 24 hours',
    accolades: ['Largest artificial island of its kind when completed'],
    body: `<p>Palm Jumeirah was reclaimed from the sea in the 2000s using around 94 million cubic metres of sand and seven million tonnes of rock, arranged as a trunk, sixteen fronds and an eleven-kilometre crescent breakwater. It added some 56 kilometres to Dubai's coastline.</p>
<h2>Getting around</h2>
<p>A monorail runs the length of the trunk from the mainland to Atlantis. The fronds are private and gated, so the island you can actually visit is the trunk, the crescent hotels, The Pointe and Palm West Beach.</p>
<h2>Worth knowing</h2>
<p>The palm shape is invisible from ground level — that is the one thing everyone underestimates. To see it, go up The View at The Palm, take a seaplane, or accept the aerial photographs.</p>`,
  }),

  poi('atlantis-the-palm', 'Atlantis, The Palm', {
    summary: 'The pink-turreted resort at the head of the Palm, with an aquarium and waterpark.',
    area: 'palm-jumeirah', tags: ['luxury', 'family', 'landmarks'],
    lat: 25.1304, lng: 55.1171, priceBand: '$$$$', openingHours: 'Open 24 hours',
    body: `<p>Atlantis sits at the apex of the Palm's crescent and is effectively a destination in itself — 1,500 rooms, a waterpark, a large aquarium, a dolphin facility and a run of restaurants from celebrity chefs. Its silhouette closes the view down the whole length of the island.</p>
<h2>Visiting without staying</h2>
<p>The lobby, the shopping arcade and the restaurants are open to non-guests, as are Aquaventure and The Lost Chambers on separate tickets. The beach and pools are guests-only.</p>
<h2>Worth knowing</h2>
<p>The Ambassador Lagoon — a 11-million-litre aquarium — is visible from the free-to-enter public corridor, which is a considerable amount of aquarium for nothing.</p>`,
  }),

  poi('aquaventure-waterpark', 'Aquaventure Waterpark', {
    summary: 'One of the world’s largest waterparks, with record-breaking slides and a private beach.',
    area: 'palm-jumeirah', tags: ['waterparks', 'family', 'adventure'],
    lat: 25.1315, lng: 55.1178, priceBand: '$$$$', openingHours: 'Daily 10:00–18:30',
    accolades: ['One of the largest waterparks in the world'],
    body: `<p>Aquaventure spans some 22 hectares with over a hundred slides and attractions across several towers. The Leap of Faith drops you almost vertically through a transparent tube that passes through a shark-filled lagoon; Poseidon's Revenge starts with a trapdoor and hits around 60km/h.</p>
<h2>Beyond the slides</h2>
<p>Entry includes 700 metres of private beach, a long lazy river with rapids and wave surges, a large children's zone, and the shark and ray lagoon. Shark safaris and dolphin encounters cost extra.</p>
<h2>Worth knowing</h2>
<p>A full day, not a half. Buy online in advance — walk-up prices are considerably higher. Queues for the headline slides are longest between noon and three; go early and do those first.</p>`,
  }),

  poi('the-lost-chambers-aquarium', 'The Lost Chambers Aquarium', {
    summary: 'A themed aquarium of sunken ruins beneath Atlantis, with 65,000 marine animals.',
    area: 'palm-jumeirah', tags: ['family', 'wildlife', 'museums'],
    lat: 25.1307, lng: 55.1174, priceBand: '$$$', openingHours: 'Daily 10:00–22:00',
    body: `<p>A network of tunnels and chambers built around the Ambassador Lagoon and dressed as the ruins of a sunken city. Around 65,000 animals across 65 species — rays, groupers, jellyfish, seahorses and a large shark population.</p>
<h2>Best bits</h2>
<p>The jellyfish gallery and the tunnel under the main lagoon. Feeding sessions and diver talks run through the day and are worth timing your visit around.</p>
<h2>Worth knowing</h2>
<p>Combination tickets with Aquaventure are much better value than buying separately. Around 90 minutes to see it all.</p>`,
  }),

  poi('the-view-at-the-palm', 'The View at The Palm', {
    summary: 'A 240m observation deck at the centre of the Palm — the only place its shape is visible.',
    area: 'palm-jumeirah', tags: ['views', 'landmarks'],
    lat: 25.1109, lng: 55.1391, priceBand: '$$', openingHours: 'Daily 10:00–22:00',
    body: `<p>An observation deck on the 52nd floor of the Palm Tower, 240 metres up and positioned at the centre of the island. It is the only publicly accessible point from which the palm shape actually reads.</p>
<h2>What you get</h2>
<p>A 360-degree indoor deck with an outdoor terrace, plus a small gallery on how the island was built — which is genuinely interesting, given the engineering involved. The view takes in the fronds, the crescent, the Marina skyline and the open Gulf.</p>
<h2>Worth knowing</h2>
<p>Considerably cheaper than the Burj Khalifa and rarely as crowded. Timed tickets; sunset slots go first. Around an hour is enough.</p>`,
  }),

  poi('the-pointe', 'The Pointe', {
    summary: 'A waterfront dining and retail destination facing Atlantis across the crescent.',
    area: 'palm-jumeirah', tags: ['nightlife', 'shopping', 'free-to-visit', 'views'],
    lat: 25.1183, lng: 55.1187, priceBand: 'free', openingHours: 'Daily 10:00–24:00',
    body: `<p>A curved waterfront promenade at the tip of the Palm's trunk, lined with restaurants and shops and looking directly across the water at Atlantis. Free to walk, with a wide boardwalk and plenty of seating.</p>
<h2>Best for</h2>
<p>Dinner with the Atlantis lit up opposite, and one of the better sunset positions on the island. There is a beach club, a cinema and a marina for boat trips.</p>
<h2>Worth knowing</h2>
<p>Reachable on the Palm Monorail. Weekend evenings are busy; weekdays are calm.</p>`,
  }),

  poi('palm-west-beach', 'Palm West Beach', {
    summary: 'A public beach and boardwalk on the Palm’s western trunk, with a run of beach clubs.',
    area: 'palm-jumeirah', tags: ['beaches', 'free-to-visit', 'nightlife', 'outdoors'],
    lat: 25.1097, lng: 55.1373, priceBand: 'free', openingHours: 'Open 24 hours',
    body: `<p>A 1.6-kilometre boardwalk running along the western side of the Palm's trunk, with free public beach access and a continuous strip of beach clubs, cafés and restaurants behind it. It faces west, straight into the sunset and the Marina skyline.</p>
<h2>Best for</h2>
<p>Sunset. It is the best west-facing public beach in the city, and the running and cycling track behind the sand is well used at either end of the day.</p>
<h2>Worth knowing</h2>
<p>Beach access is free; the clubs charge a minimum spend for sunbeds. Parking along the strip is paid and fills up at weekends.</p>`,
  }),

  poi('nakheel-mall', 'Nakheel Mall', {
    summary: 'The Palm’s main shopping centre, at the base of the Palm Tower.',
    area: 'palm-jumeirah', tags: ['shopping', 'family', 'free-to-visit'],
    lat: 25.1113, lng: 55.1394, priceBand: 'free', openingHours: 'Daily 10:00–22:00',
    body: `<p>Five levels of retail, a cinema and a large food hall at the base of the Palm Tower, serving the island's residents and visitors. It is the entry point for The View observation deck.</p>
<h2>Worth knowing</h2>
<p>Directly on the monorail. Rooftop dining on the upper level has open views along the trunk. Useful rather than remarkable — but it is where you go if you need anything on the island.</p>`,
  }),

  poi('dubai-marina-walk', 'Dubai Marina Walk', {
    summary: 'A 7km waterfront promenade of cafés, dining and yacht views.',
    area: 'dubai-marina', tags: ['outdoors', 'nightlife', 'free-to-visit', 'views'],
    lat: 25.0805, lng: 55.1403, priceBand: 'free', openingHours: 'Open 24 hours',
    body: `<p>Seven kilometres of paved promenade running both sides of the Marina canal, at the foot of a near-continuous wall of towers. Cafés and restaurants line most of it, yachts are moored along it, and it is busy from late afternoon until well past midnight.</p>
<h2>Best for</h2>
<p>The most walkable evening in Dubai. Bridges cross at intervals so you can make a loop of any length. Boat tours, dinner cruises and water taxis all depart from stations along the route.</p>
<h2>Worth knowing</h2>
<p>Entirely free and entirely public. Marina Mall and the Metro sit at one end, JBR beach at the other, so the whole area connects on foot.</p>`,
  }),

  poi('dubai-marina-mall', 'Dubai Marina Mall', {
    summary: 'A mid-size waterfront mall with a terrace over the Marina promenade.',
    area: 'dubai-marina', tags: ['shopping', 'free-to-visit'],
    lat: 25.0764, lng: 55.1401, priceBand: 'free', openingHours: 'Daily 10:00–22:00',
    body: `<p>Four levels of shops, a cinema and a food court directly on the Marina waterfront, with an outdoor terrace opening onto the promenade. Considerably more manageable than the city's mega-malls.</p>
<h2>Worth knowing</h2>
<p>The terrace restaurants are the reason to come — they look straight down the canal at the towers. Connected by footbridge to the Marina Walk and a short walk from DMCC Metro.</p>`,
  }),

  poi('skydive-dubai', 'Skydive Dubai', {
    summary: 'Tandem skydiving over the Palm Jumeirah from a dropzone beside the Marina.',
    area: 'dubai-marina', tags: ['adventure', 'views', 'sports'],
    lat: 25.0919, lng: 55.1364, priceBand: '$$$$', openingHours: 'Daily 07:00–17:00, weather permitting',
    accolades: ['One of the most photographed dropzones in the world'],
    body: `<p>The Palm dropzone sits on the coast beside the Marina, and the jump run takes you directly over Palm Jumeirah at around 13,000 feet — roughly a minute of freefall followed by five minutes of canopy time with the island laid out beneath you.</p>
<h2>What’s involved</h2>
<p>Tandem jumps require no experience and a short briefing. A separate desert dropzone at Margham operates at lower cost with dune scenery instead.</p>
<h2>Worth knowing</h2>
<p>Expensive, and booked out weeks ahead in the cooler months. Jumps are weather-dependent and cancellations for wind are common — build slack into your plans. Video and stills cost extra and are worth it.</p>`,
  }),

  poi('xline-dubai-marina', 'XLine Dubai Marina', {
    summary: 'The world’s longest urban zipline — 1km through the Marina at up to 80km/h.',
    area: 'dubai-marina', tags: ['adventure', 'views', 'sports'],
    lat: 25.0837, lng: 55.1443, priceBand: '$$$', openingHours: 'Daily 10:00–22:00',
    accolades: ['Longest urban zipline in the world'],
    body: `<p>A one-kilometre zipline running from a 170-metre launch tower down through the Marina canyon to a landing point near the water, head-first and prone, at speeds up to 80km/h. It takes about a minute.</p>
<h2>Worth knowing</h2>
<p>Twin lines run side by side, so you can go with someone. Weight and health restrictions apply. Evening runs with the towers lit are the ones to book. Considerably less committing than a skydive and a fraction of the price.</p>`,
  }),

  poi('pier-7', 'Pier 7', {
    summary: 'A circular tower of seven restaurants, one per floor, overlooking the Marina.',
    area: 'dubai-marina', tags: ['nightlife', 'fine-dining', 'views'],
    lat: 25.0762, lng: 55.1397, priceBand: '$$$', openingHours: 'Daily 12:00–02:00',
    body: `<p>A cylindrical tower beside Marina Mall with a different restaurant on each of its seven floors, every one with a 360-degree outlook over the canal and the towers. The concept is simple and it works.</p>
<h2>Worth knowing</h2>
<p>Cuisines vary floor to floor, so you can move between them across an evening. The upper floors have the better views and the later licences. Book at weekends.</p>`,
  }),

  poi('dubai-harbour', 'Dubai Harbour', {
    summary: 'A large marina and cruise terminal district between the Marina and Bluewaters.',
    area: 'dubai-marina', tags: ['outdoors', 'views', 'luxury'],
    lat: 25.0906, lng: 55.1417, priceBand: 'free', openingHours: 'Open 24 hours',
    body: `<p>A newer waterfront district built around one of the largest marinas in the region and a cruise terminal, sitting between Dubai Marina and Bluewaters Island. The promenade has a clean, uninterrupted view of Ain Dubai and the Marina skyline.</p>
<h2>Worth knowing</h2>
<p>Still filling in, so it is quieter than its neighbours. Yacht charters and sightseeing boats depart from here, and the lighthouse viewing point at the end of the breakwater is a good, little-known sunset spot.</p>`,
  }),

  poi('ain-dubai', 'Ain Dubai', {
    summary: 'The world’s tallest observation wheel, standing 250m over Bluewaters Island.',
    area: 'bluewaters-island', tags: ['views', 'landmarks', 'family'],
    lat: 25.0797, lng: 55.1187, priceBand: '$$$', openingHours: 'Check operating status before visiting',
    accolades: ['Tallest observation wheel in the world'],
    body: `<p>At just over 250 metres, Ain Dubai is the tallest observation wheel ever built — roughly twice the height of the London Eye — with 48 capsules and a rotation of around 38 minutes. It stands on Bluewaters Island facing the JBR shoreline.</p>
<h2>The view</h2>
<p>From the top you get the Marina towers, Palm Jumeirah, the open Gulf and, on a clear day, the Burj Khalifa in the distance. Capsules range from standard to social cabins with bars.</p>
<h2>Worth knowing</h2>
<p>Operations have been suspended for extended periods since opening — check the current status before planning a visit around it. The wheel is impressive from the ground and from JBR beach regardless.</p>`,
  }),

  poi('bluewaters-beach', 'Bluewaters Beach', {
    summary: 'A quiet public beach on the seaward side of Bluewaters Island.',
    area: 'bluewaters-island', tags: ['beaches', 'free-to-visit', 'outdoors'],
    lat: 25.0771, lng: 55.1204, priceBand: 'free', openingHours: 'Open 24 hours',
    body: `<p>A small public beach on the outer edge of Bluewaters, facing away from the city and towards open water. It is markedly calmer than JBR next door and has proper facilities — showers, loungers, lifeguards.</p>
<h2>Worth knowing</h2>
<p>Reachable on foot from JBR across the pedestrian bridge, which is itself a good vantage point. Sunset here is excellent and the crowd is a fraction of the neighbouring beach.</p>`,
  }),

  poi('the-beach-at-jbr', 'The Beach at JBR', {
    summary: 'A beachfront retail and dining strip along JBR’s public beach.',
    area: 'jbr', tags: ['beaches', 'shopping', 'family', 'free-to-visit'],
    lat: 25.0784, lng: 55.1327, priceBand: 'free', openingHours: 'Daily 10:00–24:00',
    body: `<p>An open-air, low-rise development set directly behind the JBR public beach — restaurants, shops, an outdoor cinema, a splash park and a running track, arranged around courtyards that open onto the sand.</p>
<h2>Best for</h2>
<p>Combining a beach afternoon with dinner without moving the car. Watersports operators, a Ferris wheel and a weekend market all run from the beachfront.</p>
<h2>Worth knowing</h2>
<p>Extremely busy on Friday and Saturday evenings. Beach access and showers are free; parking is paid and fills early.</p>`,
  }),

  poi('the-walk-at-jbr', 'The Walk at JBR', {
    summary: 'A 1.7km pedestrian strip of shops, cafés and street performers one block from the sea.',
    area: 'jbr', tags: ['shopping', 'nightlife', 'free-to-visit', 'street-food'],
    lat: 25.0796, lng: 55.134, priceBand: 'free', openingHours: 'Open 24 hours',
    body: `<p>The Walk runs parallel to the beach at the foot of the JBR towers — 1.7 kilometres of pavement cafés, shops, shisha terraces and, on winter evenings, a slow parade of modified cars along the road beside it.</p>
<h2>Best for</h2>
<p>People-watching, casual dining and a very unforced evening. There is a weekend street market in the cooler months and consistent live street performance.</p>
<h2>Worth knowing</h2>
<p>Busy, loud and completely free. Connects directly to The Beach and to the Bluewaters footbridge.</p>`,
  }),

  poi('marina-beach', 'Marina Beach', {
    summary: 'The open public beach at the Marina’s seaward end, with the towers behind it.',
    area: 'dubai-marina', tags: ['beaches', 'free-to-visit', 'outdoors'],
    lat: 25.0816, lng: 55.1327, priceBand: 'free', openingHours: 'Open 24 hours',
    body: `<p>A wide public beach where the Marina district meets the Gulf, with lifeguards, showers and a long stretch of sand backed by the tower skyline — one of the more dramatic beach backdrops in the city.</p>
<h2>Worth knowing</h2>
<p>It merges with JBR beach to the south, so the whole run is walkable. Watersports operators work this stretch, and the swimming is well supervised. Free, and quieter at the northern end.</p>`,
  }),

  poi('bluewaters-island', 'Bluewaters Island', {
    summary: 'A compact island of low-rise dining and retail wrapped around Ain Dubai.',
    area: 'bluewaters-island', tags: ['nightlife', 'shopping', 'free-to-visit', 'views'],
    lat: 25.0785, lng: 55.1215, priceBand: 'free', openingHours: 'Open 24 hours',
    body: `<p>A small purpose-built island 500 metres off the JBR coast, connected by road and a pedestrian bridge, and arranged as a low-rise ring of restaurants, shops and residences around the base of Ain Dubai.</p>
<h2>Best for</h2>
<p>An easy hour's walk with the best close view of the observation wheel, and a seaward promenade that looks back at the Marina skyline. Calmer and better spaced than JBR opposite.</p>
<h2>Worth knowing</h2>
<p>The footbridge from JBR is the pleasantest approach and takes about ten minutes. Parking on the island is paid.</p>`,
  }),
];
