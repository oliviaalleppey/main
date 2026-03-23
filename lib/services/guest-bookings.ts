import { db } from '../db';
import { bookings, bookingItems, roomTypes, addOns, bookingAddOns } from '../db/schema';
import { eq, desc, inArray } from 'drizzle-orm';

export async function getGuestBookings(email: string) {
    try {
        const userBookings = await db
            .select({
                id: bookings.id,
                bookingNumber: bookings.bookingNumber,
                checkIn: bookings.checkIn,
                checkOut: bookings.checkOut,
                adults: bookings.adults,
                children: bookings.children,
                totalAmount: bookings.totalAmount,
                status: bookings.status,
                paymentStatus: bookings.paymentStatus,
                createdAt: bookings.createdAt,
                guestName: bookings.guestName,
                guestEmail: bookings.guestEmail,
                guestPhone: bookings.guestPhone,
                guestAddress: bookings.guestAddress,
                specialRequests: bookings.specialRequests,
                subtotal: bookings.subtotal,
                taxAmount: bookings.taxAmount,
            })
            .from(bookings)
            .where(eq(bookings.guestEmail, email))
            .orderBy(desc(bookings.createdAt));

        const bookingIds = userBookings.map((b) => b.id);

        if (bookingIds.length === 0) {
            return [];
        }

        const items = await db
            .select({
                bookingId: bookingItems.bookingId,
                quantity: bookingItems.quantity,
                nights: bookingItems.nights,
                roomTypeName: roomTypes.name,
                roomTypeId: roomTypes.id,
            })
            .from(bookingItems)
            .innerJoin(roomTypes, eq(bookingItems.roomTypeId, roomTypes.id))
            .where(inArray(bookingItems.bookingId, bookingIds));

        return userBookings.map((booking) => {
            const bItems = items.filter((i) => i.bookingId === booking.id);
            return {
                ...booking,
                items: bItems,
            };
        });
    } catch (error) {
        console.error('Error fetching guest bookings:', error);
        throw new Error('Failed to fetch guest bookings');
    }
}

export async function getGuestBookingById(email: string, bookingId: string) {
    try {
        const bookingRecord = await db
            .select()
            .from(bookings)
            .where(eq(bookings.id, bookingId))
            .limit(1)
            .then((res) => res[0]);

        if (!bookingRecord || bookingRecord.guestEmail !== email) {
            return null;
        }

        const items = await db
            .select({
                id: bookingItems.id,
                roomTypeName: roomTypes.name,
                quantity: bookingItems.quantity,
                nights: bookingItems.nights,
                pricePerNight: bookingItems.pricePerNight,
                subtotal: bookingItems.subtotal,
            })
            .from(bookingItems)
            .innerJoin(roomTypes, eq(bookingItems.roomTypeId, roomTypes.id))
            .where(eq(bookingItems.bookingId, bookingId));

        const selectedAddOns = await db
            .select({
                id: bookingAddOns.id,
                name: addOns.name,
                price: bookingAddOns.price,
                quantity: bookingAddOns.quantity,
                subtotal: bookingAddOns.subtotal,
            })
            .from(bookingAddOns)
            .innerJoin(addOns, eq(bookingAddOns.addOnId, addOns.id))
            .where(eq(bookingAddOns.bookingId, bookingId));

        return {
            ...bookingRecord,
            items,
            addOns: selectedAddOns,
        };
    } catch (error) {
        console.error('Error fetching guest booking detail:', error);
        return null;
    }
}
