import { db } from '@/lib/db';
import { roomTypes, rooms } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBookingProvider } from '@/lib/providers/crs/factory';
import { ArrowLeft, BedDouble, Calendar, Ban, Activity } from 'lucide-react';

interface PageProps {
    params: Promise<{ id: string }>;
}

function getDates(start: Date, days: number): Date[] {
    return Array.from({ length: days }, (_, i) => {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        return d;
    });
}

export default async function RoomAvailabilityPage({ params }: PageProps) {
    const { id } = await params;

    const roomType = await db.query.roomTypes.findFirst({
        where: eq(roomTypes.id, id),
    });

    if (!roomType) notFound();

    const roomCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(rooms)
        .where(eq(rooms.roomTypeId, id));

    const totalRooms = Number(roomCount[0]?.count || 0);

    // Check live availability from CRS for next 30 days
    const today = new Date();
    const next30Days = getDates(today, 30);
    const provider = getBookingProvider();

    type DayAvailability = { date: Date; free: number; status: 'available' | 'limited' | 'full' | 'unknown' };
    const availabilityData: DayAvailability[] = [];

    try {
        for (const date of next30Days.slice(0, 14)) { // Fetch 2 weeks to be fast
            const checkIn = date.toISOString().split('T')[0];
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            const checkOut = nextDay.toISOString().split('T')[0];

            const result = await provider.checkAvailability({
                checkIn,
                checkOut,
                adults: 1,
                children: 0,
                roomTypeId: roomType.id,
            });

            let free = 0;
            if (result.status === 'success') {
                const match = result.rooms.find(r =>
                    r.roomTypeId === roomType.id ||
                    r.roomTypeId === roomType.slug
                );
                free = match?.availableCount ?? totalRooms;
            }

            availabilityData.push({
                date,
                free,
                status: free === 0 ? 'full' : free <= 2 ? 'limited' : 'available',
            });
        }
        // Fill remaining days as unknown (to avoid too many API calls)
        for (const date of next30Days.slice(14)) {
            availabilityData.push({ date, free: -1, status: 'unknown' });
        }
    } catch {
        for (const date of next30Days) {
            availabilityData.push({ date, free: -1, status: 'unknown' });
        }
    }

    const months: Record<string, DayAvailability[]> = {};
    for (const day of availabilityData) {
        const key = day.date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        if (!months[key]) months[key] = [];
        months[key].push(day);
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/availability" className="text-gray-400 hover:text-gray-700">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">{roomType.name}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Live availability — next 30 days</p>
                </div>
                <Link
                    href={`/admin/availability/blocking?roomType=${id}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                >
                    <Ban className="w-4 h-4" />
                    Block Dates
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl border bg-white p-4 shadow-sm flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                        <BedDouble className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Total Rooms</p>
                        <p className="text-xl font-bold text-gray-900">{totalRooms}</p>
                    </div>
                </div>
                <div className="rounded-xl border bg-white p-4 shadow-sm flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Base Price</p>
                        <p className="text-xl font-bold text-gray-900">
                            ₹{(Number(roomType.basePrice) / 100).toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>
                <div className="rounded-xl border bg-white p-4 shadow-sm flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <p className="text-sm font-bold text-emerald-600 capitalize">{roomType.status}</p>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs">
                <span className="font-semibold text-gray-500 uppercase tracking-wider">Legend:</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-300" /> Available</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-300" /> Limited (≤2)</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-100 border border-red-300" /> Sold Out</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200" /> No data</span>
            </div>

            {/* Calendar Grid */}
            {Object.entries(months).map(([monthLabel, days]) => (
                <div key={monthLabel} className="rounded-xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-5 py-3 bg-gray-50 border-b">
                        <h2 className="font-semibold text-gray-700">{monthLabel}</h2>
                    </div>
                    <div className="p-4 grid grid-cols-7 gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="text-center text-xs font-semibold text-gray-400 pb-1">{d}</div>
                        ))}
                        {/* Empty spacer cells */}
                        {Array.from({ length: days[0].date.getDay() }).map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}
                        {days.map((day) => {
                            const isToday = day.date.toDateString() === today.toDateString();
                            const bgColor =
                                day.status === 'available' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                    day.status === 'limited' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                                        day.status === 'full' ? 'bg-red-50 border-red-200 text-red-800' :
                                            'bg-gray-50 border-gray-200 text-gray-400';

                            return (
                                <div
                                    key={day.date.toISOString()}
                                    className={`rounded-lg border p-2 text-center ${bgColor} ${isToday ? 'ring-2 ring-blue-400' : ''}`}
                                >
                                    <p className={`text-sm font-bold ${isToday ? 'text-blue-600' : ''}`}>
                                        {day.date.getDate()}
                                    </p>
                                    <p className="text-[10px] mt-0.5">
                                        {day.free >= 0 ? `${day.free} free` : '—'}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
