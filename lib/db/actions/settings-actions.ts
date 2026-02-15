'use server';

import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const HERO_IMAGES_KEY = 'hero_images';

export type HeroImage = {
    url: string;
    alt: string;
};

export async function getHeroImages() {
    const setting = await db.query.siteSettings.findFirst({
        where: eq(siteSettings.key, HERO_IMAGES_KEY),
    });

    if (!setting) {
        return [];
    }

    return setting.value as HeroImage[];
}

export async function updateHeroImages(images: HeroImage[]) {
    const existing = await db.query.siteSettings.findFirst({
        where: eq(siteSettings.key, HERO_IMAGES_KEY),
    });

    if (existing) {
        await db
            .update(siteSettings)
            .set({ value: images, updatedAt: new Date() })
            .where(eq(siteSettings.key, HERO_IMAGES_KEY));
    } else {
        await db.insert(siteSettings).values({
            key: HERO_IMAGES_KEY,
            value: images,
        });
    }

    revalidatePath('/');
    revalidatePath('/admin/settings');
}
