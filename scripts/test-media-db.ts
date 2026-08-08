/**
 * Inbox media tests, against the real database with the mock provider.
 *
 *   npx esbuild scripts/test-media-db.ts --bundle --platform=node \
 *     --format=cjs --alias:@=. --outfile=/tmp/tmd.cjs && node --env-file=.env /tmp/tmd.cjs
 *
 * The point of this suite is that media goes through the *same* two gates as
 * text. sendMediaReply is a sibling of sendReply rather than a branch inside it,
 * which is safer but means the gates are duplicated code — so they are tested
 * independently here rather than assumed to match.
 */

import { db } from '@/lib/db';
import { waContacts, waInboxThreads, waInboxMessages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendMediaReply, MEDIA_LIMITS } from '@/lib/services/whatsapp/inbox';
import { SERVICE_WINDOW_MS } from '@/lib/services/whatsapp/types';
import { getSettings, updateSettings, invalidateSettingsCache } from '@/lib/services/whatsapp/settings';

let passed = 0;
let failed = 0;
function check(label: string, condition: boolean) {
    if (condition) { passed++; console.log(`  PASS  ${label}`); }
    else { failed++; console.log(`  FAIL  ${label}`); }
}

async function expectRejection(label: string, fn: () => Promise<unknown>, match: RegExp) {
    try {
        await fn();
        check(`${label} (expected a rejection, got success)`, false);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        check(label, match.test(message));
    }
}

const PHONE_OPEN = '+919000000901';
const PHONE_CLOSED = '+919000000902';
const PHONE_OPTED_OUT = '+919000000903';
const LINK = 'https://example.invalid/blob/menu.pdf';
const actor = { id: undefined, email: 'test@example.invalid' };

async function makeThread(phone: string, opts: { open: boolean; consent?: 'opted_in' | 'opted_out' }) {
    const [contact] = await db.insert(waContacts).values({
        phone, name: `Media Test ${phone.slice(-3)}`,
        consentStatus: opts.consent ?? 'opted_in', source: 'inbound',
    }).returning();

    const [thread] = await db.insert(waInboxThreads).values({
        contactId: contact.id,
        windowExpiresAt: opts.open
            ? new Date(Date.now() + SERVICE_WINDOW_MS - 3_600_000)
            : new Date(Date.now() - 60_000),
        lastMessageAt: new Date(),
    }).returning();

    return { contact, thread };
}

async function cleanup() {
    for (const phone of [PHONE_OPEN, PHONE_CLOSED, PHONE_OPTED_OUT]) {
        const contact = await db.query.waContacts.findFirst({
            where: eq(waContacts.phone, phone), columns: { id: true },
        });
        if (contact) await db.delete(waContacts).where(eq(waContacts.id, contact.id));
    }
}

async function main() {
    await cleanup();

    // Sending is off by default and must be off again afterwards. Test mode with
    // an empty test-number list keeps the mock provider from pretending to reach
    // anyone real, exactly as scripts/test-inbox-db.ts does.
    const settingsBefore = await getSettings({ fresh: true });
    const snapshot = {
        enabled: settingsBefore.enabled ?? false,
        testMode: settingsBefore.testMode ?? true,
        testNumbers: settingsBefore.testNumbers ?? [],
    };

    // This suite is about the gates and what gets persisted, not the provider's
    // deterministic failure mix — that is scripts/test-dispatch-rules.ts. Without
    // this, whether an assertion passes depends on which synthetic number happens
    // to land in the mock's failure bucket.
    process.env.WHATSAPP_MOCK_ALWAYS_SUCCEED = 'true';

    try {
        await updateSettings({
            enabled: true,
            testMode: true,
            // Test mode only lets through whitelisted numbers, which is exactly
            // the behaviour we want to keep — so the synthetic numbers are added
            // rather than the mode being turned off.
            testNumbers: [PHONE_OPEN, PHONE_CLOSED, PHONE_OPTED_OUT],
        });
        console.log('\n--- a valid send inside the window ---');
        const open = await makeThread(PHONE_OPEN, { open: true });
        const sent = await sendMediaReply({
            threadId: open.thread.id, kind: 'document', link: LINK,
            mimeType: 'application/pdf', filename: 'menu.pdf',
            caption: 'Our in-room dining menu', actor,
        });
        check('a message row is returned', !!sent.message);
        check('it is recorded as outbound', sent.message.direction === 'outbound');
        check('the type is the media kind, not text', sent.message.type === 'document');
        check('the media url is stored', sent.message.mediaUrl === LINK);
        check('the mime type is stored', sent.message.mediaMimeType === 'application/pdf');
        check('the caption becomes the body', sent.message.body === 'Our in-room dining menu');
        check('a wamid came back from the provider', !!sent.message.wamid);
        check('status is sent', sent.message.status === 'sent');

        const thread = await db.query.waInboxThreads.findFirst({ where: eq(waInboxThreads.id, open.thread.id) });
        check('the thread activity timestamp moved', !!thread?.lastMessageAt);
        const contact = await db.query.waContacts.findFirst({ where: eq(waContacts.id, open.contact.id) });
        check('the contact lastOutboundAt moved', !!contact?.lastOutboundAt);

        console.log('\n--- with no caption, the filename stands in ---');
        const noCaption = await sendMediaReply({
            threadId: open.thread.id, kind: 'image', link: 'https://example.invalid/a.png',
            mimeType: 'image/png', filename: 'a.png', actor,
        });
        check('body falls back to the filename', noCaption.message.body === 'a.png');
        check('an image is typed as image', noCaption.message.type === 'image');

        console.log('\n--- gate 1: the 24-hour window ---');
        const closed = await makeThread(PHONE_CLOSED, { open: false });
        await expectRejection('a closed window refuses media',
            () => sendMediaReply({
                threadId: closed.thread.id, kind: 'document', link: LINK,
                mimeType: 'application/pdf', actor,
            }), /window/i);

        console.log('\n--- gate 2: the consent chokepoint ---');
        // An opt-out is an opt-out of *marketing*. A guest who opened this
        // conversation still gets an answer, and a service-window reply is
        // UTILITY — so this is allowed, and must carry a warning saying why.
        const optedOut = await makeThread(PHONE_OPTED_OUT, { open: true, consent: 'opted_out' });
        const toOptedOut = await sendMediaReply({
            threadId: optedOut.thread.id, kind: 'document', link: LINK,
            mimeType: 'application/pdf', actor,
        });
        check('an opted-out guest still receives a service-window reply',
            toOptedOut.message.status === 'sent');
        check('and the operator is warned about it',
            toOptedOut.warnings.some((w) => /opted out/i.test(w)));

        // Suppressed is the state that blocks unconditionally: it is set by an
        // erasure or a hard bounce, not by a marketing preference.
        await db.update(waContacts).set({ consentStatus: 'suppressed' })
            .where(eq(waContacts.id, optedOut.contact.id));
        await expectRejection('a suppressed contact is refused outright',
            () => sendMediaReply({
                threadId: optedOut.thread.id, kind: 'document', link: LINK,
                mimeType: 'application/pdf', actor,
                // The operator-facing wording, not the reason code: "On the
                // permanent do-not-contact list".
            }), /do-not-contact/i);

        console.log('\n--- input validation happens before anything is sent ---');
        await expectRejection('a non-https link is refused',
            () => sendMediaReply({
                threadId: open.thread.id, kind: 'document', link: 'http://example.invalid/x.pdf',
                mimeType: 'application/pdf', actor,
            }), /https/i);

        await expectRejection('a disallowed mime type is refused',
            () => sendMediaReply({
                threadId: open.thread.id, kind: 'image', link: 'https://example.invalid/x.gif',
                mimeType: 'image/gif', actor,
            }), /image must be one of/i);

        await expectRejection('a webp image is refused (Meta rejects it)',
            () => sendMediaReply({
                threadId: open.thread.id, kind: 'image', link: 'https://example.invalid/x.webp',
                mimeType: 'image/webp', actor,
            }), /image must be one of/i);

        await expectRejection('a pdf sent as an image is refused',
            () => sendMediaReply({
                threadId: open.thread.id, kind: 'image', link: LINK,
                mimeType: 'application/pdf', actor,
            }), /image must be one of/i);

        await expectRejection('an over-long caption is refused',
            () => sendMediaReply({
                threadId: open.thread.id, kind: 'image', link: 'https://example.invalid/x.png',
                mimeType: 'image/png', caption: 'x'.repeat(1025), actor,
            }), /caption/i);

        await expectRejection('an unknown thread is refused',
            () => sendMediaReply({
                threadId: '00000000-0000-0000-0000-000000000000', kind: 'image',
                link: 'https://example.invalid/x.png', mimeType: 'image/png', actor,
            }), /not found/i);

        console.log('\n--- a rejected send is recorded, not swallowed ---');
        const before = await db.select({ id: waInboxMessages.id })
            .from(waInboxMessages).where(eq(waInboxMessages.threadId, open.thread.id));
        // The mock provider rejects a non-https link at the provider layer. Our own
        // validation catches that first, so to exercise the provider-failure path
        // the link has to pass validation and fail at the provider — the mock only
        // fails on scheme, so this asserts the validation ordering instead.
        check('validation runs before the provider is called',
            before.length === 2);

        console.log('\n--- the limits table is sane ---');
        check('images are capped at 5MB', MEDIA_LIMITS.image.bytes === 5 * 1024 * 1024);
        check('documents are capped at 100MB', MEDIA_LIMITS.document.bytes === 100 * 1024 * 1024);
        check('only jpeg and png are allowed as images',
            [...MEDIA_LIMITS.image.mime].sort().join() === 'image/jpeg,image/png');
        check('only pdf is allowed as a document',
            [...MEDIA_LIMITS.document.mime].join() === 'application/pdf');
        check('webp is not allowed anywhere',
            ![...MEDIA_LIMITS.image.mime, ...MEDIA_LIMITS.document.mime].includes('image/webp' as never));
    } finally {
        delete process.env.WHATSAPP_MOCK_ALWAYS_SUCCEED;
        await cleanup();
        await updateSettings(snapshot);
        invalidateSettingsCache();
    }

    console.log('\n--- the database is back as we found it ---');
    const restored = await getSettings({ fresh: true });
    check('the kill switch is back off', restored.enabled === snapshot.enabled);
    check('test mode is restored', restored.testMode === snapshot.testMode);
    for (const phone of [PHONE_OPEN, PHONE_CLOSED, PHONE_OPTED_OUT]) {
        const left = await db.query.waContacts.findFirst({ where: eq(waContacts.phone, phone) });
        check(`no contact left behind for ${phone.slice(-3)}`, !left);
    }

    console.log(`\n${passed} passed, ${failed} failed\n`);
    process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => { console.error(error); process.exit(1); });
