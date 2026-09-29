/**
 * A mailing-list address, trimmed and lower-cased so the same person signing up
 * as Asha@Gmail.com and asha@gmail.com is one subscriber. Null if unusable.
 */
export function normaliseSubscriberEmail(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const email = value.trim().toLowerCase();
    if (email.length > 254) return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
