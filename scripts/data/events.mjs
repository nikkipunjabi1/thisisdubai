// Events (20) — a full 2026/27 season, ordered chronologically.
//
// Slugs for the three original seed events are PRESERVED (their URLs are live).
// Dates are indicative: most of these are annual fixtures whose exact dates are
// confirmed a few months ahead, and the Islamic-calendar events (Ramadan, Eid)
// move roughly eleven days earlier each Gregorian year.

import { event } from './_helpers.mjs';

export const events = [
  event('dubai-fitness-challenge', 'Dubai Fitness Challenge', {
    summary: 'A city-wide push to complete 30 minutes of activity for 30 consecutive days.',
    startDate: '2026-10-24T00:00:00Z', endDate: '2026-11-22T00:00:00Z',
    area: 'downtown-dubai', tags: ['sports', 'family', 'outdoors', 'free-to-visit'],
    body: `<p>For thirty days each autumn the city commits to half an hour of daily exercise, and the infrastructure that appears to support it is genuinely impressive: free classes in pop-up fitness villages, roads closed for cycling, and thousands of sessions run at no cost across every district.</p>
<h2>What actually happens</h2>
<p>Fitness villages open in Kite Beach, Dubai Design District and elsewhere, each with studios, courts and a full timetable of free classes. Dubai Ride closes Sheikh Zayed Road to traffic for a mass cycle, and Dubai Run does the same for a 5km and 10km road run — both are among the largest participation events in the region.</p>
<h2>Worth knowing</h2>
<p>Free to join; you register online and log your own activity. It coincides with the start of the pleasant season, which is not an accident.</p>`,
  }),

  event('gitex-global', 'GITEX Global', {
    summary: 'The Middle East’s largest technology exhibition, at Dubai World Trade Centre.',
    startDate: '2026-10-12T00:00:00Z', endDate: '2026-10-16T00:00:00Z',
    area: 'zabeel', tags: ['exhibitions'],
    body: `<p>GITEX has run since 1981 and is now among the largest technology trade shows anywhere, filling every hall at the Dubai World Trade Centre plus overflow venues. Around 6,000 exhibitors and well over 150,000 attendees pass through across the week.</p>
<h2>Who it’s for</h2>
<p>Primarily trade — enterprise IT, AI, cybersecurity, telecoms — with a large startup track (Expand North Star) running alongside at Dubai Harbour. Not a consumer show, though public tickets are available.</p>
<h2>Worth knowing</h2>
<p>Hotel prices across the city rise sharply during GITEX week; book well ahead or avoid it if you are visiting for other reasons. The Metro is far easier than driving to the venue.</p>`,
  }),

  event('dubai-design-week', 'Dubai Design Week', {
    summary: 'The region’s largest design festival — installations, talks and the Downtown Design fair.',
    startDate: '2026-11-09T00:00:00Z', endDate: '2026-11-15T00:00:00Z',
    area: 'city-walk', tags: ['art-design', 'exhibitions', 'free-to-visit'],
    body: `<p>Centred on Dubai Design District, Design Week fills the neighbourhood with commissioned installations, exhibitions and a substantial programme of talks and workshops. Much of it is free to walk around.</p>
<h2>The main strands</h2>
<p>Downtown Design is the commercial trade fair for high-end furniture and interiors. Abwab showcases emerging designers from across the Middle East, North Africa and South Asia. The Urban Commissions competition puts large-scale public pieces around the district.</p>
<h2>Worth knowing</h2>
<p>The public programme is the good part and costs nothing. Evenings are the time to go — the installations are lit and the district's restaurants stay open late.</p>`,
  }),

  event('dubai-rugby-sevens', 'Emirates Dubai Rugby Sevens', {
    summary: 'Three days of international sevens rugby and one of the region’s biggest social fixtures.',
    startDate: '2026-11-27T00:00:00Z', endDate: '2026-11-29T00:00:00Z',
    area: 'dubailand', tags: ['sports', 'festivals', 'nightlife'],
    body: `<p>Running since 1970, the Dubai Sevens is the opening leg of the World Rugby Sevens Series and by some distance the largest annual sporting event in the emirate. Alongside the international tournament runs an enormous amateur competition with hundreds of visiting club sides.</p>
<h2>What it’s like</h2>
<p>Half sport, half festival. The Sevens Stadium site holds multiple pitches, a concert stage, and a famously committed crowd in fancy dress. The rugby is genuinely high quality; a great many attendees never watch it.</p>
<h2>Worth knowing</h2>
<p>Three-day passes are better value than single days. Saturday is the busiest and the most raucous. Book transport in advance — it is a long way out and taxi queues at the end of the night are brutal.</p>`,
  }),

  event('sole-dxb', 'Sole DXB', {
    summary: 'A streetwear, sneaker and music festival at Dubai Design District.',
    startDate: '2026-12-04T00:00:00Z', endDate: '2026-12-06T00:00:00Z',
    area: 'city-walk', tags: ['festivals', 'shopping', 'live-music', 'art-design'],
    body: `<p>Sole DXB began as a small sneaker meet and has grown into the region's defining streetwear and street-culture festival — brand installations, limited releases, basketball, barbers, food and a strong hip-hop and R&B live programme.</p>
<h2>What to expect</h2>
<p>A young, design-literate crowd and a genuinely good line-up: past editions have brought Nas, Rick Ross and A$AP Ferg. The retail side features exclusive drops that queue from early morning.</p>
<h2>Worth knowing</h2>
<p>Held outdoors at Dubai Design District in December, so the weather is on your side. Tickets sell out; buy early. Go for the music as much as the shopping.</p>`,
  }),

  event('dubai-shopping-festival', 'Dubai Shopping Festival', {
    summary: 'The city’s flagship retail, entertainment and fireworks festival.',
    startDate: '2026-12-15T00:00:00Z', endDate: '2027-01-29T00:00:00Z',
    area: 'downtown-dubai', tags: ['festivals', 'shopping', 'family', 'free-to-visit'],
    ticketUrl: 'https://www.dubaifestivals.com/',
    body: `<p>Launched in 1996 to draw visitors in the cooler months, the Dubai Shopping Festival now runs for six weeks and is the anchor of the city's winter calendar. Discounts run across every mall and souk, alongside raffles, concerts, night markets and nightly fireworks.</p>
<h2>Beyond the discounts</h2>
<p>The festival programme is the better half: fireworks over the Creek, Global Village at full tilt, market pop-ups in Al Seef and JBR, and free open-air concerts. Prizes on the mall raffles run to cars and gold.</p>
<h2>Worth knowing</h2>
<p>Genuine markdowns are steepest in the final two weeks. It coincides with peak tourist season, so hotels are at their most expensive and the malls at their busiest — go on weekday mornings if you can.</p>`,
  }),

  event('new-years-eve-dubai', 'New Year’s Eve in Dubai', {
    summary: 'One of the world’s largest firework and light displays, centred on the Burj Khalifa.',
    startDate: '2026-12-31T00:00:00Z', endDate: '2027-01-01T00:00:00Z',
    area: 'downtown-dubai', tags: ['festivals', 'free-to-visit', 'nightlife', 'family'],
    body: `<p>Dubai treats New Year's Eve as a matter of civic reputation. The Burj Khalifa becomes the world's largest LED display, synchronised with fireworks and the fountain, and simultaneous displays run at Atlantis, Bluewaters, Global Village and along the Creek.</p>
<h2>Where to watch</h2>
<p>Downtown is the headline show but requires either a restaurant booking made months earlier or an early arrival in the ticketed public zones. Palm Jumeirah, JBR and Dubai Festival City all run substantial displays with a fraction of the crowd.</p>
<h2>Worth knowing</h2>
<p>Road closures around Downtown begin in the afternoon and the Metro runs through the night but is overwhelmed. Decide your viewing spot early and plan to stay there. Al Qudra and the desert are the contrarian choice — you see several displays at once from a distance.</p>`,
  }),

  event('dubai-marathon', 'Dubai Marathon', {
    summary: 'A flat, fast January road race — full marathon, 10km and a 4km fun run.',
    startDate: '2027-01-10T00:00:00Z', endDate: '2027-01-10T00:00:00Z',
    area: 'jumeirah', tags: ['sports', 'outdoors', 'family'],
    accolades: ['One of the fastest marathon courses in the world'],
    body: `<p>Run since 2000 along the coast, the Dubai Marathon is famously flat — almost entirely at sea level with no meaningful climb — which has made it one of the fastest courses in the world and a regular site of elite record attempts.</p>
<h2>The races</h2>
<p>A full marathon, a 10km road race and a 4km fun run all start early on the same morning from Umm Suqeim, running out along Jumeirah Beach Road and back.</p>
<h2>Worth knowing</h2>
<p>An early start — the elite race goes off before dawn — to beat both heat and traffic. January conditions are close to ideal: around 20°C at the gun. Entry is open to anyone; register online well in advance.</p>`,
  }),

  event('hero-dubai-desert-classic', 'Hero Dubai Desert Classic', {
    summary: 'A DP World Tour golf tournament at Emirates Golf Club’s Majlis course.',
    startDate: '2027-01-14T00:00:00Z', endDate: '2027-01-17T00:00:00Z',
    area: 'dubai-marina', tags: ['sports', 'luxury'],
    accolades: ['Rolex Series event on the DP World Tour'],
    body: `<p>Played on the Majlis course at Emirates Golf Club since 1989, the Desert Classic is the region's most established professional golf tournament and now a Rolex Series event, drawing a strong international field each January.</p>
<h2>The course</h2>
<p>The Majlis was the first grass course in the Middle East, and its closing stretch — a reachable par five with water — reliably produces a finish. The clubhouse's tented white peaks are a landmark in their own right.</p>
<h2>Worth knowing</h2>
<p>Grounds tickets are inexpensive and children often go free. Thursday and Friday let you walk with the groups; the weekend has the atmosphere. Practice days are the best value of all for photography.</p>`,
  }),

  event('quoz-arts-fest', 'Quoz Arts Fest', {
    summary: 'A free weekend arts festival across the Alserkal Avenue warehouse district.',
    startDate: '2027-01-23T00:00:00Z', endDate: '2027-01-24T00:00:00Z',
    area: 'al-quoz', tags: ['art-design', 'festivals', 'free-to-visit', 'live-music'],
    body: `<p>A two-day festival that opens up the whole Alserkal Avenue compound in Al Quoz — every gallery, plus street murals in progress, craft markets, workshops, film screenings, food trucks and live music across the warehouses and yards.</p>
<h2>Why it’s good</h2>
<p>It is free, it is genuinely local, and it is the one weekend a year when the city's art district is busy with people who do not normally go to galleries. The programme leans heavily on participation rather than spectating.</p>
<h2>Worth knowing</h2>
<p>Parking in Al Quoz is difficult during the festival — take a taxi. Late afternoon into the evening is the best window. No tickets required.</p>`,
  }),

  event('emirates-festival-of-literature', 'Emirates Airline Festival of Literature', {
    summary: 'The region’s largest literary festival — authors, translation and Arabic writing.',
    startDate: '2027-02-01T00:00:00Z', endDate: '2027-02-07T00:00:00Z',
    area: 'zabeel', tags: ['culture-heritage', 'exhibitions', 'festivals'],
    body: `<p>Founded in 2009, the Festival of Literature brings several hundred authors to Dubai each February for a week of talks, readings, workshops and school programmes across English, Arabic and a rotating third language.</p>
<h2>What’s distinctive</h2>
<p>The Arabic-language and translation strands are the real substance — this is one of the few major literary festivals where Gulf and wider Arab writing sits at the centre rather than the margins. There is a strong children's and young-adult programme.</p>
<h2>Worth knowing</h2>
<p>Sessions are individually ticketed and inexpensive. Popular authors sell out within days of the programme launch, so watch for the announcement in December.</p>`,
  }),

  event('dubai-jazz-festival', 'Emirates Airline Dubai Jazz Festival', {
    summary: 'Three nights of open-air music at Dubai Media City — jazz loosely defined.',
    startDate: '2027-02-11T00:00:00Z', endDate: '2027-02-13T00:00:00Z',
    area: 'dubai-marina', tags: ['live-music', 'festivals', 'nightlife'],
    body: `<p>Running since 2003, the Dubai Jazz Festival takes a generous view of its own name — the line-up reliably mixes actual jazz with soul, pop and rock headliners. Past editions have featured Sting, Santana, John Legend and Christina Aguilera.</p>
<h2>What it’s like</h2>
<p>An open-air amphitheatre at Dubai Media City, three consecutive nights, one main stage. February evenings are ideal for it — warm, dry and cool enough to stand for hours.</p>
<h2>Worth knowing</h2>
<p>Single-night and three-night passes both sell. Golden Circle standing is close to the stage; the terraced lawn behind is more comfortable and the sound is fine. Gates open around 18:00 with support acts first.</p>`,
  }),

  event('dubai-tennis-championships', 'Dubai Duty Free Tennis Championships', {
    summary: 'A combined ATP and WTA tournament fortnight at the Aviation Club.',
    startDate: '2027-02-15T00:00:00Z', endDate: '2027-02-27T00:00:00Z',
    area: 'deira', tags: ['sports', 'luxury'],
    accolades: ['ATP 500 and WTA 1000 combined event'],
    body: `<p>Two consecutive weeks of professional tennis at the Aviation Club in Garhoud — a WTA week followed by an ATP week — with a 5,000-seat centre court and a field that has historically included most of the top ten.</p>
<h2>What it’s like</h2>
<p>Small by Grand Slam standards, which is the appeal: outside courts put you within a few metres of top players during practice and early rounds, and the whole site is walkable in minutes.</p>
<h2>Worth knowing</h2>
<p>Early-round tickets are cheap and by far the best value — you see many more matches. Finals sell out months ahead. Sessions run afternoon and evening; evening is cooler and better attended.</p>`,
  }),

  event('dubai-international-boat-show', 'Dubai International Boat Show', {
    summary: 'A large in-water marine exhibition at Dubai Harbour.',
    startDate: '2027-02-24T00:00:00Z', endDate: '2027-02-28T00:00:00Z',
    area: 'dubai-marina', tags: ['exhibitions', 'luxury'],
    body: `<p>Running since 1992, the Boat Show is the region's principal marine exhibition — several hundred exhibitors and a large in-water display of yachts moored at Dubai Harbour, alongside watersports, marine technology and a diving section.</p>
<h2>Worth knowing</h2>
<p>Public tickets are available and the in-water marina display is the part worth seeing — boarding is generally possible on many of the smaller craft. Late afternoon is cooler and the harbour looks better in low light.</p>`,
  }),

  event('ramadan-in-dubai', 'Ramadan in Dubai', {
    summary: 'The holy month — iftar tents, night markets and a different rhythm to the city.',
    startDate: '2027-02-08T00:00:00Z', endDate: '2027-03-09T00:00:00Z',
    area: 'old-dubai', tags: ['culture-heritage', 'street-food', 'family'],
    body: `<p>Ramadan reshapes the city for a month. Fasting runs from dawn to sunset, working hours shorten, and the day's centre of gravity moves to the evening — iftar at sunset, then suhoor gatherings that run past midnight.</p>
<h2>For visitors</h2>
<p>It is a genuinely interesting time to be here. Iftar is a social occasion and hotels, restaurants and community tents lay on large communal meals that anyone can join. Night markets and Ramadan majlis tents run late, and the old districts are at their most animated after dark.</p>
<h2>Etiquette</h2>
<p>Do not eat, drink or smoke in public during daylight — this is a legal requirement, not merely a courtesy. Dress more conservatively than usual. Many attractions shift their hours; check before travelling. Live music is generally paused.</p>`,
  }),

  event('dubai-food-festival', 'Dubai Food Festival', {
    summary: 'A city-wide celebration of Dubai’s diverse culinary scene.',
    startDate: '2027-02-20T00:00:00Z', endDate: '2027-03-08T00:00:00Z',
    area: 'business-bay', tags: ['festivals', 'street-food', 'fine-dining', 'family'],
    body: `<p>Two and a half weeks of food events across the city, built around the premise that Dubai's most interesting characteristic is the number of cuisines cooked here by the people who grew up eating them.</p>
<h2>The strands</h2>
<p>Restaurant Week offers fixed-price tasting menus at high-end venues. Hidden Gems highlights small neighbourhood kitchens that rarely see visitors. Beach Canteen sets up a temporary food village on the sand, and Etisalat Beach Canteen and street-food markets run through the period.</p>
<h2>Worth knowing</h2>
<p>Hidden Gems is the part worth planning around — it is how you find the Kerala canteens and Afghan bakeries that outlast the festival. Restaurant Week bookings open a couple of weeks ahead and the best tables go quickly.</p>`,
  }),

  event('eid-al-fitr-dubai', 'Eid Al Fitr Celebrations', {
    summary: 'The festival marking the end of Ramadan — fireworks, concerts and family gatherings.',
    startDate: '2027-03-09T00:00:00Z', endDate: '2027-03-12T00:00:00Z',
    area: 'downtown-dubai', tags: ['festivals', 'culture-heritage', 'family', 'free-to-visit'],
    body: `<p>Eid Al Fitr marks the end of the fasting month and is the biggest family celebration of the year. The city switches abruptly from a month of restraint to several days of fireworks, concerts, mall promotions and packed restaurants.</p>
<h2>What happens</h2>
<p>Fireworks at multiple locations across the city on the first evening, free concerts, and unusually elaborate programming at the malls and beach destinations. Attractions extend their hours.</p>
<h2>Worth knowing</h2>
<p>The exact dates depend on the sighting of the moon and are confirmed only a day or two ahead — plan flexibly. Everything is extremely busy: restaurants need booking, and beaches and parks fill from mid-afternoon.</p>`,
  }),

  event('dubai-world-cup', 'Dubai World Cup', {
    summary: 'The world’s richest horse-racing day at Meydan Racecourse.',
    startDate: '2027-03-27T00:00:00Z', endDate: '2027-03-27T00:00:00Z',
    area: 'dubailand', tags: ['sports', 'luxury', 'festivals'],
    accolades: ['One of the richest horse races in the world'],
    body: `<p>Held at Meydan on the last Saturday in March, the Dubai World Cup carries one of the largest purses in world racing and closes a card of nine races with total prize money in the tens of millions of dollars.</p>
<h2>The day</h2>
<p>It is as much a social event as a sporting one — a full afternoon and evening card, a strict and enthusiastically observed dress code, a hat competition, and a concert after the final race. The grandstand holds 60,000.</p>
<h2>Worth knowing</h2>
<p>General admission is inexpensive and includes access to the apron by the rail; hospitality packages run to the very expensive. Betting is not permitted — the prizes are for the horses. Gates open early afternoon; the feature race runs after dark under lights.</p>`,
  }),

  event('art-dubai', 'Art Dubai', {
    summary: 'The region’s leading contemporary art fair, at Madinat Jumeirah.',
    startDate: '2027-04-14T00:00:00Z', endDate: '2027-04-18T00:00:00Z',
    area: 'jumeirah', tags: ['art-design', 'exhibitions', 'luxury'],
    body: `<p>Founded in 2007, Art Dubai is the principal contemporary art fair for the Middle East, South Asia and Africa, bringing around 120 galleries to Madinat Jumeirah each spring across contemporary, modern and digital sections.</p>
<h2>Why it matters</h2>
<p>Its distinctiveness is geographic: the gallery list reaches into regions that the European and American fairs largely ignore, and the modern section deals in twentieth-century Arab, Iranian and South Asian masters who are hard to see elsewhere.</p>
<h2>Worth knowing</h2>
<p>Public days follow the VIP preview. The talks programme (Global Art Forum) is free with entry and consistently good. It coincides with Alserkal Avenue's strongest gallery season, so combine the two.</p>`,
  }),

  event('dubai-summer-surprises', 'Dubai Summer Surprises', {
    summary: 'A summer retail and entertainment festival built around indoor attractions.',
    startDate: '2027-06-28T00:00:00Z', endDate: '2027-08-29T00:00:00Z',
    area: 'downtown-dubai', tags: ['festivals', 'shopping', 'family'],
    body: `<p>Dubai Summer Surprises is the hot-season counterpart to the Shopping Festival: nine weeks of sales, entertainment and family programming timed for the months when nobody wants to be outdoors.</p>
<h2>What’s on</h2>
<p>Deep mall discounts, raffles, indoor concerts and character shows, plus the Modhesh Fun City indoor amusement park. Hotels and attractions cut prices sharply, which is the real reason to consider a summer trip.</p>
<h2>Worth knowing</h2>
<p>July and August temperatures pass 45°C with high humidity, so plan an entirely indoor itinerary. The trade-off is genuine: hotel rates are less than half their winter level, and the attractions are empty.</p>`,
  }),
];
