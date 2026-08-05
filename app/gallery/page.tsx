import { pageMetadata } from '@/lib/seo';
import { db } from '@/lib/db';
import { galleryImages, siteSettings } from '@/lib/db/schema';
import { eq, asc, desc } from 'drizzle-orm';
import GalleryClient from './GalleryClient';

export const metadata = pageMetadata({
    title: 'Photo Gallery',
    description:
        'Explore Olivia Alleppey through our curated gallery — rooms and suites, dining venues, the spa, pool and banquet spaces at our 5-star hotel in Alappuzha, Kerala.',
    path: '/gallery',
});

export const revalidate = 60;

const DEFAULT_TABS = [
    { slug: 'rooms', label: 'Rooms' },
    { slug: 'dining', label: 'Dining' },
    { slug: 'spa', label: 'Spa' },
    { slug: 'pool', label: 'Pool' },
    { slug: 'events', label: 'Events' },
];

export default async function GalleryPage() {
    const [images, tabSetting] = await Promise.all([
        db.select().from(galleryImages)
            .where(eq(galleryImages.category, 'gallery'))
            .orderBy(asc(galleryImages.sortOrder), desc(galleryImages.createdAt)),
        db.select().from(siteSettings).where(eq(siteSettings.key, 'gallery_tabs')).limit(1),
    ]);

    const tabs = (tabSetting[0]?.value as typeof DEFAULT_TABS | null) ?? DEFAULT_TABS;

    return <GalleryClient initialImages={images} tabs={tabs} />;
}
