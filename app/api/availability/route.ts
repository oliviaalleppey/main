import { getAvailabilityCalendar, checkAvailability } from '@/lib/services/availability';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const roomTypeId = searchParams.get('roomTypeId');
        const start = searchParams.get('start');
        const end = searchParams.get('end');

        if (!roomTypeId || !start || !end) {
            return NextResponse.json(
                { error: 'Missing required parameters: roomTypeId, start, end' },
                { status: 400 }
            );
        }

        const startDate = new Date(start);
        const endDate = new Date(end);

        const calendar = await getAvailabilityCalendar({
            roomTypeId,
            startDate,
            endDate,
        });

        return NextResponse.json(calendar);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch availability';
        console.error('Error fetching availability:', error);
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { roomTypeId, checkIn, checkOut, rooms } = body;

        if (!roomTypeId || !checkIn || !checkOut || !rooms) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const result = await checkAvailability({
            roomTypeId,
            checkIn: new Date(checkIn),
            checkOut: new Date(checkOut),
            rooms,
        });

        return NextResponse.json(result);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to check availability';
        console.error('Error checking availability:', error);
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
