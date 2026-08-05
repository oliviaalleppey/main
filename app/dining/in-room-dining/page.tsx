import FullMenuPage from '../FullMenuPage';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import JsonLd from '@/components/seo/json-ld';
import { breadcrumbSchema, restaurantSchema } from '@/lib/structured-data';

// This static route shadows /dining/[slug], so it needs its own canonical and
// structured data — it never renders the dynamic page's metadata.
export const metadata: Metadata = pageMetadata({
    title: 'In-Room Dining Menu',
    description:
        'The full à la carte in-room dining menu at Olivia Alleppey, Alappuzha — local and global dishes served to your room 24 hours a day.',
    path: '/dining/in-room-dining',
});

export default function InRoomDiningPage() {
    return (
        <>
            <JsonLd
                data={[
                    restaurantSchema({
                        name: 'In-Room Dining',
                        slug: 'in-room-dining',
                        description:
                            'Round-the-clock dining delivered to your room — local and global flavours, any hour.',
                        cuisine: 'Local & Global',
                        hours: 'Mo-Su 00:00-23:59',
                    }),
                    breadcrumbSchema([
                        { name: 'Dining', path: '/dining' },
                        { name: 'In-Room Dining', path: '/dining/in-room-dining' },
                    ]),
                ]}
            />
            <FullMenuPage
                outletName="In-Room Dining"
                outletTagline="Round-the-clock dining delivered to your room — local and global flavours, any hour."
                hours="24 Hours"
            />
        </>
    );
}
