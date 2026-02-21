import { auth } from '@/auth';
import { db } from '@/lib/db';
import { bookingConfirmations, bookings } from '@/lib/db/schema';
import { AutoRefreshControl } from '@/components/admin/auto-refresh-control';
import { PendingConfirmationsTable, type PendingConfirmationItem } from '@/components/admin/pending-confirmations-table';
import { RunWatchdogButton } from '@/components/admin/run-watchdog-button';
import { desc, eq, inArray } from 'drizzle-orm';
import { redirect } from 'next/navigation';

const MAX_RETRIES = Number(process.env.BOOKING_WATCHDOG_MAX_RETRIES || 12);

type RecentConfirmedItem = {
    id: string;
    bookingNumber: string;
    guestName: string;
    checkIn: string;
    checkOut: string;
    totalAmount: number;
    confirmationNumber: string;
};

function formatCurrency(amountInPaise: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amountInPaise / 100);
}

function formatStay(checkIn: string, checkOut: string): string {
    const from = new Date(checkIn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const to = new Date(checkOut).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    return `${from} - ${to}`;
}

export default async function AdminBookingsPage() {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
        redirect('/signin');
    }

    const [pendingBookings, confirmedBookings] = await Promise.all([
        db.query.bookings.findMany({
            where: inArray(bookings.status, ['payment_success', 'booking_requested']),
            orderBy: [desc(bookings.updatedAt)],
            limit: 100,
        }),
        db.query.bookings.findMany({
            where: eq(bookings.status, 'confirmed'),
            orderBy: [desc(bookings.updatedAt)],
            limit: 20,
        }),
    ]);

    const confirmedIds = confirmedBookings.map((booking) => booking.id);
    const confirmationRows = confirmedIds.length
        ? await db.query.bookingConfirmations.findMany({
            where: inArray(bookingConfirmations.bookingId, confirmedIds),
            columns: { bookingId: true, confirmationNumber: true },
            orderBy: [desc(bookingConfirmations.confirmedAt)],
        })
        : [];

    const confirmationByBookingId = new Map<string, string>();
    for (const row of confirmationRows) {
        if (!confirmationByBookingId.has(row.bookingId)) {
            confirmationByBookingId.set(row.bookingId, row.confirmationNumber);
        }
    }

    const pendingItems: PendingConfirmationItem[] = pendingBookings.map((booking) => ({
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

    const confirmedItems: RecentConfirmedItem[] = confirmedBookings.map((booking) => ({
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        guestName: booking.guestName,
        checkIn: booking.checkIn.toString(),
        checkOut: booking.checkOut.toString(),
        totalAmount: booking.totalAmount,
        confirmationNumber: confirmationByBookingId.get(booking.id) || booking.bookingNumber,
    }));

    const atRiskCount = pendingItems.filter((item) => item.retryCount >= MAX_RETRIES).length;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Bookings Operations</h1>
                <p className="mt-2 text-gray-600">
                    Monitor paid bookings pending CRS confirmation and trigger manual retry when needed.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-white p-5">
                    <p className="text-sm text-gray-500">Pending Confirmations</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">{pendingItems.length}</p>
                </div>
                <div className="rounded-xl border bg-white p-5">
                    <p className="text-sm text-gray-500">At Retry Limit</p>
                    <p className="mt-1 text-2xl font-semibold text-amber-700">{atRiskCount}</p>
                </div>
                <div className="rounded-xl border bg-white p-5">
                    <p className="text-sm text-gray-500">Retry Cap</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">{MAX_RETRIES}</p>
                </div>
            </div>

            <AutoRefreshControl intervalSeconds={30} />
            <RunWatchdogButton />

            <section className="space-y-3">
                <h2 className="text-xl font-semibold text-gray-900">Pending Confirmation Queue</h2>
                <PendingConfirmationsTable items={pendingItems} maxRetries={MAX_RETRIES} />
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-semibold text-gray-900">Recently Confirmed</h2>
                <div className="overflow-x-auto rounded-xl border bg-white">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Confirmation</th>
                                <th className="px-4 py-3 text-left font-medium">Booking</th>
                                <th className="px-4 py-3 text-left font-medium">Guest</th>
                                <th className="px-4 py-3 text-left font-medium">Stay</th>
                                <th className="px-4 py-3 text-left font-medium">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {confirmedItems.map((item) => (
                                <tr key={item.id} className="border-t">
                                    <td className="px-4 py-3 font-semibold text-emerald-700">{item.confirmationNumber}</td>
                                    <td className="px-4 py-3 text-gray-800">{item.bookingNumber}</td>
                                    <td className="px-4 py-3 text-gray-800">{item.guestName}</td>
                                    <td className="px-4 py-3 text-gray-700">{formatStay(item.checkIn, item.checkOut)}</td>
                                    <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(item.totalAmount)}</td>
                                </tr>
                            ))}
                            {confirmedItems.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                        No confirmed bookings yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
