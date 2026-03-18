import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { addOns, addOnRoomTypes, roomTypes } from '@/lib/db/schema';
import { eq, asc, sql } from 'drizzle-orm';

// Helper to check if table exists
async function tableExists(tableName: string): Promise<boolean> {
    try {
        const result = await db.execute(
            sql`SELECT 1 FROM information_schema.tables WHERE table_name = ${tableName}`
        );
        return (result as any).rowCount > 0;
    } catch {
        return false;
    }
}

// Helper function to get room types for an add-on
async function getRoomTypesForAddOn(addOnId: string): Promise<{ id: string; name: string }[]> {
    const exists = await tableExists('add_on_room_types');
    if (!exists) return [];

    try {
        const roomLinks = await db
            .select({
                id: roomTypes.id,
                name: roomTypes.name,
            })
            .from(addOnRoomTypes)
            .innerJoin(roomTypes, eq(addOnRoomTypes.roomTypeId, roomTypes.id))
            .where(eq(addOnRoomTypes.addOnId, addOnId));
        return roomLinks;
    } catch {
        return [];
    }
}

// Helper function to link add-on to room types
async function linkAddOnToRoomTypes(addOnId: string, roomTypeIds: string[]) {
    const exists = await tableExists('add_on_room_types');
    if (!exists || !roomTypeIds || roomTypeIds.length === 0) return;

    try {
        await db.insert(addOnRoomTypes).values(
            roomTypeIds.map((roomTypeId) => ({
                addOnId,
                roomTypeId,
            }))
        );
    } catch (e) {
        console.error('Failed to link add-on to room types:', e);
    }
}

// Helper function to delete room type links
async function deleteRoomTypeLinks(addOnId: string) {
    const exists = await tableExists('add_on_room_types');
    if (!exists) return;

    try {
        await db
            .delete(addOnRoomTypes)
            .where(eq(addOnRoomTypes.addOnId, addOnId));
    } catch (e) {
        console.error('Failed to delete room type links:', e);
    }
}

// GET - List all add-ons with their room types
export async function GET() {
    try {
        const session = await auth();
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all add-ons
        const allAddOns = await db
            .select()
            .from(addOns)
            .orderBy(asc(addOns.sortOrder), asc(addOns.name));

        // Get room types for each add-on
        const addOnsWithRooms = await Promise.all(
            allAddOns.map(async (addOn) => {
                const roomLinks = await getRoomTypesForAddOn(addOn.id);
                return {
                    ...addOn,
                    roomTypes: roomLinks,
                };
            })
        );

        return NextResponse.json(addOnsWithRooms);
    } catch (error) {
        console.error('Failed to fetch add-ons:', error);
        return NextResponse.json(
            { error: 'Failed to fetch add-ons' },
            { status: 500 }
        );
    }
}

// POST - Create new add-on
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, price, type, icon, isActive, roomTypeIds } = body;

        // Get the highest sort order
        const maxOrder = await db
            .select({ max: sql<number>`MAX(${addOns.sortOrder})` })
            .from(addOns);
        const nextOrder = (maxOrder[0]?.max || 0) + 1;

        // Create the add-on
        const [newAddOn] = await db
            .insert(addOns)
            .values({
                name,
                description,
                price,
                type,
                icon,
                isActive,
                sortOrder: nextOrder,
            })
            .returning();

        // Link to room types if specified
        await linkAddOnToRoomTypes(newAddOn.id, roomTypeIds);

        // Fetch the created add-on with room types
        const roomLinks = await getRoomTypesForAddOn(newAddOn.id);

        return NextResponse.json({
            ...newAddOn,
            roomTypes: roomLinks,
        });
    } catch (error) {
        console.error('Failed to create add-on:', error);
        return NextResponse.json(
            { error: 'Failed to create add-on' },
            { status: 500 }
        );
    }
}

// PUT - Update existing add-on
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, name, description, price, type, icon, isActive, roomTypeIds } = body;

        // Update the add-on
        await db
            .update(addOns)
            .set({
                name,
                description,
                price,
                type,
                icon,
                isActive,
                updatedAt: new Date(),
            })
            .where(eq(addOns.id, id));

        // Delete existing room type links and add new ones
        await deleteRoomTypeLinks(id);
        await linkAddOnToRoomTypes(id, roomTypeIds);

        // Fetch the updated add-on with room types
        const updatedAddOn = await db
            .select()
            .from(addOns)
            .where(eq(addOns.id, id))
            .then(rows => rows[0]);

        const roomLinks = await getRoomTypesForAddOn(id);

        return NextResponse.json({
            ...updatedAddOn,
            roomTypes: roomLinks,
        });
    } catch (error) {
        console.error('Failed to update add-on:', error);
        return NextResponse.json(
            { error: 'Failed to update add-on' },
            { status: 500 }
        );
    }
}

// DELETE - Delete add-on
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Add-on ID required' }, { status: 400 });
        }

        // Delete room type links first
        await deleteRoomTypeLinks(id);

        // Delete the add-on
        await db
            .delete(addOns)
            .where(eq(addOns.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete add-on:', error);
        return NextResponse.json(
            { error: 'Failed to delete add-on' },
            { status: 500 }
        );
    }
}
