import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount / 100);
}

const ONES = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
    'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

/** 0-99 in words. */
function twoDigitsToWords(value: number): string {
    if (value < 20) return ONES[value];
    const tens = TENS[Math.floor(value / 10)];
    const ones = ONES[value % 10];
    return ones ? `${tens} ${ones}` : tens;
}

/** 0-999 in words. */
function threeDigitsToWords(value: number): string {
    const hundreds = Math.floor(value / 100);
    const rest = value % 100;
    const parts = [];
    if (hundreds) parts.push(`${ONES[hundreds]} Hundred`);
    if (rest) parts.push(twoDigitsToWords(rest));
    return parts.join(' ');
}

/**
 * A rupee amount written out, Indian numbering — crore, lakh, thousand.
 *
 * A tax invoice has to carry the amount in words, and it has to be the exact
 * amount: the "Amount in Words" line used to print rounded digits, so a bill of
 * 22,887.82 read as "Rupees 22,888 Only" — not words, and 18 paise over.
 *
 * Takes paise, the way every other money value in this codebase does.
 */
export function amountInWords(paise: number): string {
    const safe = Math.max(0, Math.round(paise));
    const rupees = Math.floor(safe / 100);
    const remainder = safe % 100;

    const chunks: string[] = [];
    const crore = Math.floor(rupees / 10_000_000);
    const lakh = Math.floor((rupees % 10_000_000) / 100_000);
    const thousand = Math.floor((rupees % 100_000) / 1000);
    const below = rupees % 1000;

    if (crore) chunks.push(`${threeDigitsToWords(crore)} Crore`);
    if (lakh) chunks.push(`${twoDigitsToWords(lakh)} Lakh`);
    if (thousand) chunks.push(`${twoDigitsToWords(thousand)} Thousand`);
    if (below) chunks.push(threeDigitsToWords(below));

    const rupeeWords = chunks.length ? chunks.join(' ') : 'Zero';
    const rupeeUnit = rupees === 1 ? 'Rupee' : 'Rupees';
    if (!remainder) return `${rupeeWords} ${rupeeUnit}`;
    return `${rupeeWords} ${rupeeUnit} and ${twoDigitsToWords(remainder)} ${remainder === 1 ? 'Paisa' : 'Paise'}`;
}

export function formatRoomName(name?: string | null) {
    const normalized = typeof name === 'string'
        ? name.trim().replace(/\s+/g, ' ')
        : '';

    if (!normalized) return 'Room';

    if (/rooms$/i.test(normalized)) {
        return normalized.replace(/rooms$/i, 'Room');
    }

    if (/room$/i.test(normalized)) {
        return normalized.replace(/room$/i, 'Room');
    }

    return `${normalized} Room`;
}
