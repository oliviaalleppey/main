import { db } from './index';
import { roomTypes, rooms, addOns, adminUsers } from './schema';
import bcrypt from 'bcryptjs';

/**
 * Seed database with initial data for Olivia International Hotel
 */
export async function seedDatabase() {
    console.log('🌱 Seeding database...');

    try {
        // 1. Create Room Types
        console.log('Creating room types...');

        const balconyRoom = await db.insert(roomTypes).values({
            name: 'Balcony Room',
            slug: 'balcony-room',
            description: 'Experience luxury with a view. Our Balcony Rooms feature a private balcony overlooking the serene landscapes of Alappuzha, perfect for your morning coffee or evening relaxation.',
            shortDescription: 'Entry-level luxury with private balcony and stunning views',
            basePrice: 1500000, // ₹15,000 in paise
            maxGuests: 2,
            size: 325,
            bedType: 'King or Queen Bed',
            amenities: [
                'Private Balcony',
                'Air Conditioning',
                'LED TV',
                'Mini Bar',
                'Tea/Coffee Maker',
                'Free Wi-Fi',
                'Room Service',
                'Premium Toiletries',
                'Safe Deposit Box',
            ],
            status: 'active',
            sortOrder: 1,
        }).returning();

        const deluxeRoom = await db.insert(roomTypes).values({
            name: 'Deluxe Room',
            slug: 'deluxe-room',
            description: 'Indulge in spacious comfort. Our Deluxe Rooms offer enhanced amenities and a more generous layout, designed for guests who appreciate the finer details of luxury hospitality.',
            shortDescription: 'Enhanced amenities with spacious layout and premium bedding',
            basePrice: 2000000, // ₹20,000 in paise
            maxGuests: 3,
            size: 425,
            bedType: 'King Bed',
            amenities: [
                'Spacious Layout',
                'Premium Bedding',
                'Air Conditioning',
                'LED TV',
                'Mini Bar',
                'Tea/Coffee Maker',
                'Free Wi-Fi',
                'Room Service',
                'Premium Toiletries',
                'Safe Deposit Box',
                'Work Desk',
                'Seating Area',
            ],
            status: 'active',
            sortOrder: 2,
        }).returning();

        const superiorDeluxeRoom = await db.insert(roomTypes).values({
            name: 'Superior Deluxe Room',
            slug: 'superior-deluxe-room',
            description: 'Elevate your stay with premium sophistication. Superior Deluxe Rooms feature upgraded furnishings, a dedicated sitting area, and exclusive amenities for the discerning traveler.',
            shortDescription: 'Premium category with upgraded furnishings and sitting area',
            basePrice: 2500000, // ₹25,000 in paise
            maxGuests: 3,
            size: 525,
            bedType: 'King Bed',
            amenities: [
                'Premium Furnishings',
                'Sitting Area',
                'Air Conditioning',
                'LED TV',
                'Mini Bar',
                'Nespresso Machine',
                'Free Wi-Fi',
                '24/7 Room Service',
                'Luxury Toiletries',
                'Safe Deposit Box',
                'Work Desk',
                'Bathrobe & Slippers',
                'Complimentary Newspaper',
            ],
            status: 'active',
            sortOrder: 3,
        }).returning();

        const suiteRoom = await db.insert(roomTypes).values({
            name: 'Suite Room',
            slug: 'suite-room',
            description: 'The pinnacle of luxury living. Our Suite Rooms offer a separate living area, premium amenities, and unparalleled space for guests seeking the ultimate in comfort and elegance.',
            shortDescription: 'Ultimate luxury with separate living area and premium amenities',
            basePrice: 3500000, // ₹35,000 in paise
            maxGuests: 4,
            size: 750,
            bedType: 'King Bed + Sofa Bed',
            amenities: [
                'Separate Living Area',
                'Master Bedroom',
                'Premium Furnishings',
                'Air Conditioning',
                'LED TV (Multiple)',
                'Mini Bar',
                'Nespresso Machine',
                'Free Wi-Fi',
                '24/7 Butler Service',
                'Luxury Toiletries',
                'Safe Deposit Box',
                'Work Desk',
                'Bathrobe & Slippers',
                'Complimentary Newspaper',
                'Dining Area',
                'Jacuzzi',
            ],
            status: 'active',
            sortOrder: 4,
        }).returning();

        console.log('✅ Room types created');

        // 2. Create Individual Rooms (10 of each type = 40 total)
        console.log('Creating individual rooms...');

        const roomsToCreate = [];

        // Balcony Rooms (101-110)
        for (let i = 1; i <= 10; i++) {
            roomsToCreate.push({
                roomTypeId: balconyRoom[0].id,
                roomNumber: `10${i}`,
                floor: 1,
                status: 'active' as const,
            });
        }

        // Deluxe Rooms (201-210)
        for (let i = 1; i <= 10; i++) {
            roomsToCreate.push({
                roomTypeId: deluxeRoom[0].id,
                roomNumber: `20${i}`,
                floor: 2,
                status: 'active' as const,
            });
        }

        // Superior Deluxe Rooms (301-310)
        for (let i = 1; i <= 10; i++) {
            roomsToCreate.push({
                roomTypeId: superiorDeluxeRoom[0].id,
                roomNumber: `30${i}`,
                floor: 3,
                status: 'active' as const,
            });
        }

        // Suite Rooms (401-410)
        for (let i = 1; i <= 10; i++) {
            roomsToCreate.push({
                roomTypeId: suiteRoom[0].id,
                roomNumber: `40${i}`,
                floor: 4,
                status: 'active' as const,
            });
        }

        await db.insert(rooms).values(roomsToCreate);
        console.log('✅ 40 rooms created');

        // 3. Create Add-Ons
        console.log('Creating add-ons...');

        await db.insert(addOns).values([
            {
                name: 'Airport Transfer',
                description: 'Complimentary pickup and drop from Cochin International Airport',
                price: 250000, // ₹2,500
                type: 'per_unit',
                icon: 'car',
                isActive: true,
                sortOrder: 1,
            },
            {
                name: 'Breakfast Buffet',
                description: 'Daily breakfast buffet at our fine dining restaurant',
                price: 150000, // ₹1,500 per person
                type: 'per_person',
                icon: 'utensils',
                isActive: true,
                sortOrder: 2,
            },
            {
                name: 'Spa Treatment',
                description: '60-minute relaxation massage at our luxury spa',
                price: 300000, // ₹3,000 per person
                type: 'per_person',
                icon: 'spa',
                isActive: true,
                sortOrder: 3,
            },
            {
                name: 'Romantic Dinner',
                description: 'Private candlelight dinner for two at our rooftop restaurant',
                price: 500000, // ₹5,000
                type: 'per_unit',
                icon: 'heart',
                isActive: true,
                sortOrder: 4,
            },
            {
                name: 'Early Check-in',
                description: 'Check-in from 10 AM (subject to availability)',
                price: 100000, // ₹1,000
                type: 'per_unit',
                icon: 'clock',
                isActive: true,
                sortOrder: 5,
            },
            {
                name: 'Late Check-out',
                description: 'Check-out until 4 PM (subject to availability)',
                price: 100000, // ₹1,000
                type: 'per_unit',
                icon: 'clock',
                isActive: true,
                sortOrder: 6,
            },
        ]);

        console.log('✅ Add-ons created');

        // 4. Create Admin User
        console.log('Creating admin user...');

        const hashedPassword = await bcrypt.hash(
            process.env.ADMIN_PASSWORD || 'admin123',
            10
        );

        await db.insert(adminUsers).values({
            name: 'Admin',
            email: process.env.ADMIN_EMAIL || 'admin@oliviahotel.com',
            password: hashedPassword,
            role: 'admin',
            isActive: true,
        });

        console.log('✅ Admin user created');
        console.log('\n🎉 Database seeded successfully!');
        console.log('\n📋 Summary:');
        console.log('- 4 Room Types: Balcony, Deluxe, Superior Deluxe, Suite');
        console.log('- 40 Individual Rooms (10 of each type)');
        console.log('- 6 Add-ons available');
        console.log('- 1 Admin user');
        console.log(`\n🔐 Admin Login: ${process.env.ADMIN_EMAIL || 'admin@oliviahotel.com'}`);
        console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
}

// Run seed if called directly
if (require.main === module) {
    seedDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
