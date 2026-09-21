import { db } from '@/lib/db';
import {
    addOns,
    bookingAddOns,
    bookingSessions,
    inventorySnapshots,
    bookings,
    bookingGuests,
    bookingItems,
    payments,
    bookingLogs,
    bookingConfirmations,
    inventoryLocks,
    roomTypes,
    ratePlans
} from '@/lib/db/schema';
import { IdempotencyService } from './idempotency';
import { SessionExpiration } from './session-expiration';
import { BookingLockService } from './booking-lock';
import { sendBookingConfirmation, sendBookingAlertToStaff, type BookingEmailCharges } from './email';
import { fireAutomation } from './whatsapp/automations';
import { bookingStateMachine } from './booking-state-machine';
import { eq, inArray } from 'drizzle-orm';
import crypto from 'crypto';
import { mapCrsRoomTypeMatchesInternal, mapInternalRatePlanToCrs, mapInternalRoomTypeToCrs } from '@/lib/config/crs';
import { getBookingProvider } from '@/lib/providers/crs/factory';
import type { BookingProvider, CRSCreateReservationRequest } from '@/lib/providers/crs/types';
import { resolveMaxChildren, validateGuestMixForRoomType } from './occupancy';
import { ensureRoomTypeMinOccupancyColumn } from '@/lib/db/schema-guard';
import { formatRoomName } from '@/lib/utils';
import { calculateAddOnTax, calculateRoomTax, splitStayIntoNightlyCharges, DEFAULT_ADD_ON_TAX_RATE } from './tax';
import { applyDiscount, validateOfferCode, redeemOffer, releaseOffer } from './offers';

type CreateSessionInput = {
    checkIn: Date | string;
    checkOut: Date | string;
    adults: number;
    children: number;
};

type GuestDetails = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address?: string;
    requests?: string;
};

type PaymentDetails = {
    method: string;
    amount: number;
    transactionId?: string;
    orderId?: string;
};

type SessionCartData = {
    guestDetails?: GuestDetails;
    quoteSnapshot?: {
        pricePerNight?: number;
        totalPrice?: number;
        nightlyRates?: number[];
        taxesAndFees?: number;
        externalRatePlanId?: string;
        capturedAt?: string;
    };
    roomSelection?: {
        roomTypeId?: string;
        roomSlug?: string;
        ratePlanId?: string;
        quantity?: number;
    };
    roomSelections?: Array<{
        roomTypeId?: string;
        roomSlug?: string;
        ratePlanId?: string;
        quantity?: number;
        quoteSnapshot?: {
            pricePerNight?: number;
            totalPrice?: number;
            nightlyRates?: number[];
            taxesAndFees?: number;
            externalRatePlanId?: string;
            capturedAt?: string;
        };
    }>;
    selectedAddOns?: Array<{
        addOnId?: string;
        quantity?: number;
    }>;
    [key: string]: unknown;
};

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
}

function isRetryableProviderMessage(message: string): boolean {
    return /(timeout|timed out|temporar|unavailable|maintenance|network|fetch failed|aborted|5\d{2}|econn|enotfound|reset)/i.test(message);
}

function isRetryableProviderError(error: unknown): boolean {
    const message = getErrorMessage(error);
    if (isRetryableProviderMessage(message)) return true;

    if (error instanceof Error && error.name === 'AbortError') return true;

    return false;
}

function sanitizeRoomCount(value: unknown): number {
    const parsed = typeof value === 'number'
        ? value
        : Number.parseInt(String(value || 1), 10);

    if (!Number.isFinite(parsed)) return 1;
    return Math.min(8, Math.max(1, parsed));
}

function distributeGuests(totalGuests: number, roomCount: number, minPerRoom: number): number[] {
    if (roomCount <= 0) return [];

    const safeTotal = Math.max(0, Math.floor(totalGuests));
    const canApplyMinimum = minPerRoom > 0 && safeTotal >= (roomCount * minPerRoom);

    const distribution = new Array(roomCount).fill(canApplyMinimum ? minPerRoom : 0);
    let remaining = safeTotal - distribution.reduce((sum, value) => sum + value, 0);
    let pointer = 0;

    while (remaining > 0) {
        distribution[pointer] += 1;
        remaining -= 1;
        pointer = (pointer + 1) % roomCount;
    }

    return distribution;
}

type NormalizedRoomSelection = {
    roomTypeId: string;
    roomSlug?: string;
    ratePlanId?: string;
    quantity: number;
    quoteSnapshot?: {
        pricePerNight?: number;
        totalPrice?: number;
        nightlyRates?: number[];
        taxesAndFees?: number;
        externalRatePlanId?: string;
        capturedAt?: string;
    };
};

function sanitizeRoomSelections(value: unknown): NormalizedRoomSelection[] {
    if (!Array.isArray(value)) return [];

    const selections: NormalizedRoomSelection[] = [];

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
                nightlyRates: Array.isArray((quote as { nightlyRates?: unknown }).nightlyRates)
                    ? ((quote as { nightlyRates: unknown[] }).nightlyRates.filter(
                        (rate): rate is number => typeof rate === 'number' && Number.isFinite(rate) && rate >= 0
                    ))
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
    cartData: SessionCartData
): NormalizedRoomSelection[] {
    const roomSelections = sanitizeRoomSelections(cartData.roomSelections);
    if (roomSelections.length > 0) return roomSelections;

    if (!session.selectedRoomTypeId) return [];

    return [{
        roomTypeId: session.selectedRoomTypeId,
        roomSlug: cartData.roomSelection?.roomSlug,
        ratePlanId: session.selectedRatePlanId || cartData.roomSelection?.ratePlanId,
        quantity: sanitizeRoomCount(cartData.roomSelection?.quantity),
        quoteSnapshot: cartData.quoteSnapshot,
    }];
}

export class BookingService {
    private provider: BookingProvider;

    constructor() {
        this.provider = getBookingProvider();
    }

    /**
     * Step 1: Initialize Session with Search Params
     */
    async createSession(searchParams: CreateSessionInput) {
        // Validation logic for search params here...
        const checkIn = typeof searchParams.checkIn === 'string'
            ? searchParams.checkIn.slice(0, 10)
            : searchParams.checkIn.toISOString().slice(0, 10);
        const checkOut = typeof searchParams.checkOut === 'string'
            ? searchParams.checkOut.slice(0, 10)
            : searchParams.checkOut.toISOString().slice(0, 10);

        const sessionInsert: typeof bookingSessions.$inferInsert = {
            sessionToken: crypto.randomUUID(),
            checkIn,
            checkOut,
            adults: searchParams.adults,
            children: searchParams.children,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
            step: 'search',
            cartData: {},
        };

        const sessions = await db.insert(bookingSessions).values(sessionInsert).returning();

        return sessions[0];
    }

    /**
     * Step 2: Get Available Rooms (and snapshot them)
     */
    async getRooms(sessionId: string) {
        await ensureRoomTypeMinOccupancyColumn();

        const sessionCheck = await SessionExpiration.check(sessionId);
        if (!sessionCheck.isValid) throw new Error(sessionCheck.message);

        const session = await db.query.bookingSessions.findFirst({ where: eq(bookingSessions.id, sessionId) });
        if (!session) throw new Error("Session invalid");

        // 1. Call Connector
        const checkInStr = typeof session.checkIn === 'string' ? session.checkIn : new Date(session.checkIn!).toISOString().split('T')[0];
        const checkOutStr = typeof session.checkOut === 'string' ? session.checkOut : new Date(session.checkOut!).toISOString().split('T')[0];

        const availability = await this.provider.checkAvailability({
            checkIn: checkInStr,
            checkOut: checkOutStr,
            adults: session.adults || 1,
            children: session.children || 0
        });

        // 2. Snapshot Inventory
        if (availability.status === 'success') {
            const knownRoomTypes = await db.query.roomTypes.findMany({
                columns: { id: true, slug: true },
            });

            await Promise.all(availability.rooms.map(room =>
                db.insert(inventorySnapshots).values({
                    bookingSessionId: sessionId,
                    roomTypeId: knownRoomTypes.find((candidate) =>
                        mapCrsRoomTypeMatchesInternal({
                            internalRoomTypeId: candidate.id,
                            internalRoomTypeSlug: candidate.slug,
                            crsRoomTypeId: room.roomTypeId,
                        })
                    )?.id,
                    checkIn: checkInStr,
                    checkOut: checkOutStr,
                    availableCount: room.availableCount,
                    snapshotData: room
                })
            ));
        }

        return availability;
    }

    /**
     * Step 3: Select Room & Rate (and snapshot price)
     */
    async selectRoom(sessionId: string, roomSlug: string, ratePlanCode: string, roomCount = 1) {
        await ensureRoomTypeMinOccupancyColumn();

        const sessionCheck = await SessionExpiration.check(sessionId);
        if (!sessionCheck.isValid) throw new Error(sessionCheck.message);

        const session = await db.query.bookingSessions.findFirst({ where: eq(bookingSessions.id, sessionId) });
        if (!session) throw new Error('Session invalid');
        const safeRoomCount = sanitizeRoomCount(roomCount);

        // 1. Resolve Room Type Request
        const roomType = await db.query.roomTypes.findFirst({
            where: eq(roomTypes.slug, roomSlug)
        });
        if (!roomType) throw new Error(`Invalid room type: ${roomSlug}`);

        const occupancyCheck = validateGuestMixForRoomType(roomType, {
            adults: session.adults || 1,
            children: session.children || 0,
        }, safeRoomCount);
        if (!occupancyCheck.valid) {
            throw new Error(occupancyCheck.reason || 'Selected room does not support this guest mix.');
        }

        // 2. Resolve Rate Plan Request (For now hardcoded/mock logic might pass 'rp_standard')
        // We typically would get this from the user selection, but for the shell we default or lookup
        const ratePlan = await db.query.ratePlans.findFirst({
            where: eq(ratePlans.code, ratePlanCode)
        });

        // Fallback: If no rate plan found matching code, maybe use default for the room?
        // For strictness, we throw if provided but not found. 
        // If logic allows defaults, we could fetch default rate plan.
        if (!ratePlan) throw new Error(`Invalid rate plan: ${ratePlanCode}`);

        const checkInStr = typeof session.checkIn === 'string'
            ? session.checkIn
            : new Date(session.checkIn!).toISOString().split('T')[0];
        const checkOutStr = typeof session.checkOut === 'string'
            ? session.checkOut
            : new Date(session.checkOut!).toISOString().split('T')[0];
        const adultsPerRoom = Math.max(1, Math.ceil((session.adults || 1) / safeRoomCount));
        const childrenPerRoom = Math.max(0, Math.ceil((session.children || 0) / safeRoomCount));

        const availability = await this.provider.checkAvailability({
            checkIn: checkInStr,
            checkOut: checkOutStr,
            adults: adultsPerRoom,
            children: childrenPerRoom,
        });

        if (availability.status !== 'success') {
            throw new Error(availability.message || 'Live availability check failed while selecting room.');
        }

        const matchedAvailability = availability.rooms.find((room) => mapCrsRoomTypeMatchesInternal({
            internalRoomTypeId: roomType.id,
            internalRoomTypeSlug: roomType.slug,
            crsRoomTypeId: room.roomTypeId,
        }));

        if (!matchedAvailability || matchedAvailability.availableCount < safeRoomCount) {
            throw new Error(
                `Only ${matchedAvailability?.availableCount || 0} room(s) available for ${formatRoomName(roomType.name)}.`
            );
        }

        const currentCart = (session.cartData as SessionCartData | null) || {};

        // Helper to get fresh price (should be from provider)
        // For now using mock logic or verifying against previous availability

        await db.update(bookingSessions)
            .set({
                selectedRoomTypeId: roomType.id,
                selectedRatePlanId: ratePlan.id,
                cartData: {
                    ...currentCart,
                    roomSelection: {
                        roomTypeId: roomType.id,
                        roomSlug: roomType.slug,
                        ratePlanId: ratePlan.id,
                        quantity: safeRoomCount,
                    },
                },
                step: 'details'
            })
            .where(eq(bookingSessions.id, sessionId));

        // TODO: Implement proper rate snapshotting here via provider quote endpoint.
    }

    /**
     * Helper to update session cart data
     */
    async updateSessionCart(sessionId: string, data: Record<string, unknown>) {
        const session = await db.query.bookingSessions.findFirst({ where: eq(bookingSessions.id, sessionId) });
        if (!session) throw new Error("Session not found");

        const currentCart = (session.cartData as SessionCartData | null) || {};
        const newCart = { ...currentCart, ...data };

        await db.update(bookingSessions)
            .set({ cartData: newCart })
            .where(eq(bookingSessions.id, sessionId));
    }

    /**
     * Wrapper to finalize from session data
     */
    async finalizeSession(sessionId: string, paymentDetails: PaymentDetails) {
        const session = await db.query.bookingSessions.findFirst({ where: eq(bookingSessions.id, sessionId) });
        if (!session) throw new Error("Session invalid");

        const cartData = session.cartData as SessionCartData | null;
        if (!cartData || !cartData.guestDetails) {
            throw new Error("Guest details missing");
        }

        return this.finalizeBooking(sessionId, cartData.guestDetails, paymentDetails);
    }

    /**
     * Helper: Lock Inventory (Temporary Hold)
     */
    async lockInventory(
        sessionId: string,
        roomTypeId: string,
        checkIn: string,
        checkOut: string,
        totalLockedPrice: number,
        roomCount = 1
    ) {
        // 1. Check existing locks
        // In real scenario, we check if total locks + booked >= total rooms
        // For shell, we insert one lock per room in the request.
        const safeRoomCount = sanitizeRoomCount(roomCount);
        const perRoomLockedPrice = Math.round(totalLockedPrice / safeRoomCount);

        await db.insert(inventoryLocks).values(
            Array.from({ length: safeRoomCount }, () => ({
                roomTypeId: roomTypeId,
                checkIn: checkIn,
                checkOut: checkOut,
                lockedPrice: perRoomLockedPrice,
                sessionId: sessionId,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            }))
        );

        return true;
    }

    /**
     * FINAL STEP: Process Booking (Synchronous/User-initiated)
     */
    async finalizeBooking(sessionId: string, guestDetails: GuestDetails, paymentDetails: PaymentDetails) {
        await ensureRoomTypeMinOccupancyColumn();

        // 1. Session Check
        const sessionCheck = await SessionExpiration.check(sessionId);
        if (!sessionCheck.isValid) throw new Error(sessionCheck.message);

        const session = await db.query.bookingSessions.findFirst({ where: eq(bookingSessions.id, sessionId) });
        if (!session) throw new Error("Session invalid");
        const cartData = (session.cartData as SessionCartData | null) || {};
        const roomSelections = getSessionRoomSelections(session, cartData);
        if (!roomSelections.length) {
            throw new Error('No room selections found in session.');
        }

        const roomTypeIds = Array.from(new Set(roomSelections.map((selection) => selection.roomTypeId)));
        const selectedRoomTypes = await db.query.roomTypes.findMany({
            where: inArray(roomTypes.id, roomTypeIds),
        });

        const roomTypeMap = new Map(selectedRoomTypes.map((roomType) => [roomType.id, roomType]));
        for (const selection of roomSelections) {
            if (!roomTypeMap.has(selection.roomTypeId)) {
                throw new Error('One or more selected room types are no longer available.');
            }
        }

        const totalRooms = roomSelections.reduce((sum, selection) => sum + sanitizeRoomCount(selection.quantity), 0);
        const adults = session.adults || 1;
        const children = session.children || 0;
        const totalGuests = adults + children;

        if (adults < totalRooms) {
            throw new Error('At least one adult is required per room.');
        }

        const totalMinGuests = roomSelections.reduce((sum, selection) => {
            const roomType = roomTypeMap.get(selection.roomTypeId)!;
            return sum + (Math.max(1, roomType.minOccupancy || 1) * selection.quantity);
        }, 0);
        const totalMaxGuests = roomSelections.reduce((sum, selection) => {
            const roomType = roomTypeMap.get(selection.roomTypeId)!;
            return sum + (Math.max(1, roomType.maxGuests || 1) * selection.quantity);
        }, 0);
        const totalMaxAdults = roomSelections.reduce((sum, selection) => {
            const roomType = roomTypeMap.get(selection.roomTypeId)!;
            return sum + (Math.max(1, roomType.maxAdults || 1) * selection.quantity);
        }, 0);
        const totalMaxChildren = roomSelections.reduce((sum, selection) => {
            const roomType = roomTypeMap.get(selection.roomTypeId)!;
            return sum + (resolveMaxChildren(roomType) * selection.quantity);
        }, 0);

        if (totalGuests < totalMinGuests) {
            throw new Error(`Selected rooms require at least ${totalMinGuests} guest(s).`);
        }
        if (totalGuests > totalMaxGuests) {
            throw new Error(`Selected rooms can host up to ${totalMaxGuests} guest(s).`);
        }
        if (adults > totalMaxAdults) {
            throw new Error(`Selected rooms can host up to ${totalMaxAdults} adult(s).`);
        }
        if (children > totalMaxChildren) {
            throw new Error(`Selected rooms can host up to ${totalMaxChildren} child(ren).`);
        }

        const checkInStr = typeof session.checkIn === 'string' ? session.checkIn : new Date(session.checkIn!).toISOString().split('T')[0];
        const checkOutStr = typeof session.checkOut === 'string' ? session.checkOut : new Date(session.checkOut!).toISOString().split('T')[0];
        const adultsPerRoom = Math.max(1, Math.ceil(adults / totalRooms));
        const childrenPerRoom = Math.max(0, Math.ceil(children / totalRooms));

        // 2. Pre-Payment Availability Recheck (MANDATORY FIX)
        // Request availability for the dates (no filters supported by mock/type for now)
        const availabilityFn = await this.provider.checkAvailability({
            checkIn: checkInStr,
            checkOut: checkOutStr,
            adults: adultsPerRoom,
            children: childrenPerRoom,
        });

        if (availabilityFn.status !== 'success') {
            throw new Error(availabilityFn.message || 'Unable to verify live availability right now.');
        }

        for (const selection of roomSelections) {
            const roomType = roomTypeMap.get(selection.roomTypeId)!;
            const roomAvail = availabilityFn.rooms.find((room) => mapCrsRoomTypeMatchesInternal({
                internalRoomTypeId: roomType.id,
                internalRoomTypeSlug: roomType.slug,
                crsRoomTypeId: room.roomTypeId,
            }));

            if (!roomAvail || roomAvail.availableCount < selection.quantity) {
                throw new Error(
                    `Only ${roomAvail?.availableCount || 0} room(s) available for ${formatRoomName(roomType.name)}.`
                );
            }
        }

        // 3. Idempotency Check
        const idempotencyKey = IdempotencyService.generateKey({ sessionId, paymentDetails });
        const existing = await IdempotencyService.check(idempotencyKey);
        if (existing.exists && existing.response) {
            if (existing.response.bookingId) {
                const b = await db.query.bookings.findFirst({ where: eq(bookings.id, existing.response.bookingId) });
                if (b) return b;
            }
        }
        await IdempotencyService.lock(idempotencyKey, 'finalizeBooking', '/api/book/finalize');

        let bookingId: string | null = null;
        // Hoisted so the catch can hand the offer back. A use claimed for a
        // booking that then failed would otherwise be lost permanently, which on
        // a limited offer means a seat nobody ever gets.
        let claimedOfferId: string | null = null;

        try {
            // Generate unique booking reference number
            // Format: OL-DDMM-XXXX (e.g., OL-1003-A1B2)
            const date = new Date();
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const random = Math.random().toString(36).substring(2, 6).toUpperCase();
            const bookingRef = `OL-${day}${month}-${random}`;

            const nights = Math.ceil((new Date(checkOutStr).getTime() - new Date(checkInStr).getTime()) / (1000 * 60 * 60 * 24));
            const normalizedSelectedAddOns = Array.isArray(cartData.selectedAddOns)
                ? cartData.selectedAddOns
                    .map((entry) => {
                        const addOnId = typeof entry?.addOnId === 'string' ? entry.addOnId : '';
                        const quantityRaw = typeof entry?.quantity === 'number'
                            ? entry.quantity
                            : Number.parseInt(String(entry?.quantity || 0), 10);

                        if (!addOnId || !Number.isFinite(quantityRaw) || quantityRaw < 1) return null;

                        return {
                            addOnId,
                            quantity: Math.min(10, quantityRaw),
                        };
                    })
                    .filter((entry): entry is { addOnId: string; quantity: number } => entry !== null)
                : [];

            const selectedAddOnIds = Array.from(new Set(normalizedSelectedAddOns.map((entry) => entry.addOnId)));
            const addOnRows = selectedAddOnIds.length
                ? await db.select({
                    id: addOns.id,
                    name: addOns.name,
                    price: addOns.price,
                    taxRate: addOns.taxRate,
                })
                    .from(addOns)
                    .where(inArray(addOns.id, selectedAddOnIds))
                : [];

            const addOnMap = new Map(addOnRows.map((row) => [row.id, row]));
            const selectedAddOnsWithPrice = normalizedSelectedAddOns
                .map((entry) => {
                    const addOn = addOnMap.get(entry.addOnId);
                    if (!addOn?.price) return null;
                    return {
                        ...entry,
                        price: addOn.price,
                        // Sold at today's rate, and kept on the line from here on.
                        taxRate: addOn.taxRate ?? DEFAULT_ADD_ON_TAX_RATE,
                        subtotal: addOn.price * entry.quantity,
                    };
                })
                .filter((entry): entry is { addOnId: string; quantity: number; price: number; taxRate: number; subtotal: number } => entry !== null);

            const addOnSubtotal = selectedAddOnsWithPrice.reduce((sum, entry) => sum + entry.subtotal, 0);
            const roomLineItems = roomSelections.map((selection) => {
                const roomType = roomTypeMap.get(selection.roomTypeId)!;
                const quantity = sanitizeRoomCount(selection.quantity);
                const pricePerNight = selection.quoteSnapshot?.pricePerNight || roomType.basePrice;
                const computedSubtotal = pricePerNight * nights * quantity;
                const quotedSubtotal = selection.quoteSnapshot?.totalPrice;
                const subtotal = typeof quotedSubtotal === 'number' && quotedSubtotal > 0
                    ? Math.max(quotedSubtotal, computedSubtotal)
                    : computedSubtotal;

                return {
                    roomTypeId: selection.roomTypeId,
                    ratePlanId: selection.ratePlanId || session.selectedRatePlanId || undefined,
                    quantity,
                    pricePerNight,
                    nights,
                    subtotal,
                };
            });

            const roomSubtotal = roomLineItems.reduce((sum, line) => sum + line.subtotal, 0);
            // This is the figure that gets written to the booking, so it is recomputed
            // from the nightly rates rather than trusting any stored tax scalar. Each
            // night takes its own slab; a stay spanning the threshold is taxed correctly.
            const roomTaxAmount = roomLineItems.reduce((sum, line) => {
                const selection = roomSelections.find((s) => s.roomTypeId === line.roomTypeId);
                return sum + calculateRoomTax({
                    nightlyRates: selection?.quoteSnapshot?.nightlyRates,
                    pricePerNight: line.pricePerNight,
                    totalPricePerRoom: line.subtotal / line.quantity,
                    nights,
                    quantity: line.quantity,
                });
            }, 0);

            // Add-ons are taxed separately, each at its own rate.
            const addOnTaxAmount = calculateAddOnTax(selectedAddOnsWithPrice);

            // Promo code. Only the code is carried on the session; its value is
            // recomputed here against the final cart, so a code applied before
            // the guest added a room is worth what it is worth now — and the
            // arithmetic is the shared applyDiscount(), not a second copy of it,
            // because a one-paisa disagreement with the amount the payment step
            // verified rejects the booking outright.
            const promoCodeOnSession = typeof (cartData as { promoCode?: unknown }).promoCode === 'string'
                ? (cartData as { promoCode: string }).promoCode
                : null;

            const preDiscountTotal = roomSubtotal + roomTaxAmount + addOnSubtotal + addOnTaxAmount;
            const validation = promoCodeOnSession
                ? await validateOfferCode(promoCodeOnSession, {
                    roomSubtotal,
                    bookingTotal: preDiscountTotal,
                })
                : null;

            let appliedOffer: { id: string; code: string; title: string } | null = null;
            let discountPaise = 0;

            if (validation?.valid) {
                // Claim the use before the booking exists. If the offer ran out in
                // the seconds since the guest saw it, they simply pay full price:
                // losing a discount is recoverable, losing the booking is not.
                const claimed = await redeemOffer(validation.offer.id);
                if (claimed) {
                    appliedOffer = {
                        id: validation.offer.id,
                        code: validation.offer.code,
                        title: validation.offer.title,
                    };
                    discountPaise = validation.discount;
                    claimedOfferId = validation.offer.id;
                }
            }

            const quote = applyDiscount(
                { roomSubtotal, roomTax: roomTaxAmount, addOnSubtotal, addOnTax: addOnTaxAmount },
                discountPaise,
            );

            const subtotal = quote.subtotal;
            const taxAmount = quote.taxAmount;
            const payableTotal = quote.total;

            const [newBooking] = await db.insert(bookings).values({
                bookingNumber: bookingRef,
                guestName: `${guestDetails.firstName} ${guestDetails.lastName}`,
                guestEmail: guestDetails.email,
                guestPhone: guestDetails.phone,
                guestAddress: guestDetails.address || null,
                specialRequests: guestDetails.requests,
                checkIn: checkInStr,
                checkOut: checkOutStr,
                adults: session.adults || 1,
                children: session.children || 0,
                totalAmount: payableTotal,
                subtotal: subtotal,
                taxAmount: taxAmount,
                // These three columns have existed since the original schema and
                // nothing has ever written them until now.
                promoCode: appliedOffer?.code ?? null,
                offerId: appliedOffer?.id ?? null,
                discountAmount: quote.discount,
                discountReason: appliedOffer ? appliedOffer.title : null,
                status: 'initiated',
                paymentStatus: 'pending',
                ratePlanId: roomLineItems[0]?.ratePlanId || undefined,
                version: 1,
            }).returning();

            bookingId = newBooking.id;

            // Insert dependent records
            await db.insert(bookingItems).values(
                roomLineItems.map((line) => ({
                    bookingId: newBooking.id,
                    roomTypeId: line.roomTypeId,
                    ratePlanId: line.ratePlanId,
                    quantity: line.quantity,
                    pricePerNight: line.pricePerNight,
                    nights: line.nights,
                    subtotal: line.subtotal,
                }))
            );

            await db.insert(bookingGuests).values({
                bookingId: newBooking.id,
                firstName: guestDetails.firstName,
                lastName: guestDetails.lastName,
                guestType: 'adult',
            });

            if (selectedAddOnsWithPrice.length > 0) {
                await db.insert(bookingAddOns).values(
                    selectedAddOnsWithPrice.map((entry) => ({
                        bookingId: newBooking.id,
                        addOnId: entry.addOnId,
                        quantity: entry.quantity,
                        price: entry.price,
                        taxRate: entry.taxRate,
                        subtotal: entry.subtotal,
                    }))
                );
            }

            // Create Payment Record
            const [paymentRecord] = await db.insert(payments).values({
                bookingId: newBooking.id,
                amount: payableTotal,
                status: 'pending',
                paymentMethod: paymentDetails.method,
                easebuzzOrderId: paymentDetails.orderId || `txn_${crypto.randomUUID()}`
            }).returning();

            // 5. Lock Inventory (Internal)
            for (const line of roomLineItems) {
                await this.lockInventory(
                    sessionId,
                    line.roomTypeId,
                    checkInStr,
                    checkOutStr,
                    line.subtotal,
                    line.quantity
                );
            }

            // 6. Transition Status: INITIATED -> PENDING_PAYMENT (MANDATORY FIX)
            await bookingStateMachine.transition(bookingId, 'pending_payment', {
                reason: 'Booking initiated, awaiting payment',
                metadata: { sessionId, paymentId: paymentRecord.id }
            });

            // 7. STOP HERE (MANDATORY FIX)
            // Do NOT simulate success. Do NOT call CRS reservation API yet.
            // The frontend should now redirect to Razorpay (or handle the pending state).
            // But wait, the current frontend 'CheckoutPage' acts as the payment collector.
            // If we stop here, we return the 'pending' booking.
            // The Actions.ts wrapper expects a declared booking.

            // We return the booking in 'pending_payment' state.
            // verification: Booking must ONLY be confirmed after verified payment webhook.
            // Clarification: local booking row exists, but CRS confirmation happens asynchronously.
            // The DB record 'bookings' exists but is checking 'pending_payment'.

            await IdempotencyService.complete(idempotencyKey, { bookingId: bookingId }, 200);

            return await db.query.bookings.findFirst({ where: eq(bookings.id, bookingId) });

        } catch (error: unknown) {
            const message = getErrorMessage(error);

            // Hand back a promo use claimed for a booking that then failed.
            // Never allowed to mask the real error: the booking failure is what
            // the caller needs to see, and a release that itself fails is a
            // spare seat on an offer, not a lost booking.
            if (claimedOfferId) {
                await releaseOffer(claimedOfferId).catch((e) =>
                    console.error(`Failed to release offer ${claimedOfferId}:`, e));
            }

            // Log Error
            await db.insert(bookingLogs).values({
                bookingId: bookingId || undefined,
                action: 'finalizeBooking_error',
                errorMessage: message,
                level: 'error',
                durationMs: 0
            });
            throw error;
        }
    }

    /**
     * Webhook/Async Finalization
     */
    async finalizeFromWebhook(bookingId: string) {
        await ensureRoomTypeMinOccupancyColumn();

        // 1. Fetch Booking
        const booking = await db.query.bookings.findFirst({
            where: eq(bookings.id, bookingId),
            with: {
                items: true,
                // Needed to split the booking's tax back into its room and add-on
                // halves when pricing the CRS payload's nightly lines, and named
                // so the confirmation emails can list what the guest ordered.
                addOns: { with: { addOn: { columns: { name: true } } } }
            }
        });

        if (!booking) throw new Error("Booking not found");

        // 2. Check State
        if (booking.status === 'confirmed') return { success: true, status: 'already_confirmed' };
        if (booking.status === 'failed' || booking.status === 'refunded') return { success: false, status: booking.status };

        // 3. Confirm with CRS
        // If we are here, payment is successful (webhook verified it)
        // Check if we already requested

        if (booking.status !== 'booking_requested') {
            // Fix: Ensure we pass through payment_success state
            if (booking.status === 'initiated' || booking.status === 'pending_payment') {
                await bookingStateMachine.transition(bookingId, 'payment_success', {
                    reason: 'Payment verified by webhook'
                });
            }

            await bookingStateMachine.transition(bookingId, 'booking_requested', {
                reason: 'Requesting CRS reservation after payment success'
            });
        }

        // 4. ACQUIRE LOCK (Mandatory)
        const lockAcquired = await BookingLockService.acquireLock(bookingId, 'webhook_handler');
        if (!lockAcquired) {
            throw new Error(`Booking ${bookingId} is currently being processed by another worker.`);
        }

        try {
            const existingConfirmation = await db.query.bookingConfirmations.findFirst({
                where: eq(bookingConfirmations.bookingId, bookingId),
                columns: {
                    confirmationNumber: true,
                    axisRoomsBookingId: true,
                },
            });

            if (existingConfirmation?.confirmationNumber && existingConfirmation.axisRoomsBookingId) {
                await bookingStateMachine.transition(bookingId, 'confirmed', {
                    reason: 'CRS reservation already confirmed (idempotent webhook replay)',
                    metadata: {
                        confirmationNumber: existingConfirmation.confirmationNumber,
                        crsReservationId: existingConfirmation.axisRoomsBookingId,
                    }
                });

                return {
                    success: true,
                    status: 'already_confirmed',
                    booking: {
                        status: 'confirmed',
                        reservationId: existingConfirmation.axisRoomsBookingId,
                        confirmationNumber: existingConfirmation.confirmationNumber,
                    }
                };
            }

            const bookingRoomItems = booking.items.filter((item) => !!item.roomTypeId);
            if (!bookingRoomItems.length) {
                throw new Error(`Booking ${bookingId} missing room items`);
            }

            const roomTypeIds = Array.from(new Set(bookingRoomItems.map((item) => item.roomTypeId)));
            const ratePlanIds = Array.from(new Set(
                bookingRoomItems
                    .map((item) => item.ratePlanId || booking.ratePlanId || '')
                    .filter((id): id is string => Boolean(id))
            ));

            const [internalRoomTypes, internalRatePlans] = await Promise.all([
                db.query.roomTypes.findMany({
                    where: inArray(roomTypes.id, roomTypeIds),
                    columns: { id: true, slug: true, name: true },
                }),
                ratePlanIds.length
                    ? db.query.ratePlans.findMany({
                        where: inArray(ratePlans.id, ratePlanIds),
                        columns: { id: true, code: true },
                    })
                    : Promise.resolve([]),
            ]);

            const roomTypeMap = new Map(internalRoomTypes.map((roomType) => [roomType.id, roomType]));
            const ratePlanMap = new Map(internalRatePlans.map((ratePlan) => [ratePlan.id, ratePlan]));
            const primaryRoomTypeName = roomTypeMap.get(bookingRoomItems[0].roomTypeId)?.name || 'Room';

            const totalRooms = bookingRoomItems.reduce(
                (sum, item) => sum + sanitizeRoomCount(item.quantity),
                0
            );
            if (totalRooms < 1) {
                throw new Error(`Booking ${bookingId} has invalid room quantity`);
            }
            if ((booking.adults || 1) < totalRooms) {
                throw new Error(`Booking ${bookingId} has fewer adults than rooms.`);
            }

            const adultsDistribution = distributeGuests(booking.adults || 1, totalRooms, 1);
            const childrenDistribution = distributeGuests(booking.children || 0, totalRooms, 0);

            // The CRS prices every night of every room and reconciles those lines
            // against the header totals, so hand it a split of what the booking
            // actually carries. Add-on tax rides in the same column as room tax and
            // has to come back out first — the nightly lines are rooms only.
            const stayNights = Math.max(
                1,
                Math.ceil(
                    (new Date(booking.checkOut as string).getTime() - new Date(booking.checkIn as string).getTime())
                    / (1000 * 60 * 60 * 24)
                )
            );
            const addOnSubtotal = (booking.addOns || []).reduce((sum, entry) => sum + (entry.subtotal || 0), 0);
            // Each line at the rate it was sold at, so this matches what was charged.
            const addOnTax = calculateAddOnTax(booking.addOns || []);
            const roomTax = Math.max(0, (booking.taxAmount || 0) - addOnTax);
            const nightlyCharges = splitStayIntoNightlyCharges({
                items: bookingRoomItems.map((item) => ({
                    pricePerNight: item.pricePerNight,
                    subtotal: item.subtotal,
                    rooms: sanitizeRoomCount(item.quantity),
                })),
                nights: stayNights,
                roomTaxTotal: roomTax,
            });

            let roomCursor = 0;
            const reservationRooms: CRSCreateReservationRequest['rooms'] = [];

            for (const item of bookingRoomItems) {
                const internalRoomType = roomTypeMap.get(item.roomTypeId);
                const externalRoomTypeId = mapInternalRoomTypeToCrs({
                    roomTypeId: item.roomTypeId,
                    roomTypeSlug: internalRoomType?.slug,
                });

                const resolvedRatePlanId = item.ratePlanId || booking.ratePlanId || '';
                const externalRatePlanId = resolvedRatePlanId
                    ? mapInternalRatePlanToCrs({
                        ratePlanId: resolvedRatePlanId,
                        ratePlanCode: ratePlanMap.get(resolvedRatePlanId)?.code,
                    })
                    : '';

                const itemRoomCount = sanitizeRoomCount(item.quantity);

                for (let i = 0; i < itemRoomCount; i += 1) {
                    reservationRooms.push({
                        roomTypeId: externalRoomTypeId,
                        ratePlanId: externalRatePlanId,
                        adults: adultsDistribution[roomCursor] || 0,
                        children: childrenDistribution[roomCursor] || 0,
                        guestName: booking.guestName,
                        // Same order the split was built in: items in order, rooms within an item in order.
                        nightlyRates: nightlyCharges[roomCursor]?.nightlyRates,
                        nightlyTaxes: nightlyCharges[roomCursor]?.nightlyTaxes,
                    });
                    roomCursor += 1;
                }
            }

            const createReservationRequest: CRSCreateReservationRequest = {
                reservationRef: booking.bookingNumber,
                checkIn: booking.checkIn as string,
                checkOut: booking.checkOut as string,
                rooms: reservationRooms,
                primaryGuest: {
                    title: 'Mr', // Default as we don't store it yet
                    firstName: booking.guestName.split(' ')[0],
                    lastName: booking.guestName.split(' ').slice(1).join(' '),
                    email: booking.guestEmail,
                    phone: booking.guestPhone,
                },
                payment: {
                    method: 'online',
                    amount: booking.totalAmount,
                    subtotal: booking.subtotal ?? undefined,
                    taxAmount: booking.taxAmount ?? undefined,
                },
                comments: booking.specialRequests || undefined,
                // Named in Instructions because the payload has nowhere else to
                // carry them — see the CRS request type.
                addOns: (booking.addOns || []).map((entry) => ({
                    name: entry.addOn?.name || 'Add-on',
                    quantity: entry.quantity || 1,
                    subtotal: entry.subtotal,
                })),
                addOnTax,
            };

            const reservationResponse = await this.provider.createReservation(createReservationRequest);

            if (
                reservationResponse.status !== 'confirmed' ||
                !reservationResponse.reservationId ||
                !reservationResponse.confirmationNumber
            ) {
                const errorMessage = reservationResponse.message || 'CRS did not confirm reservation';

                const retryableResponse =
                    reservationResponse.status === 'pending' ||
                    isRetryableProviderMessage(errorMessage) ||
                    (reservationResponse.errors || []).some((entry) => isRetryableProviderMessage(entry));

                if (retryableResponse) {
                    await db.insert(bookingLogs).values({
                        bookingId,
                        action: 'crs_reservation_pending_retry',
                        level: 'warning',
                        errorMessage: errorMessage,
                        requestPayload: reservationResponse,
                    });

                    return {
                        success: false,
                        status: 'pending_retry',
                        retryable: true,
                        message: errorMessage,
                    };
                }

                await bookingStateMachine.transition(bookingId, 'failed', {
                    reason: `CRS reservation failed: ${errorMessage}`,
                    metadata: { response: reservationResponse }
                });
                throw new Error(errorMessage);
            }

            // 6. Transition to CONFIRMED
            await bookingStateMachine.transition(bookingId, 'confirmed', {
                reason: 'CRS reservation confirmed',
                metadata: {
                    confirmationNumber: reservationResponse.confirmationNumber,
                    crsReservationId: reservationResponse.reservationId
                }
            });

            // 7. Store Confirmation
            await db.insert(bookingConfirmations).values({
                bookingId: bookingId,
                confirmationNumber: reservationResponse.confirmationNumber,
                axisRoomsBookingId: reservationResponse.reservationId,
                apiResponse: reservationResponse
            });

            // 8. SEND EMAILS (and the WhatsApp confirmation, if that automation is on)
            const checkInDate = new Date(booking.checkIn);
            const checkOutDate = new Date(booking.checkOut);
            const nights = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
            const checkInStr = checkInDate.toLocaleDateString('en-IN');
            const checkOutStr = checkOutDate.toLocaleDateString('en-IN');

            // The same split the charge was built from (applyDiscount), so the
            // lines in both emails add back up to what the guest paid.
            const charges: BookingEmailCharges = {
                nights,
                rooms: bookingRoomItems.map((item) => ({
                    name: roomTypeMap.get(item.roomTypeId)?.name || 'Room',
                    quantity: sanitizeRoomCount(item.quantity),
                    subtotal: item.subtotal,
                })),
                discount: booking.discountAmount || 0,
                promoCode: booking.promoCode,
                roomTax,
                addOns: (booking.addOns || []).map((entry) => ({
                    name: entry.addOn?.name || 'Add-on',
                    quantity: entry.quantity || 1,
                    unitPrice: entry.price,
                    subtotal: entry.subtotal,
                })),
                addOnTax,
                total: booking.totalAmount,
            };

            await Promise.all([
                sendBookingConfirmation({
                    to: booking.guestEmail,
                    guestName: booking.guestName,
                    bookingNumber: booking.bookingNumber,
                    checkIn: checkInStr,
                    checkOut: checkOutStr,
                    charges,
                }).catch(e => console.error(`Failed to send guest confirmation email for ${bookingId}:`, e)),

                sendBookingAlertToStaff({
                    guestName: booking.guestName,
                    guestEmail: booking.guestEmail,
                    guestPhone: booking.guestPhone,
                    bookingNumber: booking.bookingNumber,
                    confirmationNumber: reservationResponse.confirmationNumber,
                    checkIn: checkInStr,
                    checkOut: checkOutStr,
                    nights,
                    adults: booking.adults || 1,
                    children: booking.children || 0,
                    charges,
                }).catch(e => console.error(`Failed to send staff booking alert for ${bookingId}:`, e)),

                // WhatsApp booking confirmation. This only queues a message for the
                // dispatcher, and it is a no-op unless the automation has been
                // switched on and given an approved template — so a hotel that has
                // not set WhatsApp up sees no change here at all. It never throws:
                // a messaging problem must not fail a booking that is already made.
                fireAutomation('booking_confirmation', {
                    phone: booking.guestPhone,
                    name: booking.guestName,
                    dedupe: bookingId,
                    variables: {
                        '1': booking.guestName,
                        '2': booking.bookingNumber,
                        '3': checkInStr,
                        '4': checkOutStr,
                        '5': primaryRoomTypeName,
                    },
                }).then((outcome) => {
                    if (!outcome.queued && outcome.reason !== 'disabled') {
                        console.info(`[whatsapp] booking_confirmation not queued for ${bookingId}: ${outcome.reason}`);
                    }
                }),
            ]);

            return { success: true, booking: reservationResponse };

        } catch (error: unknown) {
            const message = getErrorMessage(error);
            console.error('Finalize Webhook Error:', error);

            if (isRetryableProviderError(error)) {
                await db.insert(bookingLogs).values({
                    bookingId,
                    action: 'crs_retryable_error',
                    level: 'warning',
                    errorMessage: message,
                });

                return {
                    success: false,
                    status: 'pending_retry',
                    retryable: true,
                    message,
                };
            }

            // Attempt failure transition if not already failed
            try {
                const b = await db.query.bookings.findFirst({
                    where: eq(bookings.id, bookingId), columns: { status: true }
                });
                if (b && b.status !== 'failed' && b.status !== 'confirmed') {
                    await bookingStateMachine.transition(bookingId, 'failed', {
                        reason: `Webhook finalize exception: ${message}`
                    });
                }
            } catch { /* ignore secondary failure */ }

            return {
                success: false,
                status: 'failed',
                message,
            };
        } finally {
            // 8. RELEASE LOCK (Mandatory)
            await BookingLockService.releaseLock(bookingId);
        }
    }

    /**
     * Mark a booking as failed, usually initiated by a payment gateway failure webhook
     */
    async markAsFailed(bookingId: string, reason: string) {
        const booking = await db.query.bookings.findFirst({
            where: eq(bookings.id, bookingId),
        });

        if (!booking) {
            throw new Error(`Booking ${bookingId} not found`);
        }

        if (booking.status === 'confirmed') {
            throw new Error(`Booking ${bookingId} is already confirmed. Cannot mark as failed.`);
        }

        if (booking.status !== 'failed' && booking.status !== 'refunded') {
            await bookingStateMachine.transition(bookingId, 'failed', {
                reason: `Payment Failure: ${reason}`
            });

            // Payment-recovery nudge. Queued, never sent inline, and idempotent on
            // the booking id so a gateway that retries its failure webhook cannot
            // message the guest twice. Silent unless the automation is switched on.
            void fireAutomation('payment_failed', {
                phone: booking.guestPhone,
                name: booking.guestName,
                dedupe: bookingId,
                variables: {
                    '1': booking.guestName,
                    '2': booking.bookingNumber,
                },
            });
        }
    }
}
