import { db } from '@/lib/db';
import { roomTypes } from '@/lib/db/schema';
import { RoomForm } from '@/components/admin/room-form';

export default async function NewRoomPage() {
    const allRoomTypes = await db.select({
        id: roomTypes.id,
        name: roomTypes.name,
    }).from(roomTypes);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Add Room</h1>
                <p className="text-gray-600">Registration of a new physical room unit</p>
            </div>
            <RoomForm roomTypes={allRoomTypes} />
        </div>
    );
}
