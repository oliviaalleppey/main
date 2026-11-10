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

        // Keep the Order Status API response for audit (the bank asks for these
        // logs). Card details and contact info are dropped; nothing else is.
        const { card: _card, customer_email: _e, customer_phone: _p, ...auditSafe } = (order.raw ?? {}) as Record<string, unknown>;
        await db.insert(bookingLogs).values({
            action: 'hdfc_order_status',
            requestPayload: { requestedOrderId: orderId, response: auditSafe },
            level: 'info',
        });

        // Response tampering check: the status we got back must be for the very
        // order we asked about.
        const returnedOrderId = (order.raw as Record<string, unknown> | null)?.order_id;
        if (returnedOrderId && String(returnedOrderId) !== orderId) {
            await db.insert(bookingLogs).values({
                action: 'hdfc_order_id_mismatch',
                requestPayload: { requestedOrderId: orderId, returnedOrderId },
                level: 'error',
                errorMessage: 'Order Status API answered for a different order id',
            });
            return new NextResponse('Order mismatch', { status: 400 });
        }

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
    // Query string first (our order_id rides on the return URL), then whatever
    // the bank posted: urlencoded, multipart or JSON.
    const params: Record<string, string> = Object.fromEntries(req.nextUrl.searchParams.entries());
    const raw = await req.text();
    const type = req.headers.get('content-type') || '';
    try {
        if (type.includes('application/json')) {
            for (const [k, v] of Object.entries(JSON.parse(raw) as Record<string, unknown>)) {
                if (v != null && typeof v !== 'object') params[k] = String(v);
            }
        } else if (type.includes('multipart/form-data')) {
            const form = await new Request(req.url, { method: 'POST', headers: { 'content-type': type }, body: raw }).formData();
            form.forEach((v, k) => {
                if (typeof v === 'string') params[k] = v;
            });
        } else {
            for (const [k, v] of new URLSearchParams(raw)) params[k] = v;
        }
    } catch {
        // Unreadable body: fall back to what the query string gave us.
    }
    return handle(req, params);
}
