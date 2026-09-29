/**
 * What an administrator may do to a booking, decided from its state alone.
 * Pure, so the rules are pinned by tests rather than by reading the UI.
 *
 * The shape of it: once money has been taken, a booking is a financial record.
 * It can be cancelled and later marked refunded — both keep the booking, its
 * payment rows and its history — but it can never be deleted, because deleting
 * erased the record a GST invoice was issued against.
 */

export type BookingForAdmin = {
    status: string | null;
    /** bookings.payment_status */
    paymentStatus: string | null;
    /** Whether any payments row for the booking reached 'success'. */
    hasSuccessfulPayment: boolean;
};

/** Money was taken at some point — including a payment later refunded. */
export function moneyWasTaken(booking: BookingForAdmin): boolean {
    return booking.hasSuccessfulPayment
        || booking.paymentStatus === 'success'
        || booking.paymentStatus === 'refunded';
}

/**
 * Paid bookings only: confirmed, or paid and still waiting on Hotsoft. An
 * unpaid, abandoned checkout needs no cancelling, and cancelling one would
 * race a payment that is still in flight at the bank.
 */
const CANCELLABLE = new Set(['confirmed', 'payment_success', 'booking_requested']);

export function canCancel(booking: BookingForAdmin): boolean {
    return CANCELLABLE.has(booking.status ?? '') && moneyWasTaken(booking);
}

/**
 * Recording a refund made by hand in Easebuzz. A cancelled booking, or one that
 * failed after payment (Hotsoft rejected it), and only once.
 */
export function canMarkRefunded(booking: BookingForAdmin): boolean {
    return (booking.status === 'cancelled' || booking.status === 'failed')
        && moneyWasTaken(booking)
        && booking.paymentStatus !== 'refunded';
}

export function canDelete(booking: BookingForAdmin): boolean {
    return !moneyWasTaken(booking);
}
