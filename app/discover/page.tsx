import { pageMetadata } from '@/lib/seo';
import { getPageHeaders, getDiscoverExperienceImages } from '@/app/admin/media/actions';
import { db } from '@/lib/db';
import { roomTypes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import DiscoverClient from './DiscoverClient';

export const metadata = pageMetadata({
    title: 'Discover Alappuzha & Our Story',
    description:
        'Discover Olivia Alleppey and the Kerala backwaters around it — our story, the property, and the houseboat cruises, beaches and heritage experiences that surround Finishing Point, Alappuzha.',
    path: '/discover',
});

export default async function DiscoverPage() {
    const [pageHeaders, rooms, experienceImages] = await Promise.all([
        getPageHeaders(),
        db.query.roomTypes.findMany({
            where: eq(roomTypes.status, 'active'),
            columns: {
                name: true,
                slug: true,
                shortDescription: true,
                images: true,
            },
            orderBy: (table, { asc }) => [asc(table.sortOrder)],
        }),
        getDiscoverExperienceImages(),
    ]);
    const discoverHeader = pageHeaders.discover;

    return <DiscoverClient headerImage={discoverHeader?.url} rooms={rooms} experienceImages={experienceImages} />;
}