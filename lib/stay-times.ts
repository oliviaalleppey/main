// The hotel's standard check-in and check-out times, and how a stay date is written next to them.
//
// Stay dates are stored as plain days ('2026-12-31'). Turning one into a Date and printing it as a timestamp reads
// it as midnight UTC, which came out as "5:30:00 am" in India. A date is written as a date, and the hotel's own
// times are added beside it.

export const CHECK_IN_TIME = '2:00 PM';
export const CHECK_OUT_TIME = '12:00 PM';

/** 'dd/mm/yyyy' for a stay day, the same wherever the server happens to run. */
export function formatStayDate(day: string | Date): string {
    return new Date(day).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
}

export const formatCheckIn = (day: string | Date) => `${formatStayDate(day)}, ${CHECK_IN_TIME}`;
export const formatCheckOut = (day: string | Date) => `${formatStayDate(day)}, ${CHECK_OUT_TIME}`;
