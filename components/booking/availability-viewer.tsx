'use client';

import { useState } from 'react';
import { AvailabilityCalendar } from './availability-calendar';
import { formatCurrency } from '@/lib/services/payment';
import { differenceInDays } from 'date-fns';

interface RoomType {
    id: string;
    name: string;
    slug: string;
    shortDescription: string | null;
    basePrice: number;
    maxGuests: number;
    size: number | null;
    bedType: string | null;
}

interface AvailabilityViewerProps {
    roomType: RoomType;
}

export function AvailabilityViewer({ roomType }: AvailabilityViewerProps) {
    const [selectedCheckIn, setSelectedCheckIn] = useState<Date | undefined>();
    const [selectedCheckOut, setSelectedCheckOut] = useState<Date | undefined>();

    const handleDateSelect = (checkIn: Date, checkOut: Date) => {
        setSelectedCheckIn(checkIn);
        setSelectedCheckOut(checkOut);
    };

    const nights = selectedCheckIn && selectedCheckOut
        ? differenceInDays(selectedCheckOut, selectedCheckIn)
        : 0;

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Room Type Header */}
            <div className="bg-gradient-to-r from-teal-800 to-teal-600 text-white p-6">
                <h2 className="text-2xl font-semibold">{roomType.name}</h2>
                {roomType.shortDescription && (
                    <p className="text-teal-100 mt-1">{roomType.shortDescription}</p>
                )}
                <div className="flex gap-6 mt-4 text-sm">
                    <div>
                        <span className="text-teal-200">Base Price:</span>{' '}
                        <span className="font-semibold">{formatCurrency(roomType.basePrice)}/night</span>
                    </div>
                    <div>
                        <span className="text-teal-200">Max Guests:</span>{' '}
                        <span className="font-semibold">{roomType.maxGuests}</span>
                    </div>
                    {roomType.size && (
                        <div>
                            <span className="text-teal-200">Size:</span>{' '}
                            <span className="font-semibold">{roomType.size} sq ft</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Calendar */}
            <div className="p-6">
                <AvailabilityCalendar
                    roomTypeId={roomType.id}
                    selectedCheckIn={selectedCheckIn}
                    selectedCheckOut={selectedCheckOut}
                    onDateSelect={handleDateSelect}
                    showPrices={true}
                    showAvailability={true}
                />
            </div>

            {/* Selection Summary */}
            {selectedCheckIn && selectedCheckOut && (
                <div className="border-t p-6 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-lg">Selected Stay</h3>
                            <p className="text-gray-600">
                                {nights} night{nights !== 1 ? 's' : ''} from{' '}
                                {formatCurrency(roomType.basePrice)}/night
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Estimated Total</p>
                            <p className="text-2xl font-bold text-teal-700">
                                {formatCurrency(roomType.basePrice * nights)}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
