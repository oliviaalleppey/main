'use client';

import { Button } from '@/components/ui/button';
import { useState, useTransition } from 'react';
import { startBookingSession } from '@/app/book/actions';
import { Loader2 } from 'lucide-react';

interface BookingButtonProps {
    roomId: string;
    searchParams: {
        checkIn: string;
        checkOut: string;
        adults: number;
        children: number;
    };
    quoteSnapshot?: {
        pricePerNight: number;
        totalPrice: number;
        taxesAndFees: number;
        externalRatePlanId?: string;
    };
    maxRooms?: number;
    defaultRoomCount?: number;
    disabled?: boolean;
    disabledLabel?: string;
}

export function BookingButton({
    roomId,
    searchParams,
    quoteSnapshot,
    maxRooms = 1,
    defaultRoomCount = 1,
    disabled = false,
    disabledLabel = 'Unavailable',
}: BookingButtonProps) {
    const [isPending, startTransition] = useTransition();
    const effectiveMaxRooms = Math.max(1, Math.floor(maxRooms));
    const [roomCount, setRoomCount] = useState(
        Math.min(effectiveMaxRooms, Math.max(1, Math.floor(defaultRoomCount)))
    );

    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleSelect = () => {
        setErrorMsg(null);
        startTransition(async () => {
            try {
                const res = await startBookingSession(roomId, searchParams, quoteSnapshot, roomCount);
                if (res?.error) {
                    setErrorMsg(res.error);
                }
            } catch (error) {
                // Next.js redirect() works by throwing — let it propagate
                if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) throw error;
                if (error && typeof error === 'object' && 'digest' in error) throw error;
                setErrorMsg(error instanceof Error ? error.message : 'An error occurred while selecting the room.');
            }
        });
    };

    return (
        <div className="space-y-1.5 md:space-y-2 relative">
            {!disabled && effectiveMaxRooms > 1 && (
                <div className="rounded-xl border border-gray-200 bg-white px-2 md:px-3 py-1.5 md:py-2 shadow-sm mb-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] md:text-[11px] text-[#8A8F82] font-semibold">Quantity</span>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setRoomCount((prev) => Math.max(1, prev - 1))}
                                className="h-7 w-7 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-gray-200 transition-all"
                            >
                                -
                            </button>
                            <span className="min-w-6 text-center text-[13px] font-bold text-[#1C2822]">
                                {roomCount}
                            </span>
                            <button
                                type="button"
                                onClick={() => setRoomCount((prev) => Math.min(effectiveMaxRooms, prev + 1))}
                                className="h-7 w-7 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-gray-200 transition-all"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Button
                onClick={handleSelect}
                disabled={isPending || disabled}
                className="w-full bg-[#1C2822] text-white h-10 md:h-12 rounded-xl text-[13px] md:text-[14px] font-bold transition-all shadow-md active:scale-[0.98] hover:bg-[#2A3B32]"
            >
                {isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : (disabled
                        ? disabledLabel
                        : roomCount > 1
                            ? `Select ${roomCount} Rooms`
                            : 'Select Room')}
            </Button>

            {errorMsg && (
                <div className="text-xs text-red-500 text-center font-medium mt-2 bg-red-50 border border-red-100 p-2 rounded-md">
                    {errorMsg}
                </div>
            )}
        </div>
    );
}
