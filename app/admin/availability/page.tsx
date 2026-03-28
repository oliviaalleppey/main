import { db } from '@/lib/db';
import { roomTypes, rooms } from '@/lib/db/schema';
import { sql, eq } from 'drizzle-orm';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, BedDouble, ArrowLeft } from 'lucide-react';
import { HotsoftCrsProvider } from '@/lib/providers/crs/hotsoft-crs-provider';

export const revalidate = 3600;

function getWeekDates(startDate: string): string[] {
    const dates: string[] = [];
    const start = new Date(startDate + 'T00:00:00');
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
}

function formatWeekLabel(dates: string[]): string {
    const start = new Date(dates[0] + 'T00:00:00');
    const end = new Date(dates[6] + 'T00:00:00');
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const startStr = start.toLocaleDateString('en-IN', opts);
    const endStr = end.toLocaleDateString('en-IN', { ...opts, year: 'numeric' });
    return `${startStr} — ${endStr}`;
}

function formatDayHeader(dateStr: string): { day: string; weekday: string } {
    const d = new Date(dateStr + 'T00:00:00');
    return {
        day: d.getDate().toString(),
        weekday: d.toLocaleDateString('en-IN', { weekday: 'short' }),
    };
}

export default async function AdminAvailabilityPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
    const params = await searchParams;
    const todayStr = new Date().toISOString().slice(0, 10);
    const weekStart = params.week || todayStr;
    const weekDates = getWeekDates(weekStart);

    // Navigate weeks
    const prevWeek = (() => {
        const d = new Date(weekStart + 'T00:00:00');
        d.setDate(d.getDate() - 7);
        return d.toISOString().slice(0, 10);
    })();
    const nextWeek = (() => {
        const d = new Date(weekStart + 'T00:00:00');
        d.setDate(d.getDate() + 7);
        return d.toISOString().slice(0, 10);
    })();

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

    // Fetch CRS availability for each day of the week
    // For each date, query: checkIn=date, checkOut=nextDay → gives occupancy for that night
    const provider = new HotsoftCrsProvider();

    // availabilityMap[roomSlug][date] = available count
    const availabilityMap: Record<string, Record<string, number>> = {};
    const crsErrors: string[] = [];

    await Promise.all(weekDates.map(async (date) => {
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

    // Total occupancy across all room types for summary
    let totalBooked = 0;
    let totalInventory = 0;
    for (const rt of activeRoomTypes) {
        const todayAvail = availabilityMap[rt.slug]?.[todayStr];
        if (todayAvail !== undefined) {
            totalBooked += Math.max(0, Number(rt.totalRooms) - todayAvail);
        }
        totalInventory += Number(rt.totalRooms);
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
                    <p className="text-sm text-gray-500 mt-1">Weekly occupancy grid — shows rooms booked per night</p>
                </div>
                <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>
            </div>

            {/* Week Navigation */}
            <div className="flex items-center gap-4">
                <Link
                    href={`/admin/availability?week=${prevWeek}`}
                    className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <span className="text-lg font-semibold text-gray-900 min-w-[220px] text-center">
                    {formatWeekLabel(weekDates)}
                </span>
                <Link
                    href={`/admin/availability?week=${nextWeek}`}
                    className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 transition-colors"
                >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                </Link>
                <Link
                    href="/admin/availability"
                    className="ml-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                    Today
                </Link>
            </div>

            {/* CRS Error */}
            {crsErrors.length > 0 && (
                <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                    CRS unavailable for {crsErrors.length} day(s) — those columns show &quot;—&quot;
                </div>
            )}

            {/* Grid */}
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-gray-50">
                                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 w-[220px]">
                                    Room Type
                                </th>
                                {weekDates.map((date) => {
                                    const { day, weekday } = formatDayHeader(date);
                                    const isToday = date === todayStr;
                                    return (
                                        <th key={date} className={`text-center px-3 py-3 min-w-[80px] ${isToday ? 'bg-gray-100' : ''}`}>
                                            <p className="text-[11px] font-medium text-gray-400 uppercase">{weekday}</p>
                                            <p className={`text-lg font-bold ${isToday ? 'text-gray-900' : 'text-gray-700'}`}>{day}</p>
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
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <BedDouble className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm">{rt.name}</p>
                                                    <p className="text-[11px] text-gray-400">{total} room{total !== 1 ? 's' : ''}</p>
                                                </div>
                                            </div>
                                        </td>
                                        {weekDates.map((date) => {
                                            const available = availabilityMap[rt.slug]?.[date];
                                            const isToday = date === todayStr;

                                            if (available === undefined) {
                                                return (
                                                    <td key={date} className={`text-center px-3 py-3 ${isToday ? 'bg-gray-50' : ''}`}>
                                                        <span className="text-gray-300 text-sm">—</span>
                                                    </td>
                                                );
                                            }

                                            const booked = Math.max(0, total - available);
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
                                                <td key={date} className={`text-center px-3 py-3 ${isToday ? 'bg-gray-50' : ''}`}>
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
