import { auth } from '@/auth';
import { createRoomType, getRoomTypes } from '@/lib/services/room-management';
import { roomTypeSchema } from '@/lib/validations/room';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validated = roomTypeSchema.parse(body);

        const newRoomType = await createRoomType(validated);

        return NextResponse.json(newRoomType[0]);
    } catch (error: any) {
        console.error('Error creating room type:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create room type' },
            { status: 400 }
        );
    }
}

export async function GET() {
    try {
        const types = await getRoomTypes();
        return NextResponse.json(types);
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Failed to fetch room types' },
            { status: 500 }
        );
    }
}
