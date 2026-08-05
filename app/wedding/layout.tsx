import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

// The page itself is a client component, so metadata lives in the layout.
export const metadata: Metadata = pageMetadata({
    title: 'Wedding Venues in Alappuzha, Kerala',
    description:
        'Celebrate your wedding at Olivia Alleppey. Backwater-facing lawns, a 5,035 sq ft Grand Ballroom for up to 550 guests, bespoke catering and dedicated planning in Alappuzha, Kerala.',
    path: '/wedding',
});

export default function WeddingLayout({ children }: { children: React.ReactNode }) {
    return children;
}
