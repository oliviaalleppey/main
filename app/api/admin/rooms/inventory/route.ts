import { auth } from '@/auth';
import { createRoom, getRooms } from '@/lib/services/room-management';
import { roomSchema } from '@/lib/validations/room';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validated = roomSchema.parse(body);

        const newRoom = await createRoom(validated);

        return NextResponse.json(newRoom[0]);
    } catch (error: any) {
        console.error('Error creating room:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create room' },
            { status: 400 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const roomTypeId = searchParams.get('roomTypeId') || undefined;

        const rooms = await getRooms(roomTypeId);
        return NextResponse.json(rooms);
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Failed to fetch rooms' },
            { status: 500 }
        );
    }
}
