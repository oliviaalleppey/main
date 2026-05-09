import { getAllMedia } from '../media/actions';
import GalleryAdminManager from './GalleryAdminManager';
import { db } from '@/lib/db';
import { galleryImages, siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const metadata = {
    title: 'Gallery Management | Admin',
};

const DEFAULT_TABS = [
    { slug: 'rooms', label: 'Rooms' },
    { slug: 'dining', label: 'Dining' },
    { slug: 'spa', label: 'Spa' },
    { slug: 'pool', label: 'Pool' },
    { slug: 'events', label: 'Events' },
];

export default async function AdminGalleryPage() {
    const [images, tabSetting] = await Promise.all([
        db.select().from(galleryImages)
            .where(eq(galleryImages.category, 'gallery'))
            .orderBy(galleryImages.sortOrder, galleryImages.createdAt),
        db.select().from(siteSettings).where(eq(siteSettings.key, 'gallery_tabs')).limit(1),
    ]);

    const tabs = (tabSetting[0]?.value as typeof DEFAULT_TABS | null) ?? DEFAULT_TABS;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-serif text-[#0A1628] mb-8">Gallery Management</h1>
            <GalleryAdminManager initialImages={images as any[]} initialTabs={tabs} />
        </div>
    );
}
