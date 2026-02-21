'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pricingRuleSchema, type PricingRuleInput } from '@/lib/validations/pricing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface PricingRuleFormProps {
    initialData?: any;
    roomTypes: Array<{ id: string; name: string }>;
}

export function PricingRuleForm({ initialData, roomTypes }: PricingRuleFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, formState: { errors }, watch } = useForm<PricingRuleInput>({
        resolver: zodResolver(pricingRuleSchema),
        defaultValues: {
            name: initialData?.name || '',
            roomTypeId: initialData?.roomTypeId || null,
            startDate: initialData?.startDate || '',
            endDate: initialData?.endDate || '',
            priceModifier: initialData?.priceModifier ?? 100,
            minimumStay: initialData?.minimumStay ?? 1,
            priority: initialData?.priority ?? 0,
            isActive: initialData?.isActive ?? true,
        },
    });

    const priceModifier = watch('priceModifier');
    const isIncrease = priceModifier > 100;
    const isDecrease = priceModifier < 100;
    const percentageChange = isIncrease ? priceModifier - 100 : 100 - priceModifier;

    const onSubmit = async (data: PricingRuleInput) => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/admin/pricing/rules', {
                method: initialData ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(initialData ? { ...data, id: initialData.id } : data),
            });

            if (response.ok) {
                router.push('/admin/pricing');
                router.refresh();
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to save pricing rule');
            }
        } catch (error) {
            console.error('Error saving pricing rule:', error);
            alert('Failed to save pricing rule');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="name">Rule Name *</Label>
                        <Input
                            id="name"
                            {...register('name')}
                            placeholder="e.g., Christmas Week Premium"
                        />
                        {errors.name && (
                            <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="roomTypeId">Room Type (Optional)</Label>
                        <select
                            id="roomTypeId"
                            {...register('roomTypeId')}
                            className="w-full border rounded-md p-2"
                        >
                            <option value="">All Room Types</option>
                            {roomTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                        <p className="text-sm text-gray-600 mt-1">
                            Leave empty to apply to all room types
                        </p>
                    </div>
                </div>
            </Card>

            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Date Range</h2>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="startDate">Start Date *</Label>
                        <Input
                            id="startDate"
                            type="date"
                            {...register('startDate')}
                        />
                        {errors.startDate && (
                            <p className="text-sm text-red-600 mt-1">{errors.startDate.message}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="endDate">End Date *</Label>
                        <Input
                            id="endDate"
                            type="date"
                            {...register('endDate')}
                        />
                        {errors.endDate && (
                            <p className="text-sm text-red-600 mt-1">{errors.endDate.message}</p>
                        )}
                    </div>
                </div>
            </Card>

            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Pricing</h2>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="priceModifier">Price Modifier (%) *</Label>
                        <Input
                            id="priceModifier"
                            type="number"
                            {...register('priceModifier', { valueAsNumber: true })}
                            placeholder="100"
                        />
                        {errors.priceModifier && (
                            <p className="text-sm text-red-600 mt-1">{errors.priceModifier.message}</p>
                        )}
                        <div className="mt-2 p-3 bg-gray-50 rounded-md">
                            {priceModifier === 100 && (
                                <p className="text-sm text-gray-600">No price change (100% = base price)</p>
                            )}
                            {isIncrease && (
                                <p className="text-sm text-green-700 font-medium">
                                    ↑ {percentageChange}% increase (e.g., ₹10,000 → ₹{(10000 * (priceModifier / 100)).toLocaleString()})
                                </p>
                            )}
                            {isDecrease && (
                                <p className="text-sm text-blue-700 font-medium">
                                    ↓ {percentageChange}% discount (e.g., ₹10,000 → ₹{(10000 * (priceModifier / 100)).toLocaleString()})
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="minimumStay">Minimum Stay (nights) *</Label>
                        <Input
                            id="minimumStay"
                            type="number"
                            {...register('minimumStay', { valueAsNumber: true })}
                            placeholder="1"
                        />
                        {errors.minimumStay && (
                            <p className="text-sm text-red-600 mt-1">{errors.minimumStay.message}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="priority">Priority *</Label>
                        <Input
                            id="priority"
                            type="number"
                            {...register('priority', { valueAsNumber: true })}
                            placeholder="0"
                        />
                        <p className="text-sm text-gray-600 mt-1">
                            Higher priority rules are applied first (0 = lowest)
                        </p>
                        {errors.priority && (
                            <p className="text-sm text-red-600 mt-1">{errors.priority.message}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            id="isActive"
                            type="checkbox"
                            {...register('isActive')}
                            className="w-4 h-4"
                        />
                        <Label htmlFor="isActive" className="font-normal">
                            Active (rule will be applied immediately)
                        </Label>
                    </div>
                </div>
            </Card>

            <div className="flex gap-3">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : initialData ? 'Update Rule' : 'Create Rule'}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}
