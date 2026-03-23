'use client';

import { useState, useTransition } from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { LuxuryDatePicker } from '@/components/ui/luxury-date-picker';
import { useRouter } from 'next/navigation';
import { ChevronDown, Search, Loader2 } from 'lucide-react';

interface SearchStayEditorProps {
    initialCheckIn: Date;
    initialCheckOut: Date;
    initialAdults: number;
    initialChildren: number;
    initialRooms: number;
    onUpdate?: (checkIn: Date, checkOut: Date, adults: number, children: number, rooms: number) => void;
}

export function SearchStayEditor({
    initialCheckIn,
    initialCheckOut,
    initialAdults,
    initialChildren,
    initialRooms,
    onUpdate,
}: SearchStayEditorProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(true);

    const [date, setDate] = useState<DateRange | undefined>({
        from: initialCheckIn,
        to: initialCheckOut,
    });
    const [guests, setGuests] = useState({
        adults: initialAdults,
        children: initialChildren,
        rooms: initialRooms
    });

    const handleUpdate = () => {
        if (!date?.from || !date?.to) return;

        if (onUpdate) {
            startTransition(() => {
                onUpdate(date.from!, date.to!, guests.adults, guests.children, guests.rooms);
            });
            return;
        }

        const params = new URLSearchParams();
        params.set('checkIn', format(date.from, 'yyyy-MM-dd'));
        params.set('checkOut', format(date.to, 'yyyy-MM-dd'));
        params.set('adults', guests.adults.toString());
        params.set('children', guests.children.toString());
        params.set('rooms', guests.rooms.toString());

        router.push(`/book/search?${params.toString()}`);
    };

    return (
        <div className="relative">
            {/* Mobile: redesigned layout */}
            <div className="md:hidden">
                {isCollapsed ? (
                    <button
                        onClick={() => setIsCollapsed(false)}
                        className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center justify-between group active:scale-[0.99] transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-start">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-1">Your Stay</span>
                                <div className="flex items-center gap-2 text-sm font-semibold text-[#0F172A]">
                                    <span>{date?.from ? format(date.from, 'd MMM') : 'Check-in'}</span>
                                    <span className="text-gray-300">→</span>
                                    <span>{date?.to ? format(date.to, 'd MMM') : 'Check-out'}</span>
                                </div>
                            </div>
                            <div className="h-8 w-[1px] bg-gray-100" />
                            <div className="flex flex-col items-start">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-1">Guests</span>
                                <span className="text-sm font-semibold text-[#0F172A]">
                                    {guests.adults + guests.children} {guests.adults + guests.children === 1 ? 'Guest' : 'Guests'}
                                </span>
                            </div>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                            <ChevronDown className="w-5 h-5" />
                        </div>
                    </button>
                ) : (
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden p-4">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[11px] uppercase tracking-[0.28em] text-gray-400 font-semibold">Update your stay</p>
                            <button 
                                onClick={() => setIsCollapsed(true)}
                                className="text-xs font-bold text-emerald-700 uppercase tracking-wider"
                            >
                                Minimize
                            </button>
                        </div>

                        <button
                            onClick={() => setIsDatePickerOpen(true)}
                            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-left hover:bg-white transition-colors"
                        >
                            <p className="text-[10px] uppercase tracking-[0.26em] text-gray-400 font-bold">Stay period</p>
                            <div className="mt-2 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 text-[16px] font-semibold text-[#0F172A]">
                                    <span>{date?.from ? format(date.from, 'EEE, dd MMM') : 'Check-in'}</span>
                                    <span className="text-gray-300">→</span>
                                    <span>{date?.to ? format(date.to, 'EEE, dd MMM') : 'Check-out'}</span>
                                </div>
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                            </div>
                        </button>

                <div className="mt-4 space-y-2.5">
                    {[
                        {
                            label: 'Adults',
                            value: guests.adults,
                            dec: () => setGuests({ ...guests, adults: Math.max(1, guests.adults - 1) }),
                            inc: () => setGuests({ ...guests, adults: Math.min(8, guests.adults + 1) }),
                        },
                        {
                            label: 'Children',
                            value: guests.children,
                            dec: () => setGuests({ ...guests, children: Math.max(0, guests.children - 1) }),
                            inc: () => setGuests({ ...guests, children: Math.min(8, guests.children + 1) }),
                        },
                        {
                            label: 'Rooms',
                            value: guests.rooms,
                            dec: () => setGuests({ ...guests, rooms: Math.max(1, guests.rooms - 1) }),
                            inc: () => setGuests({ ...guests, rooms: Math.min(8, guests.rooms + 1) }),
                        },
                    ].map((row) => (
                        <div key={row.label} className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.26em] text-gray-400 font-bold">
                                        {row.label}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={row.dec}
                                        className="h-9 w-9 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-lg font-bold active:scale-[0.98]"
                                        aria-label={`Decrease ${row.label}`}
                                    >
                                        −
                                    </button>
                                    <div className="min-w-9 text-center text-[16px] font-semibold text-[#0F172A] tabular-nums">
                                        {row.value}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={row.inc}
                                        className="h-9 w-9 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-lg font-bold active:scale-[0.98]"
                                        aria-label={`Increase ${row.label}`}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                        <button
                            onClick={handleUpdate}
                            disabled={isPending}
                            className="mt-4 w-full h-12 bg-[#0A332B] hover:bg-[#15443B] disabled:opacity-70 text-white rounded-2xl text-sm font-bold uppercase tracking-widest transition-all shadow-[0_18px_40px_-22px_rgba(10,51,43,0.55)] flex items-center justify-center gap-2"
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            {isPending ? 'Updating...' : 'Update results'}
                        </button>
                    </div>
                )}
            </div>

            {/* Desktop/tablet: keep existing layout */}
            <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden p-4 md:p-6">
                <div className="flex flex-col md:flex-row gap-6 md:items-end">
                    {/* Date Range Picker Box */}
                    <div className="flex-1">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-2 block">Stay Period</label>
                        <button
                            onClick={() => setIsDatePickerOpen(true)}
                            className="w-full flex items-center justify-between px-4 h-12 rounded-xl bg-gray-50 border border-gray-200 hover:border-emerald-200 hover:bg-white transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-gray-900">
                                    {date?.from ? format(date.from, 'EEE, dd MMM') : 'Check-in'}
                                </span>
                                <span className="text-gray-300">→</span>
                                <span className="text-sm font-semibold text-gray-900">
                                    {date?.to ? format(date.to, 'EEE, dd MMM') : 'Check-out'}
                                </span>
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-6 items-end">
                        {[
                            {
                                label: 'Adults',
                                value: guests.adults,
                                dec: () => setGuests({ ...guests, adults: Math.max(1, guests.adults - 1) }),
                                inc: () => setGuests({ ...guests, adults: Math.min(8, guests.adults + 1) }),
                            },
                            {
                                label: 'Children',
                                value: guests.children,
                                dec: () => setGuests({ ...guests, children: Math.max(0, guests.children - 1) }),
                                inc: () => setGuests({ ...guests, children: Math.min(8, guests.children + 1) }),
                            },
                            {
                                label: 'Rooms',
                                value: guests.rooms,
                                dec: () => setGuests({ ...guests, rooms: Math.max(1, guests.rooms - 1) }),
                                inc: () => setGuests({ ...guests, rooms: Math.min(8, guests.rooms + 1) }),
                            },
                        ].map((row) => (
                            <div key={row.label} className="space-y-2">
                                <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400 block">{row.label}</label>
                                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-2 h-12">
                                    <button
                                        type="button"
                                        onClick={row.dec}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 hover:text-red-500 transition-all font-bold"
                                    >
                                        −
                                    </button>
                                    <span className="w-4 text-center text-sm font-bold text-gray-900">{row.value}</span>
                                    <button
                                        type="button"
                                        onClick={row.inc}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 hover:text-emerald-500 transition-all font-bold"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={handleUpdate}
                            disabled={isPending}
                            className="h-12 px-8 bg-[#0A332B] hover:bg-[#15443B] disabled:opacity-70 text-white rounded-xl text-sm font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 ml-auto"
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            {isPending ? 'Updating...' : 'Update Results'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Date Picker Overlay */}
            {isDatePickerOpen && (
                <>
                    <div
                        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
                        onClick={() => setIsDatePickerOpen(false)}
                    />
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 pointer-events-none">
                        <div className="pointer-events-auto w-full max-w-[860px]">
                            <LuxuryDatePicker
                                date={date}
                                setDate={setDate}
                                onClose={() => setIsDatePickerOpen(false)}
                                className="max-h-[90vh] overflow-auto"
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
