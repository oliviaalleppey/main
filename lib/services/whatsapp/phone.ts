// The '/max' metadata set is required: the default ('min') export omits the
// number-type patterns, so getType() returns undefined for every Indian number
// and landlines would slip through as valid WhatsApp recipients. This module is
// server-only, so the larger metadata has no bundle cost.
import { parsePhoneNumberFromString, type PhoneNumber, type CountryCode } from 'libphonenumber-js/max';

/**
 * Phone number normalisation for WhatsApp.
 *
 * Every phone number entering the system passes through here. WhatsApp addresses
 * users by E.164 without the leading '+', but we store the canonical '+' form and
 * strip it only at the API boundary — that way the database always holds one
 * unambiguous representation.
 *
 * Most of the complexity below exists because real contact sheets are messy:
 * Excel coerces long digit strings to floats, staff paste two numbers into one
 * cell, and Indian numbers appear with and without the country code.
 */

const DEFAULT_REGION = (process.env.WHATSAPP_DEFAULT_REGION || 'IN') as CountryCode;

export type PhoneRejectReason =
    | 'empty'
    | 'unparseable'
    | 'invalid_number'
    | 'not_mobile'
    | 'multiple_numbers'
    | 'too_short'
    | 'too_long';

export type PhoneResult =
    | { ok: true; e164: string; national: string; country: string | undefined; wasMobile: boolean }
    | { ok: false; reason: PhoneRejectReason; detail: string; raw: string };

const REJECT_MESSAGES: Record<PhoneRejectReason, string> = {
    empty: 'No number provided',
    unparseable: 'Could not be read as a phone number',
    invalid_number: 'Not a valid number for its country',
    not_mobile: 'Looks like a landline or service number, not a mobile',
    multiple_numbers: 'Cell contains more than one number — split it into separate rows',
    too_short: 'Too few digits',
    too_long: 'Too many digits',
};

export function describeRejection(reason: PhoneRejectReason): string {
    return REJECT_MESSAGES[reason];
}

/**
 * Undo the damage spreadsheets do to phone numbers before parsing.
 *
 * Excel stores a bare digit string as a number, so a sheet exported to CSV can
 * yield '919847123456.0' or even '9.19847123456E+11'. Users also defensively
 * prefix cells with an apostrophe to force text. All of that has to go.
 */
function preClean(raw: string): string {
    let s = raw.trim();

    // Leading apostrophe from Excel's "force text" trick.
    s = s.replace(/^'+/, '');

    // Scientific notation, e.g. 9.19847123456E+11 -> 919847123456
    if (/^[\d.]+e\+?\d+$/i.test(s)) {
        const n = Number(s);
        if (Number.isFinite(n)) s = n.toFixed(0);
    }

    // Trailing '.0' / '.00' from float coercion — only when the rest is digits,
    // so we never eat a real extension separator.
    s = s.replace(/^(\+?\d[\d\s()-]*)\.0+$/, '$1');

    // Common noise: non-breaking spaces, unicode dashes, 'Tel:' prefixes.
    s = s.replace(/ /g, ' ')
        .replace(/[‐-―−]/g, '-')
        .replace(/^(tel|mob|mobile|phone|ph|whatsapp|wa)\s*[.:]?\s*/i, '');

    return s.trim();
}

/**
 * Detect cells holding two or more numbers ("9847123456 / 9847123457").
 * These must be rejected rather than silently truncated to the first one —
 * quietly dropping a guest's number is worse than making the operator fix it.
 */
function hasMultipleNumbers(s: string): boolean {
    if (/[,;/]|\bor\b|\band\b|\|/i.test(s)) {
        const digitRuns = s.match(/\d[\d\s()-]{6,}/g);
        if (digitRuns && digitRuns.length > 1) return true;
    }
    return false;
}

export function normalizePhone(raw: string | null | undefined, region: CountryCode = DEFAULT_REGION): PhoneResult {
    const original = String(raw ?? '');
    if (!original.trim()) {
        return { ok: false, reason: 'empty', detail: REJECT_MESSAGES.empty, raw: original };
    }

    const cleaned = preClean(original);
    if (!cleaned) {
        return { ok: false, reason: 'empty', detail: REJECT_MESSAGES.empty, raw: original };
    }

    if (hasMultipleNumbers(cleaned)) {
        return { ok: false, reason: 'multiple_numbers', detail: REJECT_MESSAGES.multiple_numbers, raw: original };
    }

    const digitCount = cleaned.replace(/\D/g, '').length;
    if (digitCount < 7) {
        return { ok: false, reason: 'too_short', detail: `${REJECT_MESSAGES.too_short} (${digitCount})`, raw: original };
    }
    if (digitCount > 15) {
        // E.164 caps the subscriber number at 15 digits.
        return { ok: false, reason: 'too_long', detail: `${REJECT_MESSAGES.too_long} (${digitCount})`, raw: original };
    }

    let parsed: PhoneNumber | undefined;
    try {
        parsed = parsePhoneNumberFromString(cleaned, region);

        // A 12-digit Indian number written without '+' ('919847123456') parses as
        // a national number and fails. Retry it as international.
        if (!parsed?.isValid() && /^\d{11,15}$/.test(cleaned.replace(/\D/g, ''))) {
            parsed = parsePhoneNumberFromString(`+${cleaned.replace(/\D/g, '')}`);
        }
    } catch {
        return { ok: false, reason: 'unparseable', detail: REJECT_MESSAGES.unparseable, raw: original };
    }

    if (!parsed) {
        return { ok: false, reason: 'unparseable', detail: REJECT_MESSAGES.unparseable, raw: original };
    }
    if (!parsed.isValid()) {
        return { ok: false, reason: 'invalid_number', detail: REJECT_MESSAGES.invalid_number, raw: original };
    }

    // Landlines can't receive WhatsApp. libphonenumber returns undefined for
    // ambiguous types, so treat only a definite FIXED_LINE as disqualifying —
    // rejecting on 'unknown' would throw away valid mobiles.
    const type = parsed.getType();
    const isDefinitelyFixedLine = type === 'FIXED_LINE';
    if (isDefinitelyFixedLine) {
        return { ok: false, reason: 'not_mobile', detail: REJECT_MESSAGES.not_mobile, raw: original };
    }

    return {
        ok: true,
        e164: parsed.number,
        national: parsed.formatNational(),
        country: parsed.country,
        wasMobile: type === 'MOBILE' || type === 'FIXED_LINE_OR_MOBILE',
    };
}

/** WhatsApp's API wants the E.164 digits with no leading '+'. */
export function toWhatsAppId(e164: string): string {
    return e164.replace(/^\+/, '');
}

/** Pretty form for the admin UI: +91 98471 23456 */
export function formatDisplay(e164: string): string {
    const parsed = parsePhoneNumberFromString(e164);
    return parsed?.isValid() ? parsed.formatInternational() : e164;
}

/**
 * Partially hide a number for roles without full contact access.
 * +919847123456 -> +9198•••••456
 */
export function maskPhone(e164: string): string {
    if (e164.length < 8) return '•'.repeat(e164.length);
    const head = e164.slice(0, 5);
    const tail = e164.slice(-3);
    return `${head}${'•'.repeat(Math.max(0, e164.length - 8))}${tail}`;
}

/**
 * Normalise a batch and partition it, reporting duplicates within the batch.
 * Used by the import wizard's validate step, which must never write anything.
 */
export function normalizeBatch(
    rows: { raw: string; rowNumber: number; [k: string]: unknown }[],
    region: CountryCode = DEFAULT_REGION,
) {
    const valid: { rowNumber: number; e164: string; raw: string; wasMobile: boolean }[] = [];
    const rejected: { rowNumber: number; raw: string; reason: PhoneRejectReason; detail: string }[] = [];
    const duplicates: { rowNumber: number; e164: string; firstSeenRow: number }[] = [];
    const seen = new Map<string, number>();

    for (const row of rows) {
        const result = normalizePhone(row.raw, region);
        if (!result.ok) {
            rejected.push({ rowNumber: row.rowNumber, raw: row.raw, reason: result.reason, detail: result.detail });
            continue;
        }
        const firstSeenRow = seen.get(result.e164);
        if (firstSeenRow !== undefined) {
            duplicates.push({ rowNumber: row.rowNumber, e164: result.e164, firstSeenRow });
            continue;
        }
        seen.set(result.e164, row.rowNumber);
        valid.push({ rowNumber: row.rowNumber, e164: result.e164, raw: row.raw, wasMobile: result.wasMobile });
    }

    return { valid, rejected, duplicates };
}
