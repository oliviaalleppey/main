/**
 * Integration tests for the DPDP / compliance tooling, against a real database.
 *
 * The assertion that matters most is near the end: after an erasure, `canSend`
 * must refuse the number. A delete that removes the contact row also removes the
 * opt-out that row was carrying, so without the suppression tombstone the very
 * next CSV import would re-add an erased person as a fresh prospect. That is the
 * failure this file exists to prevent, and it is only observable end-to-end.
 *
 * Run:
 *   npx esbuild scripts/test-compliance-db.ts --bundle --platform=node \
 *     --format=cjs --alias:@=. --outfile=/tmp/tco.cjs \
 *     && node --env-file=.env /tmp/tco.cjs
 */

import { db } from '@/lib/db';
import {
    waContacts, waMessages, waConsentEvents, waSuppression, waInboxThreads,
    waInboxMessages, waEvents, waTemplates,
} from '@/lib/db/schema';
import { eq, like } from 'drizzle-orm';
import {
    dataSubjectExport, dataSubjectErase, listSuppression, addSuppression,
    removeSuppression, consentLedger, auditLog, purgeRawEvents, complianceSnapshot,
} from '@/lib/services/whatsapp/compliance';
import { canSend } from '@/lib/services/whatsapp/consent';
import { getSettings } from '@/lib/services/whatsapp/settings';

const PHONE = '+919000000401';
const UNKNOWN_PHONE = '+919000000402';
const TEMPLATE = 'zz_test_comp_tpl';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string) {
    if (condition) { passed++; console.log(`  PASS  ${name}`); }
    else { failed++; console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ''}`); }
}

async function cleanup() {
    for (const phone of [PHONE, UNKNOWN_PHONE]) {
        const contact = await db.query.waContacts.findFirst({
            where: eq(waContacts.phone, phone),
            columns: { id: true },
        });
        if (contact) {
            await db.delete(waMessages).where(eq(waMessages.contactId, contact.id));
            await db.delete(waContacts).where(eq(waContacts.id, contact.id));
        }
        await db.delete(waSuppression).where(eq(waSuppression.phone, phone));
        await db.delete(waConsentEvents).where(eq(waConsentEvents.phone, phone));
    }
    await db.delete(waTemplates).where(eq(waTemplates.name, TEMPLATE));
    await db.delete(waEvents).where(like(waEvents.eventType, 'zz_comp_%'));
}

async function seedSubject() {
    const [template] = await db.insert(waTemplates).values({
        name: TEMPLATE, language: 'en', category: 'UTILITY', status: 'approved', bodyText: 'Hi {{1}}',
    }).returning();

    const [contact] = await db.insert(waContacts).values({
        phone: PHONE, name: 'Erasure Subject', source: 'import',
        consentStatus: 'opted_in', consentAt: new Date(),
    }).returning();

    await db.insert(waConsentEvents).values([
        {
            contactId: contact.id, phone: PHONE, fromStatus: null, toStatus: 'opted_in',
            reason: 'Signed the form at check-in', source: 'front desk',
        },
        {
            contactId: contact.id, phone: PHONE, fromStatus: 'opted_in', toStatus: 'opted_out',
            reason: 'Replied STOP', source: 'STOP reply',
        },
    ]);

    await db.insert(waMessages).values([
        {
            contactId: contact.id, templateId: template.id,
            idempotencyKey: `zz-comp-1-${Date.now()}`, status: 'sent', sentAt: new Date(),
        },
        {
            contactId: contact.id, templateId: template.id,
            idempotencyKey: `zz-comp-2-${Date.now()}`, status: 'delivered', sentAt: new Date(),
        },
    ]);

    const [thread] = await db.insert(waInboxThreads).values({
        contactId: contact.id, status: 'open', lastMessageAt: new Date(),
    }).returning();

    await db.insert(waInboxMessages).values([
        { threadId: thread.id, direction: 'inbound', type: 'text', body: 'Hello', status: 'delivered' },
        { threadId: thread.id, direction: 'outbound', type: 'text', body: 'Hi there', status: 'sent' },
    ]);

    return { contact, thread };
}

async function main() {
    await cleanup();
    const { contact } = await seedSubject();

    // ---------------------------------------------------------------
    console.log('\n--- data subject export ---');
    // ---------------------------------------------------------------
    const exported = await dataSubjectExport(PHONE);
    check('the subject is found', exported.found === true);
    check('the contact record is included', (exported.contact as { id?: string })?.id === contact.id);
    check('both consent records are included', exported.consentEvents.length === 2, `got ${exported.consentEvents.length}`);
    check('both sent messages are included', exported.messages.length === 2, `got ${exported.messages.length}`);
    check('the conversation is included', exported.conversation.messages.length === 2,
        `got ${exported.conversation.messages.length}`);
    check('it is stamped with an export time', !!exported.exportedAt);

    const messy = await dataSubjectExport('9000000401');
    check('a locally-formatted number normalises to the same subject',
        messy.found === true && messy.phone === PHONE, `got ${messy.phone}`);

    const nothing = await dataSubjectExport(UNKNOWN_PHONE);
    check('an unknown number reports not found rather than throwing', nothing.found === false);
    check('and returns empty collections, not undefined',
        Array.isArray(nothing.consentEvents) && Array.isArray(nothing.messages));

    // ---------------------------------------------------------------
    console.log('\n--- suppression list ---');
    // ---------------------------------------------------------------
    const added = await addSuppression(UNKNOWN_PHONE, 'Asked us never to contact them');
    check('a number can be suppressed directly', !!added);

    const dupe = await addSuppression(UNKNOWN_PHONE, 'Again');
    check('suppressing twice is a no-op, not an error', dupe === null);

    const list = await listSuppression({ search: '90000004' });
    check('the suppression list is searchable', list.entries.some((e) => e.phone === UNKNOWN_PHONE));
    check('the list reports a total', typeof list.total === 'number');

    let verdict = await canSend(
        { phone: UNKNOWN_PHONE, consentStatus: 'opted_in', consentAt: new Date(), marketingSent30d: 0, optedOutAt: null },
        { category: 'UTILITY', settings: { ...(await getSettings()), enabled: true, testMode: false } },
    );
    check('a suppressed number cannot be sent to, even as opted-in utility',
        !verdict.allowed && verdict.reason === 'suppressed', JSON.stringify(verdict));

    await removeSuppression(UNKNOWN_PHONE);
    check('suppression can be lifted',
        !(await listSuppression({ search: UNKNOWN_PHONE })).entries.length);

    // ---------------------------------------------------------------
    console.log('\n--- erasure ---');
    // ---------------------------------------------------------------
    const result = await dataSubjectErase(PHONE, { id: undefined, email: 'test@example.invalid' });

    check('erasure reports success', result.erased === true);
    check('it reports how many messages went', result.removed.messages === 2, `got ${result.removed.messages}`);
    check('and how many consent records went', result.removed.consentEvents === 2, `got ${result.removed.consentEvents}`);
    check('and how many inbox messages went', result.removed.inboxMessages === 2, `got ${result.removed.inboxMessages}`);

    const goneContact = await db.query.waContacts.findFirst({ where: eq(waContacts.phone, PHONE) });
    check('the contact row is gone', !goneContact);

    const goneMessages = await db.query.waMessages.findMany({ where: eq(waMessages.contactId, contact.id) });
    check('their messages cascaded away', goneMessages.length === 0, `got ${goneMessages.length}`);

    const goneConsent = await db.query.waConsentEvents.findMany({ where: eq(waConsentEvents.contactId, contact.id) });
    check('their consent ledger cascaded away too', goneConsent.length === 0, `got ${goneConsent.length}`);

    const goneThread = await db.query.waInboxThreads.findFirst({ where: eq(waInboxThreads.contactId, contact.id) });
    check('their conversation cascaded away', !goneThread);

    // ---------------------------------------------------------------
    console.log('\n--- THE POINT: erasure must not make them contactable again ---');
    // ---------------------------------------------------------------
    const tombstone = await db.query.waSuppression.findFirst({ where: eq(waSuppression.phone, PHONE) });
    check('a suppression tombstone was left behind', !!tombstone);
    check('the tombstone says why', !!tombstone?.reason);

    verdict = await canSend(
        // Exactly what a fresh CSV import would produce for this number: a brand
        // new contact with no history, because the history was erased.
        { phone: PHONE, consentStatus: 'opted_in', consentAt: new Date(), marketingSent30d: 0, optedOutAt: null },
        { category: 'MARKETING', settings: { ...(await getSettings()), enabled: true, testMode: false } },
    );
    check('a re-imported erased number is STILL refused',
        !verdict.allowed && verdict.reason === 'suppressed', JSON.stringify(verdict));

    const reExport = await dataSubjectExport(PHONE);
    check('a follow-up request shows the suppression, not a bare "not found"',
        reExport.found === true && !!reExport.suppression);

    // ---------------------------------------------------------------
    console.log('\n--- erasing an unknown number still suppresses it ---');
    // ---------------------------------------------------------------
    const unknownErase = await dataSubjectErase(UNKNOWN_PHONE, { email: 'test@example.invalid' });
    check('it reports that nothing was erased', unknownErase.erased === false);
    check('but the number is suppressed anyway',
        !!(await db.query.waSuppression.findFirst({ where: eq(waSuppression.phone, UNKNOWN_PHONE) })));

    // ---------------------------------------------------------------
    console.log('\n--- ledger, audit log and retention queries ---');
    // ---------------------------------------------------------------
    const ledger = await consentLedger({ limit: 10 });
    check('the consent ledger query runs', Array.isArray(ledger.events));
    const filtered = await consentLedger({ toStatus: 'opted_out', limit: 10 });
    check('it filters by target status', filtered.events.every((e) => e.toStatus === 'opted_out'));

    const audits = await auditLog({ limit: 10 });
    check('the audit log query runs', Array.isArray(audits.entries));
    const auditFiltered = await auditLog({ action: 'whatsapp.', limit: 10 });
    check('it filters by action', auditFiltered.entries.every((e) => e.action.includes('whatsapp.')));

    await db.insert(waEvents).values([
        { eventType: 'zz_comp_old', payload: { a: 1 }, receivedAt: new Date(Date.now() - 60 * 86_400_000) },
        { eventType: 'zz_comp_new', payload: { a: 2 }, receivedAt: new Date() },
    ]);

    const purge = await purgeRawEvents(30);
    check('the retention sweep deletes payloads past the window',
        purge.rawEventsDeleted >= 1, `got ${purge.rawEventsDeleted}`);
    check('a recent payload survives',
        !!(await db.query.waEvents.findFirst({ where: eq(waEvents.eventType, 'zz_comp_new') })));
    check('an old one does not',
        !(await db.query.waEvents.findFirst({ where: eq(waEvents.eventType, 'zz_comp_old') })));

    const snapshot = await complianceSnapshot();
    check('the snapshot runs', typeof snapshot.contacts === 'number');
    check('proofPercent is a percentage',
        snapshot.proofPercent >= 0 && snapshot.proofPercent <= 100, `got ${snapshot.proofPercent}`);
    check('the suppression count includes our tombstones', snapshot.suppressed >= 2, `got ${snapshot.suppressed}`);
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
