'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Minus, Plus, Sparkles, Tag } from 'lucide-react';
import { updateSessionAddOns } from '@/app/book/actions';
import { formatCurrency } from '@/lib/services/payment';

type AddOnOption = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    type: 'per_person' | 'per_unit' | null;
};

type SelectedAddOn = {
    addOnId: string;
    quantity: number;
};

interface AddOnsSelectorProps {
    options: AddOnOption[];
    initialSelected: SelectedAddOn[];
}

export function AddOnsSelector({ options, initialSelected }: AddOnsSelectorProps) {
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
        setMessage(null);
        setQuantities((prev) => ({
            ...prev,
            [addOnId]: Math.max(0, Math.min(10, next)),
        }));
    };

    const handleSave = () => {
        startTransition(async () => {
            const payload = selectedItems.map((item) => ({
                addOnId: item.id,
                quantity: item.quantity,
            }));

            const response = await updateSessionAddOns(payload);
            if (!response.success) {
                setMessage(response.message || 'Could not update add-ons');
                return;
            }

            setMessage('Add-ons updated');
            router.refresh();
        });
    };

    return (
        <div className="space-y-2 md:space-y-3">
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

            <div className="space-y-1.5 md:space-y-2">
                {options.map((option) => {
                    const quantity = quantities[option.id] || 0;
                    const typeLabel = option.type === 'per_person' ? 'per person' : 'per unit';
                    const rowTotal = option.price * quantity;

                    return (
                        <div
                            key={option.id}
                            className={`rounded-lg border p-2 md:p-3 transition-colors ${quantity > 0
                                ? 'border-[#0A332B]/30 bg-[#0A332B]/5'
                                : 'border-gray-200 bg-gray-50'
                                }`}
                        >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3">
                                <div className="space-y-1 min-w-0">
                                    <p className="text-xs md:text-sm font-semibold text-gray-900">{option.name}</p>
                                    {option.description && (
                                        <p className="text-xs text-gray-600">{option.description}</p>
                                    )}
                                    <p className="text-xs text-gray-500 inline-flex items-center gap-1">
                                        <Tag className="w-3 h-3" />
                                        {formatCurrency(option.price)} {typeLabel}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-2 md:gap-3 md:min-w-[180px]">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setQuantity(option.id, quantity - 1)}
                                            className="h-7 w-7 md:h-8 md:w-8 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                                            disabled={isPending || quantity === 0}
                                            aria-label={`Decrease ${option.name}`}
                                        >
                                            <Minus className="w-3.5 h-3.5 mx-auto" />
                                        </button>
                                        <span className="w-8 text-center text-sm font-semibold text-gray-900">{quantity}</span>
                                        <button
                                            type="button"
                                            onClick={() => setQuantity(option.id, quantity + 1)}
                                            className="h-7 w-7 md:h-8 md:w-8 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                                            disabled={isPending || quantity >= 10}
                                            aria-label={`Increase ${option.name}`}
                                        >
                                            <Plus className="w-3.5 h-3.5 mx-auto" />
                                        </button>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] uppercase tracking-wider text-gray-500">Line Total</p>
                                        <p className="text-xs md:text-sm font-semibold text-gray-900">{quantity > 0 ? formatCurrency(rowTotal) : '-'}</p>
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
                        <p className={`text-xs font-medium ${message === 'Add-ons updated' ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {message}
                        </p>
                    ) : (
                        <p className="text-xs text-gray-500 italic">
                            {addOnsTotal > 0
                                ? 'Review your selections and save to update your total.'
                                : 'No enhancements selected. You can skip this and continue to payment.'}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2 sm:self-end">
                    {Object.entries(quantities).some(([id, q]) => {
                        const initial = initialSelected.find(s => s.addOnId === id)?.quantity || 0;
                        return q !== initial;
                    }) && (
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isPending}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#E95D20] px-4 py-2 text-[11px] md:text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#D54D15] disabled:opacity-60 transition-colors shadow-sm"
                            >
                                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                Save Enhancements
                            </button>
                        )}
                    <button
                        type="button"
                        onClick={() => {
                            const paymentSection = document.getElementById('payment-section');
                            if (paymentSection) {
                                paymentSection.scrollIntoView({ behavior: 'smooth' });
                            }
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-white border border-gray-300 px-4 py-2 text-[11px] md:text-xs font-semibold uppercase tracking-wider text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Continue to Payment
                    </button>
                </div>
            </div>
        </div>
    );
}
