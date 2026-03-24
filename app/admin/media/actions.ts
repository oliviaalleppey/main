'use server';

import { put } from '@vercel/blob';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function uploadHeroMedia(formData: FormData) {
    const file = formData.get('media') as File;
    if (!file) throw new Error('No file provided');

    // determine type
    const type = file.type.startsWith('video/') ? 'video' : 'image';

    // upload to vercel blob
    const blob = await put(file.name, file, {
        access: 'public',
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
