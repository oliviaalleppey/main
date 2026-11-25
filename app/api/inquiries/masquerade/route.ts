import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { inquiries } from '@/lib/db/schema';
import { RateLimiter } from '@/lib/rate-limit';
import { sendMasqueradeAcknowledgment, sendMasqueradeRequestToReservations } from '@/lib/services/email';
import { GALA_PACKAGE, formatINR, quoteGala, quoteMasquerade, validateGuest } from '@/lib/masquerade-offer';

type Payload = {
    name?: unknown;
    email?: unknown;
    phone?: unknown;
    rooms?: unknown;
    extras?: unknown;
    notes?: unknown;
    mode?: unknown;
    gala?: unknown;
};

function clean(value: unknown, maxLength: number): string {
    if (typeof value !== 'string') return '';
    return value.trim().slice(0, maxLength);
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export async function POST(request: Request) {
    try {
        let body: Payload;
        try {
            body = (await request.json()) as Payload;
        } catch {
            return NextResponse.json({ success: false, message: 'Invalid request.' }, { status: 400 });
        }

        const name = clean(body.name, 120);
        const email = clean(body.email, 160);
        const phone = clean(body.phone, 20);
        const notes = clean(body.notes, 1000);
        const rooms = Array.isArray(body.rooms) ? (body.rooms as Record<string, unknown>[]).slice(0, 6) : [];
        const extras = body.extras && typeof body.extras === 'object' ? (body.extras as Record<string, unknown>) : {};

        const errors = validateGuest({ name, email, phone });
        if (Object.keys(errors).length > 0) {
            return NextResponse.json({ success: false, message: Object.values(errors)[0], errors }, { status: 400 });
        }

        // Each request emails the hotel and the guest, so scripted floods are cut off per connection.
        const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
        const limit = await RateLimiter.check(ip, 'masqueradeRequest', { limit: 5, windowMs: 60 * 60 * 1000 });
        if (!limit.allowed) {
            return NextResponse.json(
                { success: false, message: 'Too many requests from this connection. Please call us on +91 8075 416 514.' },
                { status: 429 },
            );
        }

        // Gala only: the evening for a couple with no stay. It is a request, so the hotel confirms and takes payment.
        const galaOnly = body.mode === 'gala';

        if (!galaOnly && rooms.length < 1) {
            return NextResponse.json({ success: false, message: 'Choose at least one package.' }, { status: 400 });
        }

        // The total always comes from the server's price list, never from the browser.
        const quote = galaOnly ? null : quoteMasquerade(rooms, extras);
        if (quote?.problem) {
            return NextResponse.json({ success: false, message: quote.problem }, { status: 400 });
        }
        const gala = galaOnly ? quoteGala(body.gala) : null;
        const lines = gala
            ? [{ label: `${GALA_PACKAGE.name} (stay not included)`, qty: gala.qty, unitPaise: gala.unitPaise, amountPaise: gala.subtotalPaise }]
            : quote!.lines;
        const gstPaise = gala ? gala.gstPaise : quote!.gstPaise;
        const totalPaise = gala ? gala.totalPaise : quote!.totalPaise;
        const pk = gala ? 0 : quote!.rooms;
        const summary = [
            gala ? 'The Grand Masquerade, 31 December. Gala evening only, stay not included.' : `The Grand Masquerade, 31 December. Packages: ${pk}`,
            ...lines.map((l) => `${l.label} x ${l.qty} @ ${formatINR(l.unitPaise)} = ${formatINR(l.amountPaise)}`),
            `GST (18%): ${formatINR(gstPaise)}`,
            `Total: ${formatINR(totalPaise)}`,
            notes ? `Special requests: ${notes}` : '',
        ]
            .filter(Boolean)
            .join('\n');

        let saved = false;
        try {
            await db.insert(inquiries).values({
                type: 'masquerade',
                name,
                email,
                phone,
                eventDate: '2026-12-31',
                guestCount: gala ? gala.qty * 2 : pk,
                message: summary,
            });
            saved = true;
        } catch (error) {
            console.error('[masquerade] could not save the request', error);
        }

        let emailed = false;
        try {
            const result = await sendMasqueradeRequestToReservations({
                name: escapeHtml(name),
                email: escapeHtml(email),
                phone: escapeHtml(phone),
                packages: pk,
                lines: [
                    ...lines.map((l) => ({
                        label: escapeHtml(l.label),
                        qty: l.qty,
                        unit: formatINR(l.unitPaise),
                        amount: formatINR(l.amountPaise),
                    })),
                    { label: 'GST (18%)', qty: 1, unit: formatINR(gstPaise), amount: formatINR(gstPaise) },
                ],
                total: formatINR(totalPaise),
                notes: escapeHtml(notes),
            });
            emailed = !(result && typeof result === 'object' && 'skipped' in result && result.skipped);
        } catch (error) {
            console.error('[masquerade] could not email the reservations team', error);
        }

        if (!saved && !emailed) {
            return NextResponse.json(
                { success: false, message: 'We could not send your request. Please call us on +91 8075 416 514.' },
                { status: 503 },
            );
        }

        // Best effort: the guest's confirmation never decides whether the request counts as sent.
        sendMasqueradeAcknowledgment({
            to: email,
            name: escapeHtml(name),
            lines: [
                ...lines.map((l) => ({ label: escapeHtml(l.label), qty: l.qty, amount: formatINR(l.amountPaise) })),
                { label: 'GST (18%)', qty: 1, amount: formatINR(gstPaise) },
            ],
            total: formatINR(totalPaise),
        }).catch((error) => console.error('[masquerade] guest acknowledgment failed', error));

        return NextResponse.json({ success: true, total: totalPaise });
    } catch (error) {
        console.error('[masquerade] failed', error);
        return NextResponse.json(
            { success: false, message: 'Something went wrong. Please try again or call us on +91 8075 416 514.' },
            { status: 500 },
        );
    }
}
