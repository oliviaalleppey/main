
import 'dotenv/config';
import { db } from '@/lib/db';
import { roomTypes, ratePlans } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    console.log("Seeding rate plans...");

    const allRooms = await db.query.roomTypes.findMany();
    console.log(`Found ${allRooms.length} room types.`);

    if (allRooms.length === 0) {
        console.log("No room types found. Cannot seed rate plans.");
        return;
    }

    for (const room of allRooms) {
        const standardCode = `rp_${room.slug}_standard`; // Unique per room type

        const existing = await db.query.ratePlans.findFirst({
            where: eq(ratePlans.code, standardCode)
        });

        if (!existing) {
            console.log(`Creating rate plan for ${room.name} (${standardCode})`);
            await db.insert(ratePlans).values({
                name: 'Standard Rate',
                code: standardCode,
                roomTypeId: room.id,
                description: 'Best available rate with breakfast included.',
                basePriceModifier: 100,
                includesBreakfast: true,
                cancellationPolicy: 'moderate',
                isActive: true
            });
        } else {
            console.log(`Rate plan ${standardCode} already exists.`);
        }
    }

    console.log("Seeding complete.");
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
