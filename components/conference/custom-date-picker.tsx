'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface CustomDatePickerProps {
    value: string;
    onChange: (date: string) => void;
}

export default function CustomDatePicker({ value, onChange }: CustomDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const days: (number | null)[] = [];

        // Add empty slots for days before the first of the month
        for (let i = 0; i < startingDay; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return days;
    };

    const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatDisplayDate = (date: Date): string => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const handleDateClick = (day: number | null) => {
        if (day === null) return;

        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        setSelectedDate(newDate);
        onChange(formatDate(newDate));
        setIsOpen(false);
    };

    const isSelected = (day: number | null) => {
        if (day === null || !selectedDate) return false;
        return (
            day === selectedDate.getDate() &&
            currentMonth.getMonth() === selectedDate.getMonth() &&
            currentMonth.getFullYear() === selectedDate.getFullYear()
        );
    };

    const isToday = (day: number | null) => {
        if (day === null) return false;
        const today = new Date();
        return (
            day === today.getDate() &&
            currentMonth.getMonth() === today.getMonth() &&
            currentMonth.getFullYear() === today.getFullYear()
        );
    };

    const isPast = (day: number | null) => {
        if (day === null) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        return checkDate < today;
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const days = getDaysInMonth(currentMonth);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="h-14 w-full border border-[#DCD3C4] bg-[#FCFBF7] px-3.5 text-lg outline-none focus:border-[#B68A4A] cursor-pointer flex items-center justify-between hover:bg-[#F5F2EA] transition-colors"
            >
                <span className={selectedDate ? 'text-[#2C2A27]' : 'text-gray-400'}>
                    {selectedDate ? formatDisplayDate(selectedDate) : 'Select Date'}
                </span>
                <Calendar className="w-5 h-5 text-[#B68A4A]" />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-2 w-[320px] bg-white border border-[#DCD3C4] rounded-xl shadow-xl p-4">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            type="button"
                            onClick={prevMonth}
                            className="p-1 hover:bg-[#F5F2EA] rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-[#2C2A27]" />
                        </button>
                        <span className="font-semibold text-[#2C2A27]">
                            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </span>
                        <button
                            type="button"
                            onClick={nextMonth}
                            className="p-1 hover:bg-[#F5F2EA] rounded-lg transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-[#2C2A27]" />
                        </button>
                    </div>

                    {/* Day Names Header */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {dayNames.map((day) => (
                            <div key={day} className="text-center text-xs font-medium text-[#8D7B68] py-1">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, index) => (
                            <button
                                key={index}
                                type="button"
                                disabled={day === null || isPast(day)}
                                onClick={() => handleDateClick(day)}
                                className={`
                                    h-10 w-10 flex items-center justify-center rounded-lg text-sm transition-all
                                    ${day === null ? 'invisible' : ''}
                                    ${isSelected(day) ? 'bg-[#B68A4A] text-white font-semibold' : ''}
                                    ${isToday(day) && !isSelected(day) ? 'bg-[#F5F2EA] text-[#B68A4A] font-semibold' : ''}
                                    ${!isSelected(day) && !isToday(day) && !isPast(day) ? 'text-[#2C2A27] hover:bg-[#F5F2EA]' : ''}
                                    ${isPast(day) ? 'text-gray-300 cursor-not-allowed' : ''}
                                `}
                            >
                                {day}
                            </button>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-4 pt-3 border-t border-[#E8E0D2] flex gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                const today = new Date();
                                setSelectedDate(today);
                                onChange(formatDate(today));
                                setCurrentMonth(today);
                                setIsOpen(false);
                            }}
                            className="flex-1 py-2 text-xs font-medium text-[#B68A4A] hover:bg-[#F5F2EA] rounded-lg transition-colors"
                        >
                            Today
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedDate(null);
                                onChange('');
                                setIsOpen(false);
                            }}
                            className="flex-1 py-2 text-xs font-medium text-gray-500 hover:bg-[#F5F2EA] rounded-lg transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
