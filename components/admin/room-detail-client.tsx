'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface FormData {
    roomTypeId: string;
    roomNumber: string;
    floor?: number;
    status: 'active' | 'inactive' | 'maintenance';
    notes?: string;
}

interface RoomAttribute {
    id: string;
    name: string;
    code: string;
    description: string | null;
    icon: string | null;
    priceModifier: number | null;
    category: string | null;
}

interface CurrentAttribute {
    attributeId: string;
    value: boolean | null;
    notes: string | null;
}

interface RoomType {
    id: string;
    name: string;
}

interface Room {
    id: string;
    roomNumber: string;
    floor: number | null;
    status: string | null;
    notes: string | null;
    housekeepingStatus: string | null;
    lastCleanedAt: Date | null;
    lastInspectedAt: Date | null;
    roomType: {
        id: string;
        name: string;
        basePrice: number;
        maxGuests: number;
        size: number | null;
        bedType: string | null;
    };
}

interface RoomDetailClientProps {
    room: Room;
    roomTypes: RoomType[];
    allAttributes: RoomAttribute[];
    currentAttributes: CurrentAttribute[];
}

const housekeepingStatusConfig = {
    clean: { label: 'Clean', color: 'bg-green-100 text-green-800 border-green-200', icon: '✓' },
    dirty: { label: 'Dirty', color: 'bg-red-100 text-red-800 border-red-200', icon: '!' },
    touch_up: { label: 'Touch Up', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '↻' },
    inspect: { label: 'Inspect', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '👁' },
    out_of_service: { label: 'Out of Service', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '✕' },
};

const statusConfig = {
    active: { label: 'Active', color: 'bg-green-100 text-green-800' },
    inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
    maintenance: { label: 'Maintenance', color: 'bg-orange-100 text-orange-800' },
};

export function RoomDetailClient({
    room,
    roomTypes,
    allAttributes,
    currentAttributes
}: RoomDetailClientProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'housekeeping' | 'attributes'>('details');
    const [selectedAttributes, setSelectedAttributes] = useState<Set<string>>(
        new Set(currentAttributes.filter(a => a.value).map(a => a.attributeId))
    );
    const [hkStatus, setHkStatus] = useState(room.housekeepingStatus || 'clean');

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            roomTypeId: room.roomType.id,
            roomNumber: room.roomNumber,
            floor: room.floor ?? undefined,
            status: (room.status as 'active' | 'inactive' | 'maintenance') || 'active',
            notes: room.notes || '',
        },
    });

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            // Update room details
            const response = await fetch(`/api/admin/rooms/inventory/${room.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    housekeepingStatus: hkStatus,
                }),
            });

            if (response.ok) {
                // Update attributes
                await fetch(`/api/admin/rooms/inventory/${room.id}/attributes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ attributes: Array.from(selectedAttributes) }),
                });

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

    const toggleAttribute = (attributeId: string) => {
        const newSet = new Set(selectedAttributes);
        if (newSet.has(attributeId)) {
            newSet.delete(attributeId);
        } else {
            newSet.add(attributeId);
        }
        setSelectedAttributes(newSet);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(price / 100);
    };

    const formatDate = (date: Date | null) => {
        if (!date) return 'Never';
        return new Intl.DateTimeFormat('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(date));
    };

    const groupedAttributes = allAttributes.reduce((acc, attr) => {
        const category = attr.category || 'other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(attr);
        return acc;
    }, {} as Record<string, RoomAttribute[]>);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-[#0A332B] flex items-center justify-center">
                            <span className="text-white text-xl font-bold">{room.roomNumber}</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Room {room.roomNumber}</h1>
                            <p className="text-gray-600">{room.roomType.name} • Floor {room.floor || 'N/A'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig[room.status as keyof typeof statusConfig]?.color || 'bg-gray-100'}`}>
                            {statusConfig[room.status as keyof typeof statusConfig]?.label || room.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${housekeepingStatusConfig[hkStatus as keyof typeof housekeepingStatusConfig]?.color || 'bg-gray-100'}`}>
                            {housekeepingStatusConfig[hkStatus as keyof typeof housekeepingStatusConfig]?.label || hkStatus}
                        </span>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
                    <div>
                        <p className="text-sm text-gray-500">Base Price</p>
                        <p className="text-lg font-semibold text-gray-900">{formatPrice(room.roomType.basePrice)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Max Guests</p>
                        <p className="text-lg font-semibold text-gray-900">{room.roomType.maxGuests}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Room Size</p>
                        <p className="text-lg font-semibold text-gray-900">{room.roomType.size ? `${room.roomType.size} sq ft` : 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Bed Type</p>
                        <p className="text-lg font-semibold text-gray-900">{room.roomType.bedType || 'N/A'}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex gap-8">
                    {[
                        { id: 'details', label: 'Room Details' },
                        { id: 'housekeeping', label: 'Housekeeping' },
                        { id: 'attributes', label: 'Room Attributes' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-[#0A332B] text-[#0A332B]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Details Tab */}
                {activeTab === 'details' && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold mb-4">Room Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="roomTypeId">Room Type *</Label>
                                <select
                                    id="roomTypeId"
                                    {...register('roomTypeId')}
                                    className="w-full border border-gray-300 rounded-md p-2.5 bg-white focus:ring-2 focus:ring-[#0A332B] focus:border-[#0A332B]"
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
                                <Input
                                    id="roomNumber"
                                    {...register('roomNumber')}
                                    placeholder="e.g. 101"
                                    className="border-gray-300 focus:ring-2 focus:ring-[#0A332B] focus:border-[#0A332B]"
                                />
                                {errors.roomNumber && <p className="text-sm text-red-500">{errors.roomNumber.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="floor">Floor</Label>
                                <Input
                                    id="floor"
                                    type="number"
                                    {...register('floor', { valueAsNumber: true })}
                                    placeholder="e.g. 1"
                                    className="border-gray-300 focus:ring-2 focus:ring-[#0A332B] focus:border-[#0A332B]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <select
                                    id="status"
                                    {...register('status')}
                                    className="w-full border border-gray-300 rounded-md p-2.5 bg-white focus:ring-2 focus:ring-[#0A332B] focus:border-[#0A332B]"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="maintenance">Maintenance</option>
                                </select>
                            </div>

                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    {...register('notes')}
                                    placeholder="Maintenance notes or other details..."
                                    rows={4}
                                    className="border-gray-300 focus:ring-2 focus:ring-[#0A332B] focus:border-[#0A332B]"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Housekeeping Tab */}
                {activeTab === 'housekeeping' && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold mb-4">Housekeeping Status</h2>

                        <div className="space-y-6">
                            <div>
                                <Label className="text-base">Current Status</Label>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
                                    {Object.entries(housekeepingStatusConfig).map(([key, config]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setHkStatus(key)}
                                            className={`p-4 rounded-lg border-2 text-center transition-all ${hkStatus === key
                                                ? 'border-[#0A332B] bg-[#0A332B]/5'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full mb-2 ${config.color}`}>
                                                {config.icon}
                                            </span>
                                            <p className="text-sm font-medium">{config.label}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-500">Last Cleaned</p>
                                    <p className="text-lg font-semibold">{formatDate(room.lastCleanedAt)}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-500">Last Inspected</p>
                                    <p className="text-lg font-semibold">{formatDate(room.lastInspectedAt)}</p>
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-sm text-blue-800">
                                    <strong>Quick Actions:</strong> Mark as cleaned, schedule inspection, or report maintenance issue.
                                </p>
                                <div className="flex gap-2 mt-3">
                                    <Button type="button" variant="outline" size="sm" onClick={() => setHkStatus('clean')}>
                                        Mark Clean
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setHkStatus('inspect')}>
                                        Request Inspection
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setHkStatus('out_of_service')}>
                                        Report Issue
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Attributes Tab */}
                {activeTab === 'attributes' && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold mb-4">Room Attributes</h2>
                        <p className="text-gray-600 mb-6">Select special features for this specific room. These can affect pricing and guest preferences.</p>

                        {Object.entries(groupedAttributes).map(([category, attributes]) => (
                            <div key={category} className="mb-6">
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                                    {category.replace('_', ' ')}
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {attributes.map((attr) => (
                                        <button
                                            key={attr.id}
                                            type="button"
                                            onClick={() => toggleAttribute(attr.id)}
                                            className={`p-4 rounded-lg border-2 text-left transition-all ${selectedAttributes.has(attr.id)
                                                ? 'border-[#0A332B] bg-[#0A332B]/5'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`w-5 h-5 rounded border flex items-center justify-center ${selectedAttributes.has(attr.id)
                                                    ? 'bg-[#0A332B] border-[#0A332B] text-white'
                                                    : 'border-gray-300'
                                                    }`}>
                                                    {selectedAttributes.has(attr.id) && '✓'}
                                                </span>
                                                <span className="font-medium text-sm">{attr.name}</span>
                                            </div>
                                            {attr.priceModifier && attr.priceModifier !== 0 && (
                                                <p className={`text-xs mt-1 ${attr.priceModifier > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {attr.priceModifier > 0 ? '+' : ''}{attr.priceModifier}% price
                                                </p>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {allAttributes.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <p>No room attributes configured yet.</p>
                                <p className="text-sm">Add attributes from the settings page.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-[#0A332B] hover:bg-[#15443B] text-white"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}
