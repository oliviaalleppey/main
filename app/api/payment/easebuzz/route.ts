import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookingLogs } from '@/lib/db/schema';
import { EasebuzzService } from '@/lib/services/easebuzz';
import { applyGatewayOutcome, normaliseGatewayStatus } from '@/lib/services/easebuzz/apply-outcome';

/**
 * Easebuzz posts the payment result here from the guest's browser (surl/furl),
 * so the response has to send that browser somewhere readable.
 *
 * Redirects are 303, not the NextResponse.redirect default of 307. A 307
 * preserves the method, which means the browser re-POSTs the whole gateway
 * payload to the page we send it to, and re-POSTs it again on every refresh.
 * 303 is what turns "POST the result" into "GET the page".
 */
const SEE_OTHER = 303;

export async function POST(req: NextRequest) {
    let rawText = '';
    const origin = req.nextUrl.origin;

    try {
        // Easebuzz sends data as application/x-www-form-urlencoded
        rawText = await req.text();
        const postDataStr = new URLSearchParams(rawText);

        const postData: Record<string, string> = {};
        for (const [key, value] of postDataStr.entries()) {
            postData[key] = value;
        }

        const txnid = postData.txnid;

        await db.insert(bookingLogs).values({
            action: 'easebuzz_webhook_received',
            requestPayload: postData,
            level: 'info'
        });

        // Verify Hash
        const isValidHash = EasebuzzService.verifyResponseHash(postData);
        console.log('[Easebuzz webhook] txnid:', txnid, '| status:', postData.status, '| hash valid:', isValidHash);

        if (!isValidHash) {
            await db.insert(bookingLogs).values({
                action: 'easebuzz_invalid_hash',
                requestPayload: postData,
                level: 'error',
                errorMessage: 'Hash validation failed'
            });
            return new NextResponse('Invalid Hash', { status: 400 });
        }

        if (!txnid) {
            return new NextResponse('Missing txnid', { status: 400 });
        }

        const result = await applyGatewayOutcome({
            txnid,
            outcome: normaliseGatewayStatus(postData.status),
            fields: postData,
            source: 'webhook',
        });

        switch (result.code) {
            case 'payment_not_found':
                return new NextResponse('Payment not found', { status: 404 });
            case 'amount_invalid':
                return new NextResponse('Invalid Amount', { status: 400 });
            case 'amount_mismatch':
                return new NextResponse('Amount Mismatch', { status: 400 });

            case 'confirmed':
            case 'confirmed_crs_pending':
            case 'late_failure_ignored':
                // Paid. Show the guest the confirmation.
                return NextResponse.redirect(`${origin}/book/confirmation/${result.bookingId}`, SEE_OTHER);

            case 'marked_failed':
            case 'late_success_ignored':
            case 'unresolved':
            default:
                // Not paid. Send the guest to a page that survives the lost
                // booking session and tells them what the bank actually said.
                // The old target was /book/checkout?error=…, which bounced
                // straight to /book/search because the session cookie is
                // deleted at initiate — so the guest never saw the reason.
                return NextResponse.redirect(
                    `${origin}/book/payment-failed/${result.bookingId}`,
                    SEE_OTHER,
                );
        }

    } catch (error) {
        console.error('Easebuzz webhook error:', error);
        await db.insert(bookingLogs).values({
            action: 'easebuzz_webhook_error',
            requestPayload: { raw: rawText },
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            level: 'error'
        });
        return new NextResponse('Internal Error', { status: 500 });
    }
}
