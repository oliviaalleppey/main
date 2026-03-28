'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';

const VIEW_TABS = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' },
] as const;

export function AvailabilityToolbar() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const view = searchParams.get('view') || 'week';
    const dateParam = searchParams.get('date') || new Date().toISOString().slice(0, 10);

    const [jumpDate, setJumpDate] = useState(dateParam);

    function navigate(newDate: string, newView?: string) {
        const params = new URLSearchParams();
        params.set('date', newDate);
        params.set('view', newView || view);
        router.push(`/admin/availability?${params.toString()}`);
    }

    function handlePrev() {
        const d = new Date(dateParam + 'T00:00:00');
        if (view === 'week') d.setDate(d.getDate() - 7);
        else if (view === 'month') d.setMonth(d.getMonth() - 1);
        else d.setFullYear(d.getFullYear() - 1);
        navigate(d.toISOString().slice(0, 10));
    }

    function handleNext() {
        const d = new Date(dateParam + 'T00:00:00');
        if (view === 'week') d.setDate(d.getDate() + 7);
        else if (view === 'month') d.setMonth(d.getMonth() + 1);
        else d.setFullYear(d.getFullYear() + 1);
        navigate(d.toISOString().slice(0, 10));
    }

    function getLabel(): string {
        const d = new Date(dateParam + 'T00:00:00');
        if (view === 'week') {
            const end = new Date(d);
            end.setDate(d.getDate() + 6);
            return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        }
        if (view === 'month') {
            return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        }
        return d.getFullYear().toString();
    }

    function handleJump() {
        if (!jumpDate) return;
        navigate(jumpDate);
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    return (
        <div className="flex flex-col gap-4">
            {/* View Tabs + Date Navigation */}
            <div className="flex items-center justify-between">
                {/* Tabs */}
                <div className="flex items-center gap-1 rounded-lg border bg-white p-1">
                    {VIEW_TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => navigate(dateParam, tab.key)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                view === tab.key
                                    ? 'bg-gray-900 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePrev}
                        className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <span className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
                        {getLabel()}
                    </span>
                    <button
                        onClick={handleNext}
                        className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                    <Link
                        href={`/admin/availability?view=${view}`}
                        className="ml-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        Today
                    </Link>
                </div>
            </div>

            {/* Date Jump */}
            <div className="flex items-end gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                        Jump to date
                    </label>
                    <input
                        type="date"
                        value={jumpDate}
                        onChange={(e) => setJumpDate(e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                </div>
                <button
                    onClick={handleJump}
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
                >
                    <Search className="w-4 h-4" />
                    Go
                </button>
            </div>
        </div>
    );
}
