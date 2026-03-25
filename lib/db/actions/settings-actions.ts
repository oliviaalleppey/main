'use server';

import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { type ColorPalette, DEFAULT_PALETTE } from '@/lib/config/palette';

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

// ============================================================
// COLOR PALETTE
// ============================================================

const COLOR_PALETTE_KEY = 'color_palette';

export async function getColorPalette(): Promise<ColorPalette> {
    try {
        const setting = await db.query.siteSettings.findFirst({
            where: eq(siteSettings.key, COLOR_PALETTE_KEY),
        });
        if (!setting) return DEFAULT_PALETTE;
        return { ...DEFAULT_PALETTE, ...(setting.value as Partial<ColorPalette>) };
    } catch {
        return DEFAULT_PALETTE;
    }
}

export async function updateColorPalette(palette: ColorPalette): Promise<void> {
    const existing = await db.query.siteSettings.findFirst({
        where: eq(siteSettings.key, COLOR_PALETTE_KEY),
    });

    if (existing) {
        await db
            .update(siteSettings)
            .set({ value: palette, updatedAt: new Date() })
            .where(eq(siteSettings.key, COLOR_PALETTE_KEY));
    } else {
        await db.insert(siteSettings).values({
            key: COLOR_PALETTE_KEY,
            value: palette,
        });
    }

    revalidatePath('/', 'layout');
    revalidatePath('/admin/settings');
}

