import { db } from './index';
import { diningOutlets } from './schema';
import { eq } from 'drizzle-orm';

async function updateDiningImages() {
    console.log('📸 Updating dining outlet images...');

    const updates = [
        {
            slug: 'finishing-point',
            featuredImage: '/images/dining/finishing-point.png',
        },
        {
            slug: 'brew-bar',
            featuredImage: '/images/dining/brew-bar.png',
        },
        {
            slug: 'kaayal',
            featuredImage: '/images/dining/kaayal.png',
        },
    ];

    try {
        for (const update of updates) {
            await db
                .update(diningOutlets)
                .set({ featuredImage: update.featuredImage })
                .where(eq(diningOutlets.slug, update.slug));
            console.log(`✓ Updated ${update.slug}`);
        }
        console.log('✅ All images updated successfully!');
    } catch (error) {
        console.error('❌ Error updating images:', error);
        throw error;
    }
}

updateDiningImages()
    .then(() => {
        console.log('Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Failed:', error);
        process.exit(1);
    });
