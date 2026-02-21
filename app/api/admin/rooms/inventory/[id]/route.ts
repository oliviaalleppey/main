import { auth } from '@/auth';
import { updateRoom, deleteRoom } from '@/lib/services/room-management';
import { roomSchema } from '@/lib/validations/room';
import { NextResponse } from 'next/server';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id: _bodyId, ...data } = body;

        const validated = roomSchema.partial().parse(data);

        const updated = await updateRoom(id, validated);

        if (!updated.length) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        return NextResponse.json(updated[0]);
    } catch (error: any) {
        console.error('Error updating room:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update room' },
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

        await deleteRoom(id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting room:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete room' },
            { status: 400 }
        );
    }
}
