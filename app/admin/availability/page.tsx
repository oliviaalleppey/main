import { db } from '@/lib/db';
import { roomTypes, rooms, bookings, bookingItems } from '@/lib/db/schema';
import { eq, sql, and, lte, gt, inArray } from 'drizzle-orm';
import Link from 'next/link';
import { BedDouble, TrendingUp, CalendarDays, Ban, ArrowRight, Users, CheckCircle2, BookOpen, AlertTriangle } from 'lucide-react';
import { HotsoftCrsProvider } from '@/lib/providers/crs/hotsoft-crs-provider';
import { Suspense } from 'react';
import { DateFilter } from './date-filter';

// Cache this page for 1 hour to prevent rate-limiting the Hotsoft CRS
// (each page load = 6 API calls; without caching this exhausts the daily quota)
export const revalidate = 3600;

function formatPrice(paise: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(paise / 100);
}

function formatDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default async function AdminAvailabilityPage({ searchParams }: { searchParams: Promise<{ checkIn?: string; checkOut?: string }> }) {
    const params = await searchParams;
    const todayStr = new Date().toISOString().slice(0, 10);
    const tomorrowStr = (() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().slice(0, 10);
    })();

    const checkInDate = params.checkIn || todayStr;
    const checkOutDate = params.checkOut || tomorrowStr;

    const roomTypesWithCounts = await db
        .select({
            id: roomTypes.id,
            name: roomTypes.name,
            slug: roomTypes.slug,
            basePrice: roomTypes.basePrice,
            status: roomTypes.status,
            maxGuests: roomTypes.maxGuests,
            totalRooms: sql<number>`count(${rooms.id})`,
        })
        .from(roomTypes)
        .leftJoin(rooms, eq(rooms.roomTypeId, roomTypes.id))
        .groupBy(roomTypes.id)
        .orderBy(roomTypes.sortOrder);

    const totalRooms = roomTypesWithCounts.reduce((sum, rt) => sum + Number(rt.totalRooms), 0);
    const activeTypes = roomTypesWithCounts.filter(rt => rt.status === 'active').length;

    // Fetch local DB bookings for selected date range
    const localBookingRows = await db
        .select({
            roomTypeId: bookingItems.roomTypeId,
            count: sql<number>`count(distinct ${bookings.id})`,
        })
        .from(bookings)
        .innerJoin(bookingItems, eq(bookingItems.bookingId, bookings.id))
        .where(
            and(
                lte(bookings.checkIn, checkOutDate),
                gt(bookings.checkOut, checkInDate),
                inArray(bookings.status, ['confirmed', 'completed', 'booking_requested'])
            )
        )
        .groupBy(bookingItems.roomTypeId);

    const localBookedMap: Record<string, number> = {};
    for (const row of localBookingRows) {
        localBookedMap[row.roomTypeId] = Number(row.count);
    }
    const localTotalBooked = Object.values(localBookedMap).reduce((s, n) => s + n, 0);

    // Fetch live CRS availability for selected date range
    let crsAvailMap: Record<string, number> = {};
    let crsTotalBooked = 0;
    let crsError = false;

    try {
        const provider = new HotsoftCrsProvider();

        const avail = await provider.checkAvailability({
            checkIn: checkInDate,
            checkOut: checkOutDate,
            adults: 2,
            children: 0,
        });

        if (avail.status === 'success') {
            for (const room of avail.rooms) {
                crsAvailMap[room.roomTypeId] = room.availableCount;
            }
            for (const rt of roomTypesWithCounts) {
                const available = crsAvailMap[rt.slug] ?? null;
                if (available !== null) {
                    crsTotalBooked += Math.max(0, Number(rt.totalRooms) - available);
                }
            }
        } else {
            crsError = true;
            console.warn('[Availability] CRS returned failure:', avail.message);
        }
    } catch (e) {
        crsError = true;
        console.warn('[Availability] CRS exception:', e);
    }

    const dateLabel = `${formatDate(checkInDate)} → ${formatDate(checkOutDate)}`;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
                    <p className="text-sm text-gray-500 mt-1">{dateLabel}</p>
                </div>
                <Link
                    href="/admin/availability/blocking"
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
                >
                    <Ban className="w-4 h-4" />
                    Block Dates
                </Link>
            </div>

            {/* Date Filter */}
            <Suspense fallback={<div className="h-10 bg-gray-100 rounded-lg animate-pulse" />}>
                <DateFilter />
            </Suspense>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="rounded-xl border bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-gray-500 font-medium">Room Types</p>
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <CalendarDays className="w-4 h-4 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{roomTypesWithCounts.length}</p>
                    <p className="text-xs text-gray-400 mt-1">{activeTypes} active</p>
                </div>

                <div className="rounded-xl border bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-gray-500 font-medium">Total Rooms</p>
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <BedDouble className="w-4 h-4 text-emerald-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{totalRooms}</p>
                    <p className="text-xs text-gray-400 mt-1">Across all types</p>
                </div>

                <div className="rounded-xl border bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-gray-500 font-medium">Booked</p>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${crsError ? 'bg-orange-50' : 'bg-orange-50'}`}>
                            <BookOpen className="w-4 h-4 text-orange-600" />
                        </div>
                    </div>
                    {crsError ? (
                        <>
                            <p className="text-3xl font-bold text-gray-900">{localTotalBooked}</p>
                            <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Website only
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-3xl font-bold text-gray-900">{crsTotalBooked}</p>
                            <p className="text-xs text-gray-400 mt-1">All channels (CRS)</p>
                        </>
                    )}
                </div>

                <div className="rounded-xl border bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-gray-500 font-medium">Highest Rate</p>
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {formatPrice(Math.max(...roomTypesWithCounts.map(r => Number(r.basePrice))))}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Per night</p>
                </div>
            </div>

            {/* CRS Warning Banner */}
            {crsError && (
                <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
                    <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-orange-700">CRS connection unavailable</p>
                        <p className="text-xs text-orange-600 mt-0.5">
                            Cannot reach Hotsoft CRS. Booked counts show <strong>website bookings only</strong> — walk-ins and OTA bookings are not included. Contact PurpleKeys if this persists.
                        </p>
                    </div>
                </div>
            )}

            {/* Room Type Cards */}
            <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">All Room Types</h2>
                <div className="space-y-3">
                    {roomTypesWithCounts.map((roomType) => {
                        const crsAvailable = crsAvailMap[roomType.slug] ?? null;
                        const booked = crsAvailable !== null
                            ? Math.max(0, Number(roomType.totalRooms) - crsAvailable)
                            : (localBookedMap[roomType.id] ?? null);

                        return (
                            <div
                                key={roomType.id}
                                className="rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                            >
                                <div className="flex items-center gap-4 p-5">
                                    {/* Color Indicator */}
                                    <div className="w-1.5 self-stretch rounded-full bg-emerald-400 flex-shrink-0" />

                                    {/* Room Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-gray-900">{roomType.name}</h3>
                                            {roomType.status === 'active' ? (
                                                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                                    <CheckCircle2 className="w-3 h-3" /> Active
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 font-mono">{roomType.slug}</p>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-8 flex-shrink-0">
                                        <div className="text-center">
                                            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                                                <BedDouble className="w-3 h-3" /> Rooms
                                            </p>
                                            <p className="text-lg font-bold text-gray-900">{Number(roomType.totalRooms)}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                                                <BookOpen className="w-3 h-3" /> Booked
                                            </p>
                                            {booked !== null ? (
                                                <p className={`text-lg font-bold ${booked > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                                                    {booked}
                                                </p>
                                            ) : (
                                                <p className="text-lg font-bold text-gray-300">—</p>
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                                                <Users className="w-3 h-3" /> Guests
                                            </p>
                                            <p className="text-lg font-bold text-gray-900">{roomType.maxGuests || '—'}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                                                <TrendingUp className="w-3 h-3" /> Rate
                                            </p>
                                            <p className="text-lg font-bold text-gray-900">
                                                {formatPrice(Number(roomType.basePrice))}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <Link
                                            href={`/admin/availability/blocking?roomType=${roomType.id}`}
                                            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                                        >
                                            <Ban className="w-3.5 h-3.5" />
                                            Block
                                        </Link>
                                        <Link
                                            href={`/admin/availability/${roomType.id}`}
                                            className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-gray-700 transition-colors flex items-center gap-1.5"
                                        >
                                            View Calendar
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
