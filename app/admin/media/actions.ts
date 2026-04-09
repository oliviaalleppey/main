'use server';

import { put } from '@vercel/blob';
import { db } from '@/lib/db';
import { siteSettings, galleryImages, roomTypes } from '@/lib/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import sharp from 'sharp';

async function toWebP(file: File): Promise<{ buffer: Buffer; filename: string }> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = await sharp(Buffer.from(arrayBuffer)).webp({ quality: 85 }).toBuffer();
    const filename = file.name.replace(/\.[^.]+$/, '.webp');
    return { buffer, filename };
}

export async function uploadHeroMedia(formData: FormData) {
    const file = formData.get('media') as File;
    if (!file) throw new Error('No file provided');

    // determine type
    const isVideo = file.type.startsWith('video/');
    const type = isVideo ? 'video' : 'image';

    // convert images to WebP before upload
    let uploadData: File | Buffer = file;
    let uploadName = file.name;
    if (!isVideo) {
        const converted = await toWebP(file);
        uploadData = converted.buffer;
        uploadName = converted.filename;
    }

    const blob = await put(uploadName, uploadData, {
        access: 'public',
        addRandomSuffix: true,
        ...(!isVideo && { contentType: 'image/webp' }),
    });

    const payload = { type, url: blob.url };

    // Update or insert site settings
    const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, 'hero_media')).limit(1);

    if (existing.length > 0) {
        await db.update(siteSettings)
            .set({ value: payload, updatedAt: new Date() })
            .where(eq(siteSettings.key, 'hero_media'));
    } else {
        await db.insert(siteSettings).values({
            key: 'hero_media',
            value: payload
        });
    }

    revalidatePath('/');
    revalidatePath('/admin/media');

    return { success: true, url: blob.url, type };
}

export async function getHeroMedia() {
    const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, 'hero_media')).limit(1);
    if (existing.length === 0) return null;
    return existing[0].value as { type: 'video' | 'image', url: string };
}

// Upload with category and page
export async function uploadMedia(formData: FormData) {
    const file = formData.get('media') as File;
    const category = formData.get('category') as string;
    const page = formData.get('page') as string;
    const title = formData.get('title') as string;

    if (!file) throw new Error('No file provided');

    const isVideo = file.type.startsWith('video/');
    const type = isVideo ? 'video' : 'image';

    // convert images to WebP before upload
    let uploadData: File | Buffer = file;
    let uploadName = file.name;
    if (!isVideo) {
        const converted = await toWebP(file);
        uploadData = converted.buffer;
        uploadName = converted.filename;
    }

    const blob = await put(uploadName, uploadData, {
        access: 'public',
        addRandomSuffix: true,
        ...(!isVideo && { contentType: 'image/webp' }),
    });

    // Save to database
    const result = await db.insert(galleryImages).values({
        title: title || file.name,
        imageUrl: blob.url,
        category: category || 'general',
        isActive: true,
        sortOrder: 0,
    }).returning();

    revalidatePath('/admin/media');

    return { success: true, url: blob.url, type, id: result[0].id };
}

// Get home hero images for carousel (category = 'home')
export async function getHomeHeroImages() {
    return await db
        .select()
        .from(galleryImages)
        .where(eq(galleryImages.category, 'home'))
        .orderBy(galleryImages.sortOrder, desc(galleryImages.createdAt));
}

// Get all media with optional filters
export async function getAllMedia(category?: string, pageName?: string) {
    let query = db.select().from(galleryImages).orderBy(desc(galleryImages.createdAt));

    if (category) {
        const filtered = await query.where(eq(galleryImages.category, category));
        return filtered;
    }

    return await query;
}

// Get media by page
export async function getMediaByPage(pageName: string) {
    return await db.select()
        .from(galleryImages)
        .where(eq(galleryImages.category, pageName))
        .orderBy(desc(galleryImages.createdAt));
}

// Delete media
export async function deleteMedia(id: string) {
    await db.delete(galleryImages).where(eq(galleryImages.id, id));
    revalidatePath('/admin/media');
    return { success: true };
}

// Get all page headers
export async function getPageHeaders() {
    const pages = ['home', 'accommodation', 'dining', 'wellness', 'wedding', 'conference', 'discover', 'membership'];
    const keys = pages.map(p => `header_${p}`);
    const results = await db.select().from(siteSettings).where(inArray(siteSettings.key, keys));

    const map: Record<string, { type: 'video' | 'image'; url: string }> = {};
    results.forEach(r => {
        const page = (r.key as string).replace('header_', '');
        map[page] = r.value as { type: 'video' | 'image'; url: string };
    });
    return map;
}

// Set page header (upload file or save URL)
export async function setPageHeader(page: string, formData: FormData) {
    const file = formData.get('media') as File | null;
    const manualUrl = formData.get('url') as string | null;

    let url: string;
    let type: 'video' | 'image';

    if (file && file.size > 0) {
        const isVideo = file.type.startsWith('video/');
        type = isVideo ? 'video' : 'image';

        let uploadData: File | Buffer = file;
        let uploadName = file.name;
        if (!isVideo) {
            const converted = await toWebP(file);
            uploadData = converted.buffer;
            uploadName = converted.filename;
        }

        const blob = await put(uploadName, uploadData, {
            access: 'public',
            addRandomSuffix: true,
            ...(!isVideo && { contentType: 'image/webp' }),
        });
        url = blob.url;
    } else if (manualUrl?.startsWith('http')) {
        url = manualUrl;
        type = /\.(mp4|webm)/i.test(manualUrl) ? 'video' : 'image';
    } else {
        throw new Error('No media provided');
    }

    const key = `header_${page}`;
    const payload = { type, url };

    const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
    if (existing.length > 0) {
        await db.update(siteSettings).set({ value: payload, updatedAt: new Date() }).where(eq(siteSettings.key, key));
    } else {
        await db.insert(siteSettings).values({ key, value: payload });
    }

    revalidatePath('/admin/media');
    revalidatePath('/');
    return { success: true, url, type };
}

// Get all room types with their images
export async function getRoomTypesWithImages() {
    return await db
        .select({ id: roomTypes.id, name: roomTypes.name, images: roomTypes.images })
        .from(roomTypes)
        .orderBy(roomTypes.sortOrder, roomTypes.name);
}

// Update a room type's image array (reorder, delete, replace)
export async function updateRoomTypeImages(roomTypeId: string, images: string[]) {
    await db
        .update(roomTypes)
        .set({ images, updatedAt: new Date() } as any)
        .where(eq(roomTypes.id, roomTypeId));
    revalidatePath('/admin/media');
    revalidatePath('/rooms');
    return { success: true };
}

// Upload a single room image with WebP conversion (for replace)
export async function uploadRoomImageFile(formData: FormData): Promise<{ url: string }> {
    const file = formData.get('media') as File;
    if (!file || file.size === 0) throw new Error('No file provided');

    const isVideo = file.type.startsWith('video/');
    let uploadData: File | Buffer = file;
    let uploadName = file.name;
    if (!isVideo) {
        const converted = await toWebP(file);
        uploadData = converted.buffer;
        uploadName = converted.filename;
    }

    const blob = await put(uploadName, uploadData, {
        access: 'public',
        addRandomSuffix: true,
        ...(!isVideo && { contentType: 'image/webp' }),
    });
    return { url: blob.url };
}

// Amenity image keys
const AMENITY_KEYS = ['pool', 'gym', 'spa', 'yoga', 'editorial', 'discover', 'wellness_spa', 'wellness_pool', 'wellness_gym', 'wellness_steam', 'wellness_yoga'] as const;

export async function getAmenityImages(): Promise<Record<string, string>> {
    const keys = AMENITY_KEYS.map(k => `amenity_${k}`);
    const results = await db.select().from(siteSettings).where(inArray(siteSettings.key, keys));
    const map: Record<string, string> = {};
    results.forEach(r => {
        const k = (r.key as string).replace('amenity_', '');
        map[k] = (r.value as { url: string }).url;
    });
    return map;
}

export async function setAmenityImage(amenityKey: string, formData: FormData) {
    const file = formData.get('media') as File | null;
    const manualUrl = formData.get('url') as string | null;

    let url: string;

    if (file && file.size > 0) {
        const converted = await toWebP(file);
        const blob = await put(converted.filename, converted.buffer, {
            access: 'public',
            addRandomSuffix: true,
            contentType: 'image/webp',
        });
        url = blob.url;
    } else if (manualUrl?.startsWith('http')) {
        url = manualUrl;
    } else {
        throw new Error('No media provided');
    }

    const key = `amenity_${amenityKey}`;
    const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
    if (existing.length > 0) {
        await db.update(siteSettings).set({ value: { url }, updatedAt: new Date() }).where(eq(siteSettings.key, key));
    } else {
        await db.insert(siteSettings).values({ key, value: { url } });
    }

    revalidatePath('/');
    revalidatePath('/admin/media');
    return { success: true, url };
}

// Bulk import media from existing URLs
export async function bulkImportMedia(urls: string[], category: string) {
    if (!urls.length) return { success: false, count: 0 };

    const values = urls.map(url => ({
        title: url.split('/').pop()?.replace(/\?.*$/, '') || 'Imported',
        imageUrl: url,
        category: category || 'general',
        isActive: true,
        sortOrder: 0,
    }));

    await db.insert(galleryImages).values(values);
    revalidatePath('/admin/media');
    return { success: true, count: values.length };
}
