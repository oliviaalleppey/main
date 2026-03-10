'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect, useTransition } from 'react';
import { Search, X } from 'lucide-react';

interface RoomType {
    id: string;
    name: string;
}

interface BookingFiltersProps {
    roomTypes: RoomType[];
}

const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'payment_success', label: 'Payment Received' },
    { value: 'booking_requested', label: 'Processing' },
    { value: 'pending_payment', label: 'Awaiting Payment' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'failed', label: 'Failed' },
];

export function BookingFilters({ roomTypes }: BookingFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Controlled local state — in sync with URL
    const [guest, setGuest] = useState(searchParams.get('guest') || '');
    const [bookingNum, setBookingNum] = useState(searchParams.get('bookingNum') || '');
    const [status, setStatus] = useState(searchParams.get('status') || '');
    const [roomType, setRoomType] = useState(searchParams.get('roomType') || '');
    const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
    const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');

    // Push all current filter values to the URL
    const pushToUrl = (overrides: Record<string, string> = {}) => {
        const current = { guest, bookingNum, status, roomType, dateFrom, dateTo, ...overrides };
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(current)) {
            if (v) params.set(k, v);
        }
        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    };

    // Debounce text inputs (guest, bookingNum) — wait 400ms after typing
    useEffect(() => {
        const timer = setTimeout(() => pushToUrl({ guest, bookingNum }), 400);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [guest, bookingNum]);

    // Instant update for selects and dates
    const handleSelect = (key: string, value: string) => {
        if (key === 'status') setStatus(value);
        if (key === 'roomType') setRoomType(value);
        if (key === 'dateFrom') setDateFrom(value);
        if (key === 'dateTo') setDateTo(value);
        pushToUrl({ [key]: value });
    };

    const clearAll = () => {
        setGuest(''); setBookingNum(''); setStatus(''); setRoomType(''); setDateFrom(''); setDateTo('');
        startTransition(() => router.replace(pathname));
    };

    const hasFilters = guest || bookingNum || status || roomType || dateFrom || dateTo;

    return (
        <div className={`rounded-xl border border-gray-200 bg-white p-4 space-y-3 transition-opacity ${isPending ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Filters</p>
                {hasFilters && (
                    <button onClick={clearAll} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium">
                        <X className="w-3 h-3" /> Clear all
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* Booking # */}
                <input
                    type="text"
                    placeholder="Booking # (OL-…)"
                    value={bookingNum}
                    onChange={(e) => setBookingNum(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 font-mono"
                />

                {/* Guest Name */}
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Guest name…"
                        value={guest}
                        onChange={(e) => setGuest(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
                    />
                </div>

                {/* Status */}
                <select
                    value={status}
                    onChange={(e) => handleSelect('status', e.target.value)}
                    className="py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 text-gray-700 bg-white"
                >
                    {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>

                {/* Room Type */}
                <select
                    value={roomType}
                    onChange={(e) => handleSelect('roomType', e.target.value)}
                    className="py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 text-gray-700 bg-white"
                >
                    <option value="">All Rooms</option>
                    {roomTypes.map(rt => (
                        <option key={rt.id} value={rt.id}>{rt.name}</option>
                    ))}
                </select>

                {/* Date From */}
                <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => handleSelect('dateFrom', e.target.value)}
                    title="Check-in from"
                    className="py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 text-gray-700"
                />

                {/* Date To */}
                <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => handleSelect('dateTo', e.target.value)}
                    title="Check-in to"
                    className="py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 text-gray-700"
                />
            </div>

            {hasFilters && (
                <p className="text-xs text-gray-400">
                    Filtering:{' '}
                    {[
                        bookingNum && `booking "${bookingNum}"`,
                        guest && `guest "${guest}"`,
                        status && STATUS_OPTIONS.find(o => o.value === status)?.label,
                        roomType && roomTypes.find(r => r.id === roomType)?.name,
                        dateFrom && `from ${dateFrom}`,
                        dateTo && `to ${dateTo}`,
                    ].filter(Boolean).join(' · ')}
                </p>
            )}
        </div>
    );
}
