import { db } from '@/lib/db';
import { galleryImages } from '@/lib/db/schema';
import { eq, asc, desc } from 'drizzle-orm';
import GalleryClient from './GalleryClient';

export const metadata = {
    title: 'Gallery | Olivia Alleppey',
    description: 'Explore the beauty and luxury of Olivia Alleppey through our curated gallery.',
};

export const revalidate = 60; // revalidate every minute

export default async function GalleryPage() {
    // Fetch only images assigned to the 'gallery' category (or fallback to all if you want, but user said they will upload them from Gallery admin)
    const images = await db.select()
        .from(galleryImages)
        .where(eq(galleryImages.category, 'gallery'))
        .orderBy(asc(galleryImages.sortOrder), desc(galleryImages.createdAt));

    return <GalleryClient initialImages={images} />;
}
