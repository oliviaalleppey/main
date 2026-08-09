import { NextResponse } from 'next/server';
import { CLICK_COOKIE, recordClick, buildDestination } from '@/lib/services/whatsapp/attribution';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ token: string }> };

/** 30 days, matching the default click attribution window in wa_settings. */
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

/**
 * GET /w/<token> — the click endpoint for WhatsApp campaign links.
 *
 * Resolves the per-message token, records the hit, drops a first-party cookie
 * and redirects. It is deliberately the only place a redirect target is
 * produced, and buildDestination() forces that target back onto our own origin:
 * this route must never accept a destination from the request. A `?to=` shape
 * would be an open redirect on the hotel's own domain, in links sent to
 * thousands of guests — the exact thing phishing filters look for.
 *
 * An unknown token still redirects, to the home page. A guest who saved a
 * message for two months and finally tapped it should land on the hotel's site,
 * not on a 404 that reads as "this hotel is broken".
 */
export async function GET(request: Request, { params }: Params) {
    const { token } = await params;

    const home = buildDestination({ destinationPath: '/' });

    let resolved: Awaited<ReturnType<typeof recordClick>> = null;
    try {
        resolved = await recordClick({
            token,
            userAgent: request.headers.get('user-agent'),
            ip: request.headers.get('x-forwarded-for'),
            referer: request.headers.get('referer'),
        });
    } catch (error) {
        // A guest tapping a link must always arrive somewhere. Losing one click
        // record is a reporting gap; a 500 here is a lost booking.
        console.error('[whatsapp] click recording failed:', error);
        return NextResponse.redirect(home, 302);
    }

    if (!resolved) {
        return NextResponse.redirect(`${SITE_URL.replace(/\/$/, '')}/`, 302);
    }

    const response = NextResponse.redirect(resolved.destination, 302);

    // No cookie for a crawler. WhatsApp's own link-preview fetch hits this route
    // at send time for every recipient; giving it a cookie would be harmless in
    // itself, but not setting one keeps the cookie a signal of a real person.
    if (!resolved.isBot) {
        response.cookies.set(CLICK_COOKIE, resolved.clickId, {
            httpOnly: true,
            sameSite: 'lax', // must survive the cross-site hop from WhatsApp
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: COOKIE_MAX_AGE,
        });
    }

    return response;
}
