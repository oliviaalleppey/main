import type { Metadata } from "next";
import RoomsClient from "@/components/rooms/rooms-client";
import { getRoomTypes } from "@/lib/services/room-management";
import { db } from "@/lib/db";
import { roomInventory } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/structured-data";

export const revalidate = 0;

export const metadata: Metadata = pageMetadata({
    title: "Rooms & Suites",
    description:
        "Explore luxury rooms and suites at Olivia Alleppey, Alappuzha. Lake-view and canal-view rooms, balcony suites and the Boat Race Suite, with premium amenities and direct-booking rates.",
    path: "/rooms",
});

export default async function RoomsPage() {
    const rooms = await getRoomTypes();

    // Fetch today's price overrides and apply them
    const today = new Date().toISOString().split('T')[0];
    const roomTypeIds = rooms.map((r) => r.id);
    const todayOverrides = roomTypeIds.length > 0
        ? await db.select({ roomTypeId: roomInventory.roomTypeId, price: roomInventory.price })
            .from(roomInventory)
            .where(and(
                eq(roomInventory.date, today),
                inArray(roomInventory.roomTypeId, roomTypeIds),
            ))
        : [];
    const overrideMap = new Map(todayOverrides.map((o) => [o.roomTypeId, o.price]));

    // Serialize dates to strings to avoid passing Date objects to client component
    const serializedRooms = rooms.map(room => ({
        ...room,
        basePrice: overrideMap.get(room.id) ?? room.basePrice,
        createdAt: room.createdAt?.toISOString(),
        updatedAt: room.updatedAt?.toISOString(),
        images: room.images || [],
    }));

    return (
        <main className="min-h-screen bg-[var(--surface-cream)] font-sans selection:bg-[var(--gold-accent)] selection:text-white">
            <JsonLd data={breadcrumbSchema([{ name: "Rooms & Suites", path: "/rooms" }])} />
            <RoomsClient rooms={serializedRooms} />
        </main>
    );
}
