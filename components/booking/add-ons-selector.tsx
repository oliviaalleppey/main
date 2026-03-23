'use client';

import Image from 'next/image';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Minus, Plus, Sparkles, Tag, Check } from 'lucide-react';
import { updateSessionAddOns } from '@/app/book/actions';
import { formatCurrency } from '@/lib/services/payment';

type AddOnOption = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    type: 'per_person' | 'per_unit' | null;
    imageUrl?: string | null;
};

type SelectedAddOn = {
    addOnId: string;
    quantity: number;
};

interface AddOnsSelectorProps {
    options: AddOnOption[];
    initialSelected: SelectedAddOn[];
    onContinue?: () => void;
}

export function AddOnsSelector({ options, initialSelected, onContinue }: AddOnsSelectorProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<string | null>(null);
    const [quantities, setQuantities] = useState<Record<string, number>>(() => {
        const selectedMap = new Map(initialSelected.map((entry) => [entry.addOnId, entry.quantity]));
        return options.reduce((acc, option) => {
            acc[option.id] = Math.max(0, selectedMap.get(option.id) || 0);
            return acc;
        }, {} as Record<string, number>);
    });

    const selectedItems = useMemo(() => {
        return options
            .map((option) => ({
                ...option,
                quantity: quantities[option.id] || 0,
            }))
            .filter((option) => option.quantity > 0);
    }, [options, quantities]);

    const addOnsTotal = useMemo(() => {
        return selectedItems.reduce((sum, option) => sum + (option.price * option.quantity), 0);
    }, [selectedItems]);

    const setQuantity = (addOnId: string, next: number) => {
        const nextValue = Math.max(0, Math.min(10, next));
        setMessage(null);
        
        setQuantities((prev) => ({
            ...prev,
            [addOnId]: nextValue,
        }));

        startTransition(async () => {
            const payload = options
                .map((option) => ({
                    addOnId: option.id,
                    quantity: option.id === addOnId ? nextValue : (quantities[option.id] || 0),
                }))
                .filter((item) => item.quantity > 0);

            const response = await updateSessionAddOns(payload);
            if (!response.success) {
                setMessage(response.message || 'Could not update add-ons');
                return;
            }

            router.refresh();
        });
    };

    return (
        <div className="space-y-2 md:space-y-3 pb-24 md:pb-0 relative">
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-2 md:p-3">
                <div className="flex items-center justify-between gap-3 md:gap-4">
                    <div>
                        <p className="text-xs md:text-sm font-semibold text-amber-900 inline-flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-700" />
                            Enhance Your Stay
                        </p>
                        <p className="text-xs text-amber-800/80 mt-1">
                            Optional experiences curated for your booking.
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[11px] uppercase tracking-wider text-amber-700">Add-ons Total</p>
                        <p className="text-lg md:text-xl font-semibold text-amber-900">{formatCurrency(addOnsTotal)}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {options.map((option) => {
                    const quantity = quantities[option.id] || 0;
                    const typeLabel = option.type === 'per_person' ? 'per person' : 'per unit';
                    const rowTotal = option.price * quantity;

                    return (
                        <div
                            key={option.id}
                            className={`rounded-2xl border transition-all overflow-hidden flex flex-col ${quantity > 0
                                ? 'border-[#0A332B] ring-1 ring-[#0A332B] shadow-sm'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                        >
                            {/* Image Section */}
                            <div className="relative h-40 w-full bg-gray-100 shrink-0">
                                {option.imageUrl ? (
                                    <Image src={option.imageUrl} alt={option.name} fill className="object-cover" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-300 bg-gray-50">
                                        <Sparkles className="w-8 h-8 opacity-40" />
                                    </div>
                                )}
                                {quantity > 0 && (
                                    <div className="absolute top-3 right-3 bg-[#0A332B] text-white rounded-full p-1 shadow-sm">
                                        <Check className="w-4 h-4" />
                                    </div>
                                )}
                            </div>

                            {/* Content Section */}
                            <div className="p-4 flex flex-col flex-1">
                                <h3 className="text-sm font-semibold text-gray-900">{option.name}</h3>
                                {option.description && (
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{option.description}</p>
                                )}
                                <div className="mt-3 text-[11px] text-gray-600 font-medium inline-flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md self-start border border-gray-100">
                                    <Tag className="w-3 h-3 text-gray-400" />
                                    <span>{formatCurrency(option.price)} <span className="text-gray-400 font-normal">/ {typeLabel}</span></span>
                                </div>
                                
                                <div className="mt-auto pt-5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setQuantity(option.id, quantity - 1)}
                                            className="h-8 w-8 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 flex items-center justify-center transition-colors"
                                            disabled={isPending || quantity === 0}
                                            aria-label={`Decrease ${option.name}`}
                                        >
                                            <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="w-4 text-center text-sm font-bold text-gray-900 tabular-nums">{quantity}</span>
                                        <button
                                            type="button"
                                            onClick={() => setQuantity(option.id, quantity + 1)}
                                            className="h-8 w-8 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 flex items-center justify-center transition-colors"
                                            disabled={isPending || quantity >= 10}
                                            aria-label={`Increase ${option.name}`}
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-2 md:p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-3">
                <div className="flex-1">
                    {message ? (
                        <p className={`text-xs font-medium text-amber-700`}>
                            {message}
                        </p>
                    ) : (
                        <p className="text-xs text-gray-500 italic flex items-center gap-1.5">
                            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            {isPending ? 'Saving...' : addOnsTotal > 0
                                ? 'Your enhancements are saved automatically.'
                                : 'No enhancements selected. You can skip this and continue to guest details.'}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2 sm:self-end hidden md:flex">
                    <button
                        type="button"
                        onClick={() => {
                            if (onContinue) {
                                onContinue();
                            }
                        }}
                        disabled={isPending}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1C2822] text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-[#2A3B32] transition-colors disabled:opacity-70 shadow-sm"
                    >
                        {isPending ? 'Saving...' : (addOnsTotal > 0 ? 'Continue with Add-ons' : 'Skip & Continue')}
                    </button>
                </div>
            </div>

            {/* Mobile Floating Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:hidden z-50 animate-in slide-in-from-bottom-full duration-300">
                <button
                    type="button"
                    onClick={() => {
                        if (onContinue) onContinue();
                    }}
                    disabled={isPending}
                    className="w-full bg-[#1C2822] text-white h-12 rounded-xl text-[14px] font-bold transition-all shadow-md active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                >
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isPending ? 'Saving...' : (addOnsTotal > 0 ? 'Continue with Add-ons' : 'Skip & Continue')}
                </button>
            </div>
        </div>
    );
}
