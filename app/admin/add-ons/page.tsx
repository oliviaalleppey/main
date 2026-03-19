'use client';

import { useState, useTransition, useEffect } from 'react';
import {
    Sparkles,
    Plus,
    Pencil,
    Trash2,
    Check,
    X,
    ChevronDown,
    Building2,
    Loader2
} from 'lucide-react';
import { formatCurrency } from '@/lib/services/payment';
import { ImageUpload } from '@/components/ui/image-upload';

type AddOnWithRooms = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    type: 'per_person' | 'per_unit' | null;
    icon: string | null;
    imageUrl: string | null;
    taxRate: number | null;
    isActive: boolean;
    sortOrder: number;
    roomTypes: { id: string; name: string }[];
};

type RoomType = {
    id: string;
    name: string;
};

export default function AddOnsPage() {
    const [addOns, setAddOns] = useState<AddOnWithRooms[]>([]);
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        type: 'per_unit' as 'per_unit' | 'per_person',
        icon: '',
        imageUrl: '',
        taxRate: '18',
        isActive: true,
        roomTypeIds: [] as string[],
    });

    // Load add-ons and room types on mount
    useEffect(() => {
        loadAddOns();
        loadRoomTypes();
    }, []);

    async function loadRoomTypes() {
        try {
            const response = await fetch('/api/admin/rooms/types');
            if (response.ok) {
                const data = await response.json();
                setRoomTypes(data.map((rt: { id: string; name: string }) => ({
                    id: rt.id,
                    name: rt.name
                })));
            }
        } catch (error) {
            console.error('Failed to load room types:', error);
        }
    }

    async function loadAddOns() {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/add-ons');
            if (response.ok) {
                const data = await response.json();
                setAddOns(data);
            } else {
                console.error('Failed to fetch add-ons:', response.statusText);
                setAddOns([]);
            }
        } catch (error) {
            console.error('Failed to load add-ons:', error);
            setAddOns([]);
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        startTransition(async () => {
            try {
                const response = await fetch('/api/admin/add-ons', {
                    method: editingId ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: editingId,
                        name: formData.name,
                        description: formData.description || null,
                        price: Math.round(parseFloat(formData.price) * 100), // Convert to paise
                        type: formData.type,
                        icon: formData.icon || null,
                        imageUrl: formData.imageUrl || null,
                        taxRate: Math.round(parseFloat(formData.taxRate || '18')), // GST percentage
                        isActive: formData.isActive,
                        roomTypeIds: formData.roomTypeIds,
                    }),
                });

                if (response.ok) {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({
                        name: '',
                        description: '',
                        price: '',
                        type: 'per_unit',
                        icon: '',
                        imageUrl: '',
                        taxRate: '18',
                        isActive: true,
                        roomTypeIds: [],
                    });
                    loadAddOns();
                }
            } catch (error) {
                console.error('Failed to save add-on:', error);
            }
        });
    };

    const handleEdit = (addOn: AddOnWithRooms) => {
        setEditingId(addOn.id);
        setFormData({
            name: addOn.name,
            description: addOn.description || '',
            price: (addOn.price / 100).toString(),
            type: addOn.type as 'per_unit' | 'per_person',
            icon: addOn.icon || '',
            imageUrl: addOn.imageUrl || '',
            taxRate: addOn.taxRate ? addOn.taxRate.toString() : '18',
            isActive: addOn.isActive,
            roomTypeIds: addOn.roomTypes.map(r => r.id),
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this add-on?')) return;

        startTransition(async () => {
            try {
                const response = await fetch(`/api/admin/add-ons?id=${id}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    loadAddOns();
                }
            } catch (error) {
                console.error('Failed to delete add-on:', error);
            }
        });
    };

    const toggleRoomType = (roomTypeId: string) => {
        setFormData(prev => ({
            ...prev,
            roomTypeIds: prev.roomTypeIds.includes(roomTypeId)
                ? prev.roomTypeIds.filter(id => id !== roomTypeId)
                : [...prev.roomTypeIds, roomTypeId]
        }));
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Add-ons Management</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Create and manage enhancements available during booking
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({
                            name: '',
                            description: '',
                            price: '',
                            type: 'per_unit',
                            icon: '',
                            imageUrl: '',
                            taxRate: '18',
                            isActive: true,
                            roomTypeIds: [],
                        });
                        setShowForm(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#0A332B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#15443B]"
                >
                    <Plus className="w-4 h-4" />
                    Add New Add-on
                </button>
            </div>

            {showForm && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">
                        {editingId ? 'Edit Add-on' : 'Create New Add-on'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    placeholder="e.g., Airport Transfer"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Price (₹)
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    placeholder="e.g., 1500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                rows={2}
                                placeholder="Brief description of the add-on"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Type
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as 'per_unit' | 'per_person' })}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                >
                                    <option value="per_unit">Per Unit (per room)</option>
                                    <option value="per_person">Per Person</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Icon (Lucide name)
                                </label>
                                <input
                                    type="text"
                                    value={formData.icon}
                                    onChange={e => setFormData({ ...formData, icon: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    placeholder="e.g., Car, Coffee, Dumbbell"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Image URL
                            </label>
                            <ImageUpload
                                value={formData.imageUrl ? [formData.imageUrl] : []}
                                onChange={(urls) => setFormData({ ...formData, imageUrl: urls.length > 0 ? urls[0] : '' })}
                                onRemove={() => setFormData({ ...formData, imageUrl: '' })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tax Rate (%)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={formData.taxRate}
                                onChange={e => setFormData({ ...formData, taxRate: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                placeholder="e.g., 18"
                            />
                            <p className="text-xs text-gray-500 mt-1">GST percentage to apply on this add-on</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Apply to Room Types (leave empty for all rooms)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {roomTypes.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic">
                                        No room types available
                                    </p>
                                ) : (
                                    roomTypes.map(roomType => (
                                        <button
                                            key={roomType.id}
                                            type="button"
                                            onClick={() => toggleRoomType(roomType.id)}
                                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${formData.roomTypeIds.includes(roomType.id)
                                                ? 'bg-[#0A332B] text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {formData.roomTypeIds.includes(roomType.id) && (
                                                <Check className="w-3 h-3" />
                                            )}
                                            {roomType.name}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                className="rounded border-gray-300"
                            />
                            <label htmlFor="isActive" className="text-sm text-gray-700">
                                Active (visible on checkout)
                            </label>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={isPending}
                                className="inline-flex items-center gap-2 rounded-lg bg-[#0A332B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#15443B] disabled:opacity-60"
                            >
                                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                {editingId ? 'Update Add-on' : 'Create Add-on'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingId(null);
                                }}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Price
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Tax %
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Room Types
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                    <p className="mt-2 text-sm">Loading add-ons...</p>
                                </td>
                            </tr>
                        ) : addOns.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                    <Sparkles className="w-8 h-8 mx-auto text-gray-300" />
                                    <p className="mt-2 text-sm">No add-ons yet. Create your first add-on!</p>
                                </td>
                            </tr>
                        ) : (
                            addOns.map(addOn => (
                                <tr key={addOn.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-medium text-gray-900">{addOn.name}</p>
                                            {addOn.description && (
                                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                                    {addOn.description}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="font-medium text-gray-900">
                                            {formatCurrency(addOn.price)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs text-gray-500">
                                            {addOn.taxRate ?? 18}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs text-gray-500">
                                            {addOn.type === 'per_person' ? 'Per Person' : 'Per Unit'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {addOn.roomTypes.length === 0 ? (
                                            <span className="text-xs text-gray-400">All Rooms</span>
                                        ) : (
                                            <div className="flex flex-wrap gap-1">
                                                {addOn.roomTypes.slice(0, 2).map(room => (
                                                    <span
                                                        key={room.id}
                                                        className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs"
                                                    >
                                                        {room.name}
                                                    </span>
                                                ))}
                                                {addOn.roomTypes.length > 2 && (
                                                    <span className="text-xs text-gray-500">
                                                        +{addOn.roomTypes.length - 2} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${addOn.isActive
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {addOn.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(addOn)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(addOn.id)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
