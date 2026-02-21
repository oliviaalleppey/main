import { db } from '@/lib/db';
import { roomTypes } from '@/lib/db/schema';
import { getRooms } from '@/lib/services/room-management';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Plus, Pencil, Filter } from 'lucide-react';

export default async function RoomInventoryPage() {
    const allRooms = await getRooms();
    const allRoomTypes = await db.select().from(roomTypes);

    const getRoomTypeName = (typeId: string | null) => {
        if (!typeId) return 'Unknown';
        return allRoomTypes.find(t => t.id === typeId)?.name || 'Unknown';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Room Inventory</h1>
                    <p className="text-gray-600">Manage individual room units and status</p>
                </div>
                <Link href="/admin/rooms/inventory/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Room
                    </Button>
                </Link>
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Floor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {allRooms.map((room) => (
                                <tr key={room.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{room.roomNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{getRoomTypeName(room.roomTypeId)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{room.floor || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${room.status === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : room.status === 'maintenance'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {room.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{room.notes || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link href={`/admin/rooms/inventory/${room.id}`} className="text-indigo-600 hover:text-indigo-900">
                                            Edit
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {allRooms.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No rooms found. Add your first room to manage inventory.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
