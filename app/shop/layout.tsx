import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

// The page itself is a client component, so metadata lives in the layout.
// noIndex while the shop is a placeholder: a "coming soon" page with no
// purchasable products is thin content and would dilute the site's quality
// signals. Remove `noIndex` once real products ship.
export const metadata: Metadata = pageMetadata({
    title: 'The Olivia Boutique',
    description:
        'The Olivia Alleppey boutique — signature candles, Ayurvedic wellness kits and Kerala spice collections. Coming soon.',
    path: '/shop',
    noIndex: true,
});

export default function ShopLayout({ children }: { children: React.ReactNode }) {
    return children;
}
