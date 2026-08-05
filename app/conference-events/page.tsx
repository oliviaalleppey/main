import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { venues } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import ConferenceEventsClient from './conference-events-client';
import JsonLd from '@/components/seo/json-ld';
import { breadcrumbSchema } from '@/lib/structured-data';
import { pageMetadata } from '@/lib/seo';

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
    title: 'Conference & Events Venues in Alappuzha',
    description:
        'Host conferences, corporate events and celebrations at Olivia Alleppey. A 5,035 sq ft Grand Ballroom seating up to 550, divisible meeting rooms, a board room and a poolside venue in Alappuzha, Kerala.',
    path: '/conference-events',
});

/**
 * Server wrapper: resolves which venues have a live detail page so the hub can
 * link to them, then renders the interactive hub.
 */
export default async function ConferenceEventsPage() {
    let venueSlugs: string[] = [];

    try {
        const rows = await db
            .select({ slug: venues.slug })
            .from(venues)
            .where(eq(venues.isActive, true));
        venueSlugs = rows.map((row) => row.slug);
    } catch (error) {
        // The hub is fully self-contained; without slugs it simply renders
        // without deep links rather than failing the page.
        console.error('[conference-events] failed to load venue slugs:', error);
    }

    return (
        <>
            <JsonLd
                data={breadcrumbSchema([
                    { name: 'Conference & Events', path: '/conference-events' },
                ])}
            />
            <ConferenceEventsClient venueSlugs={venueSlugs} />
        </>
    );
}
