import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

// The page itself is a client component, so metadata lives in the layout.
export const metadata: Metadata = pageMetadata({
    title: 'Contact Us',
    description:
        'Contact Olivia Alleppey at Finishing Point, Alappuzha, Kerala 688013. Call +91 8075 416 514 or email reservation@oliviaalleppey.com for reservations and enquiries.',
    path: '/contact',
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return children;
}
