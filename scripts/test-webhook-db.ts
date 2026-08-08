/**
 * Integration tests for the webhook handler, against a real database.
 *
 * Everything else in this module is tested as pure logic. This file is
 * different: it exercises the actual writes — thread upserts, the wamid
 * idempotency guards, the status-rank ladder and the consent chokepoint — which
 * is where the interesting failure modes live, because none of them are visible
 * to `tsc`. A missing UNIQUE constraint, for instance, turns `onConflictDoUpdate`
 * into a runtime error and typechecks perfectly.
 *
 * It writes to whatever DATABASE_URL points at, using one synthetic phone number
 * that no real guest can hold, and deletes everything it created in a `finally`.
 * The wa_* tables cascade from wa_contacts, so removing the contact removes the
 * thread, its messages and the consent ledger entries with it.
 *
 * Run:
 *   npx esbuild scripts/test-webhook-db.ts --bundle --platform=node \
 *     --format=cjs --alias:@=. --outfile=/tmp/twh.cjs \
 *     && node --env-file=.env /tmp/twh.cjs
 */

import { createHmac } from 'crypto';
import { db } from '@/lib/db';
import {
    waContacts, waMessages, waInboxThreads, waInboxMessages,
    waConsentEvents, waTemplates, waEvents,
} from '@/lib/db/schema';
import { eq, like } from 'drizzle-orm';
import {
    verifySignature, processWebhook, handleStatus, handleTemplateUpdate, recordEvent,
} from '@/lib/services/whatsapp/webhook';

// A number in a range that cannot be issued to a real subscriber, so a stray row
// can never collide with a guest.
const TEST_PHONE = '+919000000001';
const TEST_PHONE_DIGITS = '919000000001';
const TEST_TEMPLATE = 'zz_webhook_integration_test_tpl';
const SECRET = 'test_app_secret_not_a_real_one';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string) {
    if (condition) { passed++; console.log(`  PASS  ${name}`); }
    else { failed++; console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ''}`); }
}

function sign(body: string, secret = SECRET) {
    return 'sha256=' + createHmac('sha256', secret).update(body, 'utf8').digest('hex');
}

/** Meta's envelope, so the tests exercise the real nesting rather than a shortcut. */
function envelope(value: Record<string, unknown>, field = 'messages') {
    return { object: 'whatsapp_business_account', entry: [{ id: 'WABA', changes: [{ field, value }] }] };
}

function inboundText(wamid: string, body: string, tsSeconds: number) {
    return envelope({
        messaging_product: 'whatsapp',
        messages: [{ id: wamid, from: TEST_PHONE_DIGITS, timestamp: String(tsSeconds), type: 'text', text: { body } }],
    });
}

async function cleanup() {
    const contact = await db.query.waContacts.findFirst({
        where: eq(waContacts.phone, TEST_PHONE),
        columns: { id: true },
    });
    if (contact) {
        // wa_messages / wa_inbox_threads / wa_consent_events all cascade from here.
        await db.delete(waContacts).where(eq(waContacts.id, contact.id));
    }
    await db.delete(waTemplates).where(eq(waTemplates.name, TEST_TEMPLATE));
    await db.delete(waEvents).where(like(waEvents.eventType, 'zz_test_%'));
}

async function main() {
    await cleanup();

    // ---------------------------------------------------------------
    console.log('\n--- signature verification ---');
    // ---------------------------------------------------------------
    const body = JSON.stringify(inboundText('wamid.sig', 'hello', 1_780_000_000));

    check('a correct signature passes', verifySignature(body, sign(body), SECRET));
    check('a tampered body fails', !verifySignature(body + ' ', sign(body), SECRET));
    check('the wrong secret fails', !verifySignature(body, sign(body, 'other_secret'), SECRET));
    check('a missing header fails', !verifySignature(body, null, SECRET));
    check('an unprefixed hex digest fails', !verifySignature(body, sign(body).slice(7), SECRET));
    check('sha1= prefix is refused', !verifySignature(body, 'sha1=' + sign(body).slice(7), SECRET));
    check('a truncated digest fails without throwing', !verifySignature(body, 'sha256=abcd', SECRET));
    check('a non-hex digest of the right length fails without throwing',
        !verifySignature(body, 'sha256=' + 'z'.repeat(64), SECRET));

    // ---------------------------------------------------------------
    console.log('\n--- inbound: contact creation and the 24h window ---');
    // ---------------------------------------------------------------
    const t0 = Math.floor(Date.now() / 1000);
    const r1 = await processWebhook(inboundText('wamid.in.1', 'Do you have rooms in December?', t0));
    check('one inbound processed', r1.inbound === 1, JSON.stringify(r1));
    check('no errors collected', r1.errors.length === 0, r1.errors.join('; '));

    const contact = await db.query.waContacts.findFirst({ where: eq(waContacts.phone, TEST_PHONE) });
    check('an unknown sender created a contact', !!contact);
    check('created as pending — writing to us is not marketing consent',
        contact?.consentStatus === 'pending', `got ${contact?.consentStatus}`);
    check('source recorded as inbound', contact?.source === 'inbound', `got ${contact?.source}`);
    check('lastInboundAt was set', !!contact?.lastInboundAt);

    const thread1 = await db.query.waInboxThreads.findFirst({
        where: eq(waInboxThreads.contactId, contact!.id),
    });
    check('a thread was opened', !!thread1);
    check('thread status is open', thread1?.status === 'open');
    check('unreadCount is 1', thread1?.unreadCount === 1, `got ${thread1?.unreadCount}`);

    const expectedWindow = (t0 + 24 * 3600) * 1000;
    const actualWindow = thread1?.windowExpiresAt ? new Date(thread1.windowExpiresAt).getTime() : 0;
    check('the 24h window expiry is 24h after the message timestamp',
        Math.abs(actualWindow - expectedWindow) < 2000,
        `expected ~${new Date(expectedWindow).toISOString()}, got ${thread1?.windowExpiresAt}`);

    let msgs = await db.query.waInboxMessages.findMany({ where: eq(waInboxMessages.threadId, thread1!.id) });
    check('the inbound message was stored', msgs.length === 1, `got ${msgs.length}`);
    check('stored as inbound direction', msgs[0]?.direction === 'inbound');
    check('body preserved', msgs[0]?.body === 'Do you have rooms in December?');

    // ---------------------------------------------------------------
    console.log('\n--- inbound: Meta retries must not duplicate ---');
    // ---------------------------------------------------------------
    await processWebhook(inboundText('wamid.in.1', 'Do you have rooms in December?', t0));
    msgs = await db.query.waInboxMessages.findMany({ where: eq(waInboxMessages.threadId, thread1!.id) });
    check('replaying the same wamid did not duplicate the message', msgs.length === 1, `got ${msgs.length}`);

    const contactCount = await db.query.waContacts.findMany({ where: eq(waContacts.phone, TEST_PHONE) });
    check('replaying did not create a second contact', contactCount.length === 1, `got ${contactCount.length}`);

    // The regression this file was written to catch: the message row was deduped
    // but the thread counter was not, so every Meta retry inflated the badge.
    const afterReplay = await db.query.waInboxThreads.findFirst({
        where: eq(waInboxThreads.contactId, contact!.id),
    });
    check('a retry does NOT inflate the unread badge',
        afterReplay?.unreadCount === 1, `got ${afterReplay?.unreadCount}`);

    // ---------------------------------------------------------------
    console.log('\n--- inbound: a genuinely new message increments unread ---');
    // ---------------------------------------------------------------
    await processWebhook(inboundText('wamid.in.2', 'Any sea view rooms?', t0 + 60));
    const thread2 = await db.query.waInboxThreads.findFirst({ where: eq(waInboxThreads.contactId, contact!.id) });
    check('unreadCount incremented to 2', thread2?.unreadCount === 2, `got ${thread2?.unreadCount}`);
    msgs = await db.query.waInboxMessages.findMany({ where: eq(waInboxMessages.threadId, thread1!.id) });
    check('two distinct messages stored', msgs.length === 2, `got ${msgs.length}`);

    // ---------------------------------------------------------------
    console.log('\n--- inbound reopens a resolved thread ---');
    // ---------------------------------------------------------------
    await db.update(waInboxThreads).set({ status: 'resolved' }).where(eq(waInboxThreads.id, thread1!.id));

    // A retry of an already-seen message is not the guest writing again, so it
    // must leave an operator's "resolved" alone.
    await processWebhook(inboundText('wamid.in.2', 'Any sea view rooms?', t0 + 60));
    const stillResolved = await db.query.waInboxThreads.findFirst({
        where: eq(waInboxThreads.contactId, contact!.id),
    });
    check('a retry does NOT reopen a resolved thread',
        stillResolved?.status === 'resolved', `got ${stillResolved?.status}`);
    check('and does not bump unread either',
        stillResolved?.unreadCount === 2, `got ${stillResolved?.unreadCount}`);

    await processWebhook(inboundText('wamid.in.3', 'Actually one more thing', t0 + 120));
    const thread3 = await db.query.waInboxThreads.findFirst({ where: eq(waInboxThreads.contactId, contact!.id) });
    check('a resolved thread reopens when the guest writes again',
        thread3?.status === 'open', `got ${thread3?.status}`);
    check('a genuinely new message does bump unread', thread3?.unreadCount === 3, `got ${thread3?.unreadCount}`);

    // ---------------------------------------------------------------
    console.log('\n--- status ladder: only ever forward ---');
    // ---------------------------------------------------------------
    await db.insert(waMessages).values({
        contactId: contact!.id,
        idempotencyKey: 'zz-test-idem-1',
        wamid: 'wamid.out.1',
        status: 'sent',
    });

    function statusEnvelope(status: string, ts: number, extra: Record<string, unknown> = {}) {
        return { id: 'wamid.out.1', status, timestamp: String(ts), recipient_id: TEST_PHONE_DIGITS, ...extra };
    }

    check('delivered advances sent', await handleStatus(statusEnvelope('delivered', t0)) === 'updated');
    let out = await db.query.waMessages.findFirst({ where: eq(waMessages.wamid, 'wamid.out.1') });
    check('status is now delivered', out?.status === 'delivered', `got ${out?.status}`);
    check('deliveredAt recorded', !!out?.deliveredAt);

    await handleStatus(statusEnvelope('read', t0 + 10));
    out = await db.query.waMessages.findFirst({ where: eq(waMessages.wamid, 'wamid.out.1') });
    check('read advances delivered', out?.status === 'read', `got ${out?.status}`);

    // The out-of-order case the comments call routine, not an edge case.
    await handleStatus(statusEnvelope('sent', t0 + 20));
    out = await db.query.waMessages.findFirst({ where: eq(waMessages.wamid, 'wamid.out.1') });
    check('a late `sent` does NOT downgrade a read message', out?.status === 'read', `got ${out?.status}`);
    check('but its timestamp was still recorded', !!out?.sentAt);

    await handleStatus(statusEnvelope('delivered', t0 + 30));
    out = await db.query.waMessages.findFirst({ where: eq(waMessages.wamid, 'wamid.out.1') });
    check('a late `delivered` does NOT downgrade either', out?.status === 'read', `got ${out?.status}`);

    check('a status for a wamid we never sent reports unknown',
        await handleStatus({ id: 'wamid.never.sent', status: 'delivered', timestamp: String(t0) }) === 'unknown');
    check('a status with no id is ignored', await handleStatus({ status: 'delivered' }) === 'ignored');

    // ---------------------------------------------------------------
    console.log('\n--- failure statuses carry the Meta error through ---');
    // ---------------------------------------------------------------
    await db.insert(waMessages).values({
        contactId: contact!.id,
        idempotencyKey: 'zz-test-idem-2',
        wamid: 'wamid.out.2',
        status: 'sent',
    });
    await handleStatus({
        id: 'wamid.out.2', status: 'failed', timestamp: String(t0),
        errors: [{ code: 131_026, title: 'Message undeliverable', error_data: { details: 'Receiver incapable' } }],
    });
    const failedMsg = await db.query.waMessages.findFirst({ where: eq(waMessages.wamid, 'wamid.out.2') });
    check('status is failed', failedMsg?.status === 'failed', `got ${failedMsg?.status}`);
    check('error code stored', failedMsg?.errorCode === 131_026, `got ${failedMsg?.errorCode}`);
    check('error detail prefers error_data.details',
        failedMsg?.errorDetail === 'Receiver incapable', `got ${failedMsg?.errorDetail}`);

    // ---------------------------------------------------------------
    console.log('\n--- the consent chokepoint ---');
    // ---------------------------------------------------------------
    await processWebhook(inboundText('wamid.in.stop', 'STOP', t0 + 200));
    const optedOut = await db.query.waContacts.findFirst({ where: eq(waContacts.phone, TEST_PHONE) });
    check('a STOP reply opts the contact out', optedOut?.consentStatus === 'opted_out', `got ${optedOut?.consentStatus}`);

    const ledger = await db.query.waConsentEvents.findMany({ where: eq(waConsentEvents.contactId, contact!.id) });
    check('the opt-out is written to the append-only ledger', ledger.length >= 1, `got ${ledger.length}`);
    check('the ledger records how they opted out',
        ledger.some(e => e.toStatus === 'opted_out'), JSON.stringify(ledger.map(e => e.toStatus)));

    // The STOP must still land even when it arrives beside a broken status.
    const mixed = {
        object: 'whatsapp_business_account',
        entry: [{
            id: 'WABA',
            changes: [{
                field: 'messages',
                value: {
                    statuses: [{ id: null as unknown as string, status: 'delivered' }],
                    messages: [{
                        id: 'wamid.in.stop2', from: TEST_PHONE_DIGITS,
                        timestamp: String(t0 + 300), type: 'text', text: { body: 'unsubscribe' },
                    }],
                },
            }],
        }],
    };
    const mixedResult = await processWebhook(mixed);
    check('a malformed status does not cost us the inbound beside it',
        mixedResult.inbound === 1, JSON.stringify(mixedResult));

    // ---------------------------------------------------------------
    console.log('\n--- template status updates ---');
    // ---------------------------------------------------------------
    await db.insert(waTemplates).values({
        name: TEST_TEMPLATE,
        language: 'en',
        category: 'UTILITY',
        status: 'pending_meta',
        bodyText: 'Integration test template {{1}}',
    });

    check('APPROVED maps to approved',
        await handleTemplateUpdate({ message_template_name: TEST_TEMPLATE, event: 'APPROVED' }) === 'updated');
    let tpl = await db.query.waTemplates.findFirst({ where: eq(waTemplates.name, TEST_TEMPLATE) });
    check('template is approved', tpl?.status === 'approved', `got ${tpl?.status}`);
    check('syncedAt stamped', !!tpl?.syncedAt);

    await handleTemplateUpdate({ message_template_name: TEST_TEMPLATE, event: 'REJECTED', reason: 'ABUSIVE_CONTENT' });
    tpl = await db.query.waTemplates.findFirst({ where: eq(waTemplates.name, TEST_TEMPLATE) });
    check('REJECTED stores the reason', tpl?.rejectionReason === 'ABUSIVE_CONTENT', `got ${tpl?.rejectionReason}`);

    await handleTemplateUpdate({ message_template_name: TEST_TEMPLATE, event: 'APPROVED' });
    tpl = await db.query.waTemplates.findFirst({ where: eq(waTemplates.name, TEST_TEMPLATE) });
    check('a later approval clears the stale rejection reason', tpl?.rejectionReason === null,
        `got ${tpl?.rejectionReason}`);

    check('an unknown event is ignored',
        await handleTemplateUpdate({ message_template_name: TEST_TEMPLATE, event: 'SOMETHING_NEW' }) === 'ignored');
    check('an unknown template name is ignored',
        await handleTemplateUpdate({ message_template_name: 'no_such_template', event: 'APPROVED' }) === 'ignored');

    // ---------------------------------------------------------------
    console.log('\n--- event recording never throws ---');
    // ---------------------------------------------------------------
    await recordEvent('zz_test_event', { hello: 'world' }, { processed: true });
    const events = await db.query.waEvents.findMany({ where: eq(waEvents.eventType, 'zz_test_event') });
    check('the raw payload is stored for replay', events.length === 1, `got ${events.length}`);
    check('payload round-trips as JSON',
        (events[0]?.payload as Record<string, unknown>)?.hello === 'world');

    // ---------------------------------------------------------------
    console.log('\n--- an empty / foreign payload is harmless ---');
    // ---------------------------------------------------------------
    const empty = await processWebhook({});
    check('an empty body yields all-zero counts',
        empty.inbound === 0 && empty.statuses === 0 && empty.errors.length === 0);
    const noEntry = await processWebhook({ object: 'whatsapp_business_account', entry: [] });
    check('an entry-less body is harmless', noEntry.errors.length === 0);
}

main()
    .then(async () => {
        await cleanup();
        console.log(`\n${passed} passed, ${failed} failed\n`);
        process.exit(failed === 0 ? 0 : 1);
    })
    .catch(async (error) => {
        console.error('\nTEST RUN THREW:', error);
        try { await cleanup(); } catch { /* cleanup is best-effort on a thrown run */ }
        process.exit(1);
    });
