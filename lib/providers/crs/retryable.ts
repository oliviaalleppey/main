/**
 * Whether a CRS failure is worth retrying.
 *
 * A retryable failure leaves the paid booking in booking_requested for the
 * watchdog to try again; anything else marks it failed and alerts reservations
 * at once. Getting this wrong in the "not retryable" direction fails a paid
 * booking over a brief Hotsoft outage, so transport and server faults all count.
 *
 * The 5xx match is a standalone three-digit code (`HTTP Error 503: …`), not any
 * digits that happen to start with 5 — "Rs 1500" in a remark or a booking
 * number like OL-1509 is not a server error.
 */
export function isRetryableProviderMessage(message: string): boolean {
    return /(timeout|timed out|temporar|unavailable|maintenance|network|fetch failed|aborted|\b5\d{2}\b|econn|enotfound|reset)/i
        .test(message);
}

export function isRetryableProviderError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (isRetryableProviderMessage(message)) return true;
    return error instanceof Error && error.name === 'AbortError';
}
