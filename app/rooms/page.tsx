import type { Metadata } from "next";
import RoomsClient from "@/components/rooms/rooms-client";
import { getRoomTypes } from "@/lib/services/room-management";
import { db } from "@/lib/db";
import { roomInventory } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export const revalidate = 0;

export const metadata: Metadata = {
    title: "Rooms & Suites | Olivia International Hotel",
    description: "Explore our luxury rooms and suites at Olivia International Hotel, Alappuzha. Lake views, canal views, and premium amenities await.",
    openGraph: {
        title: "Rooms & Suites | Olivia International Hotel",
        description: "Explore our luxury rooms and suites at Olivia International Hotel, Alappuzha.",
        type: "website",
        url: "https://oliviaalleppey.com/rooms",
        siteName: "Olivia International Hotel",
        images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Rooms at Olivia International Hotel" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "Rooms & Suites | Olivia International Hotel",
        description: "Explore our luxury rooms and suites at Olivia International Hotel, Alappuzha.",
        images: ["/og-image.jpg"],
    },
    alternates: {
        canonical: "https://oliviaalleppey.com/rooms",
    },
};

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
            <RoomsClient rooms={serializedRooms} />
        </main>
    );
}
