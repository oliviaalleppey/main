/**
 * Reports the GST gap on bookings taken before the per-night tax fix.
 *
 * Read-only. Writes nothing. The point is to put real numbers in front of an
 * accountant, because how the gap is settled is their call, not the code's.
 *
 * For each confirmed booking it shows what was charged, what the per-night slab
 * rule gives, and the two ways of closing the difference:
 *
 *   ABSORB   the total the guest paid is treated as inclusive of the correct rate.
 *            The guest is never re-billed; the hotel eats the difference out of
 *            its own room revenue. total_amount does not move.
 *   RECOVER  the room rate stands and the correct tax is added on top, so the
 *            total rises and the difference is owed by the guest.
 *
 * Run: npx tsx scripts/audit-historical-tax.ts
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { calculateRoomTaxForNightlyRates, getRoomTaxRateForNightlyRate } from '../lib/services/tax';

const sql = neon(process.env.DATABASE_URL!);
const inr = (paise: number) =>
    `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

async function main() {
    const rows = await sql.query(`
        select b.id, b.booking_number, b.status, b.created_at::date as created,
               b.subtotal, b.tax_amount, b.total_amount,
               coalesce(sum(bi.subtotal), 0) as room_subtotal,
               coalesce(sum(ba.subtotal), 0) as addon_subtotal,
               json_agg(json_build_object(
                   'name', rt.name, 'perNight', bi.price_per_night,
                   'nights', bi.nights, 'qty', bi.quantity
               )) as items
        from bookings b
        join booking_items bi on bi.booking_id = b.id
        join room_types rt on rt.id = bi.room_type_id
        left join booking_add_ons ba on ba.booking_id = b.id
        where b.status in ('confirmed', 'completed')
        group by b.id
        order by b.created_at`);

    // The extra GST owed depends entirely on the treatment, so the two are tracked
    // separately. Quoting one figure while recommending the other is how an
    // accountant ends up filing a number nobody meant.
    let totalAbsorbDue = 0;
    let totalRecoverDue = 0;
    const affected: string[] = [];

    for (const b of rows as any[]) {
        const items = b.items as { name: string; perNight: number; nights: number; qty: number }[];

        // Reconstruct nightly rates from the booking line. Historical rows only keep
        // an average per night, which is exactly what the fallback path assumes too.
        let correctRoomTax = 0;
        const slabs: string[] = [];
        for (const item of items) {
            const nightlyRates = new Array(item.nights).fill(item.perNight);
            correctRoomTax += calculateRoomTaxForNightlyRates(nightlyRates, item.qty);
            slabs.push(`${item.qty}×${item.nights}n @ ${inr(item.perNight)} → ${getRoomTaxRateForNightlyRate(item.perNight)}%`);
        }

        const addonSubtotal = Number(b.addon_subtotal);
        const addonTax = Math.round(addonSubtotal * 0.18);
        const correctTotalTax = correctRoomTax + addonTax;
        const chargedTax = Number(b.tax_amount);
        const gap = correctTotalTax - chargedTax;

        if (gap === 0) continue;

        affected.push(b.booking_number);

        const paid = Number(b.total_amount);
        const roomSubtotal = Number(b.room_subtotal);

        // ABSORB: the money actually received is treated as already containing the
        // correct tax. It is the *total paid* that is inclusive, not the pre-tax
        // subtotal — so back the tax out of what the guest's card was charged,
        // net of the add-on lines, which carry their own 18%.
        const blendedRate = roomSubtotal > 0 ? correctRoomTax / roomSubtotal : 0;
        const receivedForRooms = paid - addonSubtotal - addonTax;
        const absorbRoomNet = Math.round(receivedForRooms / (1 + blendedRate));
        const absorbRoomTax = receivedForRooms - absorbRoomNet;
        const absorbRevenueLost = roomSubtotal - absorbRoomNet;

        // Extra GST payable differs by treatment: absorbing backs the tax out of
        // money already received, recovering adds it on top of the standing rate.
        const absorbDue = (absorbRoomTax + addonTax) - chargedTax;
        const recoverDue = gap;
        totalAbsorbDue += absorbDue;
        totalRecoverDue += recoverDue;

        console.log(`\n${b.booking_number}  (${b.status}, ${b.created})`);
        console.log(`  rooms        ${slabs.join('; ')}`);
        console.log(`  charged      subtotal ${inr(Number(b.subtotal))} + tax ${inr(chargedTax)} = ${inr(paid)}`);
        console.log(`  ABSORB       room net ${inr(absorbRoomNet)} + tax ${inr(absorbRoomTax)} = ${inr(absorbRoomNet + absorbRoomTax + addonSubtotal + addonTax)} (total unchanged)`);
        console.log(`               extra GST payable ${inr(absorbDue)}; room revenue given up ${inr(absorbRevenueLost)}`);
        console.log(`  RECOVER      tax on the standing rate ${inr(correctTotalTax)}; total becomes ${inr(Number(b.subtotal) + correctTotalTax)}`);
        console.log(`               extra GST payable ${inr(recoverDue)}, all of it re-billed to the guest`);
    }

    console.log(`\n${'='.repeat(64)}`);
    console.log(`bookings with a gap: ${affected.length} of ${rows.length}`);
    console.log(`affected: ${affected.join(', ')}`);
    console.log(`\nextra GST payable, if ABSORBED : ${inr(totalAbsorbDue)}   (guest pays nothing more)`);
    console.log(`extra GST payable, if RECOVERED: ${inr(totalRecoverDue)}   (re-billed to guests)`);
    console.log(`\nThese are different numbers for different decisions — not two`);
    console.log(`estimates of one number. Pick the treatment first.`);
    console.log(`\nNothing was written. Settlement treatment is an accounting decision.`);
}

main();
