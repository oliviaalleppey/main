'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';

export function DateFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || new Date().toISOString().slice(0, 10));
    const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || (() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().slice(0, 10);
    })());

    function handleApply() {
        const params = new URLSearchParams();
        params.set('checkIn', checkIn);
        params.set('checkOut', checkOut);
        router.push(`/admin/availability?${params.toString()}`);
    }

    return (
        <div className="flex items-end gap-3">
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Check-in</label>
                <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Check-out</label>
                <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
            </div>
            <button
                onClick={handleApply}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
            >
                <Search className="w-4 h-4" />
                Check
            </button>
        </div>
    );
}
