/**
 * Integration tests for analytics, against a real database.
 *
 * These queries are almost entirely raw SQL — `FILTER (WHERE …)`, a
 * `generate_series` gap-fill, `AT TIME ZONE` chained twice, an interval join for
 * opt-out attribution — and `tsc` checks none of it. They are also the numbers a
 * hotel would use to decide whether to keep paying for this, so "it ran" is not
 * enough: the fixture below has known counts and the expected rates are asserted
 * exactly.
 *
 * Run:
 *   npx esbuild scripts/test-analytics-db.ts --bundle --platform=node \
 *     --format=cjs --alias:@=. --outfile=/tmp/tan.cjs \
 *     && node --env-file=.env /tmp/tan.cjs
 */

import { db } from '@/lib/db';
import {
    waContacts, waMessages, waTemplates, waConsentEvents, waInboxThreads, waInboxMessages,
} from '@/lib/db/schema';
import { eq, like } from 'drizzle-orm';
import {
    funnel, dailyTrends, costSummary, templateLeaderboard, bestTimeToSend,
    consentSnapshot, analyticsOverview, defaultRange,
} from '@/lib/services/whatsapp/analytics';

const PHONE_PREFIX = '+91900000030';
const TEMPLATE_MARKETING = 'zz_test_an_marketing';
const TEMPLATE_UTILITY = 'zz_test_an_utility';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string) {
    if (condition) { passed++; console.log(`  PASS  ${name}`); }
    else { failed++; console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ''}`); }
}

async function cleanup() {
    const contacts = await db.query.waContacts.findMany({
        where: like(waContacts.phone, `${PHONE_PREFIX}%`),
        columns: { id: true },
    });
    for (const contact of contacts) {
        await db.delete(waMessages).where(eq(waMessages.contactId, contact.id));
        await db.delete(waContacts).where(eq(waContacts.id, contact.id));
    }
    for (const name of [TEMPLATE_MARKETING, TEMPLATE_UTILITY]) {
        await db.delete(waTemplates).where(eq(waTemplates.name, name));
    }
}

async function main() {
    await cleanup();

    // A baseline, because the live database may hold real rows and every
    // assertion below has to be about the delta this fixture adds.
    const baseline = await funnel(defaultRange(30));
    const baselineConsent = await consentSnapshot();

    const [marketing] = await db.insert(waTemplates).values({
        name: TEMPLATE_MARKETING, language: 'en', category: 'MARKETING',
        status: 'approved', bodyText: 'Offer for {{1}}',
    }).returning();

    const [utility] = await db.insert(waTemplates).values({
        name: TEMPLATE_UTILITY, language: 'en', category: 'UTILITY',
        status: 'approved', bodyText: 'Booking {{1}} confirmed',
    }).returning();

    // Six contacts, six messages, with a deliberately known shape:
    //   sent 5, delivered 4, read 2, failed 1, skipped 0 (+1 queued-not-sent)
    const now = Date.now();
    const hoursAgo = (n: number) => new Date(now - n * 3_600_000);

    const contactIds: string[] = [];
    for (let index = 0; index < 6; index++) {
        const [contact] = await db.insert(waContacts).values({
            phone: `${PHONE_PREFIX}${index}`,
            name: `Analytics Test ${index}`,
            source: 'import',
            consentStatus: index === 5 ? 'opted_out' : 'opted_in',
            consentAt: index === 5 ? null : hoursAgo(200),
        }).returning();
        contactIds.push(contact.id);
    }

    const rows = [
        // marketing: sent+delivered+read
        { c: 0, t: marketing.id, cost: 78, sent: hoursAgo(5), delivered: hoursAgo(5), read: hoursAgo(4), status: 'read' as const },
        // marketing: sent+delivered+read
        { c: 1, t: marketing.id, cost: 78, sent: hoursAgo(6), delivered: hoursAgo(6), read: hoursAgo(5), status: 'read' as const },
        // marketing: sent+delivered, not read
        { c: 2, t: marketing.id, cost: 78, sent: hoursAgo(7), delivered: hoursAgo(7), read: null, status: 'delivered' as const },
        // utility: sent+delivered, not read
        { c: 3, t: utility.id, cost: 13, sent: hoursAgo(8), delivered: hoursAgo(8), read: null, status: 'delivered' as const },
        // utility: sent, never delivered, then failed
        { c: 4, t: utility.id, cost: 13, sent: hoursAgo(9), delivered: null, read: null, status: 'failed' as const },
        // queued, never sent — must count in `queued` but nothing else
        { c: 5, t: utility.id, cost: 13, sent: null, delivered: null, read: null, status: 'queued' as const },
    ];

    for (const [index, row] of rows.entries()) {
        await db.insert(waMessages).values({
            contactId: contactIds[row.c],
            templateId: row.t,
            idempotencyKey: `zz-analytics-${index}-${now}`,
            status: row.status,
            cost: row.cost,
            queuedAt: hoursAgo(10),
            sentAt: row.sent,
            deliveredAt: row.delivered,
            readAt: row.read,
        });
    }

    // One opt-out, shortly after contact 0 received the marketing template, so the
    // attribution join has something to find.
    await db.insert(waConsentEvents).values({
        contactId: contactIds[0],
        phone: `${PHONE_PREFIX}0`,
        fromStatus: 'opted_in',
        toStatus: 'opted_out',
        reason: 'Analytics fixture',
        source: 'test',
        createdAt: hoursAgo(4),
    });

    // One inbound reply, so `replied` is non-zero.
    const [thread] = await db.insert(waInboxThreads).values({
        contactId: contactIds[1], status: 'open', lastMessageAt: hoursAgo(3),
    }).returning();
    await db.insert(waInboxMessages).values({
        threadId: thread.id, direction: 'inbound', type: 'text',
        body: 'Tell me more', status: 'delivered', createdAt: hoursAgo(3),
    });

    const range = defaultRange(30);

    // ---------------------------------------------------------------
    console.log('\n--- funnel: counts are cumulative, not mutually exclusive ---');
    // ---------------------------------------------------------------
    const f = await funnel(range);

    check('queued counts every message', f.queued - baseline.queued === 6, `delta ${f.queued - baseline.queued}`);
    check('sent counts the 5 with a sent_at', f.sent - baseline.sent === 5, `delta ${f.sent - baseline.sent}`);
    check('delivered counts the 4 with a delivered_at', f.delivered - baseline.delivered === 4, `delta ${f.delivered - baseline.delivered}`);
    check('read counts the 2 with a read_at', f.read - baseline.read === 2, `delta ${f.read - baseline.read}`);
    check('a read message is ALSO counted as delivered and sent',
        f.delivered - baseline.delivered >= f.read - baseline.read);
    check('failed counts the 1', f.failed - baseline.failed === 1, `delta ${f.failed - baseline.failed}`);
    check('replied sees the inbound message', f.replied - baseline.replied === 1, `delta ${f.replied - baseline.replied}`);
    check('optedOut sees the consent event', f.optedOut - baseline.optedOut === 1, `delta ${f.optedOut - baseline.optedOut}`);

    // ---------------------------------------------------------------
    console.log('\n--- rates are ratios, and never NaN ---');
    // ---------------------------------------------------------------
    check('deliveryRate is delivered/sent', Math.abs(f.deliveryRate - f.delivered / f.sent) < 1e-9);
    check('readRate is read/delivered', Math.abs(f.readRate - f.read / f.delivered) < 1e-9);
    check('every rate is a finite number between 0 and 1',
        [f.deliveryRate, f.readRate, f.optOutRate].every((r) => Number.isFinite(r) && r >= 0 && r <= 1),
        JSON.stringify([f.deliveryRate, f.readRate, f.optOutRate]));

    const emptyRange = { from: new Date('2000-01-01'), to: new Date('2000-01-02') };
    const emptyFunnel = await funnel(emptyRange);
    check('an empty range reports zeroes, not NaN',
        emptyFunnel.deliveryRate === 0 && emptyFunnel.readRate === 0 && emptyFunnel.optOutRate === 0,
        JSON.stringify(emptyFunnel));

    // ---------------------------------------------------------------
    console.log('\n--- dailyTrends: the generate_series gap-fill ---');
    // ---------------------------------------------------------------
    const trends = await dailyTrends(defaultRange(7));
    check('one point per day, inclusive of both ends', trends.length === 8, `got ${trends.length}`);
    check('days are ISO dates', trends.every((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.day)), trends[0]?.day);
    check('days are ordered', trends.every((p, i) => i === 0 || p.day > trends[i - 1].day));
    check('quiet days are filled with zero rather than missing',
        trends.every((p) => Number.isFinite(p.sent) && p.sent >= 0));
    check('the fixture volume shows up somewhere in the window',
        trends.reduce((sum, p) => sum + p.sent, 0) >= 5,
        `total ${trends.reduce((sum, p) => sum + p.sent, 0)}`);

    // ---------------------------------------------------------------
    console.log('\n--- cost: paise, split by category ---');
    // ---------------------------------------------------------------
    const cost = await costSummary(range);
    check('marketing cost includes the 3 marketing sends (3 x 78)',
        cost.marketingPaise >= 234, `got ${cost.marketingPaise}`);
    check('utility cost includes the 2 utility sends (2 x 13)',
        cost.utilityPaise >= 26, `got ${cost.utilityPaise}`);
    check('total is at least the two parts',
        cost.totalPaise >= cost.marketingPaise + cost.utilityPaise - 1,
        `${cost.totalPaise} vs ${cost.marketingPaise}+${cost.utilityPaise}`);
    check('cost per delivered is an integer number of paise',
        Number.isInteger(cost.costPerDeliveredPaise), `got ${cost.costPerDeliveredPaise}`);
    check('budget state is one of the three known values',
        ['ok', 'warn', 'over'].includes(cost.state), cost.state);
    check('percentOfBudget is a number', Number.isFinite(cost.percentOfBudget));

    // ---------------------------------------------------------------
    console.log('\n--- template leaderboard, incl. the opt-out attribution join ---');
    // ---------------------------------------------------------------
    const leaderboard = await templateLeaderboard(range);
    const marketingStat = leaderboard.find((t) => t.name === TEMPLATE_MARKETING);
    const utilityStat = leaderboard.find((t) => t.name === TEMPLATE_UTILITY);

    check('the marketing template appears', !!marketingStat);
    check('with 3 sends', marketingStat?.sent === 3, `got ${marketingStat?.sent}`);
    check('and 2 reads', marketingStat?.read === 2, `got ${marketingStat?.read}`);
    check('read rate is 2/3 of delivered',
        Math.abs((marketingStat?.readRate ?? 0) - 2 / 3) < 1e-9, `got ${marketingStat?.readRate}`);
    check('the opt-out that followed it is attributed to it',
        marketingStat?.optOuts === 1, `got ${marketingStat?.optOuts}`);
    check('the utility template is NOT blamed for that opt-out',
        utilityStat?.optOuts === 0, `got ${utilityStat?.optOuts}`);
    check('the utility template appears with 2 sends', utilityStat?.sent === 2, `got ${utilityStat?.sent}`);

    // ---------------------------------------------------------------
    console.log('\n--- best time to send: 24 stable slots, in hotel time ---');
    // ---------------------------------------------------------------
    const hours = await bestTimeToSend(range);
    check('exactly 24 buckets', hours.length === 24, `got ${hours.length}`);
    check('hours run 0..23 in order', hours.every((h, i) => h.hour === i));
    check('every read rate is finite', hours.every((h) => Number.isFinite(h.readRate)));
    check('the fixture sends are distributed across the buckets',
        hours.reduce((sum, h) => sum + h.sent, 0) >= 5,
        `total ${hours.reduce((sum, h) => sum + h.sent, 0)}`);

    // ---------------------------------------------------------------
    console.log('\n--- consent snapshot ---');
    // ---------------------------------------------------------------
    const consent = await consentSnapshot();
    check('total counts the new contacts',
        consent.total - baselineConsent.total === 6, `delta ${consent.total - baselineConsent.total}`);
    check('proofPercent is a percentage',
        consent.proofPercent >= 0 && consent.proofPercent <= 100, `got ${consent.proofPercent}`);
    check('an opted-in contact without a consentAt is NOT counted as proven',
        consent.withProof <= consent.optedIn, `${consent.withProof} > ${consent.optedIn}`);

    // ---------------------------------------------------------------
    console.log('\n--- the combined overview runs every query at once ---');
    // ---------------------------------------------------------------
    const overview = await analyticsOverview(defaultRange(30));
    check('overview carries every section',
        !!overview.funnel && !!overview.cost && Array.isArray(overview.trends)
        && Array.isArray(overview.templates) && Array.isArray(overview.hours) && !!overview.consent);
}

main()
    .then(async () => {
        await cleanup();
        console.log(`\n${passed} passed, ${failed} failed\n`);
        process.exit(failed === 0 ? 0 : 1);
    })
    .catch(async (error) => {
        console.error('\nTEST RUN THREW:', error);
        try { await cleanup(); } catch { /* best effort */ }
        process.exit(1);
    });
