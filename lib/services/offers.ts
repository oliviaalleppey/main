import { db } from '@/lib/db';
import { offers } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Promo code redemption.
 *
 * The `offers` table has existed since the original schema and nothing has ever
 * written to it, or to `bookings.promo_code` / `bookings.offer_id`. This file is
 * the redemption path those columns were waiting for.
 *
 * ## The three rules this implements, and why
 *
 * 1. **The discount comes off the room subtotal only, and tax is recalculated.**
 *    Add-ons stay at full price — they are near-cost (transfers, dining) and are
 *    where margin disappears fastest. GST is then charged on what the guest
 *    actually pays for the room, which is both the normal Indian treatment and
 *    the only version that produces a defensible invoice.
 *
 * 2. **Codes never stack; the larger discount wins.** The hotel's own published
 *    terms already say offers "may not be combined unless expressly stated", so
 *    this is not a new policy. Stacking is the configuration that quietly sells a
 *    room below cost when a seasonal rate meets a campaign code.
 *
 * 3. **Every amount is integer paise** (gotcha 6), and rounding happens once, at
 *    the point tax is derived. Rounding at each line and summing produces totals
 *    that differ from the displayed figures by a rupee or two — which is exactly
 *    the kind of discrepancy that costs an afternoon to trace.
 *
 * ## The tax-scaling decision
 *
 * Room tax does not always come from a rate we control: when the CRS returns a
 * quote, `taxesAndFees` is a figure it computed on the undiscounted rate. So the
 * discounted tax is derived **pro rata** rather than recomputed from a
 * percentage:
 *
 *     discountedRoomTax = round(roomTax × discountedRoomSubtotal / roomSubtotal)
 *
 * That treats a quoted tax and a computed one identically, and it means tax
 * always moves in proportion to the money actually charged. Recomputing from
 * `taxRate` instead would silently discard whatever the CRS said and produce a
 * total that disagrees with the quote the guest was shown.
 */

export type Offer = typeof offers.$inferSelect;

export type OfferRejectReason =
    | 'empty'
    | 'not_found'
    | 'inactive'
    | 'not_started'
    | 'expired'
    | 'usage_limit_reached'
    | 'below_minimum'
    | 'no_discount';

export type OfferValidation =
    | { valid: false; reason: OfferRejectReason; message: string }
    | { valid: true; offer: Offer; discount: number; message: string };

/** Guest-facing text. Never leaks whether a code exists but is exhausted. */
export function describeRejection(reason: OfferRejectReason, detail?: string): string {
    switch (reason) {
        case 'empty': return 'Enter a promo code.';
        // Deliberately identical for these four: telling someone their code is
        // "expired" rather than "not valid" confirms it was real, which is how
        // people work out that guessing codes is worthwhile.
        case 'not_found':
        case 'inactive':
        case 'not_started':
        case 'expired':
            return 'That promo code is not valid.';
        case 'usage_limit_reached': return 'That promo code has been fully claimed.';
        case 'below_minimum': return detail ?? 'Your booking does not meet the minimum for this code.';
        case 'no_discount': return 'That code does not reduce this booking.';
    }
}

/** Codes are stored and compared upper-case; guests type them however they like. */
export function normalizeCode(raw: string | null | undefined): string {
    return (raw ?? '').trim().toUpperCase();
}

/**
 * Today in the hotel's timezone, as YYYY-MM-DD.
 *
 * `valid_from` and `valid_to` are DATE columns, so the comparison must be
 * date-only and in IST. Using the server's UTC date would let an offer expire
 * five and a half hours early for the hotel's own guests.
 */
export function hotelToday(now: Date = new Date()): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(now);
}

/**
 * What this offer takes off the room subtotal, in paise.
 *
 * Never more than the room subtotal itself: a ₹5,000 fixed code against a ₹3,000
 * room discounts ₹3,000, not ₹5,000. Allowing it to exceed would make the room
 * line negative and, once add-ons are added back, produce a booking that charges
 * less than the add-ons are worth.
 */
export function computeDiscount(offer: Offer, roomSubtotal: number): number {
    if (roomSubtotal <= 0) return 0;

    let discount: number;
    if (offer.discountType === 'percentage') {
        discount = Math.round((roomSubtotal * offer.discountValue) / 100);
        // maxDiscount is the hotel's ceiling on a percentage code, and it is the
        // difference between "20% off" and "20% off, up to ₹2,000".
        if (offer.maxDiscount && offer.maxDiscount > 0) {
            discount = Math.min(discount, offer.maxDiscount);
        }
    } else {
        discount = offer.discountValue;
    }

    return Math.max(0, Math.min(discount, roomSubtotal));
}

export type QuoteBase = {
    roomSubtotal: number;
    roomTax: number;
    addOnSubtotal: number;
    addOnTax: number;
};

export type DiscountedQuote = QuoteBase & {
    discount: number;
    discountedRoomSubtotal: number;
    discountedRoomTax: number;
    /** Pre-tax, after discount. Matches bookings.subtotal. */
    subtotal: number;
    /** After tax scaling. Matches bookings.taxAmount. */
    taxAmount: number;
    /** What the guest pays. Matches bookings.totalAmount. */
    total: number;
    /** Tax saved on top of the headline discount. Shown so the two agree. */
    taxSaved: number;
};

/**
 * The single place a discounted total is computed.
 *
 * Both the amount the guest is charged and the amount the payment step verifies
 * go through this function. They are computed in two different files
 * (`calculateSessionPayableAmount` and `BookingService.finalizeSession`), and if
 * the discount arithmetic were duplicated rather than shared, a rounding
 * difference of one paisa between them would reject the booking with a price
 * mismatch the guest cannot do anything about.
 */
export function applyDiscount(base: QuoteBase, discount: number): DiscountedQuote {
    const safeDiscount = Math.max(0, Math.min(discount, base.roomSubtotal));
    const discountedRoomSubtotal = base.roomSubtotal - safeDiscount;

    const discountedRoomTax = base.roomSubtotal > 0
        ? Math.round((base.roomTax * discountedRoomSubtotal) / base.roomSubtotal)
        : 0;

    const subtotal = discountedRoomSubtotal + base.addOnSubtotal;
    const taxAmount = discountedRoomTax + base.addOnTax;

    return {
        ...base,
        discount: safeDiscount,
        discountedRoomSubtotal,
        discountedRoomTax,
        subtotal,
        taxAmount,
        total: subtotal + taxAmount,
        taxSaved: base.roomTax - discountedRoomTax,
    };
}

/**
 * Validate a code against a booking.
 *
 * `bookingTotal` is the pre-discount grand total — room + tax + add-ons. That is
 * what `min_booking_amount` means to the person who set it up: the guest-facing
 * promise is "on bookings over ₹X", and the guest reads ₹X as the price they see.
 */
export async function validateOfferCode(
    rawCode: string | null | undefined,
    context: { roomSubtotal: number; bookingTotal: number; now?: Date },
): Promise<OfferValidation> {
    const code = normalizeCode(rawCode);
    if (!code) return { valid: false, reason: 'empty', message: describeRejection('empty') };

    const offer = await db.query.offers.findFirst({
        // Codes are stored as entered by an admin, so compare case-insensitively
        // rather than trusting them to have been uppercased on the way in.
        where: sql`upper(${offers.code}) = ${code}`,
    });

    if (!offer) return { valid: false, reason: 'not_found', message: describeRejection('not_found') };
    if (!offer.isActive) return { valid: false, reason: 'inactive', message: describeRejection('inactive') };

    const today = hotelToday(context.now);
    if (offer.validFrom > today) {
        return { valid: false, reason: 'not_started', message: describeRejection('not_started') };
    }
    if (offer.validTo < today) {
        return { valid: false, reason: 'expired', message: describeRejection('expired') };
    }

    // Advisory only. The authoritative check is the atomic increment in
    // redeemOffer() — between here and payment, other guests are also booking.
    if (offer.usageLimit !== null && (offer.usageCount ?? 0) >= offer.usageLimit) {
        return { valid: false, reason: 'usage_limit_reached', message: describeRejection('usage_limit_reached') };
    }

    if (offer.minBookingAmount && context.bookingTotal < offer.minBookingAmount) {
        const rupees = Math.ceil(offer.minBookingAmount / 100).toLocaleString('en-IN');
        return {
            valid: false,
            reason: 'below_minimum',
            message: `This code applies to bookings of ₹${rupees} or more.`,
        };
    }

    const discount = computeDiscount(offer, context.roomSubtotal);
    if (discount <= 0) {
        return { valid: false, reason: 'no_discount', message: describeRejection('no_discount') };
    }

    return {
        valid: true,
        offer,
        discount,
        message: `${offer.title} applied — you save ₹${Math.round(discount / 100).toLocaleString('en-IN')}.`,
    };
}

/**
 * Claim one use of an offer.
 *
 * Check-and-increment in a single statement, because the read-then-write version
 * lets two guests booking simultaneously both pass a `usageCount < usageLimit`
 * check and both redeem the last seat on a limited offer. The WHERE clause is the
 * lock: if it matches no row, the offer was exhausted between validation and here.
 *
 * Returns false rather than throwing — a code that ran out during checkout should
 * cost the guest their discount, never their booking.
 */
export async function redeemOffer(offerId: string): Promise<boolean> {
    const result = await db.execute<{ id: string }>(sql`
        UPDATE offers
        SET usage_count = COALESCE(usage_count, 0) + 1,
            updated_at = now()
        WHERE id = ${offerId}
          AND is_active = true
          AND (usage_limit IS NULL OR COALESCE(usage_count, 0) < usage_limit)
        RETURNING id::text AS id
    `);
    return result.rows.length > 0;
}

/** Give back a use when a booking that claimed it never completes. */
export async function releaseOffer(offerId: string): Promise<void> {
    await db.execute(sql`
        UPDATE offers
        SET usage_count = GREATEST(0, COALESCE(usage_count, 0) - 1),
            updated_at = now()
        WHERE id = ${offerId}
    `);
}

/**
 * Which of two applied codes to keep. Larger discount wins.
 *
 * A guest who enters a second, worse code should not be punished for trying it,
 * and a guest who enters a better one should not have to remove the first. The
 * caller tells them which is in force either way — silently keeping the old one
 * looks like the form is broken.
 */
export function betterOf(
    current: { code: string; discount: number } | null,
    candidate: { code: string; discount: number },
): { winner: { code: string; discount: number }; replaced: boolean } {
    if (!current) return { winner: candidate, replaced: true };
    if (candidate.discount > current.discount) return { winner: candidate, replaced: true };
    return { winner: current, replaced: false };
}

export async function offerById(id: string): Promise<Offer | undefined> {
    return db.query.offers.findFirst({ where: eq(offers.id, id) });
}
