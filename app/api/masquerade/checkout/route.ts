import { NextResponse } from 'next/server';
import { RateLimiter } from '@/lib/rate-limit';
import { MasqueradeError, isMasqueradePaymentsEnabled, startMasqueradeCheckout } from '@/lib/services/masquerade-booking';

export const dynamic = 'force-dynamic';

function text(value: unknown, max: number): string {
    return typeof value === 'string' ? value.slice(0, max) : '';
}

const STATUS_BY_CODE = { disabled: 403, invalid: 400, sold_out: 409, unavailable: 503, payment_failed: 502 } as const;

/** Holds the rooms and returns the Easebuzz payment page for the guest. */
export async function POST(request: Request) {
    // While online payment is off this does nothing at all, not even a rate-limit write.
    if (!isMasqueradePaymentsEnabled()) {
        return NextResponse.json(
            { success: false, code: 'disabled', message: 'Online booking for the 31st Night is not open yet.' },
            { status: 403 },
        );
    }

    let body: Record<string, unknown>;
    try {
        body = (await request.json()) as Record<string, unknown>;
    } catch {
        return NextResponse.json({ success: false, message: 'Invalid request.' }, { status: 400 });
    }

    // Each attempt holds rooms for ten minutes, so a script must not be able to hold them all.
    const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
    const limit = await RateLimiter.check(ip, 'masqueradeCheckout', { limit: 6, windowMs: 10 * 60 * 1000 });
    if (!limit.allowed) {
        return NextResponse.json(
            { success: false, message: 'Too many attempts. Please wait a few minutes or call us on +91 8075 416 514.' },
            { status: 429 },
        );
    }

    try {
        const result = await startMasqueradeCheckout({
            name: text(body.name, 120),
            email: text(body.email, 160),
            phone: text(body.phone, 20),
            rooms: Array.isArray(body.rooms) ? (body.rooms as Record<string, unknown>[]) : [],
            extras: body.extras && typeof body.extras === 'object' ? (body.extras as Record<string, unknown>) : {},
            notes: text(body.notes, 1000),
            acceptedTerms: body.acceptedTerms === true,
        });
        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        if (error instanceof MasqueradeError) {
            return NextResponse.json(
                { success: false, code: error.code, message: error.message, available: error.available },
                { status: STATUS_BY_CODE[error.code] },
            );
        }
        console.error('[masquerade] checkout failed', error);
        return NextResponse.json(
            { success: false, message: 'Something went wrong. Please try again or call us on +91 8075 416 514.' },
            { status: 500 },
        );
    }
}
