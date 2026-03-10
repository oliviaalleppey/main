import { auth } from '@/auth';
import { db } from '@/lib/db';
import { bookingConfirmations, bookings, bookingItems, roomTypes } from '@/lib/db/schema';
import { AutoRefreshControl } from '@/components/admin/auto-refresh-control';
import { PendingConfirmationsTable, type PendingConfirmationItem } from '@/components/admin/pending-confirmations-table';
import { RunWatchdogButton } from '@/components/admin/run-watchdog-button';
import { BookingFilters } from '@/components/admin/booking-filters';
import { and, desc, eq, gte, inArray, lte, ilike, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const MAX_RETRIES = Number(process.env.BOOKING_WATCHDOG_MAX_RETRIES || 12);

function formatCurrency(amountInPaise: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amountInPaise / 100);
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface PageProps {
    searchParams: Promise<{
        status?: string;
        roomType?: string;
        dateFrom?: string;
        dateTo?: string;
        guest?: string;
        bookingNum?: string;
    }>;
}

export default async function AdminBookingsPage({ searchParams }: PageProps) {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') redirect('/signin');

    const params = await searchParams;
    const { status, roomType, dateFrom, dateTo, guest, bookingNum } = params;

    // -- Pending queue (always shown) --
    const pendingBookings = await db.query.bookings.findMany({
        where: inArray(bookings.status, ['payment_success', 'booking_requested']),
        orderBy: [desc(bookings.updatedAt)],
        limit: 100,
    });

    // -- Filtered all-bookings query --
    const conditions = [];
    if (status) conditions.push(eq(bookings.status, status as typeof bookings.status._.data));
    if (guest) conditions.push(ilike(bookings.guestName, `%${guest}%`));
    if (bookingNum) conditions.push(ilike(bookings.bookingNumber, `%${bookingNum}%`));
    if (dateFrom) conditions.push(gte(bookings.checkIn, dateFrom));
    if (dateTo) conditions.push(lte(bookings.checkIn, dateTo));

    // Room type filter requires joining bookingItems
    let filteredBookingIds: string[] | null = null;
    if (roomType) {
        const items = await db.select({ bookingId: bookingItems.bookingId })
            .from(bookingItems)
            .where(eq(bookingItems.roomTypeId, roomType));
        filteredBookingIds = [...new Set(items.map(i => i.bookingId))];
        if (filteredBookingIds.length > 0) {
            conditions.push(inArray(bookings.id, filteredBookingIds));
        } else {
            // No bookings match this room type
            filteredBookingIds = [];
        }
    }

    const allBookings = filteredBookingIds?.length === 0 ? [] : await db.query.bookings.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: [desc(bookings.createdAt)],
        limit: 100,
    });

    // Get confirmations for displayed bookings
    const confirmedIds = allBookings.filter(b => b.status === 'confirmed').map(b => b.id);
    const confirmationRows = confirmedIds.length
        ? await db.query.bookingConfirmations.findMany({
            where: inArray(bookingConfirmations.bookingId, confirmedIds),
            columns: { bookingId: true, confirmationNumber: true },
        })
        : [];
    const confirmationMap = new Map(confirmationRows.map(r => [r.bookingId, r.confirmationNumber]));

    // Room types for filter dropdown
    const allRoomTypes = await db.select({ id: roomTypes.id, name: roomTypes.name })
        .from(roomTypes)
        .orderBy(roomTypes.sortOrder);

    const pendingItems: PendingConfirmationItem[] = pendingBookings.map(booking => ({
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        checkIn: booking.checkIn.toString(),
        checkOut: booking.checkOut.toString(),
        status: booking.status || 'unknown',
        retryCount: booking.retryCount || 0,
        updatedAt: booking.updatedAt ? booking.updatedAt.toISOString() : null,
        totalAmount: booking.totalAmount,
    }));

    const atRiskCount = pendingItems.filter(i => i.retryCount >= MAX_RETRIES).length;

    const STATUS_BADGE: Record<string, string> = {
        confirmed: 'bg-emerald-50 text-emerald-700',
        completed: 'bg-gray-100 text-gray-600',
        payment_success: 'bg-amber-50 text-amber-700',
        booking_requested: 'bg-amber-50 text-amber-700',
        pending_payment: 'bg-blue-50 text-blue-700',
        initiated: 'bg-gray-50 text-gray-500',
        cancelled: 'bg-red-50 text-red-700',
        failed: 'bg-red-50 text-red-700',
    };

    const STATUS_LABEL: Record<string, string> = {
        confirmed: 'Confirmed',
        completed: 'Completed',
        payment_success: 'Payment Received',
        booking_requested: 'Processing',
        pending_payment: 'Awaiting Payment',
        initiated: 'Initiated',
        cancelled: 'Cancelled',
        failed: 'Failed',
    };

    const hasFilters = !!(status || roomType || dateFrom || dateTo || guest);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
                <p className="text-sm text-gray-500 mt-1">All bookings from the website</p>
            </div>

            {/* CRS Queue — top */}
            <div className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">CRS Confirmation Queue</h2>
                <AutoRefreshControl intervalSeconds={30} />
                <RunWatchdogButton />
                <PendingConfirmationsTable items={pendingItems} maxRetries={MAX_RETRIES} />
            </div>

            {/* Filters */}
            <BookingFilters roomTypes={allRoomTypes} />

            {/* All Bookings Table */}
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-900">
                        {hasFilters ? `Results (${allBookings.length})` : `All Bookings (${allBookings.length})`}
                    </h2>
                </div>
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Booking</th>
                            <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Guest</th>
                            <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Check-in</th>
                            <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Check-out</th>
                            <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Status</th>
                            <th className="px-5 py-3 text-right text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {allBookings.map(booking => (
                            <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-5 py-3.5">
                                    <Link href={`/admin/bookings/${booking.id}`} className="font-mono text-xs text-blue-600 hover:underline font-semibold">
                                        {booking.bookingNumber}
                                    </Link>
                                    {confirmationMap.get(booking.id) && (
                                        <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">{confirmationMap.get(booking.id)}</p>
                                    )}
                                </td>
                                <td className="px-5 py-3.5">
                                    <p className="font-medium text-gray-900">{booking.guestName}</p>
                                    <p className="text-xs text-gray-400">{booking.guestEmail}</p>
                                </td>
                                <td className="px-5 py-3.5 text-gray-600 text-xs">{formatDate(booking.checkIn.toString())}</td>
                                <td className="px-5 py-3.5 text-gray-600 text-xs">{formatDate(booking.checkOut.toString())}</td>
                                <td className="px-5 py-3.5">
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[booking.status || ''] || 'bg-gray-100 text-gray-600'}`}>
                                        {STATUS_LABEL[booking.status || ''] || booking.status}
                                    </span>
                                </td>
                                <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{formatCurrency(booking.totalAmount)}</td>
                            </tr>
                        ))}
                        {allBookings.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">
                                    {hasFilters ? 'No bookings match your filters.' : 'No bookings yet.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>


        </div>
    );
}
