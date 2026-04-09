import { getPageHeaders } from '@/app/admin/media/actions';
import { db } from '@/lib/db';
import { roomTypes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import DiscoverClient from './DiscoverClient';

export const metadata = {
    title: 'Discover | Olivia Alleppey',
};

export default async function DiscoverPage() {
    const [pageHeaders, rooms] = await Promise.all([
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
    ]);
    const discoverHeader = pageHeaders.discover;

    return <DiscoverClient headerImage={discoverHeader?.url} rooms={rooms} />;
}