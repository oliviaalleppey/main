import { db } from '@/lib/db';
import { roomTypes, rooms } from '@/lib/db/schema';
import { sql, eq } from 'drizzle-orm';
import Link from 'next/link';
import { BedDouble, ArrowLeft } from 'lucide-react';
import { HotsoftCrsProvider } from '@/lib/providers/crs/hotsoft-crs-provider';
import { Suspense } from 'react';
import { AvailabilityToolbar } from './toolbar';

export const revalidate = 3600;

function getDateRange(date: string, view: string): string[] {
    const d = new Date(date + 'T00:00:00');
    const dates: string[] = [];

    if (view === 'week') {
        // Rolling 7-day window starting exactly from the given date to align with toolbar
        for (let i = 0; i < 7; i++) {
            const dd = new Date(d);
            dd.setDate(d.getDate() + i);
            dates.push(dd.toISOString().slice(0, 10));
        }
    } else if (view === 'month') {
        const year = d.getFullYear();
        const month = d.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            dates.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`);
        }
    } else if (view === 'year') {
        const year = d.getFullYear();
        for (let m = 0; m < 12; m++) {
            dates.push(`${year}-${String(m + 1).padStart(2, '0')}-01`);
        }
    }

    return dates;
}

function formatDayHeader(dateStr: string): { day: string; weekday: string } {
    const d = new Date(dateStr + 'T00:00:00');
    return {
        day: d.getDate().toString(),
        weekday: d.toLocaleDateString('en-IN', { weekday: 'short' }),
    };
}

function formatMonthHeader(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { month: 'short' });
}

async function fetchAvailability(dates: string[]): Promise<{
    availabilityMap: Record<string, Record<string, number>>;
    crsErrors: string[];
}> {
    const provider = new HotsoftCrsProvider();
    const availabilityMap: Record<string, Record<string, number>> = {};
    const crsErrors: string[] = [];

    await Promise.all(dates.map(async (date) => {
        const nextDay = new Date(date + 'T00:00:00');
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = nextDay.toISOString().slice(0, 10);

        try {
            const avail = await provider.checkAvailability({
                checkIn: date,
                checkOut: nextDayStr,
                adults: 2,
                children: 0,
            });

            if (avail.status === 'success') {
                for (const room of avail.rooms) {
                    if (!availabilityMap[room.roomTypeId]) {
                        availabilityMap[room.roomTypeId] = {};
                    }
                    availabilityMap[room.roomTypeId][date] = room.availableCount;
                }
            } else {
                crsErrors.push(date);
            }
        } catch {
            crsErrors.push(date);
        }
    }));

    return { availabilityMap, crsErrors };
}

function OccupancyCell({ booked, total }: { booked: number; total: number }) {
    const pct = total > 0 ? (booked / total) * 100 : 0;

    let bgColor = 'bg-emerald-50';
    let textColor = 'text-emerald-700';
    let barColor = 'bg-emerald-400';

    if (pct >= 100) {
        bgColor = 'bg-red-50';
        textColor = 'text-red-700';
        barColor = 'bg-red-400';
    } else if (pct >= 50) {
        bgColor = 'bg-orange-50';
        textColor = 'text-orange-700';
        barColor = 'bg-orange-400';
    }

    return (
        <div className={`inline-flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 ${bgColor}`}>
            <span className={`text-sm font-bold ${textColor}`}>
                {booked}/{total}
            </span>
            <div className="w-10 h-1 rounded-full bg-gray-200 overflow-hidden">
                <div
                    className={`h-full rounded-full ${barColor} transition-all`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

function CompactOccupancyCell({ booked, total }: { booked: number; total: number }) {
    const pct = total > 0 ? (booked / total) * 100 : 0;

    let bgColor = 'bg-emerald-50';
    let textColor = 'text-emerald-700';

    if (pct >= 100) {
        bgColor = 'bg-red-50';
        textColor = 'text-red-700';
    } else if (pct >= 50) {
        bgColor = 'bg-orange-50';
        textColor = 'text-orange-700';
    }

    return (
        <div className={`flex items-center justify-center rounded px-1 py-1.5 ${bgColor}`}>
            <span className={`text-[10px] sm:text-[11px] font-bold ${textColor} tracking-tight leading-none`}>
                {booked}/{total}
            </span>
        </div>
    );
}

function LargeOccupancyCell({ booked, total }: { booked: number; total: number }) {
    const pct = total > 0 ? (booked / total) * 100 : 0;

    let bgColor = 'bg-emerald-50';
    let textColor = 'text-emerald-700';
    let barColor = 'bg-emerald-400';

    if (pct >= 100) {
        bgColor = 'bg-red-50';
        textColor = 'text-red-700';
        barColor = 'bg-red-400';
    } else if (pct >= 50) {
        bgColor = 'bg-orange-50';
        textColor = 'text-orange-700';
        barColor = 'bg-orange-400';
    }

    return (
        <div className={`flex flex-col items-center gap-1.5 rounded-lg px-3 py-2 ${bgColor}`}>
            <span className={`text-base font-bold ${textColor}`}>
                {booked}/{total}
            </span>
            <div className="w-full max-w-[60px] h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                    className={`h-full rounded-full ${barColor}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

export default async function AdminAvailabilityPage({ searchParams }: { searchParams: Promise<{ view?: string; date?: string }> }) {
    const params = await searchParams;
    const todayStr = new Date().toISOString().slice(0, 10);
    const view = params.view || 'week';
    const dateParam = params.date || todayStr;

    const dates = getDateRange(dateParam, view);

    // Fetch room types with counts
    const roomTypesWithCounts = await db
        .select({
            id: roomTypes.id,
            name: roomTypes.name,
            slug: roomTypes.slug,
            status: roomTypes.status,
            totalRooms: sql<number>`count(${rooms.id})`,
        })
        .from(roomTypes)
        .leftJoin(rooms, eq(rooms.roomTypeId, roomTypes.id))
        .groupBy(roomTypes.id)
        .orderBy(roomTypes.sortOrder);

    const activeRoomTypes = roomTypesWithCounts.filter(rt => rt.status === 'active');

    // Fetch CRS availability
    let availabilityMap: Record<string, Record<string, number>> = {};
    let crsErrors: string[] = [];
    let yearlyAggregates: Record<string, Record<string, { freeSum: number; days: number }>> = {};

    if (view === 'year') {
        const provider = new HotsoftCrsProvider();
        const yearInt = new Date(dateParam + 'T00:00:00').getFullYear();
        const activeSlugs = activeRoomTypes.map(rt => rt.slug);
        const aggRes = await provider.getYearlyAggregates(yearInt, activeSlugs);
        
        if (aggRes.status === 'success' && aggRes.aggregates) {
            yearlyAggregates = aggRes.aggregates;
        } else {
            crsErrors.push(String(yearInt)); // Push the year so the error banner shows something
        }
    } else {
        const fetchRes = await fetchAvailability(dates);
        availabilityMap = fetchRes.availabilityMap;
        crsErrors = fetchRes.crsErrors;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {view === 'week' && 'Rooms booked per night — 7 day view'}
                        {view === 'month' && 'Rooms booked per night — full month view'}
                        {view === 'year' && 'Total room nights booked per month'}
                    </p>
                </div>
                <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Link>
            </div>

            {/* Toolbar */}
            <Suspense fallback={<div className="h-20 bg-gray-100 rounded-lg animate-pulse" />}>
                <AvailabilityToolbar />
            </Suspense>

            {/* CRS Error */}
            {crsErrors.length > 0 && (
                <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                    CRS unavailable for {crsErrors.length} column(s) — those show &quot;—&quot;
                </div>
            )}

            {/* Grid */}
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-gray-50">
                                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 sticky left-0 bg-gray-50 z-10 min-w-[180px]">
                                    Room Type
                                </th>
                                {dates.map((date) => {
                                    const isToday = date === todayStr;
                                    const isViewYear = view === 'year';

                                    if (isViewYear) {
                                        return (
                                            <th key={date} className={`text-center px-3 py-3 min-w-[72px] ${isToday ? 'bg-gray-100' : ''}`}>
                                                <p className="text-xs font-semibold text-gray-600">
                                                    {formatMonthHeader(date)}
                                                </p>
                                            </th>
                                        );
                                    }

                                    const { day, weekday } = formatDayHeader(date);
                                    const isViewMonth = view === 'month';
                                    
                                    return (
                                        <th key={date} className={`text-center py-2 ${isViewMonth ? 'px-1 min-w-[36px]' : 'px-2 min-w-[64px]'} ${isToday ? 'bg-gray-100' : ''}`}>
                                            {!isViewMonth && <p className="text-[10px] font-medium text-gray-400 uppercase">{weekday}</p>}
                                            <p className={`font-bold ${isViewMonth ? 'text-xs my-0.5' : 'text-sm'} ${isToday ? 'text-gray-900' : 'text-gray-700'}`}>{day}</p>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {activeRoomTypes.map((rt) => {
                                const total = Number(rt.totalRooms);

                                return (
                                    <tr key={rt.id} className="border-b last:border-0 hover:bg-gray-50/50">
                                        <td className="px-5 py-3 sticky left-0 bg-white z-10">
                                            <div className="flex items-center gap-2">
                                                <BedDouble className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm">{rt.name}</p>
                                                    <p className="text-[11px] text-gray-400">{total} room{total !== 1 ? 's' : ''}</p>
                                                </div>
                                            </div>
                                        </td>
                                        {dates.map((date) => {
                                            const isToday = date === todayStr;

                                            if (view === 'year') {
                                                const monthKey = date.slice(0, 7); // e.g., '2026-01'
                                                const agg = yearlyAggregates[rt.slug]?.[monthKey];

                                                if (!agg || agg.days === 0) {
                                                    return (
                                                        <td key={date} className={`text-center px-2 py-3 ${isToday ? 'bg-gray-50' : ''}`}>
                                                            <span className="text-gray-300 text-sm">—</span>
                                                        </td>
                                                    );
                                                }

                                                const totalCapacityForMonth = total * agg.days;
                                                const booked = Math.max(0, totalCapacityForMonth - agg.freeSum);

                                                return (
                                                    <td key={date} className={`text-center px-2 py-3 ${isToday ? 'bg-gray-50' : ''}`}>
                                                        <OccupancyCell booked={booked} total={totalCapacityForMonth} />
                                                    </td>
                                                );
                                            }

                                            const available = availabilityMap[rt.slug]?.[date];
                                            if (available === undefined) {
                                                return (
                                                    <td key={date} className={`text-center px-2 py-3 ${isToday ? 'bg-gray-50' : ''}`}>
                                                        <span className="text-gray-300 text-sm">—</span>
                                                    </td>
                                                );
                                            }

                                            const booked = Math.max(0, total - available);

                                            if (view === 'month') {
                                                return (
                                                    <td key={date} className={`text-center px-1 py-3 ${isToday ? 'bg-gray-50' : ''}`}>
                                                        <CompactOccupancyCell booked={booked} total={total} />
                                                    </td>
                                                );
                                            }

                                            return (
                                                <td key={date} className={`text-center px-2 py-3 ${isToday ? 'bg-gray-50' : ''}`}>
                                                    <LargeOccupancyCell booked={booked} total={total} />
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-emerald-400" />
                    <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-orange-400" />
                    <span>50%+ booked</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-400" />
                    <span>Fully booked</span>
                </div>
            </div>
        </div>
    );
}
