/**
 * Guest-typed fields in booking emails are escaped, and the new alerts go to the
 * right people. Resend is replaced with a recorder, so nothing is sent.
 */
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

type SentMail = { to: string[]; bcc?: string[]; subject: string; html: string };
const sent: SentMail[] = [];

mock.module('resend', {
    namedExports: {
        Resend: class {
            emails = {
                send: async (mail: SentMail) => {
                    sent.push(mail);
                    return { data: { id: 'test' }, error: null };
                },
            };
        },
    },
});
process.env.RESEND_API_KEY = 'test-key';

const email = await import('@/lib/services/email');

const hostileName = 'Asha <a href="https://phish.example">verify payment</a> Nair';
const charges = {
    nights: 2,
    rooms: [{ name: 'Canal View King Room', quantity: 1, subtotal: 1799000 }],
    discount: 0,
    promoCode: null,
    roomTax: 323820,
    addOns: [],
    addOnTax: 0,
    total: 2122820,
};
const noMarkupFromGuest = (html: string) =>
    !html.includes('<a href="https://phish.example"') && !html.includes('<img') && !html.includes('<script');

test('staff booking alert escapes guest name, email and phone', async () => {
    sent.length = 0;
    await email.sendBookingAlertToStaff({
        guestName: hostileName,
        guestEmail: 'x@y.com"><img src=x onerror=alert(1)>',
        guestPhone: '+91 1<script>',
        bookingNumber: 'OL-1', confirmationNumber: '9', checkIn: '10/11/2026', checkOut: '12/11/2026',
        nights: 2, adults: 2, children: 0, charges,
    });
    assert.equal(sent.length, 1);
    assert.ok(noMarkupFromGuest(sent[0].html));
    assert.ok(sent[0].html.includes('Asha &lt;a href=&quot;https://phish.example&quot;&gt;'));
});

test('guest confirmation escapes the guest name', async () => {
    sent.length = 0;
    await email.sendBookingConfirmation({
        to: 'guest@example.com', guestName: hostileName, bookingNumber: 'OL-1',
        checkIn: '10/11/2026', checkOut: '12/11/2026', charges,
    });
    assert.ok(noMarkupFromGuest(sent[0].html));
});

test('paid-but-unconfirmed alert goes to reservations and FOM, never the guest', async () => {
    sent.length = 0;
    await email.sendUnconfirmedPaymentAlertToStaff({
        bookingId: 'b1', bookingNumber: 'OL-1', guestName: hostileName, guestEmail: 'guest@example.com',
        guestPhone: '1', checkIn: 'a', checkOut: 'b', totalAmount: 2122820, reason: 'rejected', detail: '<b>Invalid</b>',
    });
    const [mail] = sent;
    assert.ok(mail.subject.startsWith('ACTION NEEDED'));
    assert.ok(!mail.to.includes('guest@example.com'));
    assert.ok(noMarkupFromGuest(mail.html));
    assert.ok(!mail.html.includes('<b>Invalid</b>'));
    assert.ok(mail.html.includes('/admin/bookings/b1'));
});

test('late-success alert says the guest was not told the payment went through', async () => {
    sent.length = 0;
    await email.sendUnconfirmedPaymentAlertToStaff({
        bookingId: 'b1', bookingNumber: 'OL-1', guestName: 'Asha', guestEmail: 'a@b.c', guestPhone: '1',
        checkIn: 'a', checkOut: 'b', totalAmount: 100, reason: 'late_success', detail: 'd',
    });
    assert.ok(sent[0].html.includes('has <strong>not</strong> been told'));
});

test('payment-received note goes to the guest and says not to pay again', async () => {
    sent.length = 0;
    await email.sendPaymentReceivedPendingToGuest({
        to: 'guest@example.com', guestName: hostileName, bookingNumber: 'OL-1',
        checkIn: '10/11/2026', checkOut: '12/11/2026', totalAmount: 2122820,
    });
    const [mail] = sent;
    assert.deepEqual(mail.to, ['guest@example.com']);
    assert.ok(mail.html.includes('There is no need to book or pay again'));
    assert.ok(mail.html.includes('₹21,228.20'));
    assert.ok(noMarkupFromGuest(mail.html));
});

test('cron alert goes to IT, names the job, and links the dashboard', async () => {
    sent.length = 0;
    await email.sendCronAlert({
        kind: 'overdue',
        jobs: [{ job: 'booking-watchdog', every: 'every 5 min', lastScheduledRun: '29 Sep, 09:40 IST' }],
    });
    const [mail] = sent;
    assert.deepEqual(mail.to, ['it@oliviaalleppey.com']);
    assert.equal(mail.subject, 'Scheduled job stopped: booking-watchdog');
    assert.ok(mail.html.includes('paid bookings that Hotsoft has not confirmed are not retried'));
    assert.ok(mail.html.includes('/admin'));
});
