'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    isBefore,
    isAfter,
    startOfWeek,
    endOfWeek,
    isToday,
    differenceInDays,
} from 'date-fns';
import { cn } from '@/lib/utils';

export interface AvailabilityDay {
    date: string;
    totalRooms: number;
    availableRooms: number;
    blockedRooms: number;
    bookedRooms: number;
    price: number;
    minStay: number;
    status: 'available' | 'limited' | 'sold-out' | 'blocked';
}

interface AvailabilityCalendarProps {
    roomTypeId: string;
    selectedCheckIn?: Date;
    selectedCheckOut?: Date;
    onDateSelect: (checkIn: Date, checkOut: Date) => void;
    minStay?: number;
    maxStay?: number;
    showPrices?: boolean;
    showAvailability?: boolean;
    className?: string;
}

const STATUS_COLORS = {
    available: 'bg-green-50 hover:bg-green-100 border-green-200',
    limited: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-300',
    'sold-out': 'bg-red-50 border-red-200 cursor-not-allowed opacity-60',
    blocked: 'bg-gray-100 border-gray-300 cursor-not-allowed',
};

const STATUS_TEXT_COLORS = {
    available: 'text-green-700',
    limited: 'text-yellow-700',
    'sold-out': 'text-red-600',
    blocked: 'text-gray-500',
};

export function AvailabilityCalendar({
    roomTypeId,
    selectedCheckIn,
    selectedCheckOut,
    onDateSelect,
    minStay = 1,
    maxStay = 30,
    showPrices = true,
    showAvailability = true,
    className,
}: AvailabilityCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [availability, setAvailability] = useState<Map<string, AvailabilityDay>>(new Map());
    const [loading, setLoading] = useState(false);
    const [warning, setWarning] = useState<string | null>(null);
    const [hoverDate, setHoverDate] = useState<Date | null>(null);
    const [selectingCheckout, setSelectingCheckout] = useState(false);
    const [tempCheckIn, setTempCheckIn] = useState<Date | null>(null);

    // Fetch availability data for current and next month
    const fetchAvailability = useCallback(async () => {
        setLoading(true);
        try {
            const start = startOfMonth(subMonths(currentMonth, 1));
            const end = endOfMonth(addMonths(currentMonth, 2));

            const response = await fetch(
                `/api/availability?roomTypeId=${roomTypeId}&start=${start.toISOString()}&end=${end.toISOString()}`
            );

            if (!response.ok) throw new Error('Failed to fetch availability');

            const data = await response.json() as {
                days: AvailabilityDay[];
                warning?: string;
            };
            const map = new Map<string, AvailabilityDay>(
                data.days.map((d: AvailabilityDay) => [d.date, d])
            );
            setAvailability(map);
            setWarning(data.warning || null);
        } catch (error) {
            console.error('Error fetching availability:', error);
            setWarning('Live availability check is currently unavailable.');
        } finally {
            setLoading(false);
        }
    }, [roomTypeId, currentMonth]);

    useEffect(() => {
        fetchAvailability();
    }, [fetchAvailability]);

    // Generate calendar days
    const getCalendarDays = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

        return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    };

    // Check if a date is selectable
    const isDateSelectable = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayData = availability.get(dateStr);

        // Can't select past dates
        if (isBefore(date, new Date()) && !isToday(date)) return false;

        // Can't select blocked or sold-out dates
        if (dayData && (dayData.status === 'blocked' || dayData.status === 'sold-out')) {
            return false;
        }

        return true;
    };

    // Handle date click
    const handleDateClick = (date: Date) => {
        if (!isDateSelectable(date)) return;

        if (!tempCheckIn || selectingCheckout) {
            // Start new selection
            setTempCheckIn(date);
            setSelectingCheckout(true);
        } else {
            // Complete selection
            if (isBefore(date, tempCheckIn)) {
                // If clicked date is before check-in, swap
                setTempCheckIn(date);
            } else {
                // Validate min/max stay
                const nights = differenceInDays(date, tempCheckIn);
                if (nights < minStay) {
                    alert(`Minimum stay is ${minStay} night(s)`);
                    return;
                }
                if (nights > maxStay) {
                    alert(`Maximum stay is ${maxStay} night(s)`);
                    return;
                }

                // Check all dates in range are available
                const allAvailable = checkRangeAvailable(tempCheckIn, date);
                if (!allAvailable) {
                    alert('Some dates in this range are not available');
                    return;
                }

                onDateSelect(tempCheckIn, date);
                setTempCheckIn(null);
                setSelectingCheckout(false);
            }
        }
    };

    // Check if all dates in range are available
    const checkRangeAvailable = (start: Date, end: Date) => {
        const days = eachDayOfInterval({ start, end: new Date(end.getTime() - 86400000) }); // Exclude checkout day
        return days.every(day => isDateSelectable(day));
    };

    // Check if date is in selected range
    const isInRange = (date: Date) => {
        const checkIn = tempCheckIn || selectedCheckIn;
        const checkOut = hoverDate && tempCheckIn ? hoverDate : selectedCheckOut;

        if (!checkIn || !checkOut) return false;
        return isAfter(date, checkIn) && isBefore(date, checkOut);
    };

    // Check if date is check-in or check-out
    const isCheckInDate = (date: Date) => {
        const checkIn = tempCheckIn || selectedCheckIn;
        return checkIn ? isSameDay(date, checkIn) : false;
    };

    const isCheckOutDate = (date: Date) => {
        return selectedCheckOut ? isSameDay(date, selectedCheckOut) : false;
    };

    // Format price for display
    const formatPrice = (priceInPaise: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(priceInPaise / 100);
    };

    const days = getCalendarDays();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className={cn('bg-white rounded-xl shadow-lg p-4', className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={loading}
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-semibold">
                    {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={loading}
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Loading indicator */}
            {loading && (
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
            )}

            {/* Calendar Grid */}
            {!loading && (
                <div className="grid grid-cols-7 gap-1">
                    {/* Week day headers */}
                    {weekDays.map(day => (
                        <div
                            key={day}
                            className="text-center text-xs font-medium text-gray-500 py-2"
                        >
                            {day}
                        </div>
                    ))}

                    {/* Calendar days */}
                    {days.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const dayData = availability.get(dateStr);
                        const isCurrentMonth = format(day, 'MM') === format(currentMonth, 'MM');
                        const isPast = isBefore(day, new Date()) && !isToday(day);
                        const selectable = isDateSelectable(day);
                        const inRange = isInRange(day);
                        const isCheckIn = isCheckInDate(day);
                        const isCheckOut = isCheckOutDate(day);

                        return (
                            <div
                                key={dateStr}
                                className={cn(
                                    'relative min-h-[70px] p-1 border rounded-lg transition-all',
                                    isCurrentMonth ? 'bg-white' : 'bg-gray-50',
                                    !isPast && selectable && dayData && STATUS_COLORS[dayData.status],
                                    isPast && 'opacity-40 cursor-not-allowed',
                                    inRange && 'bg-teal-100 border-teal-300',
                                    isCheckIn && 'bg-teal-600 text-white border-teal-700 rounded-l-lg',
                                    isCheckOut && 'bg-teal-600 text-white border-teal-700 rounded-r-lg',
                                    selectable && !isPast && 'cursor-pointer hover:scale-105',
                                    !selectable && !isPast && 'cursor-not-allowed'
                                )}
                                onClick={() => handleDateClick(day)}
                                onMouseEnter={() => setHoverDate(day)}
                                onMouseLeave={() => setHoverDate(null)}
                            >
                                {/* Date number */}
                                <span
                                    className={cn(
                                        'text-sm font-medium',
                                        isToday(day) && 'bg-teal-600 text-white rounded-full w-6 h-6 flex items-center justify-center',
                                        (isCheckIn || isCheckOut) && 'text-white',
                                        !isToday(day) && dayData && STATUS_TEXT_COLORS[dayData.status]
                                    )}
                                >
                                    {format(day, 'd')}
                                </span>

                                {/* Price and availability */}
                                {showPrices && dayData && isCurrentMonth && !isPast && (
                                    <div className="mt-1">
                                        <span
                                            className={cn(
                                                'text-[10px] font-medium',
                                                (isCheckIn || isCheckOut) && 'text-white/90'
                                            )}
                                        >
                                            {formatPrice(dayData.price)}
                                        </span>
                                    </div>
                                )}

                                {/* Availability indicator */}
                                {showAvailability && dayData && isCurrentMonth && !isPast && (
                                    <div className="mt-0.5">
                                        <span
                                            className={cn(
                                                'text-[9px]',
                                                (isCheckIn || isCheckOut) && 'text-white/80'
                                            )}
                                        >
                                            {/* Room count hidden as per user request */}
                                            {/* {dayData.availableRooms}/{dayData.totalRooms} left */}
                                            {dayData.status === 'sold-out' ? 'Sold Out' : (dayData.status === 'blocked' ? 'Blocked' : 'Available')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {warning && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    {warning}
                </div>
            )}

            {/* Legend */}
            <div className="mt-4 pt-4 border-t">
                <div className="flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-green-100 border border-green-200" />
                        <span>Available</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300" />
                        <span>Limited</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-red-100 border border-red-200" />
                        <span>Sold Out</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-gray-100 border border-gray-300" />
                        <span>Blocked</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-teal-600" />
                        <span>Selected</span>
                    </div>
                </div>
            </div>

            {/* Selection info */}
            {(tempCheckIn || selectedCheckIn) && (
                <div className="mt-3 p-3 bg-teal-50 rounded-lg text-sm">
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="font-medium">Check-in: </span>
                            {format(tempCheckIn || selectedCheckIn!, 'EEE, dd MMM yyyy')}
                        </div>
                        {(selectedCheckOut || selectingCheckout) && (
                            <div>
                                <span className="font-medium">Check-out: </span>
                                {selectedCheckOut
                                    ? format(selectedCheckOut, 'EEE, dd MMM yyyy')
                                    : 'Select date'}
                            </div>
                        )}
                    </div>
                    {selectedCheckIn && selectedCheckOut && (
                        <div className="mt-1 text-teal-700 font-medium">
                            {differenceInDays(selectedCheckOut, selectedCheckIn)} night(s)
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
