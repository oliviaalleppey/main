import { db } from '@/lib/db';
import { roomTypes } from '@/lib/db/schema';
import RatePlanForm from '@/components/admin/rate-plan-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function NewRatePlanPage({
    searchParams,
}: {
    searchParams: Promise<{ roomTypeId?: string }>;
}) {
    const { roomTypeId } = await searchParams;
    const allRoomTypes = await db.select().from(roomTypes);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/rooms/rate-plans">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Rate Plans
                    </Button>
                </Link>
            </div>

            <div>
                <h1 className="text-2xl font-bold">Create Rate Plan</h1>
                <p className="text-gray-600">Add a new pricing option for a room type</p>
            </div>

            <RatePlanForm
                roomTypes={allRoomTypes}
                initialData={{
                    roomTypeId: roomTypeId || '',
                    isActive: true,
                    basePriceModifier: 100,
                    minLOS: 1,
                    cancellationPolicy: 'moderate',
                    cancellationDays: 1,
                    depositRequired: 0,
                    depositAmount: 0,
                    displayOrder: 0,
                }}
            />
        </div>
    );
}
