import { NextRequest, NextResponse } from 'next/server';
import { createPendingBooking } from '@/lib/services/booking-creation';
import { RateLimiter } from '@/lib/rate-limit';
import { z } from 'zod';

// Validation schema
const createBookingSchema = z.object({
    roomTypeId: z.string().uuid(),
    checkIn: z.string(),
    checkOut: z.string(),
    guestName: z.string().min(2),
    guestEmail: z.string().email(),
    guestPhone: z.string().min(10),
    adults: z.number().min(1),
    children: z.number().min(0),
    specialRequests: z.string().optional(),
    baseAmount: z.number().min(0),
    taxAmount: z.number().min(0),
    totalAmount: z.number().min(0),
    selectedAddOns: z.array(z.object({
        addOnId: z.string().uuid(),
        quantity: z.number().min(1),
        price: z.number().min(0),
    })).optional(),
});

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const limit = await RateLimiter.check(ip, '/api/bookings/create');

        if (!limit.allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429 }
            );
        }

        const body = await request.json();

        // Validate input
        const validatedData = createBookingSchema.parse(body);

        // Create booking
        const result = await createPendingBooking({
            ...validatedData,
            checkIn: new Date(validatedData.checkIn),
            checkOut: new Date(validatedData.checkOut),
        });

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to create booking' },
                { status: 400 }
            );
        }

        // TODO: Send confirmation email
        // TODO: Send WhatsApp notification to admin

        return NextResponse.json({
            success: true,
            bookingId: result.bookingId,
            bookingNumber: result.bookingNumber,
        });

    } catch (error) {
        console.error('Booking creation error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid booking data', details: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
