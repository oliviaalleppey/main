/**
 * The guest's stay dates, as calendar days.
 *
 * Dates cross from the browser as 'yyyy-MM-dd' strings. They used to be Date
 * objects built by the picker at local midnight, which the server read back in
 * UTC — so in IST every edited stay moved one day earlier, and the guest was
 * charged for, and Hotsoft was sent, nights they never chose. A calendar day
 * has no time zone; keeping it a string until here means nothing can shift it.
 *
 * Each day becomes UTC midnight, the same basis every other date in the booking
 * flow uses.
 */

export type StayDates = {
    checkIn: Date;
    checkOut: Date;
    adults: number;
    children: number;
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** UTC midnight of a 'yyyy-MM-dd' day, or null if it is not a real date. */
export function parseCalendarDay(value: unknown): Date | null {
    const text = String(value ?? '');
    if (!DATE_ONLY.test(text)) return null;
    const date = new Date(`${text}T00:00:00Z`);
    // JavaScript rolls 2026-02-30 over to 2 March rather than rejecting it, so a
    // date only counts if it reads back as the same day it was given.
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text) return null;
    return date;
}

export function parseStayDates(input: {
    checkIn: unknown;
    checkOut: unknown;
    adults: unknown;
    children: unknown;
}): { ok: true; stay: StayDates } | { ok: false; message: string } {
    const checkIn = parseCalendarDay(input.checkIn);
    const checkOut = parseCalendarDay(input.checkOut);
    if (!checkIn || !checkOut) {
        return { ok: false, message: 'Please choose valid dates.' };
    }
    if (checkOut <= checkIn) {
        return { ok: false, message: 'Check-out must be after check-in.' };
    }

    return {
        ok: true,
        stay: {
            checkIn,
            checkOut,
            adults: Math.max(1, Math.floor(Number(input.adults) || 1)),
            children: Math.max(0, Math.floor(Number(input.children) || 0)),
        },
    };
}
