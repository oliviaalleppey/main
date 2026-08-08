import { NextResponse } from 'next/server';
import { verifySignature, processWebhook, recordEvent } from '@/lib/services/whatsapp/webhook';

export const dynamic = 'force-dynamic';

/**
 * Meta's webhook endpoint.
 *
 * GET  — the one-time subscription handshake (hub.challenge).
 * POST — statuses, inbound messages and template status updates.
 *
 * This route is **public by necessity**: Meta calls it with no session. Its only
 * authentication is the HMAC signature over the raw body, so that check is not
 * optional and there is deliberately no way to disable it from configuration.
 */

/** GET — subscription verification. Meta calls this once when the URL is registered. */
export async function GET(request: Request) {
    const url = new URL(request.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    const expected = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

    if (!expected) {
        console.error('[whatsapp/webhook] WHATSAPP_WEBHOOK_VERIFY_TOKEN is not set');
        return new Response('Not configured', { status: 500 });
    }

    if (mode === 'subscribe' && token === expected && challenge) {
        // Must be echoed back as plain text, not JSON.
        return new Response(challenge, {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
        });
    }

    return new Response('Forbidden', { status: 403 });
}

/**
 * POST — the event feed.
 *
 * Always answers 200 once the signature is valid, even if processing partly
 * failed. A non-200 makes Meta retry the entire batch, re-delivering the items
 * that already succeeded; the failures are recorded in wa_events instead, where
 * they can be inspected and replayed deliberately.
 */
export async function POST(request: Request) {
    const appSecret = process.env.WHATSAPP_APP_SECRET;

    // Fail closed. An unverifiable webhook endpoint is an open door for anyone
    // who guesses the URL — they could forge opt-outs or fake delivery receipts.
    if (!appSecret) {
        console.error('[whatsapp/webhook] WHATSAPP_APP_SECRET is not set — rejecting webhook');
        return NextResponse.json({ error: 'Not configured' }, { status: 500 });
    }

    // The raw body, read exactly once. Re-serialising parsed JSON would change
    // key order and whitespace, and the signature would never match.
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    if (!verifySignature(rawBody, signature, appSecret)) {
        console.warn('[whatsapp/webhook] rejected a payload with an invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
        body = JSON.parse(rawBody);
    } catch {
        await recordEvent('malformed', { raw: rawBody.slice(0, 2000) }, { processed: false, error: 'Invalid JSON' });
        return NextResponse.json({ ok: true, ignored: 'malformed JSON' });
    }

    try {
        const result = await processWebhook(body);

        await recordEvent(
            'webhook',
            body,
            { processed: result.errors.length === 0, error: result.errors.join('; ') || undefined },
        );

        return NextResponse.json({ ok: true, ...result });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Processing failed';
        console.error('[whatsapp/webhook] processing failed', error);
        await recordEvent('webhook', body, { processed: false, error: message });

        // Still a 200: the payload is stored, so a retry would only duplicate work.
        return NextResponse.json({ ok: false, error: message }, { status: 200 });
    }
}
