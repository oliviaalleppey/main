'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Search } from 'lucide-react';

interface MiniStayEditorProps {
    checkIn: string;
    checkOut: string;
    adults: number;
    childCount: number;
    roomCount?: number;
}

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);

export function MiniStayEditor({
    checkIn,
    checkOut,
    adults,
    childCount,
    roomCount = 1,
}: MiniStayEditorProps) {
    const router = useRouter();
    const [fromDate, setFromDate] = useState(checkIn);
    const [toDate, setToDate] = useState(checkOut);
    const [error, setError] = useState<string | null>(null);

    const nights = useMemo(() => {
        if (!fromDate || !toDate) return 0;
        const diff = new Date(toDate).getTime() - new Date(fromDate).getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }, [fromDate, toDate]);

    const hasValidRange = useMemo(() => {
        if (!fromDate || !toDate) return false;
        return new Date(toDate).getTime() > new Date(fromDate).getTime();
    }, [fromDate, toDate]);

    const handleFromDateChange = (value: string) => {
        setFromDate(value);
        setError(null);

        if (!toDate) return;
        const currentTo = new Date(toDate).getTime();
        const nextFrom = new Date(value).getTime();
        if (Number.isFinite(currentTo) && Number.isFinite(nextFrom) && currentTo <= nextFrom) {
            const nextCheckOut = new Date(nextFrom + (24 * 60 * 60 * 1000));
            setToDate(toDateInputValue(nextCheckOut));
        }
    };

    const handleToDateChange = (value: string) => {
        setToDate(value);
        setError(null);
    };

    const handleRecheck = () => {
        if (!hasValidRange) {
            setError('Check-out must be after check-in');
            return;
        }

        setError(null);
        const params = new URLSearchParams({
            checkIn: fromDate,
            checkOut: toDate,
            adults: String(adults),
            children: String(childCount),
            rooms: String(roomCount),
        });
        router.push(`/book/search?${params.toString()}`);
    };

    return (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-2.5 md:p-3">
            <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] md:text-[11px] uppercase tracking-[0.18em] md:tracking-[0.2em] text-gray-500 inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Mini Date Picker
                </p>
                <span className="text-[10px] md:text-[11px] rounded-full bg-white border border-gray-200 px-2 py-0.5 text-gray-600">
                    {roomCount}R · {adults}A · {childCount}C · {nights}N
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
                <label className="text-xs text-gray-600">
                    Check-in
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(event) => handleFromDateChange(event.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900"
                    />
                </label>
                <label className="text-xs text-gray-600">
                    Check-out
                    <input
                        type="date"
                        value={toDate}
                        min={fromDate}
                        onChange={(event) => handleToDateChange(event.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900"
                    />
                </label>
            </div>
            <button
                type="button"
                onClick={handleRecheck}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#1C1C1C] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#1C1C1C] hover:bg-gray-100"
            >
                <Search className="w-3.5 h-3.5" />
                Recheck Availability
            </button>
            {error && (
                <p className="text-xs text-red-600 mt-2">{error}</p>
            )}
        </div>
    );
}
