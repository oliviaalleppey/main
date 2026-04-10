import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { addOns, addOnRoomTypes, bookingSessions, roomTypes } from '@/lib/db/schema';
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
import { CheckoutStepper } from '@/components/booking/checkout-stepper';
import { SearchStayEditor } from '@/components/booking/search-stay-editor';
import { CheckoutRoomList } from '@/components/booking/checkout-room-list';
import { getAvailableRoomsForSearch } from '@/lib/services/search';
import { updateSessionSearch } from '@/app/book/actions';
import { GuestForm } from '@/components/booking/guest-form';
import { AddOnsSelector } from '@/components/booking/add-ons-selector';
import { ensureRoomTypeMinOccupancyColumn } from '@/lib/db/schema-guard';
import { formatRoomName } from '@/lib/utils';
import { Pencil, Check } from 'lucide-react';
import { format } from 'date-fns';

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
            const taxRate = (room as any).taxRate ?? 12;
            const computedTaxes = Math.round(computedSubtotal * (taxRate / 100));
            const quotedTaxes = selection.quoteSnapshot?.taxesAndFees;
            const taxesAndFees = typeof quotedTaxes === 'number' && quotedTaxes > 0
                ? quotedTaxes
                : computedTaxes;

            return {
                room,
                quantity,
                quotedPricePerNight,
                subtotal,
                taxesAndFees,
            };
        })
        .filter((entry): entry is { room: typeof roomTypes.$inferSelect; quantity: number; quotedPricePerNight: number; subtotal: number; taxesAndFees: number } => entry !== null);

    if (!roomLineItems.length) return <div>Selected room types are no longer available.</div>;

    const primaryRoom = roomLineItems[0].room;
    const primaryRoomName = formatRoomName(primaryRoom.name);
    const totalRoomCount = roomLineItems.reduce((sum, entry) => sum + entry.quantity, 0);
    const selectedRoomTypeCount = roomLineItems.length;
    const roomSubtotal = roomLineItems.reduce((sum, entry) => sum + entry.subtotal, 0);
    const roomTaxesAndFees = roomLineItems.reduce((sum, entry) => sum + entry.taxesAndFees, 0);
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
            taxRate: addOn.taxRate ?? 18,
            subtotal: addOn.price * (selectedAddOnMap.get(addOn.id) || 0),
        }))
        .filter((entry) => entry.quantity > 0);

    const addOnsTotal = selectedAddOnRows.reduce((sum, entry) => sum + entry.subtotal, 0);
    // Calculate tax for each add-on based on its specific tax rate
    const addOnsTax = selectedAddOnRows.reduce((sum, entry) => {
        return sum + Math.round(entry.subtotal * (entry.taxRate / 100));
    }, 0);
    const taxesAndFeesTotal = roomTaxesAndFees + addOnsTax;
    const totalPrice = roomSubtotal + addOnsTotal + taxesAndFeesTotal;

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
    if (sessionExpiresAt && sessionExpiresAt.getTime() <= Date.now()) {
        redirect('/book/search?error=session_expired');
    }
    const sessionRemainingMs = sessionExpiresAt
        ? Math.max(0, sessionExpiresAt.getTime() - Date.now())
        : 0;
    const sessionRemainingMinutes = Math.ceil(sessionRemainingMs / (1000 * 60));
    const sessionHoldLabel = sessionExpiresAt
        ? sessionRemainingMinutes <= 1
            ? 'Less than 1 minute left'
            : `${sessionRemainingMinutes} minutes left`
        : 'Expires soon';
    const sessionExpiryLabel = sessionExpiresAt
        ? sessionExpiresAt.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Kolkata',
        })
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

    const initialStep = roomLineItems.length === 0 ? 2 : (showPaymentSection ? 5 : 3);

    const searchPayload = await getAvailableRoomsForSearch(
        checkInDate,
        checkOutDate,
        { adults: session.adults || 1, children: session.children || 0 },
        Math.max(1, totalRoomCount)
    );
    const availableRooms = searchPayload.rooms;
    const searchError = searchPayload.error;

    return (
        <div className="min-h-screen bg-[var(--surface-cream)] py-4 md:py-8 px-4 md:px-6">
            <CheckoutStepper
                hasGuestDetails={hasRequiredGuestDetails}
                initialStep={initialStep}
                selectedRatePlanId={session.selectedRatePlanId || undefined}
                searchHash={`${session.checkIn}-${session.checkOut}-${session.adults}-${session.children}`}
                searchStep={
                    <div className="text-sm font-semibold text-gray-900 leading-tight">
                        <span>{format(new Date(session.checkIn as string | Date), 'dd MMM yyyy')} - {format(new Date(session.checkOut as string | Date), 'dd MMM yyyy')}</span>
                        <span className="hidden sm:inline mx-2 text-gray-400">/</span>
                        <span className="block sm:inline mt-1 sm:mt-0">{totalRoomCount} Room{totalRoomCount > 1 ? 's' : ''}, {session.adults} Adult{session.adults !== 1 ? 's' : ''}</span>
                    </div>
                }
                inlineSearchEditor={
                    <SearchStayEditor
                        initialCheckIn={new Date(session.checkIn!)}
                        initialCheckOut={new Date(session.checkOut!)}
                        initialAdults={session.adults || 1}
                        initialChildren={session.children || 0}
                        initialRooms={Math.max(1, totalRoomCount)}
                        onUpdate={async (checkIn, checkOut, adults, children) => {
                            "use server";
                            await updateSessionSearch({ checkIn, checkOut, adults, children });
                        }}
                    />
                }
                roomStep={
                    <div key="room-step" className="space-y-1.5 mt-1">
                        {roomLineItems.length > 0 ? roomLineItems.map(item => (
                            <div key={item.room.id} className="text-sm font-semibold text-gray-900 leading-tight flex flex-col sm:flex-row sm:items-center">
                                <span>{formatRoomName(item.room.name)}</span>
                                <span className="text-xs font-medium text-gray-500 sm:ml-2 mt-0.5 sm:mt-0">{formatCurrency(item.subtotal)} Room/Night</span>
                            </div>
                        )) : <span className="text-sm text-gray-500 font-semibold">No room selected.</span>}
                    </div>
                }
                roomListContent={
                    <CheckoutRoomList
                        rooms={availableRooms}
                        selectedRoomTypeId={session.selectedRoomTypeId || ''}
                        errorMessage={searchError}
                    />
                }
                availableAddOns={availableAddOns}
                selectedAddOns={selectedAddOns}
                guestInfoContent={
                    <div key="guest-info">
                        {showGuestDetailsError && (
                            <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900">
                                Please save valid guest details before payment.
                            </p>
                        )}
                        <GuestForm
                            initialValues={guestDetails}
                            submitLabel="Save Guest Details"
                        />
                    </div>
                }
                paymentContent={
                    <div key="payment-content">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-[var(--text-dark)]">Payment</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Final step to confirm your reservation</p>
                        </div>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 p-3 md:p-4 rounded-xl mb-4 flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold">Booking Could Not Be Completed</h4>
                                    <p className="text-sm">{errorMessage}</p>
                                </div>
                            </div>
                        )}
                        {showPaymentSection ? (
                            <CheckoutForm amount={totalPrice} />
                        ) : (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                                <p className="text-sm font-semibold">Guest details required before payment</p>
                                <p className="text-xs mt-1">
                                    Save guest details to unlock secure payment.
                                </p>
                            </div>
                        )}
                    </div>
                }
                orderSummary={
                    <div key="order-summary" className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                            <h2 className="text-lg font-medium">Your Booking Details</h2>
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Secure
                            </span>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 mb-4">
                            <div className="flex gap-3">
                                {primaryRoom.images && primaryRoom.images[0] && (
                                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                        <Image src={primaryRoom.images[0]} alt={primaryRoomName} fill className="object-cover" />
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-serif text-lg leading-tight text-[var(--text-dark)]">
                                        {primaryRoomName}
                                        {selectedRoomTypeCount > 1 ? ` + ${selectedRoomTypeCount - 1} more type${selectedRoomTypeCount - 1 > 1 ? 's' : ''}` : ''}
                                    </h3>
                                    <div className="mt-2 flex flex-wrap gap-1.5 whitespace-nowrap">
                                        <span className="bg-white border border-gray-200 px-2 py-0.5 text-[11px] text-gray-700 rounded-sm">
                                            {nights} night{nights > 1 ? 's' : ''}
                                        </span>
                                        <span className="bg-white border border-gray-200 px-2 py-0.5 text-[11px] text-gray-700 rounded-sm">
                                            {totalRoomCount} room{totalRoomCount > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 text-sm text-gray-600 border-t border-gray-100 pt-4">
                            <div className="flex justify-between">
                                <span>Stay Dates</span>
                                <span className="font-medium text-black text-right">{format(new Date(session.checkIn as string | Date), 'dd MMM')} - {format(new Date(session.checkOut as string | Date), 'dd MMM yyyy')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Guests</span>
                                <span className="font-medium text-black text-right">{session.adults} Adult, {session.children} Children</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Room Subtotal</span>
                                <span className="font-medium text-black">{formatCurrency(roomSubtotal)}</span>
                            </div>
                            <div className="flex justify-between text-[13px]">
                                <span className="text-gray-500">Room Tax</span>
                                <span className="font-medium text-gray-700">{formatCurrency(roomTaxesAndFees)}</span>
                            </div>

                            {selectedAddOnRows.length > 0 && (
                                <div className="pt-2 border-t border-dashed border-gray-200 space-y-2">
                                    {selectedAddOnRows.map((entry) => (
                                        <div key={entry.id} className="flex justify-between text-xs">
                                            <span>{entry.name} x {entry.quantity}</span>
                                            <span className="font-medium text-black">{formatCurrency(entry.subtotal)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between text-[13px]">
                                        <span>Add-ons Subtotal</span>
                                        <span className="font-medium text-black">{formatCurrency(addOnsTotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-[13px]">
                                        <span className="text-gray-500">Add-ons Tax</span>
                                        <span className="font-medium text-gray-700">{formatCurrency(addOnsTax)}</span>
                                    </div>
                                </div>
                            )}

                            {selectedAddOnRows.length > 0 && (
                                <div className="flex justify-between pt-3 border-t border-gray-100">
                                    <span>Total Taxes</span>
                                    <span className="font-medium text-black">{formatCurrency(taxesAndFeesTotal)}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-5 border-t border-gray-200 pt-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[var(--text-dark)] font-semibold text-[13px] uppercase tracking-[0.1em]">Total Amount</span>
                                <span className="text-2xl font-medium text-[var(--text-dark)] tracking-tight">{formatCurrency(totalPrice)}</span>
                            </div>
                        </div>
                    </div>
                }
            />
        </div>
    );
}
