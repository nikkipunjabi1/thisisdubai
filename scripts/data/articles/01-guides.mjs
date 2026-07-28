// Articles — batch 1: orientation and practical guides (10).
//
// Long-form (~800+ words each), originally written. Bylines are FICTIONAL
// contributors for this demo; "This is Dubai Editorial" is used for unsigned pieces.
// `relatedPlaces` slugs must exist in scripts/data/pois/ — the seed validates this.

import { article } from '../_helpers.mjs';

export const guideArticles = [
  article('three-days-in-dubai', 'Three days in Dubai: a first-timer’s itinerary', {
    excerpt:
      'A route through the city that balances the record-breaking with the genuinely old, without spending your whole trip in traffic.',
    author: 'Nadia Rahman',
    publishDate: '2026-02-11T09:00:00Z',
    tags: ['landmarks', 'culture-heritage', 'views', 'family'],
    relatedPlaces: ['burj-khalifa', 'the-dubai-fountain', 'al-fahidi-neighbourhood', 'abra-creek-crossing', 'gold-souk', 'dubai-marina-walk', 'museum-of-the-future'],
    body: `<p>Dubai is a difficult city to see well in three days, not because there is too little to do but because the things worth doing are forty minutes apart and the temptation is to spend the entire trip in a taxi. The itinerary below is organised geographically rather than by ranking, which is the single change that makes the difference between a good short trip and an exhausting one.</p>
<p>It assumes you arrive with an evening free and leave on the fourth morning. Adjust for heat: between May and September, move everything outdoors to before ten in the morning or after six at night, and use the middle of the day for anything air-conditioned.</p>
<h2>Evening one: Downtown, on foot</h2>
<p>Start where the postcards are, and start late. Downtown is one of the few districts in Dubai you can properly walk, and it is at its best after dark when the heat drops and the fountain shows begin.</p>
<p>Go to the Burj Lake promenade for a fountain show — they run every half hour from six — then walk the bridge to Souk Al Bahar for dinner on the waterfront terrace. If you want to go up the Burj Khalifa, book a timed slot online days in advance; sunset slots sell out first and walk-up tickets are both scarce and considerably more expensive. If you would rather not, the view of the tower from Burj Park costs nothing and makes the better photograph anyway.</p>
<p>Do not attempt the Dubai Mall on the first night. It is enormous, and you will lose two hours you needed for sleep.</p>
<h2>Day two, morning: Old Dubai</h2>
<p>This is the half-day most visitors skip and most regret skipping. Start at eight, before the heat and before the tour groups.</p>
<p>Begin in Al Fahidi, the restored quarter of coral-and-gypsum courtyard houses where the wind towers still stand. The lanes are deliberately narrow and shaded — the district is a piece of pre-electric climate engineering, and it works. Give it an hour, including a stop at the Coffee Museum or one of the small galleries.</p>
<p>Then walk to the Creek and cross by abra. The wooden water taxis have run this route for over a century, they leave when full, and the fare is one dirham paid in cash to the driver mid-crossing. It remains the best value experience in the city and one of the very few that has not been redesigned for visitors.</p>
<p>On the Deira bank, work through the souks in this order: spice first, while your nose is fresh, then gold, then perfume. Haggle. Opening prices are set high and halving them is normal, not rude. The gold price itself is fixed and government-regulated; what moves is the making charge.</p>
<h2>Day two, afternoon: cool down</h2>
<p>By noon you will have had enough sun. Two good options, both indoors.</p>
<p>The Museum of the Future is the more interesting building — a silver torus wrapped in Arabic calligraphy that doubles as its windows, with no internal columns because the façade carries the load. Inside it is closer to designed theatre than to a museum, and works best if you go with that. Book ahead; timed tickets sell out days in advance.</p>
<p>Alternatively, Al Shindagha Museum on the Creek is a whole district of restored houses turned into linked pavilions covering perfume, traditional medicine and the Creek's trading history. It is much bigger than it looks and much less visited.</p>
<h2>Day three: the coast</h2>
<p>Spend the morning at a beach. Sunset Beach at Umm Suqeim gives you the classic head-on view of the Burj Al Arab across the water — the angle most photographs of the hotel are taken from — with lifeguards, showers and free entry. Kite Beach, a little further along, is the more active option, with watersports, a running track and a permanent strip of food trucks.</p>
<p>In the afternoon, move to Dubai Marina. The seven-kilometre promenade at the base of the towers is the most walkable stretch in the city and the one that feels most lived-in. Bridges cross at intervals, so you can make a loop of whatever length you have energy for. Eat on the water, and if you want one more view, the observation deck at The View at The Palm is cheaper than the Burj Khalifa, rarely as crowded, and the only publicly accessible point from which the Palm's shape actually reads.</p>
<h2>What to cut if you only have two days</h2>
<p>Drop day three. The coast is the most repeatable part of the trip and the least distinctive — beaches and waterfront dining exist elsewhere; a working creek with hand-loaded dhows and a one-dirham ferry does not.</p>
<h2>Practical notes</h2>
<ul>
<li><strong>Transport.</strong> The Metro is clean, cheap and covers Downtown, the Marina and the airport, but it does not reach Old Dubai's souks directly — get off at Al Fahidi or Al Ras and walk. Taxis are metered and inexpensive by European standards.</li>
<li><strong>Dress.</strong> Ordinary summer clothing is fine almost everywhere. Cover shoulders and knees in the older districts, in malls and at mosques. Swimwear is for the beach and pool only.</li>
<li><strong>Cash.</strong> Almost everything takes cards, with two exceptions that matter here: the abra, and the souks if you want your haggling taken seriously.</li>
<li><strong>Timing.</strong> November to March is the season. April and October are warm but manageable. June to September is genuinely hard work outdoors, though hotel prices halve.</li>
</ul>`,
  }),

  article('old-dubai-in-a-morning', 'Old Dubai in a morning: souks, abras and wind towers', {
    excerpt:
      'The oldest part of the city is also the cheapest and the most rewarding. Here is how to see it properly in about four hours.',
    author: 'Omar Haddad',
    publishDate: '2026-03-04T09:00:00Z',
    tags: ['culture-heritage', 'shopping', 'free-to-visit', 'street-food'],
    relatedPlaces: ['al-fahidi-neighbourhood', 'textile-souk', 'abra-creek-crossing', 'spice-souk', 'gold-souk', 'perfume-souk', 'al-shindagha-museum', 'waterfront-market'],
    body: `<p>Most visitors to Dubai see the city that was built in the last twenty-five years. The city that existed before it is still there, still working, and takes about four hours to walk. It is also almost free.</p>
<p>Old Dubai is really two banks of a saltwater creek: Bur Dubai to the south, where the merchants lived, and Deira to the north, where they traded. The crossing between them is the spine of any sensible route, so the walk below starts on one side and ends on the other.</p>
<h2>Start early. This is not optional.</h2>
<p>Be in Al Fahidi by eight. The lanes are shaded but the courtyards are not, and by eleven the district goes from pleasant to punishing. Early also means the souks are opening rather than closed for their long afternoon break, and the Creek wharfside is at its most active.</p>
<h2>Al Fahidi: 60–90 minutes</h2>
<p>Al Fahidi — still widely called Bastakiya — was built in the late nineteenth century by Persian merchants from Bastak, and it is the clearest surviving picture of how people lived here before oil. The houses are coral and gypsum around open courtyards, the lanes are narrow on purpose, and the wind towers rising from the roofs are the region's pre-electric air conditioning: they catch whatever breeze exists and funnel it down into the rooms below.</p>
<p>Wander rather than tick off. The quarter is small enough that you cannot really get lost, and the pleasure of it is turning corners. Worth stopping at: the Coffee Museum, which is better than it needs to be and has a room where Emirati coffee is brewed over coals; XVA Gallery, which has a courtyard café; and the Sheikh Mohammed Centre for Cultural Understanding, which runs guided meals and mosque visits and answers, genuinely, any question you put to it.</p>
<h2>The Textile Souk and the Grand Mosque: 30 minutes</h2>
<p>Walk north to the Creek and you arrive at the Textile Souk, a restored wooden arcade selling fabric by the metre — silks, cottons, pashminas and heavily embroidered cloth — along with the tailors who will make it up for you within a couple of days at a price that will surprise you.</p>
<p>Beside it stands the Bur Dubai Grand Mosque, with the tallest minaret in the city at seventy metres and a roofline of more than fifty domes. The interior is not open to non-Muslim visitors, but the exterior and the lanes around it photograph well from the Al Fahidi side.</p>
<h2>Cross by abra: 10 minutes, one dirham</h2>
<p>The abra station sits at the end of the Textile Souk. Abras are small wooden boats with a diesel engine and a bench down the middle; they have crossed here continuously for more than a hundred years; they leave when full, which takes about two minutes; and the fare is one dirham, handed to the driver mid-crossing.</p>
<p>Bring coins. This is one of the two things in Dubai that genuinely still needs cash.</p>
<p>Sit on the outside edge facing the water. From here you get the wharfside, the dhows and the old skyline at water level — a perspective the bridges do not give you.</p>
<h2>The Deira souks: 90 minutes</h2>
<p>Do them in this order.</p>
<p><strong>Spice first.</strong> A few narrow covered lanes of open hessian sacks — saffron, sumac, cardamom, dried lemons, rose buds, frankincense resin. It is much smaller than visitors expect and much better smelling. Iranian saffron sells here at a fraction of European prices and is generally the real thing; buy from a shop with sealed packaging.</p>
<p><strong>Gold second.</strong> Several hundred retailers along a covered lane with an estimated ten tonnes of gold on display at any moment. Windows are stacked floor to ceiling and the first impression is genuinely startling. You will be approached constantly; a polite no is enough. Everything is hallmarked and the trade is well policed, so counterfeiting is not a real concern.</p>
<p><strong>Perfume last</strong>, because your nose will be finished after about six samples. The perfume market deals in attar — concentrated, alcohol-free oil perfume — and in oud, the resinous agarwood that underpins most Gulf fragrance. Many shops will blend to order while you wait. Oud quality varies enormously and the good stuff is expensive; if you are spending seriously, buy from an established shop rather than the cheapest window, and come back on a second visit rather than committing on the first.</p>
<h2>How to haggle without being annoying</h2>
<p>Opening prices are set high and everyone knows it. Halve the first number, expect to meet somewhere above the middle, and be prepared to walk — walking away is a normal part of the process, not an insult. Be pleasant throughout; the whole transaction is meant to be sociable. And know what is actually negotiable: with gold, the metal price is fixed daily by regulation and only the making charge moves.</p>
<h2>If you have another hour</h2>
<p>Two options, both a short taxi ride. Al Shindagha Museum at the Creek mouth is the most substantial heritage project in the city — a whole district of restored houses turned into linked pavilions, modern in presentation and easily half a day if you let it be. Or the Waterfront Market, a working fish, meat and produce hall where you buy at the counter and take your catch upstairs to be grilled to order for a small fee. It is one of the cheapest good meals in Dubai.</p>
<h2>What it costs</h2>
<p>Al Fahidi, the souks and the mosque exterior are free. The abra is one dirham each way. A museum is a few dirhams. You can do this entire morning, lunch included, for less than the price of one observation deck ticket — which is worth knowing, because it is also the part of the trip most people say they remember.</p>`,
  }),

  article('dubai-public-beaches-guide', 'Where to swim: a guide to Dubai’s public beaches', {
    excerpt:
      'Which stretch of sand suits which kind of day — from the activity beaches to the quiet ends nobody photographs.',
    author: 'Layla Aziz',
    publishDate: '2026-04-18T09:00:00Z',
    tags: ['beaches', 'free-to-visit', 'family', 'outdoors'],
    relatedPlaces: ['jumeirah-beach', 'kite-beach', 'sunset-beach', 'la-mer', 'the-beach-at-jbr', 'palm-west-beach', 'bluewaters-beach', 'al-mamzar-beach-park', 'marina-beach'],
    body: `<p>Dubai has around seventy kilometres of coastline and a genuinely good record on public access: the best beaches here are free, cleaned daily, lifeguarded and equipped with showers. What differs between them is not sand quality — which is uniformly excellent — but atmosphere, facilities and how many other people are there.</p>
<p>Here is how the main stretches actually differ, roughly north to south.</p>
<h2>Al Mamzar Beach Park — the family day out</h2>
<p>Out on the headland where Dubai meets Sharjah, Al Mamzar is a 106-hectare landscaped park containing five separate beaches, sheltered swimming lagoons, mature palm planting, barbecue areas, pools and chalets to rent by the day.</p>
<p>It is the best choice if you want shade and grass as well as sand, and the sheltered lagoons make it the safest option for small children. Entry costs a few dirhams. Note that two days a week are reserved for women and children, so check before setting out, and allow driving time — it is well out on the northern edge of the city.</p>
<h2>Jumeirah Beach — the reliable default</h2>
<p>The long Jumeirah stretch is the city's everyday beach: pale sand, calm shallow water, running tracks behind the sand, and a set of named public sections each with parking and facilities.</p>
<p>Sections of it have floodlit night swimming, which sounds like a gimmick and is in fact the single best idea on this list. In high summer the sea passes 33°C during the day; swimming at ten at night in July is far more pleasant than swimming at ten in the morning.</p>
<h2>Sunset Beach — the photograph</h2>
<p>Officially Umm Suqeim Beach, and the closest public sand to the Burj Al Arab. This is where the familiar images of the hotel are taken from: the light comes from behind you in the evening and hits the sail directly.</p>
<p>It is also one of the very few places in Dubai where surfing is occasionally possible, in winter, when a swell arrives. Arrive an hour before sunset to get a position; parking is free but limited.</p>
<h2>Kite Beach — the active one</h2>
<p>The sportiest stretch of the coast. Kitesurfing at the northern end, beach volleyball and football courts, a skate park, a fourteen-kilometre running track along the back, and a permanent strip of food trucks and casual cafés.</p>
<p>Come here if you want to do something rather than lie down. Kitesurf lessons, paddleboard and kayak hire all operate off the sand. It is very busy at weekends and parking fills by mid-morning on Fridays and Saturdays.</p>
<h2>La Mer — the one with lunch attached</h2>
<p>A low-rise beachfront development at Jumeirah 1: timber boardwalks, painted murals, and a strip of independent restaurants running behind a wide public beach. Laguna Waterpark sits at the northern end, there is a cinema, and watersports operate off the beach.</p>
<p>Calmer than JBR and considerably easier to park at. A good choice when you want a beach afternoon that ends in a proper meal without moving the car.</p>
<h2>The Beach at JBR — the busiest</h2>
<p>JBR is the most popular public beach in the city and feels it. Behind the sand sits an open-air development of restaurants, shops, an outdoor cinema and a splash park; in front of it, watersports operators and a Ferris wheel.</p>
<p>It is holiday-town energy at scale, and whether that appeals is entirely a matter of taste. Weekend evenings are packed. Beach access and showers are free; parking is paid and fills early.</p>
<h2>Marina Beach — JBR without the crowd</h2>
<p>The northern continuation of the JBR sand, where the Marina district meets the Gulf. Same water, same lifeguards, same tower backdrop — which is one of the more dramatic beach outlooks anywhere — but progressively quieter the further north you walk.</p>
<p>If you like the JBR setting and not the JBR density, walk ten minutes up the beach.</p>
<h2>Palm West Beach — for the sunset</h2>
<p>A 1.6-kilometre boardwalk along the western side of the Palm's trunk, with free public beach access and a continuous strip of beach clubs behind it. It faces west, straight into the sunset and the Marina skyline, which makes it the best west-facing public beach in the city.</p>
<p>Beach access is free; the clubs charge a minimum spend for sunbeds. The running and cycling track behind the sand is well used at either end of the day.</p>
<h2>Bluewaters Beach — the quiet one</h2>
<p>A small public beach on the seaward side of Bluewaters Island, facing away from the city towards open water. Proper facilities, a fraction of the JBR crowd, and reachable on foot from JBR across the pedestrian bridge — which is itself a good vantage point.</p>
<p>The most underrated beach on this list.</p>
<h2>Practical notes for all of them</h2>
<ul>
<li><strong>Dress.</strong> Swimwear is for the sand and the water. Cover up walking to and from the car or the café — it is expected, and it is a legal matter rather than a stylistic one.</li>
<li><strong>Shade.</strong> Almost non-existent on the open beaches. Bring your own, or use Al Mamzar, which has real trees.</li>
<li><strong>Flags.</strong> Lifeguarded beaches fly a flag system; red means do not enter, and it is enforced. Currents here are occasionally serious despite how calm the water looks.</li>
<li><strong>Summer.</strong> Between June and September, go at dawn or after dark. Midday sand is hot enough to burn bare feet and the UV index routinely hits extreme.</li>
</ul>`,
  }),

  article('dubai-on-a-budget', 'Dubai on a budget: the free and nearly-free city', {
    excerpt:
      'The city has a reputation for expense it only half deserves. A guide to what costs nothing, and where the money actually goes.',
    author: 'This is Dubai Editorial',
    publishDate: '2026-01-22T09:00:00Z',
    tags: ['free-to-visit', 'street-food', 'outdoors', 'culture-heritage'],
    relatedPlaces: ['the-dubai-fountain', 'abra-creek-crossing', 'al-fahidi-neighbourhood', 'burj-park', 'dubai-water-canal', 'spice-souk', 'jumeirah-corniche', 'al-qudra-lakes', 'alserkal-avenue', 'waterfront-market'],
    body: `<p>Dubai's reputation for expense comes from a real place — it has some of the most costly hotel suites and tasting menus on earth — but it is a partial picture. The city is also full of things that cost nothing, and a visitor who plans around them can have a very good week for less than the equivalent in most European capitals.</p>
<p>Here is what is genuinely free, what is nearly free, and where the money actually disappears.</p>
<h2>Free, and worth doing anyway</h2>
<p><strong>The Dubai Fountain.</strong> Shows every half hour through the evening on the Burj Lake, and the best viewing spots — the promenade outside the Dubai Mall, the Souk Al Bahar bridge — are the free ones. Paid options buy you a seat, not a better angle.</p>
<p><strong>Al Fahidi.</strong> The restored historic quarter is open at all hours and costs nothing to walk. Several of the small museums inside charge a few dirhams; some are free.</p>
<p><strong>Burj Park.</strong> An island of grass in the Burj Lake, reached by footbridge, with the tower, the lake and the fountain in a single frame. The best free photograph in Downtown.</p>
<p><strong>The Dubai Water Canal.</strong> Several kilometres of landscaped promenade through Business Bay, lit at night, with a waterfall falling from the Sheikh Zayed Road bridge that pauses automatically as boats pass beneath. Genuinely one of the most pleasant free things in the city between October and April.</p>
<p><strong>Jumeirah Corniche.</strong> A fourteen-kilometre seafront promenade with separated cycling and running tracks, exercise stations, showers and beach access along its length.</p>
<p><strong>Every public beach.</strong> Free entry, lifeguards, showers, cleaned daily. See our beaches guide.</p>
<p><strong>Alserkal Avenue.</strong> Around thirty galleries and project spaces in a converted marble factory in Al Quoz. Walking in and around costs nothing, and this is where the region's contemporary art actually trades.</p>
<p><strong>The souks.</strong> Spice, gold, perfume and textile markets are all free to walk. Whether you leave with an empty wallet is a separate question.</p>
<h2>Nearly free</h2>
<p><strong>The abra: one dirham.</strong> A wooden water taxi across the Creek, running continuously for over a century. There is nothing else in the city that offers this much for this little.</p>
<p><strong>The Metro: a few dirhams.</strong> Clean, air-conditioned, punctual, and it covers the airport, Downtown, the Marina and Expo City. A day pass costs less than a single short taxi. The front carriage of the driverless trains has a forward window — free entertainment.</p>
<p><strong>Zabeel Park and Creek Park: a few dirhams.</strong> Large, mature, properly shaded parks with lakes and running loops. Creek Park has a cable car; Zabeel has the Dubai Frame at its centre.</p>
<p><strong>The Dubai Frame: modest.</strong> One of the cheaper big-ticket attractions and among the better ones — a 150-metre gold rectangle positioned so you look through it at historic Deira on one side and the modern skyline on the other.</p>
<h2>Eating cheaply, and well</h2>
<p>This is where Dubai surprises people. The city's food reputation is built on tasting menus, but the everyday eating is dominated by South Asian, Levantine, Filipino and East African kitchens serving the people who actually live here, and it is inexpensive.</p>
<p>Look for cafeterias and canteens in Deira, Karama and Al Quoz rather than restaurants in malls. A shawarma costs a few dirhams; a full Kerala thali or a Pakistani karahi costs less than a coffee in Downtown. The Waterfront Market in Deira lets you buy fish at the counter and have it grilled upstairs for a small fee — one of the best-value meals in the city.</p>
<p>During the Dubai Food Festival each February, the Hidden Gems strand is explicitly built around these places and is the fastest way to find them.</p>
<h2>Where the money actually goes</h2>
<p>Four things account for most of a Dubai budget, and three of them are avoidable.</p>
<ul>
<li><strong>Hotels.</strong> The single biggest variable. Peak season (November to March) rates are roughly double the summer. Al Barsha and Deira are considerably cheaper than Downtown or the Marina and both sit on the Metro.</li>
<li><strong>Observation decks.</strong> The Burj Khalifa is the expensive one. Sky Views and The View at The Palm cost substantially less and, in the case of The View, show you something the Burj cannot — the Palm's shape.</li>
<li><strong>Theme parks and waterparks.</strong> Full-day tickets add up fast for a family. Book online — walk-up prices are meaningfully higher — and look at multi-park passes.</li>
<li><strong>Alcohol.</strong> Heavily taxed and served mainly in hotel venues. It is the line item most likely to quietly double an evening's bill.</li>
</ul>
<h2>The summer trade-off</h2>
<p>Between June and September, hotel rates fall by half or more, attractions empty out, and Dubai Summer Surprises discounts the malls. The price is real: daytime temperatures pass 45°C with high humidity, and any outdoor plan has to happen before eight in the morning or after sunset.</p>
<p>If your itinerary is mostly indoors — museums, malls, aquariums, indoor theme parks, Ski Dubai — summer is defensible and dramatically cheaper. If you came for the beach and the desert, it is not.</p>
<h2>A rough day, done cheaply</h2>
<p>Metro to Al Fahidi. Walk the historic quarter. Cross by abra for one dirham. Work the spice, gold and perfume souks. Lunch at a Deira canteen. Metro to Burj Khalifa station in the late afternoon, walk the Water Canal promenade, then take a position on the Burj Lake for the evening fountain shows.</p>
<p>Total outlay, excluding whatever the souks talk you into: the price of a sandwich in most European capitals.</p>`,
  }),

  article('desert-in-a-day', 'The desert in a day: dunes, wildlife and dark skies', {
    excerpt:
      'Ninety per cent of Dubai’s land area is desert, and most visitors only see it through a tour operator’s windscreen. There are better ways.',
    author: 'Omar Haddad',
    publishDate: '2026-05-09T09:00:00Z',
    tags: ['desert', 'wildlife', 'outdoors', 'adventure'],
    relatedPlaces: ['al-marmoom-desert-conservation-reserve', 'dubai-desert-conservation-reserve', 'al-qudra-lakes', 'love-lake-dubai', 'hatta-dam', 'hatta-wadi-hub', 'hatta-heritage-village'],
    body: `<p>The overwhelming majority of Dubai's land area is desert, and the overwhelming majority of visitors experience it as a three-hour package: a convoy of Land Cruisers, twenty minutes of dune bashing, a camel photo, a buffet under strings of lights, and back to the hotel by ten.</p>
<p>There is nothing wrong with that, and if it is your only chance to see the interior it is better than nothing. But it is not the only option, and the alternatives are quieter, cheaper and in some cases better.</p>
<h2>Al Marmoom: the free option</h2>
<p>Al Marmoom Desert Conservation Reserve covers around a tenth of Dubai's total land area — the largest unfenced reserve in the country — and you can simply drive to it. It supports roughly 200 native bird species and reintroduced populations of Arabian oryx, sand gazelle and Arabian gazelle, which are regularly visible from the road.</p>
<p>The 86-kilometre Al Qudra cycle track runs through it. This is the best thing in the reserve and it is free: a properly built, sealed cycling loop through open dune and gravel plain, with distance options from a short circuit to the full length. Bike hire operates from the trailhead. Go at first light in the cooler months and you will share it with a few dozen serious cyclists and a lot of gazelle.</p>
<h2>The lakes</h2>
<p>Two artificial lakes in the reserve have become significant bird habitat and both are free.</p>
<p><strong>Al Qudra Lakes</strong> is a chain of water bodies surrounded by planted trees, populated by swans, ducks and migratory species. It is one of the very few places near Dubai where wild camping is permitted, and winter weekends see families set up for the night. There are no facilities — bring water and shade, and take everything out with you.</p>
<p><strong>Love Lake</strong>, further south, is two interlocking heart-shaped lakes visible as such only from the air, ringed by 16,000 trees and a walking track. It has, unusually for somewhere this remote, real facilities: toilets, barbecue areas and a small café. Sunset is the time to come.</p>
<p>Both are reachable in a normal car in dry conditions; the final stretch is graded track and the sand off the tarmac is soft, so stay on it.</p>
<h2>The Dubai Desert Conservation Reserve: the serious option</h2>
<p>Established in 2003 as the country's first protected area, the DDCR covers around 225 square kilometres and holds the largest reintroduced Arabian oryx population in the region.</p>
<p>Access is deliberately restricted to licensed operators, which is the point — visitor numbers here are a fraction of the commercial desert camps, and the experience is correspondingly different. Options run from dawn wildlife drives and falconry demonstrations to overnight stays at the reserve's lodge. It costs considerably more than a standard safari and is a genuinely different product: conservation-led, small-group and quiet.</p>
<p>If you only do one paid desert activity, this is the one worth the money.</p>
<h2>Stargazing</h2>
<p>Dubai's light dome is substantial, but Al Marmoom is far enough out that the Milky Way is visible on clear winter nights. The best conditions are a new moon between November and February, when the air is dry and the nights are cold enough to want a jacket.</p>
<p>Several operators run astronomy evenings with telescopes; you can also simply drive out, park legally off the track, and look up. Give your eyes twenty minutes to adapt and do not use a white torch.</p>
<h2>Hatta: the desert that is not sand</h2>
<p>Worth knowing that Dubai has a second, entirely different interior. Hatta is a mountain exclave about 130 kilometres inland, surrounded by the Hajar range near the Omani border — bare rock, deep wadis, and a turquoise reservoir behind the Hatta Dam.</p>
<p>The dam is free and the most photographed spot in the exclave; kayak and pedal-boat hire operate from the shore, and queues form on winter weekends, so arrive before ten. Hatta Wadi Hub next door is a purpose-built adventure centre with genuinely well-built graded mountain-bike trails, ziplines and a via ferrata — the only facility of its kind in the emirate. Hatta Heritage Village, a restored settlement of stone houses, watchtowers and a working falaj irrigation channel, is free, quiet and shows a completely different Emirati vernacular from the coastal wind-tower houses.</p>
<p>Hatta deserves an overnight rather than a day trip, and is realistically October to April only.</p>
<h2>Safety, which is not optional here</h2>
<ul>
<li><strong>Season.</strong> Between May and September, daytime desert heat is dangerous rather than uncomfortable. Plan for dawn and dusk, or do not go.</li>
<li><strong>Water.</strong> Carry far more than you think you need. There is nowhere to buy any.</li>
<li><strong>Driving.</strong> Do not take a normal car off sealed or graded surfaces. Soft sand strands two-wheel-drive vehicles within metres, and recovery is expensive. If you want to drive dunes, go with an operator or an experienced group — never alone.</li>
<li><strong>The reserve rules.</strong> Off-road driving is restricted to protect the habitat. Stay on marked tracks; the fines are real and the damage is worse.</li>
<li><strong>Rubbish.</strong> Take everything out. The camping areas near Al Qudra suffer badly from people who do not.</li>
</ul>
<h2>What to choose</h2>
<p>If you have a morning and a car: the Al Qudra track and the lakes, free. If you have money and want wildlife: a dawn drive in the DDCR. If you have a weekend and want a complete change of landscape: Hatta. If you have three hours and a hotel pickup: the standard safari is fine — just know it is the least interesting version of a very interesting place.</p>`,
  }),

  article('eating-in-dubai', 'Eating in Dubai: from canteens to tasting menus', {
    excerpt:
      'The interesting food here is rarely the expensive food. A guide to where the city actually eats.',
    author: 'Priya Menon',
    publishDate: '2026-03-27T09:00:00Z',
    tags: ['street-food', 'fine-dining', 'culture-heritage', 'shopping'],
    relatedPlaces: ['waterfront-market', 'spice-souk', 'al-seef', 'souk-al-bahar', 'the-walk-at-jbr', 'global-village', 'pier-7'],
    body: `<p>Dubai's food reputation abroad is built on the top end: imported celebrity chefs, tasting menus with skyline views, a growing list of starred restaurants. That scene is real and some of it is very good. It is also the least distinctive thing about eating here.</p>
<p>What makes this a genuinely interesting food city is that around ninety per cent of its residents were born somewhere else, and a great many of them cook. The result is a city where Keralan, Pakistani, Filipino, Lebanese, Iranian, Egyptian, Ethiopian and Sri Lankan food is not a novelty but the everyday default, cooked by people who grew up with it, at prices set for people who eat it every day.</p>
<h2>Start with the canteens</h2>
<p>The single best piece of advice for eating in Dubai is to leave the mall.</p>
<p>The neighbourhoods to look in are Deira, Karama, Satwa and the older parts of Bur Dubai. What you are looking for is a plain room with fluorescent lighting, a laminated menu, and a clientele that is entirely local residents. These places are called cafeterias, they are usually open very late, and a substantial meal costs a fraction of a mall lunch.</p>
<p>Specific things worth ordering: a Keralan thali served on a banana leaf; a Pakistani karahi cooked to order in the wok it is named after; Iranian chelo kebab with saffron rice and grilled tomato; an Egyptian koshary, which is the most satisfying carbohydrate stack in the region; Filipino silog breakfasts at any hour.</p>
<h2>Emirati food, which takes effort to find</h2>
<p>Actual Emirati cooking is a small minority of the city's restaurants, because Emiratis are a small minority of its residents and the food has traditionally been domestic rather than commercial. It is worth seeking out.</p>
<p>Look for machboos — spiced rice with meat or fish, the regional cousin of biryani; harees, a slow-cooked wheat and meat porridge that appears everywhere during Ramadan; luqaimat, fried dough balls in date syrup, which are the standard dessert; and camel meat, which turns up in burgers and stews and tastes closer to beef than most people expect.</p>
<p>The Sheikh Mohammed Centre for Cultural Understanding in Al Fahidi runs communal Emirati meals with an explicit brief to answer questions about the food and the culture around it. It is the most straightforward way in.</p>
<h2>The Waterfront Market</h2>
<p>Deira's covered fish, meat and produce hall is a working market rather than an attraction, and it contains the best-value serious meal in the city: buy fish at the counter, take it to the cooking stations upstairs, and have it grilled or fried to order for a small fee.</p>
<p>Go early if you want to see the auction floor active. Wear shoes you do not mind getting wet.</p>
<h2>Where the views are</h2>
<p>Some meals here are about the room rather than the plate, and that is a legitimate reason to go.</p>
<p>The waterfront terraces at Souk Al Bahar look straight at the Burj Khalifa and the fountain — book a table on the water for an evening show. Pier 7 in the Marina is a cylindrical tower with a different restaurant on each of seven floors, every one with a 360-degree outlook, which makes moving between them across an evening a viable plan. Madinat Jumeirah's canal-side restaurants have the best framed view of the Burj Al Arab anywhere.</p>
<p>Expect to pay for the position. The food at these is generally competent rather than remarkable; you are buying the window.</p>
<h2>The top end</h2>
<p>The fine-dining scene has grown quickly and now includes a meaningful number of starred kitchens. What is worth knowing is that it clusters — Downtown, the Marina, Palm Jumeirah and the big hotels — and that it books out weeks ahead in peak season.</p>
<p>The better value at this level is lunch. Many of the same kitchens run a set lunch at a fraction of the dinner price, with most of the same cooking.</p>
<h2>Festivals worth timing a trip around</h2>
<p>The <strong>Dubai Food Festival</strong> runs for two and a half weeks each February and March. Two strands matter: Restaurant Week, which puts fixed-price tasting menus into high-end venues, and Hidden Gems, which highlights exactly the small neighbourhood kitchens this article is about. Hidden Gems is the one to plan around — it is the fastest route to places that outlast the festival.</p>
<p><strong>Global Village</strong>, October to April, is the other food destination hiding in plain sight. Behind the shopping pavilions is an enormous run of national food stalls, most of them inexpensive and genuinely good, and the crowd is overwhelmingly residents rather than tourists.</p>
<h2>Practical notes</h2>
<ul>
<li><strong>Ramadan.</strong> During the holy month, eating and drinking in public during daylight is not permitted. Restaurants largely close during the day and then do enormous iftar spreads after sunset — which is a very good time to eat here, and anyone can join.</li>
<li><strong>Alcohol.</strong> Served mainly in hotel venues and licensed restaurants. It is expensive, and it is the fastest way to double a bill.</li>
<li><strong>Booking.</strong> Essential at the top end in season; unnecessary and often not possible at the canteens.</li>
<li><strong>Tipping.</strong> A service charge is often included. Ten per cent on top is generous and appreciated.</li>
<li><strong>Late.</strong> The city eats late, especially in summer and during Ramadan. Kitchens in the older districts routinely run past midnight.</li>
</ul>`,
  }),

  article('dubai-with-kids', 'Dubai with kids: a survival guide', {
    excerpt:
      'A city that is unusually well set up for children — provided you plan around the heat rather than pretending it is not there.',
    author: 'Nadia Rahman',
    publishDate: '2026-06-02T09:00:00Z',
    tags: ['family', 'waterparks', 'wildlife', 'outdoors'],
    relatedPlaces: ['kidzania-dubai', 'dubai-aquarium', 'the-green-planet', 'aquaventure-waterpark', 'wild-wadi-waterpark', 'legoland-dubai', 'img-worlds-of-adventure', 'ski-dubai', 'dubai-safari-park', 'creek-park', 'dubai-butterfly-garden'],
    body: `<p>Dubai is one of the easier cities in the world to visit with children. It is safe, it is clean, almost everything is air-conditioned, and an enormous share of its attractions were built with families explicitly in mind.</p>
<p>The one thing that will ruin a family trip here is failing to plan around the heat. Everything else is straightforward.</p>
<h2>The heat rule</h2>
<p>From May to September, outdoor activity with children is realistically limited to before nine in the morning and after six in the evening. In July and August, cut that further. Sunburn happens fast, dehydration happens faster, and children complain about both later than adults do.</p>
<p>Between November and March none of this applies and the city is delightful.</p>
<p>Practical measures that actually help: rash vests rather than sunscreen alone for pool and beach days, refillable water bottles, and building the day around a long indoor block in the middle.</p>
<h2>Indoor, for the middle of the day</h2>
<p><strong>KidZania</strong> at the Dubai Mall is the standout, and it is more absorbing than the description suggests. It is a scaled-down city — hospital, fire station, bank, shops — in which children take jobs, earn a local currency and spend it. Adults accompany but are largely excluded from the activities, which is the point. It suits roughly five to twelve; under-fours get less from it. Weekday afternoons in term time are dramatically quieter.</p>
<p><strong>Dubai Aquarium</strong>, also in the Dubai Mall, has a 48-metre walkthrough tunnel and one of the largest shark populations in captivity. Worth knowing: the main viewing panel is visible free from the mall walkway, and plenty of families decide that is enough. Pay for the tunnel if you want the shark feed or the Underwater Zoo above it, which is stronger than its name — penguins, otters, crocodiles.</p>
<p><strong>The Green Planet</strong> at City Walk is a four-storey enclosed rainforest built around a large artificial tree, with sloths, toucans and a walk-through bird level. It is humid inside by design. About ninety minutes.</p>
<p><strong>Ski Dubai</strong> at Mall of the Emirates is a genuine ski slope kept below freezing, with a snow park, toboggans and a resident colony of gentoo and king penguins that march daily. Jackets and boots are included; bring gloves and warm socks.</p>
<p><strong>IMG Worlds of Adventure</strong> is the world's largest indoor theme park — Marvel, Cartoon Network and a dinosaur zone, all under one roof. It runs at full capacity in August when outdoor parks are unusable, which is exactly its value.</p>
<h2>Water, which solves most days</h2>
<p><strong>Aquaventure</strong> at Atlantis is the big one: over a hundred slides and attractions, 700 metres of private beach, a long lazy river, and a large children's zone. It is a full day, not a half. Buy online well ahead — walk-up prices are considerably higher — and do the headline slides first, before the noon queues.</p>
<p><strong>Wild Wadi</strong> beneath the Burj Al Arab is smaller, cheaper and quicker to cover, with a strong wave pool and a good toddler area. Half a day is enough.</p>
<p><strong>Legoland Water Park</strong> is deliberately gentle and scaled for two to twelve, including a build-a-raft lazy river where children customise a float from oversized bricks. Nothing here will frighten anyone.</p>
<p><strong>Laguna Waterpark</strong> at La Mer is compact and inexpensive, with a genuine standing surf wave and instructors — rare in the region and a hit with older children.</p>
<h2>Animals and outdoors, for the cooler months</h2>
<p><strong>Dubai Safari Park</strong> holds around 3,000 animals in open habitats organised by continent, with a drive-through section and a substantial Arabian wildlife area. It opens only October to May. Go at opening — animals are visibly more active before the heat.</p>
<p><strong>Dubai Butterfly Garden</strong> keeps 15,000 butterflies across nine climate-controlled domes and, unlike its neighbour the Miracle Garden, is open year-round. Mornings are best, when the butterflies are most active. About an hour.</p>
<p><strong>Creek Park</strong> is two and a half kilometres of Creek frontage with mature planting, a boating lake, barbecue areas, a children's science museum, and a cable car running thirty metres above it. Entry is a few dirhams. The Dolphinarium sits inside the park.</p>
<p><strong>Ras Al Khor Wildlife Sanctuary</strong> is free, takes an hour, and puts thousands of flamingos in front of a hide. Best November to March, and go early.</p>
<h2>Ages, roughly</h2>
<ul>
<li><strong>Under 5:</strong> Legoland Water Park, the Butterfly Garden, Creek Park, sheltered beaches at Al Mamzar, the Dubai Aquarium.</li>
<li><strong>5–9:</strong> KidZania, Legoland Dubai, The Green Planet, Wild Wadi, the Dolphinarium, Ski Dubai's snow park.</li>
<li><strong>10–14:</strong> IMG Worlds, Aquaventure, VR Park, Sky Views' glass slide, Ski Dubai's slope, Laguna's surf wave.</li>
<li><strong>Teenagers:</strong> XLine's zipline through the Marina, Aquaventure's Leap of Faith, AYA Universe, Sole DXB if the timing lands.</li>
</ul>
<h2>Logistics</h2>
<ul>
<li><strong>Getting around.</strong> The Metro is easy with pushchairs and has a dedicated women-and-children carriage. Taxis are metered, cheap and plentiful; child seats are not standard, so bring or book one if that matters to you.</li>
<li><strong>Booking.</strong> Almost every paid attraction is meaningfully cheaper online, and timed entry is increasingly the norm. Book at least the day before.</li>
<li><strong>Food.</strong> Malls have vast food halls with something for the fussiest child. The canteens in the older districts are extremely child-tolerant and much better food.</li>
<li><strong>Facilities.</strong> Baby-change rooms are near-universal in malls and attractions, and generally excellent.</li>
<li><strong>Term time.</strong> Local school holidays make a large difference to crowding. Weekday visits outside them can feel like having the place to yourself.</li>
</ul>`,
  }),

  article('best-views-in-dubai', 'The best views in Dubai, ranked by what you actually see', {
    excerpt:
      'Height is not the same as a good view. A comparison of the city’s observation decks, terraces and free vantage points.',
    author: 'This is Dubai Editorial',
    publishDate: '2026-04-02T09:00:00Z',
    tags: ['views', 'landmarks', 'architecture', 'free-to-visit'],
    relatedPlaces: ['burj-khalifa', 'at-the-top-sky', 'the-view-at-the-palm', 'sky-views-dubai', 'dubai-frame', 'ain-dubai', 'burj-park', 'palm-west-beach', 'pier-7'],
    body: `<p>Dubai sells altitude, and it is easy to assume that the highest deck gives the best view. It does not. What you see matters more than how far up you are, and above a certain height a city stops resolving into anything legible — you get a haze-flattened grid and a lot of sky.</p>
<p>Here is how the main vantage points actually compare.</p>
<h2>1. The View at The Palm — the one that shows you something</h2>
<p>At 240 metres this is nowhere near the tallest, and it is the most interesting view in the city, for a simple reason: it is the only publicly accessible point from which Palm Jumeirah's shape reads.</p>
<p>The palm is invisible from ground level. That is the thing every visitor underestimates, and it is why an island famous for its outline is a slight anticlimax to actually stand on. From the 52nd floor of the Palm Tower, positioned at the island's centre, you get the fronds, the crescent, the Marina skyline and the open Gulf, plus a small gallery on how the island was built — which is genuinely interesting given the engineering involved.</p>
<p>Cheaper than the Burj Khalifa, rarely as crowded, and about an hour end to end.</p>
<h2>2. The Dubai Frame — the one with an argument</h2>
<p>A 150-metre gold rectangle, deliberately positioned so that looking through it one way shows historic Deira and the other way shows the Sheikh Zayed Road skyline. It is an unusually literal piece of urban design and it works: no other viewpoint here makes the city's timeline so plain.</p>
<p>The sky bridge across the top has a glass floor panel that cycles between opaque and transparent as you walk. Late afternoon gives you the old city in good light and the new city lighting up on the way down. Cheap by Dubai standards and rarely needs booking far ahead.</p>
<h2>3. Burj Khalifa, level 124/125 — the obvious one</h2>
<p>You should probably do it once. It is the tallest building in the world by a wide margin, the lift takes a minute, and standing on the outdoor terrace at 452 metres is a genuine experience.</p>
<p>Two caveats. First, from up here Downtown is directly below and foreshortened, so the view is mostly middle distance and haze — the tower itself, which is the thing you came to see, is not in it. Second, sunset slots sell out weeks ahead and cost substantially more. Morning visibility is often better than late afternoon, when haze builds over the coast.</p>
<h2>4. Sky Views Dubai — the best value high deck</h2>
<p>219 metres up, on the bridge linking the two Address Sky View towers, with a glass-floored walkway. The view includes the Burj Khalifa, which is exactly what the Burj Khalifa's own view lacks, and it costs a fraction of the price.</p>
<p>The glass slide from level 53 to 52 is the headline and lasts about eight seconds; people either love it or regret it immediately. There is also a harnessed edge walk around the outside. The observatory alone is the sensible purchase.</p>
<h2>5. At The Top Sky, level 148 — paying for space</h2>
<p>555 metres, roughly a hundred above the standard decks, run as a lounge with refreshments and an outdoor terrace.</p>
<p>The view is not dramatically different from level 125. What you are buying is a capped crowd — levels 124 and 125 can be shoulder-to-shoulder at sunset, and if you are photographing the city, elbow room matters more than a hundred metres of extra height.</p>
<h2>6. Ain Dubai — when it is running</h2>
<p>The tallest observation wheel ever built at just over 250 metres, with a 38-minute rotation and a view spanning the Marina towers, Palm Jumeirah and the open Gulf.</p>
<p>The significant caveat is that operations have been suspended for extended periods since it opened. Check its current status before planning a visit around it. From the ground, and from JBR beach opposite, it is impressive regardless — and free.</p>
<h2>The free ones, which are better than they sound</h2>
<p><strong>Burj Park.</strong> An island of grass in the Burj Lake, reached by footbridge. You get the tower, the lake and the fountain in a single frame with room for a tripod. This is the best free photograph in Downtown and arguably the best photograph of the Burj Khalifa anywhere — because it includes the Burj Khalifa.</p>
<p><strong>Palm West Beach.</strong> A 1.6-kilometre west-facing boardwalk on the Palm's trunk looking back at the Marina skyline across the water. The best free sunset position in the city.</p>
<p><strong>The Souk Al Bahar bridge.</strong> Puts the tower directly behind the fountain jets. Costs nothing, and the terraces beside it are where you would pay for the same angle.</p>
<p><strong>Dubai Creek Harbour promenade.</strong> A wide, uncrowded waterfront with an uninterrupted view of the Downtown skyline across the water — the cleanest long shot of the city's centre, and almost nobody is there.</p>
<p><strong>The JBR–Bluewaters footbridge.</strong> Ain Dubai on one side, the Marina towers on the other, ten minutes on foot.</p>
<h2>Views with a table</h2>
<p>Pier 7 in the Marina stacks seven restaurants on seven floors, each with a 360-degree outlook — the upper floors have the better views and the later licences. Souk Al Bahar's waterfront terraces look straight at the fountain and the tower. Madinat Jumeirah's canal-side restaurants have the best framed view of the Burj Al Arab anywhere.</p>
<p>At all of these the food is competent and the window is the product. Book ahead in season.</p>
<h2>The short version</h2>
<p>If you do one paid view, make it The View at The Palm — it shows you something you cannot see any other way. If you do two, add the Dubai Frame. If you want the Burj Khalifa in your photographs rather than under your feet, go to Sky Views, or to Burj Park for nothing at all.</p>`,
  }),

  article('ramadan-in-dubai-visitors', 'Ramadan in Dubai: what visitors should know', {
    excerpt:
      'The holy month changes the rhythm of the city completely. It is a genuinely interesting time to visit — provided you understand the etiquette.',
    author: 'Layla Aziz',
    publishDate: '2026-01-08T09:00:00Z',
    tags: ['culture-heritage', 'street-food', 'family', 'festivals'],
    relatedPlaces: ['al-fahidi-neighbourhood', 'jumeirah-mosque', 'al-seef', 'spice-souk', 'bur-dubai-grand-mosque', 'global-village'],
    body: `<p>Every year a month arrives in which Dubai's whole daily rhythm inverts. Fasting runs from dawn to sunset, working hours shorten, the daytime city goes quiet, and everything that matters happens after dark.</p>
<p>Some visitors avoid Ramadan. That is a reasonable choice if your plan is beach days and long lunches. But it is also, for anyone interested in the culture of the place, the most interesting month to be here — and the etiquette involved is not complicated.</p>
<h2>When it falls</h2>
<p>Ramadan follows the Islamic lunar calendar, so it moves roughly eleven days earlier each Gregorian year. Its exact start and end depend on the sighting of the moon and are confirmed only a day or two ahead, which means any plan built around the precise dates needs slack in it.</p>
<p>It runs for 29 or 30 days and ends with Eid Al Fitr, a multi-day public celebration.</p>
<h2>The rules that apply to you</h2>
<p>There is essentially one, and it is a legal requirement rather than a courtesy: <strong>do not eat, drink, smoke or vape in public during daylight hours.</strong> That includes chewing gum and includes drinking water in the street or in a car.</p>
<p>You are not expected to fast. You are expected not to do it in front of people who are. Hotels maintain screened areas where food and drink are served through the day, and most visitor-facing restaurants operate behind screens or via room service.</p>
<p>Beyond that: dress a little more conservatively than usual, keep music low in public, and be patient — people are hungry, tired and often driving home fast just before sunset, which is statistically the worst hour on the roads all year.</p>
<h2>Iftar, which is the point</h2>
<p>At sunset the fast breaks, traditionally with dates and water, and the entire city sits down to eat at the same moment. This is the best thing about Ramadan and it is open to everyone.</p>
<p>Iftar comes in several forms. Hotels run large buffet spreads in tented settings, which are elaborate, social and priced accordingly. Restaurants across the city do set iftar menus. And community iftar tents — often at mosques or set up by businesses — serve free meals to anyone who comes, which is an ordinary and unremarkable act of hospitality here rather than charity in any pointed sense.</p>
<p>If you are invited to an iftar, go. If you want to arrange one, the Sheikh Mohammed Centre for Cultural Understanding in Al Fahidi runs communal iftars with an explicit brief to answer questions.</p>
<h2>Suhoor, which runs very late</h2>
<p>The second meal, taken before dawn, has evolved into a whole late-night social scene. Suhoor gatherings start around eleven at night and run until two or three in the morning — shisha lounges, hotel tents, restaurants — and are considerably more relaxed than the formal iftar buffets.</p>
<p>The old districts are at their most animated during these hours. Al Seef, the Creek promenades and the souks stay busy long past midnight.</p>
<h2>What is open, and when</h2>
<ul>
<li><strong>Malls and shops</strong> open later and close much later — often past midnight.</li>
<li><strong>Attractions and museums</strong> generally shorten daytime hours. Check individually before travelling; this is the single most common cause of a wasted trip across town during Ramadan.</li>
<li><strong>Restaurants</strong> largely close during daylight and reopen at sunset.</li>
<li><strong>Live music and clubs</strong> are generally paused for the month.</li>
<li><strong>Government offices and banks</strong> run reduced hours.</li>
<li><strong>Beaches, parks and hotel pools</strong> operate normally.</li>
</ul>
<h2>Eid Al Fitr</h2>
<p>The month ends with three or four days of celebration and the switch is abrupt: fireworks across multiple locations on the first evening, free concerts, elaborate mall programming, extended attraction hours, and restaurants packed to capacity.</p>
<p>Everything is extremely busy. Book anything you care about, and expect beaches and parks to fill from mid-afternoon.</p>
<h2>Should you visit during Ramadan?</h2>
<p><strong>Go if</strong> you are interested in the culture, you like cities at night, you want lower hotel rates outside peak season, or you want to see Dubai as something other than a leisure product. The old districts after dark during Ramadan are the best version of themselves.</p>
<p><strong>Don't go if</strong> your plan depends on long daytime meals, daytime drinking, nightlife, or a packed schedule of attractions with predictable opening hours.</p>
<h2>A note on tone</h2>
<p>It is worth saying plainly: Ramadan is a religious observance, not a themed season. The tents and the buffets are real but they are the surface. Underneath is a month of discipline that a large share of the people around you are undertaking seriously, often while working a full day in considerable heat.</p>
<p>Visitors who approach it with that in mind are, in this writer's experience, met with enormous warmth — including a good deal of unsolicited food.</p>`,
  }),

  article('dubai-art-scene', 'Dubai’s art scene: warehouses, galleries and the Alserkal effect', {
    excerpt:
      'The most interesting art in the city is not in the museums. It is in an industrial estate in Al Quoz.',
    author: 'Priya Menon',
    publishDate: '2026-05-21T09:00:00Z',
    tags: ['art-design', 'museums', 'culture-heritage', 'free-to-visit'],
    relatedPlaces: ['alserkal-avenue', 'theatre-of-digital-art', 'aya-universe', 'city-walk', 'museum-of-the-future', 'etihad-museum', 'al-fahidi-neighbourhood'],
    body: `<p>If you came to Dubai expecting the art to be in the museums, you will be mildly disappointed and then, if you go looking, considerably rewarded. The city's serious contemporary art scene is concentrated in a converted marble factory in an industrial zone, and it is one of the more unexpected things here.</p>
<h2>Alserkal Avenue</h2>
<p>Al Quoz is a working industrial district: warehouses, roller doors, car workshops, no attempt at charm. In one corner of it, a former marble factory compound has become the centre of the region's contemporary art trade — around thirty units housing commercial galleries, non-profit project spaces, an independent cinema, design studios and several very good cafés.</p>
<p>This is where the work actually changes hands. Galleries here represent artists from across the Middle East, North Africa and South Asia, and the programme is serious rather than decorative. Concrete — a multipurpose space designed by Rem Koolhaas's OMA, with movable walls and translucent polycarbonate façades — hosts the larger shows and is worth seeing as a building in its own right.</p>
<p>Practical notes: it is free to walk in and around. Most galleries close on Sunday, some open only in the afternoon, and the whole compound goes quiet over the summer when the art season pauses. Gallery openings cluster on the same evenings, which turns the place into a single event — worth timing a visit around if you can. Parking in Al Quoz is awkward; take a taxi.</p>
<h2>Quoz Arts Fest</h2>
<p>Once a year, usually in January, the compound throws its doors open for a free two-day festival: every gallery open, murals painted in progress, craft markets, workshops, film screenings, food trucks and live music across the warehouses and yards.</p>
<p>It is the one weekend when the district fills with people who do not normally go to galleries, and it is the easiest possible introduction to the scene. No tickets required.</p>
<h2>Art Dubai</h2>
<p>The region's principal art fair, held each spring at Madinat Jumeirah, brings around 120 galleries across contemporary, modern and digital sections.</p>
<p>Its distinctiveness is geographic. The gallery list reaches into regions the European and American fairs largely ignore, and the modern section deals in twentieth-century Arab, Iranian and South Asian masters who are genuinely hard to see elsewhere. The talks programme, Global Art Forum, is free with entry and consistently good.</p>
<p>It coincides with Alserkal's strongest season, so do both.</p>
<h2>Immersive and digital, which is its own category here</h2>
<p>Dubai has invested heavily in projection-and-sensor work, and whether you consider it art is a fair question — but there is a lot of it and some is very well made.</p>
<p><strong>Theatre of Digital Art</strong> at Souk Madinat Jumeirah projects Van Gogh, Monet and Klimt across floor-to-ceiling surfaces in scored 40-minute sessions, with a children's drawing zone whose sketches get projected into the main show.</p>
<p><strong>AYA Universe</strong> is twelve themed environments across roughly 4,000 square metres of projection, LED, mirror and motion sensing. It sits somewhere between an installation and a theme-park dark ride, and it is unapologetic about being designed to be photographed.</p>
<h2>Public art, if you know where to look</h2>
<p><strong>City Walk</strong> has a strong programme of commissioned street murals on its gable ends, and the whole district is designed to be walked.</p>
<p><strong>Dubai Design District</strong> (d3) is the city's design quarter, and during Dubai Design Week each November it fills with commissioned installations and large-scale public pieces. Much of that programme is free.</p>
<p><strong>Al Fahidi</strong> holds a cluster of small galleries in restored courtyard houses — XVA among them — which is a completely different register from Al Quoz: quieter, more craft-oriented, and set in the most atmospheric architecture in the city.</p>
<h2>The institutional side</h2>
<p>The permanent museums are stronger on history and design than on contemporary art.</p>
<p><strong>Museum of the Future</strong> is the most significant recent building in the city — a calligraphy-clad torus with no internal columns — and its interior is closer to designed theatre than to a collection. <strong>Etihad Museum</strong>, built on the site where the UAE union was signed, is the best-presented museum in the country and unusually clear about a period usually narrated in slogans. Neither is an art museum, but both are worth an architect's or designer's afternoon.</p>
<h2>How to do it in one day</h2>
<p>Start late morning at Alserkal Avenue — coffee, then work through the galleries; two to three hours is realistic. Lunch in the compound. Then either City Walk for the murals and an easy afternoon, or Al Fahidi for the small galleries and the courtyard architecture. Finish at Souk Madinat Jumeirah, with the digital art theatre and, outside, the best framed view of the Burj Al Arab in the city.</p>
<p>Almost all of that is free.</p>`,
  }),
];
