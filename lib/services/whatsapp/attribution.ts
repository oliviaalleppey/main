import { db } from '@/lib/db';
import {
    bookings,
    waBookingAttribution,
    waCampaigns,
    waClicks,
    waContacts,
    waMessages,
} from '@/lib/db/schema';
import { and, desc, eq, gte, isNotNull, sql } from 'drizzle-orm';
import crypto from 'crypto';
import { getSettings } from './settings';
import { SITE_URL } from '@/lib/seo';

/**
 * Campaign attribution: which WhatsApp message produced which booking.
 *
 * Two tiers, kept separate on purpose and never summed without a label:
 *
 *   1. `click`       — deterministic. The guest followed /w/<token>, we set a
 *                      first-party cookie, and the booking carried it.
 *   2. `phone_match` — probabilistic. They were messaged, did not click, and
 *                      then booked on a matching number inside a short window.
 *
 * Tier 2 exists because tier 1 loses the phone-to-laptop switch completely, and
 * a number that only ever under-counts is the wrong kind of wrong when its job
 * is justifying spend. But it is a guess, so it is reported as one.
 *
 * The attribution mechanism is the token and the cookie, NOT the UTM parameters
 * on the redirect. UTM is strippable, lost across redirects and long gone by the
 * time a booking row is written; it is emitted only so the hotel's Google
 * Analytics agrees with our numbers.
 */

/** The cookie the click handler sets and the booking flow reads. */
export const CLICK_COOKIE = 'wa_click';

/**
 * Crockford base32: no I, L, O or U, so a token can be read off a screen and
 * typed back without ambiguity, and it cannot accidentally spell anything.
 */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const TOKEN_LENGTH = 8;

/**
 * 8 chars over a 32-symbol alphabet is 40 bits. Random rather than sequential:
 * sequential tokens can be enumerated, which would let anyone walk the campaign
 * list and inflate click counts.
 *
 * Rejection sampling on the byte, so the alphabet stays uniform — `% 32` on a
 * 0..255 byte happens to be uniform for 32, but writing it as a mask makes that
 * independent of the alphabet length if it ever changes.
 */
export function generateToken(length = TOKEN_LENGTH): string {
    let out = '';
    while (out.length < length) {
        const bytes = crypto.randomBytes(length);
        for (const byte of bytes) {
            if (out.length >= length) break;
            const index = byte & 0x1f; // 32 symbols
            out += ALPHABET[index];
        }
    }
    return out;
}

/** Tokens are stored and compared upper-case; Crockford treats them as such. */
export function normalizeToken(raw: string | null | undefined): string | null {
    if (!raw) return null;
    const cleaned = raw.trim().toUpperCase();
    if (!/^[0-9A-HJKMNP-TV-Z]{4,16}$/.test(cleaned)) return null;
    return cleaned;
}

// --------------------------------------------
// Bot detection
// --------------------------------------------

/**
 * WhatsApp fetches a link to build its preview card, so /w/<token> is hit at
 * SEND time for recipients who never touched it. Unfiltered, click-through rate
 * looks superb and is entirely fictional. This is not defensive polish — it is
 * the difference between a real number and a made-up one.
 *
 * Hits are recorded either way and excluded from reported rates, so an
 * implausible count can still be explained after the fact.
 */
const BOT_PATTERNS: { pattern: RegExp; reason: string }[] = [
    { pattern: /WhatsApp/i, reason: 'whatsapp_preview' },
    { pattern: /facebookexternalhit|facebookcatalog|meta-externalagent/i, reason: 'meta_crawler' },
    { pattern: /bot\b|crawler|spider|slurp/i, reason: 'generic_bot' },
    { pattern: /curl|wget|python-requests|axios|go-http-client|okhttp|libwww/i, reason: 'http_client' },
    { pattern: /preview|link-?check|validator|monitoring|uptime/i, reason: 'preview_fetcher' },
    { pattern: /headless|phantomjs|puppeteer|playwright/i, reason: 'headless_browser' },
];

export type BotVerdict = { isBot: boolean; reason: string | null };

export function classifyUserAgent(userAgent: string | null | undefined): BotVerdict {
    const ua = (userAgent ?? '').trim();
    // No UA at all is not a person using a phone.
    if (!ua) return { isBot: true, reason: 'no_user_agent' };

    for (const { pattern, reason } of BOT_PATTERNS) {
        if (pattern.test(ua)) return { isBot: true, reason };
    }
    return { isBot: false, reason: null };
}

/**
 * IPs are hashed, never stored raw: a click log is a record of where a named
 * guest was when they read a message, and we have no reason to hold that in a
 * re-identifiable form. Salted with AUTH_SECRET so the hash is not reversible
 * by rainbow table over the small IPv4 space.
 */
export function hashIp(ip: string | null | undefined): string | null {
    if (!ip) return null;
    const first = ip.split(',')[0].trim();
    if (!first) return null;
    return crypto
        .createHmac('sha256', process.env.AUTH_SECRET ?? 'wa-click')
        .update(first)
        .digest('hex')
        .slice(0, 64);
}

// --------------------------------------------
// Link building
// --------------------------------------------

/**
 * The base a template's dynamic URL button is built on. Meta allows exactly one
 * variable in a URL button and it must sit at the END of the URL — which is the
 * single constraint that shapes this whole scheme. A multi-parameter UTM query
 * string simply cannot be assembled from template variables, so the per-recipient
 * part has to be one opaque suffix that we resolve server-side.
 */
export function clickLinkBase(): string {
    return `${SITE_URL.replace(/\/$/, '')}/w/`;
}

/** The full link for one message. Used in previews and by the test suites. */
export function clickLink(token: string): string {
    return `${clickLinkBase()}${token}`;
}

/**
 * The button URL as it is registered with Meta: base + `{{1}}`.
 * The linter already requires a full https:// URL, which this satisfies.
 */
export function clickButtonUrlTemplate(): string {
    return `${clickLinkBase()}{{1}}`;
}

/**
 * Where a click should land, with UTM appended for the hotel's GA.
 *
 * `destinationPath` comes from the campaign row and is forced back onto our own
 * origin here. This function is the open-redirect gate: it is the only place a
 * redirect target is produced, and it cannot produce an external one.
 */
export function buildDestination(params: {
    destinationPath: string | null | undefined;
    utmCampaign?: string | null;
    variantLabel?: string | null;
}): string {
    const raw = (params.destinationPath ?? '').trim();

    // Anything that is not a plain site-relative path is discarded rather than
    // repaired. '//evil.com' is a protocol-relative URL, and a URL parser given
    // it will happily resolve to another host — so the check is "starts with a
    // single slash", not "does not contain a scheme".
    const safePath = /^\/(?!\/)/.test(raw) ? raw : '/';

    const url = new URL(safePath, SITE_URL);

    url.searchParams.set('utm_source', 'whatsapp');
    url.searchParams.set('utm_medium', 'broadcast');
    if (params.utmCampaign) url.searchParams.set('utm_campaign', params.utmCampaign);
    if (params.variantLabel) url.searchParams.set('utm_content', params.variantLabel);

    return url.toString();
}

// --------------------------------------------
// Recording a click
// --------------------------------------------

export type ResolvedClick = {
    clickId: string;
    messageId: string | null;
    campaignId: string | null;
    contactId: string | null;
    destination: string;
    isBot: boolean;
};

/**
 * Resolve a token, record the hit, and return where to send the guest.
 *
 * Returns null only when the token does not exist — an expired campaign or a
 * bot hit still resolves, because a guest who kept a two-month-old message and
 * finally tapped it should land on the site rather than on a 404.
 */
export async function recordClick(params: {
    token: string;
    userAgent?: string | null;
    ip?: string | null;
    referer?: string | null;
}): Promise<ResolvedClick | null> {
    const token = normalizeToken(params.token);
    if (!token) return null;

    const [row] = await db
        .select({
            messageId: waMessages.id,
            campaignId: waMessages.campaignId,
            contactId: waMessages.contactId,
            destinationPath: waCampaigns.destinationPath,
            utmCampaign: waCampaigns.utmCampaign,
            variantLabel: waCampaigns.variantLabel,
        })
        .from(waMessages)
        .leftJoin(waCampaigns, eq(waCampaigns.id, waMessages.campaignId))
        .where(eq(waMessages.clickToken, token))
        .limit(1);

    if (!row) return null;

    const verdict = classifyUserAgent(params.userAgent);

    const [click] = await db
        .insert(waClicks)
        .values({
            messageId: row.messageId,
            campaignId: row.campaignId,
            contactId: row.contactId,
            token,
            isBot: verdict.isBot,
            botReason: verdict.reason,
            userAgent: params.userAgent?.slice(0, 500) ?? null,
            ipHash: hashIp(params.ip),
            referer: params.referer?.slice(0, 500) ?? null,
        })
        .returning({ id: waClicks.id });

    return {
        clickId: click.id,
        messageId: row.messageId,
        campaignId: row.campaignId,
        contactId: row.contactId,
        destination: buildDestination({
            destinationPath: row.destinationPath,
            utmCampaign: row.utmCampaign,
            variantLabel: row.variantLabel,
        }),
        isBot: verdict.isBot,
    };
}

/**
 * The promo code advertised by the campaign a click belongs to, if any.
 *
 * This is how a guest who followed a campaign link gets the offer applied
 * without typing anything. It deliberately resolves through the click record
 * rather than a second cookie: there is exactly one thing to keep in sync, and
 * an auto-applied discount is then provably attached to a real click on a real
 * campaign rather than to a value anyone could set in their own browser.
 *
 * Bot clicks are excluded — not for revenue reasons, but because a link-preview
 * fetch is not a guest and should not be seeding anyone's checkout.
 */
export async function offerCodeForClick(clickId: string | null | undefined): Promise<string | null> {
    if (!clickId) return null;

    try {
        const [row] = await db
            .select({ offerCode: waCampaigns.offerCode, isBot: waClicks.isBot })
            .from(waClicks)
            .innerJoin(waCampaigns, eq(waCampaigns.id, waClicks.campaignId))
            .where(eq(waClicks.id, clickId))
            .limit(1);

        if (!row || row.isBot) return null;
        return row.offerCode?.trim() || null;
    } catch (error) {
        // A discount that fails to auto-apply is a guest paying full price.
        // Failing the search that led them here would be far worse.
        console.error('[whatsapp] offer code lookup failed:', error);
        return null;
    }
}

// --------------------------------------------
// Attributing a booking
// --------------------------------------------

export type AttributionResult =
    | { attributed: false; reason: string }
    | { attributed: true; kind: 'click' | 'phone_match'; campaignId: string | null; id: string };

/**
 * Tier 1. The cookie holds a click id; if that click is inside the window, the
 * booking belongs to its campaign.
 *
 * Last touch wins, which is why the cookie carries the most recent click id
 * rather than the first. Every click is still on file in wa_clicks, so a
 * multi-touch model can be built later from data we are already keeping.
 */
async function attributeByClick(params: {
    bookingId: string;
    clickId: string;
    totalAmount: number;
    windowDays: number;
}): Promise<AttributionResult> {
    const cutoff = new Date(Date.now() - params.windowDays * 24 * 60 * 60 * 1000);

    const [click] = await db
        .select({
            id: waClicks.id,
            messageId: waClicks.messageId,
            campaignId: waClicks.campaignId,
            contactId: waClicks.contactId,
            createdAt: waClicks.createdAt,
            isBot: waClicks.isBot,
        })
        .from(waClicks)
        .where(eq(waClicks.id, params.clickId))
        .limit(1);

    if (!click) return { attributed: false, reason: 'click_not_found' };
    // A bot fetched the link and somehow the cookie reached a booking; do not
    // credit a campaign for a crawler.
    if (click.isBot) return { attributed: false, reason: 'bot_click' };
    if (click.createdAt && click.createdAt < cutoff) {
        return { attributed: false, reason: 'outside_click_window' };
    }

    const hours = click.createdAt
        ? Math.max(0, Math.round((Date.now() - click.createdAt.getTime()) / 3_600_000))
        : null;

    const [inserted] = await db
        .insert(waBookingAttribution)
        .values({
            bookingId: params.bookingId,
            campaignId: click.campaignId,
            messageId: click.messageId,
            contactId: click.contactId,
            clickId: click.id,
            kind: 'click',
            revenue: params.totalAmount,
            hoursToBook: hours,
        })
        .onConflictDoNothing({
            target: [waBookingAttribution.bookingId, waBookingAttribution.kind],
        })
        .returning({ id: waBookingAttribution.id });

    if (!inserted) return { attributed: false, reason: 'already_attributed' };

    return { attributed: true, kind: 'click', campaignId: click.campaignId, id: inserted.id };
}

/**
 * Tier 2. No click, but this number was sent a campaign message recently.
 *
 * Matched on the last 10 digits, the same rule the contact detail page already
 * uses for booking history — Indian numbers arrive with and without +91 and
 * with assorted spacing, and the last 10 are the stable part.
 *
 * Deliberately narrow: campaign sends only. Crediting a booking to the booking
 * confirmation message the same booking triggered would be a circular number
 * that makes automations look like a revenue engine.
 */
async function attributeByPhone(params: {
    bookingId: string;
    guestPhone: string;
    totalAmount: number;
    windowDays: number;
}): Promise<AttributionResult> {
    const digits = params.guestPhone.replace(/\D/g, '');
    if (digits.length < 10) return { attributed: false, reason: 'phone_too_short' };
    const last10 = digits.slice(-10);

    const cutoff = new Date(Date.now() - params.windowDays * 24 * 60 * 60 * 1000);

    const [match] = await db
        .select({
            messageId: waMessages.id,
            campaignId: waMessages.campaignId,
            contactId: waMessages.contactId,
            sentAt: waMessages.sentAt,
        })
        .from(waMessages)
        .innerJoin(waContacts, eq(waContacts.id, waMessages.contactId))
        .where(
            and(
                isNotNull(waMessages.campaignId),
                isNotNull(waMessages.sentAt),
                gte(waMessages.sentAt, cutoff),
                sql`right(regexp_replace(${waContacts.phone}, '[^0-9]', '', 'g'), 10) = ${last10}`,
            ),
        )
        .orderBy(desc(waMessages.sentAt))
        .limit(1);

    if (!match) return { attributed: false, reason: 'no_recent_message' };

    const hours = match.sentAt
        ? Math.max(0, Math.round((Date.now() - match.sentAt.getTime()) / 3_600_000))
        : null;

    const [inserted] = await db
        .insert(waBookingAttribution)
        .values({
            bookingId: params.bookingId,
            campaignId: match.campaignId,
            messageId: match.messageId,
            contactId: match.contactId,
            kind: 'phone_match',
            revenue: params.totalAmount,
            hoursToBook: hours,
        })
        .onConflictDoNothing({
            target: [waBookingAttribution.bookingId, waBookingAttribution.kind],
        })
        .returning({ id: waBookingAttribution.id });

    if (!inserted) return { attributed: false, reason: 'already_attributed' };

    return { attributed: true, kind: 'phone_match', campaignId: match.campaignId, id: inserted.id };
}

/**
 * The single entry point the booking flow calls.
 *
 * Both tiers are attempted: a booking that has a click record can still also
 * carry a phone-match record, which is what makes the two comparable when the
 * hotel asks how much the probabilistic tier is really adding.
 *
 * This never throws. A messaging analytics failure must not fail a booking that
 * has already been paid for — the same rule fireAutomation() follows.
 */
export async function attributeBooking(params: {
    bookingId: string;
    clickId?: string | null;
}): Promise<{ click: AttributionResult; phone: AttributionResult }> {
    const skipped = (reason: string): AttributionResult => ({ attributed: false, reason });

    try {
        const [booking] = await db
            .select({
                id: bookings.id,
                guestPhone: bookings.guestPhone,
                totalAmount: bookings.totalAmount,
            })
            .from(bookings)
            .where(eq(bookings.id, params.bookingId))
            .limit(1);

        if (!booking) {
            return { click: skipped('booking_not_found'), phone: skipped('booking_not_found') };
        }

        const settings = await getSettings();

        const click = params.clickId
            ? await attributeByClick({
                bookingId: booking.id,
                clickId: params.clickId,
                totalAmount: booking.totalAmount ?? 0,
                windowDays: settings.clickAttributionDays ?? 30,
            })
            : skipped('no_click_cookie');

        const phone = settings.phoneAttributionEnabled
            ? await attributeByPhone({
                bookingId: booking.id,
                guestPhone: booking.guestPhone ?? '',
                totalAmount: booking.totalAmount ?? 0,
                windowDays: settings.phoneAttributionDays ?? 7,
            })
            : skipped('phone_attribution_disabled');

        return { click, phone };
    } catch (error) {
        // Deliberately swallowed and logged, not rethrown.
        console.error('[whatsapp] attribution failed:', error);
        return { click: skipped('error'), phone: skipped('error') };
    }
}
