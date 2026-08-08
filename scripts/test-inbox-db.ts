/**
 * Integration tests for the inbox service, against a real database.
 *
 * The point of this file is the SQL. `listThreads` builds raw fragments that
 * `tsc` cannot check at all — a jsonb `?` membership test, `DESC NULLS LAST`,
 * and a boolean-valued COALESCE in an ORDER BY — and the module's own history
 * says raw SQL here is where the bugs are (see gotcha 2 and 4 in the plan).
 * Executing every filter combination against Postgres is the only way to know
 * those render correctly.
 *
 * It also pins down the rule that matters most: free-form text is refused once
 * the 24-hour service window has closed, on the server, regardless of what the
 * composer happened to be showing.
 *
 * Sending goes through the mock provider (WHATSAPP_PROVIDER is unset), so no
 * message can reach a real number. Settings are mutated to exercise the kill
 * switch and are restored in a `finally`.
 *
 * Run:
 *   npx esbuild scripts/test-inbox-db.ts --bundle --platform=node \
 *     --format=cjs --alias:@=. --outfile=/tmp/tib.cjs \
 *     && node --env-file=.env /tmp/tib.cjs
 */

import { db } from '@/lib/db';
import { waContacts, waInboxThreads, waInboxMessages, waCannedReplies, waSettings } from '@/lib/db/schema';
import { eq, like } from 'drizzle-orm';
import {
    listThreads, getThread, windowState, sendReply, markRead, setThreadStatus,
    assignThread, setLabels, setInternalNotes, unreadTotal,
    listCannedReplies, createCannedReply, updateCannedReply, deleteCannedReply,
    WindowClosedError, SendBlockedError, SERVICE_WINDOW_MS,
} from '@/lib/services/whatsapp/inbox';
import { updateSettings, invalidateSettingsCache, getSettings } from '@/lib/services/whatsapp/settings';

const OPEN_PHONE = '+919000000011';   // window open
const CLOSED_PHONE = '+919000000012'; // window closed
const TEST_TITLE_PREFIX = 'zz_test_canned_';

let passed = 0;
let failed = 0;

/**
 * Snapshot of the live settings row, captured before anything is touched.
 *
 * Module-level rather than local to main() because it has to be restorable from
 * the failure path too: this run turns the kill switch ON, and a throw halfway
 * through must not leave a production hotel able to send messages it never
 * agreed to send.
 */
let settingsSnapshot: { enabled: boolean; testMode: boolean; testNumbers: string[] } | null = null;

async function restoreSettings() {
    if (!settingsSnapshot) return;
    await updateSettings(settingsSnapshot);
    invalidateSettingsCache();
}

function check(name: string, condition: boolean, detail?: string) {
    if (condition) { passed++; console.log(`  PASS  ${name}`); }
    else { failed++; console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ''}`); }
}

async function expectThrows(name: string, fn: () => Promise<unknown>, predicate: (e: unknown) => boolean) {
    try {
        await fn();
        check(name, false, 'expected it to throw, but it resolved');
    } catch (error) {
        check(name, predicate(error), `threw the wrong thing: ${error instanceof Error ? error.message : error}`);
    }
}

async function cleanup() {
    for (const phone of [OPEN_PHONE, CLOSED_PHONE]) {
        const contact = await db.query.waContacts.findFirst({
            where: eq(waContacts.phone, phone),
            columns: { id: true },
        });
        if (contact) await db.delete(waContacts).where(eq(waContacts.id, contact.id));
    }
    await db.delete(waCannedReplies).where(like(waCannedReplies.title, `${TEST_TITLE_PREFIX}%`));
}

async function seedThread(phone: string, windowExpiresAt: Date | null, name: string) {
    const [contact] = await db
        .insert(waContacts)
        .values({ phone, name, source: 'inbound', consentStatus: 'pending' })
        .returning();

    const [thread] = await db
        .insert(waInboxThreads)
        .values({
            contactId: contact.id,
            status: 'open',
            windowExpiresAt,
            lastMessageAt: new Date(),
            lastInboundAt: new Date(),
            unreadCount: 2,
            labels: ['booking_enquiry'],
        })
        .returning();

    await db.insert(waInboxMessages).values([
        {
            threadId: thread.id, direction: 'inbound', type: 'text',
            body: 'First message', status: 'delivered',
            createdAt: new Date(Date.now() - 60_000),
        },
        {
            threadId: thread.id, direction: 'inbound', type: 'text',
            body: 'Most recent message', status: 'delivered',
            createdAt: new Date(),
        },
    ]);

    return { contact, thread };
}

async function main() {
    await cleanup();

    const settingsBefore = await db.query.waSettings.findFirst({ where: eq(waSettings.key, 'default') });
    if (!settingsBefore) throw new Error('wa_settings singleton missing — has the migration been applied?');

    settingsSnapshot = {
        enabled: settingsBefore.enabled ?? false,
        testMode: settingsBefore.testMode ?? true,
        testNumbers: (settingsBefore.testNumbers as string[] | null) ?? [],
    };

    const open = await seedThread(OPEN_PHONE, new Date(Date.now() + SERVICE_WINDOW_MS), 'Window Open');
    const closed = await seedThread(CLOSED_PHONE, new Date(Date.now() - 60_000), 'Window Closed');

    // ---------------------------------------------------------------
    console.log('\n--- windowState ---');
    // ---------------------------------------------------------------
    check('an expiry in the future is open', windowState({ windowExpiresAt: new Date(Date.now() + 60_000) }).open);
    check('an expiry in the past is closed', !windowState({ windowExpiresAt: new Date(Date.now() - 1) }).open);
    check('a null expiry is closed', !windowState({ windowExpiresAt: null }).open);
    check('a null expiry reports no remaining time',
        windowState({ windowExpiresAt: null }).msRemaining === 0);
    check('msRemaining never goes negative',
        windowState({ windowExpiresAt: new Date(Date.now() - 10_000) }).msRemaining === 0);
    check('an ISO string expiry is accepted as well as a Date',
        windowState({ windowExpiresAt: new Date(Date.now() + 60_000).toISOString() }).open);

    // ---------------------------------------------------------------
    console.log('\n--- listThreads: every filter shape must render valid SQL ---');
    // ---------------------------------------------------------------
    const all = await listThreads({ status: 'all', limit: 100 });
    check('unfiltered list runs', all.threads.length >= 2, `got ${all.threads.length}`);
    check('total is a number', typeof all.total === 'number', `got ${typeof all.total}`);

    const openOnly = await listThreads({ status: 'open', limit: 100 });
    check('status filter runs', openOnly.threads.every((t) => t.status === 'open'));

    const resolvedOnly = await listThreads({ status: 'resolved', limit: 100 });
    check('resolved filter runs', resolvedOnly.threads.every((t) => t.status === 'resolved'));

    const unread = await listThreads({ unreadOnly: true, status: 'all', limit: 100 });
    check('unreadOnly filter runs (COALESCE boolean in WHERE)',
        unread.threads.every((t) => (t.unreadCount ?? 0) > 0));

    // The jsonb `?` membership operator is the fragment most likely to break: it
    // collides with the placeholder syntax of some drivers.
    const labelled = await listThreads({ label: 'booking_enquiry', status: 'all', limit: 100 });
    check('label filter runs (jsonb ? operator)', labelled.threads.length >= 2, `got ${labelled.threads.length}`);
    const noLabel = await listThreads({ label: 'no_such_label_at_all', status: 'all', limit: 100 });
    check('a label nobody has returns nothing', noLabel.threads.length === 0, `got ${noLabel.threads.length}`);

    const searched = await listThreads({ search: 'Window Open', status: 'all', limit: 100 });
    check('search by name runs', searched.threads.some((t) => t.contact.name === 'Window Open'));
    const searchedPhone = await listThreads({ search: OPEN_PHONE, status: 'all', limit: 100 });
    check('search by phone runs', searchedPhone.threads.some((t) => t.contact.phone === OPEN_PHONE));

    const combined = await listThreads({
        status: 'open', unreadOnly: true, label: 'booking_enquiry', search: 'Window', limit: 100,
    });
    check('every filter at once runs', combined.threads.length >= 2, `got ${combined.threads.length}`);

    const assigned = await listThreads({ assignedTo: open.contact.id, status: 'all', limit: 100 });
    check('assignedTo filter runs', Array.isArray(assigned.threads));

    // ---------------------------------------------------------------
    console.log('\n--- listThreads: shape of the result ---');
    // ---------------------------------------------------------------
    const openRow = all.threads.find((t) => t.contact.phone === OPEN_PHONE);
    check('the thread carries its contact', openRow?.contact.name === 'Window Open');
    check('the window state is computed', openRow?.window.open === true);
    check('the last-message preview is the MOST RECENT one',
        openRow?.lastMessage?.body === 'Most recent message', `got ${openRow?.lastMessage?.body}`);

    const closedRow = all.threads.find((t) => t.contact.phone === CLOSED_PHONE);
    check('a lapsed window reports closed', closedRow?.window.open === false);

    // Unread-first ordering, with NULLS LAST on a thread that has no activity.
    const [{ contact: quietContact }] = [await seedQuiet()];
    const ordered = await listThreads({ status: 'all', limit: 100 });
    const quietIndex = ordered.threads.findIndex((t) => t.contact.id === quietContact.id);
    const unreadIndex = ordered.threads.findIndex((t) => (t.unreadCount ?? 0) > 0);
    check('unread threads sort above a silent one',
        unreadIndex >= 0 && quietIndex > unreadIndex, `unread@${unreadIndex} quiet@${quietIndex}`);

    // ---------------------------------------------------------------
    console.log('\n--- getThread ---');
    // ---------------------------------------------------------------
    const detail = await getThread(open.thread.id);
    check('getThread returns the transcript', detail?.messages.length === 2, `got ${detail?.messages.length}`);
    check('transcript is oldest-first', detail?.messages[0]?.body === 'First message');
    check('an unknown id returns null', (await getThread('00000000-0000-0000-0000-000000000000')) === null);

    // ---------------------------------------------------------------
    console.log('\n--- thread state mutations ---');
    // ---------------------------------------------------------------
    const totalBefore = await unreadTotal();
    check('unreadTotal counts open threads', totalBefore >= 4, `got ${totalBefore}`);

    await markRead(open.thread.id);
    check('markRead zeroes the badge',
        (await getThread(open.thread.id))?.unreadCount === 0);

    await setThreadStatus(open.thread.id, 'resolved');
    const resolved = await getThread(open.thread.id);
    check('resolving sets the status', resolved?.status === 'resolved');

    await setThreadStatus(closed.thread.id, 'resolved');
    check('resolving also clears unread',
        (await getThread(closed.thread.id))?.unreadCount === 0);

    await setThreadStatus(open.thread.id, 'open');
    check('reopening works', (await getThread(open.thread.id))?.status === 'open');

    await assignThread(open.thread.id, open.contact.id);
    check('assignment sticks', (await getThread(open.thread.id))?.assignedTo === open.contact.id);
    await assignThread(open.thread.id, null);
    check('assignment can be cleared', (await getThread(open.thread.id))?.assignedTo === null);

    await setLabels(open.thread.id, ['complaint', 'f_and_b']);
    const relabelled = await getThread(open.thread.id);
    check('labels are replaced wholesale',
        JSON.stringify(relabelled?.labels) === JSON.stringify(['complaint', 'f_and_b']),
        JSON.stringify(relabelled?.labels));
    check('the new label is findable through the jsonb filter',
        (await listThreads({ label: 'complaint', status: 'all', limit: 100 })).threads.length === 1);

    await setInternalNotes(open.thread.id, 'Guest asked about a late checkout.');
    check('internal notes save',
        (await getThread(open.thread.id))?.internalNotes === 'Guest asked about a late checkout.');

    // ---------------------------------------------------------------
    console.log('\n--- sendReply: the window is enforced server-side ---');
    // ---------------------------------------------------------------
    await expectThrows(
        'a closed window refuses free-form text',
        () => sendReply({ threadId: closed.thread.id, body: 'Hello', actor: {} }),
        (error) => error instanceof WindowClosedError,
    );

    await expectThrows(
        'an empty body is refused',
        () => sendReply({ threadId: open.thread.id, body: '   ', actor: {} }),
        (error) => error instanceof Error && /required/i.test(error.message),
    );

    await expectThrows(
        'an unknown thread is refused',
        () => sendReply({ threadId: '00000000-0000-0000-0000-000000000000', body: 'Hi', actor: {} }),
        (error) => error instanceof Error && /not found/i.test(error.message),
    );

    // ---------------------------------------------------------------
    console.log('\n--- sendReply: the consent chokepoint still applies ---');
    // ---------------------------------------------------------------
    // The kill switch is off by default, so an open window alone is not enough.
    await updateSettings({ enabled: false });
    invalidateSettingsCache();
    await expectThrows(
        'the kill switch blocks a reply even inside the window',
        () => sendReply({ threadId: open.thread.id, body: 'Hello', actor: {} }),
        (error) => error instanceof SendBlockedError && error.reason === 'kill_switch_off',
    );

    // Enabled but test mode on and this number not whitelisted.
    await updateSettings({ enabled: true, testMode: true, testNumbers: [] });
    invalidateSettingsCache();
    await expectThrows(
        'test mode blocks a number that is not whitelisted',
        () => sendReply({ threadId: open.thread.id, body: 'Hello', actor: {} }),
        (error) => error instanceof SendBlockedError && error.reason === 'test_mode_not_whitelisted',
    );

    // ---------------------------------------------------------------
    console.log('\n--- sendReply: the happy path, through the mock provider ---');
    // ---------------------------------------------------------------
    await updateSettings({ enabled: true, testMode: true, testNumbers: [OPEN_PHONE] });
    invalidateSettingsCache();

    const sent = await sendReply({ threadId: open.thread.id, body: 'Yes, we have sea-view rooms.', actor: {} });
    check('a whitelisted number inside the window sends', !!sent.message);
    check('it is recorded as outbound', sent.message?.direction === 'outbound');
    check('it carries a wamid', !!sent.message?.wamid);
    check('it lands in the transcript',
        (await getThread(open.thread.id))?.messages.some((m) => m.body === 'Yes, we have sea-view rooms.') === true);

    const afterSend = await getThread(open.thread.id);
    check('the thread activity timestamp moved', !!afterSend?.lastMessageAt);
    check('replying does NOT reopen the reply window itself',
        // Only an inbound message may extend it; otherwise the hotel could keep a
        // window open forever by talking to itself.
        new Date(afterSend!.windowExpiresAt!).getTime() === new Date(open.thread.windowExpiresAt!).getTime());

    await expectThrows(
        'an over-long body is refused before it reaches Meta',
        () => sendReply({ threadId: open.thread.id, body: 'x'.repeat(4097), actor: {} }),
        (error) => error instanceof Error && /4096/.test(error.message),
    );

    // ---------------------------------------------------------------
    console.log('\n--- canned replies ---');
    // ---------------------------------------------------------------
    const created = await createCannedReply({
        title: `${TEST_TITLE_PREFIX}checkin`,
        body: 'Check-in is from 2pm and check-out is 11am.',
        category: 'faq',
        sortOrder: 1,
    });
    check('a canned reply is created', !!created?.id);
    check('it appears in the active list',
        (await listCannedReplies()).some((r) => r.id === created!.id));

    await updateCannedReply(created!.id, { isActive: false });
    check('deactivating hides it from the default list',
        !(await listCannedReplies()).some((r) => r.id === created!.id));
    check('but it is still there when inactive are included',
        (await listCannedReplies(true)).some((r) => r.id === created!.id));

    await deleteCannedReply(created!.id);
    check('deleting removes it',
        !(await listCannedReplies(true)).some((r) => r.id === created!.id));

    // Restore whatever the settings were before this run touched them.
    await restoreSettings();
    const restored = await getSettings({ fresh: true });
    check('settings were restored to their original values',
        restored.enabled === settingsBefore.enabled && restored.testMode === settingsBefore.testMode,
        `enabled ${restored.enabled} vs ${settingsBefore.enabled}, testMode ${restored.testMode} vs ${settingsBefore.testMode}`);
}

/** A thread with no messages and no activity, to prove NULLS LAST works. */
async function seedQuiet() {
    const [contact] = await db
        .insert(waContacts)
        .values({ phone: '+919000000013', name: 'Quiet Thread', source: 'manual', consentStatus: 'pending' })
        .returning();
    await db.insert(waInboxThreads).values({
        contactId: contact.id, status: 'open', unreadCount: 0, lastMessageAt: null,
    });
    return { contact };
}

async function fullCleanup() {
    // Settings first: it is the only change here with any blast radius.
    await restoreSettings();
    await cleanup();
    const quiet = await db.query.waContacts.findFirst({
        where: eq(waContacts.phone, '+919000000013'),
        columns: { id: true },
    });
    if (quiet) await db.delete(waContacts).where(eq(waContacts.id, quiet.id));
}

main()
    .then(async () => {
        await fullCleanup();
        console.log(`\n${passed} passed, ${failed} failed\n`);
        process.exit(failed === 0 ? 0 : 1);
    })
    .catch(async (error) => {
        console.error('\nTEST RUN THREW:', error);
        try { await fullCleanup(); } catch { /* best effort */ }
        process.exit(1);
    });
