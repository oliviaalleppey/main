'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addDays, format, startOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { LuxuryDatePicker } from '@/components/ui/luxury-date-picker';

interface StickyBookingBarProps {
    basePrice: number;
    roomSlug?: string;
}

export default function StickyBookingBar({ basePrice, roomSlug }: StickyBookingBarProps) {
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
    const [viewportWidth, setViewportWidth] = useState<number | null>(null);
    const isMobile = (viewportWidth ?? 1024) < 768;

    useEffect(() => {
        const update = () => setViewportWidth(window.innerWidth);
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    useEffect(() => {
        const onEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsDatePickerOpen(false);
        };

        if (isDatePickerOpen && isMobile) {
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

        if (isDatePickerOpen && !isMobile) {
            window.addEventListener('keydown', onEscape);
            return () => window.removeEventListener('keydown', onEscape);
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
        if (roomSlug) params.set('room', roomSlug);

        router.push(`/book/search?${params.toString()}`);
    };

    // Check if we're on mobile view
    const isMobileView = (viewportWidth ?? 1024) < 768;

    return (
        <div className={`${isMobileView
            ? 'fixed bottom-0 left-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#1C1C1C]/5 py-2 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]'
            : 'w-full bg-gradient-to-r from-[#1C2622] via-[#2B3A34] to-[#1C2622] py-4 px-4 md:px-6 rounded-xl shadow-lg'
            }`}>
            {isDatePickerOpen && (
                <>
                    <button
                        aria-label="Close date picker"
                        className="fixed inset-0 z-40 bg-black/35"
                        onClick={() => setIsDatePickerOpen(false)}
                    />
                    {isMobile ? (
                        <div className="fixed inset-x-0 bottom-0 z-50 flex items-end justify-center p-2 overscroll-none">
                            <LuxuryDatePicker
                                date={date}
                                setDate={setDate}
                                onClose={() => setIsDatePickerOpen(false)}
                                className="w-full max-w-[860px] rounded-t-3xl max-h-[90vh] overflow-auto overscroll-contain"
                            />
                        </div>
                    ) : (
                        <div className="fixed inset-0 z-50 flex items-end justify-center p-6 pb-[112px]">
                            <LuxuryDatePicker
                                date={date}
                                setDate={setDate}
                                onClose={() => setIsDatePickerOpen(false)}
                                className="w-full max-w-[860px] rounded-3xl max-h-[80vh] overflow-auto overscroll-contain"
                            />
                        </div>
                    )}
                </>
            )}

            <div className={`max-w-[1400px] mx-auto ${isMobileView ? 'px-6 md:px-12' : ''} flex ${isMobileView ? 'flex-col xl:flex-row' : 'flex-col md:flex-row'} items-center justify-between gap-4 md:gap-6 relative`}>
                <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsDatePickerOpen(true)}
                            className={`flex ${isMobileView
                                ? 'bg-white border border-[#1C1C1C]/10 shadow-sm hover:border-[#1C1C1C]/30'
                                : 'bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20'
                                } px-4 py-2.5 ${isMobileView ? 'rounded-sm' : 'rounded-lg'} items-center gap-3 transition-colors min-w-[260px] text-left`}
                        >
                            <span className={`text-sm font-medium ${isMobileView ? 'text-[#1C1C1C]' : 'text-white'}`}>
                                {date?.from ? format(date.from, 'EEE, d MMM yyyy') : 'Select Date'}
                            </span>
                            <span className={`text-xs ${isMobileView ? 'text-[#7C746B]' : 'text-[#E7D4AD]'}`}>→</span>
                            <span className={`text-sm font-medium ${isMobileView ? 'text-[#1C1C1C]' : 'text-white'}`}>
                                {date?.to ? format(date.to, 'EEE, d MMM yyyy') : 'Select Date'}
                            </span>
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className={`font-bold text-sm hidden md:inline ${isMobileView ? 'text-[#1C1C1C]' : 'text-[#E7D4AD]'}`}>Guests</span>

                        <div className={`flex ${isMobileView
                            ? 'bg-white border border-[#1C1C1C]/10 shadow-sm hover:border-[#1C1C1C]/30'
                            : 'bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20'
                            } px-3 py-2.5 ${isMobileView ? 'rounded-sm' : 'rounded-lg'} items-center gap-3 transition-colors`}>
                            <span className={`text-sm ${isMobileView ? 'text-[#1C1C1C]' : 'text-white'}`}>Adult</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setGuests(p => ({ ...p, adults: Math.max(1, p.adults - 1) }))}
                                    className={`w-5 h-5 flex items-center justify-center rounded-full border text-[10px] transition-colors ${isMobileView
                                        ? 'border-[#1C1C1C]/20 hover:bg-[#1C1C1C] hover:text-white'
                                        : 'border-[#E7D4AD]/40 text-[#E7D4AD] hover:bg-[#E7D4AD] hover:text-[#1C2622]'}`}
                                >-</button>
                                <span className={`text-sm font-medium w-3 text-center ${isMobileView ? 'text-[#1C1C1C]' : 'text-white'}`}>{guests.adults}</span>
                                <button
                                    onClick={() => setGuests(p => ({ ...p, adults: Math.min(8, p.adults + 1) }))}
                                    className={`w-5 h-5 flex items-center justify-center rounded-full border text-[10px] transition-colors ${isMobileView
                                        ? 'border-[#1C1C1C]/20 hover:bg-[#1C1C1C] hover:text-white'
                                        : 'border-[#E7D4AD]/40 text-[#E7D4AD] hover:bg-[#E7D4AD] hover:text-[#1C2622]'}`}
                                >+</button>
                            </div>
                        </div>

                        <div className={`flex ${isMobileView
                            ? 'bg-white border border-[#1C1C1C]/10 shadow-sm hover:border-[#1C1C1C]/30'
                            : 'bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20'
                            } px-3 py-2.5 ${isMobileView ? 'rounded-sm' : 'rounded-lg'} items-center gap-3 transition-colors`}>
                            <span className={`text-sm ${isMobileView ? 'text-[#1C1C1C]' : 'text-white'}`}>Children</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setGuests(p => ({ ...p, children: Math.max(0, p.children - 1) }))}
                                    className={`w-5 h-5 flex items-center justify-center rounded-full border text-[10px] transition-colors ${isMobileView
                                        ? 'border-[#1C1C1C]/20 hover:bg-[#1C1C1C] hover:text-white'
                                        : 'border-[#E7D4AD]/40 text-[#E7D4AD] hover:bg-[#E7D4AD] hover:text-[#1C2622]'}`}
                                >-</button>
                                <span className={`text-sm font-medium w-3 text-center ${isMobileView ? 'text-[#1C1C1C]' : 'text-white'}`}>{guests.children}</span>
                                <button
                                    onClick={() => setGuests(p => ({ ...p, children: Math.min(6, p.children + 1) }))}
                                    className={`w-5 h-5 flex items-center justify-center rounded-full border text-[10px] transition-colors ${isMobileView
                                        ? 'border-[#1C1C1C]/20 hover:bg-[#1C1C1C] hover:text-white'
                                        : 'border-[#E7D4AD]/40 text-[#E7D4AD] hover:bg-[#E7D4AD] hover:text-[#1C2622]'}`}
                                >+</button>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="flex items-center gap-6 justify-center">
                    <div className={`${isMobileView ? 'hidden xl:block' : 'hidden md:block'} text-right`}>
                        <p className={`text-[10px] uppercase tracking-[0.2em] ${isMobileView ? 'text-[#6B645C]' : 'text-[#E7D4AD]'}`}>From</p>
                        <p className={`text-lg font-serif ${isMobileView ? 'text-[#1C1C1C]' : 'text-white'}`}>{formatCurrency(basePrice)}<span className={`text-xs font-sans ${isMobileView ? 'text-[#59544D]' : 'text-[#B9AA90]'}`}> / night</span></p>
                    </div>

                    <button
                        onClick={handleSearch}
                        disabled={!date?.from || !date?.to}
                        className={`${isMobileView ? 'bg-[#1C1C1C] hover:bg-[#333]' : 'bg-[#B68845] hover:bg-[#A97E3F]'} text-white px-8 py-3 text-sm font-medium transition-colors ${isMobileView ? 'rounded-sm shadow-md shadow-[#1C1C1C]/10' : 'rounded-lg shadow-md shadow-[#B68845]/20'} whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        Search Availability
                    </button>

                </div>

            </div>
        </div>
    );
}
