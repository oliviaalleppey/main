/**
 * Repairs two fields that the app never wrote correctly:
 *
 *   1. bookings.payment_status — never set by any code path, so every paid booking
 *      still reads 'pending'. The guest invoice prints "Status: PENDING" from it.
 *   2. payments.easebuzz_transaction_id / gateway_transaction_id — the webhook read
 *      a field name Easebuzz does not send, so both stayed null.
 *
 * The gateway ids are not guessed: they are recovered from the raw webhook payloads
 * in booking_logs, matched on txnid -> payments.easebuzz_order_id.
 *
 * Dry run (default):  npx tsx scripts/backfill-payment-status.ts
 * Apply:              npx tsx scripts/backfill-payment-status.ts --apply
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const APPLY = process.argv.includes('--apply');

async function main() {
    console.log(APPLY ? '=== APPLYING CHANGES ===\n' : '=== DRY RUN (pass --apply to write) ===\n');

    // 1. payment_status, driven by the payments row rather than the booking state,
    //    so a CRS failure after a successful charge is still recorded as paid.
    const statusRows = await sql.query(`
        select b.id, b.booking_number, b.status, b.payment_status, p.status as payment_row_status
        from bookings b
        join payments p on p.booking_id = b.id
        where p.status = 'success' and b.payment_status is distinct from 'success'
        order by b.created_at`);

    console.log(`payment_status -> 'success': ${statusRows.length} booking(s)`);
    for (const r of statusRows) {
        console.log(`  ${r.booking_number}  booking=${r.status}  payment_status ${r.payment_status} -> success`);
    }

    // Failed payments are deliberately left alone: they are already 'pending', which
    // is harmless on a booking nobody paid for, and rewriting 43 rows to fix 18 is a
    // worse trade than rewriting 18. New failures are marked by the webhook itself.

    // 2. Gateway ids recovered from the logged webhook payloads.
    const idRows = await sql.query(`
        select distinct on (p.id)
               p.id, p.easebuzz_order_id,
               l.request_payload->>'easepayid'    as easepayid,
               l.request_payload->>'bank_ref_num' as bank_ref_num,
               l.request_payload->>'mode'         as mode
        from payments p
        join booking_logs l
          on l.request_payload->>'txnid' = p.easebuzz_order_id
        where l.action = 'easebuzz_webhook_received'
          and l.request_payload->>'easepayid' is not null
          and (p.easebuzz_transaction_id is null or p.gateway_transaction_id is null)
        order by p.id, l.created_at desc`);

    console.log(`\ngateway ids recoverable: ${idRows.length} payment(s)`);
    for (const r of idRows) {
        console.log(`  ${r.easebuzz_order_id}  easepayid=${r.easepayid}  bank_ref=${r.bank_ref_num}  (${r.mode})`);
    }

    const unrecoverable = await sql.query(`
        select p.easebuzz_order_id, p.status, p.created_at::date
        from payments p
        where p.easebuzz_transaction_id is null
          and not exists (
            select 1 from booking_logs l
            where l.action = 'easebuzz_webhook_received'
              and l.request_payload->>'txnid' = p.easebuzz_order_id
          )
        order by p.created_at`);
    if (unrecoverable.length) {
        console.log(`\nno logged webhook, ids NOT recoverable: ${unrecoverable.length} payment(s)`);
        for (const r of unrecoverable) console.log(`  ${r.easebuzz_order_id}  ${r.status}  ${r.created_at}`);
    }

    if (!APPLY) {
        console.log('\nDry run only. Nothing written.');
        return;
    }

    for (const r of statusRows) {
        await sql.query(`update bookings set payment_status = 'success', updated_at = now() where id = $1`, [r.id]);
    }
    for (const r of idRows) {
        await sql.query(
            `update payments
                set easebuzz_transaction_id = coalesce(easebuzz_transaction_id, $2),
                    gateway_transaction_id  = coalesce(gateway_transaction_id, $3),
                    updated_at = now()
              where id = $1`,
            [r.id, r.easepayid, r.bank_ref_num]
        );
    }

    console.log(`\nDone. ${statusRows.length} marked paid, ${idRows.length} payment ids restored.`);
}

main();
