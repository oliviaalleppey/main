'use server';

import { BookingService } from '@/lib/services/booking-service';
import { EasebuzzService } from '@/lib/services/easebuzz';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { RateLimiter } from '@/lib/rate-limit';

const bookingService = new BookingService();

// ... imports ...
import { db } from '@/lib/db';
import { addOns, bookingSessions, ratePlans, roomTypes } from '@/lib/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { ensureRoomTypeMinOccupancyColumn } from '@/lib/db/schema-guard';
import { mapCrsRoomTypeMatchesInternal } from '@/lib/config/crs';
import { getBookingProvider } from '@/lib/providers/crs/factory';
import { formatRoomName } from '@/lib/utils';
import { getAvailableRoomsForSearch } from '@/lib/services/search';

type SelectedAddOnInput = {
    addOnId: string;
    quantity: number;
};

type RoomSelectionInput = {
    roomTypeId: string;
    roomSlug?: string;
    ratePlanId?: string;
    quantity?: number;
    quoteSnapshot?: {
        pricePerNight?: number;
        totalPrice?: number;
        taxesAndFees?: number;
        externalRatePlanId?: string;
        capturedAt?: string;
    };
};

type SessionCartData = {
    quoteSnapshot?: {
        pricePerNight?: number;
        totalPrice?: number;
        taxesAndFees?: number;
        capturedAt?: string;
    };
    roomSelection?: RoomSelectionInput;
    roomSelections?: RoomSelectionInput[];
    selectedAddOns?: SelectedAddOnInput[];
    [key: string]: unknown;
};

function toDateOnlyString(value: string | Date | null | undefined): string {
    if (!value) return '';
    if (typeof value === 'string') return value.slice(0, 10);
    return value.toISOString().slice(0, 10);
}

function sanitizeSelectedAddOns(value: unknown): SelectedAddOnInput[] {
    if (!Array.isArray(value)) return [];

    return value
        .map((entry) => {
            if (!entry || typeof entry !== 'object') return null;

            const addOnId = typeof (entry as { addOnId?: unknown }).addOnId === 'string'
                ? (entry as { addOnId: string }).addOnId
                : '';
            const quantityRaw = (entry as { quantity?: unknown }).quantity;
            const quantity = typeof quantityRaw === 'number'
                ? quantityRaw
                : Number.parseInt(String(quantityRaw || 0), 10);

            if (!addOnId || !Number.isFinite(quantity) || quantity < 1) return null;

            return {
                addOnId,
                quantity: Math.min(10, quantity),
            };
        })
        .filter((entry): entry is SelectedAddOnInput => entry !== null);
}

function sanitizeRoomCount(value: unknown): number {
    const parsed = typeof value === 'number'
        ? value
        : Number.parseInt(String(value || 1), 10);

    if (!Number.isFinite(parsed)) return 1;
    return Math.min(8, Math.max(1, parsed));
}

function sanitizeRoomSelections(value: unknown): RoomSelectionInput[] {
    if (!Array.isArray(value)) return [];

    const selections: RoomSelectionInput[] = [];

    for (const entry of value) {
        if (!entry || typeof entry !== 'object') continue;

        const roomTypeId = typeof (entry as { roomTypeId?: unknown }).roomTypeId === 'string'
            ? (entry as { roomTypeId: string }).roomTypeId
            : '';
        if (!roomTypeId) continue;

        const roomSlug = typeof (entry as { roomSlug?: unknown }).roomSlug === 'string'
            ? (entry as { roomSlug: string }).roomSlug
            : undefined;
        const ratePlanId = typeof (entry as { ratePlanId?: unknown }).ratePlanId === 'string'
            ? (entry as { ratePlanId: string }).ratePlanId
            : undefined;
        const quantity = sanitizeRoomCount((entry as { quantity?: unknown }).quantity);

        const quote = (entry as { quoteSnapshot?: unknown }).quoteSnapshot;
        const quoteSnapshot = quote && typeof quote === 'object'
            ? {
                pricePerNight: typeof (quote as { pricePerNight?: unknown }).pricePerNight === 'number'
                    ? (quote as { pricePerNight: number }).pricePerNight
                    : undefined,
                totalPrice: typeof (quote as { totalPrice?: unknown }).totalPrice === 'number'
                    ? (quote as { totalPrice: number }).totalPrice
                    : undefined,
                taxesAndFees: typeof (quote as { taxesAndFees?: unknown }).taxesAndFees === 'number'
                    ? (quote as { taxesAndFees: number }).taxesAndFees
                    : undefined,
                externalRatePlanId: typeof (quote as { externalRatePlanId?: unknown }).externalRatePlanId === 'string'
                    ? (quote as { externalRatePlanId: string }).externalRatePlanId
                    : undefined,
                capturedAt: typeof (quote as { capturedAt?: unknown }).capturedAt === 'string'
                    ? (quote as { capturedAt: string }).capturedAt
                    : undefined,
            }
            : undefined;

        selections.push({
            roomTypeId,
            roomSlug,
            ratePlanId,
            quantity,
            quoteSnapshot,
        });
    }

    return selections;
}

function getSessionRoomSelections(
    session: typeof bookingSessions.$inferSelect,
    cartData: SessionCartData,
): RoomSelectionInput[] {
    const modernSelections = sanitizeRoomSelections(cartData.roomSelections);
    if (modernSelections.length > 0) return modernSelections;

    if (!session.selectedRoomTypeId) return [];

    return [{
        roomTypeId: session.selectedRoomTypeId,
        ratePlanId: session.selectedRatePlanId || undefined,
        quantity: sanitizeRoomCount(cartData.roomSelection?.quantity),
        quoteSnapshot: cartData.quoteSnapshot,
    }];
}

function normalizeQuoteSnapshotForQuantity(
    quoteSnapshot: RoomSelectionInput['quoteSnapshot'],
    previousQuantity: number,
    nextQuantity: number,
): RoomSelectionInput['quoteSnapshot'] {
    if (!quoteSnapshot) return undefined;

    const safePrevious = Math.max(1, sanitizeRoomCount(previousQuantity));
    const safeNext = Math.max(1, sanitizeRoomCount(nextQuantity));
    const scaledTotalPrice = typeof quoteSnapshot.totalPrice === 'number'
        ? Math.round((quoteSnapshot.totalPrice / safePrevious) * safeNext)
        : undefined;
    const scaledTaxesAndFees = typeof quoteSnapshot.taxesAndFees === 'number'
        ? Math.round((quoteSnapshot.taxesAndFees / safePrevious) * safeNext)
        : undefined;

    return {
        ...quoteSnapshot,
        totalPrice: scaledTotalPrice,
        taxesAndFees: scaledTaxesAndFees,
        capturedAt: new Date().toISOString(),
    };
}

async function persistSessionRoomSelections(
    session: typeof bookingSessions.$inferSelect,
    cartData: SessionCartData,
    nextSelections: RoomSelectionInput[],
): Promise<{ success: boolean; message?: string; totalRooms?: number }> {
    if (!nextSelections.length) {
        return { success: false, message: 'Please keep at least one room type selected.' };
    }

    const adults = session.adults || 1;
    const children = session.children || 0;
    const totalSelectedRooms = nextSelections.reduce(
        (sum, selection) => sum + sanitizeRoomCount(selection.quantity),
        0
    );

    if (totalSelectedRooms > adults + children) {
        return {
            success: false,
            message: 'At least one guest is required per room. Increase guests or reduce selected rooms.',
        };
    }

    const selectedRoomTypeIds = Array.from(new Set(nextSelections.map((selection) => selection.roomTypeId)));
    const selectedRoomTypes = await db.query.roomTypes.findMany({
        where: inArray(roomTypes.id, selectedRoomTypeIds),
        columns: {
            id: true,
            name: true,
            slug: true,
        },
    });
    const selectedRoomTypeMap = new Map(selectedRoomTypes.map((roomType) => [roomType.id, roomType]));

    if (selectedRoomTypes.length !== selectedRoomTypeIds.length) {
        return { success: false, message: 'One or more selected room types are no longer available.' };
    }

    const checkInDateOnly = toDateOnlyString(session.checkIn);
    const checkOutDateOnly = toDateOnlyString(session.checkOut);
    const adultsPerRoom = Math.max(1, Math.ceil(adults / totalSelectedRooms));
    const childrenPerRoom = Math.max(0, Math.ceil(children / totalSelectedRooms));

    const provider = getBookingProvider();
    const availability = await provider.checkAvailability({
        checkIn: checkInDateOnly,
        checkOut: checkOutDateOnly,
        adults: adultsPerRoom,
        children: childrenPerRoom,
    });

    if (availability.status !== 'success') {
        return {
            success: false,
            message: availability.message || 'Live availability check failed. Please try again.',
        };
    }

    for (const selection of nextSelections) {
        const roomType = selectedRoomTypeMap.get(selection.roomTypeId);
        if (!roomType) {
            return { success: false, message: 'One or more selected room types are no longer available.' };
        }

        const matchedAvailability = availability.rooms.find((room) => mapCrsRoomTypeMatchesInternal({
            internalRoomTypeId: roomType.id,
            internalRoomTypeSlug: roomType.slug,
            crsRoomTypeId: room.roomTypeId,
        }));

        if (!matchedAvailability || matchedAvailability.availableCount < sanitizeRoomCount(selection.quantity)) {
            return {
                success: false,
                message: `Only ${matchedAvailability?.availableCount || 0} room(s) available for ${formatRoomName(roomType.name)}.`,
            };
        }
    }

    const primarySelection = nextSelections[0];
    await db.update(bookingSessions).set({
        selectedRoomTypeId: primarySelection.roomTypeId,
        selectedRatePlanId: primarySelection.ratePlanId || session.selectedRatePlanId || null,
        step: 'details',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        cartData: {
            ...cartData,
            roomSelections: nextSelections,
            roomSelection: {
                roomTypeId: primarySelection.roomTypeId,
                roomSlug: primarySelection.roomSlug,
                ratePlanId: primarySelection.ratePlanId,
                quantity: sanitizeRoomCount(primarySelection.quantity),
            },
            quoteSnapshot: primarySelection.quoteSnapshot || cartData.quoteSnapshot,
        },
    }).where(eq(bookingSessions.id, session.id));

    return {
        success: true,
        totalRooms: totalSelectedRooms,
    };
}

async function calculateSessionPayableAmount(sessionId: string): Promise<number> {
    await ensureRoomTypeMinOccupancyColumn();

    const session = await db.query.bookingSessions.findFirst({
        where: eq(bookingSessions.id, sessionId),
    });

    if (!session) throw new Error('Session not found');

    const checkIn = new Date(toDateOnlyString(session.checkIn));
    const checkOut = new Date(toDateOnlyString(session.checkOut));
    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));

    const cartData = (session.cartData as SessionCartData | null) || {};
    const roomSelections = getSessionRoomSelections(session, cartData);
    if (!roomSelections.length) throw new Error('Room not selected');

    const roomTypeIds = Array.from(new Set(roomSelections.map((item) => item.roomTypeId)));
    const roomRows = await db.query.roomTypes.findMany({
        where: inArray(roomTypes.id, roomTypeIds),
        columns: { id: true, basePrice: true, taxRate: true },
    });
    const roomTypePriceMap = new Map(roomRows.map((row) => [row.id, { basePrice: row.basePrice, taxRate: row.taxRate }]));

    const roomSubtotal = roomSelections.reduce((sum, selection) => {
        const quantity = sanitizeRoomCount(selection.quantity);
        const roomData = roomTypePriceMap.get(selection.roomTypeId);
        if (!roomData) {
            throw new Error('Selected room type no longer exists');
        }

        const pricePerNight = selection.quoteSnapshot?.pricePerNight || roomData.basePrice;
        const computed = pricePerNight * nights * quantity;
        const quoted = selection.quoteSnapshot?.totalPrice;
        const lineSubtotal = typeof quoted === 'number' && quoted > 0
            ? Math.max(quoted, computed)
            : computed;

        const taxRate = roomData.taxRate ?? 12;
        const computedTaxes = Math.round(lineSubtotal * (taxRate / 100));
        const quotedTaxes = selection.quoteSnapshot?.taxesAndFees;
        const lineTaxes = typeof quotedTaxes === 'number' && quotedTaxes > 0
            ? quotedTaxes
            : computedTaxes;

        return sum + lineSubtotal + lineTaxes;
    }, 0);

    const selectedAddOns = sanitizeSelectedAddOns(cartData.selectedAddOns);
    const selectedAddOnIds = Array.from(new Set(selectedAddOns.map((entry) => entry.addOnId)));

    if (!selectedAddOnIds.length) {
        return roomSubtotal;
    }

    const addOnRows = await db
        .select({
            id: addOns.id,
            price: addOns.price,
        })
        .from(addOns)
        .where(and(
            inArray(addOns.id, selectedAddOnIds),
            eq(addOns.isActive, true),
        ));

    const addOnPriceMap = new Map(addOnRows.map((row) => [row.id, row.price]));
    const addOnsSubtotal = selectedAddOns.reduce((sum, selected) => {
        const price = addOnPriceMap.get(selected.addOnId);
        if (!price) return sum;
        return sum + (price * selected.quantity);
    }, 0);

    // Add-ons GST is always 18% (add-ons are separate from room taxes).
    const addOnsTax = Math.round(addOnsSubtotal * 0.18);
    return roomSubtotal + addOnsSubtotal + addOnsTax;
}

export async function startBookingSession(
    roomSlug: string,
    searchParams: { checkIn: string; checkOut: string; adults: number; children: number },
    quoteSnapshot?: {
        pricePerNight: number;
        totalPrice: number;
        taxesAndFees: number;
        externalRatePlanId?: string;
    },
    roomCount = 1
): Promise<{ error: string } | void> {
    try {
        await ensureRoomTypeMinOccupancyColumn();
        const safeRoomCount = sanitizeRoomCount(roomCount);
        const checkInDate = new Date(searchParams.checkIn);
        const checkOutDate = new Date(searchParams.checkOut);
        const checkInDateOnly = toDateOnlyString(checkInDate);
        const checkOutDateOnly = toDateOnlyString(checkOutDate);
        const cookieStore = await cookies();

        let session = null as (typeof bookingSessions.$inferSelect | null);
        const existingSessionId = cookieStore.get('booking_session')?.value;
        if (existingSessionId) {
            const existing = await db.query.bookingSessions.findFirst({
                where: eq(bookingSessions.id, existingSessionId),
            });

            if (existing) {
                const isNotExpired = !existing.expiresAt || new Date(existing.expiresAt).getTime() > Date.now();
                const isSameSearch =
                    toDateOnlyString(existing.checkIn) === checkInDateOnly &&
                    toDateOnlyString(existing.checkOut) === checkOutDateOnly &&
                    (existing.adults || 1) === searchParams.adults &&
                    (existing.children || 0) === searchParams.children;

                if (isNotExpired && isSameSearch) {
                    session = existing;
                }
            }
        }

        if (!session) {
            session = await bookingService.createSession({
                checkIn: checkInDate,
                checkOut: checkOutDate,
                adults: searchParams.adults,
                children: searchParams.children,
            });
        }

        // 2. Resolve Room & Rate Plan
        // Instead of hardcoding 'rp_standard', we find the default rate plan for this room.

        // First find room by slug to get ID
        const roomType = await db.query.roomTypes.findFirst({
            where: eq(roomTypes.slug, roomSlug),
        });
        if (!roomType) {
            return { error: `Room type not found: ${roomSlug}` };
        }

        const ratePlan = await db.query.ratePlans.findFirst({
            where: eq(ratePlans.roomTypeId, roomType.id),
            orderBy: (ratePlans, { asc, desc }) => [desc(ratePlans.isDefault), asc(ratePlans.displayOrder)],
        });
        if (!ratePlan) {
            return { error: `No rate plan available for room: ${roomSlug}` };
        }

        const provider = getBookingProvider();
        const availability = await provider.checkAvailability({
            checkIn: checkInDateOnly,
            checkOut: checkOutDateOnly,
            adults: 1,
            children: 0,
        });

        if (availability.status !== 'success') {
            return { error: availability.message || 'Live availability check failed.' };
        }

        const matchedAvailability = availability.rooms.find((room) => mapCrsRoomTypeMatchesInternal({
            internalRoomTypeId: roomType.id,
            internalRoomTypeSlug: roomType.slug,
            crsRoomTypeId: room.roomTypeId,
        }));

        if (!matchedAvailability || matchedAvailability.availableCount < safeRoomCount) {
            return { error: `Only ${matchedAvailability?.availableCount || 0} room(s) available for ${formatRoomName(roomType.name)}.` };
        }

        const cartData = (session.cartData as SessionCartData | null) || {};
        const existingSelections = getSessionRoomSelections(session, cartData).filter(
            (selection) => selection.roomTypeId !== roomType.id
        );

        const normalizedQuoteSnapshot = quoteSnapshot
            ? {
                ...quoteSnapshot,
                totalPrice: quoteSnapshot.totalPrice * safeRoomCount,
                taxesAndFees: quoteSnapshot.taxesAndFees * safeRoomCount,
                capturedAt: new Date().toISOString(),
            }
            : undefined;

        const nextSelections: RoomSelectionInput[] = [
            ...existingSelections,
            {
                roomTypeId: roomType.id,
                roomSlug: roomType.slug,
                ratePlanId: ratePlan.id,
                quantity: safeRoomCount,
                quoteSnapshot: normalizedQuoteSnapshot,
            },
        ];

        const totalSelectedRooms = nextSelections.reduce(
            (sum, selection) => sum + sanitizeRoomCount(selection.quantity),
            0
        );
        if (totalSelectedRooms > searchParams.adults + searchParams.children) {
            return { error: 'At least one guest is required per room. Please increase the number of guests or reduce the number of selected rooms.' };
        }

        await db.update(bookingSessions).set({
            selectedRoomTypeId: roomType.id,
            selectedRatePlanId: ratePlan.id,
            step: 'details',
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            cartData: {
                ...cartData,
                roomSelections: nextSelections,
                roomSelection: {
                    roomTypeId: roomType.id,
                    roomSlug: roomType.slug,
                    ratePlanId: ratePlan.id,
                    quantity: safeRoomCount,
                },
                quoteSnapshot: normalizedQuoteSnapshot || cartData.quoteSnapshot,
            },
        }).where(eq(bookingSessions.id, session.id));

        cookieStore.set('booking_session', session.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 15,
        });

        // 4. Redirect to unified checkout
        redirect('/book/checkout');
    } catch (error: unknown) {
        if (
            error &&
            typeof error === 'object' &&
            'digest' in error &&
            typeof (error as { digest?: string }).digest === 'string' &&
            (error as { digest: string }).digest.startsWith('NEXT_REDIRECT')
        ) {
            throw error;
        }
        console.error('Failed to start booking session:', error);
        return { error: 'An unexpected error occurred while booking. Please try again.' };
    }
}

export async function updateGuestDetails(formData: FormData) {
    const sessionId = (await cookies()).get('booking_session')?.value;
    if (!sessionId) redirect('/book/search');

    const guestDetails = {
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string,
        requests: formData.get('requests') as string,
    };

    // Update Session in DB (We need a method in BookingService for this or just direct DB update)
    // For now, I'll direct DB update here or better add method to BookingService
    // Let's use direct DB for speed in shell, or better:
    // await bookingService.updateGuestDetails(sessionId, guestDetails);

    // I'll add this method to BookingService later or just do it here:
    /*
    await db.update(bookingSessions).set({
        cartData: { ...currentCart, guestDetails } // strictly we should type this
    }).where(eq(bookingSessions.id, sessionId));
    */

    // But `cartData` is json. 
    // I'll leave it for now and handle in `finalizeBooking` which takes `guestDetails`.
    // Actually `finalizeBooking` takes `guestDetails` as arg.
    // But how do we pass it to payment page?
    // We should store it in session.

    // Quick fix: Update session metadata/cartData
    await bookingService.updateSessionCart(sessionId, { guestDetails });

    redirect('/book/checkout');
}

export async function updateSessionAddOns(selectedAddOns: SelectedAddOnInput[]) {
    const sessionId = (await cookies()).get('booking_session')?.value;
    if (!sessionId) {
        return { success: false, message: 'Booking session expired. Please search again.' };
    }

    const sanitized = sanitizeSelectedAddOns(selectedAddOns);
    await bookingService.updateSessionCart(sessionId, { selectedAddOns: sanitized });

    return { success: true };
}

export async function updateSessionRoomSelectionQuantity(roomTypeId: string, quantity: number) {
    const sessionId = (await cookies()).get('booking_session')?.value;
    if (!sessionId) {
        return { success: false, message: 'Booking session expired. Please search again.' };
    }

    const normalizedRoomTypeId = roomTypeId?.trim();
    if (!normalizedRoomTypeId) {
        return { success: false, message: 'Room type is required.' };
    }

    const session = await db.query.bookingSessions.findFirst({
        where: eq(bookingSessions.id, sessionId),
    });
    if (!session) {
        return { success: false, message: 'Booking session expired. Please search again.' };
    }

    const cartData = (session.cartData as SessionCartData | null) || {};
    const existingSelections = getSessionRoomSelections(session, cartData);
    if (!existingSelections.length) {
        return { success: false, message: 'No room selections found. Please select room types again.' };
    }

    const nextQuantity = sanitizeRoomCount(quantity);
    let didUpdate = false;
    const nextSelections = existingSelections.map((selection) => {
        if (selection.roomTypeId !== normalizedRoomTypeId) {
            return selection;
        }

        didUpdate = true;
        const previousQuantity = sanitizeRoomCount(selection.quantity);
        return {
            ...selection,
            quantity: nextQuantity,
            quoteSnapshot: normalizeQuoteSnapshotForQuantity(
                selection.quoteSnapshot,
                previousQuantity,
                nextQuantity,
            ),
        };
    });

    if (!didUpdate) {
        return { success: false, message: 'Selected room type was not found in your cart.' };
    }

    return persistSessionRoomSelections(session, cartData, nextSelections);
}

export async function removeSessionRoomSelection(roomTypeId: string) {
    const sessionId = (await cookies()).get('booking_session')?.value;
    if (!sessionId) {
        return { success: false, message: 'Booking session expired. Please search again.' };
    }

    const normalizedRoomTypeId = roomTypeId?.trim();
    if (!normalizedRoomTypeId) {
        return { success: false, message: 'Room type is required.' };
    }

    const session = await db.query.bookingSessions.findFirst({
        where: eq(bookingSessions.id, sessionId),
    });
    if (!session) {
        return { success: false, message: 'Booking session expired. Please search again.' };
    }

    const cartData = (session.cartData as SessionCartData | null) || {};
    const existingSelections = getSessionRoomSelections(session, cartData);
    if (!existingSelections.length) {
        return { success: false, message: 'No room selections found. Please select room types again.' };
    }

    const nextSelections = existingSelections.filter(
        (selection) => selection.roomTypeId !== normalizedRoomTypeId
    );
    if (nextSelections.length === existingSelections.length) {
        return { success: false, message: 'Selected room type was not found in your cart.' };
    }
    if (!nextSelections.length) {
        return { success: false, message: 'At least one room type is required to continue.' };
    }

    return persistSessionRoomSelections(session, cartData, nextSelections);
}

export async function finalizeBookingAction(paymentDetails: {
    method: string;
    amount: number;
    transactionId?: string;
    orderId?: string;
}) {
    const sessionId = (await cookies()).get('booking_session')?.value;
    if (!sessionId) redirect('/book/search');

    // Rate Limit Check
    const ip = (await headers()).get('x-forwarded-for') || 'unknown';
    const limit = await RateLimiter.check(ip, 'finalizeBookingAction');
    if (!limit.allowed) {
        throw new Error('Too many attempts. Please try again later.');
    }

    try {
        const expectedAmount = await calculateSessionPayableAmount(sessionId);
        const booking = await bookingService.finalizeSession(sessionId, {
            ...paymentDetails,
            amount: expectedAmount,
        });

        if (!booking) {
            throw new Error("Failed to finalize booking");
        }

        // Clear cookie
        (await cookies()).delete('booking_session');

        redirect(`/book/confirmation/${booking.id}`);
    } catch (error: unknown) {
        // Handle error (availability changed, price mismatch)
        const message = error instanceof Error ? error.message : 'Booking finalization failed';
        console.error('Booking Finalization Failed:', message);
        redirect(`/book/checkout?error=${encodeURIComponent(message)}`);
    }
}

/**
 * Step 1 of Easebuzz payment:
 * Creates a pending booking and returns Easebuzz form params so the frontend
 * can POST them directly to the Easebuzz payment URL.
 */
export async function initiateEasebuzzPaymentAction(): Promise<{
    success: boolean;
    error?: string;
    easebuzzPayload?: ReturnType<typeof EasebuzzService.buildPaymentPayload>;
}> {
    const sessionId = (await cookies()).get('booking_session')?.value;
    if (!sessionId) return { success: false, error: 'Session expired. Please search again.' };

    const ip = (await headers()).get('x-forwarded-for') || 'unknown';
    const limit = await RateLimiter.check(ip, 'initiateEasebuzzPaymentAction');
    if (!limit.allowed) return { success: false, error: 'Too many attempts. Please try again.' };

    try {
        const expectedAmount = await calculateSessionPayableAmount(sessionId);

        // Retrieve session guest details
        const session = await db.query.bookingSessions.findFirst({ where: eq(bookingSessions.id, sessionId) });
        if (!session) return { success: false, error: 'Session not found.' };

        const cartData = session.cartData as Record<string, any> | null;
        const guestDetails = cartData?.guestDetails as { firstName?: string; lastName?: string; email?: string; phone?: string } | undefined;

        if (!guestDetails?.firstName || !guestDetails?.email || !guestDetails?.phone) {
            return { success: false, error: 'Guest details are incomplete. Please fill in the guest form again.' };
        }

        // Create the pending booking record in DB
        const txnId = `OL-${Date.now()}`;
        const booking = await bookingService.finalizeSession(sessionId, {
            method: 'easebuzz',
            amount: expectedAmount,
            orderId: txnId,
        });

        if (!booking) return { success: false, error: 'Failed to create booking record.' };

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://oliviaalleppey.com';
        const returnUrl = `${baseUrl}/api/payment/easebuzz`;

        const easebuzzPayload = EasebuzzService.buildPaymentPayload({
            orderId: txnId,
            amount: expectedAmount,
            name: `${guestDetails.firstName} ${guestDetails.lastName || ''}`.trim(),
            email: guestDetails.email,
            phone: guestDetails.phone,
            returnUrl: returnUrl,
        });

        // Clean up session cookie (booking is now pending Easebuzz confirmation)
        (await cookies()).delete('booking_session');

        return { success: true, easebuzzPayload };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Payment initiation failed.';
        console.error('Easebuzz payment initiation failed:', message);
        return { success: false, error: message };
    }
}

export async function updateSessionSearch(params: { checkIn: Date; checkOut: Date; adults: number; children: number }) {
    const sessionId = (await cookies()).get('booking_session')?.value;
    if (!sessionId) {
        return { success: false, message: 'Booking session expired. Please search again.' };
    }

    const session = await db.query.bookingSessions.findFirst({
        where: eq(bookingSessions.id, sessionId),
    });
    if (!session) {
        return { success: false, message: 'Booking session expired. Please search again.' };
    }

    const cartData = (session.cartData as SessionCartData | null) || {};
    
    // Check if the dates are actually different
    const checkInDateOnly = toDateOnlyString(params.checkIn);
    const checkOutDateOnly = toDateOnlyString(params.checkOut);
    const oldCheckInDateOnly = toDateOnlyString(session.checkIn);
    const oldCheckOutDateOnly = toDateOnlyString(session.checkOut);
    const didChange = checkInDateOnly !== oldCheckInDateOnly || checkOutDateOnly !== oldCheckOutDateOnly || params.adults !== session.adults || params.children !== session.children;

    if (!didChange) {
        return { success: true };
    }

    // Changing search params invalidates current room prices/availability, so we Auto-Requote
    let autoRequoteSnapshot: any = undefined;
    let autoSelectRatePlanId: string | null = session.selectedRatePlanId;
    let autoSelectRoomTypeId: string | null = session.selectedRoomTypeId;

    if (session.selectedRoomTypeId) {
        try {
            const searchResult = await getAvailableRoomsForSearch(
                params.checkIn,
                params.checkOut,
                { adults: params.adults, children: params.children },
                1
            );
            
            if (searchResult.rooms.length > 0) {
                const matchedRoom = searchResult.rooms.find(r => r.roomType.id === session.selectedRoomTypeId);
                
                if (matchedRoom && matchedRoom.bookable && matchedRoom.availableRooms >= 1) {
                    let matchedRatePlan = matchedRoom.ratePlans.find(rp => rp.id === session.selectedRatePlanId);
                    if (!matchedRatePlan && matchedRoom.ratePlans.length > 0) {
                        matchedRatePlan = matchedRoom.ratePlans[0];
                        autoSelectRatePlanId = matchedRatePlan.id;
                    }
                    
                    if (matchedRatePlan) {
                        autoRequoteSnapshot = {
                            pricePerNight: matchedRatePlan.amount,
                            totalPrice: matchedRatePlan.amount,
                            taxesAndFees: matchedRatePlan.tax || Math.round(matchedRatePlan.amount * ((matchedRoom.roomType.taxRate || 12) / 100)),
                            externalRatePlanId: matchedRatePlan.id,
                            capturedAt: new Date().toISOString()
                        };
                    } else {
                        autoSelectRoomTypeId = null;
                        autoSelectRatePlanId = null;
                    }
                } else {
                    autoSelectRoomTypeId = null;
                    autoSelectRatePlanId = null;
                }
            } else {
                autoSelectRoomTypeId = null;
                autoSelectRatePlanId = null;
            }
        } catch (err) {
            console.error('Failed to auto-requote room in updateSessionSearch:', err);
            autoSelectRoomTypeId = null;
            autoSelectRatePlanId = null;
        }
    }

    const nextCartData = {
        ...cartData,
        roomSelections: [],
        quoteSnapshot: autoRequoteSnapshot || undefined,
    };

    await db.update(bookingSessions).set({
        checkIn: checkInDateOnly,
        checkOut: checkOutDateOnly,
        adults: params.adults,
        children: params.children,
        selectedRoomTypeId: autoSelectRoomTypeId,
        selectedRatePlanId: autoSelectRatePlanId,
        cartData: nextCartData,
        updatedAt: new Date(),
    }).where(eq(bookingSessions.id, sessionId));

    revalidatePath('/book/checkout');
    return { success: true };
}

export async function updateSessionRoom(
    roomTypeId: string, 
    quantity: number, 
    ratePlanId?: string,
    quoteSnapshot?: { pricePerNight: number; totalPrice: number; taxesAndFees: number; externalRatePlanId?: string; }
) {
    const sessionId = (await cookies()).get('booking_session')?.value;
    if (!sessionId) {
        return { success: false, message: 'Booking session expired.' };
    }

    const session = await db.query.bookingSessions.findFirst({
        where: eq(bookingSessions.id, sessionId),
    });
    if (!session) return { success: false, message: 'Booking session expired.' };

    const cartData = (session.cartData as SessionCartData | null) || {};

    const roomType = await db.query.roomTypes.findFirst({
        where: eq(roomTypes.id, roomTypeId),
    });
    if (!roomType) return { success: false, message: `Room type not found.` };

    let ratePlan;
    if (ratePlanId) {
        ratePlan = await db.query.ratePlans.findFirst({
            where: eq(ratePlans.id, ratePlanId),
        });
    } else {
        ratePlan = await db.query.ratePlans.findFirst({
            where: eq(ratePlans.roomTypeId, roomType.id),
            orderBy: (ratePlans, { asc, desc }) => [desc(ratePlans.isDefault), asc(ratePlans.displayOrder)],
        });
    }
    if (!ratePlan) return { success: false, message: `No rate plan available.` };

    const checkInDateOnly = toDateOnlyString(session.checkIn);
    const checkOutDateOnly = toDateOnlyString(session.checkOut);
    const provider = getBookingProvider();
    
    const adultsPerRoom = Math.max(1, Math.ceil((session.adults || 1) / quantity));
    const childrenPerRoom = Math.max(0, Math.ceil((session.children || 0) / quantity));

    const availability = await provider.checkAvailability({
        checkIn: checkInDateOnly,
        checkOut: checkOutDateOnly,
        adults: adultsPerRoom,
        children: childrenPerRoom,
    });
    
    if (availability.status !== 'success') {
        return { success: false, message: availability.message || 'Availability check failed.' };
    }

    const matchedAvailability = availability.rooms.find((room) => mapCrsRoomTypeMatchesInternal({
        internalRoomTypeId: roomType.id,
        internalRoomTypeSlug: roomType.slug,
        crsRoomTypeId: room.roomTypeId,
    }));

    if (!matchedAvailability || matchedAvailability.availableCount < quantity) {
        return { success: false, message: `Only ${matchedAvailability?.availableCount || 0} room(s) available.` };
    }

    const nextSelections: RoomSelectionInput[] = [
        {
            roomTypeId: roomType.id,
            roomSlug: roomType.slug,
            ratePlanId: ratePlan.id,
            quantity: quantity,
            quoteSnapshot: quoteSnapshot || undefined,
        },
    ];

    const result = await persistSessionRoomSelections(session, cartData, nextSelections);
    if (result.success) revalidatePath('/book/checkout');
    return result;
}

