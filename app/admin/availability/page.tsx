import { db } from '@/lib/db';
import { roomTypes, rooms } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Calendar, BedDouble, TrendingUp, AlertCircle } from 'lucide-react';

export default async function AdminAvailabilityPage() {
    // Get all room types with their room counts
    const roomTypesWithCounts = await db
        .select({
            id: roomTypes.id,
            name: roomTypes.name,
            slug: roomTypes.slug,
            basePrice: roomTypes.basePrice,
            status: roomTypes.status,
            totalRooms: sql<number>`count(${rooms.id})`,
        })
        .from(roomTypes)
        .leftJoin(rooms, eq(rooms.roomTypeId, roomTypes.id))
        .groupBy(roomTypes.id)
        .orderBy(roomTypes.sortOrder);

    // Get today's date for availability check
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Availability Management</h1>
                    <p className="text-gray-600 mt-1">View and manage room availability across all room types</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/admin/availability/calendar">
                        <Button variant="outline">
                            <Calendar className="w-4 h-4 mr-2" />
                            Calendar View
                        </Button>
                    </Link>
                    <Link href="/admin/availability/blocking">
                        <Button>
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Block Dates
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Room Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{roomTypesWithCounts.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Rooms</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {roomTypesWithCounts.reduce((sum, rt) => sum + Number(rt.totalRooms), 0)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Active Room Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">
                            {roomTypesWithCounts.filter(rt => rt.status === 'active').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Today</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-medium">{today}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Room Types Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roomTypesWithCounts.map((roomType) => (
                    <Card key={roomType.id} className="overflow-hidden">
                        <div className="bg-gradient-to-r from-teal-700 to-teal-600 text-white p-4">
                            <h3 className="text-lg font-semibold">{roomType.name}</h3>
                            <p className="text-teal-100 text-sm">{roomType.slug}</p>
                        </div>
                        <CardContent className="p-4 space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <BedDouble className="w-5 h-5 text-gray-400" />
                                    <span className="text-gray-600">Total Rooms</span>
                                </div>
                                <span className="font-semibold text-lg">{Number(roomType.totalRooms)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-gray-400" />
                                    <span className="text-gray-600">Base Price</span>
                                </div>
                                <span className="font-semibold">
                                    ₹{(Number(roomType.basePrice) / 100).toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Status</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${roomType.status === 'active'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    {roomType.status}
                                </span>
                            </div>
                            <div className="pt-2 flex gap-2">
                                <Link href={`/admin/availability/${roomType.id}`} className="flex-1">
                                    <Button variant="outline" className="w-full">
                                        View Calendar
                                    </Button>
                                </Link>
                                <Link href={`/admin/availability/blocking?roomType=${roomType.id}`} className="flex-1">
                                    <Button variant="outline" className="w-full">
                                        Manage
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {roomTypesWithCounts.length === 0 && (
                <Card className="p-12 text-center">
                    <BedDouble className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Room Types Found</h3>
                    <p className="text-gray-600 mb-4">
                        Create room types first to manage availability.
                    </p>
                    <Link href="/admin/rooms/types/new">
                        <Button>Create Room Type</Button>
                    </Link>
                </Card>
            )}
        </div>
    );
}
