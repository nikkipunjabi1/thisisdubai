// Places to Visit — theme parks, gardens, the desert, Al Quoz, Expo City and Hatta (20).

import { poi } from '../_helpers.mjs';

export const beyondPois = [
  poi('global-village', 'Global Village', {
    summary: 'A seasonal open-air culture and shopping park with pavilions from 90 countries.',
    area: 'dubailand', tags: ['family', 'shopping', 'street-food', 'outdoors'],
    lat: 25.0699, lng: 55.3095, priceBand: '$', openingHours: 'Seasonal — daily 16:00–24:00 (Oct–Apr)',
    accolades: ['One of the largest seasonal cultural festivals in the world'],
    body: `<p>Global Village runs from October to April on a huge site in Dubailand: around thirty pavilions representing ninety countries, each selling that country's crafts, textiles and food, arranged around a lake with a funfair, stages and a nightly firework display.</p>
<h2>What it’s actually like</h2>
<p>Cheerfully chaotic and enormously popular with residents rather than tourists — which makes it one of the more genuine evenings out in the city. The food is the strongest part: dozens of national kitchens, most of them inexpensive and good.</p>
<h2>Worth knowing</h2>
<p>Entry is a few dirhams and cheaper on weekdays. It closes entirely in summer. Go on a Sunday to Wednesday if you can; weekends are extremely crowded. Allow a full evening, and wear comfortable shoes — the site is vast.</p>`,
  }),

  poi('img-worlds-of-adventure', 'IMG Worlds of Adventure', {
    summary: 'The world’s largest indoor theme park — Marvel, Cartoon Network and dinosaurs.',
    area: 'dubailand', tags: ['family', 'adventure'],
    lat: 25.0752, lng: 55.3068, priceBand: '$$$', openingHours: 'Daily 11:00–21:00',
    accolades: ['Largest indoor theme park in the world'],
    body: `<p>Around 1.5 million square feet entirely under one roof, divided into four zones: Marvel, Cartoon Network, a dinosaur-themed Lost Valley and a horror attraction. Being indoors is the whole proposition — it runs at full capacity in August when outdoor parks are unusable.</p>
<h2>The rides</h2>
<p>The Velociraptor is the standout: a launch coaster that hits 100km/h in under three seconds. The Marvel zone has the better dark rides; Cartoon Network is pitched at younger children.</p>
<h2>Worth knowing</h2>
<p>A full day. Book online for a significant saving. Weekday visits during term time can be close to empty, which makes it excellent value.</p>`,
  }),

  poi('dubai-miracle-garden', 'Dubai Miracle Garden', {
    summary: 'A seasonal flower garden of 150 million blooms in sculpted arches and structures.',
    area: 'al-barsha', tags: ['outdoors', 'family', 'wildlife'],
    lat: 25.0611, lng: 55.2439, priceBand: '$$', openingHours: 'Seasonal — daily 09:00–21:00 (Nov–May)',
    accolades: ['World’s largest natural flower garden'],
    body: `<p>Around 150 million flowers arranged across 72,000 square metres into arches, tunnels, animals, an Emirates A380 covered entirely in blooms, and a floating castle. It is an unlikely thing to find on the edge of a desert and it is maintained to an extremely high standard.</p>
<h2>Worth knowing</h2>
<p>Open only from November to May — the display cannot survive the summer. Go early in the day or in the last two hours before closing; midday light is harsh and the site has little shade. The Butterfly Garden is next door and often sold as a combined ticket.</p>`,
  }),

  poi('dubai-butterfly-garden', 'Dubai Butterfly Garden', {
    summary: 'Nine climate-controlled domes holding 15,000 butterflies across 50 species.',
    area: 'al-barsha', tags: ['wildlife', 'family', 'outdoors'],
    lat: 25.0625, lng: 55.2447, priceBand: '$$', openingHours: 'Daily 09:00–18:00',
    accolades: ['Largest covered butterfly garden in the world'],
    body: `<p>Nine domes kept at butterfly-friendly temperature and humidity, holding around 15,000 butterflies from some fifty species, plus a museum on the lifecycle and a flying aviary you walk through.</p>
<h2>Worth knowing</h2>
<p>Unlike its neighbour the Miracle Garden, this one is open year-round because it is enclosed and cooled. Best in the morning when the butterflies are most active. About an hour, and an easy pairing with the Miracle Garden in the cooler months.</p>`,
  }),

  poi('motiongate-dubai', 'Motiongate Dubai', {
    summary: 'A Hollywood-themed park with rides from DreamWorks, Sony and Lionsgate films.',
    area: 'jebel-ali', tags: ['family', 'adventure'],
    lat: 24.9184, lng: 55.0093, priceBand: '$$$', openingHours: 'Daily 11:00–20:00 (seasonal hours vary)',
    body: `<p>The largest of the parks at Dubai Parks and Resorts, built around film franchises — Shrek, Kung Fu Panda, How to Train Your Dragon, The Hunger Games, Ghostbusters — across five themed zones.</p>
<h2>The rides</h2>
<p>The John Wick and Hunger Games coasters are the serious ones; the DreamWorks zone is fully indoors and air-conditioned, which matters a great deal here. Ride quality is high — this is not a park of dressed-up fairground units.</p>
<h2>Worth knowing</h2>
<p>Well outside the city towards Abu Dhabi — allow 40 minutes' driving. Multi-park tickets covering Legoland and Riverland are much better value than single-park entry. Check opening days; the parks close on some weekdays out of season.</p>`,
  }),

  poi('legoland-dubai', 'Legoland Dubai', {
    summary: 'A Lego theme park built for ages 2–12, with a Miniland of Gulf landmarks in bricks.',
    area: 'jebel-ali', tags: ['family'],
    lat: 24.9207, lng: 55.0058, priceBand: '$$$', openingHours: 'Daily 10:00–18:00 (seasonal hours vary)',
    body: `<p>Six zones of rides, building workshops and shows, aimed squarely at children between two and twelve. Miniland is the highlight for adults: Dubai, Abu Dhabi and other regional cityscapes reconstructed from around 20 million bricks, including a working Metro.</p>
<h2>Worth knowing</h2>
<p>Genuinely pitched young — teenagers will be bored. The separate Legoland Water Park next door is included in some tickets and not others, so check. Shade is reasonable but bring hats regardless.</p>`,
  }),

  poi('legoland-water-park', 'Legoland Water Park', {
    summary: 'A gentle Lego-themed waterpark for younger children, beside Legoland Dubai.',
    area: 'jebel-ali', tags: ['waterparks', 'family'],
    lat: 24.9218, lng: 55.0041, priceBand: '$$$', openingHours: 'Daily 10:00–18:00 (seasonal hours vary)',
    body: `<p>Twenty-odd slides and attractions scaled for children aged two to twelve, including a build-a-raft lazy river where you customise a float with large soft bricks before setting off.</p>
<h2>Worth knowing</h2>
<p>Deliberately tame — there is nothing here for thrill-seekers, and that is the point. Best combined with Legoland itself on a two-park ticket. Wetsuit-style swim shirts are sensible; the sun is unforgiving.</p>`,
  }),

  poi('riverland-dubai', 'Riverland Dubai', {
    summary: 'A free-entry themed dining district linking the Dubai Parks, set along a waterway.',
    area: 'jebel-ali', tags: ['street-food', 'family', 'free-to-visit'],
    lat: 24.9224, lng: 55.0119, priceBand: 'free', openingHours: 'Daily 12:00–22:00',
    body: `<p>Riverland is the entrance corridor shared by the Dubai Parks — a themed pedestrian district split into four zones (a French village, an Indian bazaar, a Wild West town and a mid-century Americana strip) with restaurants along a central waterway.</p>
<h2>Worth knowing</h2>
<p>Entry is free, which makes it a reasonable stop in its own right if you are out that way. It is where you eat between parks, and it stays open later than the parks themselves.</p>`,
  }),

  poi('real-madrid-world', 'Real Madrid World', {
    summary: 'A football-themed park with coasters, a stadium tour experience and a VR zone.',
    area: 'jebel-ali', tags: ['family', 'sports', 'adventure'],
    lat: 24.9198, lng: 55.0132, priceBand: '$$$', openingHours: 'Daily 12:00–20:00 (seasonal hours vary)',
    body: `<p>The first Real Madrid–branded theme park anywhere: around twenty attractions built on football, including a launch coaster, a drop tower, a simulated stadium experience and a large indoor VR arena.</p>
<h2>Worth knowing</h2>
<p>The smallest of the Dubai Parks and best treated as a half-day add-on rather than a destination. It is included on the multi-park pass. Strongest appeal is to football-obsessed children between eight and fourteen.</p>`,
  }),

  poi('mall-of-the-emirates', 'Mall of the Emirates', {
    summary: 'A vast mall in Al Barsha, best known for the indoor ski slope inside it.',
    area: 'al-barsha', tags: ['shopping', 'family', 'free-to-visit'],
    lat: 25.1181, lng: 55.2004, priceBand: 'free', openingHours: 'Daily 10:00–24:00',
    body: `<p>Around 630 retailers, a cinema complex, a theatre, a large hotel and a full indoor ski slope under one roof. It predates the Dubai Mall and remains, for many residents, the better-organised of the two.</p>
<h2>Beyond shopping</h2>
<p>Ski Dubai is the headline. There is also a big family entertainment centre, an aquarium-themed play zone and one of the strongest restaurant selections of any mall in the city.</p>
<h2>Worth knowing</h2>
<p>Directly on the Metro at Mall of the Emirates station, which makes it far easier to reach than driving at weekends. The ski slope is visible from inside the mall for free.</p>`,
  }),

  poi('ski-dubai', 'Ski Dubai', {
    summary: 'An indoor ski resort with a 400m run, a snow park and resident penguins.',
    area: 'al-barsha', tags: ['family', 'adventure', 'sports'],
    lat: 25.1177, lng: 55.2008, priceBand: '$$$', openingHours: 'Daily 10:00–23:00',
    accolades: ['First indoor ski resort in the Middle East'],
    body: `<p>A 22,500-square-metre indoor slope kept at about -1°C year-round, with five runs including a 400-metre main descent and the world's first indoor black run. There is a separate snow park with toboggans, a chairlift and a zip line.</p>
<h2>The penguins</h2>
<p>A colony of gentoo and king penguins lives on site, with daily marches through the snow park and paid encounter sessions. It is, unavoidably, the thing most visitors come for.</p>
<h2>Worth knowing</h2>
<p>Jackets, trousers and boots are included in the ticket; bring your own gloves and warm socks or buy them there. Lessons are available for beginners. Weekday mornings are quietest.</p>`,
  }),

  poi('dubai-safari-park', 'Dubai Safari Park', {
    summary: 'A 119-hectare wildlife park of open habitats organised by continent.',
    area: 'dubailand', tags: ['wildlife', 'family', 'outdoors'],
    lat: 25.1701, lng: 55.4586, priceBand: '$$', openingHours: 'Seasonal — daily 09:00–17:00 (Oct–May)',
    body: `<p>A large, modern wildlife park holding around 3,000 animals across African, Asian, Arabian and Safari villages, designed around open enclosures rather than cages. There is a drive-through safari section and a substantial Arabian wildlife area with oryx and Arabian wolves.</p>
<h2>Worth knowing</h2>
<p>Open only during the cooler months. Go at opening — animals are visibly more active before the heat builds, and the park empties out by mid-afternoon anyway. Allow three to four hours; there is a lot of walking and internal shuttles help.</p>`,
  }),

  poi('al-qudra-lakes', 'Al Qudra Lakes', {
    summary: 'Man-made desert lakes on a cycling route, popular for camping and birdwatching.',
    area: 'al-marmoom', tags: ['outdoors', 'desert', 'free-to-visit', 'wildlife'],
    lat: 24.8153, lng: 55.3242, priceBand: 'free', openingHours: 'Open 24 hours',
    body: `<p>A chain of artificial lakes cut into the desert south of the city, now surrounded by planted trees and populated by swans, ducks and migratory birds. The 86-kilometre Al Qudra cycle track runs past them, and the lakeside is one of the few places near Dubai where wild camping is permitted.</p>
<h2>Best for</h2>
<p>Cycling, sunrise, barbecues and overnight camping. Free oryx and gazelle roam the surrounding reserve and are regularly seen from the track.</p>
<h2>Worth knowing</h2>
<p>No facilities — bring water, shade and take all rubbish out. A 4x4 is not required for the main lake but the sand off the tarmac is soft. Winter weekends are busy; weekdays are near-empty.</p>`,
  }),

  poi('love-lake-dubai', 'Love Lake Dubai', {
    summary: 'Two interlocking heart-shaped lakes in the desert, planted with 16,000 trees.',
    area: 'al-marmoom', tags: ['outdoors', 'desert', 'free-to-visit', 'wildlife'],
    lat: 24.7423, lng: 55.3299, priceBand: 'free', openingHours: 'Open 24 hours',
    body: `<p>Two artificial lakes forming interlocking hearts, visible as such only from the air, surrounded by 16,000 trees and a walking track through the planting. There are barbecue areas, toilets and a small café — unusually good facilities for somewhere this remote.</p>
<h2>Best for</h2>
<p>A desert picnic with birds — swans, flamingos and ducks have colonised the water. Sunset is the time to come, and the drive out through the dunes is part of it.</p>
<h2>Worth knowing</h2>
<p>Free. The last stretch is graded track; a normal car manages it in dry conditions. Bring everything you need and take rubbish home.</p>`,
  }),

  poi('al-marmoom-desert-conservation-reserve', 'Al Marmoom Desert Conservation Reserve', {
    summary: 'The UAE’s largest unfenced desert reserve — oryx, gazelle and dark night skies.',
    area: 'al-marmoom', tags: ['desert', 'wildlife', 'outdoors', 'free-to-visit'],
    lat: 24.7869, lng: 55.3752, priceBand: 'free', openingHours: 'Open 24 hours',
    accolades: ['Largest unfenced desert conservation reserve in the UAE'],
    body: `<p>Some 10 per cent of Dubai's total land area, set aside as an unfenced reserve of dune, gravel plain and oasis. It supports around 200 native bird species and reintroduced populations of Arabian oryx, sand gazelle and Arabian gazelle.</p>
<h2>What to do</h2>
<p>Cycling on the Al Qudra track, camel treks, and stargazing — the reserve is far enough from the city that the Milky Way is visible on clear winter nights. Licensed operators run desert-camp dinners and dune drives.</p>
<h2>Worth knowing</h2>
<p>Off-road driving is restricted to protect the habitat; stay on marked tracks. Go with an operator unless you are experienced in soft sand. Winter only — summer daytime temperatures make it genuinely dangerous.</p>`,
  }),

  poi('dubai-desert-conservation-reserve', 'Dubai Desert Conservation Reserve', {
    summary: 'The UAE’s first national park — protected dune habitat with guided-access-only entry.',
    area: 'al-marmoom', tags: ['desert', 'wildlife', 'outdoors', 'luxury'],
    lat: 24.8218, lng: 55.6606, priceBand: '$$$$', openingHours: 'Access by licensed operator only',
    accolades: ['First national park established in the UAE'],
    body: `<p>Established in 2003 and covering around 225 square kilometres — roughly 5 per cent of Dubai's area — this was the first protected area in the country. It holds the largest reintroduced Arabian oryx population in the region alongside sand gazelle, Arabian hare and desert foxes.</p>
<h2>Access</h2>
<p>Entry is deliberately restricted to licensed operators, which keeps visitor numbers to a fraction of the commercial desert camps elsewhere. Options run from dawn wildlife drives and falconry to overnight stays at the reserve's lodge.</p>
<h2>Worth knowing</h2>
<p>Not somewhere you can drive into independently. Costs considerably more than a standard desert safari, and is a genuinely different experience — conservation-led, small-group and quiet.</p>`,
  }),

  poi('hatta-dam', 'Hatta Dam', {
    summary: 'A turquoise mountain reservoir in the Hajar range, popular for kayaking.',
    area: 'hatta', tags: ['outdoors', 'adventure', 'free-to-visit', 'views'],
    lat: 24.8014, lng: 56.1244, priceBand: 'free', openingHours: 'Daily 08:00–18:00',
    body: `<p>A reservoir held behind a concrete dam in a steep-sided wadi, with water that runs an improbable turquoise against bare grey rock. It is the single most photographed spot in Dubai's mountain exclave.</p>
<h2>What to do</h2>
<p>Kayak, pedal-boat and donut-boat hire operate from the shore. The walk along the dam crest and up to the viewpoints above it is short and worth doing before the boats go out.</p>
<h2>Worth knowing</h2>
<p>Free to visit; boat hire is paid and queues form on winter weekends — arrive before ten. Around 90 minutes' drive from central Dubai. No swimming is permitted.</p>`,
  }),

  poi('hatta-wadi-hub', 'Hatta Wadi Hub', {
    summary: 'An adventure park in the mountains — mountain biking, ziplines and via ferrata.',
    area: 'hatta', tags: ['adventure', 'outdoors', 'sports'],
    lat: 24.7942, lng: 56.1178, priceBand: '$$', openingHours: 'Daily 08:00–18:00 (Oct–Apr)',
    body: `<p>A purpose-built activity centre at the foot of the Hajar Mountains offering downhill mountain biking on graded trails, ziplines, a via ferrata climbing route, axe throwing, human slingshots and a campsite.</p>
<h2>Best for</h2>
<p>Mountain biking above all — the trail network is properly built and graded green through black, and bike hire is available on site. It is the only facility of its kind in the emirate.</p>
<h2>Worth knowing</h2>
<p>Effectively winter-only; most activities close or curtail hours over the summer. Book biking slots ahead on weekends. Bring closed shoes and sun protection — there is very little shade.</p>`,
  }),

  poi('hatta-heritage-village', 'Hatta Heritage Village', {
    summary: 'A restored mountain settlement of stone houses, watchtowers and a falaj system.',
    area: 'hatta', tags: ['culture-heritage', 'museums', 'free-to-visit'],
    lat: 24.8023, lng: 56.1183, priceBand: 'free', openingHours: 'Sat–Thu 07:30–20:30',
    body: `<p>A restored village of some thirty stone and mud-brick buildings dating back around 200 years, with two hilltop watchtowers, a fort, a mosque and a working falaj — the traditional gravity-fed irrigation channel that made settlement here possible.</p>
<h2>Why go</h2>
<p>It shows a completely different Emirati vernacular from the coastal wind-tower houses: heavier stone construction suited to the mountains and to defence. The watchtower climb gives a good view over the palm gardens.</p>
<h2>Worth knowing</h2>
<p>Free, quiet and rarely busy. Combine it with the dam and the Wadi Hub for a full day in Hatta. Best October to April.</p>`,
  }),

  poi('alserkal-avenue', 'Alserkal Avenue', {
    summary: 'A converted warehouse compound in Al Quoz that is the centre of Dubai’s art scene.',
    area: 'al-quoz', tags: ['art-design', 'free-to-visit', 'museums'],
    lat: 25.1447, lng: 55.2313, priceBand: 'free', openingHours: 'Sat–Thu 10:00–19:00 (galleries vary)',
    body: `<p>A former marble factory compound in the Al Quoz industrial zone, converted into around thirty units housing commercial galleries, non-profit project spaces, an independent cinema, design studios and a handful of very good cafés.</p>
<h2>Why it matters</h2>
<p>This is where the region's contemporary art actually trades. Gallery openings cluster on the same evenings, which turns the whole compound into a single event — worth timing a visit around if you can. Concrete, the Rem Koolhaas–designed multipurpose space, hosts the larger shows.</p>
<h2>Worth knowing</h2>
<p>Free to walk in and around. Most galleries close on Sunday and some open only in the afternoon; check before travelling. Quietest in the summer when the art season pauses.</p>`,
  }),

  poi('expo-city-dubai', 'Expo City Dubai', {
    summary: 'The Expo 2020 site kept as a permanent district of pavilions, parks and a latticed dome.',
    area: 'expo-city', tags: ['architecture', 'family', 'outdoors', 'museums'],
    lat: 24.9605, lng: 55.1508, priceBand: '$$', openingHours: 'Daily 10:00–22:00',
    accolades: ['Legacy district of Expo 2020 Dubai'],
    body: `<p>Rather than clear the Expo 2020 site, Dubai retained its core — Al Wasl Plaza's 130-metre steel dome, the flagship pavilions, and the surrounding shaded parkland — and reopened it as a permanent district.</p>
<h2>What’s open</h2>
<p>Terra, the sustainability pavilion, and Alif, the mobility pavilion, both operate as permanent attractions and are excellent. Al Wasl dome becomes a 360-degree projection surface after dark. There is a large children's park and a garden-in-the-sky walkway.</p>
<h2>Worth knowing</h2>
<p>A long way from the centre but directly on the Metro's Route 2020 extension, which is by far the easiest way in. Genuinely designed for walking with shade — a rarity here. Allow half a day.</p>`,
  }),
];
