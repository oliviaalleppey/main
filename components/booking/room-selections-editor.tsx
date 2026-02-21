'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Minus, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/services/payment';
import {
    removeSessionRoomSelection,
    updateSessionRoomSelectionQuantity,
} from '@/app/book/actions';

type RoomSelectionEditorItem = {
    roomTypeId: string;
    roomName: string;
    quantity: number;
    quotedPricePerNight: number;
    nights: number;
};

type RoomSelectionsEditorProps = {
    items: RoomSelectionEditorItem[];
    adults: number;
    addMoreRoomsHref: string;
};

export function RoomSelectionsEditor({
    items,
    adults,
    addMoreRoomsHref,
}: RoomSelectionsEditorProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<string | null>(null);
    const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);

    const totalRooms = useMemo(() => (
        items.reduce((sum, item) => sum + item.quantity, 0)
    ), [items]);

    const commitQuantity = (roomTypeId: string, nextQuantity: number) => {
        setMessage(null);
        setMessageType(null);

        startTransition(async () => {
            const response = await updateSessionRoomSelectionQuantity(roomTypeId, nextQuantity);
            if (!response.success) {
                setMessageType('error');
                setMessage(response.message || 'Could not update room quantity.');
                return;
            }

            setMessageType('success');
            setMessage('Room selection updated.');
            router.refresh();
        });
    };

    const removeRoomType = (roomTypeId: string) => {
        setMessage(null);
        setMessageType(null);

        startTransition(async () => {
            const response = await removeSessionRoomSelection(roomTypeId);
            if (!response.success) {
                setMessageType('error');
                setMessage(response.message || 'Could not remove room type.');
                return;
            }

            setMessageType('success');
            setMessage('Room type removed.');
            router.refresh();
        });
    };

    return (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-2.5 md:p-3">
            <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">Selected Room Types</p>
                <Link
                    href={addMoreRoomsHref}
                    className="text-[11px] font-semibold uppercase tracking-wider text-[#1C1C1C] hover:text-[#E95D20] transition-colors"
                >
                    Add More
                </Link>
            </div>

            <div className="mt-2.5 md:mt-3 space-y-2">
                {items.map((item) => {
                    const quantity = item.quantity;
                    const lineTotal = item.quotedPricePerNight * item.nights * quantity;
                    const canIncrease = totalRooms < adults;

                    return (
                        <div key={item.roomTypeId} className="rounded-lg border border-gray-200 bg-white p-2.5 md:p-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-xs md:text-sm font-semibold text-gray-900 truncate">{item.roomName}</p>
                                    <p className="text-[11px] text-gray-500">
                                        {formatCurrency(item.quotedPricePerNight)} x {item.nights} night{item.nights > 1 ? 's' : ''}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => commitQuantity(item.roomTypeId, Math.max(1, quantity - 1))}
                                        className="h-6 w-6 md:h-7 md:w-7 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                                        disabled={isPending || quantity <= 1}
                                        aria-label={`Decrease ${item.roomName} rooms`}
                                    >
                                        <Minus className="w-3.5 h-3.5 mx-auto" />
                                    </button>
                                    <span className="w-8 text-center text-xs md:text-sm font-semibold text-gray-900">{quantity}</span>
                                    <button
                                        type="button"
                                        onClick={() => commitQuantity(item.roomTypeId, Math.min(8, quantity + 1))}
                                        className="h-6 w-6 md:h-7 md:w-7 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                                        disabled={isPending || quantity >= 8 || !canIncrease}
                                        aria-label={`Increase ${item.roomName} rooms`}
                                    >
                                        <Plus className="w-3.5 h-3.5 mx-auto" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeRoomType(item.roomTypeId)}
                                        className="h-6 w-6 md:h-7 md:w-7 rounded-full border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40"
                                        disabled={isPending || items.length <= 1}
                                        aria-label={`Remove ${item.roomName}`}
                                    >
                                        <Trash2 className="w-3.5 h-3.5 mx-auto" />
                                    </button>
                                </div>
                            </div>
                            <p className="mt-1.5 md:mt-2 text-right text-xs md:text-sm font-semibold text-gray-900">{formatCurrency(lineTotal)}</p>
                        </div>
                    );
                })}
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                <span>{totalRooms} room{totalRooms > 1 ? 's' : ''} selected</span>
                <span>{adults} adult{adults > 1 ? 's' : ''} available</span>
            </div>

            {message && (
                <div className={`mt-2 rounded-lg border px-2.5 py-2 text-xs ${messageType === 'error'
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    }`}>
                    <div className="inline-flex items-center gap-1.5">
                        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        <span>{message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
