import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

// The page itself is a client component, so metadata lives in the layout.
export const metadata: Metadata = pageMetadata({
    title: 'Spa & Wellness in Alappuzha',
    description:
        'Restore body and mind at Olivia Alleppey. Ayurvedic therapies, spa treatments, a fitness centre and pool overlooking the Kerala backwaters at Finishing Point, Alappuzha.',
    path: '/wellness',
});

export default function WellnessLayout({ children }: { children: React.ReactNode }) {
    return children;
}
