import { db } from '@/lib/db';
import { roomTypes, rooms } from '@/lib/db/schema';
import { sql, eq } from 'drizzle-orm';
import Link from 'next/link';
import { BedDouble, ArrowLeft, Calendar, CheckCircle2, AlertCircle, XCircle, MinusCircle } from 'lucide-react';
import { HotsoftCrsProvider } from '@/lib/providers/crs/hotsoft-crs-provider';
import { Suspense } from 'react';
import { AvailabilityToolbar } from './toolbar';

export const revalidate = 300; // 5 minutes

function getDateRange(date: string, view: string): string[] {
    const d = new Date(date + 'T00:00:00');
    const dates: string[] = [];

    if (view === 'week') {
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

type StatusLevel = 'open' | 'filling' | 'critical' | 'full' | 'unknown';

function getStatus(free: number, total: number): StatusLevel {
    if (total === 0) return 'unknown';
    if (free === 0) return 'full';
    const pct = (free / total) * 100;
    if (pct <= 20) return 'critical';
    if (pct <= 60) return 'filling';
    return 'open';
}

function StatusBadge({ free, total, compact = false }: { free: number; total: number; compact?: boolean }) {
    const status = getStatus(free, total);

    const configs: Record<StatusLevel, { bg: string; text: string; bar: string; label: string; icon: React.ReactNode }> = {
        open:     { bg: 'bg-emerald-50 border-emerald-200',    text: 'text-emerald-800', bar: 'bg-emerald-400', label: 'Available',    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> },
        filling:  { bg: 'bg-amber-50 border-amber-200',        text: 'text-amber-800',   bar: 'bg-amber-400',   label: 'Filling Up',   icon: <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> },
        critical: { bg: 'bg-orange-50 border-orange-200',      text: 'text-orange-800',  bar: 'bg-orange-500',  label: 'Almost Full',  icon: <AlertCircle className="w-3.5 h-3.5 text-orange-500" /> },
        full:     { bg: 'bg-red-50 border-red-200',            text: 'text-red-800',     bar: 'bg-red-500',     label: 'Sold Out',     icon: <XCircle className="w-3.5 h-3.5 text-red-500" /> },
        unknown:  { bg: 'bg-gray-50 border-gray-200',          text: 'text-gray-500',    bar: 'bg-gray-300',    label: 'No data',      icon: <MinusCircle className="w-3.5 h-3.5 text-gray-400" /> },
    };

    const cfg = configs[status];
    const booked = Math.max(0, total - free);
    const pct = total > 0 ? Math.round((booked / total) * 100) : 0;

    if (compact) {
        return (
            <div className={`rounded-lg border ${cfg.bg} px-2 py-1.5 flex flex-col items-center gap-1 min-w-[52px]`}>
                <span className={`text-[11px] font-bold ${cfg.text} leading-none`}>{free}</span>
                <div className="w-8 h-1 rounded-full bg-gray-200 overflow-hidden">
                    <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${pct}%` }} />
                </div>
            </div>
        );
    }

    return (
        <div className={`rounded-xl border ${cfg.bg} px-3 py-2.5 flex flex-col gap-1.5 min-w-[80px]`}>
            <div className="flex items-center gap-1.5">
                {cfg.icon}
                <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
            </div>
            <div className="text-center">
                {status === 'full' ? (
                    <span className={`text-base font-bold ${cfg.text}`}>FULL</span>
                ) : (
                    <span className={`text-base font-bold ${cfg.text}`}>{free} <span className="text-xs font-medium opacity-70">free</span></span>
                )}
            </div>
            <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <div className={`h-full rounded-full ${cfg.bar} transition-all`} style={{ width: `${pct}%` }} />
            </div>
            {booked > 0 && (
                <span className={`text-[10px] ${cfg.text} opacity-70 text-center`}>{booked} booked</span>
            )}
        </div>
    );
}

function DayHeader({ dateStr, isToday, compact = false }: { dateStr: string; isToday: boolean; compact?: boolean }) {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDate();
    const weekday = d.toLocaleDateString('en-IN', { weekday: compact ? 'narrow' : 'short' }).toUpperCase();
    const month = d.toLocaleDateString('en-IN', { month: 'short' });

    return (
        <th className={`text-center py-3 ${compact ? 'px-1 min-w-[60px]' : 'px-3 min-w-[100px]'}`}>
            <div className={`inline-flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 ${isToday ? 'bg-gray-900 text-white' : 'text-gray-600'}`}>
                <span className={`text-[10px] font-semibold tracking-widest ${isToday ? 'text-gray-300' : 'text-gray-400'}`}>{weekday}</span>
                <span className={`text-lg font-bold leading-none ${isToday ? 'text-white' : 'text-gray-900'}`}>{day}</span>
                {!compact && <span className={`text-[10px] font-medium ${isToday ? 'text-gray-300' : 'text-gray-400'}`}>{month}</span>}
            </div>
        </th>
    );
}

export default async function AdminAvailabilityPage({ searchParams }: { searchParams: Promise<{ view?: string; date?: string }> }) {
    const params = await searchParams;
    const todayStr = new Date().toISOString().slice(0, 10);
    const view = params.view || 'week';
    const dateParam = params.date || todayStr;
    const dates = getDateRange(dateParam, view);

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
            crsErrors.push(String(yearInt));
        }
    } else {
        const fetchRes = await fetchAvailability(dates);
        availabilityMap = fetchRes.availabilityMap;
        crsErrors = fetchRes.crsErrors;
    }

    // Build maxSeen per room type for auto-calibration
    const maxSeenPerRoom: Record<string, number> = {};
    for (const rt of activeRoomTypes) {
        const counts = availabilityMap[rt.slug] ? Object.values(availabilityMap[rt.slug]) : [];
        maxSeenPerRoom[rt.slug] = counts.length > 0 ? Math.max(...counts) : 0;
    }

    const isCompact = view === 'month';

    // Overall summary for week/month
    let totalFreeToday = 0;
    let totalRoomsToday = 0;
    if (view !== 'year') {
        for (const rt of activeRoomTypes) {
            const total = Number(rt.totalRooms);
            const available = availabilityMap[rt.slug]?.[todayStr];
            if (available !== undefined) {
                const effectiveTotal = total > 0 ? total : maxSeenPerRoom[rt.slug];
                totalFreeToday += available;
                totalRoomsToday += effectiveTotal;
            }
        }
    }
    const totalBookedToday = Math.max(0, totalRoomsToday - totalFreeToday);
    const occupancyPct = totalRoomsToday > 0 ? Math.round((totalBookedToday / totalRoomsToday) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Room Availability</h1>
                    <p className="text-sm text-gray-500 mt-1">See which rooms are free or booked for each day</p>
                </div>
                <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Link>
            </div>

            {/* Today's Summary Card */}
            {view !== 'year' && totalRoomsToday > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                        <p className="text-3xl font-bold text-emerald-700">{totalFreeToday}</p>
                        <p className="text-sm text-emerald-600 font-medium mt-1">Rooms Free Today</p>
                    </div>
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-center">
                        <p className="text-3xl font-bold text-blue-700">{totalBookedToday}</p>
                        <p className="text-sm text-blue-600 font-medium mt-1">Rooms Booked Today</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center">
                        <p className="text-3xl font-bold text-gray-700">{occupancyPct}%</p>
                        <p className="text-sm text-gray-600 font-medium mt-1">Occupancy Today</p>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <Suspense fallback={<div className="h-20 bg-gray-100 rounded-lg animate-pulse" />}>
                <AvailabilityToolbar />
            </Suspense>

            {/* CRS Error */}
            {crsErrors.length > 0 && (
                <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    Could not load data for {crsErrors.length} date(s). Please try refreshing.
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs">
                <span className="font-semibold text-gray-500 uppercase tracking-wider">How to read:</span>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span className="text-gray-600">Available — rooms are free</span></div>
                <div className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-amber-500" /><span className="text-gray-600">Filling Up — some booked</span></div>
                <div className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-orange-500" /><span className="text-gray-600">Almost Full — few left</span></div>
                <div className="flex items-center gap-1.5"><XCircle className="w-4 h-4 text-red-500" /><span className="text-gray-600">Sold Out — fully booked</span></div>
            </div>

            {/* Grid */}
            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-gray-50/80">
                                <th className="text-left px-5 py-4 sticky left-0 bg-gray-50/80 z-10 min-w-[200px]">
                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Room Type</span>
                                </th>
                                {dates.map((date) => {
                                    const isToday = date === todayStr;
                                    if (view === 'year') {
                                        const d = new Date(date + 'T00:00:00');
                                        return (
                                            <th key={date} className="text-center px-2 py-3 min-w-[70px]">
                                                <span className="text-xs font-semibold text-gray-600">
                                                    {d.toLocaleDateString('en-IN', { month: 'short' })}
                                                </span>
                                            </th>
                                        );
                                    }
                                    return <DayHeader key={date} dateStr={date} isToday={isToday} compact={isCompact} />;
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {activeRoomTypes.map((rt) => {
                                const total = Number(rt.totalRooms);
                                const effectiveMaxSeen = total > 0 ? total : maxSeenPerRoom[rt.slug] ?? 0;

                                return (
                                    <tr key={rt.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-3 sticky left-0 bg-white z-10 border-r border-gray-100">
                                            <div className="flex items-center gap-2 group">
                                                <Link href={`/admin/availability/${rt.id}`} className="flex items-center gap-2 flex-1 min-w-0">
                                                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                                                        <BedDouble className="w-4 h-4 text-amber-700" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors truncate">{rt.name}</p>
                                                        <p className="text-[11px] text-gray-400 mt-0.5">
                                                            {effectiveMaxSeen > 0 ? `${effectiveMaxSeen} total rooms` : 'CRS managed'}
                                                        </p>
                                                    </div>
                                                </Link>
                                                <Link
                                                    href={`/admin/availability/${rt.id}`}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                                    title="View Calendar"
                                                >
                                                    <Calendar className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </td>

                                        {dates.map((date) => {
                                            const isToday = date === todayStr;

                                            if (view === 'year') {
                                                const monthKey = date.slice(0, 7);
                                                const agg = yearlyAggregates[rt.slug]?.[monthKey];
                                                if (!agg || agg.days === 0) {
                                                    return (
                                                        <td key={date} className={`text-center px-2 py-3 ${isToday ? 'bg-amber-50/30' : ''}`}>
                                                            <span className="text-gray-300 text-lg font-bold">—</span>
                                                        </td>
                                                    );
                                                }
                                                const totalCapacity = effectiveMaxSeen * agg.days;
                                                const freeSum = agg.freeSum;
                                                const bookedSum = Math.max(0, totalCapacity - freeSum);
                                                const avgFree = Math.round(freeSum / agg.days);
                                                return (
                                                    <td key={date} className={`text-center px-2 py-3 ${isToday ? 'bg-amber-50/30' : ''}`}>
                                                        <StatusBadge free={avgFree} total={effectiveMaxSeen} />
                                                    </td>
                                                );
                                            }

                                            const available = availabilityMap[rt.slug]?.[date];
                                            if (available === undefined) {
                                                return (
                                                    <td key={date} className={`text-center px-2 py-3 ${isToday ? 'bg-amber-50/30' : ''}`}>
                                                        <div className="inline-flex flex-col items-center gap-1 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 min-w-[80px]">
                                                            <MinusCircle className="w-4 h-4 text-gray-300" />
                                                            <span className="text-xs text-gray-300">No data</span>
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            let maxSeen = available;
                                            if (total === 0 && availabilityMap[rt.slug]) {
                                                const counts = Object.values(availabilityMap[rt.slug]).filter(v => v !== undefined);
                                                if (counts.length > 0) maxSeen = Math.max(...counts);
                                            }
                                            const effectiveTotal = total > 0 ? total : maxSeen;

                                            return (
                                                <td key={date} className={`text-center px-2 py-3 ${isToday ? 'bg-amber-50/30' : ''}`}>
                                                    <StatusBadge free={available} total={effectiveTotal} compact={isCompact} />
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
        </div>
    );
}
