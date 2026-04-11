import { db } from '../lib/db/index';
import { siteSettings, galleryImages } from '../lib/db/schema';

async function main() {
    const settings = await db.select({ key: siteSettings.key }).from(siteSettings);
    console.log('Settings keys:', JSON.stringify(settings.map(r => r.key)));

    const gallery = await db.select({ imageUrl: galleryImages.imageUrl, category: galleryImages.category }).from(galleryImages).limit(20);
    console.log('Gallery images:', JSON.stringify(gallery));
}

main().catch(console.error);
