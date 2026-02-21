import { db } from '@/lib/db';
import { rooms, roomTypes, roomAttributes, roomAttributeValues } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { RoomDetailClient } from '@/components/admin/room-detail-client';

export default async function EditRoomPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Fetch room with room type details
    const room = await db.query.rooms.findFirst({
        where: eq(rooms.id, id),
        with: {
            roomType: true,
        },
    });

    if (!room) {
        notFound();
    }

    // Fetch all room types for dropdown
    const allRoomTypes = await db.select({
        id: roomTypes.id,
        name: roomTypes.name,
    }).from(roomTypes);

    // Fetch all available attributes
    const allAttributes = await db.select().from(roomAttributes).where(eq(roomAttributes.isActive, true));

    // Fetch current attribute values for this room
    const currentAttributes = await db.select({
        attributeId: roomAttributeValues.attributeId,
        value: roomAttributeValues.value,
        notes: roomAttributeValues.notes,
    }).from(roomAttributeValues).where(eq(roomAttributeValues.roomId, id));

    return (
        <RoomDetailClient
            room={room}
            roomTypes={allRoomTypes}
            allAttributes={allAttributes}
            currentAttributes={currentAttributes}
        />
    );
}
