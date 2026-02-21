'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { roomSchema, type RoomInput } from '@/lib/validations/room';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface RoomFormProps {
    initialData?: any;
    roomTypes: Array<{ id: string; name: string }>;
}

export function RoomForm({ initialData, roomTypes }: RoomFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<RoomInput>({
        resolver: zodResolver(roomSchema),
        defaultValues: {
            roomTypeId: initialData?.roomTypeId || roomTypes[0]?.id || '',
            roomNumber: initialData?.roomNumber || '',
            floor: initialData?.floor ?? undefined,
            status: initialData?.status || 'active',
            notes: initialData?.notes || '',
        },
    });

    const onSubmit = async (data: RoomInput) => {
        setIsSubmitting(true);
        try {
            const response = await fetch(initialData ? `/api/admin/rooms/inventory/${initialData.id}` : '/api/admin/rooms/inventory', {
                method: initialData ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                router.push('/admin/rooms/inventory');
                router.refresh();
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to save room');
            }
        } catch (error) {
            console.error('Error saving room:', error);
            alert('Failed to save room');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Room Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="roomTypeId">Room Type *</Label>
                        <select
                            id="roomTypeId"
                            {...register('roomTypeId')}
                            className="w-full border rounded-md p-2 bg-transparent"
                        >
                            {roomTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                        {errors.roomTypeId && <p className="text-sm text-red-500">{errors.roomTypeId.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="roomNumber">Room Number *</Label>
                        <Input id="roomNumber" {...register('roomNumber')} placeholder="e.g. 101" />
                        {errors.roomNumber && <p className="text-sm text-red-500">{errors.roomNumber.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="floor">Floor</Label>
                        <Input
                            id="floor"
                            type="number"
                            {...register('floor', { valueAsNumber: true })}
                            placeholder="e.g. 1"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <select
                            id="status"
                            {...register('status')}
                            className="w-full border rounded-md p-2 bg-transparent"
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="maintenance">Maintenance</option>
                        </select>
                    </div>

                    <div className="col-span-2 space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" {...register('notes')} placeholder="Maintenance notes or other details..." />
                    </div>
                </div>
            </Card>

            <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : initialData ? 'Update Room' : 'Add Room'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}
