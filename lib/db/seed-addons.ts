
import 'dotenv/config';
import { db } from './index';
import { addOns } from './schema';

export async function seedAddOns() {
    console.log('🌱 Seeding Add-ons...');

    try {
        await db.delete(addOns);

        await db.insert(addOns).values([
            {
                name: 'Candle Light Dinner',
                description: 'A romantic 3-course dinner by the lakeside with personalized service.',
                price: 350000, // ₹3,500
                type: 'per_unit',
                icon: 'Utensils',
                isActive: true,
                sortOrder: 1,
            },
            {
                name: 'Romantic Bed Decoration',
                description: 'Beautiful floral arrangement on the bed to surprise your partner.',
                price: 150000, // ₹1,500
                type: 'per_unit',
                icon: 'Heart',
                isActive: true,
                sortOrder: 2,
            },
            {
                name: 'Fruit Basket & Chocolates',
                description: 'A premium selection of seasonal fruits and gourmet chocolates.',
                price: 100000, // ₹1,000
                type: 'per_unit',
                icon: 'Gift',
                isActive: true,
                sortOrder: 3,
            }
        ]);

        console.log('✅ Add-ons seeded successfully!');
    } catch (error) {
        console.error('❌ Error seeding add-ons:', error);
    }
}

if (require.main === module) {
    seedAddOns()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}
