import { getAdminAccess } from '@/lib/admin/guard';
import { db } from '@/lib/db';
import { payments, bookings, bookingLogs } from '@/lib/db/schema';
import { EasebuzzService } from '@/lib/services/easebuzz';
import { applyGatewayOutcome, normaliseGatewayStatus } from '@/lib/services/easebuzz/apply-outcome';
import { and, eq, gt, lt, isNotNull, asc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Resolves payments that are stuck `pending`.
 *
 * A payment goes pending the moment we hand the guest to Easebuzz and stays
 * that way until the gateway posts a result back. When the guest's browser
 * never returns — tab closed, signal lost, 3DS abandoned, app killed — no
 * webhook is ever sent and nothing else in the system ever asks. Those rows sat
 * pending indefinitely, which meant we could not answer the only question that
 * matters when a guest says "it took my money": did it?
 *
 * This asks Easebuzz directly, via Transaction API v2, and applies the answer
 * through the same code path the webhook uses.
 *
 * Safety: marking a payment failed queues a payment-recovery message to the
 * guest (BookingService.markAsFailed -> fireAutomation('payment_failed')). So
 * write mode deliberately refuses to touch anything older than
 * EASEBUZZ_RECONCILE_MAX_AGE_DAYS (default 7) — otherwise the first run would
 * message every guest in the historical backlog, some of them months old.
 *
 *   GET ?dryRun=1              report only, writes nothing, any age
 *   GET ?dryRun=1&maxAgeDays=N inspect the whole backlog safely
 *
 * maxAgeDays is honoured in dry-run only, so the write window cannot be widened
 * from a URL.
 */
export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        // An unset CRON_SECRET must not make "Bearer undefined" a valid token —
        // these jobs confirm bookings and settle payments. Same guard as the
        // WhatsApp crons.
        const cronAuthorized = !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
        const adminAuthorized = !cronAuthorized && !!(await getAdminAccess())?.isAdmin;

        if (!cronAuthorized && !adminAuthorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!EasebuzzService.isConfigured) {
            return NextResponse.json({ error: 'Easebuzz is not configured' }, { status: 503 });
        }

        const url = new URL(request.url);
        const dryRun = url.searchParams.get('dryRun') === '1';
        const batchSize = Math.min(50, Number(url.searchParams.get('limit') || 25));

        const writeMaxAgeDays = Number(process.env.EASEBUZZ_RECONCILE_MAX_AGE_DAYS || 7);
        const requestedMaxAgeDays = Number(url.searchParams.get('maxAgeDays') || writeMaxAgeDays);
        const maxAgeDays = dryRun ? requestedMaxAgeDays : writeMaxAgeDays;

        // Give the gateway a few minutes to post its own webhook before we go
        // asking; reconciling a payment mid-flight just races the webhook.
        const settleMinutes = Number(process.env.EASEBUZZ_RECONCILE_SETTLE_MINUTES || 15);

        const now = Date.now();
        const olderThan = new Date(now - settleMinutes * 60 * 1000);
        const newerThan = new Date(now - maxAgeDays * 24 * 60 * 60 * 1000);

        const stuck = await db.select({
            id: payments.id,
            txnid: payments.easebuzzOrderId,
            amount: payments.amount,
            createdAt: payments.createdAt,
            bookingId: payments.bookingId,
            bookingNumber: bookings.bookingNumber,
        })
            .from(payments)
            .innerJoin(bookings, eq(bookings.id, payments.bookingId))
            .where(and(
                eq(payments.status, 'pending'),
                isNotNull(payments.easebuzzOrderId),
                lt(payments.createdAt, olderThan),
                gt(payments.createdAt, newerThan),
            ))
            .orderBy(asc(payments.createdAt))
            .limit(batchSize);

        const results: Array<Record<string, unknown>> = [];
        const tally: Record<string, number> = {};
        const bump = (k: string) => { tally[k] = (tally[k] || 0) + 1; };

        for (const row of stuck) {
            const txnid = row.txnid as string;

            try {
                const lookup = await EasebuzzService.fetchTransactionStatus(txnid);

                if (!lookup.found) {
                    // Easebuzz has no transaction for this txnid: the guest was
                    // handed a pay link and never started. Nothing to apply —
                    // and nothing was charged, which is the answer we wanted.
                    bump('no_gateway_record');
                    results.push({
                        txnid,
                        bookingNumber: row.bookingNumber,
                        gatewayStatus: null,
                        action: 'no_gateway_record',
                    });
                    continue;
                }

                const outcome = normaliseGatewayStatus(lookup.status);
                bump(`gateway_${lookup.status}`);

                if (dryRun) {
                    results.push({
                        txnid,
                        bookingNumber: row.bookingNumber,
                        gatewayStatus: lookup.status,
                        wouldApply: outcome,
                        gatewayAmount: lookup.fields.amount ?? null,
                        ourAmountPaise: row.amount,
                        easepayid: lookup.fields.easepayid ?? null,
                        reason: lookup.fields.error_Message || lookup.fields.error || null,
                        action: 'dry_run',
                    });
                    continue;
                }

                if (outcome === 'unresolved') {
                    results.push({
                        txnid,
                        bookingNumber: row.bookingNumber,
                        gatewayStatus: lookup.status,
                        action: 'left_pending',
                    });
                    continue;
                }

                const applied = await applyGatewayOutcome({
                    txnid,
                    outcome,
                    fields: lookup.fields,
                    source: 'reconciler',
                });

                bump(`applied_${applied.code}`);

                await db.insert(bookingLogs).values({
                    bookingId: row.bookingId,
                    action: 'easebuzz_reconciled',
                    level: applied.code === 'confirmed' ? 'info' : 'warning',
                    requestPayload: {
                        txnid,
                        gatewayStatus: lookup.status,
                        outcome,
                        result: applied.code,
                    },
                    errorMessage: applied.ok ? null : applied.message,
                });

                results.push({
                    txnid,
                    bookingNumber: row.bookingNumber,
                    gatewayStatus: lookup.status,
                    action: applied.code,
                    message: applied.message,
                });

            } catch (err) {
                const message = err instanceof Error ? err.message : 'Unknown error';
                bump('lookup_error');

                await db.insert(bookingLogs).values({
                    bookingId: row.bookingId,
                    action: 'easebuzz_reconcile_error',
                    level: 'error',
                    requestPayload: { txnid },
                    errorMessage: message,
                });

                results.push({ txnid, bookingNumber: row.bookingNumber, action: 'error', message });
            }
        }

        return NextResponse.json({
            dryRun,
            window: {
                settleMinutes,
                maxAgeDays,
                from: newerThan.toISOString(),
                to: olderThan.toISOString(),
            },
            examined: stuck.length,
            tally,
            results,
        });

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[payment-reconciliation] failed:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
