'use server';

import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { type ColorPalette, DEFAULT_PALETTE } from '@/lib/config/palette';
import { requireAdminAction } from '@/lib/admin/guard';
import {
    DEFAULT_PARTY_POPUP,
    PARTY_PATH,
    PARTY_POPUP_KEY,
    normalisePartyPopup,
    type PartyPopupSettings,
} from '@/lib/config/party-popup';

// The two getters below are deliberately left open: getColorPalette is called
// from the site's root layout on every public page, and the hero images are on
// the homepage. Both return content that is already visible to the world. Only
// the writers are guarded.

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
    await requireAdminAction();

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
    await requireAdminAction();

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


// ============================================================
// 31ST NIGHT PARTY POP-UP
// ============================================================

// Read by the public homepage, so the getter is open; only the writer is guarded.
export async function getPartyPopup(): Promise<PartyPopupSettings> {
    try {
        const setting = await db.query.siteSettings.findFirst({
            where: eq(siteSettings.key, PARTY_POPUP_KEY),
        });
        return normalisePartyPopup(setting?.value);
    } catch {
        return DEFAULT_PARTY_POPUP;
    }
}

export async function updatePartyPopup(input: PartyPopupSettings): Promise<PartyPopupSettings> {
    await requireAdminAction();

    const value = normalisePartyPopup(input);
    const existing = await db.query.siteSettings.findFirst({
        where: eq(siteSettings.key, PARTY_POPUP_KEY),
    });

    if (existing) {
        await db
            .update(siteSettings)
            .set({ value, updatedAt: new Date() })
            .where(eq(siteSettings.key, PARTY_POPUP_KEY));
    } else {
        await db.insert(siteSettings).values({ key: PARTY_POPUP_KEY, value });
    }

    revalidatePath('/');
    revalidatePath(PARTY_PATH);
    revalidatePath('/admin/settings');
    return value;
}
