import { getAllMedia } from '../media/actions';
import GalleryAdminManager from './GalleryAdminManager';
import { db } from '@/lib/db';
import { galleryImages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const metadata = {
    title: 'Gallery Management | Admin',
};

export default async function AdminGalleryPage() {
    // Fetch only images assigned to the 'gallery' category
    const images = await db.select()
        .from(galleryImages)
        .where(eq(galleryImages.category, 'gallery'))
        .orderBy(galleryImages.sortOrder, galleryImages.createdAt);


    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-serif text-[#0A1628] mb-8">Gallery Management</h1>
            <GalleryAdminManager initialImages={images as any[]} />
        </div>
    );
}
