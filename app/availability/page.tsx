import { db } from '@/lib/db';
import { roomTypes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { AvailabilityViewer } from '@/components/booking/availability-viewer';

export default async function AvailabilityPage() {
    const allRoomTypes = await db.select()
        .from(roomTypes)
        .where(eq(roomTypes.status, 'active'));

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto py-12 px-4 space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-2">Room Availability</h1>
                    <p className="text-gray-600">Check real-time availability and pricing for all room types</p>
                </div>

                <div className="space-y-12">
                    {allRoomTypes.map((roomType) => (
                        <AvailabilityViewer
                            key={roomType.id}
                            roomType={roomType}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
