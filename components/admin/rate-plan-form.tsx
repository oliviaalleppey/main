'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    ArrowLeft,
    Save,
    Loader2,
    Percent,
    Calendar,
    Clock,
    Gift
} from 'lucide-react';

interface RoomType {
    id: string;
    name: string;
    basePrice: number;
}

interface RatePlanFormData {
    name: string;
    code: string;
    roomTypeId: string;
    description: string;
    basePriceModifier: number;
    minLOS: number;
    maxLOS: number | null;
    includesBreakfast: boolean;
    includesAirportTransfer: boolean;
    includesLateCheckout: boolean;
    includesSpa: boolean;
    includesDinner: boolean;
    inclusionsDescription: string;
    cancellationPolicy: string;
    cancellationDays: number;
    depositRequired: number;
    depositAmount: number;
    isActive: boolean;
    isDefault: boolean;
    isPromotional: boolean;
    displayOrder: number;
    bookableFrom: string;
    bookableTo: string;
}

interface RatePlanFormProps {
    ratePlanId?: string;
    initialData?: Partial<RatePlanFormData>;
    roomTypes: RoomType[];
}

export default function RatePlanForm({ ratePlanId, initialData, roomTypes }: RatePlanFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<RatePlanFormData>({
        name: initialData?.name || '',
        code: initialData?.code || '',
        roomTypeId: initialData?.roomTypeId || '',
        description: initialData?.description || '',
        basePriceModifier: initialData?.basePriceModifier ?? 100,
        minLOS: initialData?.minLOS ?? 1,
        maxLOS: initialData?.maxLOS || null,
        includesBreakfast: initialData?.includesBreakfast || false,
        includesAirportTransfer: initialData?.includesAirportTransfer || false,
        includesLateCheckout: initialData?.includesLateCheckout || false,
        includesSpa: initialData?.includesSpa || false,
        includesDinner: initialData?.includesDinner || false,
        inclusionsDescription: initialData?.inclusionsDescription || '',
        cancellationPolicy: initialData?.cancellationPolicy || 'moderate',
        cancellationDays: initialData?.cancellationDays ?? 1,
        depositRequired: initialData?.depositRequired ?? 0,
        depositAmount: initialData?.depositAmount ?? 0,
        isActive: initialData?.isActive ?? true,
        isDefault: initialData?.isDefault || false,
        isPromotional: initialData?.isPromotional || false,
        displayOrder: initialData?.displayOrder ?? 0,
        bookableFrom: initialData?.bookableFrom || '',
        bookableTo: initialData?.bookableTo || '',
    });

    const selectedRoomType = roomTypes.find(rt => rt.id === formData.roomTypeId);
    const calculatedPrice = selectedRoomType
        ? Math.round(selectedRoomType.basePrice * formData.basePriceModifier / 100)
        : 0;

    // Auto-generate code from name
    useEffect(() => {
        if (formData.name && !initialData?.code) {
            const code = formData.name
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '_')
                .replace(/_+/g, '_')
                .substring(0, 20);
            setFormData(prev => ({ ...prev, code }));
        }
    }, [formData.name, initialData?.code]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = ratePlanId
                ? `/api/admin/rate-plans/${ratePlanId}`
                : '/api/admin/rate-plans';

            const method = ratePlanId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                router.push('/admin/rooms/rate-plans');
                router.refresh();
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to save rate plan');
            }
        } catch (error) {
            console.error('Error saving rate plan:', error);
            alert('Failed to save rate plan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Percent className="w-5 h-5" />
                    Basic Information
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <Label htmlFor="name">Rate Plan Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Best Available Rate, Non-Refundable"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="code">Code *</Label>
                        <Input
                            id="code"
                            value={formData.code}
                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            placeholder="e.g., BAR, NR, BB"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="roomTypeId">Room Type *</Label>
                        <Select
                            value={formData.roomTypeId}
                            onValueChange={value => setFormData({ ...formData, roomTypeId: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select room type" />
                            </SelectTrigger>
                            <SelectContent>
                                {roomTypes.map(rt => (
                                    <SelectItem key={rt.id} value={rt.id}>
                                        {rt.name} (Base: ₹{rt.basePrice.toLocaleString()})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="displayOrder">Display Order</Label>
                        <Input
                            id="displayOrder"
                            type="number"
                            value={formData.displayOrder}
                            onChange={e => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe this rate plan..."
                            rows={2}
                        />
                    </div>
                </div>
            </Card>

            {/* Pricing */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Pricing</h2>
                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <Label htmlFor="basePriceModifier">Price Modifier (%) *</Label>
                        <div className="relative">
                            <Input
                                id="basePriceModifier"
                                type="number"
                                value={formData.basePriceModifier}
                                onChange={e => setFormData({ ...formData, basePriceModifier: parseInt(e.target.value) || 100 })}
                                min={0}
                                max={500}
                                required
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            100% = Base Price, 80% = 20% Discount, 120% = 20% Premium
                        </p>
                    </div>
                    <div>
                        <Label>Calculated Price</Label>
                        <div className="text-2xl font-bold text-green-600">
                            ₹{calculatedPrice.toLocaleString()}
                        </div>
                        <p className="text-xs text-gray-500">per night</p>
                    </div>
                    <div>
                        <Label>Base Price Reference</Label>
                        <div className="text-lg">
                            {selectedRoomType ? `₹${selectedRoomType.basePrice.toLocaleString()}` : 'Select room type'}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Length of Stay */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Length of Stay Restrictions
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <Label htmlFor="minLOS">Minimum Stay (nights)</Label>
                        <Input
                            id="minLOS"
                            type="number"
                            value={formData.minLOS}
                            onChange={e => setFormData({ ...formData, minLOS: parseInt(e.target.value) || 1 })}
                            min={1}
                        />
                    </div>
                    <div>
                        <Label htmlFor="maxLOS">Maximum Stay (nights)</Label>
                        <Input
                            id="maxLOS"
                            type="number"
                            value={formData.maxLOS || ''}
                            onChange={e => setFormData({ ...formData, maxLOS: parseInt(e.target.value) || null })}
                            min={1}
                            placeholder="No limit"
                        />
                    </div>
                </div>
            </Card>

            {/* Inclusions */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Gift className="w-5 h-5" />
                    Inclusions
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                            <Label htmlFor="includesBreakfast" className="font-medium">Breakfast</Label>
                            <p className="text-xs text-gray-500">Daily breakfast included</p>
                        </div>
                        <Switch
                            id="includesBreakfast"
                            checked={formData.includesBreakfast}
                            onCheckedChange={checked => setFormData({ ...formData, includesBreakfast: checked })}
                        />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                            <Label htmlFor="includesAirportTransfer" className="font-medium">Airport Transfer</Label>
                            <p className="text-xs text-gray-500">Pickup/drop included</p>
                        </div>
                        <Switch
                            id="includesAirportTransfer"
                            checked={formData.includesAirportTransfer}
                            onCheckedChange={checked => setFormData({ ...formData, includesAirportTransfer: checked })}
                        />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                            <Label htmlFor="includesLateCheckout" className="font-medium">Late Checkout</Label>
                            <p className="text-xs text-gray-500">2PM checkout</p>
                        </div>
                        <Switch
                            id="includesLateCheckout"
                            checked={formData.includesLateCheckout}
                            onCheckedChange={checked => setFormData({ ...formData, includesLateCheckout: checked })}
                        />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                            <Label htmlFor="includesSpa" className="font-medium">Spa Access</Label>
                            <p className="text-xs text-gray-500">Spa discount/access</p>
                        </div>
                        <Switch
                            id="includesSpa"
                            checked={formData.includesSpa}
                            onCheckedChange={checked => setFormData({ ...formData, includesSpa: checked })}
                        />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                            <Label htmlFor="includesDinner" className="font-medium">Dinner</Label>
                            <p className="text-xs text-gray-500">Daily dinner included</p>
                        </div>
                        <Switch
                            id="includesDinner"
                            checked={formData.includesDinner}
                            onCheckedChange={checked => setFormData({ ...formData, includesDinner: checked })}
                        />
                    </div>
                </div>
                <div className="mt-4">
                    <Label htmlFor="inclusionsDescription">Additional Inclusions Description</Label>
                    <Textarea
                        id="inclusionsDescription"
                        value={formData.inclusionsDescription}
                        onChange={e => setFormData({ ...formData, inclusionsDescription: e.target.value })}
                        placeholder="Any additional inclusions or special notes..."
                        rows={2}
                    />
                </div>
            </Card>

            {/* Cancellation Policy */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Cancellation & Deposit</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
                        <Select
                            value={formData.cancellationPolicy}
                            onValueChange={value => setFormData({ ...formData, cancellationPolicy: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="flexible">Flexible - Free cancellation anytime</SelectItem>
                                <SelectItem value="moderate">Moderate - Free up to 24-48 hours</SelectItem>
                                <SelectItem value="strict">Strict - 50% refund if cancelled 7+ days before</SelectItem>
                                <SelectItem value="non_refundable">Non-Refundable - No refund</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="cancellationDays">Free Cancellation (days before)</Label>
                        <Input
                            id="cancellationDays"
                            type="number"
                            value={formData.cancellationDays}
                            onChange={e => setFormData({ ...formData, cancellationDays: parseInt(e.target.value) || 0 })}
                            min={0}
                        />
                    </div>
                    <div>
                        <Label htmlFor="depositRequired">Deposit Required (%)</Label>
                        <Input
                            id="depositRequired"
                            type="number"
                            value={formData.depositRequired}
                            onChange={e => setFormData({ ...formData, depositRequired: parseInt(e.target.value) || 0 })}
                            min={0}
                            max={100}
                        />
                    </div>
                    <div>
                        <Label htmlFor="depositAmount">Fixed Deposit Amount (₹)</Label>
                        <Input
                            id="depositAmount"
                            type="number"
                            value={formData.depositAmount}
                            onChange={e => setFormData({ ...formData, depositAmount: parseInt(e.target.value) || 0 })}
                            min={0}
                        />
                    </div>
                </div>
            </Card>

            {/* Availability */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Availability
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <Label htmlFor="bookableFrom">Bookable From</Label>
                        <Input
                            id="bookableFrom"
                            type="date"
                            value={formData.bookableFrom}
                            onChange={e => setFormData({ ...formData, bookableFrom: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label htmlFor="bookableTo">Bookable To</Label>
                        <Input
                            id="bookableTo"
                            type="date"
                            value={formData.bookableTo}
                            onChange={e => setFormData({ ...formData, bookableTo: e.target.value })}
                        />
                    </div>
                </div>
            </Card>

            {/* Status Flags */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Status</h2>
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                            <Label htmlFor="isActive" className="font-medium">Active</Label>
                            <p className="text-xs text-gray-500">Available for booking</p>
                        </div>
                        <Switch
                            id="isActive"
                            checked={formData.isActive}
                            onCheckedChange={checked => setFormData({ ...formData, isActive: checked })}
                        />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                            <Label htmlFor="isDefault" className="font-medium">Default</Label>
                            <p className="text-xs text-gray-500">Default rate for this room</p>
                        </div>
                        <Switch
                            id="isDefault"
                            checked={formData.isDefault}
                            onCheckedChange={checked => setFormData({ ...formData, isDefault: checked })}
                        />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                            <Label htmlFor="isPromotional" className="font-medium">Promotional</Label>
                            <p className="text-xs text-gray-500">Special offer rate</p>
                        </div>
                        <Switch
                            id="isPromotional"
                            checked={formData.isPromotional}
                            onCheckedChange={checked => setFormData({ ...formData, isPromotional: checked })}
                        />
                    </div>
                </div>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Rate Plan
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
