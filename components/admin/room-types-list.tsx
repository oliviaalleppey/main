'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Pencil, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatRoomName } from '@/lib/utils';
import { updateRoomTypeSorting } from '@/lib/db/actions/room-type-actions';
import { useRouter } from 'next/navigation';

interface RoomType {
    id: string;
    name: string;
    status: string | null;
    shortDescription: string | null;
    minOccupancy: number;
    baseOccupancy: number;
    maxGuests: number;
    maxAdults: number;
    maxChildren: number | null;
    basePrice: number;
    sortOrder: number | null;
    rooms: any[];
}

interface RoomTypesListProps {
    initialRoomTypes: RoomType[];
}

export function RoomTypesList({ initialRoomTypes }: RoomTypesListProps) {
    const [roomTypes, setRoomTypes] = useState(initialRoomTypes);
    const [isUpdating, setIsUpdating] = useState(false);
    const router = useRouter();

    const handleMove = async (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= roomTypes.length) return;

        const newRoomTypes = [...roomTypes];
        const [movedItem] = newRoomTypes.splice(index, 1);
        newRoomTypes.splice(newIndex, 0, movedItem);

        // Update sort orders locally first for immediate feedback
        const updatedWithSortOrder = newRoomTypes.map((type, idx) => ({
            ...type,
            sortOrder: idx,
        }));

        setRoomTypes(updatedWithSortOrder);
        setIsUpdating(true);

        try {
            const updates = updatedWithSortOrder.map((type, idx) => ({
                id: type.id,
                sortOrder: idx,
            }));
            await updateRoomTypeSorting(updates);
            router.refresh();
        } catch (error) {
            console.error('Failed to update sorting:', error);
            // Optionally revert on failure
            setRoomTypes(roomTypes);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="grid gap-6">
            {roomTypes.map((type, index) => (
                <Card key={type.id} className="p-6 relative group">
                    <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                            {/* Reorder Buttons */}
                            <div className="flex flex-col gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={index === 0 || isUpdating}
                                    onClick={() => handleMove(index, 'up')}
                                    className="h-8 w-8"
                                >
                                    <ArrowUp className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={index === roomTypes.length - 1 || isUpdating}
                                    onClick={() => handleMove(index, 'down')}
                                    className="h-8 w-8"
                                >
                                    <ArrowDown className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-semibold">{formatRoomName(type.name)}</h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${type.status === 'active'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {type.status}
                                    </span>
                                    {isUpdating && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                                </div>
                                <p className="text-gray-600">{type.shortDescription}</p>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-2">
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
                                    <div className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                        Order: {index + 1}
                                    </div>
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
                    </div>
                </Card>
            ))}

            {roomTypes.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                    <h3 className="text-lg font-medium text-gray-900">No room types</h3>
                    <p className="text-gray-500 mt-1">Get started by creating your first room type</p>
                    <Link href="/admin/rooms/types/new" className="mt-4 inline-block">
                        <Button>Create Room Type</Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
