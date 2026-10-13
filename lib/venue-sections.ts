/**
 * Divisible venues and their sections.
 *
 * The Grand Ballroom can be split into Grand Ballroom 1, 2 and 3, and each
 * section has its own venue row and page. There is no parent column; a section
 * is recognised by its slug: the parent's slug plus "-<number>", where the
 * parent is marked divisible.
 *
 * Section pages stay reachable for guests but are kept out of search results,
 * so they do not compete with the main ballroom page for the same searches.
 */

type VenueRef = { slug: string; isDivisible: boolean | null };

/** The divisible venue this one is a section of, or undefined if it stands alone. */
export function findParentVenue<T extends VenueRef>(slug: string, venues: T[]): T | undefined {
    const match = /^(.+)-\d+$/.exec(slug);
    if (!match) return undefined;
    return venues.find((venue) => venue.slug === match[1] && venue.isDivisible === true);
}

const VENUE_TYPE_LABELS: Record<string, string> = {
    ballroom: "Banquet Hall",
    meeting_room: "Meeting Room",
    outdoor: "Outdoor Event Venue",
    boardroom: "Boardroom",
    conference_hall: "Conference Hall",
};

/** Plain-words label for a venue type, used in page titles. */
export function venueTypeLabel(venueType: string | null | undefined): string {
    return (venueType && VENUE_TYPE_LABELS[venueType]) || "Event Venue";
}
