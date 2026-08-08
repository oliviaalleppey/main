/**
 * Seed / unseed a few inbox conversations for visual checking.
 *
 * Purely a development aid: it exists because the admin UI sits behind Google
 * OAuth and had never been looked at, and an empty inbox shows only its empty
 * state. Every contact it creates uses a synthetic +9190000001x number.
 *
 *   npx esbuild scripts/seed-inbox-demo.ts --bundle --platform=node \
 *     --format=cjs --alias:@=. --outfile=/tmp/seed.cjs
 *   node --env-file=.env /tmp/seed.cjs          # seed
 *   node --env-file=.env /tmp/seed.cjs --clean  # remove
 */

import { db } from '@/lib/db';
import { waContacts, waInboxThreads, waInboxMessages, waCannedReplies } from '@/lib/db/schema';
import { eq, like } from 'drizzle-orm';
import { SERVICE_WINDOW_MS } from '@/lib/services/whatsapp/types';

const PHONES = ['+919000000101', '+919000000102', '+919000000103'];
const CANNED_PREFIX = 'demo_';

async function clean() {
    for (const phone of PHONES) {
        const contact = await db.query.waContacts.findFirst({
            where: eq(waContacts.phone, phone),
            columns: { id: true },
        });
        if (contact) await db.delete(waContacts).where(eq(waContacts.id, contact.id));
    }
    await db.delete(waCannedReplies).where(like(waCannedReplies.title, `${CANNED_PREFIX}%`));
    console.log('Demo inbox data removed.');
}

async function seed() {
    await clean();
    const now = Date.now();

    const people = [
        {
            phone: PHONES[0],
            name: 'Meera Nair',
            consentStatus: 'opted_in' as const,
            // Well inside the window: the composer should offer free-form text.
            windowExpiresAt: new Date(now + SERVICE_WINDOW_MS - 3_600_000),
            unreadCount: 2,
            labels: ['booking_enquiry'],
            messages: [
                { direction: 'inbound' as const, body: 'Hello, do you have a sea-view room for the 14th to the 16th?', minutesAgo: 62 },
                { direction: 'outbound' as const, body: 'Good morning! Yes, we have two premium sea-view rooms free on those dates.', minutesAgo: 55, status: 'read' as const },
                { direction: 'inbound' as const, body: 'What is the tariff including breakfast?', minutesAgo: 12 },
                { direction: 'inbound' as const, body: 'And is airport pickup possible?', minutesAgo: 8 },
            ],
        },
        {
            phone: PHONES[1],
            name: 'Rahul Menon',
            consentStatus: 'pending' as const,
            // Under an hour left: the countdown should render amber.
            windowExpiresAt: new Date(now + 42 * 60_000),
            unreadCount: 1,
            labels: ['f_and_b'],
            messages: [
                { direction: 'outbound' as const, body: 'Your table for four is confirmed for 8pm this evening.', minutesAgo: 1400, status: 'delivered' as const },
                { direction: 'inbound' as const, body: 'Could we make it 8.30 instead?', minutesAgo: 20 },
            ],
        },
        {
            phone: PHONES[2],
            name: 'Anjali Pillai',
            consentStatus: 'opted_out' as const,
            // Lapsed: the composer must switch to templates only.
            windowExpiresAt: new Date(now - 5 * 3_600_000),
            unreadCount: 0,
            labels: ['complaint'],
            messages: [
                { direction: 'inbound' as const, body: 'The air conditioning in 204 was not working last night.', minutesAgo: 1800 },
                { direction: 'outbound' as const, body: 'I am very sorry about that. Engineering has been sent up and we have moved you to 210.', minutesAgo: 1750, status: 'read' as const },
                { direction: 'outbound' as const, body: 'This one failed to send, so it shows as an error.', minutesAgo: 1700, status: 'failed' as const, errorDetail: 'Meta 131026 — receiver incapable' },
            ],
        },
    ];

    for (const person of people) {
        const [contact] = await db
            .insert(waContacts)
            .values({
                phone: person.phone,
                name: person.name,
                source: 'inbound',
                consentStatus: person.consentStatus,
                consentAt: person.consentStatus === 'opted_in' ? new Date(now - 86_400_000 * 30) : null,
                lastInboundAt: new Date(now - 8 * 60_000),
            })
            .returning();

        const [thread] = await db
            .insert(waInboxThreads)
            .values({
                contactId: contact.id,
                status: 'open',
                windowExpiresAt: person.windowExpiresAt,
                lastMessageAt: new Date(now - person.messages[person.messages.length - 1].minutesAgo * 60_000),
                lastInboundAt: new Date(now - 8 * 60_000),
                unreadCount: person.unreadCount,
                labels: person.labels,
            })
            .returning();

        await db.insert(waInboxMessages).values(
            person.messages.map((message, index) => ({
                threadId: thread.id,
                direction: message.direction,
                type: 'text',
                body: message.body,
                status: message.direction === 'inbound' ? ('delivered' as const) : (message.status ?? 'sent'),
                errorDetail: 'errorDetail' in message ? message.errorDetail : null,
                wamid: `demo.${thread.id}.${index}`,
                createdAt: new Date(now - message.minutesAgo * 60_000),
            })),
        );
    }

    await db.insert(waCannedReplies).values([
        { title: `${CANNED_PREFIX}Check-in times`, body: 'Check-in is from 2pm and check-out is at 11am. Early check-in is subject to availability.', category: 'faq', sortOrder: 1 },
        { title: `${CANNED_PREFIX}Directions`, body: 'We are on Punnamada Road, about 15 minutes from Alappuzha railway station.', category: 'faq', sortOrder: 2 },
        { title: `${CANNED_PREFIX}Cancellation policy`, body: 'Free cancellation up to 48 hours before check-in. After that one night is charged.', category: 'policy', sortOrder: 3 },
    ]);

    console.log(`Seeded ${people.length} demo conversations and 3 canned replies.`);
}

const run = process.argv.includes('--clean') ? clean : seed;

run()
    .then(() => process.exit(0))
    .catch((error) => { console.error(error); process.exit(1); });
