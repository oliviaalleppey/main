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

    const handleSelect = () => {
        startTransition(async () => {
            await startBookingSession(roomId, searchParams, quoteSnapshot, roomCount);
        });
    };

    return (
        <div className="space-y-1.5 md:space-y-2">
            {!disabled && effectiveMaxRooms > 1 && (
                <div className="rounded-lg border border-gray-200 bg-white px-2.5 md:px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-1">Rooms</p>
                    <div className="flex items-center justify-between gap-2">
                        <div className="inline-flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setRoomCount((prev) => Math.max(1, prev - 1))}
                                className="h-6 w-6 md:h-7 md:w-7 rounded-full border border-gray-300 text-xs md:text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                -
                            </button>
                            <span className="min-w-14 md:min-w-16 text-center text-xs md:text-sm font-semibold text-gray-900">
                                {roomCount} room{roomCount > 1 ? 's' : ''}
                            </span>
                            <button
                                type="button"
                                onClick={() => setRoomCount((prev) => Math.min(effectiveMaxRooms, prev + 1))}
                                className="h-6 w-6 md:h-7 md:w-7 rounded-full border border-gray-300 text-xs md:text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                +
                            </button>
                        </div>
                        <span className="text-[10px] text-gray-500">
                            up to {effectiveMaxRooms}
                        </span>
                    </div>
                </div>
            )}

            <Button
                onClick={handleSelect}
                disabled={isPending || disabled}
                className="w-full bg-[#1C1C1C] text-white px-4 md:px-8 py-3.5 md:py-6 rounded-md md:rounded-none text-sm md:text-base hover:bg-[#E95D20] transition-colors shadow-md md:shadow-lg min-w-0 md:min-w-[160px]"
            >
                {isPending
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : (disabled
                        ? disabledLabel
                        : roomCount > 1
                            ? `Select ${roomCount} Rooms`
                            : 'Select Room')}
            </Button>
        </div>
    );
}
