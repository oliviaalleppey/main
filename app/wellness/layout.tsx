import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

// The page itself is a client component, so metadata lives in the layout.
export const metadata: Metadata = pageMetadata({
    title: 'Spa & Wellness in Alappuzha',
    description:
        'Spa and wellness at Olivia Alleppey, Alappuzha. Ayurvedic therapies, spa treatments, a fitness centre and a pool overlooking the Kerala backwaters.',
    path: '/wellness',
});

export default function WellnessLayout({ children }: { children: React.ReactNode }) {
    return children;
}
