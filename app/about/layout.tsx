import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

// The page itself is a client component, so metadata lives in the layout.
export const metadata: Metadata = pageMetadata({
    title: 'About Olivia Alleppey',
    description:
        'The story behind Olivia Alleppey — a 5-star hotel at Finishing Point on the Alappuzha backwaters, blending Kerala heritage with contemporary luxury hospitality.',
    path: '/about',
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
    return children;
}
