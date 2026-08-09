/**
 * Campaign attribution against the real database.
 *
 *   npx esbuild scripts/test-attribution-db.ts --bundle --platform=node \
 *     --format=cjs --alias:@=. --outfile=/tmp/tad.cjs && node --env-file=.env /tmp/tad.cjs
 *
 * ⚠️ This suite writes to the `bookings` table, which the rest of the WhatsApp
 * suites do not. Attribution rows carry a real foreign key to a real booking, so
 * there is no way to exercise the path without one. Every booking it creates is
 * tracked by id and deleted in a `finally`, and the last assertions re-read the
 * row count from the database to prove it — the baseline is 90.
 *
 * The properties worth having tests for, in order of how expensive they would be
 * to discover in production:
 *
 *  1. An automation message must never attribute a booking. The booking
 *     confirmation is triggered BY the booking, so crediting it would make
 *     automations look like a revenue engine and the number would grow with
 *     bookings no matter what marketing did.
 *  2. A bot click must not attribute. WhatsApp fetches every link at send time.
 *  3. Attribution must be idempotent — a retried payment callback must not
 *     double-count revenue.
 */

import { db } from '@/lib/db';
import {
    bookings, waBookingAttribution, waCampaigns, waClicks, waContacts,
    waMessages, waTemplates,
} from '@/lib/db/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import {
    recordClick, attributeBooking, generateToken, CLICK_COOKIE,
} from '@/lib/services/whatsapp/attribution';
import { funnel, attributionSummary, variantStats, defaultRange } from '@/lib/services/whatsapp/analytics';
import { readRateSignificance } from '@/lib/services/whatsapp/ab';
import { buildCampaignQueue } from '@/lib/services/whatsapp/campaigns';
import { getSettings, updateSettings, invalidateSettingsCache } from '@/lib/services/whatsapp/settings';

let passed = 0;
let failed = 0;
function check(label: string, condition: boolean, detail?: string) {
    if (condition) { passed++; console.log(`  PASS  ${label}`); }
    else { failed++; console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ''}`); }
}

const HUMAN_UA =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1';
const WHATSAPP_UA = 'WhatsApp/2.23.20.0 A';

const PREFIX = 'ATTRTEST';

/**
 * The booking count when this suite started, captured rather than hard-coded.
 *
 * This runs against the live production database and the hotel takes real
 * bookings while it runs — one arrived mid-run on 2026-08-09. A constant here
 * fails the suite every time someone books a room, which trains whoever sees it
 * to ignore the assertion, and it is the assertion that would catch a genuine
 * leak. What must hold is that this suite leaves the count where it found it.
 */
let bookingBaseline = 0;

const createdBookingIds: string[] = [];
const createdContactIds: string[] = [];
const createdCampaignIds: string[] = [];
const createdTemplateIds: string[] = [];

const DAY = 86_400_000;

/** Everything this suite made, removed in dependency order. */
async function cleanup() {
    if (createdBookingIds.length) {
        await db.delete(waBookingAttribution).where(inArray(waBookingAttribution.bookingId, createdBookingIds));
        await db.delete(bookings).where(inArray(bookings.id, createdBookingIds));
    }
    if (createdContactIds.length) {
        // wa_clicks and wa_messages cascade from the contact.
        await db.delete(waContacts).where(inArray(waContacts.id, createdContactIds));
    }
    if (createdCampaignIds.length) {
        await db.delete(waClicks).where(inArray(waClicks.campaignId, createdCampaignIds));
        await db.delete(waMessages).where(inArray(waMessages.campaignId, createdCampaignIds));
        await db.delete(waCampaigns).where(inArray(waCampaigns.id, createdCampaignIds));
    }
    if (createdTemplateIds.length) {
        await db.delete(waTemplates).where(inArray(waTemplates.id, createdTemplateIds));
    }
}

async function makeContact(phone: string) {
    const [row] = await db.insert(waContacts).values({
        phone,
        name: `${PREFIX} ${phone.slice(-3)}`,
        consentStatus: 'opted_in',
        consentAt: new Date(),
        source: 'manual',
    }).returning();
    createdContactIds.push(row.id);
    return row;
}

async function makeBooking(phone: string, totalPaise: number) {
    const [row] = await db.insert(bookings).values({
        bookingNumber: `${PREFIX}-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        guestName: `${PREFIX} Guest`,
        guestEmail: 'attrtest@example.invalid',
        guestPhone: phone,
        checkIn: '2026-12-01',
        checkOut: '2026-12-03',
        adults: 2,
        subtotal: totalPaise,
        totalAmount: totalPaise,
        status: 'confirmed',
    }).returning();
    createdBookingIds.push(row.id);
    return row;
}

async function makeTemplate(name: string, withDynamicButton: boolean) {
    const [row] = await db.insert(waTemplates).values({
        name,
        language: 'en',
        category: 'MARKETING',
        status: 'approved',
        bodyText: 'Hello {{1}}, our Onam packages are open.',
        variableCount: 1,
        components: withDynamicButton
            ? [
                { type: 'BODY', text: 'Hello {{1}}, our Onam packages are open.' },
                {
                    type: 'BUTTONS',
                    buttons: [
                        { type: 'QUICK_REPLY', text: 'Stop promotions' },
                        { type: 'URL', text: 'See rooms', url: 'https://www.oliviaalleppey.com/w/{{1}}' },
                    ],
                },
            ]
            : [
                { type: 'BODY', text: 'Hello {{1}}, our Onam packages are open.' },
                {
                    type: 'BUTTONS',
                    buttons: [{ type: 'URL', text: 'Visit', url: 'https://www.oliviaalleppey.com/rooms' }],
                },
            ],
    }).returning();
    createdTemplateIds.push(row.id);
    return row;
}

async function makeCampaign(name: string, opts: {
    destinationPath?: string | null;
    utmCampaign?: string | null;
    variantLabel?: string | null;
    variantOf?: string | null;
    templateId?: string | null;
}) {
    const [row] = await db.insert(waCampaigns).values({
        name: `${PREFIX} ${name}`,
        status: 'sending',
        destinationPath: opts.destinationPath ?? '/rooms/houseboat',
        utmCampaign: opts.utmCampaign ?? 'attrtest_2026',
        variantLabel: opts.variantLabel ?? null,
        variantOf: opts.variantOf ?? null,
        templateId: opts.templateId ?? null,
    }).returning();
    createdCampaignIds.push(row.id);
    return row;
}

/** A sent campaign message with a click token. */
async function makeMessage(opts: {
    campaignId: string | null;
    contactId: string;
    token?: string | null;
    sentAt?: Date;
    automationKey?: string | null;
}) {
    const [row] = await db.insert(waMessages).values({
        campaignId: opts.campaignId,
        contactId: opts.contactId,
        automationKey: opts.automationKey ?? null,
        direction: 'outbound',
        status: 'delivered',
        idempotencyKey: `${PREFIX}-${Math.random().toString(36).slice(2)}-${Date.now()}`,
        clickToken: opts.token ?? null,
        sentAt: opts.sentAt ?? new Date(),
        deliveredAt: opts.sentAt ?? new Date(),
    }).returning();
    return row;
}

async function main() {
    const [startCount] = await db.select({ n: sql<number>`count(*)::int` }).from(bookings);
    bookingBaseline = Number(startCount.n);
    console.log(`\nbookings at start: ${bookingBaseline}`);

    // ----------------------------------------
    console.log('\n--- a click resolves, records and redirects ---');
    // ----------------------------------------

    const contact = await makeContact('+919000000801');
    const campaign = await makeCampaign('click campaign', { destinationPath: '/rooms/houseboat' });
    const token = generateToken();
    const message = await makeMessage({ campaignId: campaign.id, contactId: contact.id, token });

    const resolved = await recordClick({ token, userAgent: HUMAN_UA, ip: '49.37.128.14' });

    check('a known token resolves', resolved !== null);
    check('the click is tied to its message', resolved?.messageId === message.id);
    check('the click is tied to its campaign', resolved?.campaignId === campaign.id);
    check('the click is tied to its contact', resolved?.contactId === contact.id);
    check('a human click is not flagged as a bot', resolved?.isBot === false);
    check('the destination comes from the campaign',
        resolved?.destination.includes('/rooms/houseboat') === true, resolved?.destination);
    check('the destination carries utm_campaign',
        resolved?.destination.includes('utm_campaign=attrtest_2026') === true);
    check('the destination stays on our origin',
        new URL(resolved!.destination).origin === 'https://www.oliviaalleppey.com');

    const lowercase = await recordClick({ token: token.toLowerCase(), userAgent: HUMAN_UA });
    check('a lower-cased token still resolves', lowercase !== null);

    check('an unknown token resolves to nothing',
        (await recordClick({ token: 'ZZZZZZZZ', userAgent: HUMAN_UA })) === null);
    check('a malformed token resolves to nothing',
        (await recordClick({ token: "'; DROP TABLE wa_clicks;--", userAgent: HUMAN_UA })) === null);

    const stored = await db.select().from(waClicks).where(eq(waClicks.messageId, message.id));
    check('every hit is stored', stored.length === 2);
    check('the raw IP is not stored',
        stored.every((row) => row.ipHash !== '49.37.128.14'));
    check('the IP is stored hashed', stored.some((row) => (row.ipHash?.length ?? 0) > 20));

    // ----------------------------------------
    console.log('\n--- the WhatsApp preview fetch is recorded but not counted ---');
    // ----------------------------------------

    const botContact = await makeContact('+919000000802');
    const botToken = generateToken();
    const botMessage = await makeMessage({
        campaignId: campaign.id, contactId: botContact.id, token: botToken,
    });

    const botClick = await recordClick({ token: botToken, userAgent: WHATSAPP_UA });
    check('a preview fetch still resolves', botClick !== null);
    check('a preview fetch is flagged as a bot', botClick?.isBot === true);

    const botRows = await db.select().from(waClicks).where(eq(waClicks.messageId, botMessage.id));
    check('the bot hit is recorded rather than dropped', botRows.length === 1);
    check('the bot hit records why', botRows[0].botReason === 'whatsapp_preview');

    // ----------------------------------------
    console.log('\n--- tier 1: click attribution ---');
    // ----------------------------------------

    const booking = await makeBooking('+919000000801', 4500000); // ₹45,000
    const result = await attributeBooking({ bookingId: booking.id, clickId: resolved!.clickId });

    check('a click inside the window attributes', result.click.attributed === true);
    check('it attributes to the right campaign',
        result.click.attributed && result.click.campaignId === campaign.id);
    check('it is labelled as a click', result.click.attributed && result.click.kind === 'click');

    const [attrRow] = await db.select().from(waBookingAttribution)
        .where(eq(waBookingAttribution.bookingId, booking.id));
    check('the revenue is snapshotted in paise', attrRow.revenue === 4500000);
    check('the message is recorded', attrRow.messageId === message.id);
    check('the contact is recorded', attrRow.contactId === contact.id);
    check('hours-to-book is recorded', attrRow.hoursToBook === 0);

    // A retried payment callback must not double-count.
    const again = await attributeBooking({ bookingId: booking.id, clickId: resolved!.clickId });
    check('a second attribution is refused', again.click.attributed === false);
    check('it says it was already attributed',
        !again.click.attributed && again.click.reason === 'already_attributed');

    const rowsNow = await db.select().from(waBookingAttribution)
        .where(eq(waBookingAttribution.bookingId, booking.id));
    check('revenue is not double-counted',
        rowsNow.filter((r) => r.kind === 'click').length === 1);

    // ----------------------------------------
    console.log('\n--- tier 1 refuses what it should ---');
    // ----------------------------------------

    const botBooking = await makeBooking('+919000000802', 1000000);
    const botAttr = await attributeBooking({ bookingId: botBooking.id, clickId: botClick!.clickId });
    check('a bot click does not attribute', botAttr.click.attributed === false);
    check('it says the click was a bot',
        !botAttr.click.attributed && botAttr.click.reason === 'bot_click');

    const noCookie = await attributeBooking({ bookingId: botBooking.id, clickId: null });
    check('no cookie means no click attribution', noCookie.click.attributed === false);
    check('it says there was no cookie',
        !noCookie.click.attributed && noCookie.click.reason === 'no_click_cookie');

    const missing = await attributeBooking({
        bookingId: botBooking.id, clickId: '00000000-0000-4000-8000-000000000000',
    });
    check('an unknown click id does not attribute', missing.click.attributed === false);
    check('an unknown booking id is handled',
        (await attributeBooking({ bookingId: '00000000-0000-4000-8000-000000000000' }))
            .click.attributed === false);

    // Age a click past the 30-day window.
    const staleContact = await makeContact('+919000000803');
    const staleToken = generateToken();
    await makeMessage({ campaignId: campaign.id, contactId: staleContact.id, token: staleToken });
    const staleClick = await recordClick({ token: staleToken, userAgent: HUMAN_UA });
    await db.update(waClicks)
        .set({ createdAt: new Date(Date.now() - 45 * DAY) })
        .where(eq(waClicks.id, staleClick!.clickId));

    const staleBooking = await makeBooking('+919000000803', 2000000);
    const staleResult = await attributeBooking({
        bookingId: staleBooking.id, clickId: staleClick!.clickId,
    });
    check('a click older than the window does not attribute', staleResult.click.attributed === false);
    check('it says the window lapsed',
        !staleResult.click.attributed && staleResult.click.reason === 'outside_click_window');

    // ----------------------------------------
    console.log('\n--- tier 2: phone match ---');
    // ----------------------------------------

    // Messaged 2 days ago, never clicked, books on the same number.
    const phoneContact = await makeContact('+919000000804');
    await makeMessage({
        campaignId: campaign.id,
        contactId: phoneContact.id,
        sentAt: new Date(Date.now() - 2 * DAY),
    });

    // Booking phone written the way the funnel actually stores it: no +91.
    const phoneBooking = await makeBooking('9000000804', 3000000);
    const phoneResult = await attributeBooking({ bookingId: phoneBooking.id });

    check('a recent campaign message attributes by phone', phoneResult.phone.attributed === true);
    check('it is labelled as a phone match',
        phoneResult.phone.attributed && phoneResult.phone.kind === 'phone_match');
    check('the match works across +91 formatting differences',
        phoneResult.phone.attributed && phoneResult.phone.campaignId === campaign.id);
    check('no click means no click-tier row', phoneResult.click.attributed === false);

    const spacedBooking = await makeBooking('+91 90000 00804', 1500000);
    const spacedResult = await attributeBooking({ bookingId: spacedBooking.id });
    check('a spaced, prefixed number still matches', spacedResult.phone.attributed === true);

    const unknownBooking = await makeBooking('9111111111', 1000000);
    const unknownResult = await attributeBooking({ bookingId: unknownBooking.id });
    check('an unmessaged number does not attribute', unknownResult.phone.attributed === false);
    check('it says there was no recent message',
        !unknownResult.phone.attributed && unknownResult.phone.reason === 'no_recent_message');

    // Outside the 7-day phone window.
    const oldContact = await makeContact('+919000000805');
    await makeMessage({
        campaignId: campaign.id,
        contactId: oldContact.id,
        sentAt: new Date(Date.now() - 20 * DAY),
    });
    const oldBooking = await makeBooking('9000000805', 1000000);
    const oldResult = await attributeBooking({ bookingId: oldBooking.id });
    check('a message older than the phone window does not attribute',
        oldResult.phone.attributed === false);

    // ----------------------------------------
    console.log('\n--- an automation can never attribute a booking ---');
    // ----------------------------------------

    // This is the circularity guard. The booking confirmation is sent BECAUSE of
    // the booking; crediting it would make automations look like a revenue engine
    // whose output rises with bookings no matter what marketing does.
    const autoContact = await makeContact('+919000000806');
    await makeMessage({
        campaignId: null,
        contactId: autoContact.id,
        automationKey: 'booking_confirmation',
        sentAt: new Date(Date.now() - 1 * DAY),
    });
    const autoBooking = await makeBooking('9000000806', 5000000);
    const autoResult = await attributeBooking({ bookingId: autoBooking.id });

    check('an automation message does not attribute by phone',
        autoResult.phone.attributed === false,
        'a booking confirmation must never claim credit for its own booking');
    check('it says there was no qualifying message',
        !autoResult.phone.attributed && autoResult.phone.reason === 'no_recent_message');

    // ----------------------------------------
    console.log('\n--- both tiers can coexist on one booking ---');
    // ----------------------------------------

    const bothContact = await makeContact('+919000000807');
    const bothToken = generateToken();
    await makeMessage({
        campaignId: campaign.id, contactId: bothContact.id, token: bothToken,
        sentAt: new Date(Date.now() - 1 * DAY),
    });
    const bothClick = await recordClick({ token: bothToken, userAgent: HUMAN_UA });
    const bothBooking = await makeBooking('9000000807', 7000000);
    const bothResult = await attributeBooking({
        bookingId: bothBooking.id, clickId: bothClick!.clickId,
    });

    check('the click tier attributes', bothResult.click.attributed === true);
    check('the phone tier also attributes', bothResult.phone.attributed === true);

    const bothRows = await db.select().from(waBookingAttribution)
        .where(eq(waBookingAttribution.bookingId, bothBooking.id));
    check('both rows exist and are distinguishable', bothRows.length === 2);
    check('the kinds are distinct', new Set(bothRows.map((r) => r.kind)).size === 2);

    // ----------------------------------------
    console.log('\n--- the phone tier can be switched off ---');
    // ----------------------------------------

    const before = await getSettings({ fresh: true });
    await updateSettings({ phoneAttributionEnabled: false });
    invalidateSettingsCache();

    const offContact = await makeContact('+919000000808');
    await makeMessage({
        campaignId: campaign.id, contactId: offContact.id, sentAt: new Date(Date.now() - 1 * DAY),
    });
    const offBooking = await makeBooking('9000000808', 1200000);
    const offResult = await attributeBooking({ bookingId: offBooking.id });
    check('the phone tier is skipped when disabled', offResult.phone.attributed === false);
    check('it says it is disabled',
        !offResult.phone.attributed && offResult.phone.reason === 'phone_attribution_disabled');

    await updateSettings({ phoneAttributionEnabled: before.phoneAttributionEnabled ?? true });
    invalidateSettingsCache();
    const restored = await getSettings({ fresh: true });
    check('the setting is restored', restored.phoneAttributionEnabled === before.phoneAttributionEnabled);

    // ----------------------------------------
    console.log('\n--- the funnel counts humans, not preview fetches ---');
    // ----------------------------------------

    const range = defaultRange(30);
    const funnelData = await funnel(range);

    // Humans clicked: message (twice, one distinct), staleClick's message,
    // bothToken's message. The bot message must not appear.
    check('the funnel exposes a click stage', typeof funnelData.clicked === 'number');
    check('repeat taps on one message count once', funnelData.clicked === 3,
        `clicked = ${funnelData.clicked}; expected 3 distinct human-clicked messages`);
    check('the click rate is a fraction, not a percentage',
        funnelData.clickRate >= 0 && funnelData.clickRate <= 1);

    const summary = await attributionSummary(range);
    check('the summary counts click bookings', summary.clickBookings === 2);
    check('the summary sums click revenue', summary.clickRevenue === 4500000 + 7000000);

    // Counted from the table rather than hard-coded. Both tiers are attempted on
    // every booking, so a booking that attributed by click usually also carries a
    // phone match — which is the point of keeping them separate, and exactly the
    // arithmetic a fixed expectation here gets wrong.
    const [phoneRows] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(waBookingAttribution)
        .where(eq(waBookingAttribution.kind, 'phone_match'));
    check('the summary agrees with the table on phone matches',
        summary.phoneBookings === Number(phoneRows.n),
        `summary ${summary.phoneBookings} vs table ${phoneRows.n}`);
    check('a click-attributed booking usually carries a phone match too',
        summary.phoneBookings > summary.clickBookings,
        'both tiers run on every booking, so this is expected — not a bug');
    check('confirmed figures are the click tier only',
        summary.confirmedBookings === summary.clickBookings
        && summary.confirmedRevenue === summary.clickRevenue,
        'the headline number must not silently include the inferred tier');
    check('the two tiers are not pre-summed',
        summary.confirmedBookings !== summary.clickBookings + summary.phoneBookings);
    check('a median time to book is reported', summary.medianHoursToBook !== null);

    // ----------------------------------------
    console.log('\n--- queue build mints tokens only when the template can carry one ---');
    // ----------------------------------------

    const trackedTemplate = await makeTemplate(`${PREFIX.toLowerCase()}_tracked_v1`, true);
    const plainTemplate = await makeTemplate(`${PREFIX.toLowerCase()}_plain_v1`, false);

    const [audience] = await db.execute<{ id: string }>(sql`
        SELECT id::text AS id FROM wa_audiences WHERE is_system = true LIMIT 1
    `).then((r) => r.rows);

    if (audience) {
        const trackedCampaign = await makeCampaign('tracked', {
            templateId: trackedTemplate.id, destinationPath: '/rooms',
        });
        await db.update(waCampaigns)
            .set({ audienceId: audience.id })
            .where(eq(waCampaigns.id, trackedCampaign.id));
        await buildCampaignQueue(trackedCampaign.id);

        const trackedRows = await db.select().from(waMessages)
            .where(eq(waMessages.campaignId, trackedCampaign.id));

        const plainCampaign = await makeCampaign('plain', {
            templateId: plainTemplate.id, destinationPath: '/rooms',
        });
        await db.update(waCampaigns)
            .set({ audienceId: audience.id })
            .where(eq(waCampaigns.id, plainCampaign.id));
        await buildCampaignQueue(plainCampaign.id);

        const plainRows = await db.select().from(waMessages)
            .where(eq(waMessages.campaignId, plainCampaign.id));

        check('a template with a dynamic button gets tokens',
            trackedRows.length === 0 || trackedRows.every((r) => r.clickToken !== null),
            `${trackedRows.filter((r) => r.clickToken === null).length} of ${trackedRows.length} lacked a token`);
        check('a template without one gets none',
            plainRows.every((r) => r.clickToken === null),
            'a token on an untrackable template would be a link nobody can click');
        check('tokens are unique across recipients',
            new Set(trackedRows.map((r) => r.clickToken)).size === trackedRows.length);
    } else {
        check('a system audience exists to build a queue from', false,
            'skipped: no is_system audience found');
    }

    // ----------------------------------------
    console.log('\n--- A/B stats over real rows ---');
    // ----------------------------------------

    const parent = await makeCampaign('variant A', { variantLabel: 'A' });
    const child = await makeCampaign('variant B', { variantLabel: 'B', variantOf: parent.id });

    const armAContact = await makeContact('+919000000809');
    const armBContact = await makeContact('+919000000810');
    await makeMessage({ campaignId: parent.id, contactId: armAContact.id });
    await makeMessage({ campaignId: child.id, contactId: armBContact.id });
    await db.update(waMessages)
        .set({ readAt: new Date() })
        .where(eq(waMessages.campaignId, child.id));

    const arms = await variantStats(parent.id);
    check('both arms are returned', arms.length === 2);
    check('the arms are labelled A and B',
        arms.map((a) => a.label).sort().join(',') === 'A,B');
    check('the parent is arm A', arms.find((a) => a.label === 'A')?.campaignId === parent.id);
    check('the variant is arm B', arms.find((a) => a.label === 'B')?.campaignId === child.id);
    check('arm B recorded its read',
        (arms.find((a) => a.label === 'B')?.read ?? 0) === 1);

    const armA = arms.find((a) => a.label === 'A')!;
    const armB = arms.find((a) => a.label === 'B')!;
    const significance = readRateSignificance(armA, armB);
    check('a two-message test is not significant', significance.significant === false,
        'one read out of one is not a result');
    check('it explains why', significance.caveat !== null);
}

main()
    .then(async () => {
        // ----------------------------------------
        console.log('\n--- everything this suite touched is put back ---');
        // ----------------------------------------
        await cleanup();

        const [bookingCount] = await db.select({ n: sql<number>`count(*)::int` }).from(bookings);
        // `>=` rather than `===`: a real booking arriving mid-run is fine and
        // must not fail the suite. Anything *below* the starting count means this
        // suite deleted a booking it did not create, which is the real disaster.
        const delta = Number(bookingCount.n) - bookingBaseline;
        check(`bookings are back where this suite found them (${bookingBaseline})`,
            delta === 0,
            delta > 0
                ? `${delta} more than at start — either a leak here, or a real booking arrived mid-run (check the newest row before deleting anything)`
                : `${-delta} FEWER than at start — this suite deleted a booking it did not create`);

        const [attrCount] = await db.select({ n: sql<number>`count(*)::int` }).from(waBookingAttribution);
        check('no attribution rows remain', Number(attrCount.n) === 0, `found ${attrCount.n}`);

        const [clickCount] = await db.select({ n: sql<number>`count(*)::int` }).from(waClicks);
        check('no click rows remain', Number(clickCount.n) === 0, `found ${clickCount.n}`);

        const [messageCount] = await db.select({ n: sql<number>`count(*)::int` }).from(waMessages);
        check('no messages remain', Number(messageCount.n) === 0, `found ${messageCount.n}`);

        const [contactCount] = await db.select({ n: sql<number>`count(*)::int` }).from(waContacts);
        check('no contacts remain', Number(contactCount.n) === 0, `found ${contactCount.n}`);

        const [templateCount] = await db.select({ n: sql<number>`count(*)::int` }).from(waTemplates);
        check('no templates remain', Number(templateCount.n) === 0, `found ${templateCount.n}`);

        const [campaignCount] = await db.select({ n: sql<number>`count(*)::int` }).from(waCampaigns);
        check('no campaigns remain', Number(campaignCount.n) === 0, `found ${campaignCount.n}`);

        const settings = await getSettings({ fresh: true });
        check('the kill switch is still off', settings.enabled === false);
        check('test mode is still on', settings.testMode === true);
        check('the phone tier is back on', settings.phoneAttributionEnabled === true);

        console.log(`\n${passed} passed, ${failed} failed`);
        process.exit(failed === 0 ? 0 : 1);
    })
    .catch(async (error) => {
        console.error('\nSUITE ERROR:', error);
        await cleanup().catch((e) => console.error('cleanup also failed:', e));
        process.exit(1);
    });

// Referenced so the cookie name stays in sync with the route that sets it.
void CLICK_COOKIE;
