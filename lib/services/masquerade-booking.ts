/**
 * The Grand Masquerade, 31st Night: pay-and-book.
 *
 * A guest buys one package per room. The most expensive free room type goes first, then the next, down the list,
 * so each paying guest takes the best room still available. The booking is written into the same tables the
 * normal booking flow uses (bookings, booking_items, booking_add_ons, payments), so the existing Easebuzz return
 * route confirms it and finalizeFromWebhook sends the reservation to Hotsoft, the confirmation emails and the
 * WhatsApp message. Nothing about payment or the CRS is re-implemented here.
 *
 * Rooms are held while the guest pays: an unpaid booking counts against availability for HOLD_MS, a paid one
 * counts until Hotsoft has it. Allocation runs under a database advisory lock so two guests at the same moment
 * cannot be handed the same room.
 *
 * Online payment stays off until MASQUERADE_PAYMENTS_ENABLED is "true". Until then the page keeps sending the
 * request form that reservations answer by hand.
 */
import crypto from 'crypto';
import { and, eq, gt, inArray, lt, or, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { addOns, bookingAddOns, bookingGuests, bookingItems, bookings, payments, ratePlans, roomTypes } from '@/lib/db/schema';
import { getBookingProvider } from '@/lib/providers/crs/factory';
import { mapCrsRoomTypeMatchesInternal } from '@/lib/config/crs';
import { EasebuzzService } from '@/lib/services/easebuzz';
import { bookingStateMachine } from '@/lib/services/booking-state-machine';
import { allocateRooms, totalAvailable, type RoomTypeStock } from '@/lib/masquerade-allocation';
import {
    PACKAGE_PRICE_PAISE,
    STAY_CHECK_IN,
    STAY_CHECK_OUT,
    MAX_ROOMS,
    ROOM_ADDONS,
    quoteMasquerade,
    roomHeadcount,
    normalizeRoom,
    validateGuest,
    type RoomAddonId,
} from '@/lib/masquerade-offer';

/** How long an unpaid booking keeps its rooms. */
export const HOLD_MS = 10 * 60 * 1000;

export const MASQUERADE_ADDON_PREFIX = '31st Night: ';

export function isMasqueradePaymentsEnabled(): boolean {
    return process.env.MASQUERADE_PAYMENTS_ENABLED?.trim().toLowerCase() === 'true';
}

export type MasqueradeErrorCode = 'disabled' | 'invalid' | 'sold_out' | 'unavailable' | 'payment_failed';

export class MasqueradeError extends Error {
    constructor(
        public code: MasqueradeErrorCode,
        message: string,
        public available?: number,
    ) {
        super(message);
    }
}

type Executor = Pick<typeof db, 'select'>;

type Stock = { types: RoomTypeStock[]; ratePlanByType: Map<string, string> };

/** Rooms already spoken for on the night: paid and not yet in Hotsoft, or unpaid and still inside the hold. */
async function readHeldRooms(executor: Executor): Promise<Map<string, number>> {
    const holdSince = new Date(Date.now() - HOLD_MS);
    const rows = await executor
        .select({
            roomTypeId: bookingItems.roomTypeId,
            qty: sql<number>`coalesce(sum(${bookingItems.quantity}), 0)`.mapWith(Number),
        })
        .from(bookingItems)
        .innerJoin(bookings, eq(bookings.id, bookingItems.bookingId))
        .where(
            and(
                lt(bookings.checkIn, STAY_CHECK_OUT),
                gt(bookings.checkOut, STAY_CHECK_IN),
                or(
                    inArray(bookings.status, ['payment_success', 'booking_requested']),
                    and(inArray(bookings.status, ['initiated', 'pending_payment']), gt(bookings.createdAt, holdSince)),
                ),
            ),
        )
        .groupBy(bookingItems.roomTypeId);
    return new Map(rows.map((r) => [r.roomTypeId, r.qty]));
}

/**
 * Free rooms by type for the night. Held rooms are read first and the hotel's own count second: if a booking
 * confirms between the two reads it is counted twice (fewer rooms shown), never missed (more shown), so the
 * rooms are never oversold.
 */
async function readStock(executor: Executor): Promise<Stock> {
    const held = await readHeldRooms(executor);

    const types = await executor
        .select({ id: roomTypes.id, slug: roomTypes.slug, name: roomTypes.name, basePrice: roomTypes.basePrice })
        .from(roomTypes)
        .where(eq(roomTypes.status, 'active'));

    const plans = types.length
        ? await executor
            .select({ id: ratePlans.id, roomTypeId: ratePlans.roomTypeId, isDefault: ratePlans.isDefault, order: ratePlans.displayOrder })
            .from(ratePlans)
            .where(and(inArray(ratePlans.roomTypeId, types.map((t) => t.id)), eq(ratePlans.isActive, true)))
        : [];
    const ratePlanByType = new Map<string, string>();
    for (const plan of [...plans].sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || (a.order ?? 0) - (b.order ?? 0))) {
        if (!ratePlanByType.has(plan.roomTypeId)) ratePlanByType.set(plan.roomTypeId, plan.id);
    }

    const availability = await getBookingProvider().checkAvailability({
        checkIn: STAY_CHECK_IN,
        checkOut: STAY_CHECK_OUT,
        adults: 2,
        children: 0,
    });
    if (availability.status !== 'success') {
        throw new MasqueradeError('unavailable', availability.message || 'We could not check room availability. Please try again shortly.');
    }

    const stock: RoomTypeStock[] = [];
    for (const type of types) {
        const crs = availability.rooms.find((room) =>
            mapCrsRoomTypeMatchesInternal({ internalRoomTypeId: type.id, internalRoomTypeSlug: type.slug, crsRoomTypeId: room.roomTypeId }),
        );
        if (!crs || !ratePlanByType.has(type.id)) continue;
        stock.push({
            roomTypeId: type.id,
            name: type.name,
            pricePaise: crs.price || type.basePrice,
            available: Math.max(0, crs.availableCount - (held.get(type.id) ?? 0)),
        });
    }
    return { types: stock, ratePlanByType };
}

let statusCache: { at: number; available: number | null } | null = null;

/** What the page needs to know before it shows the form. Cached briefly because it asks the hotel's system. */
export async function getMasqueradeStatus(): Promise<{ paymentsEnabled: boolean; available: number | null; soldOut: boolean }> {
    const paymentsEnabled = isMasqueradePaymentsEnabled();
    if (!paymentsEnabled) return { paymentsEnabled, available: null, soldOut: false };

    if (!statusCache || Date.now() - statusCache.at > 15_000) {
        try {
            const { types } = await readStock(db);
            statusCache = { at: Date.now(), available: totalAvailable(types) };
        } catch (error) {
            console.error('[masquerade] status check failed', error);
            statusCache = { at: Date.now(), available: null };
        }
    }
    const available = statusCache.available;
    return { paymentsEnabled, available, soldOut: available !== null && available < 1 };
}

/** Make sure each add-on has a row to hang the booking line on. Inactive, so none appears on the normal booking page. */
async function ensureAddOnRows(items: { name: string; unitPaise: number }[]): Promise<Map<string, string>> {
    const names = items.map((i) => MASQUERADE_ADDON_PREFIX + i.name);
    const existing = names.length ? await db.select({ id: addOns.id, name: addOns.name }).from(addOns).where(inArray(addOns.name, names)) : [];
    const byName = new Map(existing.map((r) => [r.name, r.id]));

    const missing = items.filter((i) => !byName.has(MASQUERADE_ADDON_PREFIX + i.name));
    if (missing.length) {
        const inserted = await db
            .insert(addOns)
            .values(
                missing.map((i) => ({
                    name: MASQUERADE_ADDON_PREFIX + i.name,
                    description: 'The Grand Masquerade, 31 December. Sold only through the 31st Night booking.',
                    price: i.unitPaise,
                    type: 'per_unit' as const,
                    taxRate: 18,
                    isActive: false,
                    sortOrder: 900,
                })),
            )
            .returning({ id: addOns.id, name: addOns.name });
        for (const row of inserted) byName.set(row.name, row.id);
    }
    return byName;
}

export interface MasqueradeCheckoutInput {
    name: string;
    email: string;
    phone: string;
    rooms: Partial<Record<RoomAddonId, unknown>>[];
    extras: Record<string, unknown>;
    notes: string;
    acceptedTerms: boolean;
}

function describeRoom(index: number, room: ReturnType<typeof normalizeRoom>, roomName: string): string {
    const parts = ['2 adults'];
    if (room['extra-adult']) parts.push('1 extra adult');
    if (room['junior-guest']) parts.push(`${room['junior-guest']} junior guest${room['junior-guest'] > 1 ? 's' : ''} (6-11)`);
    if (room['little-ones']) parts.push(`${room['little-ones']} little one${room['little-ones'] > 1 ? 's' : ''} (under 6)`);
    if (room.nanny) parts.push('nanny');
    return `Room ${index + 1} (${roomName}): ${parts.join(', ')}`;
}

/**
 * Reserves the rooms, writes the booking and starts the payment. Returns the Easebuzz page to send the guest to.
 * If anything fails after the booking is written, the booking is failed so its rooms go straight back.
 */
export async function startMasqueradeCheckout(input: MasqueradeCheckoutInput): Promise<{ payUrl: string; bookingNumber: string; totalPaise: number }> {
    if (!isMasqueradePaymentsEnabled()) throw new MasqueradeError('disabled', 'Online booking for the 31st Night is not open yet.');
    if (!EasebuzzService.isConfigured) throw new MasqueradeError('unavailable', 'Online payment is not available right now. Please call us.');

    const name = input.name.trim().slice(0, 120);
    const email = input.email.trim().slice(0, 160);
    const phone = input.phone.trim().slice(0, 20);
    const notes = input.notes.trim().slice(0, 1000);

    const guestErrors = validateGuest({ name, email, phone });
    if (Object.keys(guestErrors).length) throw new MasqueradeError('invalid', Object.values(guestErrors)[0]);
    if (!input.acceptedTerms) throw new MasqueradeError('invalid', 'Please accept the terms to continue.');
    if (!Array.isArray(input.rooms) || input.rooms.length < 1 || input.rooms.length > MAX_ROOMS) {
        throw new MasqueradeError('invalid', `Choose between 1 and ${MAX_ROOMS} packages.`);
    }

    const quote = quoteMasquerade(input.rooms, input.extras);
    if (quote.problem) throw new MasqueradeError('invalid', quote.problem);
    const rooms = input.rooms.map(normalizeRoom);

    const addOnIds = quote.addOnTotals.length
        ? await ensureAddOnRows(quote.addOnTotals.map((t) => ({ name: t.name, unitPaise: t.unitPaise })))
        : new Map<string, string>();

    const rand = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    const now = new Date();
    const bookingNumber = `OL-${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}-${rand()}`;
    const txnId = `OL-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const headcount = rooms.map(roomHeadcount);
    const adults = headcount.reduce((s, h) => s + h.adults, 0);
    const children = headcount.reduce((s, h) => s + h.children, 0);
    const [firstName, ...rest] = name.split(/\s+/);

    // One transaction under an advisory lock: count what is free, give out the best rooms, write the booking.
    const created = await db.transaction(async (tx) => {
        await tx.execute(sql`select pg_advisory_xact_lock(hashtext('masquerade-31st-night'))`);

        const { types, ratePlanByType } = await readStock(tx as unknown as Executor);
        const allocation = allocateRooms(types, quote.rooms);
        if (!allocation.ok) {
            throw new MasqueradeError(
                'sold_out',
                allocation.available > 0
                    ? `Only ${allocation.available} room${allocation.available > 1 ? 's are' : ' is'} left for the 31st Night. Please choose fewer packages.`
                    : 'The 31st Night is sold out.',
                allocation.available,
            );
        }

        const roomNotes = allocation.rooms.map((room, i) => describeRoom(i, rooms[i], room.name));
        const extraNotes = quote.addOnTotals
            .filter((t) => !ROOM_ADDONS.some((r) => r.id === t.id))
            .map((t) => `${t.name} x ${t.qty} (outside the hotel)`);
        const specialRequests = [
            'THE GRAND MASQUERADE, 31 DECEMBER. Package price includes the room.',
            ...roomNotes,
            ...extraNotes,
            notes ? `Guest note: ${notes}` : '',
        ]
            .filter(Boolean)
            .join('\n');

        const [booking] = await tx
            .insert(bookings)
            .values({
                bookingNumber,
                guestName: name,
                guestEmail: email,
                guestPhone: phone,
                specialRequests,
                checkIn: STAY_CHECK_IN,
                checkOut: STAY_CHECK_OUT,
                adults,
                children,
                baseAmount: quote.roomSubtotalPaise,
                subtotal: quote.subtotalPaise,
                taxAmount: quote.gstPaise,
                totalAmount: quote.totalPaise,
                status: 'initiated',
                paymentStatus: 'pending',
                ratePlanId: ratePlanByType.get(allocation.rooms[0].roomTypeId),
                version: 1,
            })
            .returning({ id: bookings.id });

        const byType = new Map<string, number>();
        for (const room of allocation.rooms) byType.set(room.roomTypeId, (byType.get(room.roomTypeId) ?? 0) + 1);
        await tx.insert(bookingItems).values(
            [...byType.entries()].map(([roomTypeId, quantity]) => ({
                bookingId: booking.id,
                roomTypeId,
                ratePlanId: ratePlanByType.get(roomTypeId),
                quantity,
                pricePerNight: PACKAGE_PRICE_PAISE,
                nights: 1,
                subtotal: PACKAGE_PRICE_PAISE * quantity,
            })),
        );

        await tx.insert(bookingGuests).values({ bookingId: booking.id, firstName, lastName: rest.join(' '), guestType: 'adult' });

        if (quote.addOnTotals.length) {
            await tx.insert(bookingAddOns).values(
                quote.addOnTotals.map((t) => ({
                    bookingId: booking.id,
                    addOnId: addOnIds.get(MASQUERADE_ADDON_PREFIX + t.name)!,
                    quantity: t.qty,
                    price: t.unitPaise,
                    taxRate: 18,
                    subtotal: t.subtotalPaise,
                })),
            );
        }

        await tx.insert(payments).values({
            bookingId: booking.id,
            amount: quote.totalPaise,
            status: 'pending',
            paymentMethod: 'easebuzz',
            easebuzzOrderId: txnId,
        });

        return { bookingId: booking.id };
    });

    // The rooms are held from here. Anything that goes wrong now must hand them back.
    try {
        await bookingStateMachine.transition(created.bookingId, 'pending_payment', {
            reason: 'The Grand Masquerade 31st Night: booking created, awaiting payment',
            metadata: { txnId },
        });

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://oliviaalleppey.com';
        const { payUrl } = await EasebuzzService.initiatePayment({
            orderId: txnId,
            amount: quote.totalPaise,
            name,
            email,
            // Easebuzz wants ten digits, no country code.
            phone: phone.replace(/\D/g, '').slice(-10),
            returnUrl: `${baseUrl}/api/payment/easebuzz`,
        });
        return { payUrl, bookingNumber, totalPaise: quote.totalPaise };
    } catch (error) {
        console.error(`[masquerade] payment could not be started for ${bookingNumber}`, error);
        await bookingStateMachine
            .transition(created.bookingId, 'failed', { reason: 'Payment could not be started; rooms released' })
            .catch((e) => console.error('[masquerade] could not release the rooms', e));
        throw new MasqueradeError('payment_failed', 'We could not start the payment. Please try again, or call us.');
    }
}

