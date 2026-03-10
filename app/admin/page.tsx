import Link from 'next/link';
import { redirect } from 'next/navigation';
import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { getBookingProvider } from '@/lib/providers/crs/factory';
import { BOOKING_FLOW_MODE } from '@/lib/config/booking-flow-mode';
import {
    CalendarCheck,
    CalendarX,
    TrendingUp,
    BedDouble,
    AlertTriangle,
    Activity,
    ArrowRight,
    CheckCircle2,
    Clock,
    XCircle,
} from 'lucide-react';

const MAX_RETRIES = Number(process.env.BOOKING_WATCHDOG_MAX_RETRIES || 12);

function formatCurrency(amountInPaise: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amountInPaise / 100);
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export default async function AdminDashboard() {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
        redirect('/signin');
    }

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const [totalRows, pendingRows, atRiskRows, confirmedRows, cancelledRows, todayCheckInsRows, revenueRows, recentBookings] = await Promise.all([
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
        db.select({ count: sql<number>`count(*)` })
            .from(bookings)
            .where(eq(bookings.status, 'cancelled')),
        // Today's check-ins
        db.select({ count: sql<number>`count(*)` })
            .from(bookings)
            .where(and(
                eq(bookings.checkIn, today),
                inArray(bookings.status, ['confirmed', 'completed'])
            )),
        // Total confirmed revenue
        db.select({ total: sql<number>`coalesce(sum(total_amount), 0)` })
            .from(bookings)
            .where(eq(bookings.status, 'confirmed')),
        // Recent 5 bookings
        db.query.bookings.findMany({
            orderBy: [desc(bookings.createdAt)],
            limit: 5,
        }),
    ]);

    const totalBookings = Number(totalRows[0]?.count || 0);
    const pendingConfirmations = Number(pendingRows[0]?.count || 0);
    const atRiskBookings = Number(atRiskRows[0]?.count || 0);
    const confirmedBookings = Number(confirmedRows[0]?.count || 0);
    const cancelledBookings = Number(cancelledRows[0]?.count || 0);
    const todayCheckIns = Number(todayCheckInsRows[0]?.count || 0);
    const totalRevenue = Number(revenueRows[0]?.total || 0);

    let providerStatus: 'healthy' | 'degraded' = 'healthy';
    let providerMessage = 'Connected';
    const provider = getBookingProvider();

    try {
        const healthResponse = await provider.checkAvailability({
            checkIn: today,
            checkOut: tomorrowStr,
            adults: 1,
            children: 0,
        });
        if (healthResponse.status !== 'success') {
            providerStatus = 'degraded';
            providerMessage = healthResponse.message || 'Degraded';
        }
    } catch {
        providerStatus = 'degraded';
        providerMessage = 'Unreachable';
    }

    const statusConfig: Record<string, { label: string; color: string }> = {
        confirmed: { label: 'Confirmed', color: 'text-emerald-700 bg-emerald-50' },
        pending: { label: 'Pending', color: 'text-blue-700 bg-blue-50' },
        pending_payment: { label: 'Pending Payment', color: 'text-blue-700 bg-blue-50' },
        payment_success: { label: 'Processing', color: 'text-amber-700 bg-amber-50' },
        booking_requested: { label: 'Processing', color: 'text-amber-700 bg-amber-50' },
        cancelled: { label: 'Cancelled', color: 'text-red-700 bg-red-50' },
        failed: { label: 'Failed', color: 'text-red-700 bg-red-50' },
        completed: { label: 'Completed', color: 'text-gray-700 bg-gray-100' },
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Welcome back — here&apos;s what&apos;s happening today.</p>
                </div>
                <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${providerStatus === 'healthy' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${providerStatus === 'healthy' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    HotSoft CRS: {providerMessage}
                </div>
            </div>

            {/* Alert Banner */}
            {atRiskBookings > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <p className="text-sm font-semibold text-red-900">
                            {atRiskBookings} booking{atRiskBookings > 1 ? 's' : ''} reached retry limit and need manual review.
                        </p>
                    </div>
                    <Link
                        href="/admin/bookings"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 flex-shrink-0"
                    >
                        Review Now <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-gray-500 font-medium">Total Bookings</p>
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                            <CalendarCheck className="w-4 h-4 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{totalBookings}</p>
                    <p className="text-xs text-gray-400 mt-1">All time</p>
                </div>

                <div className="rounded-xl border bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-gray-500 font-medium">Confirmed</p>
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-emerald-700">{confirmedBookings}</p>
                    <p className="text-xs text-gray-400 mt-1">CRS confirmed</p>
                </div>

                <div className="rounded-xl border bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-gray-500 font-medium">Pending</p>
                        <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-amber-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-amber-700">{pendingConfirmations}</p>
                    <p className="text-xs text-gray-400 mt-1">Awaiting CRS sync</p>
                </div>

                <div className="rounded-xl border bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
                        <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
                    <p className="text-xs text-gray-400 mt-1">Confirmed bookings</p>
                </div>
            </div>

            {/* Second Row Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-white p-5 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <BedDouble className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Today&apos;s Arrivals</p>
                        <p className="text-2xl font-bold text-gray-900">{todayCheckIns}</p>
                    </div>
                </div>

                <div className="rounded-xl border bg-white p-5 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                        <CalendarX className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Cancellations</p>
                        <p className="text-2xl font-bold text-gray-900">{cancelledBookings}</p>
                    </div>
                </div>

                <div className="rounded-xl border bg-white p-5 shadow-sm flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${providerStatus === 'healthy' ? 'bg-emerald-50' : 'bg-red-50'
                        }`}>
                        <Activity className={`w-6 h-6 ${providerStatus === 'healthy' ? 'text-emerald-600' : 'text-red-600'}`} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">CRS Provider</p>
                        <p className="text-sm font-bold text-gray-900">{provider.source}</p>
                        <p className="text-xs text-gray-400">{BOOKING_FLOW_MODE} mode</p>
                    </div>
                </div>
            </div>

            {/* Recent Bookings */}
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-base font-semibold text-gray-900">Recent Bookings</h2>
                    <Link
                        href="/admin/bookings"
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                    >
                        View all <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Booking</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Guest</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Check-in</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {recentBookings.map((booking) => {
                                const config = statusConfig[booking.status || 'pending'] || { label: booking.status || 'Unknown', color: 'text-gray-700 bg-gray-100' };
                                return (
                                    <tr key={booking.id} className="hover:bg-blue-50 transition-colors cursor-pointer">
                                        <td className="px-6 py-4 font-mono text-xs">
                                            <Link href={`/admin/bookings/${booking.id}`} className="text-blue-600 hover:underline font-semibold">{booking.bookingNumber}</Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link href={`/admin/bookings/${booking.id}`} className="block">
                                                <p className="font-medium text-gray-900">{booking.guestName}</p>
                                                <p className="text-xs text-gray-400">{booking.guestEmail}</p>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{formatDate(booking.checkIn.toString())}</td>
                                        <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(booking.totalAmount)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.color}`}>
                                                {config.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {recentBookings.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <XCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-400 text-sm">No bookings yet</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid gap-4 md:grid-cols-2">
                <Link href="/admin/bookings" className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
                    <div>
                        <p className="font-semibold text-gray-900">Booking Ops</p>
                        <p className="text-sm text-gray-500 mt-0.5">Monitor and retry pending CRS confirmations</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-700 transition-colors" />
                </Link>
                <Link href="/admin/rooms/types" className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
                    <div>
                        <p className="font-semibold text-gray-900">Room Types & Pricing</p>
                        <p className="text-sm text-gray-500 mt-0.5">Update room rates and descriptions</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-700 transition-colors" />
                </Link>
            </div>
        </div>
    );
}
