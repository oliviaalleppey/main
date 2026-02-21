import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { addOns, bookingSessions, roomTypes } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { CheckoutForm } from '@/components/booking/checkout-form';
import {
    AlertCircle,
    CircleCheck,
    CircleDot,
    Clock3,
    PhoneCall,
    ShieldCheck,
    Sparkles
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { GuestForm } from '@/components/booking/guest-form';
import { AddOnsSelector } from '@/components/booking/add-ons-selector';
import { MiniStayEditor } from '@/components/booking/mini-stay-editor';
import { RoomSelectionsEditor } from '@/components/booking/room-selections-editor';
import { ensureRoomTypeMinOccupancyColumn } from '@/lib/db/schema-guard';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount / 100);
};

const toDateOnlyString = (value: string | Date | null | undefined) => {
    if (!value) return '';
    if (typeof value === 'string') return value.slice(0, 10);
    return value.toISOString().slice(0, 10);
};

const sanitizeRoomCount = (value: unknown) => {
    const parsed = typeof value === 'number'
        ? value
        : Number.parseInt(String(value || 1), 10);

    if (!Number.isFinite(parsed)) return 1;
    return Math.min(8, Math.max(1, parsed));
};

type GuestDetails = {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    requests?: string;
};

type QuoteSnapshot = {
    pricePerNight?: number;
    totalPrice?: number;
    taxesAndFees?: number;
    externalRatePlanId?: string;
    capturedAt?: string;
};

type SelectedAddOn = {
    addOnId: string;
    quantity: number;
};

type RoomSelection = {
    roomTypeId: string;
    roomSlug?: string;
    ratePlanId?: string;
    quantity?: number;
    quoteSnapshot?: QuoteSnapshot;
};

type SessionCartData = {
    guestDetails?: GuestDetails;
    quoteSnapshot?: QuoteSnapshot;
    roomSelection?: RoomSelection;
    roomSelections?: RoomSelection[];
    selectedAddOns?: SelectedAddOn[];
    [key: string]: unknown;
};

const sanitizeRoomSelections = (value: unknown): RoomSelection[] => {
    if (!Array.isArray(value)) return [];

    const selections: RoomSelection[] = [];

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
};

const getSessionRoomSelections = (
    session: typeof bookingSessions.$inferSelect,
    cartData: SessionCartData,
): RoomSelection[] => {
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
};

export default async function CheckoutPage({
    searchParams
}: {
    searchParams: Promise<{ error?: string; edit?: string }>;
}) {
    await ensureRoomTypeMinOccupancyColumn();

    const { error, edit } = await searchParams;
    const sessionToken = (await cookies()).get('booking_session')?.value;
    if (!sessionToken) redirect('/book/search');

    const session = await db.query.bookingSessions.findFirst({
        where: eq(bookingSessions.id, sessionToken)
    });
    if (!session) redirect('/book/search');

    const availableAddOns = await db.query.addOns.findMany({
        where: eq(addOns.isActive, true),
        orderBy: (table, { asc }) => [asc(table.sortOrder), asc(table.name)],
    });

    const nights = Math.max(
        1,
        Math.ceil((new Date(session.checkOut!).getTime() - new Date(session.checkIn!).getTime()) / (1000 * 60 * 60 * 24))
    );

    const cartData = (session.cartData as SessionCartData | null) || {};
    const guestDetails = cartData.guestDetails || {};
    const roomSelections = getSessionRoomSelections(session, cartData);
    if (!roomSelections.length) return <div>No rooms selected</div>;

    const selectedRoomTypeIds = Array.from(new Set(roomSelections.map((selection) => selection.roomTypeId)));
    const selectedRooms = await db.query.roomTypes.findMany({
        where: inArray(roomTypes.id, selectedRoomTypeIds),
    });
    const roomMap = new Map(selectedRooms.map((room) => [room.id, room]));

    const roomLineItems = roomSelections
        .map((selection) => {
            const room = roomMap.get(selection.roomTypeId);
            if (!room) return null;

            const quantity = sanitizeRoomCount(selection.quantity);
            const quotedPricePerNight = selection.quoteSnapshot?.pricePerNight || room.basePrice;
            const computedSubtotal = quotedPricePerNight * nights * quantity;
            const quotedSubtotal = selection.quoteSnapshot?.totalPrice;
            const subtotal = typeof quotedSubtotal === 'number' && quotedSubtotal > 0
                ? Math.max(quotedSubtotal, computedSubtotal)
                : computedSubtotal;

            return {
                room,
                quantity,
                quotedPricePerNight,
                subtotal,
            };
        })
        .filter((entry): entry is { room: typeof roomTypes.$inferSelect; quantity: number; quotedPricePerNight: number; subtotal: number } => entry !== null);

    if (!roomLineItems.length) return <div>Selected room types are no longer available.</div>;

    const primaryRoom = roomLineItems[0].room;
    const totalRoomCount = roomLineItems.reduce((sum, entry) => sum + entry.quantity, 0);
    const selectedRoomTypeCount = roomLineItems.length;
    const roomSubtotal = roomLineItems.reduce((sum, entry) => sum + entry.subtotal, 0);
    const selectedAddOns = Array.isArray(cartData.selectedAddOns)
        ? cartData.selectedAddOns
            .map((entry) => {
                const quantity = Number.parseInt(String(entry.quantity || 0), 10);
                if (!entry.addOnId || !Number.isFinite(quantity) || quantity < 1) return null;
                return {
                    addOnId: entry.addOnId,
                    quantity: Math.min(10, quantity),
                };
            })
            .filter((entry): entry is SelectedAddOn => entry !== null)
        : [];

    const selectedAddOnMap = new Map(selectedAddOns.map((entry) => [entry.addOnId, entry.quantity]));
    const selectedAddOnRows = availableAddOns
        .filter((addOn) => selectedAddOnMap.has(addOn.id))
        .map((addOn) => ({
            id: addOn.id,
            name: addOn.name,
            quantity: selectedAddOnMap.get(addOn.id) || 0,
            price: addOn.price,
            subtotal: addOn.price * (selectedAddOnMap.get(addOn.id) || 0),
        }))
        .filter((entry) => entry.quantity > 0);

    const addOnsTotal = selectedAddOnRows.reduce((sum, entry) => sum + entry.subtotal, 0);
    const totalPrice = roomSubtotal + addOnsTotal;

    const hasRequiredGuestDetails = Boolean(
        guestDetails.firstName &&
        guestDetails.lastName &&
        guestDetails.email &&
        guestDetails.phone
    );
    const isEditingGuestDetails = edit === '1' || !hasRequiredGuestDetails;
    const showPaymentSection = hasRequiredGuestDetails && !isEditingGuestDetails;
    const errorMessage = error ? decodeURIComponent(error) : '';
    const showGuestDetailsError = errorMessage.toLowerCase().includes('guest details');
    const checkInDate = new Date(session.checkIn!);
    const checkOutDate = new Date(session.checkOut!);
    const stayDatesLabel = `${checkInDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        weekday: 'short',
    })} - ${checkOutDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        weekday: 'short',
    })}`;
    const sessionExpiresAt = session.expiresAt ? new Date(session.expiresAt) : null;
    const sessionExpiryLabel = sessionExpiresAt
        ? sessionExpiresAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        : 'soon';
    const selectedAddOnsCount = selectedAddOnRows.reduce((sum, entry) => sum + entry.quantity, 0);
    const addMoreRoomsParams = new URLSearchParams({
        checkIn: toDateOnlyString(session.checkIn),
        checkOut: toDateOnlyString(session.checkOut),
        adults: String(session.adults || 1),
        children: String(session.children || 0),
        rooms: String(Math.min(8, Math.max(1, totalRoomCount))),
    });
    const addMoreRoomsHref = `/book/search?${addMoreRoomsParams.toString()}`;

    return (
        <div className="min-h-screen bg-[#FBFBF9] py-4 md:py-12 px-3 md:px-6">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-12">
                <div className="lg:col-span-2 order-2 lg:order-1">
                    <div className="mb-4 md:mb-8 rounded-xl md:rounded-2xl border border-gray-200 bg-gradient-to-r from-white to-gray-50 p-3 md:p-5">
                        <p className="text-[11px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.25em] text-gray-500 mb-3 md:mb-4">Booking Progress</p>
                        <div className="grid grid-cols-3 gap-2 md:gap-3 text-[11px] md:text-sm">
                            <div className="rounded-lg md:rounded-xl border border-emerald-200 bg-emerald-50 px-2 md:px-3 py-1.5 md:py-2 text-emerald-700 font-medium inline-flex items-center gap-1.5 md:gap-2">
                                <CircleCheck className="w-4 h-4" />
                                <span>1. Select Room</span>
                            </div>
                            <div className={`rounded-lg md:rounded-xl px-2 md:px-3 py-1.5 md:py-2 inline-flex items-center gap-1.5 md:gap-2 font-medium border ${
                                hasRequiredGuestDetails
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : 'border-[#1C1C1C]/20 bg-white text-[#1C1C1C]'
                            }`}>
                                {hasRequiredGuestDetails ? <CircleCheck className="w-4 h-4" /> : <CircleDot className="w-4 h-4" />}
                                <span>2. Guest Details</span>
                            </div>
                            <div className={`rounded-lg md:rounded-xl px-2 md:px-3 py-1.5 md:py-2 inline-flex items-center gap-1.5 md:gap-2 border ${
                                showPaymentSection
                                    ? 'border-[#1C1C1C]/20 bg-white text-[#1C1C1C] font-semibold'
                                    : 'border-gray-200 bg-gray-50 text-gray-400 font-medium'
                            }`}>
                                <CircleDot className="w-4 h-4" />
                                <span>3. Payment</span>
                            </div>
                        </div>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-serif mb-1 md:mb-2">Checkout</h1>
                    <p className="text-sm md:text-base text-gray-500 mb-1 md:mb-2">
                        {showPaymentSection
                            ? 'Review details, add enhancements, and complete payment.'
                            : 'Add guest details to continue to payment.'}
                    </p>
                    <p className="text-xs text-gray-500 mb-4 md:mb-8 inline-flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                        Your details are used for invoice, confirmation, and support only.
                    </p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-3 md:p-4 rounded-xl mb-4 md:mb-6 flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold">Booking Could Not Be Completed</h4>
                                <p className="text-sm">{errorMessage}</p>
                            </div>
                        </div>
                    )}

                    <div className="bg-white p-4 md:p-8 rounded-xl md:rounded-2xl shadow-sm border border-gray-100 mb-4 md:mb-8">
                        <div className="flex items-center justify-between gap-3 md:gap-4 mb-3 md:mb-4">
                            <div>
                                <h3 className="text-xl md:text-2xl font-semibold text-[#1C1C1C]">Guest Information</h3>
                                <p className="text-xs text-gray-500 mt-1">Primary contact for this reservation</p>
                            </div>
                            {hasRequiredGuestDetails && !isEditingGuestDetails && (
                                <Link
                                    href="/book/checkout?edit=1"
                                    className="text-xs font-semibold uppercase tracking-wider text-[#1C1C1C] hover:text-[#E95D20] transition-colors rounded-lg border border-gray-300 px-3 py-1.5"
                                >
                                    Edit Details
                                </Link>
                            )}
                        </div>

                        {isEditingGuestDetails ? (
                            <div>
                                {showGuestDetailsError && (
                                    <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                                        Please save valid guest details before payment.
                                    </p>
                                )}
                                <GuestForm
                                    initialValues={guestDetails}
                                    submitLabel={hasRequiredGuestDetails ? 'Save Guest Details' : 'Save & Continue to Payment'}
                                />
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 text-xs md:text-sm">
                                    <div className="rounded-lg md:rounded-xl border border-gray-200 bg-gray-50 px-3 md:px-4 py-2.5 md:py-3">
                                        <span className="text-gray-500 block text-xs uppercase tracking-wider">Name</span>
                                        <span className="font-medium text-sm md:text-base">{guestDetails.firstName || '-'} {guestDetails.lastName || ''}</span>
                                    </div>
                                    <div className="rounded-lg md:rounded-xl border border-gray-200 bg-gray-50 px-3 md:px-4 py-2.5 md:py-3">
                                        <span className="text-gray-500 block text-xs uppercase tracking-wider">Email</span>
                                        <span className="font-medium text-sm md:text-base break-all">{guestDetails.email || '-'}</span>
                                    </div>
                                    <div className="rounded-lg md:rounded-xl border border-gray-200 bg-gray-50 px-3 md:px-4 py-2.5 md:py-3">
                                        <span className="text-gray-500 block text-xs uppercase tracking-wider">Phone</span>
                                        <span className="font-medium text-sm md:text-base">{guestDetails.phone || '-'}</span>
                                    </div>
                                </div>
                                <div className="mt-2 md:mt-4 rounded-lg md:rounded-xl border border-gray-200 bg-gray-50 px-3 md:px-4 py-2.5 md:py-3">
                                    <span className="text-gray-500 block text-xs uppercase tracking-wider">Special Requests</span>
                                    <p className="text-sm mt-1 text-gray-800">{guestDetails.requests || 'None'}</p>
                                </div>
                            </>
                        )}
                    </div>

                    {availableAddOns.length > 0 && (
                        <div className="bg-white p-4 md:p-8 rounded-xl md:rounded-2xl shadow-sm border border-gray-100 mb-4 md:mb-8">
                            <AddOnsSelector
                                options={availableAddOns}
                                initialSelected={selectedAddOns}
                            />
                        </div>
                    )}

                    <div className="bg-white p-4 md:p-8 rounded-xl md:rounded-2xl shadow-sm border border-gray-100">
                        <div className="mb-4 md:mb-6">
                            <h3 className="text-xl md:text-2xl font-semibold text-[#1C1C1C]">Payment</h3>
                            <p className="text-xs text-gray-500 mt-1">Final step to confirm your reservation</p>
                        </div>
                        {showPaymentSection ? (
                            <CheckoutForm amount={totalPrice} />
                        ) : (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                                <p className="text-sm font-semibold">Guest details required before payment</p>
                                <p className="text-xs mt-1">
                                    Save guest details above to unlock secure payment and booking confirmation.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="order-1 lg:order-2 bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-gray-100 h-fit lg:sticky lg:top-8">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 md:pb-4 mb-3 md:mb-4">
                        <h2 className="text-lg md:text-xl font-medium">Order Summary</h2>
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Secure
                        </span>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                        <div className="flex gap-3">
                            {primaryRoom.images && primaryRoom.images[0] && (
                                <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden flex-shrink-0">
                                    <Image src={primaryRoom.images[0]} alt={primaryRoom.name} fill className="object-cover" />
                                </div>
                            )}
                            <div className="min-w-0">
                                <h3 className="font-serif text-lg md:text-xl leading-tight text-[#1C1C1C]">
                                    {primaryRoom.name}
                                    {selectedRoomTypeCount > 1 ? ` + ${selectedRoomTypeCount - 1} more type${selectedRoomTypeCount - 1 > 1 ? 's' : ''}` : ''}
                                </h3>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    <span className="rounded-full bg-white border border-gray-200 px-2 py-0.5 text-[11px] text-gray-700">
                                        {nights} night{nights > 1 ? 's' : ''}
                                    </span>
                                    <span className="rounded-full bg-white border border-gray-200 px-2 py-0.5 text-[11px] text-gray-700">
                                        {totalRoomCount} room{totalRoomCount > 1 ? 's' : ''}
                                    </span>
                                    <span className="rounded-full bg-white border border-gray-200 px-2 py-0.5 text-[11px] text-gray-700">
                                        {session.adults} Adults, {session.children} Children
                                    </span>
                                    {selectedAddOnsCount > 0 && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] text-amber-800">
                                            <Sparkles className="w-3 h-3" />
                                            {selectedAddOnsCount} Add-on{selectedAddOnsCount > 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">{stayDatesLabel}</p>
                    </div>

                    <div className="mt-3 space-y-2">
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 flex items-start gap-2">
                            <Clock3 className="w-4 h-4 mt-0.5 text-amber-700 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-semibold text-amber-900">
                                    Session hold until: {sessionExpiryLabel}
                                </p>
                                <p className="text-[11px] text-amber-800">Complete payment to secure this selection.</p>
                            </div>
                        </div>
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 flex items-start gap-2">
                            <ShieldCheck className="w-4 h-4 mt-0.5 text-emerald-700 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-semibold text-emerald-900">Protected checkout</p>
                                <p className="text-[11px] text-emerald-800">Pricing and inventory are re-verified before confirmation.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <MiniStayEditor
                            checkIn={toDateOnlyString(session.checkIn)}
                            checkOut={toDateOnlyString(session.checkOut)}
                            adults={session.adults || 1}
                            childCount={session.children || 0}
                            roomCount={totalRoomCount}
                        />
                    </div>

                    <div className="mt-4">
                        <RoomSelectionsEditor
                            items={roomLineItems.map((entry) => ({
                                roomTypeId: entry.room.id,
                                roomName: entry.room.name,
                                quantity: entry.quantity,
                                quotedPricePerNight: entry.quotedPricePerNight,
                                nights,
                            }))}
                            adults={session.adults || 1}
                            addMoreRoomsHref={addMoreRoomsHref}
                        />
                    </div>

                    <div className="space-y-2.5 md:space-y-3 text-xs md:text-sm text-gray-600 mt-4 border-t border-gray-100 pt-4">
                        <div className="flex justify-between">
                            <span>Dates</span>
                            <span className="font-medium text-black text-right">{stayDatesLabel}</span>
                        </div>
                        {roomLineItems.map((entry) => (
                            <div key={entry.room.id} className="flex justify-between">
                                <span className="max-w-[70%]">
                                    {entry.room.name} ({formatCurrency(entry.quotedPricePerNight)} x {nights}N x {entry.quantity}R)
                                </span>
                                <span className="font-medium text-black">{formatCurrency(entry.subtotal)}</span>
                            </div>
                        ))}
                        <div className="flex justify-between">
                            <span>Room Subtotal</span>
                            <span className="font-medium text-black">{formatCurrency(roomSubtotal)}</span>
                        </div>
                        {selectedAddOnRows.length > 0 && (
                            <div className="pt-2 border-t border-dashed border-gray-200 space-y-2">
                                {selectedAddOnRows.map((entry) => (
                                    <div key={entry.id} className="flex justify-between text-xs">
                                        <span>{entry.name} x {entry.quantity}</span>
                                        <span className="font-medium text-black">{formatCurrency(entry.subtotal)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between text-sm">
                                    <span>Add-ons Total</span>
                                    <span className="font-medium text-black">{formatCurrency(addOnsTotal)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 border-t border-gray-100 pt-4">
                        <div className="flex justify-between items-end">
                            <span className="text-gray-900 font-semibold">Total to Pay</span>
                            <span className="text-2xl md:text-3xl font-serif text-[#E95D20]">{formatCurrency(totalPrice)}</span>
                        </div>
                        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-2.5 md:p-3 flex items-center justify-between gap-2 md:gap-3">
                            <p className="text-[11px] text-gray-600 uppercase tracking-wider">Need help booking?</p>
                            <Link
                                href="/contact"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#1C1C1C] hover:text-[#E95D20] transition-colors"
                            >
                                <PhoneCall className="w-3.5 h-3.5" />
                                Talk to Reservations
                            </Link>
                        </div>
                        <p className="text-xs text-gray-400 mt-3 text-center">Secure SSL encrypted transaction</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
