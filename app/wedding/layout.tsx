import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

// The page itself is a client component, so metadata lives in the layout.
export const metadata: Metadata = pageMetadata({
    title: 'Wedding Venues in Alappuzha, Kerala',
    description:
        'Wedding venues at Olivia Alleppey, Alappuzha. Backwater-facing lawns, a Grand Ballroom for 550 guests, bespoke catering and dedicated planning in Kerala.',
    path: '/wedding',
});

export default function WeddingLayout({ children }: { children: React.ReactNode }) {
    return children;
}
