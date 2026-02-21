'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface RoomStatusCardProps {
    room: any; // Type strictly later if needed
}

export function RoomStatusCard({ room }: RoomStatusCardProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleStatusChange = async (newStatus: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/admin/rooms/inventory/${room.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ housekeepingStatus: newStatus }),
            });

            if (!response.ok) throw new Error('Failed to update status');

            toast.success('Room status updated');
            router.refresh();
        } catch (error) {
            toast.error('Failed to update status');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'clean': return 'bg-green-100 text-green-800 border-green-200';
            case 'dirty': return 'bg-red-100 text-red-800 border-red-200';
            case 'inspect': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'out_of_service': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    return (
        <Card className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        Room {room.roomNumber}
                        <Badge variant="outline" className={getStatusColor(room.housekeepingStatus)}>
                            {room.housekeepingStatus?.toUpperCase()}
                        </Badge>
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {room.roomType?.name} • Floor {room.floor}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Select
                        defaultValue={room.housekeepingStatus}
                        onValueChange={handleStatusChange}
                        disabled={isLoading}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Update Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="clean">Clean</SelectItem>
                            <SelectItem value="dirty">Dirty</SelectItem>
                            <SelectItem value="touch_up">Touch Up</SelectItem>
                            <SelectItem value="inspect">Inspect</SelectItem>
                            <SelectItem value="out_of_service">Out of Service</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </Card>
    );
}
