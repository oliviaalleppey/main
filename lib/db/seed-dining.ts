import { db } from './index';
import { diningOutlets } from './schema';

async function seedDining() {
    console.log('🍽️  Seeding dining outlets...');

    const outlets = [
        {
            name: 'Finishing Point',
            slug: 'finishing-point',
            description: 'Our signature all-day dining restaurant offering an exquisite blend of local Kerala flavors and international cuisine. With panoramic views of Vembanad Lake, Finishing Point provides an elegant setting for breakfast, lunch, and dinner.',
            shortDescription: 'All-day dining with local and global cuisine',
            capacity: 94,
            openingTime: '07:00 HRS',
            closingTime: '23:00 HRS',
            operatingHours: '07:00 HRS to 23:00 HRS',
            cuisineType: 'Local & Global',
            outletType: 'restaurant',
            location: 'Lobby Level',
            floor: 0,
            status: 'operational' as const,
            isFeatured: true,
            sortOrder: 1,
            isActive: true,
            reservationRequired: false,
            specialFeatures: ['Lake View', 'Outdoor Seating', 'Live Cooking Stations'],
        },
        {
            name: 'Brew Bar',
            slug: 'brew-bar',
            description: 'A cozy 24-hour café serving premium coffee, fresh pastries, and light bites. Perfect for a quick breakfast, afternoon tea, or late-night snack. Our baristas craft specialty beverages using locally sourced ingredients.',
            shortDescription: '24-hour café with premium coffee and light bites',
            capacity: 24,
            openingTime: '24 Hours',
            closingTime: '24 Hours',
            operatingHours: '24 Hours',
            cuisineType: 'Short Bites and Refreshments',
            outletType: 'cafe',
            location: 'Lobby Level',
            floor: 0,
            status: 'operational' as const,
            isFeatured: false,
            sortOrder: 2,
            isActive: true,
            reservationRequired: false,
            specialFeatures: ['24/7 Service', 'Specialty Coffee', 'Fresh Pastries'],
        },
        {
            name: 'In-Room Dining',
            slug: 'in-room-dining',
            description: 'Enjoy the finest culinary experiences in the comfort and privacy of your room. Our 24-hour in-room dining service offers an extensive menu featuring local delicacies and international favorites, delivered with impeccable service.',
            shortDescription: '24-hour room service with extensive menu',
            capacity: 88,
            openingTime: '24 Hours',
            closingTime: '24 Hours',
            operatingHours: '24 Hours',
            cuisineType: 'Local & Global',
            outletType: 'room_service',
            location: 'All Rooms and Suites',
            floor: null,
            status: 'operational' as const,
            isFeatured: false,
            sortOrder: 3,
            isActive: true,
            reservationRequired: false,
            specialFeatures: ['24/7 Service', 'Private Dining', 'Customizable Menu'],
        },
        {
            name: 'Aqua Pool Lounge',
            slug: 'aqua-pool-lounge',
            description: 'Relax by the poolside with refreshing beverages and light snacks. Aqua Pool Lounge offers a tranquil setting with stunning lake views, perfect for unwinding after a swim or enjoying a lazy afternoon.',
            shortDescription: 'Poolside lounge with refreshments',
            capacity: 24,
            openingTime: '07:00 HRS',
            closingTime: '19:00 HRS',
            operatingHours: '07:00 HRS to 19:00 HRS',
            cuisineType: 'Short Bites and Refreshments',
            outletType: 'lounge',
            location: '3rd Floor',
            floor: 3,
            status: 'operational' as const,
            isFeatured: false,
            sortOrder: 4,
            isActive: true,
            reservationRequired: false,
            specialFeatures: ['Poolside Setting', 'Lake View', 'Healthy Options'],
        },
        {
            name: 'Kaayal',
            slug: 'kaayal',
            description: 'Experience the finest seafood dining at Kaayal, our upcoming specialty restaurant. Featuring live seafood selections and authentic Kerala coastal cuisine, Kaayal will offer an immersive culinary journey celebrating the bounty of the backwaters.',
            shortDescription: 'Specialty seafood restaurant (Opening Soon)',
            capacity: 72,
            openingTime: '19:00 HRS',
            closingTime: '23:00 HRS',
            operatingHours: '19:00 HRS to 23:00 HRS (as per Local Government regulations)',
            cuisineType: 'Live Seafood - Global & Local (Bar & Beverages)',
            outletType: 'restaurant',
            location: '3rd Floor',
            floor: 3,
            status: 'upcoming' as const,
            isFeatured: true,
            sortOrder: 5,
            isActive: true,
            reservationRequired: true,
            specialFeatures: ['Live Seafood Selection', 'Coastal Cuisine', 'Waterfront Dining'],
        },
        {
            name: 'Club 9',
            slug: 'club-9',
            description: 'An intimate bar and lounge offering premium spirits, craft cocktails, and fine wines. Club 9 will be the perfect spot for evening gatherings, featuring live music and a sophisticated ambiance.',
            shortDescription: 'Premium bar and lounge (Opening Soon)',
            capacity: 44,
            openingTime: '11:00 HRS',
            closingTime: '23:00 HRS',
            operatingHours: '11:00 HRS to 23:00 HRS (as per Local Government regulations)',
            cuisineType: 'Bar & Beverage',
            outletType: 'bar',
            location: '1st Floor',
            floor: 1,
            status: 'upcoming' as const,
            isFeatured: false,
            sortOrder: 6,
            isActive: true,
            reservationRequired: false,
            specialFeatures: ['Craft Cocktails', 'Live Music', 'Premium Spirits'],
        },
        {
            name: 'The Oak Room',
            slug: 'the-oak-room',
            description: 'A classic bar with timeless elegance, The Oak Room will offer an extensive selection of premium beverages in a refined setting. Perfect for business meetings or intimate conversations over expertly crafted drinks.',
            shortDescription: 'Classic bar with premium beverages (Opening Soon)',
            capacity: 92,
            openingTime: '11:00 HRS',
            closingTime: '23:00 HRS',
            operatingHours: '11:00 HRS to 23:00 HRS (as per Local Government regulations)',
            cuisineType: 'Bar & Beverage',
            outletType: 'bar',
            location: 'Lobby Level',
            floor: 0,
            status: 'upcoming' as const,
            isFeatured: false,
            sortOrder: 7,
            isActive: true,
            reservationRequired: false,
            specialFeatures: ['Premium Beverages', 'Classic Ambiance', 'Business Friendly'],
        },
    ];

    try {
        for (const outlet of outlets) {
            await db.insert(diningOutlets).values(outlet);
            console.log(`✓ Added ${outlet.name}`);
        }
        console.log('✅ Dining outlets seeded successfully!');
    } catch (error) {
        console.error('❌ Error seeding dining outlets:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    seedDining()
        .then(() => {
            console.log('Done!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Failed:', error);
            process.exit(1);
        });
}

export { seedDining };
