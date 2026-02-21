import { auth } from '@/auth';
import { updateRoomType, deleteRoomType } from '@/lib/services/room-management';
import { roomTypeSchema } from '@/lib/validations/room';
import { NextResponse } from 'next/server';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: roomTypeId } = await params;
        const session = await auth();
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        // Remove id from body if present to avoid validation error or schema conflicts
        const { id: _bodyId, ...data } = body;

        const validated = roomTypeSchema.partial().parse(data);

        const updated = await updateRoomType(roomTypeId, validated);

        if (!updated.length) {
            return NextResponse.json({ error: 'Room type not found' }, { status: 404 });
        }

        return NextResponse.json(updated[0]);
    } catch (error: any) {
        console.error('Error updating room type:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update room type' },
            { status: 400 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await deleteRoomType(id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting room type:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete room type' },
            { status: 400 }
        );
    }
}
