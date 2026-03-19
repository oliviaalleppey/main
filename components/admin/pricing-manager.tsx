'use client';

import * as React from 'react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { differenceInCalendarDays, format, addDays } from 'date-fns';
import { InlineDateRangePicker } from '@/components/ui/inline-date-range-picker';

type RoomTypeOption = {
    id: string;
    name: string;
    basePricePaise: number;
};

type InventoryItem = {
    id: string;
    date: string;
    price: number;
};

function formatRupeesFromPaise(paise: number) {
    const rupees = Math.round((paise || 0) / 100);
    return rupees.toLocaleString('en-IN');
}

function dateRangeToLabel(range: DateRange | undefined) {
    if (!range?.from) return 'Select dates';
    if (!range.to) return format(range.from, 'd MMM yyyy');
    return `${format(range.from, 'd MMM yyyy')} → ${format(range.to, 'd MMM yyyy')}`;
}

export function PricingManager({ roomTypes }: { roomTypes: RoomTypeOption[] }) {
    const [roomTypeId, setRoomTypeId] = React.useState(roomTypes[0]?.id || '');
    const [dateMode, setDateMode] = React.useState<'range' | 'multiple'>('range');
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
    const [multipleDates, setMultipleDates] = React.useState<Date[]>([]);
    const [priceRupees, setPriceRupees] = React.useState<string>('');
    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);

    const selectedRoomType = React.useMemo(() => roomTypes.find((r) => r.id === roomTypeId), [roomTypes, roomTypeId]);

    // FETCH WIDE OVERRIDES (365 DAYS)
    const [allOverrides, setAllOverrides] = React.useState<any[]>([]);

    const loadOverrides = React.useCallback(async () => {
        if (!roomTypeId) {
            setAllOverrides([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const startDate = format(new Date(), 'yyyy-MM-dd');
            const endDate = format(addDays(new Date(), 365), 'yyyy-MM-dd');
            const url = `/api/admin/pricing/inventory?roomTypeId=${encodeURIComponent(roomTypeId)}&startDate=${startDate}&endDate=${endDate}`;
            const res = await fetch(url);
            const json = await res.json();
            if (res.ok && Array.isArray(json?.items)) {
                setAllOverrides(json.items);
            } else {
                setAllOverrides([]);
            }
        } catch (e: any) {
            console.error('Failed to load overrides', e);
        } finally {
            setLoading(false);
        }
    }, [roomTypeId]);

    React.useEffect(() => {
        void loadOverrides();
    }, [loadOverrides]);

    // DERIVE CALENDAR PRICES MAP
    const pricesMap = React.useMemo(() => {
        const map: Record<string, number> = {};
        for (const item of allOverrides) {
            map[item.date] = Math.round(item.price / 100);
        }
        return map;
    }, [allOverrides]);

    // DERIVE SELECTED ITEMS FOR LIST
    const items = React.useMemo(() => {
        if (dateMode === 'multiple') {
            const dates = multipleDates.map(d => format(d, 'yyyy-MM-dd'));
            return allOverrides.filter(item => dates.includes(item.date));
        }
        if (dateRange?.from && dateRange?.to) {
            const startStr = format(dateRange.from, 'yyyy-MM-dd');
            const endStr = format(dateRange.to, 'yyyy-MM-dd');
            return allOverrides.filter(item => item.date >= startStr && item.date <= endStr);
        }
        return [];
    }, [dateMode, multipleDates, dateRange, allOverrides]);

    const hasRange = Boolean(dateRange?.from && dateRange?.to);
    const hasMultiple = multipleDates.length > 0;
    const canLoad = Boolean(roomTypeId && (dateMode === 'range' ? hasRange : hasMultiple));
    const canSave = canLoad && Boolean(priceRupees && Number.isFinite(Number(priceRupees)));

    const selectedNights = React.useMemo(() => {
        if (dateMode !== 'range') return multipleDates.length;
        if (!dateRange?.from || !dateRange?.to) return 0;
        return Math.max(1, differenceInCalendarDays(dateRange.to, dateRange.from) + 1);
    }, [dateMode, dateRange?.from, dateRange?.to, multipleDates.length]);

    const handleSave = async (overridePrice?: number) => {
        if (!canLoad) return;
        const targetPrice = overridePrice !== undefined ? overridePrice : Number(priceRupees);
        if (!Number.isFinite(targetPrice)) return;

        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const payload = dateMode === 'multiple'
                ? {
                    roomTypeId,
                    dates: multipleDates.map((d) => format(d, 'yyyy-MM-dd')),
                    priceRupees: targetPrice,
                }
                : {
                    roomTypeId,
                    startDate: format(dateRange!.from!, 'yyyy-MM-dd'),
                    endDate: format(dateRange!.to!, 'yyyy-MM-dd'),
                    priceRupees: targetPrice,
                };
            const res = await fetch('/api/admin/pricing/inventory', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error || 'Failed to save pricing');
            setSuccess(`Saved. ${overridePrice !== undefined ? "Reset to Base Rate" : "Prices"} will apply automatically for selected dates.`);
            await loadOverrides();
        } catch (e: any) {
            setError(e?.message || 'Failed to save pricing');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 items-start max-w-[1600px] pb-10">
            {/* Left Column: Form & History */}
            <div className="w-full xl:w-[380px] shrink-0 space-y-6 xl:sticky xl:top-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Pricing Manager</h1>
                    <p className="text-sm text-gray-500 mt-1">Select dates on the calendar and apply new base rates.</p>
                </div>

                {error ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
                ) : null}
                {success ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</div>
                ) : null}

                <div className="flex flex-col gap-5">
                    <Card className="p-5 shadow-sm border border-gray-200 flex flex-col gap-5">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">1. Select Room</Label>
                            <select
                                value={roomTypeId}
                                onChange={(e) => setRoomTypeId(e.target.value)}
                                className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0A332B]/20"
                            >
                                {roomTypes.map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.name}
                                    </option>
                                ))}
                            </select>
                            {selectedRoomType && (
                                <p className="text-[11px] text-gray-500 font-medium ml-1">
                                    Base Rate: <span className="text-gray-900">₹{formatRupeesFromPaise(selectedRoomType.basePricePaise)}</span>
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">2. Nightly Price (₹)</Label>
                            <Input
                                className="h-11 text-base font-semibold px-3 border-gray-200 bg-gray-50 focus:bg-white transition-colors"
                                inputMode="numeric"
                                placeholder="e.g. 6000"
                                value={priceRupees}
                                onChange={(e) => setPriceRupees(e.target.value)}
                            />
                        </div>

                        <div className="pt-2 border-t border-gray-100 space-y-3">
                            <div className="flex flex-col space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Selected Dates</span>
                                <span className="text-sm font-semibold text-gray-900">
                                    {dateMode === 'multiple'
                                        ? (multipleDates.length ? `${multipleDates.length} date${multipleDates.length > 1 ? 's' : ''} selected` : 'Select dates on calendar')
                                        : dateRangeToLabel(dateRange)}
                                </span>
                            </div>

                            <Button
                                type="button"
                                className="w-full h-11 bg-[#0F172A] hover:bg-black text-white font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => handleSave()}
                                disabled={!canSave || saving}
                            >
                                {saving ? 'Saving...' : `Save Overrides for ${selectedNights || multipleDates.length} Day${(selectedNights || multipleDates.length) === 1 ? '' : 's'}`}
                            </Button>

                            {selectedRoomType && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full h-10 border-gray-200 text-gray-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                    onClick={() => handleSave(Math.round((selectedRoomType.basePricePaise || 0) / 100))}
                                    disabled={!canLoad || saving}
                                >
                                    Reset to Base (₹{formatRupeesFromPaise(selectedRoomType.basePricePaise)})
                                </Button>
                            )}
                        </div>
                    </Card>

                    <Card className="p-0 shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-gray-700">Existing Overrides</Label>
                        </div>
                        <div className="p-0">
                            {!canLoad ? (
                                <div className="p-8 text-center text-sm text-gray-500">
                                    Select a date range on the calendar to view existing overrides.
                                </div>
                            ) : items.length === 0 ? (
                                <div className="p-8 text-center text-sm text-gray-500">
                                    No overrides saved for these dates.
                                </div>
                            ) : (
                                <div className="max-h-[260px] overflow-y-auto w-full">
                                    {items.map((row) => (
                                        <div key={row.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0 text-sm hover:bg-gray-50 transition-colors">
                                            <span className="text-gray-600 font-medium">{row.date}</span>
                                            <span className="font-bold text-gray-900">₹{formatRupeesFromPaise(row.price)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Right Column: Interactive Calendar */}
            <div className="flex-1 w-full min-w-0">
                <Card className="p-4 sm:p-6 lg:p-8 shadow-md border-gray-200 bg-white min-h-[600px] flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center bg-gray-100/80 p-1 rounded-lg w-fit border border-gray-200/50">
                            <button
                                type="button"
                                onClick={() => {
                                    setDateMode('range');
                                    setDateRange(undefined);
                                    setMultipleDates([]);
                                }}
                                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${dateMode === 'range'
                                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-black/5'}`}
                            >
                                Range
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setDateMode('multiple');
                                    setDateRange(undefined);
                                    setMultipleDates([]);
                                }}
                                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${dateMode === 'multiple'
                                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-black/5'}`}
                            >
                                Multiple dates
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setDateRange(undefined);
                                    setMultipleDates([]);
                                }}
                                className="h-9 px-4 font-semibold text-gray-600 hover:text-gray-900 border-gray-200"
                            >
                                Clear
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => void loadOverrides()}
                                disabled={loading}
                                className="h-9 px-4 font-semibold text-gray-600 hover:text-gray-900 border-gray-200"
                            >
                                {loading ? 'Loading…' : 'Refresh'}
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 w-full border border-gray-100 rounded-2xl bg-gray-50/30 p-2 sm:p-4 overflow-hidden">
                        <div className="w-full h-full overflow-x-auto pb-4 custom-scrollbar">
                            <div className="w-max min-w-full mx-auto flex justify-center py-2">
                                <InlineDateRangePicker
                                    mode={dateMode === 'multiple' ? 'multiple' : 'range'}
                                    value={dateRange}
                                    onChange={setDateRange}
                                    multipleDates={multipleDates}
                                    onMultipleDatesChange={setMultipleDates}
                                    prices={pricesMap}
                                    basePrice={selectedRoomType ? Math.round((selectedRoomType.basePricePaise || 0) / 100) : undefined}
                                />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

