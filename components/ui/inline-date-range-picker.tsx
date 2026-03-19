'use client';

import * as React from 'react';
import { DayPicker, DayButton, type DateRange, type DayButtonProps } from 'react-day-picker';
import { startOfDay, format } from 'date-fns';
import { cn } from '@/lib/utils';

type InlineDateRangePickerProps = {
    mode?: 'range' | 'single' | 'multiple';
    value?: DateRange | undefined;
    onChange?: (next: DateRange | undefined) => void;
    multipleDates?: Date[];
    onMultipleDatesChange?: (next: Date[]) => void;
    prices?: Record<string, number>;
    basePrice?: number;
    className?: string;
};

export function InlineDateRangePicker({
    mode = 'range',
    value,
    onChange,
    multipleDates,
    onMultipleDatesChange,
    prices,
    basePrice,
    className
}: InlineDateRangePickerProps) {
    const today = startOfDay(new Date());
    const [month, setMonth] = React.useState<Date>(value?.from || multipleDates?.[0] || new Date());
    const [monthsToShow, setMonthsToShow] = React.useState(2);

    React.useEffect(() => {
        const handleResize = () => setMonthsToShow(window.innerWidth < 768 ? 1 : 2);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    React.useEffect(() => {
        if (value?.from) setMonth(value.from);
        else if (multipleDates?.[0]) setMonth(multipleDates[0]);
    }, [multipleDates, value?.from]);

    return (
        <div className={cn("w-full", className)}>
            <style jsx global>{`
                .admin-rdp {
                    --rdp-accent-color: #0A332B;
                    --rdp-accent-background-color: rgba(10, 51, 43, 0.12);
                    --rdp-outline: 2px solid rgba(10, 51, 43, 0.35);
                    --rdp-outline-selected: 2px solid rgba(10, 51, 43, 0.35);
                    margin: 0;
                    padding: 4px 6px;
                }
                .admin-rdp .rdp-caption_label {
                    font-size: 1rem;
                    font-weight: 650;
                    color: #111827;
                }
                .admin-rdp .rdp-weekday {
                    font-size: 0.7rem;
                    font-weight: 800;
                    letter-spacing: 0.08em;
                    color: #6b7280;
                    text-transform: uppercase;
                }
                .admin-rdp .rdp-months {
                    display: flex;
                    flex-direction: row;
                    flex-wrap: nowrap;
                    gap: 1.75rem;
                }
                .admin-rdp .rdp-month {
                    flex-shrink: 0;
                }
                .admin-rdp .rdp-month_grid {
                    border-collapse: separate;
                    border-spacing: 0 6px;
                }
                .admin-rdp .rdp-day {
                    padding: 0 4px;
                }
                .admin-rdp .rdp-day_button {
                    border-radius: 12px;
                    font-weight: 650;
                    height: 48px;
                    width: 44px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    transition: background-color 140ms ease, color 140ms ease, transform 120ms ease;
                }
                .admin-rdp .rdp-day_button:hover:not(:disabled) {
                    background: #f3f4f6;
                    transform: translateY(-1px);
                }
                .admin-rdp .rdp-selected .rdp-day_button,
                .admin-rdp .rdp-range_start .rdp-day_button,
                .admin-rdp .rdp-range_end .rdp-day_button {
                    background: #0A332B;
                    color: #fff;
                }
                .admin-rdp .rdp-range_middle {
                    background: rgba(10, 51, 43, 0.12);
                }
                .admin-rdp .rdp-range_middle .rdp-day_button {
                    background: transparent;
                    color: #0A332B;
                    border-radius: 0;
                }
                .admin-rdp .rdp-range_start,
                .admin-rdp .rdp-range_end,
                .admin-rdp .rdp-range_middle {
                    border-radius: 999px;
                }
                .admin-rdp .rdp-today .rdp-day_button {
                    border: 1px solid rgba(10, 51, 43, 0.35);
                }
                .admin-rdp .rdp-disabled .rdp-day_button {
                    color: #cbd5e1;
                    opacity: 1;
                    text-decoration: line-through;
                    text-decoration-thickness: 1px;
                    text-decoration-color: #e2e8f0;
                }
            `}</style>

            {(() => {
                const CustomDayButton = (props: DayButtonProps) => {
                    const { day, modifiers, className, ...buttonProps } = props;
                    const dateStr = format(day.date, 'yyyy-MM-dd');
                    const hasOverride = prices && prices[dateStr] !== undefined;
                    const displayPrice = hasOverride ? prices![dateStr] : basePrice;
                    const isBasePrice = displayPrice === basePrice;
                    const shouldDisplay = displayPrice !== undefined;
                    return (
                        <button {...buttonProps} className={className}>
                            <span>{day.date.getDate()}</span>
                            {shouldDisplay && (
                                <span className={cn(
                                    "text-[9px] leading-none mt-1",
                                    !isBasePrice ? "font-bold text-emerald-600" : "font-semibold text-gray-400"
                                )}>
                                    ₹{displayPrice}
                                </span>
                            )}
                        </button>
                    );
                };

                if (mode === 'single') {
                    return (
                        <DayPicker
                            mode="single"
                            selected={value?.from || undefined}
                            onSelect={(date) => onChange?.(date ? { from: date, to: date } : undefined)}
                            month={month}
                            onMonthChange={setMonth}
                            numberOfMonths={monthsToShow}
                            showOutsideDays={false}
                            disabled={{ before: today }}
                            className="admin-rdp"
                            components={{ DayButton: CustomDayButton }}
                        />
                    );
                } else if (mode === 'multiple') {
                    return (
                        <DayPicker
                            mode="multiple"
                            selected={multipleDates || []}
                            onSelect={(dates) => onMultipleDatesChange?.(Array.isArray(dates) ? dates : [])}
                            month={month}
                            onMonthChange={setMonth}
                            numberOfMonths={monthsToShow}
                            showOutsideDays={false}
                            disabled={{ before: today }}
                            className="admin-rdp"
                            components={{ DayButton: CustomDayButton }}
                        />
                    );
                } else {
                    return (
                        <DayPicker
                            mode="range"
                            selected={value}
                            onSelect={(range) => onChange?.(range)}
                            month={month}
                            onMonthChange={setMonth}
                            numberOfMonths={monthsToShow}
                            showOutsideDays={false}
                            disabled={{ before: today }}
                            className="admin-rdp"
                            components={{ DayButton: CustomDayButton }}
                        />
                    );
                }
            })()}
        </div>
    );
}

