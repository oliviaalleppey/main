import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Plus, Pencil, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ensureRoomTypeMinOccupancyColumn } from '@/lib/db/schema-guard';

export default async function RoomTypesPage() {
    await ensureRoomTypeMinOccupancyColumn();

    const allRoomTypes = await db.query.roomTypes.findMany({
        with: {
            rooms: true,
        },
        orderBy: (types, { asc }) => [asc(types.sortOrder)],
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Room Types</h1>
                    <p className="text-gray-600">Manage your hotel&apos;s room categories</p>
                </div>
                <Link href="/admin/rooms/types/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Room Type
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6">
                {allRoomTypes.map((type) => (
                    <Card key={type.id} className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-semibold">{type.name}</h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${type.status === 'active'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {type.status}
                                    </span>
                                </div>
                                <p className="text-gray-600">{type.shortDescription}</p>
                                <div className="flex gap-4 text-sm text-gray-500 mt-2">
                                    <div className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        Min {type.minOccupancy} • Base {type.baseOccupancy} • Max {type.maxGuests}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        Up to {type.maxAdults} Adults, {type.maxChildren} Children
                                    </div>
                                    <div>
                                        {type.rooms.length} Units
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold">
                                    {formatCurrency(type.basePrice)}
                                </div>
                                <div className="text-sm text-gray-500">per night</div>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3 border-t pt-4">
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/admin/rooms/types/${type.id}`}>
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Edit
                                </Link>
                            </Button>
                            {/* We'll handle delete with a client component or server action */}
                        </div>
                    </Card>
                ))}

                {allRoomTypes.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                        <h3 className="text-lg font-medium text-gray-900">No room types</h3>
                        <p className="text-gray-500 mt-1">Get started by creating your first room type</p>
                        <Link href="/admin/rooms/types/new" className="mt-4 inline-block">
                            <Button>Create Room Type</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
