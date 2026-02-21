'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { roomTypeSchema, type RoomTypeInput, type RoomTypeFormValues } from '@/lib/validations/room';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ImageUpload } from '@/components/ui/image-upload';
import type { roomTypes } from '@/lib/db/schema';

interface RoomTypeFormProps {
    initialData?: typeof roomTypes.$inferSelect;
}

export function RoomTypeForm({ initialData }: RoomTypeFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<RoomTypeFormValues>({
        resolver: zodResolver(roomTypeSchema),
        defaultValues: initialData ? {
            ...initialData,
            minOccupancy: initialData.minOccupancy ?? 1,
            basePrice: initialData.basePrice / 100, // Convert paise to rupees for display
            extraAdultPrice: (initialData.extraAdultPrice || 0) / 100,
            extraChildPrice: (initialData.extraChildPrice || 0) / 100,
        } : {
            name: '',
            slug: '',
            description: '',
            shortDescription: '',
            basePrice: 0,
            minOccupancy: 1,
            baseOccupancy: 2,
            currency: 'INR',
            maxGuests: 2,
            maxAdults: 2,
            maxChildren: 0,
            extraAdultPrice: 0,
            extraChildPrice: 0,
            bedType: '',
            size: 0,
            sizeUnit: 'sqft',
            amenities: [],
            images: [],
            status: 'active',
            sortOrder: 0,
        },
    });

    const onSubmit = async (data: RoomTypeFormValues) => {
        const typedData = data as RoomTypeInput;
        setIsSubmitting(true);
        // Convert rupees back to paise for storage
        const formattedData = {
            ...typedData,
            basePrice: Math.round(typedData.basePrice * 100),
            extraAdultPrice: typedData.extraAdultPrice ? Math.round(typedData.extraAdultPrice * 100) : 0,
            extraChildPrice: typedData.extraChildPrice ? Math.round(typedData.extraChildPrice * 100) : 0,
        };

        try {
            const response = await fetch(initialData ? `/api/admin/rooms/types/${initialData.id}` : '/api/admin/rooms/types', {
                method: initialData ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formattedData),
            });

            if (response.ok) {
                router.push('/admin/rooms/types');
                router.refresh();
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to save room type');
            }
        } catch (error) {
            console.error('Error saving room type:', error);
            alert('Failed to save room type');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input id="name" {...register('name')} placeholder="e.g. Deluxe Suite" />
                        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug *</Label>
                        <Input id="slug" {...register('slug')} placeholder="e.g. deluxe-suite" />
                        {errors.slug && <p className="text-sm text-red-500">{errors.slug.message}</p>}
                    </div>
                    <div className="col-span-2 space-y-2">
                        <Label htmlFor="shortDescription">Short Description</Label>
                        <Input id="shortDescription" {...register('shortDescription')} placeholder="Brief summary for lists" />
                    </div>
                    <div className="col-span-2 space-y-2">
                        <Label htmlFor="description">Full Description</Label>
                        <Textarea id="description" {...register('description')} placeholder="Detailed description..." rows={4} />
                    </div>
                </div>
            </Card>

            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Images</h2>
                <div className="space-y-2">
                    <Label>Room Images</Label>
                    <ImageUpload
                        value={watch('images') || []}
                        onChange={(newImages) => setValue('images', newImages)}
                        onRemove={(urlToRemove) => {
                            const currentImages = watch('images') || [];
                            setValue('images', currentImages.filter((url) => url !== urlToRemove));
                        }}
                    />
                </div>
            </Card>

            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Pricing & Capacity</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <div>
                        <Label htmlFor="basePrice">Base Price (₹) *</Label>
                        <Input
                            id="basePrice"
                            type="number"
                            {...register('basePrice', { valueAsNumber: false })}
                            className="mt-1"
                        />
                        {errors.basePrice && <p className="text-sm text-red-500 mt-1">{errors.basePrice.message}</p>}
                    </div>

                    <div>
                        <Label htmlFor="minOccupancy">Min Occupancy *</Label>
                        <Input
                            id="minOccupancy"
                            type="number"
                            {...register('minOccupancy', { valueAsNumber: false })}
                            className="mt-1"
                        />
                        {errors.minOccupancy && <p className="text-sm text-red-500 mt-1">{errors.minOccupancy.message}</p>}
                        <p className="text-[10px] text-gray-500 mt-1">Minimum allowed guests</p>
                    </div>

                    <div>
                        <Label htmlFor="baseOccupancy">Base Occupancy *</Label>
                        <Input
                            id="baseOccupancy"
                            type="number"
                            {...register('baseOccupancy', { valueAsNumber: false })}
                            className="mt-1"
                        />
                        {errors.baseOccupancy && <p className="text-sm text-red-500 mt-1">{errors.baseOccupancy.message}</p>}
                        <p className="text-[10px] text-gray-500 mt-1">Guests included in base price</p>
                    </div>

                    <div>
                        <Label htmlFor="maxGuests">Max Occupancy *</Label>
                        <Input
                            id="maxGuests"
                            type="number"
                            {...register('maxGuests', { valueAsNumber: false })}
                            className="mt-1"
                        />
                        {errors.maxGuests && <p className="text-sm text-red-500 mt-1">{errors.maxGuests.message}</p>}
                        <p className="text-[10px] text-gray-500 mt-1">Absolute maximum guests</p>
                    </div>

                    <div>
                        <Label htmlFor="maxAdults">Max Adults *</Label>
                        <Input
                            id="maxAdults"
                            type="number"
                            {...register('maxAdults', { valueAsNumber: false })}
                            className="mt-1"
                        />
                        {errors.maxAdults && <p className="text-sm text-red-500 mt-1">{errors.maxAdults.message}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                    <div>
                        <Label htmlFor="extraAdultPrice">Extra Adult Price (₹)</Label>
                        <Input
                            id="extraAdultPrice"
                            type="number"
                            {...register('extraAdultPrice', { valueAsNumber: false })}
                            className="mt-1"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">Per night above base</p>
                    </div>

                    <div>
                        <Label htmlFor="extraChildPrice">Extra Child Price (₹)</Label>
                        <Input
                            id="extraChildPrice"
                            type="number"
                            {...register('extraChildPrice', { valueAsNumber: false })}
                            className="mt-1"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">Per night above base</p>
                    </div>

                    <div>
                        <Label htmlFor="maxChildren">Max Children</Label>
                        <Input
                            id="maxChildren"
                            type="number"
                            {...register('maxChildren', { valueAsNumber: false })}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="bedType">Bed Type</Label>
                        <Input id="bedType" {...register('bedType')} placeholder="e.g. King Size" className="mt-1" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                        <Label htmlFor="size">Room Size</Label>
                        <div className="flex gap-2 mt-1">
                            <Input
                                id="size"
                                type="number"
                                {...register('size', { valueAsNumber: false })}
                                className="flex-1"
                            />
                            <select
                                {...register('sizeUnit')}
                                className="border rounded-md px-2 bg-transparent"
                            >
                                <option value="sqft">sqft</option>
                                <option value="sqm">sqm</option>
                            </select>
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Status & Ordering</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="space-y-2">
                        <Label htmlFor="sortOrder">Sort Order</Label>
                        <Input
                            id="sortOrder"
                            type="number"
                            {...register('sortOrder', { valueAsNumber: false })}
                        />
                        <p className="text-xs text-gray-500">Lower numbers appear first</p>
                    </div>
                </div>
            </Card>

            <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : initialData ? 'Update Room Type' : 'Create Room Type'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}
