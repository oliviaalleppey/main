import type { Metadata } from 'next';
import LegalPage from '@/components/legal/legal-page';

export const metadata: Metadata = {
    title: 'Refund Policy | Olivia International Hotel',
    description:
        'Read the Refund Policy for Olivia International Hotel, including refundable and non-refundable bookings, cancellation windows, no-shows, early departures, and refund timelines.',
    alternates: {
        canonical: 'https://oliviaalleppey.com/refund-policy',
    },
    keywords: [
        'Olivia International Hotel refund policy',
        'hotel refund policy',
        'booking refunds',
        'cancellation refunds',
        'no-show policy',
        'early departure refund',
        'third-party booking refunds',
    ],
};

const highlights = [
    'Refundable bookings',
    'Non-refundable rates',
    'No-shows',
    'Date changes',
    'Third-party bookings',
    'Processing timelines',
];

const sections = [
    {
        id: 'scope',
        title: 'Scope of this refund policy',
        intro:
            'This Refund Policy explains how refunds are generally handled for reservations, deposits, packages, and hotel-related payments made to Olivia International Hotel.',
        points: [
            'This page should be read together with the booking confirmation, rate-plan terms, package terms, event agreement, and our Terms & Conditions.',
            'If your booking confirmation or signed agreement contains a specific cancellation or refund rule, that booking-specific rule will control.',
            'Refund eligibility may depend on the booking source, selected rate, season, special-event periods, package inclusions, and the timing of your cancellation or modification request.',
        ],
    },
    {
        id: 'refundable-bookings',
        title: 'Refundable bookings',
        intro:
            'Some room rates and direct-booking offers may allow partial or full refunds if cancellation is made within the permitted cancellation window.',
        points: [
            'Where a booking is sold as refundable, the exact cut-off time and cancellation deadline shown at the time of booking will apply.',
            'If a qualifying cancellation is received within the permitted window, eligible prepaid amounts may be refunded after deducting any non-refundable taxes, third-party charges, bank fees, or consumed services where applicable.',
            'If part of the stay has already been used, or if additional services were consumed before cancellation, only the unused eligible balance may be refunded.',
        ],
    },
    {
        id: 'non-refundable-bookings',
        title: 'Non-refundable and restricted rates',
        intro:
            'Certain promotional rates, peak-date offers, advance purchase rates, event periods, group allocations, or specially discounted packages may be non-refundable or only partially refundable.',
        points: [
            'If a rate is marked non-refundable, cancellation, no-show, early departure, or failure to meet the rate conditions may result in the loss of all or part of the prepaid amount.',
            'Date-change requests for non-refundable rates may be declined or may only be allowed on a discretionary basis, subject to fare difference, availability, and amendment charges.',
            'Inclusions that have already been reserved, consumed, or contracted with third-party vendors may remain non-refundable even if part of the room payment is refundable.',
        ],
    },
    {
        id: 'amendments',
        title: 'Booking changes, shortening stays and early departures',
        intro:
            'Requests to amend booking dates, reduce nights, change room type, or depart earlier than planned may affect refund eligibility.',
        points: [
            'Reducing the number of nights after a booking is confirmed may lead to revised pricing, loss of promotional benefits, or cancellation charges.',
            'Early departure after check-in may be treated as a cancellation of unused nights and may not qualify for a refund unless the applicable rate terms expressly allow it.',
            'Changes are always subject to room availability, current pricing, and the conditions of the original reservation.',
        ],
    },
    {
        id: 'no-show',
        title: 'No-show, failed payment and unused reservations',
        intro:
            'If a guest does not arrive on the scheduled check-in date and no approved amendment or cancellation has been processed, the booking may be treated as a no-show.',
        points: [
            'No-show reservations may be charged in full or in part according to the confirmed booking policy.',
            'Bookings that fail due to declined payment, invalid card guarantee, suspected fraud, or failure to complete required prepayment may be cancelled without any obligation to honor the original rate or inventory.',
            'Unused services, meals, amenities, transport slots, or package inclusions may be non-refundable unless specifically stated otherwise.',
        ],
    },
    {
        id: 'third-party',
        title: 'Third-party, OTA, agent and corporate bookings',
        intro:
            'Reservations made through online travel agencies, travel agents, corporate desks, event organizers, or other third-party channels often follow the payment and refund rules of that original booking source.',
        points: [
            'If your booking was made through a third party, refund requests may need to be submitted directly to that booking source.',
            'The hotel may confirm stay status or cancellation details to the original booking partner, but the refund may still be processed by that partner rather than by the hotel.',
            'Service fees, partner commissions, gateway deductions, and exchange-rate differences applied by third parties may affect the final refunded amount.',
        ],
    },
    {
        id: 'processing',
        title: 'Refund method and processing timeline',
        intro:
            'Approved refunds are normally returned to the original payment method used for the transaction unless another method is required by law or specifically approved by the hotel.',
        points: [
            'Refund processing begins only after eligibility is confirmed, applicable deductions are calculated, and any fraud or verification checks are completed.',
            'Banking networks, card issuers, wallets, payment gateways, and international processing systems may take additional time to post the refunded amount to your account.',
            'The hotel is not responsible for delays caused by banks, payment processors, intermediary platforms, exchange-rate movements, or card network settlement timelines.',
        ],
    },
    {
        id: 'exceptions',
        title: 'Exceptional circumstances and discretionary refunds',
        intro:
            'Any refund outside the standard booking conditions is considered an exception and is reviewed case by case.',
        points: [
            'Requests involving medical emergencies, travel disruption, force majeure events, duplicate payments, system errors, or clearly documented exceptional circumstances may be reviewed individually.',
            'A discretionary review does not guarantee approval of a refund, waiver, credit note, or rebooking option.',
            'Where a third-party vendor, event contractor, travel provider, or booking channel is involved, the hotel may need time to coordinate before determining whether any refund is possible.',
        ],
    },
    {
        id: 'contact',
        title: 'How to request a refund',
        intro:
            'For the fastest review, please contact the reservations team with clear booking details and the reason for your request.',
        points: [
            'Email reservation@oliviaalleppey.com or mail@oliviaalleppey.com with your booking reference, guest name, dates of stay, and the specific refund or cancellation request.',
            'You may also call +91 8075 416 514 for assistance, although written confirmation may still be required for processing.',
            'Submitting a request does not itself confirm that a refund is due. Refund eligibility is confirmed only after review against the booking terms and applicable records.',
        ],
    },
] as const;

export default function RefundPolicyPage() {
    return (
        <LegalPage
            eyebrow="Olivia Legal"
            title="Refund Policy"
            summary="This page explains how refunds are handled for hotel bookings, prepaid reservations, deposits, amended stays, no-shows, and third-party reservations. It is designed to make the most important refund points easy to understand before a guest books, cancels, or requests a change."
            lastUpdated="April 8, 2026"
            highlights={highlights}
            sections={[...sections]}
            relatedLink={{
                href: '/terms',
                label: 'Terms & Conditions',
            }}
        />
    );
}
