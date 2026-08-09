import { createHash } from 'crypto';

/**
 * A/B testing for campaigns.
 *
 * Variants are separate `wa_campaigns` rows linked by `variant_of`, which the
 * schema already anticipated. That choice pays off everywhere downstream: every
 * counter, cost figure, stop rule and attribution row is per-campaign already,
 * so a variant gets all of them for free and needs no special-casing.
 *
 * A caveat this module states rather than hides: with the volume this hotel
 * currently has — 90 bookings in the system and 42 distinct guest numbers — the
 * booking rate will not reach significance on any realistic campaign. So the
 * winner is declared on read rate, which accumulates thousands of observations
 * per send, and bookings are reported as directional with the sample size shown.
 * Declaring a winner on three bookings versus one is how people talk themselves
 * into a worse template.
 */

export type Variant = 'A' | 'B';

/**
 * Which arm a contact belongs to.
 *
 * Deterministic on (campaign, contact), not random, for two reasons:
 *
 *  1. Rebuilding a queue — which the idempotency key makes safe and therefore
 *     likely — must not move people between arms. A random assignment would
 *     reshuffle on every rebuild and quietly corrupt the comparison.
 *  2. A contact must never receive both variants of the same message. Hashing
 *     the pair guarantees that without storing an assignment table.
 *
 * The parent campaign id is used as the salt, so a contact who is bucketed into
 * A for one test is not systematically in A for every future test — otherwise
 * the same half of the list would receive every variant A for ever, and the
 * "difference between arms" would slowly become a difference between people.
 */
export function assignVariant(
    parentCampaignId: string,
    contactId: string,
    splitPercent = 50,
): Variant {
    if (splitPercent <= 0) return 'B';
    if (splitPercent >= 100) return 'A';

    const digest = createHash('sha256')
        .update(`${parentCampaignId}:${contactId}`)
        .digest();

    // First 4 bytes as an unsigned int, mapped onto 0–99.
    const bucket = digest.readUInt32BE(0) % 100;
    return bucket < splitPercent ? 'A' : 'B';
}

export type VariantStats = {
    label: Variant | string;
    campaignId: string;
    sent: number;
    delivered: number;
    read: number;
    optedOut: number;
    clicks: number;
    bookings: number;
    revenue: number;
    readRate: number;
    clickRate: number;
    optOutRate: number;
};

export type Significance = {
    /** Difference in read rate, B minus A, in percentage points. */
    liftPoints: number;
    zScore: number;
    /** Two-tailed p-value from the normal approximation. */
    pValue: number;
    significant: boolean;
    /** Set when the sample is too small for the normal approximation to hold. */
    caveat: string | null;
};

/**
 * Standard normal CDF via the Abramowitz & Stegun 7.1.26 erf approximation.
 * Accurate to ~1.5e-7, which is several orders of magnitude better than the
 * precision anyone reads off a dashboard.
 */
function normalCdf(z: number): number {
    const sign = z < 0 ? -1 : 1;
    const x = Math.abs(z) / Math.SQRT2;

    const t = 1 / (1 + 0.3275911 * x);
    const y =
        1 -
        ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
            0.254829592) *
            t *
            Math.exp(-x * x);

    return 0.5 * (1 + sign * y);
}

/**
 * Two-proportion z-test on read rate.
 *
 * Read rate is the metric because it is the one with enough observations to
 * move: a 5,000-recipient send produces thousands of delivered messages, where
 * it produces a handful of bookings at best.
 *
 * `caveat` is deliberately part of the return type rather than a footnote in the
 * UI. The normal approximation needs roughly 5 successes and 5 failures per arm;
 * below that the p-value is not wrong so much as meaningless, and a bare
 * "p = 0.03" next to two arms of nine people is worse than no number at all.
 */
export function readRateSignificance(a: VariantStats, b: VariantStats): Significance {
    const nA = a.delivered;
    const nB = b.delivered;

    if (nA === 0 || nB === 0) {
        return {
            liftPoints: 0,
            zScore: 0,
            pValue: 1,
            significant: false,
            caveat: 'One arm has no delivered messages yet.',
        };
    }

    const pA = a.read / nA;
    const pB = b.read / nB;
    const pooled = (a.read + b.read) / (nA + nB);
    const standardError = Math.sqrt(pooled * (1 - pooled) * (1 / nA + 1 / nB));

    if (standardError === 0) {
        return {
            liftPoints: 0,
            zScore: 0,
            pValue: 1,
            significant: false,
            caveat: 'Both arms have identical read rates.',
        };
    }

    const z = (pB - pA) / standardError;
    const pValue = 2 * (1 - normalCdf(Math.abs(z)));

    const expectedCounts = [
        pooled * nA, (1 - pooled) * nA,
        pooled * nB, (1 - pooled) * nB,
    ];
    const tooSmall = expectedCounts.some((value) => value < 5);

    return {
        liftPoints: (pB - pA) * 100,
        zScore: z,
        pValue,
        significant: pValue < 0.05 && !tooSmall,
        caveat: tooSmall
            ? 'Sample too small for a reliable p-value — fewer than 5 expected reads or non-reads in an arm.'
            : null,
    };
}

/**
 * What the screen should actually say.
 *
 * It refuses to name a winner on the booking count alone, which is the whole
 * point of the module: the number the hotel most wants to decide on is the one
 * it will have the least of.
 */
export function describeOutcome(
    a: VariantStats,
    b: VariantStats,
    significance: Significance,
): string {
    const bookings = a.bookings + b.bookings;

    if (significance.caveat) {
        return `No winner yet — ${significance.caveat.toLowerCase()} Keep both arms running.`;
    }
    if (!significance.significant) {
        return 'No significant difference in read rate yet. Both templates are performing the same as far as this sample can tell.';
    }

    const winner = significance.liftPoints > 0 ? b : a;
    const points = Math.abs(significance.liftPoints).toFixed(1);
    const bookingNote = bookings < 30
        ? ` Booking counts (${a.bookings} vs ${b.bookings}) are directional only at this volume.`
        : '';

    return `Variant ${winner.label} wins on read rate by ${points} points (p = ${significance.pValue.toFixed(3)}).${bookingNote}`;
}
