import { db } from '../db';
import { bookings, bookingAddOns, roomInventory, guestProfiles } from '../db/schema';
import { eq, and } from 'drizzle-orm';

interface CreateBookingParams {
    // Room & Dates
    roomTypeId: string;
    checkIn: Date;
    checkOut: Date;

    // Guest Info
    guestName: string;
    guestEmail: string;
    guestPhone: string;

    // Booking Details
    adults: number;
    children: number;
    specialRequests?: string;

    // Pricing
    baseAmount: number; // Room charges (excluding taxes)
    taxAmount: number;
    totalAmount: number;

    // Add-ons
    selectedAddOns?: Array<{
        addOnId: string;
        quantity: number;
        price: number;
    }>;
}

interface CreateBookingResult {
    success: boolean;
    bookingId?: string;
    bookingNumber?: string;
    error?: string;
}

/**
 * Generate unique booking reference number
 * Format: OLV-YYYYMMDD-XXXX (e.g., OLV-20260216-A1B2)
 */
function generateBookingNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `OLV-${dateStr}-${random}`;
}

/**
 * Create a pending booking (awaiting payment confirmation)
 */
export async function createPendingBooking(params: CreateBookingParams): Promise<CreateBookingResult> {
    try {
        // 1. Generate booking number
        const bookingNumber = generateBookingNumber();

        // 2. Check/Create guest profile
        let guestProfile = await db.query.guestProfiles.findFirst({
            where: eq(guestProfiles.email, params.guestEmail)
        });

        if (!guestProfile) {
            const [newProfile] = await db.insert(guestProfiles).values({
                email: params.guestEmail,
                firstName: params.guestName.split(' ')[0],
                lastName: params.guestName.split(' ').slice(1).join(' ') || '',
                phone: params.guestPhone,
            }).returning();
            guestProfile = newProfile;
        }

        // 3. Create booking record
        const [booking] = await db.insert(bookings).values({
            bookingNumber,
            guestProfileId: guestProfile.id,
            guestName: params.guestName,
            guestEmail: params.guestEmail,
            guestPhone: params.guestPhone,
            checkIn: params.checkIn.toISOString().split('T')[0],
            checkOut: params.checkOut.toISOString().split('T')[0],
            adults: params.adults,
            children: params.children,
            // roomId is left null - will be assigned when payment is confirmed
            baseAmount: params.baseAmount,
            taxAmount: params.taxAmount,
            totalAmount: params.totalAmount,
            subtotal: params.baseAmount + params.taxAmount,
            specialRequests: params.specialRequests || '',
            status: 'pending', // Pending payment
            paymentStatus: 'pending',
        }).returning();

        // 4. Add selected add-ons
        if (params.selectedAddOns && params.selectedAddOns.length > 0) {
            const addOnRecords = params.selectedAddOns.map(addon => ({
                bookingId: booking.id,
                addOnId: addon.addOnId,
                quantity: addon.quantity,
                price: addon.price,
                subtotal: addon.price * addon.quantity,
            }));

            await db.insert(bookingAddOns).values(addOnRecords);
        }

        // 5. Lock inventory for the booking dates
        const currentDate = new Date(params.checkIn);
        const checkOutDate = new Date(params.checkOut);

        while (currentDate < checkOutDate) {
            const dateStr = currentDate.toISOString().split('T')[0];

            // Check if inventory record exists for this date
            const existing = await db.query.roomInventory.findFirst({
                where: and(
                    eq(roomInventory.roomTypeId, params.roomTypeId),
                    eq(roomInventory.date, dateStr)
                )
            });

            if (existing) {
                // Update existing record - decrease available rooms
                await db.update(roomInventory)
                    .set({
                        availableRooms: Math.max(0, (existing.availableRooms || 0) - 1),
                    })
                    .where(eq(roomInventory.id, existing.id));
            } else {
                // Create new inventory record (room is now booked)
                await db.insert(roomInventory).values({
                    roomTypeId: params.roomTypeId,
                    date: dateStr,
                    totalRooms: 1,
                    availableRooms: 0,
                    price: params.baseAmount, // Store the booked price
                });
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return {
            success: true,
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
        };

    } catch (error) {
        console.error('Error creating booking:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
}
