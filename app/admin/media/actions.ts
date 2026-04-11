'use server';

import { put } from '@vercel/blob';
import { db } from '@/lib/db';
import { siteSettings, galleryImages, roomTypes } from '@/lib/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import sharp from 'sharp';

async function toWebP(file: File): Promise<{ buffer: Buffer; filename: string }> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = await sharp(Buffer.from(arrayBuffer)).webp({ quality: 85 }).toBuffer();
        const filename = file.name.replace(/\.[^.]+$/, '.webp');
        return { buffer, filename };
    } catch (error) {
        console.error('WebP conversion error:', error);
        throw new Error('Failed to convert image to WebP');
    }
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

    try {
        const isVideo = file.type.startsWith('video/');

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

        return { success: true, url: blob.url, type: isVideo ? 'video' : 'image', id: result[0].id };
    } catch (error) {
        console.error('Upload media error:', error);
        throw new Error('Failed to upload media');
    }
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

    try {
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
    } catch (error) {
        console.error('Room image upload error:', error);
        throw new Error('Failed to upload room image');
    }
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

    try {
        if (file && file.size > 0) {
            // Check if it's an image or video
            if (file.type.startsWith('image/')) {
                const converted = await toWebP(file);
                const blob = await put(converted.filename, converted.buffer, {
                    access: 'public',
                    addRandomSuffix: true,
                    contentType: 'image/webp',
                });
                url = blob.url;
            } else if (file.type.startsWith('video/')) {
                const blob = await put(file.name, file, {
                    access: 'public',
                    addRandomSuffix: true,
                });
                url = blob.url;
            } else {
                throw new Error('Unsupported file type');
            }
        } else if (manualUrl?.startsWith('http')) {
            url = manualUrl;
        } else {
            throw new Error('No media provided');
        }
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
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

// Dining outlet images
const DINING_SLUGS = ['in-room-dining', 'finishing-point', 'brew-bar', 'aqua-pool-lounge', 'club-9', 'kaayal'] as const;

export async function getDiningImages(): Promise<Record<string, string>> {
    const keys = DINING_SLUGS.map(s => `dining_${s}`);
    const results = await db.select().from(siteSettings).where(inArray(siteSettings.key, keys));
    const map: Record<string, string> = {};
    results.forEach(r => {
        const slug = (r.key as string).replace('dining_', '');
        map[slug] = (r.value as { url: string }).url;
    });
    return map;
}

export async function setDiningImage(slug: string, formData: FormData) {
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

    const key = `dining_${slug}`;
    const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
    if (existing.length > 0) {
        await db.update(siteSettings).set({ value: { url }, updatedAt: new Date() }).where(eq(siteSettings.key, key));
    } else {
        await db.insert(siteSettings).values({ key, value: { url } });
    }

    revalidatePath('/dining');
    revalidatePath('/admin/media');
    return { success: true, url };
}

// Membership privilege images
const MEMBERSHIP_PRIVILEGE_KEYS = ['wellness', 'dining', 'stay', 'spa', 'events'] as const;

// Gallery categories to use as fallbacks for each privilege
const MEMBERSHIP_FALLBACK_CATEGORIES: Record<string, string> = {
    wellness: 'wellness',
    dining: 'dining',
    stay: 'accommodation',
    spa: 'wellness',
    events: 'conference',
};

export async function getMembershipImages(): Promise<Record<string, string>> {
    const keys = MEMBERSHIP_PRIVILEGE_KEYS.map(k => `membership_${k}`);
    const [settingsResults, galleryResults] = await Promise.all([
        db.select().from(siteSettings).where(inArray(siteSettings.key, keys)),
        db.select({ imageUrl: galleryImages.imageUrl, category: galleryImages.category })
            .from(galleryImages)
            .where(eq(galleryImages.isActive, true))
            .orderBy(galleryImages.sortOrder, desc(galleryImages.createdAt)),
    ]);

    // Build a map of first available gallery image per category
    const galleryByCategory: Record<string, string> = {};
    for (const row of galleryResults) {
        if (row.category && !galleryByCategory[row.category]) {
            galleryByCategory[row.category] = row.imageUrl;
        }
    }

    // Specific membership images override gallery fallbacks
    const map: Record<string, string> = {};
    // Fill fallbacks first
    for (const key of MEMBERSHIP_PRIVILEGE_KEYS) {
        const fallbackCategory = MEMBERSHIP_FALLBACK_CATEGORIES[key];
        if (fallbackCategory && galleryByCategory[fallbackCategory]) {
            map[key] = galleryByCategory[fallbackCategory];
        }
    }
    // Override with specific membership images if set
    settingsResults.forEach(r => {
        const k = (r.key as string).replace('membership_', '');
        map[k] = (r.value as { url: string }).url;
    });
    return map;
}

export async function setMembershipImage(privilegeKey: string, formData: FormData) {
    const file = formData.get('media') as File | null;
    const manualUrl = formData.get('url') as string | null;

    let url: string;

    try {
        if (file && file.size > 0) {
            if (file.type.startsWith('image/')) {
                const converted = await toWebP(file);
                const blob = await put(converted.filename, converted.buffer, {
                    access: 'public',
                    addRandomSuffix: true,
                    contentType: 'image/webp',
                });
                url = blob.url;
            } else {
                throw new Error('Only images supported');
            }
        } else if (manualUrl?.startsWith('http')) {
            url = manualUrl;
        } else {
            throw new Error('No media provided');
        }
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }

    const key = `membership_${privilegeKey}`;
    const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
    if (existing.length > 0) {
        await db.update(siteSettings).set({ value: { url }, updatedAt: new Date() }).where(eq(siteSettings.key, key));
    } else {
        await db.insert(siteSettings).values({ key, value: { url } });
    }

    revalidatePath('/membership');
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

// Save URL as media (for client-side direct uploads)
export async function saveMediaUrl(url: string, category: string, title: string) {
    const result = await db.insert(galleryImages).values({
        title: title || 'Untitled',
        imageUrl: url,
        category: category || 'general',
        isActive: true,
        sortOrder: 0,
    }).returning();

    revalidatePath('/admin/media');
    return { success: true, url, id: result[0].id };
}

// Wedding venue images
const WEDDING_VENUES = ['grand_ballroom', 'forum_hall', 'pool_side'] as const;

export async function getWeddingVenueImages(): Promise<Record<string, string>> {
    const keys = WEDDING_VENUES.map(v => `wedding_venue_${v}`);
    const results = await db.select().from(siteSettings).where(inArray(siteSettings.key, keys));
    const map: Record<string, string> = {};
    results.forEach(r => {
        const venue = (r.key as string).replace('wedding_venue_', '');
        map[venue] = (r.value as { url: string }).url;
    });
    return map;
}

export async function setWeddingVenueImage(venueKey: string, formData: FormData) {
    const file = formData.get('media') as File | null;
    const manualUrl = formData.get('url') as string | null;

    let url: string;

    try {
        if (file && file.size > 0) {
            if (file.type.startsWith('image/')) {
                const converted = await toWebP(file);
                const blob = await put(converted.filename, converted.buffer, {
                    access: 'public',
                    addRandomSuffix: true,
                    contentType: 'image/webp',
                });
                url = blob.url;
            } else {
                throw new Error('Only images supported for venues');
            }
        } else if (manualUrl?.startsWith('http')) {
            url = manualUrl;
        } else {
            throw new Error('No media provided');
        }
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }

    const key = `wedding_venue_${venueKey}`;
    const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
    if (existing.length > 0) {
        await db.update(siteSettings).set({ value: { url }, updatedAt: new Date() }).where(eq(siteSettings.key, key));
    } else {
        await db.insert(siteSettings).values({ key, value: { url } });
    }

    revalidatePath('/wedding');
    revalidatePath('/admin/media');
    return { success: true, url };
}

// Wedding "How We Plan" section images (2 images)
const WEDDING_SECTION_IMAGES = ['how_we_plan_1', 'how_we_plan_2'] as const;

export async function getWeddingSectionImages(): Promise<Record<string, string>> {
    const keys = WEDDING_SECTION_IMAGES.map(k => `wedding_section_${k}`);
    const results = await db.select().from(siteSettings).where(inArray(siteSettings.key, keys));
    const map: Record<string, string> = {};
    results.forEach(r => {
        const key = (r.key as string).replace('wedding_section_', '');
        map[key] = (r.value as { url: string }).url;
    });
    return map;
}

export async function setWeddingSectionImage(sectionKey: string, formData: FormData) {
    const file = formData.get('media') as File | null;
    const manualUrl = formData.get('url') as string | null;

    let url: string;

    try {
        if (file && file.size > 0) {
            if (file.type.startsWith('image/')) {
                const converted = await toWebP(file);
                const blob = await put(converted.filename, converted.buffer, {
                    access: 'public',
                    addRandomSuffix: true,
                    contentType: 'image/webp',
                });
                url = blob.url;
            } else {
                throw new Error('Only images supported');
            }
        } else if (manualUrl?.startsWith('http')) {
            url = manualUrl;
        } else {
            throw new Error('No media provided');
        }
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }

    const key = `wedding_section_${sectionKey}`;
    const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
    if (existing.length > 0) {
        await db.update(siteSettings).set({ value: { url }, updatedAt: new Date() }).where(eq(siteSettings.key, key));
    } else {
        await db.insert(siteSettings).values({ key, value: { url } });
    }

    revalidatePath('/wedding');
    revalidatePath('/admin/media');
    return { success: true, url };
}

// Conference venue images (3 venues)
const CONFERENCE_VENUE_IMAGES = ['grand-ballroom', 'forum', 'poolside'] as const;

export async function getConferenceVenueImages(): Promise<Record<string, string>> {
    const keys = CONFERENCE_VENUE_IMAGES.map(k => `conference_venue_${k}`);
    const results = await db.select().from(siteSettings).where(inArray(siteSettings.key, keys));
    const map: Record<string, string> = {};
    results.forEach(r => {
        const key = (r.key as string).replace('conference_venue_', '');
        map[key] = (r.value as { url: string }).url;
    });
    return map;
}

export async function setConferenceVenueImage(venueKey: string, formData: FormData) {
    const file = formData.get('media') as File | null;
    const manualUrl = formData.get('url') as string | null;

    let url: string;

    try {
        if (file && file.size > 0) {
            if (file.type.startsWith('image/')) {
                const converted = await toWebP(file);
                const blob = await put(converted.filename, converted.buffer, {
                    access: 'public',
                    addRandomSuffix: true,
                    contentType: 'image/webp',
                });
                url = blob.url;
            } else {
                throw new Error('Only images supported');
            }
        } else if (manualUrl?.startsWith('http')) {
            url = manualUrl;
        } else {
            throw new Error('No media provided');
        }
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }

    const key = `conference_venue_${venueKey}`;
    const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
    if (existing.length > 0) {
        await db.update(siteSettings).set({ value: { url }, updatedAt: new Date() }).where(eq(siteSettings.key, key));
    } else {
        await db.insert(siteSettings).values({ key, value: { url } });
    }

    revalidatePath('/conference-events');
    revalidatePath('/admin/media');
    return { success: true, url };
}

// Conference "How We Plan" section images (2 images)
const CONFERENCE_SECTION_IMAGES = ['how_we_plan_1', 'how_we_plan_2'] as const;

export async function getConferenceSectionImages(): Promise<Record<string, string>> {
    const keys = CONFERENCE_SECTION_IMAGES.map(k => `conference_section_${k}`);
    const results = await db.select().from(siteSettings).where(inArray(siteSettings.key, keys));
    const map: Record<string, string> = {};
    results.forEach(r => {
        const key = (r.key as string).replace('conference_section_', '');
        map[key] = (r.value as { url: string }).url;
    });
    return map;
}

export async function setConferenceSectionImage(sectionKey: string, formData: FormData) {
    const file = formData.get('media') as File | null;
    const manualUrl = formData.get('url') as string | null;

    let url: string;

    try {
        if (file && file.size > 0) {
            if (file.type.startsWith('image/')) {
                const converted = await toWebP(file);
                const blob = await put(converted.filename, converted.buffer, {
                    access: 'public',
                    addRandomSuffix: true,
                    contentType: 'image/webp',
                });
                url = blob.url;
            } else {
                throw new Error('Only images supported');
            }
        } else if (manualUrl?.startsWith('http')) {
            url = manualUrl;
        } else {
            throw new Error('No media provided');
        }
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }

    const key = `conference_section_${sectionKey}`;
    const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
    if (existing.length > 0) {
        await db.update(siteSettings).set({ value: { url }, updatedAt: new Date() }).where(eq(siteSettings.key, key));
    } else {
        await db.insert(siteSettings).values({ key, value: { url } });
    }

    revalidatePath('/conference-events');
    revalidatePath('/admin/media');
    return { success: true, url };
}
