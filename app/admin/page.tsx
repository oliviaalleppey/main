import Link from 'next/link';
import { redirect } from 'next/navigation';
import { and, eq, gte, inArray, sql } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { getBookingProvider } from '@/lib/providers/crs/factory';
import { BOOKING_FLOW_MODE } from '@/lib/config/booking-flow-mode';

const MAX_RETRIES = Number(process.env.BOOKING_WATCHDOG_MAX_RETRIES || 12);

export default async function AdminDashboard() {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
        redirect('/signin');
    }

    const [totalRows, pendingRows, atRiskRows, confirmedRows] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(bookings),
        db.select({ count: sql<number>`count(*)` })
            .from(bookings)
            .where(inArray(bookings.status, ['payment_success', 'booking_requested'])),
        db.select({ count: sql<number>`count(*)` })
            .from(bookings)
            .where(and(
                inArray(bookings.status, ['payment_success', 'booking_requested']),
                gte(bookings.retryCount, MAX_RETRIES)
            )),
        db.select({ count: sql<number>`count(*)` })
            .from(bookings)
            .where(eq(bookings.status, 'confirmed')),
    ]);

    const totalBookings = Number(totalRows[0]?.count || 0);
    const pendingConfirmations = Number(pendingRows[0]?.count || 0);
    const atRiskBookings = Number(atRiskRows[0]?.count || 0);
    const confirmedBookings = Number(confirmedRows[0]?.count || 0);

    const provider = getBookingProvider();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const toDateString = (date: Date) => date.toISOString().split('T')[0];

    let providerStatus: 'healthy' | 'degraded' = 'healthy';
    let providerMessage = `${provider.source} reachable`;

    try {
        const healthResponse = await provider.checkAvailability({
            checkIn: toDateString(tomorrow),
            checkOut: toDateString(dayAfterTomorrow),
            adults: 1,
            children: 0,
        });

        if (healthResponse.status !== 'success') {
            providerStatus = 'degraded';
            providerMessage = healthResponse.message || `${provider.source} returned degraded status`;
        }
    } catch (error: unknown) {
        providerStatus = 'degraded';
        providerMessage = error instanceof Error ? error.message : 'Provider health check failed';
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Operational snapshot for booking confirmations and queue health.</p>
            </div>

            {atRiskBookings > 0 && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-5">
                    <p className="text-sm font-semibold text-amber-900">
                        {atRiskBookings} booking{atRiskBookings > 1 ? 's' : ''} reached retry limit and need manual review.
                    </p>
                    <Link
                        href="/admin/bookings"
                        className="inline-flex mt-3 rounded-md bg-amber-900 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-800"
                    >
                        Open Pending Confirmations
                    </Link>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border bg-white shadow p-6">
                    <h3 className="font-semibold leading-none tracking-tight text-gray-700">Total Bookings</h3>
                    <p className="text-2xl font-bold mt-2 text-gray-900">{totalBookings}</p>
                </div>

                <div className="rounded-xl border bg-white shadow p-6">
                    <h3 className="font-semibold leading-none tracking-tight text-gray-700">Confirmed</h3>
                    <p className="text-2xl font-bold mt-2 text-emerald-700">{confirmedBookings}</p>
                </div>

                <div className="rounded-xl border bg-white shadow p-6">
                    <h3 className="font-semibold leading-none tracking-tight text-gray-700">Pending Confirmation</h3>
                    <p className="text-2xl font-bold mt-2 text-blue-700">{pendingConfirmations}</p>
                </div>

                <div className="rounded-xl border bg-white shadow p-6">
                    <h3 className="font-semibold leading-none tracking-tight text-gray-700">At Retry Limit</h3>
                    <p className="text-2xl font-bold mt-2 text-amber-700">{atRiskBookings}</p>
                    <p className="text-xs text-gray-500 mt-1">Threshold: {MAX_RETRIES}</p>
                </div>
            </div>

            <div className={`rounded-xl border p-6 ${
                providerStatus === 'healthy' ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50'
            }`}>
                <h2 className="text-lg font-semibold text-gray-900">Provider Health</h2>
                <p className={`mt-1 text-sm font-medium ${
                    providerStatus === 'healthy' ? 'text-emerald-800' : 'text-amber-800'
                }`}>
                    {providerStatus === 'healthy' ? 'Healthy' : 'Degraded'}: {providerMessage}
                </p>
                <p className="text-xs text-gray-600 mt-2">
                    Current provider: <span className="font-semibold">{provider.source}</span> · Flow mode:{' '}
                    <span className="font-semibold">{BOOKING_FLOW_MODE}</span>
                </p>
            </div>

            <div className="rounded-xl border bg-white p-6 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Confirmation Queue</h2>
                    <p className="text-sm text-gray-600">Monitor and retry paid bookings awaiting CRS confirmation.</p>
                </div>
                <Link
                    href="/admin/bookings"
                    className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
                >
                    Open Bookings Ops
                </Link>
            </div>
        </div>
    );
}
