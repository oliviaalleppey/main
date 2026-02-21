import { db } from '@/lib/db';
import { roomTypes, rooms, roomImages } from '@/lib/db/schema';
import { eq, asc, desc } from 'drizzle-orm';
import { RoomTypeInput, RoomInput } from '@/lib/validations/room';
import { ensureRoomTypeMinOccupancyColumn } from '@/lib/db/schema-guard';

export async function getRoomTypes() {
    await ensureRoomTypeMinOccupancyColumn();

    return await db.query.roomTypes.findMany({
        orderBy: [asc(roomTypes.sortOrder)],
        with: {
            rooms: true,
        },
    });
}

export async function getRoomType(id: string) {
    await ensureRoomTypeMinOccupancyColumn();

    return await db.query.roomTypes.findFirst({
        where: eq(roomTypes.id, id),
        with: {
            rooms: true,
        },
    });
}

export async function createRoomType(data: RoomTypeInput) {
    await ensureRoomTypeMinOccupancyColumn();
    return await db.insert(roomTypes).values(data).returning();
}

export async function updateRoomType(id: string, data: Partial<RoomTypeInput>) {
    await ensureRoomTypeMinOccupancyColumn();

    return await db.update(roomTypes)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(roomTypes.id, id))
        .returning();
}

export async function deleteRoomType(id: string) {
    // Check if there are rooms associated
    const associatedRooms = await db.query.rooms.findFirst({
        where: eq(rooms.roomTypeId, id),
    });

    if (associatedRooms) {
        throw new Error('Cannot delete room type with associated rooms');
    }

    return await db.delete(roomTypes).where(eq(roomTypes.id, id));
}

export async function getRooms(roomTypeId?: string) {
    if (roomTypeId) {
        return await db.query.rooms.findMany({
            where: eq(rooms.roomTypeId, roomTypeId),
            with: {
                roomType: true,
            },
            orderBy: [asc(rooms.roomNumber)],
        });
    }

    return await db.query.rooms.findMany({
        with: {
            roomType: true,
        },
        orderBy: [asc(rooms.roomNumber)],
    });
}

export async function createRoom(data: RoomInput) {
    return await db.insert(rooms).values(data).returning();
}

export async function updateRoom(id: string, data: Partial<RoomInput>) {
    return await db.update(rooms)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(rooms.id, id))
        .returning();
}

export async function deleteRoom(id: string) {
    // Check for active bookings would go here
    return await db.delete(rooms).where(eq(rooms.id, id));
}
