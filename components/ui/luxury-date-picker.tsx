'use client';

import * as React from 'react';
import { addDays, addMonths, differenceInDays, format, startOfDay } from 'date-fns';
import { DateRange, DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface LuxuryDatePickerProps {
    date: DateRange | undefined;
    setDate: (date: DateRange | undefined) => void;
    onClose: () => void;
    className?: string;
}

export function LuxuryDatePicker({
    date,
    setDate,
    onClose,
    className,
}: LuxuryDatePickerProps) {
    const today = startOfDay(new Date());
    const [selectedDate, setSelectedDate] = React.useState<DateRange | undefined>(date);
    const [month, setMonth] = React.useState<Date>(date?.from || new Date());
    const [monthsToShow, setMonthsToShow] = React.useState(2);

    React.useEffect(() => {
        const handleResize = () => {
            setMonthsToShow(window.innerWidth < 768 ? 1 : 2);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Sync internal state if external prop changes (optional, but good for consistency)
    React.useEffect(() => {
        if (date) {
            setSelectedDate(date);
            if (date.from) {
                setMonth(date.from);
            }
        }
    }, [date]);

    // Handle range selection
    const handleSelect = (range: DateRange | undefined) => {
        setSelectedDate(range);
    };

    // Apply button handler
    const handleApply = () => {
        setDate(selectedDate);
        onClose();
    };

    // Clear button handler
    const handleClear = () => {
        setSelectedDate(undefined);
    };

    const handlePreset = (nights: number) => {
        const from = today;
        const to = addDays(from, nights);
        setSelectedDate({ from, to });
        setMonth(from);
    };

    const goToPreviousMonth = () => {
        setMonth((current) => addMonths(current, -1));
    };

    const goToNextMonth = () => {
        setMonth((current) => addMonths(current, 1));
    };

    // Calculate nights
    const nights = selectedDate?.from && selectedDate?.to
        ? differenceInDays(selectedDate.to, selectedDate.from)
        : 0;

    return (
        <div className={cn(
            "bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-200 p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200",
            "w-[350px] md:w-[860px]", // Responsive width
            className
        )}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header: Dates & Nights */}
            <div className="mb-6 border-b border-gray-200 pb-6">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-5 sm:gap-7 md:gap-9">
                        <div className="min-w-[220px]">
                            <p className="text-[12px] uppercase tracking-[0.2em] text-slate-500 font-semibold mb-2">Check-in</p>
                            <p className="text-[32px] leading-none font-sans font-semibold tracking-[-0.02em] text-[#0A332B]">
                                {selectedDate?.from ? format(selectedDate.from, 'd MMM yyyy') : 'Select Date'}
                            </p>
                        </div>
                        <div className="hidden sm:block h-14 w-px bg-gray-200" />
                        <div className="min-w-[220px]">
                            <p className="text-[12px] uppercase tracking-[0.2em] text-slate-500 font-semibold mb-2">Check-out</p>
                            <p className="text-[32px] leading-none font-sans font-semibold tracking-[-0.02em] text-[#0A332B]">
                                {selectedDate?.to ? format(selectedDate.to, 'd MMM yyyy') : 'Select Date'}
                            </p>
                        </div>
                    </div>

                    {nights > 0 && (
                        <div className="bg-[#E95D20]/10 text-[#E95D20] px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap">
                            {nights} {nights === 1 ? 'Night' : 'Nights'} Stay
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-5">
                <button
                    onClick={() => handlePreset(1)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide border border-gray-300 text-gray-800 hover:border-[#0A332B] hover:text-[#0A332B] transition-colors"
                >
                    1 Night
                </button>
                <button
                    onClick={() => handlePreset(2)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide border border-gray-300 text-gray-800 hover:border-[#0A332B] hover:text-[#0A332B] transition-colors"
                >
                    2 Nights
                </button>
                <button
                    onClick={() => handlePreset(3)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide border border-gray-300 text-gray-800 hover:border-[#0A332B] hover:text-[#0A332B] transition-colors"
                >
                    Weekend Escape
                </button>
            </div>

            {/* Custom Styles for React Day Picker */}
            <style jsx global>{`
                .luxury-rdp {
                    margin: 0 auto;
                    --rdp-accent-color: #0A332B;
                    --rdp-accent-background-color: rgba(10, 51, 43, 0.12);
                    --rdp-day-width: 44px;
                    --rdp-day-height: 44px;
                    --rdp-day_button-width: 40px;
                    --rdp-day_button-height: 40px;
                    --rdp-nav-height: 2.5rem;
                    --rdp-months-gap: 2rem;
                }

                .luxury-rdp .rdp-months {
                    justify-content: center;
                    display: flex;
                    gap: 2rem;
                }

                .luxury-rdp .rdp-month {
                    width: fit-content;
                }

                .luxury-rdp .rdp-month_caption {
                    justify-content: center;
                    margin-bottom: 0.35rem;
                }

                .luxury-rdp .rdp-caption_label {
                    font-family: serif;
                    font-size: 1.5rem;
                    line-height: 1.2;
                    font-weight: 500;
                    color: #0f172a;
                    white-space: nowrap;
                }

                .luxury-rdp .rdp-month_grid {
                    width: auto;
                    border-collapse: separate;
                    border-spacing: 0 2px;
                    margin: 0 auto;
                }

                .luxury-rdp .rdp-weekday {
                    width: 44px;
                    height: 32px;
                    padding: 0;
                    text-align: center;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #475569;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                }

                .luxury-rdp .rdp-day {
                    width: 44px;
                    height: 44px;
                    text-align: center;
                    padding: 0;
                }

                .luxury-rdp .rdp-day_button {
                    width: 40px;
                    height: 40px;
                    margin: 0 auto;
                    border-radius: 999px;
                    border: 1px solid transparent;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                    font-weight: 600;
                    color: #1f2937;
                    transition: transform 0.14s ease, background-color 0.14s ease, color 0.14s ease, border-color 0.14s ease;
                }

                .luxury-rdp .rdp-day_button:hover:not(:disabled) {
                    background-color: #e8eee9;
                    transform: scale(1.04);
                }

                .luxury-rdp .rdp-day_button:active:not(:disabled) {
                    transform: scale(0.96);
                }

                .luxury-rdp .rdp-day_button:focus-visible {
                    outline: 2px solid #0A332B;
                    outline-offset: 2px;
                }

                .luxury-rdp .rdp-today .rdp-day_button {
                    border-color: rgba(10, 51, 43, 0.55);
                }

                .luxury-rdp .rdp-selected .rdp-day_button,
                .luxury-rdp .rdp-range_start .rdp-day_button,
                .luxury-rdp .rdp-range_end .rdp-day_button {
                    background-color: #0A332B;
                    color: #ffffff;
                    border-color: #0A332B;
                }

                .luxury-rdp .rdp-range_start {
                    background: linear-gradient(to right, transparent 50%, rgba(10, 51, 43, 0.12) 50%);
                }

                .luxury-rdp .rdp-range_end {
                    background: linear-gradient(to right, rgba(10, 51, 43, 0.12) 50%, transparent 50%);
                }

                .luxury-rdp .rdp-range_middle {
                    background-color: rgba(10, 51, 43, 0.12);
                }

                .luxury-rdp .rdp-range_middle .rdp-day_button {
                    border-radius: 0;
                    background-color: transparent;
                    color: #0A332B;
                }

                .luxury-rdp .rdp-disabled .rdp-day_button {
                    color: #cbd5e1;
                    opacity: 1;
                    text-decoration: line-through;
                    text-decoration-thickness: 1px;
                    text-decoration-color: #e2e8f0;
                }

                .luxury-rdp .rdp-outside .rdp-day_button {
                    color: #cbd5e1;
                    opacity: 0.5;
                }

                .luxury-rdp .rdp-hidden {
                    visibility: hidden;
                }

                @media (max-width: 768px) {
                    .luxury-rdp {
                        --rdp-day-width: 40px;
                        --rdp-day-height: 40px;
                        --rdp-day_button-width: 36px;
                        --rdp-day_button-height: 36px;
                    }

                    .luxury-rdp .rdp-caption_label {
                        font-size: 1.4rem;
                    }
                }
            `}</style>

            {/* Calendar */}
            <div className="relative flex justify-center pb-1">
                <div className="relative mx-auto w-fit">
                    <div className="pointer-events-none absolute inset-x-0 top-[-8px] z-10 flex items-center justify-between md:inset-y-auto md:top-[58%] md:-translate-y-1/2">
                        <button
                            type="button"
                            aria-label="Previous month"
                            onClick={goToPreviousMonth}
                            className="pointer-events-auto inline-flex h-10 w-10 -translate-x-3 items-center justify-center rounded-full border border-gray-300 bg-white/95 text-gray-700 shadow-sm transition-colors hover:border-[#0A332B] hover:bg-[#0A332B] hover:text-white md:-translate-x-14"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            aria-label="Next month"
                            onClick={goToNextMonth}
                            className="pointer-events-auto inline-flex h-10 w-10 translate-x-3 items-center justify-center rounded-full border border-gray-300 bg-white/95 text-gray-700 shadow-sm transition-colors hover:border-[#0A332B] hover:bg-[#0A332B] hover:text-white md:translate-x-14"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>

                    <DayPicker
                        mode="range"
                        selected={selectedDate}
                        onSelect={handleSelect}
                        month={month}
                        onMonthChange={setMonth}
                        numberOfMonths={monthsToShow}
                        hideNavigation
                        showOutsideDays={false}
                        disabled={{ before: today }}
                        className="luxury-rdp"
                        classNames={{
                            months: "flex flex-col md:flex-row items-start justify-center gap-6 md:gap-8",
                            month: "shrink-0",
                            month_caption: "relative flex items-center justify-center",
                            month_grid: "mx-auto",
                        }}
                    />
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-200">
                <button
                    onClick={handleClear}
                    className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors text-left"
                >
                    Clear Dates
                </button>
                <div className="flex w-full sm:w-auto items-center justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-2 py-2 text-sm font-bold uppercase tracking-[0.08em] text-gray-900 hover:opacity-70 transition-opacity"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={!selectedDate?.from || !selectedDate?.to || nights < 1}
                        className="bg-[#0F1115] text-white min-w-[196px] px-8 py-3.5 rounded-full text-sm font-bold uppercase tracking-[0.08em] hover:bg-black transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-[0_8px_20px_-10px_rgba(0,0,0,0.55)]"
                    >
                        Apply Dates
                    </button>
                </div>
            </div>
        </div>
    );
}
