'use client';

import * as React from 'react';
import { addDays, format, differenceInDays } from 'date-fns';
import { DateRange, DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

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
    const [selectedDate, setSelectedDate] = React.useState<DateRange | undefined>(date);
    const [month, setMonth] = React.useState<Date>(date?.from || new Date());

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

    // Calculate nights
    const nights = selectedDate?.from && selectedDate?.to
        ? differenceInDays(selectedDate.to, selectedDate.from)
        : 0;

    return (
        <div className={cn(
            "bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-100 p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200",
            "w-[350px] md:w-[800px]", // Responsive width
            className
        )}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header: Dates & Nights */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-6 border-b border-gray-100 gap-4">
                <div className="flex gap-8">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-1">Check-in</p>
                        <p className="text-xl font-serif font-medium text-gray-900">
                            {selectedDate?.from ? format(selectedDate.from, 'd MMM yyyy') : 'Select Date'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-1">Check-out</p>
                        <p className="text-xl font-serif font-medium text-gray-900">
                            {selectedDate?.to ? format(selectedDate.to, 'd MMM yyyy') : 'Select Date'}
                        </p>
                    </div>
                </div>

                {nights > 0 && (
                    <div className="bg-[#E95D20]/10 text-[#E95D20] px-4 py-1.5 rounded-full text-sm font-medium">
                        {nights} {nights === 1 ? 'Night' : 'Nights'} Stay
                    </div>
                )}
            </div>

            {/* Custom Styles for React Day Picker */}
            <style jsx global>{`
                .rdp {
                    margin: 0;
                    --rdp-accent-color: #E95D20;
                    --rdp-background-color: #E95D20;
                }
                .rdp-months {
                    justify-content: center;
                    gap: 2rem;
                    display: flex;
                } 
                .rdp-month {
                    width: 100%;
                }
                .rdp-table {
                    width: 100%;
                    border-collapse: collapse;
                    display: table !important;
                    table-layout: fixed;
                }
                .rdp-head {
                    display: table-header-group !important;
                }
                .rdp-tbody {
                    display: table-row-group !important;
                }
                .rdp-head_row {
                    display: table-row !important;
                }
                .rdp-row {
                    display: table-row !important;
                }
                .rdp-head_cell {
                    display: table-cell !important;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: #9CA3AF;
                    padding-bottom: 1rem;
                    text-align: center;
                    width: 44px;
                }
                .rdp-cell {
                    display: table-cell !important;
                    text-align: center;
                    padding: 2px;
                    width: 44px;
                    height: 44px;
                }
                .rdp-caption_label {
                    font-family: serif;
                    font-size: 1.5rem;
                    font-weight: 500;
                    color: #111;
                }
                .rdp-nav_button {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%; 
                    background-color: transparent;
                }
                .rdp-nav_button:hover {
                    background-color: #f3f4f6;
                }
                .rdp-day {
                    font-size: 0.95rem;
                    font-weight: 500;
                    width: 44px;
                    height: 44px;
                    border-radius: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .rdp-day_selected:not([disabled]) { 
                    background-color: var(--rdp-accent-color);
                    color: white;
                }
                .rdp-day_range_start {
                    border-top-left-radius: 50%;
                    border-bottom-left-radius: 50%;
                }
                .rdp-day_range_end {
                    border-top-right-radius: 50%;
                    border-bottom-right-radius: 50%;
                }
                .rdp-day_range_middle {
                    background-color: rgba(233, 93, 32, 0.1) !important;
                    color: #E95D20 !important; 
                    border-radius: 0 !important;
                }
                .rdp-day:hover:not(.rdp-day_selected) {
                    background-color: #f3f4f6;
                    border-radius: 50%;
                }
                .rdp-button_reset {
                    display: none;
                }
            `}</style>

            {/* Calendar */}
            <div className="flex justify-center">
                <DayPicker
                    mode="range"
                    selected={selectedDate}
                    onSelect={handleSelect}
                    month={month}
                    onMonthChange={setMonth}
                    numberOfMonths={2}
                    pagedNavigation
                    showOutsideDays={false}
                    disabled={{ before: new Date() }}
                    classNames={{
                        months: "flex flex-col md:flex-row space-y-4 md:space-x-12 md:space-y-0",
                        month: "space-y-4",
                        caption: "flex justify-center relative items-center mb-6",
                        nav: "absolute top-0 w-full flex justify-between items-center px-1",
                        nav_button_previous: "absolute -left-4",
                        nav_button_next: "absolute -right-4 top-0",
                        table: "w-full border-collapse",
                        head_row: "mb-2",
                        row: "mt-2",
                        day: "transition-all bg-transparent data-[selected]:opacity-100",
                    }}
                    components={{
                        Chevron: (props) => {
                            if (props.orientation === 'left') {
                                return <ChevronLeft className="h-5 w-5 text-gray-600" />;
                            }
                            return <ChevronRight className="h-5 w-5 text-gray-600" />;
                        }
                    }}
                />
            </div>

            {/* Footer Actions */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                <button
                    onClick={handleClear}
                    className="text-sm font-medium text-gray-500 hover:text-black transition-colors"
                >
                    Clear Dates
                </button>
                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={!selectedDate?.from || !selectedDate?.to}
                        className="bg-black text-white px-8 py-3 rounded-full text-sm font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        Apply Dates
                    </button>
                </div>
            </div>
        </div>
    );
}
