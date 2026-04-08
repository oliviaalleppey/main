import type { Metadata } from 'next';
import LegalPage from '@/components/legal/legal-page';

export const metadata: Metadata = {
    title: 'Terms & Conditions | Olivia International Hotel',
    description:
        'Read the Terms & Conditions for Olivia International Hotel, including booking terms, payment rules, cancellation conditions, guest responsibilities, and website use.',
    alternates: {
        canonical: 'https://oliviaalleppey.com/terms',
    },
    keywords: [
        'Olivia International Hotel terms and conditions',
        'hotel booking terms',
        'cancellation policy',
        'refund policy',
        'guest rules',
        'check-in check-out policy',
        'hotel liability',
    ],
};

const highlights = [
    'Reservations',
    'Payments',
    'Cancellations',
    'Guest conduct',
    'Damage and liability',
    'Website use',
];

const sections = [
    {
        id: 'acceptance',
        title: 'Acceptance of these terms',
        intro:
            'These Terms & Conditions apply when you browse this website, submit an enquiry, make a reservation, purchase services, or stay at Olivia International Hotel, also referred to on this website as Olivia Alleppey.',
        points: [
            'By using the website or completing a reservation, you confirm that you have read and accepted these terms.',
            'If you make a booking on behalf of another guest, group, company, or family member, you are responsible for ensuring that all guests covered by that booking comply with these terms.',
            'If you do not agree with these terms, you should not use the website or complete a reservation.',
        ],
    },
    {
        id: 'eligibility-booking',
        title: 'Eligibility and booking responsibility',
        intro:
            'Guests must provide complete and accurate booking information so that reservations can be properly processed, confirmed, and serviced.',
        points: [
            'You must be legally capable of entering into a binding agreement in order to make a reservation.',
            'You are responsible for confirming that the names, dates, room category, guest count, arrival details, phone number, email address, and billing information in your booking are correct.',
            'Special requests such as early check-in, airport transfers, dietary preferences, accessibility needs, extra beds, decorations, or view preferences are subject to availability unless expressly confirmed in writing.',
            'A reservation is only confirmed once we or our authorized booking partner issue a valid confirmation reference.',
        ],
    },
    {
        id: 'rates-payment',
        title: 'Rates, taxes, payment and security authorizations',
        intro:
            'Room rates, packages, inclusions, taxes, and payment requirements may vary depending on the selected offer, stay dates, season, and booking channel.',
        points: [
            'Displayed rates may be subject to applicable taxes, service charges, tourism-related levies, statutory fees, or other government-mandated charges unless expressly stated as inclusive.',
            'Advance payment, partial payment, card guarantee, or full prepayment may be required depending on the rate plan or booking period.',
            'You authorize Olivia International Hotel to verify payment details, pre-authorize your card, collect the agreed room charges, and charge additional approved or applicable amounts such as taxes, minibar, damages, late departure fees, dining, spa, transport, or other incidentals.',
            'If a payment method is declined, invalid, expired, reversed, or suspected to be fraudulent, we may suspend, reject, or cancel the booking until valid payment is received.',
            'Promotional offers, corporate rates, negotiated rates, member offers, and package inclusions may be subject to separate eligibility conditions and may not be combined unless expressly stated.',
        ],
    },
    {
        id: 'checkin-checkout',
        title: 'Check-in, check-out and identification',
        intro:
            'For security, legal compliance, and guest verification, valid identification may be requested at check-in or at any point during the stay.',
        points: [
            'Standard check-in and check-out timings are communicated at the time of booking or arrival and may vary by reservation type, rate plan, or operational requirements.',
            'A valid government-issued photo identification document is required at check-in. Additional registration details may be required under applicable hotel, tourism, law-enforcement, or immigration rules.',
            'International guests may be required to provide passport, visa, and related travel documentation where applicable.',
            'Early check-in and late check-out are not guaranteed and may attract additional charges if approved.',
            'For safety and registration purposes, only the number of guests declared in the confirmed reservation may occupy the room unless the hotel approves otherwise in writing.',
        ],
    },
    {
        id: 'cancellation-refunds',
        title: 'Cancellation, amendments, no-show and refunds',
        intro:
            'Cancellation rights depend on the confirmed rate plan, booking source, group agreement, and seasonal or event-specific conditions.',
        points: [
            'The cancellation, amendment, refund, and no-show policy shown at the time of booking forms part of your reservation and controls in the event of any difference from general website wording.',
            'Some bookings may be fully refundable, partially refundable, date-change limited, or strictly non-refundable.',
            'Failure to arrive on the scheduled check-in date without notice may be treated as a no-show and may result in full or partial charges according to the applicable booking policy.',
            'Refunds, where approved, are normally returned to the original payment method and may take additional time depending on banking partners, card issuers, and payment gateways.',
            'Bookings made through third-party travel agents, online travel agencies, corporate travel desks, or event organizers may need to be modified or cancelled through the original booking channel.',
        ],
    },
    {
        id: 'occupancy-conduct',
        title: 'Occupancy, visitor rules and guest conduct',
        intro:
            'We aim to maintain a safe, respectful, and comfortable environment for every guest, staff member, and visitor on the property.',
        points: [
            'Guests must comply with all house rules, safety instructions, posted notices, lawful directions from hotel staff, and applicable local laws.',
            'Excessive noise, harassment, abuse, illegal activity, violence, nuisance behavior, unsafe conduct, vandalism, unauthorized commercial use, prostitution-related activity, or any activity that disturbs other guests is prohibited.',
            'Smoking or vaping may only be permitted in designated areas. If smoking occurs in a non-smoking room or restricted area, deep cleaning, deodorizing, damage, or out-of-service charges may apply.',
            'Pets, outside food, decorations, candles, fireworks, drones, filming, photography for commercial purposes, or external vendors may only be allowed where expressly approved by the hotel.',
            'The hotel may refuse service, remove unauthorized persons, terminate a stay, or contact relevant authorities if conduct is unsafe, unlawful, abusive, or materially disruptive.',
        ],
    },
    {
        id: 'amenities-services',
        title: 'Amenities, third-party services and special requests',
        intro:
            'We work hard to deliver the experiences and facilities described on the website, but some services may occasionally change because of maintenance, weather, staffing, supplier issues, safety restrictions, or circumstances outside our control.',
        points: [
            'Pool, wellness, dining, transport, sightseeing, conference, wedding, housekeeping, and concierge services may have separate schedules, booking windows, capacity limits, age rules, or service terms.',
            'Activities or services delivered by third-party providers, including transport operators, tour partners, spa specialists, event contractors, or payment platforms, may be subject to their own conditions and operational availability.',
            'We do not guarantee that every amenity, room feature, menu item, view, experience, or partner service will be available at all times.',
            'Dietary, medical, or allergy-related requests will be handled with care, but we cannot guarantee an entirely allergen-free environment.',
        ],
    },
    {
        id: 'damage-valuables',
        title: 'Damage, cleaning, incidentals and personal property',
        intro:
            'Guests are expected to use the property, room furnishings, equipment, and shared spaces responsibly and with reasonable care.',
        points: [
            'You are responsible for any loss, breakage, theft, unusual soiling, missing items, smoke damage, tampering, or property damage caused by you, your invitees, or anyone covered by your reservation.',
            'Reasonable repair costs, replacement costs, specialist cleaning costs, and associated revenue loss may be charged where damage or misuse takes a room or facility out of service.',
            'Please use in-room safes or secure storage where provided. The hotel is not responsible for loss, theft, or damage to money, jewelry, electronics, documents, luggage, vehicles, or personal belongings except to the extent required by applicable law.',
            'Parking, valet, and vehicle access, where available, are provided subject to space, safety, and operational rules and are used at the owner’s risk unless otherwise required by law.',
        ],
    },
    {
        id: 'website-ip',
        title: 'Website use, content and intellectual property',
        intro:
            'All website content, including text, designs, images, logos, videos, graphics, page layouts, and branding elements, is owned by or licensed to Olivia International Hotel unless stated otherwise.',
        points: [
            'You may use the website only for lawful personal, informational, and booking-related purposes.',
            'You may not copy, scrape, reproduce, republish, distribute, modify, reverse engineer, frame, mirror, resell, or commercially exploit website content without prior written permission.',
            'You may not use bots, malicious code, automated extraction tools, or any activity that interferes with the website’s security, availability, or integrity.',
            'Links to third-party websites, payment services, maps, or booking tools are provided for convenience only and do not imply endorsement or responsibility for third-party content or practices.',
        ],
    },
    {
        id: 'liability-force-majeure',
        title: 'Liability, disclaimers and force majeure',
        intro:
            'We aim to provide accurate information and dependable service, but some situations are outside reasonable operational control.',
        points: [
            'Website content, room descriptions, visuals, amenities, rates, availability, and offers are provided in good faith but may occasionally contain errors, outdated details, or omissions. We reserve the right to correct them.',
            'To the maximum extent permitted by applicable law, Olivia International Hotel is not liable for indirect, incidental, consequential, special, or purely economic loss arising from use of the website, services, or stay.',
            'We are not responsible for delays, cancellations, service interruptions, or inability to perform caused by events such as weather, flooding, natural disaster, strikes, supplier failure, government action, public health measures, utility interruption, civil disturbance, or other force majeure events.',
            'Nothing in these terms excludes liability where exclusion is not permitted under applicable law.',
        ],
    },
    {
        id: 'law-updates',
        title: 'Governing law, disputes and changes to these terms',
        intro:
            'These terms are governed by the laws applicable to the operation of Olivia International Hotel in India, unless mandatory consumer protections require otherwise.',
        points: [
            'Any dispute relating to the website, booking, payment, stay, or hotel services should first be raised directly with the hotel so that we have the opportunity to resolve it promptly and fairly.',
            'If a dispute cannot be resolved amicably, it may be submitted to the competent courts having jurisdiction in Kerala, India, subject to any non-excludable rights you may have under applicable law.',
            'We may update these Terms & Conditions from time to time. Updated terms will apply from the published effective date unless otherwise stated.',
        ],
    },
] as const;

export default function TermsPage() {
    return (
        <LegalPage
            eyebrow="Olivia Legal"
            title="Terms & Conditions"
            summary="These terms explain the main rules that apply when you use the Olivia website, make a reservation, pay for services, or stay at the property. They are written to cover the key operational, booking, payment, cancellation, conduct, and liability points guests usually need before confirming a stay."
            lastUpdated="April 8, 2026"
            highlights={highlights}
            sections={[...sections]}
            relatedLink={[
                { href: '/policies', label: 'Reservation & Cancellation Policy' },
                { href: '/privacy', label: 'Privacy Policy' },
            ]}
        />
    );
}
