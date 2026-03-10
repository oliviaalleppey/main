import { db } from '@/lib/db';
import { roomTypes, rooms } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import Link from 'next/link';
import { BedDouble, TrendingUp, CalendarDays, Ban, ArrowRight, Users, CheckCircle2 } from 'lucide-react';

function formatPrice(paise: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(paise / 100);
}

export default async function AdminAvailabilityPage() {
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

    const today = new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const totalRooms = roomTypesWithCounts.reduce((sum, rt) => sum + Number(rt.totalRooms), 0);
    const activeTypes = roomTypesWithCounts.filter(rt => rt.status === 'active').length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
                    <p className="text-sm text-gray-500 mt-1">{today}</p>
                </div>
                <Link
                    href="/admin/availability/blocking"
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
                >
                    <Ban className="w-4 h-4" />
                    Block Dates
                </Link>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
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

            {/* Room Type Cards */}
            <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">All Room Types</h2>
                <div className="space-y-3">
                    {roomTypesWithCounts.map((roomType) => (
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
                    ))}
                </div>
            </div>
        </div>
    );
}
