import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { db } from './lib/db';
import { galleryImages } from './lib/db/schema';
import { eq } from 'drizzle-orm';

async function check() {
  const images = await db.select({ category: galleryImages.category, url: galleryImages.imageUrl }).from(galleryImages).where(eq(galleryImages.isActive, true));
  const cats = new Set(images.map(i => i.category));
  console.log('Categories:', Array.from(cats));
  process.exit(0);
}
check();
