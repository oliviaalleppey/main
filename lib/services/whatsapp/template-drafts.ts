import type { TemplateButton } from './template-lint';
import { clickButtonUrlTemplate } from './attribution';

/**
 * The five templates the hotel submits to Meta on day one (§8 of the plan).
 *
 * They live here as data rather than being typed into the admin UI for one
 * reason: **Meta's review is the long pole and it cannot start until the WABA
 * exists.** Written now, they are submitted within the hour credentials arrive
 * instead of being drafted afterwards, which is another two days of clock.
 *
 * The copy is deliberately plain. Meta rejects marketing that reads like a
 * billboard, and the linter in template-lint.ts encodes the specific causes —
 * shouty capitals, link shorteners, a body opening on a variable, and utility
 * templates carrying offer language. Every draft here passes it clean; there is
 * a test that fails if that stops being true.
 *
 * ## The variable contracts are not negotiable
 *
 * The UTILITY templates are fired by code that already exists and already passes
 * a fixed set of variables, in a fixed order:
 *
 *   booking_confirmation  5  name, booking number, check-in, check-out, room type
 *   payment_failed        2  name, booking number
 *   prearrival            4  name, booking number, check-in, check-out
 *   checkout_review       4  name, booking number, check-in, check-out
 *
 * (from `BookingService` and `app/api/cron/whatsapp-automations/route.ts`.)
 *
 * A template whose variable count disagrees with its caller does not fail
 * loudly — Meta rejects the send with a parameter-mismatch error per message,
 * which surfaces as a pile of failed rows long after approval. `expectedFor`
 * below pins each one, and the test suite checks them against the real callers.
 */

export type TemplateDraft = {
    name: string;
    category: 'MARKETING' | 'UTILITY';
    language: string;
    bodyText: string;
    headerType?: 'none' | 'text';
    headerText?: string;
    footerText?: string;
    buttons?: TemplateButton[];
    /** What each {{n}} is, in order. Documentation and test fixture at once. */
    variables: string[];
    /**
     * Sample values, one per variable, in the same order.
     *
     * Not optional in practice: Meta rejects a variable-bearing template that
     * arrives without them, and the reviewer reads these to judge the message —
     * so they should look like real bookings, not "Sample 1".
     */
    exampleValues: string[];
    /** The automation key that fires this, if any. */
    automationKey?: string;
    /** Why this template is worded the way it is. */
    rationale: string;
};

/**
 * The re-permission ask. This is the most important template in the set.
 *
 * Every one of the hotel's ~10,000 imported numbers lands as `pending`, because
 * nothing in the system has ever recorded marketing consent (§0a). This is the
 * only marketing message any of them may lawfully receive, and it is the one
 * that converts a grey list into a legal one.
 *
 * It asks for permission and offers a real "no". A re-permission ask that buries
 * the refusal is worse than not sending it: it produces consent that would not
 * survive being questioned, which is the entire thing we are trying to acquire.
 */
const reengage: TemplateDraft = {
    name: 'olivia_reengage_v1',
    category: 'MARKETING',
    language: 'en',
    bodyText:
        'Hello {{1}}, this is Olivia Alleppey. You have stayed with us or enquired before, '
        + 'and we would like to send you occasional news about our houseboats and seasonal '
        + 'offers on WhatsApp.\n\n'
        + 'May we? You can change your mind at any time, and we will only message you if you say yes.',
    footerText: 'Olivia Alleppey, Kerala',
    buttons: [
        { type: 'QUICK_REPLY', text: 'Yes, keep me posted' },
        { type: 'QUICK_REPLY', text: 'No thanks' },
    ],
    variables: ['guest first name'],
    exampleValues: ['Anita'],
    rationale:
        'Asks rather than assumes, and states the opt-out in the same breath as the ask. '
        + 'No offer, no urgency, no link — this message exists to obtain permission, and '
        + 'attaching a sell to it is what makes a re-permission campaign read as a promotion '
        + 'and get reported as spam.',
};

/**
 * The actual campaign template, and the only one that carries a tracked link.
 *
 * The URL button is the dynamic one attribution needs: Meta allows a single
 * variable in a button URL and it must sit at the end, which is why the token
 * is a path suffix. {{1}} in the *body* and {{1}} in the *button* are separate
 * parameter lists in the send payload, so the numbering does not collide.
 */
const offer: TemplateDraft = {
    name: 'olivia_offer_v1',
    category: 'MARKETING',
    language: 'en',
    bodyText:
        'Hello {{1}}, our {{2}} houseboat packages are now open for booking.\n\n'
        + 'Cruise the Alleppey backwaters with all meals included, and watch the sunset from '
        + 'your own deck. Rooms are limited for these dates.',
    footerText: 'Olivia Alleppey, Kerala',
    buttons: [
        { type: 'QUICK_REPLY', text: 'Stop promotions' },
        { type: 'URL', text: 'See rooms', url: clickButtonUrlTemplate() },
    ],
    variables: ['guest first name', 'season or offer name, e.g. Onam'],
    exampleValues: ['Anita', 'Onam'],
    rationale:
        'The opt-out button comes first so it is never the thing someone has to hunt for, '
        + 'and it is why the tracked URL is button index 1 rather than 0. "Rooms are limited" '
        + 'is the only scarcity line and it is true; anything stronger trips the shouty-copy '
        + 'check and, more importantly, trains people to ignore us.',
};

/** Fired by BookingService the moment a booking is confirmed. */
const bookingConfirm: TemplateDraft = {
    name: 'olivia_booking_confirm_v1',
    category: 'UTILITY',
    language: 'en',
    automationKey: 'booking_confirmation',
    bodyText:
        'Hello {{1}}, your booking at Olivia Alleppey is confirmed.\n\n'
        + 'Reference: {{2}}\n'
        + 'Check-in: {{3}}\n'
        + 'Check-out: {{4}}\n'
        + 'Room: {{5}}\n\n'
        + 'Reply to this message if you need anything before you arrive. We look forward to hosting you.',
    footerText: 'Olivia Alleppey, Kerala',
    variables: ['guest name', 'booking number', 'check-in date', 'check-out date', 'room type'],
    exampleValues: ['Anita Menon', 'OL-2026-0412', '12 Dec 2026', '15 Dec 2026', 'Premium Houseboat'],
    rationale:
        'The workhorse. UTILITY is roughly six times cheaper than MARKETING and needs no '
        + 'marketing consent, so this is what builds the number\'s quality rating during '
        + 'warm-up for almost nothing. "Reply to this message" is deliberate: an inbound '
        + 'reply opens the 24-hour service window, which is what makes the inbox usable.',
};

/** Fired when a payment fails, so the guest is not left guessing. */
const paymentFailed: TemplateDraft = {
    name: 'olivia_payment_failed_v1',
    category: 'UTILITY',
    language: 'en',
    automationKey: 'payment_failed',
    bodyText:
        'Hello {{1}}, we could not complete the payment for booking {{2}}, so the room is '
        + 'not held yet.\n\n'
        + 'No money has been taken. Reply here and we will help you finish the booking, or '
        + 'try again from the confirmation email.',
    footerText: 'Olivia Alleppey, Kerala',
    variables: ['guest name', 'booking number'],
    exampleValues: ['Anita Menon', 'OL-2026-0412'],
    rationale:
        '"No money has been taken" is the first thing the guest wants to know and so it goes '
        + 'near the top. This template is not in the plan\'s original list of five, but the '
        + 'payment_failed automation is already wired into BookingService and would sit '
        + 'permanently disabled without it.',
};

/** T-1 day, swept by the hourly automations cron. */
const prearrival: TemplateDraft = {
    name: 'olivia_prearrival_v1',
    category: 'UTILITY',
    language: 'en',
    automationKey: 'prearrival',
    bodyText:
        'Hello {{1}}, we are looking forward to welcoming you tomorrow.\n\n'
        + 'Booking {{2}}, checking in {{3}} and out {{4}}. Check-in is from 2pm and our team '
        + 'is on site from early morning if you arrive before then.\n\n'
        + 'Reply here if you need directions, an early check-in, or anything arranged for your arrival.',
    footerText: 'Olivia Alleppey, Kerala',
    variables: ['guest name', 'booking number', 'check-in date', 'check-out date'],
    exampleValues: ['Anita Menon', 'OL-2026-0412', '12 Dec 2026', '15 Dec 2026'],
    rationale:
        'Carries information the guest actually needs the day before, which is what keeps it '
        + 'UTILITY rather than a disguised marketing touch. The invitation to reply is also '
        + 'the cheapest way to open a service window before a stay, when most questions arise.',
};

/** Post-checkout review request, swept by the same cron. */
const checkoutReview: TemplateDraft = {
    name: 'olivia_checkout_review_v1',
    category: 'UTILITY',
    language: 'en',
    automationKey: 'checkout_review',
    bodyText:
        'Hello {{1}}, thank you for staying with us at Olivia Alleppey.\n\n'
        + 'We hope the backwaters treated you well. If you have a moment, we would be grateful '
        + 'to hear how your stay was.\n\n'
        + 'Your booking {{2}} covered {{3}} through to {{4}}. Just reply to this message — '
        + 'we read every one.',
    footerText: 'Olivia Alleppey, Kerala',
    variables: ['guest name', 'booking number', 'check-in date', 'check-out date'],
    exampleValues: ['Anita Menon', 'OL-2026-0412', '12 Dec 2026', '15 Dec 2026'],
    rationale:
        'Asks for the reply in the thread rather than linking to a review site. A link here '
        + 'would make it arguable that the message is promotional, and a reply is worth more '
        + 'anyway: it is feedback the hotel can act on and it opens a service window.',
};

export const TEMPLATE_DRAFTS: TemplateDraft[] = [
    reengage,
    offer,
    bookingConfirm,
    paymentFailed,
    prearrival,
    checkoutReview,
];

/**
 * The variable count each automation's caller actually sends.
 *
 * Kept next to the drafts so a mismatch is a test failure rather than a pile of
 * failed sends after Meta has already approved the template.
 */
export const AUTOMATION_VARIABLE_CONTRACT: Record<string, number> = {
    booking_confirmation: 5,
    payment_failed: 2,
    prearrival: 4,
    checkout_review: 4,
};

export function draftByName(name: string): TemplateDraft | undefined {
    return TEMPLATE_DRAFTS.find((draft) => draft.name === name);
}
