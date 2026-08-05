/**
 * JSON-LD builders for schema.org structured data.
 *
 * Each function returns a plain object that is rendered by <JsonLd> into a
 * <script type="application/ld+json"> tag.
 */

import { ADDRESS, BRAND, CONTACT, LEGAL_NAME, SITE_URL, absoluteUrl } from "./seo";

/** Stable @id for the hotel node, so other nodes can reference it. */
export const HOTEL_ID = `${SITE_URL}/#hotel`;

const postalAddress = {
    "@type": "PostalAddress",
    streetAddress: ADDRESS.street,
    addressLocality: ADDRESS.locality,
    addressRegion: ADDRESS.region,
    postalCode: ADDRESS.postalCode,
    addressCountry: ADDRESS.country,
};

/**
 * The primary Hotel node. Rendered once, in the root layout, so every page
 * carries the business identity.
 */
export function hotelSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "Hotel",
        "@id": HOTEL_ID,
        name: BRAND,
        legalName: LEGAL_NAME,
        url: SITE_URL,
        description:
            "A luxury 5-star hotel at Finishing Point, Alappuzha, overlooking the Kerala backwaters. 88 rooms and suites, multiple dining venues, spa, banquet and conference facilities.",
        image: `${SITE_URL}/opengraph-image`,
        logo: `${SITE_URL}/images/olivia-logo.svg`,
        telephone: CONTACT.phone,
        email: CONTACT.reservationsEmail,
        address: postalAddress,
        starRating: { "@type": "Rating", ratingValue: "5" },
        priceRange: "₹₹₹",
        currenciesAccepted: "INR",
        checkinTime: "14:00",
        checkoutTime: "12:00",
        numberOfRooms: 88,
        petsAllowed: false,
        amenityFeature: [
            "Free Wi-Fi",
            "Outdoor Swimming Pool",
            "Spa & Wellness Centre",
            "Fitness Centre",
            "Multi-cuisine Restaurant",
            "24-hour In-Room Dining",
            "Banquet & Conference Facilities",
            "Airport Transfer",
            "Free Parking",
            "Backwater Views",
        ].map((name) => ({
            "@type": "LocationFeatureSpecification",
            name,
            value: true,
        })),
        contactPoint: [
            {
                "@type": "ContactPoint",
                telephone: CONTACT.phone,
                contactType: "reservations",
                email: CONTACT.reservationsEmail,
                areaServed: "IN",
                availableLanguage: ["en", "ml", "hi"],
            },
            {
                "@type": "ContactPoint",
                telephone: CONTACT.dubaiBooking[0],
                contactType: "reservations",
                areaServed: "AE",
                availableLanguage: ["en", "ar"],
            },
        ],
    };
}

/** Sitewide WebSite node enabling the search box rich result. */
export function websiteSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: BRAND,
        publisher: { "@id": HOTEL_ID },
    };
}

type RoomInput = {
    name: string;
    slug: string;
    description?: string | null;
    image?: string | null;
    /** Base nightly rate in INR, if known. */
    price?: number | null;
    maxOccupancy?: number | null;
    sizeSqft?: number | null;
};

/** HotelRoom node for an individual room-type page. */
export function hotelRoomSchema(room: RoomInput) {
    const url = absoluteUrl(`/rooms/${room.slug}`);

    return {
        "@context": "https://schema.org",
        "@type": "HotelRoom",
        name: room.name,
        url,
        ...(room.description ? { description: room.description } : {}),
        ...(room.image ? { image: room.image } : {}),
        containedInPlace: { "@id": HOTEL_ID },
        ...(room.maxOccupancy
            ? {
                  occupancy: {
                      "@type": "QuantitativeValue",
                      maxValue: room.maxOccupancy,
                      unitText: "person",
                  },
              }
            : {}),
        ...(room.sizeSqft
            ? {
                  floorSize: {
                      "@type": "QuantitativeValue",
                      value: room.sizeSqft,
                      unitCode: "FTK",
                  },
              }
            : {}),
        ...(room.price
            ? {
                  offers: {
                      "@type": "Offer",
                      price: room.price,
                      priceCurrency: "INR",
                      availability: "https://schema.org/InStock",
                      url,
                  },
              }
            : {}),
    };
}

type RestaurantInput = {
    name: string;
    slug: string;
    description?: string | null;
    image?: string | null;
    cuisine?: string | null;
    /** Human-readable hours, e.g. "07:00 HRS to 23:00 HRS". */
    hours?: string | null;
};

/** Restaurant node for a dining outlet page. */
export function restaurantSchema(outlet: RestaurantInput) {
    return {
        "@context": "https://schema.org",
        "@type": "Restaurant",
        name: outlet.name,
        url: absoluteUrl(`/dining/${outlet.slug}`),
        ...(outlet.description ? { description: outlet.description } : {}),
        ...(outlet.image ? { image: outlet.image } : {}),
        ...(outlet.cuisine ? { servesCuisine: outlet.cuisine } : {}),
        ...(outlet.hours ? { openingHours: outlet.hours } : {}),
        address: postalAddress,
        telephone: CONTACT.phone,
        priceRange: "₹₹₹",
        containedInPlace: { "@id": HOTEL_ID },
    };
}

type VenueInput = {
    name: string;
    slug: string;
    description?: string | null;
    image?: string | null;
    /** Largest seated capacity, typically the theatre-style figure. */
    maxCapacity?: number | null;
    areaSqft?: number | null;
};

/** EventVenue node for a banquet / conference space. */
export function venueSchema(venue: VenueInput) {
    return {
        "@context": "https://schema.org",
        "@type": "EventVenue",
        name: venue.name,
        url: absoluteUrl(`/conference-events/${venue.slug}`),
        ...(venue.description ? { description: venue.description } : {}),
        ...(venue.image ? { image: venue.image } : {}),
        address: postalAddress,
        telephone: CONTACT.phone,
        containedInPlace: { "@id": HOTEL_ID },
        ...(venue.maxCapacity ? { maximumAttendeeCapacity: venue.maxCapacity } : {}),
        ...(venue.areaSqft
            ? {
                  floorSize: {
                      "@type": "QuantitativeValue",
                      value: venue.areaSqft,
                      unitCode: "FTK",
                  },
              }
            : {}),
    };
}

/**
 * FAQPage node. Only use it where the questions and answers are genuinely
 * visible on the page — Google penalises schema that describes hidden content.
 */
export function faqSchema(faqs: { question: string; answer: string }[]) {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
    };
}

/** BreadcrumbList for nested pages. Pass crumbs in order, excluding "Home". */
export function breadcrumbSchema(crumbs: { name: string; path: string }[]) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [{ name: "Home", path: "/" }, ...crumbs].map(
            (crumb, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: crumb.name,
                item: absoluteUrl(crumb.path),
            })
        ),
    };
}
