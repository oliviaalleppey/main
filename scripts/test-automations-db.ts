/**
 * Integration tests for transactional automations, against a real database.
 *
 * The centrepiece is the last section. `fireAutomation` queues a `wa_messages`
 * row with no campaign, and the dispatcher's claim query used to INNER JOIN
 * wa_campaigns — so every automation message was invisible to it and would have
 * sat in `queued` for ever while every screen reported success. Nothing short of
 * running the real dispatcher against a real row catches that, which is why it
 * is tested here rather than reasoned about.
 *
 * Sends go through the mock provider. Settings are mutated to exercise the kill
 * switch and restored in a `finally`.
 *
 * Run:
 *   npx esbuild scripts/test-automations-db.ts --bundle --platform=node \
 *     --format=cjs --alias:@=. --outfile=/tmp/tau.cjs \
 *     && node --env-file=.env /tmp/tau.cjs
 */

import { db } from '@/lib/db';
import { waContacts, waMessages, waTemplates, waAutomations, waSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
    fireAutomation, listAutomations, updateAutomation, recentFires, dueForSchedule,
} from '@/lib/services/whatsapp/automations';
import { dispatch } from '@/lib/services/whatsapp/dispatcher';
import { updateSettings, invalidateSettingsCache } from '@/lib/services/whatsapp/settings';

const PHONE = '+919000000201';
const UTILITY_TEMPLATE = 'zz_test_auto_utility';
const MARKETING_TEMPLATE = 'zz_test_auto_marketing';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string) {
    if (condition) { passed++; console.log(`  PASS  ${name}`); }
    else { failed++; console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ''}`); }
}

let settingsSnapshot: { enabled: boolean; testMode: boolean; testNumbers: string[] } | null = null;
const automationSnapshot: {
    enabled: boolean;
    templateId: string | null;
    fireCount: number;
    lastFiredAt: Date | null;
}[] = [];

async function restore() {
    if (settingsSnapshot) {
        await updateSettings(settingsSnapshot);
        invalidateSettingsCache();
    }
    // Automations are seeded rows that belong to the hotel, not to this test.
    for (const [index, key] of ['booking_confirmation', 'birthday_greeting'].entries()) {
        const snap = automationSnapshot[index];
        if (snap) {
            await db
                .update(waAutomations)
                .set({
                    enabled: snap.enabled,
                    templateId: snap.templateId,
                    // The counters matter too: a test run that leaves
                    // "fired 2x, last: today" on the automations screen is
                    // reporting messages the hotel never sent.
                    fireCount: snap.fireCount,
                    lastFiredAt: snap.lastFiredAt,
                })
                .where(eq(waAutomations.key, key));
        }
    }
}

async function cleanup() {
    const contact = await db.query.waContacts.findFirst({
        where: eq(waContacts.phone, PHONE),
        columns: { id: true },
    });
    if (contact) {
        await db.delete(waMessages).where(eq(waMessages.contactId, contact.id));
        await db.delete(waContacts).where(eq(waContacts.id, contact.id));
    }
    for (const name of [UTILITY_TEMPLATE, MARKETING_TEMPLATE]) {
        await db.delete(waTemplates).where(eq(waTemplates.name, name));
    }
}

async function main() {
    await cleanup();

    const settingsBefore = await db.query.waSettings.findFirst({ where: eq(waSettings.key, 'default') });
    if (!settingsBefore) throw new Error('wa_settings singleton missing');
    settingsSnapshot = {
        enabled: settingsBefore.enabled ?? false,
        testMode: settingsBefore.testMode ?? true,
        testNumbers: (settingsBefore.testNumbers as string[] | null) ?? [],
    };

    for (const key of ['booking_confirmation', 'birthday_greeting']) {
        const row = await db.query.waAutomations.findFirst({ where: eq(waAutomations.key, key) });
        automationSnapshot.push({
            enabled: row?.enabled ?? false,
            templateId: row?.templateId ?? null,
            fireCount: row?.fireCount ?? 0,
            lastFiredAt: row?.lastFiredAt ?? null,
        });
    }

    // ---------------------------------------------------------------
    console.log('\n--- the seeded automations are all present and off ---');
    // ---------------------------------------------------------------
    const seeded = await listAutomations();
    check('all 7 automations exist', seeded.length === 7, `got ${seeded.length}`);
    check('every one has a label', seeded.every((a) => !!a.label));
    check('none is "ready" without a template', seeded.every((a) => !a.template || a.ready || !a.enabled));

    // ---------------------------------------------------------------
    console.log('\n--- refusals before anything is configured ---');
    // ---------------------------------------------------------------
    await updateAutomation('booking_confirmation', { enabled: false, templateId: null });

    let outcome = await fireAutomation('booking_confirmation', { phone: PHONE, dedupe: 'bk-1' });
    check('a disabled automation does not fire',
        !outcome.queued && outcome.reason === 'disabled', JSON.stringify(outcome));

    await updateAutomation('booking_confirmation', { enabled: true, templateId: null });
    outcome = await fireAutomation('booking_confirmation', { phone: PHONE, dedupe: 'bk-1' });
    check('an automation with no template does not fire',
        !outcome.queued && outcome.reason === 'no_template', JSON.stringify(outcome));

    // ---------------------------------------------------------------
    console.log('\n--- an unapproved template is refused ---');
    // ---------------------------------------------------------------
    const [draft] = await db
        .insert(waTemplates)
        .values({
            name: UTILITY_TEMPLATE, language: 'en', category: 'UTILITY',
            status: 'draft', bodyText: 'Hi {{1}}, booking {{2}} is confirmed.',
        })
        .returning();

    await updateAutomation('booking_confirmation', { enabled: true, templateId: draft.id });
    outcome = await fireAutomation('booking_confirmation', { phone: PHONE, dedupe: 'bk-1' });
    check('a draft template does not fire',
        !outcome.queued && outcome.reason === 'template_not_approved', JSON.stringify(outcome));

    await db.update(waTemplates).set({ status: 'approved' }).where(eq(waTemplates.id, draft.id));

    // ---------------------------------------------------------------
    console.log('\n--- an invalid number is refused before a contact is made ---');
    // ---------------------------------------------------------------
    outcome = await fireAutomation('booking_confirmation', { phone: 'not-a-number', dedupe: 'bk-x' });
    check('a junk phone number is refused',
        !outcome.queued && outcome.reason === 'invalid_phone', JSON.stringify(outcome));

    // ---------------------------------------------------------------
    console.log('\n--- the kill switch is recorded, not silently swallowed ---');
    // ---------------------------------------------------------------
    await updateSettings({ enabled: false });
    invalidateSettingsCache();

    outcome = await fireAutomation('booking_confirmation', { phone: PHONE, dedupe: 'bk-killswitch' });
    check('the kill switch blocks the fire',
        !outcome.queued && outcome.reason === 'kill_switch_off', JSON.stringify(outcome));

    const skippedRows = await recentFires('booking_confirmation');
    check('the block is recorded as a skipped row, so it is explainable later',
        skippedRows.some((row) => row.status === 'skipped' && row.skipReason === 'kill_switch_off'),
        JSON.stringify(skippedRows.map((r) => [r.status, r.skipReason])));

    // ---------------------------------------------------------------
    console.log('\n--- the happy path ---');
    // ---------------------------------------------------------------
    await updateSettings({ enabled: true, testMode: true, testNumbers: [PHONE] });
    invalidateSettingsCache();

    outcome = await fireAutomation('booking_confirmation', {
        phone: PHONE,
        name: 'Test Guest',
        dedupe: 'bk-happy',
        variables: { '1': 'Test Guest', '2': 'OLV-123' },
    });
    check('an armed automation queues a message', outcome.queued === true, JSON.stringify(outcome));

    const contact = await db.query.waContacts.findFirst({ where: eq(waContacts.phone, PHONE) });
    check('a contact was created for the guest', !!contact);
    check('created as PENDING — booking is not marketing consent',
        contact?.consentStatus === 'pending', `got ${contact?.consentStatus}`);
    check('sourced as booking', contact?.source === 'booking', `got ${contact?.source}`);

    const queued = await db.query.waMessages.findMany({
        where: eq(waMessages.automationKey, 'booking_confirmation'),
    });
    const queuedRow = queued.find((m) => m.status === 'queued');
    check('the message is queued', !!queuedRow);
    check('it carries no campaign — this is the case the dispatcher used to miss',
        queuedRow?.campaignId === null, `got ${queuedRow?.campaignId}`);
    check('it is tagged with the automation key', queuedRow?.automationKey === 'booking_confirmation');
    check('the variables were carried through',
        (queuedRow?.variables as Record<string, string>)?.['2'] === 'OLV-123');

    // ---------------------------------------------------------------
    console.log('\n--- idempotency: the same event cannot fire twice ---');
    // ---------------------------------------------------------------
    const again = await fireAutomation('booking_confirmation', {
        phone: PHONE, name: 'Test Guest', dedupe: 'bk-happy',
        variables: { '1': 'Test Guest', '2': 'OLV-123' },
    });
    check('a repeat fire for the same booking is refused',
        !again.queued && again.reason === 'already_fired', JSON.stringify(again));

    const afterRepeat = await db.query.waMessages.findMany({
        where: eq(waMessages.automationKey, 'booking_confirmation'),
    });
    check('no duplicate row was written',
        afterRepeat.filter((m) => m.status === 'queued').length === 1,
        `got ${afterRepeat.filter((m) => m.status === 'queued').length}`);

    const different = await fireAutomation('booking_confirmation', {
        phone: PHONE, name: 'Test Guest', dedupe: 'bk-different',
    });
    check('a different booking DOES fire', different.queued === true, JSON.stringify(different));

    // ---------------------------------------------------------------
    console.log('\n--- marketing automations still obey the consent gate ---');
    // ---------------------------------------------------------------
    const [marketing] = await db
        .insert(waTemplates)
        .values({
            name: MARKETING_TEMPLATE, language: 'en', category: 'MARKETING',
            status: 'approved', bodyText: 'Happy birthday {{1}}! Here is an offer.',
        })
        .returning();

    await updateAutomation('birthday_greeting', { enabled: true, templateId: marketing.id });

    const birthday = await fireAutomation('birthday_greeting', { phone: PHONE, dedupe: '2026-08-08' });
    check('a MARKETING automation is blocked for a pending contact',
        !birthday.queued && birthday.reason === 'not_opted_in', JSON.stringify(birthday));

    // ---------------------------------------------------------------
    console.log('\n--- dueForSchedule: the raw date query must parse and run ---');
    // ---------------------------------------------------------------
    for (const key of ['prearrival', 'checkout_review'] as const) {
        await updateAutomation(key, { enabled: true, templateId: draft.id });
        const due = await dueForSchedule(key);
        check(`dueForSchedule("${key}") runs against the bookings table`, Array.isArray(due));
        await updateAutomation(key, { enabled: false, templateId: null });
    }

    const disabledSweep = await dueForSchedule('prearrival');
    check('a disabled schedule returns nothing without touching the DB',
        disabledSweep.length === 0, `got ${disabledSweep.length}`);

    // ---------------------------------------------------------------
    console.log('\n--- THE REGRESSION: the dispatcher must claim campaign-less messages ---');
    // ---------------------------------------------------------------
    const beforeDispatch = await db.query.waMessages.findMany({
        where: eq(waMessages.automationKey, 'booking_confirmation'),
    });
    const queuedBefore = beforeDispatch.filter((m) => m.status === 'queued').length;
    check('there are queued automation messages to claim', queuedBefore === 2, `got ${queuedBefore}`);

    const dispatchResult = await dispatch({ limit: 10 });
    check('the dispatcher claimed them',
        dispatchResult.claimed >= queuedBefore,
        `claimed ${dispatchResult.claimed}, expected at least ${queuedBefore} — ${JSON.stringify(dispatchResult)}`);
    check('and actually sent them',
        dispatchResult.sent >= queuedBefore,
        `sent ${dispatchResult.sent} — ${JSON.stringify(dispatchResult)}`);

    const afterDispatch = await db.query.waMessages.findMany({
        where: eq(waMessages.automationKey, 'booking_confirmation'),
    });
    check('none is left stuck in queued',
        afterDispatch.filter((m) => m.status === 'queued').length === 0,
        JSON.stringify(afterDispatch.map((m) => m.status)));
    check('the sent ones carry a wamid',
        afterDispatch.filter((m) => m.status === 'sent').every((m) => !!m.wamid));

    await restore();
}

main()
    .then(async () => {
        await restore();
        await cleanup();
        console.log(`\n${passed} passed, ${failed} failed\n`);
        process.exit(failed === 0 ? 0 : 1);
    })
    .catch(async (error) => {
        console.error('\nTEST RUN THREW:', error);
        try { await restore(); await cleanup(); } catch { /* best effort */ }
        process.exit(1);
    });
