'use client';

import Image from 'next/image';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Minus, Plus, Sparkles, Tag, Check, X } from 'lucide-react';
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
    const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(null);

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

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 items-start">
                {options.map((option) => {
                    const quantity = quantities[option.id] || 0;
                    const typeLabel = option.type === 'per_person' ? 'per person' : 'per unit';
                    const rowTotal = option.price * quantity;

                    return (
                        <div
                            key={option.id}
                            className={`rounded-2xl border transition-all overflow-hidden flex flex-col ${quantity > 0
                                ? 'border-[var(--brand-primary)] ring-1 ring-[var(--brand-primary)] shadow-sm'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                        >
                            {/* Image Section */}
                            <div
                                className={`relative h-28 sm:h-40 w-full bg-gray-100 shrink-0 ${option.imageUrl ? 'cursor-zoom-in' : ''}`}
                                onClick={() => option.imageUrl && setLightbox({ url: option.imageUrl, name: option.name })}
                            >
                                {option.imageUrl ? (
                                    <Image src={option.imageUrl} alt={option.name} fill className="object-cover" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-300 bg-gray-50">
                                        <Sparkles className="w-8 h-8 opacity-40" />
                                    </div>
                                )}
                                {quantity > 0 && (
                                    <div className="absolute top-3 right-3 bg-[var(--brand-primary)] text-white rounded-full p-1 shadow-sm">
                                        <Check className="w-4 h-4" />
                                    </div>
                                )}
                            </div>

                            {/* Content Section */}
                            <div className="p-2 sm:p-4 flex flex-col flex-1">
                                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2">{option.name}</h3>
                                {option.description && (
                                    <p className="hidden sm:block text-xs text-gray-500 mt-1 line-clamp-2">{option.description}</p>
                                )}
                                <div className="mt-2 sm:mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div className="text-left">
                                        <div className="text-[13px] font-bold text-[var(--brand-primary)]">{formatCurrency(option.price)}</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">{typeLabel}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setQuantity(option.id, quantity - 1)}
                                            className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 flex items-center justify-center transition-colors"
                                            disabled={isPending || quantity === 0}
                                            aria-label={`Decrease ${option.name}`}
                                        >
                                            <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        </button>
                                        <span className="w-4 text-center text-sm font-bold text-gray-900 tabular-nums">{quantity}</span>
                                        <button
                                            type="button"
                                            onClick={() => setQuantity(option.id, quantity + 1)}
                                            className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 flex items-center justify-center transition-colors"
                                            disabled={isPending || quantity >= 10}
                                            aria-label={`Increase ${option.name}`}
                                        >
                                            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
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

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
                    onClick={() => setLightbox(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/40 rounded-full p-2"
                        onClick={() => setLightbox(null)}
                        aria-label="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="relative max-w-3xl max-h-[85vh] w-full h-full" onClick={(e) => e.stopPropagation()}>
                        <Image
                            src={lightbox.url}
                            alt={lightbox.name}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, 80vw"
                        />
                    </div>
                    <p className="absolute bottom-6 left-0 right-0 text-center text-white/70 text-sm">{lightbox.name}</p>
                </div>
            )}

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
