
import 'dotenv/config';
import { db } from './index';
import { roomTypes, rooms } from './schema';
import { sql } from 'drizzle-orm';

/**
 * Seed database with REAL inventory for Olivia International Hotel
 * Total 88 rooms across 6 categories.
 */
export async function seedRealRooms() {
    console.log('🌱 Seeding REAL room inventory...');

    try {
        // 0. Clean up existing data (optional, but good for clean slate)
        console.log('Cleaning up existing rooms and types...');
        // Note: Delete rooms first due to foreign key constraint
        await db.delete(rooms);
        await db.delete(roomTypes);

        // 1. Create Room Types
        console.log('Creating 6 real room types...');

        const [twinRoom] = await db.insert(roomTypes).values({
            name: 'Lake View Twin Room',
            slug: 'lake-view-twin',
            description: 'Elegant twin room offering peaceful views of the lake. Perfect for friends or family seeking a tranquil stay.',
            shortDescription: 'Serene twin comfort by the water',
            basePrice: 1200000, // ₹12,000 in paise
            minOccupancy: 1,
            baseOccupancy: 2,
            maxGuests: 2,
            maxAdults: 2,
            maxChildren: 1,
            size: 325,
            bedType: 'Twin Beds',
            amenities: ['Lake Views', 'Twin Beds', 'Work Desk', 'Rain Shower', 'Free Wi-Fi', 'Air Conditioning'],
            images: ['/images/rooms/balcony-room-3.jpg'],
            status: 'active',
            sortOrder: 1,
        }).returning();

        const [kingRoom] = await db.insert(roomTypes).values({
            name: 'Canal View King Room',
            slug: 'canal-view-king',
            description: 'Spacious King room overlooking the vibrant canal. Immerse yourself in the local atmosphere from your private window.',
            shortDescription: 'Majestic views of the waterways',
            basePrice: 1500000, // ₹15,000 in paise
            minOccupancy: 1,
            baseOccupancy: 2,
            maxGuests: 2,
            maxAdults: 2,
            maxChildren: 1,
            size: 380,
            bedType: 'King Bed',
            amenities: ['Canal Views', 'King Bed', 'Seating Area', 'Luxury Toiletries', 'Free Wi-Fi', 'Air Conditioning'],
            images: ['/images/rooms/balcony-room-2.jpg'],
            status: 'active',
            sortOrder: 2,
        }).returning();

        const [familyRoom] = await db.insert(roomTypes).values({
            name: 'Canal View Superior Family Room',
            slug: 'canal-view-superior-family',
            description: 'Expansive family room with superior amenities and canal views. Designed for comfort and togetherness.',
            shortDescription: 'Generous space for the whole family',
            basePrice: 1800000, // ₹18,000 in paise
            minOccupancy: 2,
            baseOccupancy: 2,
            maxGuests: 4,
            maxAdults: 3,
            maxChildren: 3,
            size: 525,
            bedType: '2 Queen Beds',
            amenities: ['Canal Views', 'Spacious Layout', 'Family Friendly', 'Sitting Area', 'Free Wi-Fi', 'Air Conditioning'],
            images: ['/images/rooms/balcony-room-3.jpg'],
            status: 'active',
            sortOrder: 3,
        }).returning();

        const [suiteRoom] = await db.insert(roomTypes).values({
            name: 'Boat Race Finish Line View Suite',
            slug: 'boat-race-suite',
            description: 'Exclusive suite offering a prime view of the legendary Nehru Trophy Boat Race finish line. Unmatched heritage experience.',
            shortDescription: 'The best seat in the house',
            basePrice: 2800000, // ₹28,000 in paise
            minOccupancy: 1,
            baseOccupancy: 2,
            maxGuests: 3,
            maxAdults: 3,
            maxChildren: 2,
            size: 750,
            bedType: 'King Bed',
            amenities: ['Premium Race View', 'Luxury Suite', 'Butler Service', 'Private Balcony', 'Free Wi-Fi', 'Air Conditioning'],
            images: ['/images/rooms/balcony-room-5.jpg'],
            status: 'active',
            sortOrder: 4,
        }).returning();

        const [balconyRoom] = await db.insert(roomTypes).values({
            name: 'Lake View Balcony Rooms',
            slug: 'lake-view-balcony',
            description: 'Charming room featuring a private balcony with sweeping lake views. Enjoy your morning coffee with a breeze.',
            shortDescription: 'Private outdoor serenity',
            basePrice: 2200000, // ₹22,000 in paise
            minOccupancy: 1,
            baseOccupancy: 2,
            maxGuests: 2,
            maxAdults: 2,
            maxChildren: 1,
            size: 400,
            bedType: 'King Bed',
            amenities: ['Private Balcony', 'Lake Views', 'Outdoor Seating', 'Premium Bedding', 'Free Wi-Fi', 'Air Conditioning'],
            images: ['/images/rooms/balcony-room-4.jpg'],
            status: 'active',
            sortOrder: 5,
        }).returning();

        const [balconySuite] = await db.insert(roomTypes).values({
            name: 'Lake View Balcony Suite',
            slug: 'lake-view-balcony-suite',
            description: 'Our most exclusive suite with a large private balcony and panoramic lake views. A sanctuary of luxury and privacy.',
            shortDescription: 'The ultimate lakeside luxury',
            basePrice: 4500000, // ₹45,000 in paise
            minOccupancy: 1,
            baseOccupancy: 2,
            maxGuests: 4,
            maxAdults: 3,
            maxChildren: 3,
            size: 900,
            bedType: 'King Bed + Living Area',
            amenities: ['Large Private Balcony', 'Separate Living Room', 'Jacuzzi', 'Panoramic Views', 'Butler Service', 'Free Wi-Fi'],
            images: ['/images/rooms/balcony-room-5.jpg'],
            status: 'active',
            sortOrder: 6,
        }).returning();

        console.log('✅ 6 Room types created');

        // 2. Create Individual Rooms
        console.log('Creating individual rooms...');

        const roomsToCreate: any[] = [];

        // Helper to add rooms
        const addRooms = (typeId: string, numbers: string[]) => {
            numbers.forEach(num => {
                roomsToCreate.push({
                    roomTypeId: typeId,
                    roomNumber: num.toString(),
                    floor: parseInt(num.toString()[0]), // 202 -> 2nd floor, 302 -> 3rd floor
                    status: 'active',
                });
            });
        };

        // 1. Lake View Twin Room (21 rooms)
        // 202 / 203 / 204 / 302 / 303 / 304 / 402 / 403 / 404 / 502 / 503 / 504 / 602 / 603 / 604 / 702 / 703 / 704 / 802 / 803 / 804
        addRooms(twinRoom.id, [
            '202', '203', '204',
            '302', '303', '304',
            '402', '403', '404',
            '502', '503', '504',
            '602', '603', '604',
            '702', '703', '704',
            '802', '803', '804'
        ]);

        // 2. Canal View King Room (40 rooms)
        // 306-311, 406-411, 506-511, 514, 606-611, 614, 706-711, 714, 806-811, 814
        const floors = ['3', '4', '5', '6', '7', '8'];
        floors.forEach(f => {
            // x06 to x11
            const floorRooms = ['06', '07', '08', '09', '10', '11'].map(suffix => `${f}${suffix}`);
            // Special cases: 514, 614, 714, 814
            if (['5', '6', '7', '8'].includes(f)) {
                floorRooms.push(`${f}14`);
            }
            addRooms(kingRoom.id, floorRooms);
        });

        // 3. Canal View Superior Family Room (7 rooms)
        // 212, 312, 412, 512, 612, 712, 812
        addRooms(familyRoom.id, ['212', '312', '412', '512', '612', '712', '812']);

        // 4. Boat Race Finish Line View Suite (13 rooms)
        // 201, 301/305, 401/405, 501/505, 601/605, 701/705, 801/805
        addRooms(suiteRoom.id, ['201']);
        ['3', '4', '5', '6', '7', '8'].forEach(f => {
            addRooms(suiteRoom.id, [`${f}01`, `${f}05`]);
        });

        // 5. Lake View Balcony Rooms (6 rooms)
        // 206/207/208/209/210/211
        addRooms(balconyRoom.id, ['206', '207', '208', '209', '210', '211']);

        // 6. Lake View Balcony Suite (1 room)
        // 205
        addRooms(balconySuite.id, ['205']);

        console.log(`Preparing to insert ${roomsToCreate.length} rooms...`);

        // Chunk inserts to avoid query size limits if necessary, though 88 is small
        await db.insert(rooms).values(roomsToCreate);

        console.log(`✅ ${roomsToCreate.length} individual rooms created`);
        console.log('\n🎉 Real inventory seeded successfully!');

    } catch (error) {
        console.error('❌ Error seeding real rooms:', error);
        throw error;
    }
}

// Run seed if called directly
if (require.main === module) {
    seedRealRooms()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}
