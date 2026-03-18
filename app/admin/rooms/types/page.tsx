import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { ensureRoomTypeMinOccupancyColumn } from '@/lib/db/schema-guard';
import { RoomTypesList } from '@/components/admin/room-types-list';

export default async function RoomTypesPage() {
    await ensureRoomTypeMinOccupancyColumn();

    const allRoomTypes = await db.query.roomTypes.findMany({
        with: {
            rooms: true,
        },
        orderBy: (types, { asc }) => [asc(types.sortOrder), asc(types.createdAt)],
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Room Types</h1>
                    <p className="text-gray-600">Manage your hotel&apos;s room categories and their display order (Recommended sorting)</p>
                </div>
                <Link href="/admin/rooms/types/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Room Type
                    </Button>
                </Link>
            </div>

            <RoomTypesList initialRoomTypes={allRoomTypes} />
        </div>
    );
}
