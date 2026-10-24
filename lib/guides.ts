/**
 * Destination guides: long-form pages that target the searches travellers make
 * before they pick a hotel ("things to do in Alleppey", "Nehru Trophy Boat Race
 * stay"). Content lives here so the page, sitemap and structured data share one
 * source.
 *
 * Keep claims general and checkable. Event dates and distances change, so the
 * copy tells readers to confirm them instead of stating a fixed figure.
 */

export type GuideSection = { heading: string; paragraphs: string[] };

export type Guide = {
    slug: string;
    /** Page title, without the brand (the layout template adds it). */
    title: string;
    /** On-page H1. */
    h1: string;
    /** Snippet text, already under ~158 characters. */
    description: string;
    intro: string;
    sections: GuideSection[];
    faqs: { question: string; answer: string }[];
    /** ISO date, used in Article schema and the sitemap. */
    updated: string;
    /** Where the closing call-to-action points. */
    cta: { label: string; href: string };
};

export const GUIDES: Guide[] = [
    {
        slug: "nehru-trophy-boat-race-stay",
        title: "Where to Stay for the Nehru Trophy Boat Race, Alleppey",
        h1: "Where to Stay for the Nehru Trophy Boat Race",
        description:
            "Stay beside the Nehru Trophy Boat Race finishing point in Alappuzha. Lake-view rooms at Olivia Alleppey, Punnamada, with tips on booking and getting there.",
        intro:
            "The Nehru Trophy Boat Race is the biggest day in Alappuzha's calendar: snake boats with over a hundred rowers racing down Punnamada Lake while thousands watch from the banks. Olivia Alleppey stands at Finishing Point, Punnamada, the stretch of shore where the race ends.",
        sections: [
            {
                heading: "About the race",
                paragraphs: [
                    "The Nehru Trophy Boat Race is a snake-boat (chundan vallam) regatta held on Punnamada Lake in Alappuzha, usually in August. Village crews train for months, and the heats build to a final at the finishing point.",
                    "The date is set each year by the organisers and can move with the monsoon and the state calendar, so confirm it with the Nehru Trophy Boat Race Society or Kerala Tourism before you book travel.",
                ],
            },
            {
                heading: "Why the location matters",
                paragraphs: [
                    "Race day closes roads and fills the town. Staying at Finishing Point, Punnamada, means you are already at the lakeshore instead of crossing a crowded town to reach it.",
                    "Our lake-view rooms and suites look over the Punnamada backwaters. Ask the reservations team which rooms have the best view of the water on your dates.",
                ],
            },
            {
                heading: "Booking tips",
                paragraphs: [
                    "Rooms near the race sell out first, so book as soon as the date is announced and keep your plans flexible until it is confirmed.",
                    "Arrive the day before. Traffic into Alappuzha on race day is slow, and a night in place saves you the queue.",
                    "Expect a heat: it is monsoon season, so carry rain cover, and plan indoor time at the spa or the restaurants between heats.",
                ],
            },
        ],
        faqs: [
            {
                question: "When is the Nehru Trophy Boat Race?",
                answer:
                    "It is usually held in August on Punnamada Lake, Alappuzha. The exact date is announced each year, so check with the organisers or Kerala Tourism before booking.",
            },
            {
                question: "Where is Olivia Alleppey in relation to the race?",
                answer:
                    "Olivia Alleppey is at Finishing Point, Punnamada, Alappuzha, on the lakeshore where the Nehru Trophy Boat Race finishes.",
            },
            {
                question: "How early should I book a room for race weekend?",
                answer:
                    "As early as you can once the date is confirmed. Rooms near Punnamada are in highest demand around the race.",
            },
        ],
        updated: "2026-10-24",
        cta: { label: "View lake-view rooms", href: "/rooms" },
    },
    {
        slug: "things-to-do-in-alleppey",
        title: "Things to Do in Alleppey (Alappuzha): A Local Guide",
        h1: "Things to Do in Alleppey",
        description:
            "The best things to do in Alleppey: backwater cruises, Alappuzha and Marari beaches, Kuttanad, Pathiramanal and more, from a hotel on Punnamada Lake.",
        intro:
            "Alleppey, officially Alappuzha, is built on water: canals, lagoons and the wide Vembanad Lake. Most visitors come for the backwaters, but there is enough here to fill three or four days.",
        sections: [
            {
                heading: "Cruise the backwaters",
                paragraphs: [
                    "A backwater cruise is the reason most people come. Options range from a few hours in a small canoe through village canals to a full day or overnight on a houseboat on Vembanad Lake.",
                    "Smaller boats reach narrow canals that houseboats cannot, so they are better for seeing village life up close.",
                ],
            },
            {
                heading: "Beaches and the old town",
                paragraphs: [
                    "Alappuzha Beach has a pier and a lighthouse and is best near sunset. Marari Beach, a short drive north, is quieter and suits a long walk.",
                    "The town centre has canals, markets and old warehouses, and is worth a few hours on foot.",
                ],
            },
            {
                heading: "Kuttanad and Pathiramanal",
                paragraphs: [
                    "Kuttanad, the rice-growing region around Alappuzha, farms below sea level, one of the few places in India where this is done. The paddy fields and bunds make good cycling and photography.",
                    "Pathiramanal is a small island on Vembanad Lake reached by boat, known for its birdlife. Boat services depend on season and weather, so confirm before you go.",
                ],
            },
            {
                heading: "Eat and unwind",
                paragraphs: [
                    "Try Kerala fish curry, karimeen (pearl spot) and appam with stew. Karimeen pollichathu, fish baked in banana leaf, is the local favourite.",
                    "After a day out, a spa treatment is a good way to reset. Olivia Alleppey has a spa, a pool overlooking the backwaters and several restaurants.",
                ],
            },
        ],
        faqs: [
            {
                question: "How many days do you need in Alleppey?",
                answer:
                    "Two nights covers a backwater cruise and the main sights. Three or four nights lets you add Kuttanad, the beaches and a slower pace.",
            },
            {
                question: "What is the best way to see the Alleppey backwaters?",
                answer:
                    "A houseboat for a full day or overnight, or a small canoe for narrow village canals. Many visitors do one of each.",
            },
            {
                question: "Is Alleppey worth visiting?",
                answer:
                    "Yes. It is one of Kerala's most popular destinations for the backwaters, and works well as a base for two to four days.",
            },
        ],
        updated: "2026-10-24",
        cta: { label: "Plan your stay", href: "/rooms" },
    },
    {
        slug: "best-time-to-visit-alleppey",
        title: "Best Time to Visit Alleppey: Season-by-Season Guide",
        h1: "Best Time to Visit Alleppey",
        description:
            "When to visit Alleppey (Alappuzha): November to February for cool weather, the monsoon for lower rates, and August for the Nehru Trophy Boat Race.",
        intro:
            "Alleppey has a tropical climate: warm all year, with a wet monsoon. The right month depends on whether you want comfortable weather, lower prices or a festival.",
        sections: [
            {
                heading: "November to February: the peak season",
                paragraphs: [
                    "These are the coolest, driest months and the most comfortable for cruises and sightseeing. They are also the busiest and most expensive, so book ahead, especially around Christmas and New Year.",
                ],
            },
            {
                heading: "March to May: hot and quiet",
                paragraphs: [
                    "Temperatures and humidity rise. Rates are lower and the backwaters are quiet. Plan outdoor time for early morning and evening, and use the pool in the afternoon.",
                ],
            },
            {
                heading: "June to September: the monsoon",
                paragraphs: [
                    "Heavy rain turns the landscape green and fills the backwaters. Rates drop, and the region suits travellers happy with wet weather and slower days. Ayurvedic treatments are traditionally associated with this season.",
                    "The Nehru Trophy Boat Race is usually held in August and draws large crowds, so book early if you plan to attend.",
                ],
            },
            {
                heading: "October: the shoulder month",
                paragraphs: [
                    "The north-east monsoon brings some rain, but the crowds have not yet arrived and the countryside is lush. A good value time to visit.",
                ],
            },
        ],
        faqs: [
            {
                question: "What is the best month to visit Alleppey?",
                answer:
                    "November to February has the most comfortable weather and is the peak season. If you prefer lower prices and green scenery, the monsoon months are a good alternative.",
            },
            {
                question: "Can you take a houseboat in the monsoon?",
                answer:
                    "Services run, but heavy rain or high water can change plans, so confirm with the operator on the day.",
            },
            {
                question: "When is the Nehru Trophy Boat Race?",
                answer:
                    "Usually in August. The date is announced each year, so check before you book.",
            },
        ],
        updated: "2026-10-24",
        cta: { label: "Check availability", href: "/rooms" },
    },
    {
        slug: "alleppey-houseboat-vs-resort",
        title: "Houseboat or Backwater Resort in Alleppey?",
        h1: "Alleppey Houseboat vs Backwater Resort",
        description:
            "Houseboat or resort in Alleppey? Compare comfort, cost, privacy and flexibility, and see how to combine a lakeside hotel stay with a backwater cruise.",
        intro:
            "The first question for most Alleppey trips is where to sleep. A houseboat is the classic choice, but a lakeside resort or hotel has its own advantages. Many travellers do both.",
        sections: [
            {
                heading: "The houseboat",
                paragraphs: [
                    "You drift through the backwaters with meals cooked on board. It is memorable and quiet, but space is limited, air-conditioning and power depend on the boat, and routes are restricted to certain waters.",
                    "Cruise hours and overnight rules vary by operator and season, so ask what is included.",
                ],
            },
            {
                heading: "The resort or hotel",
                paragraphs: [
                    "A hotel gives you more space, reliable air-conditioning, a pool, a spa and several restaurants, and is easier for families, long stays and travellers who want flexibility.",
                    "You can still go out on the water: day cruises leave from the lakeshore, and you return to a proper room at night.",
                ],
            },
            {
                heading: "The best of both",
                paragraphs: [
                    "A common plan is one night on a houseboat and the rest at a hotel. Olivia Alleppey is on the Punnamada lakeshore, where houseboats and shikara boats operate, so a cruise is easy to add to a stay.",
                    "Our team can help arrange a cruise. Contact reservations when you book.",
                ],
            },
        ],
        faqs: [
            {
                question: "Is a houseboat better than a hotel in Alleppey?",
                answer:
                    "It depends on what you want. A houseboat is the iconic experience; a hotel offers more space, facilities and flexibility. Many guests combine a night on a houseboat with the rest of the stay at a hotel.",
            },
            {
                question: "Can I arrange a backwater cruise from Olivia Alleppey?",
                answer:
                    "Yes. Contact our reservations team when booking and we can help arrange a cruise.",
            },
        ],
        updated: "2026-10-24",
        cta: { label: "See rooms and suites", href: "/rooms" },
    },
    {
        slug: "new-years-eve-in-alleppey",
        title: "New Year's Eve in Alleppey: The Grand Masquerade, 31 December",
        h1: "New Year's Eve in Alleppey",
        description:
            "Celebrate New Year's Eve in Alleppey at the Grand Masquerade, Olivia Alleppey, 31 December. Gala evening, room packages and how to book.",
        intro:
            "Alleppey is at its best at the turn of the year: cool, dry weather and the backwaters at their calmest. On 31 December, Olivia Alleppey hosts the Grand Masquerade, a gala New Year's Eve on the Punnamada lakeshore.",
        sections: [
            {
                heading: "The Grand Masquerade, 31 December",
                paragraphs: [
                    "The Grand Masquerade is a themed New Year's Eve gala at Olivia Alleppey, Finishing Point, Punnamada. Guests are invited to come masked and dressed for the evening.",
                    "Visiting guests who are not staying can book a gala pass for the evening. Staying guests book a room package that includes the gala.",
                ],
            },
            {
                heading: "Staying for the night",
                paragraphs: [
                    "The room package covers one room for the night of 31 December, with the room price included. The package starts at \u20b949,999 plus 18% GST per room, and add-ons are available for additional guests and children.",
                    "Rooms are limited and are sold online. Book directly on this site to see what is still available for your party.",
                ],
            },
            {
                heading: "Planning your trip",
                paragraphs: [
                    "New Year week is peak season in Kerala. Book your room early, and allow extra travel time on the roads into Alappuzha on the 31st.",
                    "If you are staying more nights, the days around the 31st are good for a backwater cruise or a spa treatment.",
                ],
            },
        ],
        faqs: [
            {
                question: "Where can I celebrate New Year's Eve in Alleppey?",
                answer:
                    "Olivia Alleppey hosts the Grand Masquerade gala on 31 December at Finishing Point, Punnamada, Alappuzha.",
            },
            {
                question: "How do I book the Grand Masquerade?",
                answer:
                    "Book online on oliviaalleppey.com. Staying guests choose a room package; visiting guests can book a gala pass.",
            },
            {
                question: "What does the room package cost?",
                answer:
                    "The package starts at \u20b949,999 plus 18% GST per room for the night of 31 December, room price included.",
            },
        ],
        updated: "2026-10-24",
        cta: { label: "Book the 31st Night", href: "/" },
    },
    {
        slug: "kochi-airport-to-alleppey",
        title: "Kochi Airport to Alleppey: How to Get There",
        h1: "Getting from Kochi Airport to Alleppey",
        description:
            "How to travel from Cochin International Airport to Alleppey (Alappuzha): taxi, train and bus options, journey time and tips for reaching Punnamada.",
        intro:
            "Cochin International Airport (COK) is the nearest major airport to Alleppey, roughly 80 to 90 km away. Most guests arrive by road or rail.",
        sections: [
            {
                heading: "By taxi",
                paragraphs: [
                    "A pre-booked taxi is the simplest option and takes about two to two and a half hours depending on traffic. Our reservations team can help arrange a pick-up if you tell us your flight details.",
                ],
            },
            {
                heading: "By train",
                paragraphs: [
                    "Alappuzha has its own railway station, on the line between Ernakulam and Thiruvananthapuram. From Kochi, take a train to Alappuzha, then a short taxi or auto-rickshaw ride to Punnamada.",
                    "Check schedules on the Indian Railways site before you travel, as timings change.",
                ],
            },
            {
                heading: "By bus",
                paragraphs: [
                    "State and private buses run between Ernakulam and Alappuzha. They are cheap but slower and less comfortable with luggage.",
                ],
            },
        ],
        faqs: [
            {
                question: "How far is Alleppey from Kochi airport?",
                answer: "Roughly 80 to 90 km by road, about two to two and a half hours by car.",
            },
            {
                question: "Does Olivia Alleppey arrange airport transfers?",
                answer:
                    "Contact our reservations team with your flight details and we can help arrange a transfer.",
            },
        ],
        updated: "2026-10-24",
        cta: { label: "Plan your stay", href: "/contact" },
    },
    {
        slug: "alleppey-honeymoon-guide",
        title: "Alleppey for Honeymooners: Where to Stay and What to Do",
        h1: "A Honeymoon in Alleppey",
        description:
            "Plan an Alleppey honeymoon: lake-view suites, a private backwater cruise, spa couples treatments and candlelit dining on the Punnamada lakeshore.",
        intro:
            "Quiet water, long evenings and very little to organise: the Alleppey backwaters suit a honeymoon well, especially as one stop on a longer Kerala trip.",
        sections: [
            {
                heading: "Where to stay",
                paragraphs: [
                    "Choose a room with a view of the water. Our lake-view rooms and suites at Punnamada look over the backwaters, and the suites give you extra space and a private balcony.",
                    "Tell reservations it is a honeymoon when you book, and we can note it for your stay.",
                ],
            },
            {
                heading: "What to do",
                paragraphs: [
                    "Spend a morning on a small boat through village canals, and an evening watching the light on Vembanad Lake.",
                    "A spa treatment for two is a good way to slow down after a few days of travel.",
                ],
            },
            {
                heading: "How long to stay",
                paragraphs: [
                    "Two or three nights is enough for the cruise, the spa and time to do nothing. Pair it with Munnar or Thekkady for a fuller Kerala itinerary.",
                ],
            },
        ],
        faqs: [
            {
                question: "How many nights should we spend in Alleppey on a honeymoon?",
                answer: "Two or three nights is ideal, combined with hill stations such as Munnar.",
            },
            {
                question: "Which rooms suit couples best?",
                answer:
                    "Rooms and suites with a lake view. See the rooms page for balcony and suite options.",
            },
        ],
        updated: "2026-10-24",
        cta: { label: "See suites", href: "/rooms" },
    },
    {
        slug: "alleppey-family-stay",
        title: "Alleppey with Family and Kids: A Stay Guide",
        h1: "Alleppey with Family and Kids",
        description:
            "Visiting Alleppey with children? Family rooms, pool time, gentle backwater cruises and kid-friendly dining at Olivia Alleppey, Punnamada.",
        intro:
            "Alleppey works well for families: short boat rides, open space and a relaxed pace. A hotel base with a pool and family rooms keeps the days easy.",
        sections: [
            {
                heading: "Room and space",
                paragraphs: [
                    "Our Canal View Superior Family room is designed for families. Check the rooms page for sizes and how many guests each room sleeps.",
                ],
            },
            {
                heading: "Things children enjoy",
                paragraphs: [
                    "A short canoe or boat ride through the canals, time in the pool and a walk on Alappuzha Beach at sunset are usually the highlights.",
                    "Houseboat cruises can be long for small children, so a half-day cruise is a good starting point.",
                ],
            },
            {
                heading: "Practical tips",
                paragraphs: [
                    "Carry sun protection and insect repellent, especially in the evening near water.",
                    "Ask reservations about extra beds and children's meals when you book.",
                ],
            },
        ],
        faqs: [
            {
                question: "Is Alleppey suitable for young children?",
                answer:
                    "Yes, with shorter boat trips and a hotel base with a pool. Keep days light and avoid midday heat.",
            },
            {
                question: "Does Olivia Alleppey have family rooms?",
                answer: "Yes. See the Canal View Superior Family room on the rooms page.",
            },
        ],
        updated: "2026-10-24",
        cta: { label: "View family rooms", href: "/rooms" },
    },
];

export function getGuide(slug: string): Guide | undefined {
    return GUIDES.find((guide) => guide.slug === slug);
}
