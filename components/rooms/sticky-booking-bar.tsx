'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { addDays, format, startOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { LuxuryDatePicker } from '@/components/ui/luxury-date-picker';

interface StickyBookingBarProps {
    basePrice: number;
}

export default function StickyBookingBar({ basePrice }: StickyBookingBarProps) {
    const router = useRouter();

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount / 100);

    const [date, setDate] = useState<DateRange | undefined>({
        from: startOfDay(new Date()),
        to: addDays(startOfDay(new Date()), 1),
    });
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [guests, setGuests] = useState({ adults: 2, children: 0 });

    useEffect(() => {
        const onEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsDatePickerOpen(false);
        };

        if (isDatePickerOpen) {
            const html = document.documentElement;
            window.addEventListener('keydown', onEscape);
            const previousBodyOverflow = document.body.style.overflow;
            const previousHtmlOverflow = html.style.overflow;
            const previousBodyOverscroll = document.body.style.overscrollBehavior;
            const previousHtmlOverscroll = html.style.overscrollBehavior;
            document.body.style.overflow = 'hidden';
            html.style.overflow = 'hidden';
            document.body.style.overscrollBehavior = 'none';
            html.style.overscrollBehavior = 'none';
            return () => {
                window.removeEventListener('keydown', onEscape);
                document.body.style.overflow = previousBodyOverflow;
                html.style.overflow = previousHtmlOverflow;
                document.body.style.overscrollBehavior = previousBodyOverscroll;
                html.style.overscrollBehavior = previousHtmlOverscroll;
            };
        }
    }, [isDatePickerOpen]);

    const handleSearch = () => {
        if (!date?.from || !date?.to) return;

        const params = new URLSearchParams({
            checkIn: format(date.from, 'yyyy-MM-dd'),
            checkOut: format(date.to, 'yyyy-MM-dd'),
            adults: guests.adults.toString(),
            children: guests.children.toString(),
        });

        router.push(`/book/search?${params.toString()}`);
    };

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full bg-white/95 backdrop-blur-md border-t border-[#1C1C1C]/5 py-2 transition-all duration-300 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            {isDatePickerOpen && (
                <>
                    <button
                        aria-label="Close date picker"
                        className="fixed inset-0 z-40 bg-black/35"
                        onClick={() => setIsDatePickerOpen(false)}
                    />
                    <div className="fixed inset-x-0 bottom-0 md:inset-0 z-50 flex items-end md:items-center justify-center p-2 md:p-6 overscroll-none">
                        <LuxuryDatePicker
                            date={date}
                            setDate={setDate}
                            onClose={() => setIsDatePickerOpen(false)}
                            className="w-full max-w-[860px] rounded-t-3xl md:rounded-3xl max-h-[90vh] overflow-auto overscroll-contain"
                        />
                    </div>
                </>
            )}

            <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex flex-col xl:flex-row items-center justify-between gap-6 relative">
                <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
                    <div className="flex items-center gap-3">
                        <span className="text-[#1C1C1C] font-bold text-sm hidden md:inline">Stay period</span>
                        <button
                            type="button"
                            onClick={() => setIsDatePickerOpen(true)}
                            className="flex bg-white border border-[#1C1C1C]/10 px-4 py-2.5 rounded-sm items-center gap-3 shadow-sm hover:border-[#1C1C1C]/30 transition-colors min-w-[260px] text-left"
                        >
                            <span className="text-sm font-medium text-[#1C1C1C]">
                                {date?.from ? format(date.from, 'EEE, d MMM yyyy') : 'Select Date'}
                            </span>
                            <span className="text-[#1C1C1C]/40 text-xs">→</span>
                            <span className="text-sm font-medium text-[#1C1C1C]">
                                {date?.to ? format(date.to, 'EEE, d MMM yyyy') : 'Select Date'}
                            </span>
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-[#1C1C1C] font-bold text-sm hidden md:inline">Guests</span>

                        <div className="flex bg-white border border-[#1C1C1C]/10 px-3 py-2.5 rounded-sm items-center gap-3 shadow-sm hover:border-[#1C1C1C]/30 transition-colors">
                            <span className="text-sm text-[#1C1C1C]">Adult</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setGuests(p => ({ ...p, adults: Math.max(1, p.adults - 1) }))}
                                    className="w-5 h-5 flex items-center justify-center rounded-full border border-[#1C1C1C]/20 text-[10px] hover:bg-[#1C1C1C] hover:text-white transition-colors"
                                >-</button>
                                <span className="text-sm font-medium w-3 text-center">{guests.adults}</span>
                                <button
                                    onClick={() => setGuests(p => ({ ...p, adults: Math.min(8, p.adults + 1) }))}
                                    className="w-5 h-5 flex items-center justify-center rounded-full border border-[#1C1C1C]/20 text-[10px] hover:bg-[#1C1C1C] hover:text-white transition-colors"
                                >+</button>
                            </div>
                        </div>

                        <div className="flex bg-white border border-[#1C1C1C]/10 px-3 py-2.5 rounded-sm items-center gap-3 shadow-sm hover:border-[#1C1C1C]/30 transition-colors">
                            <span className="text-sm text-[#1C1C1C]">Children</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setGuests(p => ({ ...p, children: Math.max(0, p.children - 1) }))}
                                    className="w-5 h-5 flex items-center justify-center rounded-full border border-[#1C1C1C]/20 text-[10px] hover:bg-[#1C1C1C] hover:text-white transition-colors"
                                >-</button>
                                <span className="text-sm font-medium w-3 text-center">{guests.children}</span>
                                <button
                                    onClick={() => setGuests(p => ({ ...p, children: Math.min(6, p.children + 1) }))}
                                    className="w-5 h-5 flex items-center justify-center rounded-full border border-[#1C1C1C]/20 text-[10px] hover:bg-[#1C1C1C] hover:text-white transition-colors"
                                >+</button>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="flex items-center gap-6 justify-center">
                    <div className="hidden xl:block text-right">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[#1C1C1C]/50">From</p>
                        <p className="text-lg font-serif text-[#1C1C1C]">{formatCurrency(basePrice)}<span className="text-xs font-sans text-[#1C1C1C]/60"> / night</span></p>
                    </div>

                    <button
                        onClick={handleSearch}
                        disabled={!date?.from || !date?.to}
                        className="bg-[#1C1C1C] text-white px-8 py-3 text-sm font-medium hover:bg-[#333] transition-colors rounded-sm shadow-md shadow-[#1C1C1C]/10 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Search Availability
                    </button>

                    <Link
                        href="/contact"
                        className="hidden lg:inline-flex items-center gap-1 text-[#1C1C1C] font-bold text-sm border-b border-[#1C1C1C] pb-0.5 hover:opacity-70 transition-opacity whitespace-nowrap"
                    >
                        Book hotel with flight instead
                        <span>→</span>
                    </Link>
                </div>

            </div>
        </div>
    );
}
