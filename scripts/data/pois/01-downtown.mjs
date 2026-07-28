// Places to Visit — Downtown Dubai, Business Bay and Za'abeel (20).
//
// Slugs for the ten original seed POIs are PRESERVED exactly: those URLs are
// already live and published. Several have had their `area` corrected (the first
// seed only had three neighbourhoods to choose from).

import { poi } from '../_helpers.mjs';

export const downtownPois = [
  poi('burj-khalifa', 'Burj Khalifa', {
    summary: 'The world’s tallest building, soaring 828m above Downtown Dubai.',
    area: 'downtown-dubai', tags: ['landmarks', 'views', 'architecture', 'luxury'],
    lat: 25.197197, lng: 55.274376, priceBand: '$$$', openingHours: 'Daily 09:00–23:00',
    accolades: ['Tallest building in the world', 'Highest occupied floor in the world'],
    body: `<p>At 828 metres the Burj Khalifa has held the title of world's tallest building since 2010, and nothing has come close to displacing it. The tower tapers in a spiral of setbacks that were designed as much to break up desert wind loads as to look the way they do, and the effect at a distance is of a building that never quite stops narrowing.</p>
<h2>Going up</h2>
<p>Three observation levels are open to visitors — floors 124, 125 and the considerably more expensive 148. The lift takes about a minute. Book a timed slot online well in advance; walk-up tickets are both scarce and substantially more expensive, and sunset slots sell out weeks ahead.</p>
<h2>Worth knowing</h2>
<p>Visibility is often better in the morning than the late afternoon, when haze builds over the coast. If the observation deck price puts you off, the view from the Burj Lake promenade below costs nothing and is arguably the better photograph.</p>`,
  }),

  poi('at-the-top-sky', 'At The Top Sky — Level 148', {
    summary: 'The Burj Khalifa’s highest observation deck, at 555m — the premium lounge experience.',
    area: 'downtown-dubai', tags: ['views', 'luxury', 'landmarks'],
    lat: 25.1972, lng: 55.2744, priceBand: '$$$$', openingHours: 'Daily 09:00–21:00',
    accolades: ['Highest observation deck in the world when it opened'],
    body: `<p>Level 148 sits 555 metres up — some 100 metres above the standard observation floors — and is run as a lounge rather than a viewing platform. Admission includes a guided lift, refreshments and access to an outdoor terrace, which is the part most people remember.</p>
<h2>Is it worth the premium?</h2>
<p>The view is not dramatically different from level 125; what you are paying for is space and calm. Levels 124 and 125 can be shoulder-to-shoulder at sunset, while 148 caps numbers. If you are photographing the city, the smaller crowd matters more than the extra height.</p>
<h2>Practical</h2>
<p>Entry is through a separate premium queue in the Dubai Mall. Allow two hours end to end.</p>`,
  }),

  poi('the-dubai-fountain', 'The Dubai Fountain', {
    summary: 'A choreographed water, light and music spectacle on the Burj Lake.',
    area: 'downtown-dubai', tags: ['landmarks', 'family', 'free-to-visit', 'nightlife'],
    lat: 25.1955, lng: 55.2764, priceBand: 'free', openingHours: 'Shows every 30 min, 18:00–23:00',
    accolades: ['One of the world’s largest choreographed fountains'],
    body: `<p>The fountain occupies the 30-acre Burj Lake at the foot of the Burj Khalifa and fires water jets up to 150 metres, choreographed to a rotating playlist that runs from Arabic classical to opera to pop. Shows last around five minutes and repeat every half hour through the evening.</p>
<h2>Where to watch</h2>
<p>The free options are the best ones. The lakeside promenade outside the Dubai Mall gives you the head-on view; the Souk Al Bahar bridge puts the tower directly behind the water. Paid options — a lake boat, or a restaurant terrace — buy you a seat rather than a better angle.</p>
<h2>Worth knowing</h2>
<p>Arrive fifteen minutes early for a front-row spot at weekends. There is also a shorter afternoon show at 13:00 and 13:30 on most days, which almost nobody watches.</p>`,
  }),

  poi('dubai-mall', 'The Dubai Mall', {
    summary: 'One of the world’s largest malls — retail, aquarium, ice rink and more.',
    area: 'downtown-dubai', tags: ['shopping', 'family', 'free-to-visit'],
    lat: 25.1972, lng: 55.2796, priceBand: 'free', openingHours: 'Daily 10:00–24:00',
    accolades: ['One of the largest shopping malls in the world by total area'],
    body: `<p>The Dubai Mall is less a shopping centre than a small indoor district: over a thousand retailers, an aquarium built into a wall of the atrium, an Olympic-size ice rink, a cinema complex and a waterfall sculpture spread across four levels. Entry is free; almost everything inside is not.</p>
<h2>Beyond shopping</h2>
<p>The Dubai Aquarium's viewing panel is visible from the mall floor without a ticket, and is one of the largest acrylic panels ever made. The ice rink, VR Park and KidZania make this a genuine wet-weather — or rather, hot-weather — day out with children.</p>
<h2>Worth knowing</h2>
<p>It is very large and the signage is only partly helpful; pick your entrance based on where you are going. The Fashion Avenue extension is the quietest part. The mall connects directly to the Burj Khalifa entrance and the fountain promenade.</p>`,
  }),

  poi('dubai-aquarium', 'Dubai Aquarium & Underwater Zoo', {
    summary: 'A ten-million-litre tank inside the Dubai Mall, with a walkthrough tunnel.',
    area: 'downtown-dubai', tags: ['family', 'wildlife', 'museums'],
    lat: 25.1975, lng: 55.2794, priceBand: '$$', openingHours: 'Daily 10:00–22:00',
    accolades: ['One of the largest suspended aquarium tanks in the world'],
    body: `<p>The tank holds ten million litres and around 33,000 animals, including a substantial population of sand tiger sharks and one of the largest collections of them anywhere. A 48-metre tunnel runs through the middle of it.</p>
<h2>What you get</h2>
<p>A ticket covers the tunnel plus the Underwater Zoo on the level above, which is stronger than the name suggests — penguins, otters, crocodiles and a night-creatures section. Cage snorkelling and glass-bottom boat rides are sold separately.</p>
<h2>Worth knowing</h2>
<p>The main viewing panel is free to look at from the mall walkway, and a lot of visitors decide that is enough. Pay for the tunnel if you are travelling with children or want to see the shark feed.</p>`,
  }),

  poi('dubai-ice-rink', 'Dubai Ice Rink', {
    summary: 'An Olympic-size ice rink on the ground floor of the Dubai Mall.',
    area: 'downtown-dubai', tags: ['family', 'sports'],
    lat: 25.1968, lng: 55.2792, priceBand: '$$', openingHours: 'Daily 10:00–24:00',
    body: `<p>A full Olympic-size rink sitting in the middle of a shopping mall in a desert city is exactly the kind of juxtaposition Dubai does without comment. Sessions run throughout the day, skate hire is included, and the rink switches to disco sessions in the evening.</p>
<h2>Good to know</h2>
<p>Beginner sessions with penguin skate aids run in the mornings and are much less crowded. Bring socks — hire skates require them and the shop charges for a pair.</p>`,
  }),

  poi('kidzania-dubai', 'KidZania Dubai', {
    summary: 'An indoor role-play city where children run the jobs — pilot, surgeon, firefighter.',
    area: 'downtown-dubai', tags: ['family'],
    lat: 25.1979, lng: 55.2791, priceBand: '$$$', openingHours: 'Daily 10:00–22:00',
    body: `<p>KidZania is a scaled-down city — streets, shops, a hospital, a fire station, a bank — in which children aged four to sixteen take on jobs, earn a local currency and spend it. It is considerably more absorbing than it sounds, and the four-hour sessions routinely run over.</p>
<h2>Best for</h2>
<p>Ages roughly five to twelve. Under-fours have a separate area but get less out of it. Adults accompany but are largely excluded from the activities, which is the point.</p>
<h2>Worth knowing</h2>
<p>Weekday afternoons during term time are dramatically quieter. Bring water; the sessions are long and active.</p>`,
  }),

  poi('vr-park-dubai', 'VR Park Dubai', {
    summary: 'A large virtual-reality arcade in the Dubai Mall — rides, shooters and free-fall simulators.',
    area: 'downtown-dubai', tags: ['family', 'adventure'],
    lat: 25.1981, lng: 55.2789, priceBand: '$$', openingHours: 'Daily 10:00–24:00',
    body: `<p>Spread over two levels with around thirty attractions, VR Park mixes seated simulator rides with room-scale experiences and a handful of genuinely unnerving ones — including a plank walk off a virtual skyscraper and a free-fall drop that uses a real harness.</p>
<h2>How it works</h2>
<p>Buy a credit-based card or an unlimited pass. Individual attractions are priced separately, and the good ones are the expensive ones, so the pass is usually better value if you plan to stay more than an hour.</p>
<h2>Worth knowing</h2>
<p>Height and age restrictions apply on most rides — realistically it suits ages nine and up.</p>`,
  }),

  poi('souk-al-bahar', 'Souk Al Bahar', {
    summary: 'An Arabesque-styled souk and dining terrace overlooking the Burj Lake.',
    area: 'downtown-dubai', tags: ['shopping', 'nightlife', 'free-to-visit'],
    lat: 25.1948, lng: 55.2751, priceBand: 'free', openingHours: 'Daily 10:00–24:00',
    body: `<p>Souk Al Bahar sits across the water from the Dubai Mall, built in a stone-and-arch style that borrows from traditional Gulf architecture without pretending to be old. Inside is a modest run of galleries, carpet dealers and gift shops; outside is the reason to come.</p>
<h2>The terrace</h2>
<p>The waterfront terrace holds a row of restaurants with an unobstructed head-on view of both the fountain and the Burj Khalifa. It is the single best place in Downtown to eat while the fountain runs — and priced accordingly. Book a table on the water for evening shows.</p>
<h2>Worth knowing</h2>
<p>The connecting bridge to the Dubai Mall is free to walk and is itself a first-rate viewing spot.</p>`,
  }),

  poi('dubai-opera', 'Dubai Opera', {
    summary: 'A dhow-shaped 2,000-seat performing arts venue at the foot of the Burj Khalifa.',
    area: 'downtown-dubai', tags: ['architecture', 'nightlife', 'art-design', 'landmarks'],
    lat: 25.1943, lng: 55.2725, priceBand: '$$$', openingHours: 'Box office daily 10:00–20:00',
    accolades: ['Multi-format transforming auditorium'],
    body: `<p>Dubai Opera is built in the shape of a traditional dhow, prow pointing at the Burj Khalifa, and its auditorium transforms between three configurations — proscenium theatre, concert hall and a flat-floor event space. The mechanical changeover takes a few hours.</p>
<h2>What’s on</h2>
<p>Programming is deliberately broad: touring opera and ballet, orchestral seasons, musicals, Arabic classical concerts and stand-up. Quality is high and ticket prices are lower than the equivalent seats in London or New York.</p>
<h2>Worth knowing</h2>
<p>The rooftop terrace is open to ticket holders before performances and has one of the best close-range views of the tower. Dress code is smart-casual and enforced lightly.</p>`,
  }),

  poi('burj-park', 'Burj Park', {
    summary: 'An island green space on the Burj Lake with the best free skyline views in Downtown.',
    area: 'downtown-dubai', tags: ['outdoors', 'free-to-visit', 'views', 'family'],
    lat: 25.1935, lng: 55.2735, priceBand: 'free', openingHours: 'Open 24 hours',
    body: `<p>Burj Park is a landscaped island in the middle of the Burj Lake, reached by footbridge, and it is where Downtown residents go when they want grass. It is also, quietly, the best free vantage point in the district — you get the tower, the lake and the fountain in a single frame with room to set up a tripod.</p>
<h2>Best for</h2>
<p>Picnics, photography and watching the fountain without fighting for promenade space. It hosts open-air concerts and the city's New Year gatherings, when access is ticketed.</p>`,
  }),

  poi('dubai-water-canal', 'Dubai Water Canal', {
    summary: 'A 3.2km artificial canal through Business Bay, with a waterfall bridge and a long promenade.',
    area: 'business-bay', tags: ['outdoors', 'free-to-visit', 'views'],
    lat: 25.1889, lng: 55.2537, priceBand: 'free', openingHours: 'Open 24 hours',
    accolades: ['Man-made canal connecting Dubai Creek to the Arabian Gulf'],
    body: `<p>The Water Canal completes a route from the historic Creek through to the Gulf, cutting through Business Bay and Jumeirah on the way. Along its length runs a landscaped pedestrian and cycling promenade — several kilometres of it, well lit and open at all hours.</p>
<h2>The waterfall</h2>
<p>Where Sheikh Zayed Road crosses the canal, a curtain waterfall falls from the bridge, pausing automatically as boats pass beneath. It runs after dark and is best seen from a water taxi or from the promenade on the Business Bay side.</p>
<h2>Best for</h2>
<p>Evening walks and runs, cycling, and skyline photography from a low angle. One of the most genuinely pleasant free things to do in the city between October and April.</p>`,
  }),

  poi('bay-avenue-park', 'Bay Avenue Park', {
    summary: 'A compact neighbourhood park and independent café strip in the middle of Business Bay.',
    area: 'business-bay', tags: ['outdoors', 'free-to-visit', 'family'],
    lat: 25.1861, lng: 55.2726, priceBand: 'free', openingHours: 'Open 24 hours',
    body: `<p>A small, well-used green space wrapped by a low-rise run of independent cafés, bakeries and a supermarket — the closest thing Business Bay has to a village centre. There is a running loop, a children's play area and a lot of shade.</p>
<h2>Best for</h2>
<p>Breakfast, a break from the towers, and seeing a piece of Dubai that residents actually use rather than visitors. Busiest early morning and after sunset.</p>`,
  }),

  poi('museum-of-the-future', 'Museum of the Future', {
    summary: 'An award-winning museum of innovation inside a striking calligraphy-clad torus.',
    area: 'zabeel', tags: ['architecture', 'museums', 'landmarks', 'family'],
    lat: 25.2197, lng: 55.282, priceBand: '$$$', openingHours: 'Daily 10:00–19:30',
    accolades: ['Award-winning architecture', 'Arabic calligraphy façade with no internal columns'],
    body: `<p>A silver torus standing on a green mound beside Sheikh Zayed Road, wrapped in Arabic calligraphy that is also the building's windows. There is no internal column structure — the façade carries the load — which is why the interior spaces feel as open as they do.</p>
<h2>Inside</h2>
<p>The museum is organised as a sequence of immersive floors rather than a collection: a near-future space station, a bioengineered rainforest archive, a wellness floor and a large children's zone. It is closer to designed theatre than to a traditional museum, and works best if you go with that.</p>
<h2>Worth knowing</h2>
<p>Timed tickets sell out days ahead — book online. Allow two to three hours. The exterior is worth seeing after dark when the calligraphy is lit.</p>`,
  }),

  poi('dubai-frame', 'Dubai Frame', {
    summary: 'A 150m golden picture frame with a glass-floored sky bridge between old and new Dubai.',
    area: 'zabeel', tags: ['views', 'architecture', 'landmarks', 'family'],
    lat: 25.2354, lng: 55.3003, priceBand: '$$', openingHours: 'Daily 09:00–21:00',
    accolades: ['Largest picture frame in the world'],
    body: `<p>The Frame is exactly what its name says: a 150-metre-tall, 93-metre-wide rectangle clad in gold, positioned so that looking through it from one side shows historic Deira and from the other shows the Sheikh Zayed Road skyline. It is an unusually literal piece of urban design and it works.</p>
<h2>The sky bridge</h2>
<p>A lift runs to the horizontal top section, where a 93-metre bridge crosses between the two towers. A panel of the floor is glass, and turns opaque and transparent in cycles as you walk over it.</p>
<h2>Worth knowing</h2>
<p>Late afternoon gives you the old city in good light and the new city lit up on the way down. Tickets are cheap by Dubai standards and rarely need booking far ahead.</p>`,
  }),

  poi('zabeel-park', 'Zabeel Park', {
    summary: 'One of the city’s largest parks — lakes, lawns, a techno zone and the Dubai Frame.',
    area: 'zabeel', tags: ['outdoors', 'family', 'free-to-visit'],
    lat: 25.2306, lng: 55.3003, priceBand: '$', openingHours: 'Daily 08:00–23:00',
    body: `<p>Zabeel Park spans three sections linked by footbridges over the surrounding roads, with lakes, cricket pitches, a boating lake, barbecue areas and a great deal of mature shade — a rarity in Dubai. The Dubai Frame stands at its centre.</p>
<h2>Best for</h2>
<p>Weekend picnics, jogging loops and letting children run. Entry is a nominal few dirhams. It is one of the few places in the city where you will see extended local families settling in for the whole afternoon.</p>
<h2>Worth knowing</h2>
<p>Busiest on Friday and Saturday evenings. The park hosts seasonal festivals and light installations through the cooler months.</p>`,
  }),

  poi('sky-views-dubai', 'Sky Views Dubai', {
    summary: 'A glass slide and glass-floor walk suspended 220m above Sheikh Zayed Road.',
    area: 'zabeel', tags: ['views', 'adventure'],
    lat: 25.2133, lng: 55.2793, priceBand: '$$$', openingHours: 'Daily 10:00–22:00',
    body: `<p>Sky Views occupies the bridge linking the two Address Sky View towers, 219 metres up. The observatory has a glass-floored walkway; the headline attraction is a fully transparent slide that takes you down the outside of the building from level 53 to 52.</p>
<h2>What you get</h2>
<p>Three separately priced experiences: the observatory, the glass slide, and an edge walk on a harness around the outside of the building. The observatory alone is a good-value alternative to the Burj Khalifa, and the view — which includes the Burj Khalifa — is arguably more interesting.</p>
<h2>Worth knowing</h2>
<p>The slide lasts about eight seconds. People either love it or regret it immediately; there is no middle ground.</p>`,
  }),

  poi('dubai-garden-glow', 'Dubai Garden Glow', {
    summary: 'A seasonal after-dark park of illuminated sculptures, dinosaurs and an ice park.',
    area: 'zabeel', tags: ['family', 'outdoors', 'nightlife'],
    lat: 25.2299, lng: 55.3053, priceBand: '$$', openingHours: 'Seasonal — daily 17:00–23:00 (Oct–Apr)',
    body: `<p>A large outdoor park in Zabeel filled with illuminated sculptures made from recycled materials, plus a dinosaur park, an ice park kept below freezing, and an art zone. It runs only through the cooler months.</p>
<h2>Best for</h2>
<p>Families with younger children, and an easy evening that does not involve a mall. The scale is bigger than photographs suggest — allow two hours.</p>
<h2>Worth knowing</h2>
<p>Check the season dates before travelling; it closes entirely over the summer. The ice park loans jackets but bring layers regardless.</p>`,
  }),

  poi('dubai-world-trade-centre', 'Dubai World Trade Centre', {
    summary: 'The city’s original tower and its principal exhibition and convention complex.',
    area: 'zabeel', tags: ['architecture', 'exhibitions'],
    lat: 25.2258, lng: 55.2867, priceBand: 'free', openingHours: 'Varies by event',
    accolades: ['Dubai’s first high-rise, opened 1979'],
    body: `<p>When it opened in 1979 the World Trade Centre tower stood alone in open desert, well outside the city, and was for years the tallest building in the Middle East. It appears on the 100-dirham note. The surrounding halls now host most of the region's major trade shows — GITEX, Arab Health, the Dubai International Boat Show.</p>
<h2>Worth knowing</h2>
<p>There is no public observation access, and outside event days there is little to see. Its interest is historical: it is the building that started the skyline, and it is worth understanding what was here before the towers.</p>`,
  }),

  poi('safa-park', 'Safa Park', {
    summary: 'A mature 64-hectare park between Jumeirah and the canal, with lakes and skyline views.',
    area: 'business-bay', tags: ['outdoors', 'free-to-visit', 'family'],
    lat: 25.1846, lng: 55.2447, priceBand: '$', openingHours: 'Daily 08:00–23:00',
    body: `<p>One of Dubai's older parks and one of its most pleasant — mature trees, three lakes, a running track and open lawns, with the Downtown towers rising directly behind. The Dubai Water Canal now runs along its southern edge.</p>
<h2>Best for</h2>
<p>Running, picnics and a genuinely green hour. There is a weekend flea market in the cooler months and a small artisan market that is worth timing a visit around.</p>`,
  }),
];
