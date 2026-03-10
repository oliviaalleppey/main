'use client';

import { useState, useEffect } from 'react';
import { format, startOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { LuxuryDatePicker } from '@/components/ui/luxury-date-picker';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Minus, Search, X, Users, BedDouble } from 'lucide-react';

interface SearchStayEditorProps {
    initialCheckIn: Date;
    initialCheckOut: Date;
    initialAdults: number;
    initialChildren: number;
    initialRooms: number;
}

export function SearchStayEditor({
    initialCheckIn,
    initialCheckOut,
    initialAdults,
    initialChildren,
    initialRooms,
}: SearchStayEditorProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

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

        const params = new URLSearchParams();
        params.set('checkIn', format(date.from, 'yyyy-MM-dd'));
        params.set('checkOut', format(date.to, 'yyyy-MM-dd'));
        params.set('adults', guests.adults.toString());
        params.set('children', guests.children.toString());
        params.set('rooms', guests.rooms.toString());

        setIsEditing(false);
        router.push(`/book/search?${params.toString()}`);
    };

    return (
        <div className="relative">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 md:gap-6">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] md:tracking-[0.3em] text-gray-500 mb-1 md:mb-2 text-left">Stay Summary</p>
                    <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4">
                        <h1 className="text-2xl md:text-3xl font-serif text-[#1D2B25] leading-tight text-left">
                            {format(initialCheckIn, 'd MMM')}
                            <span className="text-[#8A968A] font-sans text-xl md:text-2xl mx-1 md:mx-2">to</span>
                            {format(initialCheckOut, 'd MMM')}
                        </h1>
                        <p className="text-xs md:text-sm text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                            {guests.adults} Adults · {guests.children} Children · {guests.rooms} Rooms
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all shadow-sm ${isEditing
                                ? 'bg-amber-50 border-amber-200 text-amber-700'
                                : 'bg-white border-[#CDD5C1] text-[#223128] hover:bg-[#F6F8F1]'
                            }`}
                    >
                        {isEditing ? <X className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {isEditing ? 'Close Editor' : 'Change Dates'}
                    </button>
                    <button
                        onClick={() => router.push('/rooms')}
                        className="inline-flex items-center justify-center rounded-xl bg-[#1F2A24] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2A362F] transition-colors shadow-sm"
                    >
                        View All Room Types
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isEditing && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute left-0 right-0 top-full mt-4 z-40"
                    >
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden p-4 md:p-6">
                            <div className="flex flex-col md:flex-row gap-6">
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

                                {/* Multi-Selector for Guests & Rooms */}
                                <div className="flex flex-wrap gap-4 md:gap-6 items-end">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400 block">Adults</label>
                                        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-2 h-12">
                                            <button
                                                onClick={() => setGuests({ ...guests, adults: Math.max(1, guests.adults - 1) })}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 hover:text-red-500 transition-all font-bold"
                                            >−</button>
                                            <span className="w-4 text-center text-sm font-bold text-gray-900">{guests.adults}</span>
                                            <button
                                                onClick={() => setGuests({ ...guests, adults: Math.min(8, guests.adults + 1) })}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 hover:text-emerald-500 transition-all font-bold"
                                            >+</button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400 block">Children</label>
                                        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-2 h-12">
                                            <button
                                                onClick={() => setGuests({ ...guests, children: Math.max(0, guests.children - 1) })}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 hover:text-red-500 transition-all font-bold"
                                            >−</button>
                                            <span className="w-4 text-center text-sm font-bold text-gray-900">{guests.children}</span>
                                            <button
                                                onClick={() => setGuests({ ...guests, children: Math.min(8, guests.children + 1) })}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 hover:text-emerald-500 transition-all font-bold"
                                            >+</button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400 block">Rooms</label>
                                        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-2 h-12">
                                            <button
                                                onClick={() => setGuests({ ...guests, rooms: Math.max(1, guests.rooms - 1) })}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 hover:text-red-500 transition-all font-bold"
                                            >−</button>
                                            <span className="w-4 text-center text-sm font-bold text-gray-900">{guests.rooms}</span>
                                            <button
                                                onClick={() => setGuests({ ...guests, rooms: Math.min(8, guests.rooms + 1) })}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 hover:text-emerald-500 transition-all font-bold"
                                            >+</button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleUpdate}
                                        className="h-12 px-8 bg-[#0A332B] hover:bg-[#15443B] text-white rounded-xl text-sm font-bold uppercase tracking-widest transition-all shadow-md flex items-center gap-2 ml-auto"
                                    >
                                        <Search className="w-4 h-4" />
                                        Update Results
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
