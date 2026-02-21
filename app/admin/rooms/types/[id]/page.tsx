import { db } from '@/lib/db';
import { roomTypes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { RoomTypeForm } from '@/components/admin/room-type-form';
import { ensureRoomTypeMinOccupancyColumn } from '@/lib/db/schema-guard';

export default async function EditRoomTypePage({ params }: { params: Promise<{ id: string }> }) {
    await ensureRoomTypeMinOccupancyColumn();

    const { id } = await params;
    const roomType = await db.query.roomTypes.findFirst({
        where: eq(roomTypes.id, id),
    });

    if (!roomType) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Edit Room Type</h1>
                <p className="text-gray-600">Update details for {roomType.name}</p>
            </div>
            <RoomTypeForm initialData={roomType} />
        </div>
    );
}
