/**
 * Room tax (GST on accommodation).
 *
 * The slab is set by the value of supply per room per night, not by the value of
 * the booking. A stay whose nightly rate crosses the threshold is therefore taxed
 * night by night: each night picks its own slab, and the nightly amounts are summed.
 *
 * Averaging the stay and applying one rate gives a different — and wrong — answer
 * whenever the nights straddle the threshold, which is exactly what seasonal
 * overrides and surge pricing produce. Every room tax figure in the app routes
 * through here so the whole flow agrees on one number.
 *
 * The slab values live in one place on purpose: they are the part most likely to
 * change, and changing them should mean editing three constants, nothing else.
 */

/** Per room, per night. At or below this value the lower slab applies. */
export const GST_ACCOMMODATION_THRESHOLD_PAISE = 750_000; // ₹7,500
export const GST_ACCOMMODATION_RATE_AT_OR_BELOW = 5; // percent
export const GST_ACCOMMODATION_RATE_ABOVE = 18; // percent

/** The slab a single night falls into, from that night's own rate. */
export function getRoomTaxRateForNightlyRate(nightlyRatePaise: number): number {
    const rate = Number.isFinite(nightlyRatePaise) && nightlyRatePaise > 0 ? nightlyRatePaise : 0;
    return rate <= GST_ACCOMMODATION_THRESHOLD_PAISE
        ? GST_ACCOMMODATION_RATE_AT_OR_BELOW
        : GST_ACCOMMODATION_RATE_ABOVE;
}

/**
 * Sum the per-night tax across a stay.
 * `nightlyRates` is per room; `quantity` multiplies whole rooms.
 */
export function calculateRoomTaxForNightlyRates(nightlyRates: number[], quantity = 1): number {
    const rooms = Math.max(1, Math.floor(quantity || 1));
    const perRoom = nightlyRates.reduce((sum, nightly) => {
        const rate = Number.isFinite(nightly) && nightly > 0 ? nightly : 0;
        return sum + Math.round(rate * (getRoomTaxRateForNightlyRate(rate) / 100));
    }, 0);
    return perRoom * rooms;
}

/**
 * Add-on tax (GST on everything sold alongside the room).
 *
 * Unlike a room, an add-on carries its own rate — the Tax % on the add-on in
 * the admin — because a cake and an airport transfer are not taxed alike. The
 * rate is 18 for every add-on the hotel sells today, and that is the value a
 * new one is created with, so it stands in when a line has no rate of its own.
 *
 * A booking's lines keep the rate they were sold at, so editing an add-on's
 * Tax % changes what the next guest pays and never what an old invoice says.
 */
export const DEFAULT_ADD_ON_TAX_RATE = 18; // percent

/**
 * GST across a set of add-on lines, each at its own rate.
 *
 * Rounded per line rather than on the total: lines at different rates cannot be
 * summed before they are taxed, and the checkout page has always priced them
 * this way. Every add-on tax figure in the app routes through here — what the
 * guest is quoted, what is charged, and what the invoice reports.
 */
export function calculateAddOnTax(lines: { subtotal: number; taxRate?: number | null }[]): number {
    return lines.reduce((sum, line) => {
        const subtotal = Number.isFinite(line.subtotal) && line.subtotal > 0 ? line.subtotal : 0;
        const rate = typeof line.taxRate === 'number' && Number.isFinite(line.taxRate) && line.taxRate >= 0
            ? line.taxRate
            : DEFAULT_ADD_ON_TAX_RATE;
        return sum + Math.round(subtotal * (rate / 100));
    }, 0);
}

/** Add-on tax grouped by rate, for the rate-wise breakdown a tax invoice needs. */
export function groupAddOnTaxByRate(
    lines: { subtotal: number; taxRate?: number | null }[],
): { rate: number; taxableValue: number; tax: number }[] {
    const buckets = new Map<number, { taxableValue: number; tax: number }>();
    for (const line of lines) {
        const rate = typeof line.taxRate === 'number' && Number.isFinite(line.taxRate) && line.taxRate >= 0
            ? line.taxRate
            : DEFAULT_ADD_ON_TAX_RATE;
        const bucket = buckets.get(rate) ?? { taxableValue: 0, tax: 0 };
        bucket.taxableValue += line.subtotal;
        bucket.tax += calculateAddOnTax([line]);
        buckets.set(rate, bucket);
    }
    return [...buckets.entries()].map(([rate, bucket]) => ({ rate, ...bucket }));
}

/** Split a stay total across nights without losing or inventing paise. */
export function spreadEvenly(total: number, nights: number): number[] {
    const base = Math.floor(total / nights);
    let remainder = total - base * nights;
    return Array.from({ length: nights }, () => {
        const extra = remainder > 0 ? 1 : 0;
        remainder -= extra;
        return base + extra;
    });
}

/**
 * Recover the per-night rates for a stay.
 *
 * Quotes captured after the per-night fix carry `nightlyRates` and are used as-is.
 * Older sessions stored only scalars, so we spread the stay total evenly — which
 * still taxes every night, and still picks the slab from a nightly figure rather
 * than from the booking value.
 */
export function resolveNightlyRates(input: {
    nightlyRates?: number[] | null;
    pricePerNight?: number | null;
    totalPricePerRoom?: number | null;
    nights: number;
}): number[] {
    const nights = Math.max(1, Math.floor(input.nights || 1));

    const explicit = input.nightlyRates;
    if (
        Array.isArray(explicit) &&
        explicit.length === nights &&
        explicit.every((rate) => typeof rate === 'number' && Number.isFinite(rate) && rate >= 0)
    ) {
        return explicit.map((rate) => Math.round(rate));
    }

    const total = input.totalPricePerRoom;
    if (typeof total === 'number' && Number.isFinite(total) && total > 0) {
        return spreadEvenly(Math.round(total), nights);
    }

    const perNight = input.pricePerNight;
    if (typeof perNight === 'number' && Number.isFinite(perNight) && perNight > 0) {
        return new Array(nights).fill(Math.round(perNight));
    }

    return new Array(nights).fill(0);
}

/**
 * Nudge a set of per-night tax figures so they add up to a given total.
 *
 * The slab math above is the right answer for a stay, but a booking that is
 * already on the books carries the tax it was actually charged — bookings taken
 * before the per-night fix carry a different figure, and add-on tax is folded
 * into the same column. Anything that has to reconcile line by line against a
 * booking's stored total (the CRS payload, an invoice) scales the nightly
 * figures proportionally and lets the earliest nights absorb the odd paise.
 */
export function reconcileNightlyTax(nightlyTaxes: number[], total: number): number[] {
    if (!nightlyTaxes.length) return [];

    const target = Math.max(0, Math.round(total));
    const raw = nightlyTaxes.reduce((sum, tax) => sum + tax, 0);
    if (raw === target) return [...nightlyTaxes];
    // Nothing to scale against — a fully discounted stay, say — so split it evenly.
    if (raw <= 0) return spreadEvenly(target, nightlyTaxes.length);

    const scaled = nightlyTaxes.map((tax) => Math.round((tax * target) / raw));
    let drift = target - scaled.reduce((sum, tax) => sum + tax, 0);
    const step = drift > 0 ? 1 : -1;
    for (let i = 0; drift !== 0 && i < scaled.length; i += 1) {
        if (step < 0 && scaled[i] <= 0) continue;
        scaled[i] += step;
        drift -= step;
    }
    return scaled;
}

/**
 * Break a booking's stored line items back into one priced night per room.
 *
 * A booking keeps only scalars per line — a nightly price, a stay subtotal, a
 * room count — but the CRS wants every night of every room priced, and checks
 * those lines against the booking's totals. So spread each item's subtotal over
 * its rooms and then over the nights (no paise lost either time), tax each night
 * on its own slab, and reconcile the lot against the tax the booking carries.
 *
 * The nights within a room come out even, because an even split is all the
 * stored scalars support. A stay whose nightly rate actually varied is reported
 * at its average — the same figure the guest's own invoice shows.
 *
 * Returns one entry per physical room, items in order, rooms within an item in
 * order, so callers can zip it against their own per-room list.
 */
export function splitStayIntoNightlyCharges(input: {
    items: { pricePerNight: number; subtotal: number; rooms: number }[];
    nights: number;
    roomTaxTotal: number;
}): { nightlyRates: number[]; nightlyTaxes: number[] }[] {
    const nights = Math.max(1, Math.floor(input.nights || 1));

    const nightlyRatesByRoom = input.items.flatMap((item) => {
        const rooms = Math.max(1, Math.floor(item.rooms || 1));
        return spreadEvenly(Math.round(item.subtotal), rooms).map((roomSubtotal) =>
            resolveNightlyRates({
                pricePerNight: item.pricePerNight,
                totalPricePerRoom: roomSubtotal,
                nights,
            })
        );
    });

    const reconciled = reconcileNightlyTax(
        nightlyRatesByRoom.flat().map(
            (rate) => Math.round(rate * (getRoomTaxRateForNightlyRate(rate) / 100))
        ),
        input.roomTaxTotal
    );

    let cursor = 0;
    return nightlyRatesByRoom.map((nightlyRates) => {
        const nightlyTaxes = reconciled.slice(cursor, cursor + nightlyRates.length);
        cursor += nightlyRates.length;
        return { nightlyRates, nightlyTaxes };
    });
}

/**
 * Taxable value and tax, grouped by the GST rate that produced it.
 *
 * A tax invoice has to itemise per rate rather than per booking. One stay can
 * straddle the ₹7,500 slab, and add-ons are taxed at 18% whatever the room cost,
 * so a single combined figure hides which rate applied to what. CGST and SGST are
 * always half each of the rate — 2.5 + 2.5 at 5%, 9 + 9 at 18% — so the caller
 * halves these rather than being handed a third and fourth number to reconcile.
 *
 * `extra` covers anything taxed outside the room slabs, i.e. add-ons.
 * Amounts in paise, in and out.
 */
export function groupTaxByRate(
    charges: { nightlyRates: number[]; nightlyTaxes: number[] }[],
    extra: { rate: number; taxableValue: number; tax: number }[] = []
): { rate: number; taxableValue: number; tax: number }[] {
    const buckets = new Map<number, { taxableValue: number; tax: number }>();

    const add = (rate: number, taxableValue: number, tax: number) => {
        const bucket = buckets.get(rate) ?? { taxableValue: 0, tax: 0 };
        bucket.taxableValue += taxableValue;
        bucket.tax += tax;
        buckets.set(rate, bucket);
    };

    for (const room of charges) {
        room.nightlyRates.forEach((nightly, index) => {
            add(getRoomTaxRateForNightlyRate(nightly), nightly, room.nightlyTaxes[index] ?? 0);
        });
    }

    for (const entry of extra) {
        if (entry.taxableValue > 0 || entry.tax > 0) {
            add(entry.rate, entry.taxableValue, entry.tax);
        }
    }

    return [...buckets.entries()]
        .map(([rate, bucket]) => ({ rate, ...bucket }))
        .sort((a, b) => a.rate - b.rate);
}

/** Resolve the nightly rates for a stay and total the tax in one step. */
export function calculateRoomTax(input: {
    nightlyRates?: number[] | null;
    pricePerNight?: number | null;
    totalPricePerRoom?: number | null;
    nights: number;
    quantity?: number;
}): number {
    return calculateRoomTaxForNightlyRates(resolveNightlyRates(input), input.quantity ?? 1);
}
