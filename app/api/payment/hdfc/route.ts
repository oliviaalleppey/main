import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookingLogs } from '@/lib/db/schema';
import { HdfcService, normaliseHdfcStatus } from '@/lib/services/hdfc';
import { applyGatewayOutcome } from '@/lib/services/easebuzz/apply-outcome';

/**
 * HDFC SmartGateway sends the guest back here after the payment page.
 *
 * The params on this request only name the order; they are not trusted for the
 * result. We ask HDFC's Order Status API (authenticated, server to server)
 * what happened, so a hand-edited URL cannot confirm a booking. The signature
 * is checked and logged as an extra signal.
 *
 * 303, not 307, for the same reason as the Easebuzz route: a 307 would re-POST
 * the whole payload to the page we send the guest to.
 */
const SEE_OTHER = 303;

async function handle(req: NextRequest, params: Record<string, string>) {
    const origin = req.nextUrl.origin;

    try {
        const orderId = params.order_id;
        const signatureValid = HdfcService.verifyReturnSignature(params);

        await db.insert(bookingLogs).values({
            action: 'hdfc_return_received',
            requestPayload: { ...params, signatureValid },
            level: signatureValid ? 'info' : 'warning',
        });

        if (!orderId) return new NextResponse('Missing order_id', { status: 400 });

        const order = await HdfcService.fetchOrderStatus(orderId);
        if (!order.found) return new NextResponse('Payment not found', { status: 404 });

        const result = await applyGatewayOutcome({
            txnid: orderId,
            outcome: normaliseHdfcStatus(order.status),
            fields: order.fields,
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
                return NextResponse.redirect(`${origin}/book/confirmation/${result.bookingId}`, SEE_OTHER);

            case 'marked_failed':
            case 'late_success_ignored':
            case 'unresolved':
            default:
                return NextResponse.redirect(`${origin}/book/payment-failed/${result.bookingId}`, SEE_OTHER);
        }
    } catch (error) {
        console.error('HDFC return error:', error);
        await db.insert(bookingLogs).values({
            action: 'hdfc_return_error',
            requestPayload: params,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            level: 'error',
        });
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// The bank may return the guest with a GET (query string) or a POST (form body).
export async function GET(req: NextRequest) {
    return handle(req, Object.fromEntries(req.nextUrl.searchParams.entries()));
}

export async function POST(req: NextRequest) {
    const form = new URLSearchParams(await req.text());
    return handle(req, Object.fromEntries(form.entries()));
}
