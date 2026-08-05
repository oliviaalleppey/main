import FullMenuPage from '../FullMenuPage';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import JsonLd from '@/components/seo/json-ld';
import { breadcrumbSchema, restaurantSchema } from '@/lib/structured-data';

// This static route shadows /dining/[slug], so it needs its own canonical and
// structured data — it never renders the dynamic page's metadata.
export const metadata: Metadata = pageMetadata({
    title: 'Finishing Point Restaurant Menu',
    description:
        'The full à la carte menu at Finishing Point, the all-day dining restaurant at Olivia Alleppey, Alappuzha — Kerala favourites and global classics, 7:00 am to 11:00 pm.',
    path: '/dining/finishing-point',
});

export default function FinishingPointPage() {
    return (
        <>
            <JsonLd
                data={[
                    restaurantSchema({
                        name: 'Finishing Point',
                        slug: 'finishing-point',
                        description:
                            'All-day dining with a refined spread of Kerala favourites and global classics.',
                        cuisine: 'Kerala & Global',
                        hours: 'Mo-Su 07:00-23:00',
                    }),
                    breadcrumbSchema([
                        { name: 'Dining', path: '/dining' },
                        { name: 'Finishing Point', path: '/dining/finishing-point' },
                    ]),
                ]}
            />
            <FullMenuPage
                outletName="Finishing Point"
                outletTagline="All-day dining with a refined spread of Kerala favourites and global classics."
                hours="7:00 am – 11:00 pm"
            />
        </>
    );
}
