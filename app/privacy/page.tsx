import type { Metadata } from 'next';
import LegalPage from '@/components/legal/legal-page';

export const metadata: Metadata = {
    title: 'Privacy Policy | Olivia International Hotel',
    description:
        'Read the Privacy Policy for Olivia International Hotel, including how personal data is collected, used, shared, stored, protected, and how privacy requests can be made.',
    alternates: {
        canonical: 'https://oliviaalleppey.com/privacy',
    },
    keywords: [
        'Olivia International Hotel privacy policy',
        'hotel privacy policy',
        'personal data',
        'cookies',
        'booking information',
        'CCTV privacy',
        'data retention',
    ],
};

const highlights = [
    'Personal data',
    'Bookings and enquiries',
    'Cookies and analytics',
    'CCTV',
    'Data sharing',
    'Guest rights',
];

const sections = [
    {
        id: 'scope',
        title: 'Who we are and when this policy applies',
        intro:
            'This Privacy Policy explains how Olivia International Hotel, also presented on this website as Olivia Alleppey, collects, uses, stores, shares, and protects personal information.',
        points: [
            'This policy applies when you browse our website, contact us, submit a form, subscribe to updates, request a quote, make or manage a reservation, stay with us, attend an event, or otherwise interact with our services.',
            'This policy covers data collected directly by the hotel and data received through authorized booking partners, event coordinators, travel agents, payment providers, and service platforms connected with your stay or enquiry.',
            'If a third-party website, booking engine, payment gateway, or social media platform has its own privacy notice, that third party’s policy may also apply to data collected through its service.',
        ],
    },
    {
        id: 'information-collected',
        title: 'Information we collect',
        intro:
            'The type of information we collect depends on how you interact with us, but it may include booking, identity, payment, communication, preference, and technical data.',
        points: [
            'Identity and contact information such as name, email address, phone number, postal address, company name, nationality, and guest names.',
            'Reservation and stay information such as arrival and departure dates, room type, package selected, guest count, special requests, celebration details, travel preferences, and stay history.',
            'Billing and transaction information such as billing address, invoice details, GST or tax details if provided, payment confirmations, and limited payment-related records needed for accounting and dispute handling.',
            'Identity verification information such as government-issued identification details, passport or visa information where required, vehicle details, and registration details collected at check-in.',
            'Preference information such as language, room preferences, bedding preference, accessibility requests, dietary requirements, wellness information voluntarily shared, and communication preferences.',
            'Technical and usage information such as IP address, device type, browser type, operating system, approximate location, referring pages, site interactions, cookies, analytics signals, and access timestamps.',
            'Security information such as CCTV footage, access-control logs, incident reports, and communications related to safety, fraud prevention, or property protection.',
        ],
    },
    {
        id: 'how-collected',
        title: 'How we collect information',
        intro:
            'We collect information directly from you, automatically through website technologies, and indirectly through trusted partners involved in reservations or service delivery.',
        points: [
            'Directly from you when you fill in booking forms, contact forms, enquiry forms, newsletter forms, payment forms, event requests, WhatsApp messages, emails, or calls.',
            'Automatically through cookies, analytics tags, server logs, embedded tools, and security technologies when you browse the website.',
            'From third parties such as online travel agencies, corporate travel desks, event organizers, payment processors, advertising partners, social media platforms, or technology vendors that support reservations and communications.',
            'From on-property processes such as check-in registration, concierge service requests, dining reservations, spa or transport bookings, security systems, and guest assistance interactions.',
        ],
    },
    {
        id: 'use-of-data',
        title: 'How we use personal information',
        intro:
            'We use personal data to operate the website, manage reservations, deliver hospitality services, comply with legal obligations, communicate with guests, and improve our services.',
        points: [
            'To respond to enquiries, prepare quotations, confirm bookings, take payments, issue invoices, send confirmations, and provide pre-arrival or post-stay communication.',
            'To register guests, verify identity, manage check-in and check-out, provide room access, honor stay preferences, arrange transport, process dining or wellness requests, and support special occasions or events.',
            'To maintain guest records, prevent fraud, investigate misuse, protect staff and guests, enforce hotel rules, and manage complaints, disputes, or chargebacks.',
            'To send service-related communications such as booking updates, itinerary details, check-in instructions, policy notices, invoices, receipts, and emergency or operational messages.',
            'To send promotional communication, offers, newsletters, loyalty-related updates, or event news where permitted by law or where you have not opted out.',
            'To analyze website performance, improve user experience, measure campaign effectiveness, understand guest demand, and plan operational or marketing improvements.',
            'To comply with accounting, tax, law-enforcement, security, hospitality registration, consumer protection, and regulatory obligations that apply to hotel operations.',
        ],
    },
    {
        id: 'lawful-basis',
        title: 'Why we process your data',
        intro:
            'Depending on the situation, we process personal data because it is needed to provide requested services, protect legitimate business and security interests, comply with legal obligations, or rely on your consent where appropriate.',
        points: [
            'Reservation, payment, check-in, and guest-service activities are usually processed because they are necessary to provide the services you asked for.',
            'Security monitoring, fraud prevention, website protection, service improvement, and operational planning may be processed as part of our legitimate business and safety interests.',
            'Identity verification, registration, accounting, tax, and regulatory reporting may be processed because the law or authorities require it.',
            'Marketing emails, optional promotional communication, and certain cookies or analytics tools may be processed based on your consent or opt-in choices where applicable.',
        ],
    },
    {
        id: 'sharing',
        title: 'How we share personal information',
        intro:
            'We do not sell personal information as a general business practice. We may, however, share data with service providers and partners where needed for hotel operations, bookings, security, or legal compliance.',
        points: [
            'With payment processors, banks, and gateway partners to authorize payments, settle transactions, process refunds, and investigate disputes or fraud.',
            'With booking channels, reservation systems, channel managers, CRM tools, messaging systems, and cloud software providers used to manage enquiries, reservations, guest communication, and property operations.',
            'With transport providers, event partners, spa providers, travel coordinators, IT vendors, marketing platforms, and analytics providers where their service is required to fulfill your request or support the hotel’s operations.',
            'With professional advisers, auditors, insurers, regulators, law-enforcement agencies, courts, or governmental bodies where disclosure is necessary to protect rights, investigate issues, comply with law, or respond to legal process.',
            'With buyers, investors, or successor entities if the hotel business or website is reorganized, merged, financed, or transferred, subject to appropriate handling of personal data.',
        ],
    },
    {
        id: 'cookies',
        title: 'Cookies, analytics and similar technologies',
        intro:
            'Our website may use cookies, pixels, scripts, local storage, and similar technologies to remember preferences, secure the site, measure performance, and improve the browsing experience.',
        points: [
            'Essential technologies are currently used to keep the website functioning, maintain sign-in sessions, support secure booking flow, preserve booking session state, and detect abuse.',
            'At the time of publication of this policy, the website primarily relies on essential cookies such as authentication-related cookies and the booking session cookie needed for checkout flow continuity.',
            'Optional analytics technologies may be used in the future to understand page visits, traffic sources, engagement patterns, device behavior, and content performance, but where consent is required they should only be enabled after the visitor makes a consent choice.',
            'Preference technologies may remember settings such as language, previously entered information, or experience-related choices where enabled.',
            'Advertising or remarketing technologies may be used if marketing features are enabled, including to measure campaign effectiveness or show relevant promotions on third-party platforms.',
            'You may be able to control cookies through your browser settings, privacy controls, device settings, or consent tools made available on the site, although disabling some technologies may affect functionality.',
        ],
    },
    {
        id: 'retention-security',
        title: 'Data retention and security',
        intro:
            'We retain personal data only for as long as it is reasonably needed for the purposes described in this policy, including hospitality operations, customer service, accounting, tax, dispute resolution, security, and compliance.',
        points: [
            'Retention periods may differ depending on the type of record, the sensitivity of the information, whether there is an active guest relationship, and whether legal or accounting requirements apply.',
            'We use reasonable administrative, technical, and organizational safeguards designed to protect personal information against unauthorized access, misuse, loss, alteration, or disclosure.',
            'Examples of safeguards may include controlled system access, vendor restrictions, role-based permissions, secure storage practices, monitoring, and payment-security procedures.',
            'No digital system, transmission channel, or storage method is completely risk-free, so we cannot guarantee absolute security.',
        ],
    },
    {
        id: 'transfers-cctv',
        title: 'International transfers, CCTV and on-property security',
        intro:
            'Some of our service providers or technology systems may store or process information in locations outside your home jurisdiction, and the property may use CCTV and related security tools for safety and loss prevention.',
        points: [
            'Where personal information is transferred across borders, we take reasonable steps to ensure it is handled with appropriate confidentiality and protection measures.',
            'CCTV may operate in public or common areas of the hotel and its surroundings for guest safety, staff safety, crime prevention, incident review, and property protection.',
            'We do not place CCTV in locations where privacy is expected, such as guest rooms or similar private areas.',
            'Security logs, visitor records, access records, and incident documentation may be retained where reasonably necessary for investigations, safety reviews, insurance, or compliance matters.',
        ],
    },
    {
        id: 'children-rights',
        title: 'Children’s information and your rights',
        intro:
            'Children’s information is usually collected only as part of a parent or guardian’s booking, family stay, or service request, and privacy rights may vary depending on applicable law.',
        points: [
            'We do not knowingly ask children to submit independent bookings or marketing subscriptions without the involvement of a parent, guardian, or responsible adult.',
            'If you believe a child has provided personal data to us inappropriately, please contact us so we can review and take suitable action.',
            'Subject to applicable law, you may request access to your personal data, correction of inaccurate information, deletion where appropriate, restriction or objection to certain processing, withdrawal of consent, or opt-out from direct marketing.',
            'You may also request help updating booking contact details, communication preferences, or guest profile information.',
        ],
    },
    {
        id: 'third-party-updates',
        title: 'Third-party services, policy updates and contact',
        intro:
            'Our website may link to third-party services such as maps, booking platforms, payment gateways, travel partners, or social networks, which operate under their own rules and privacy practices.',
        points: [
            'We encourage you to review the privacy notices of third-party services before sharing information through those services.',
            'We may update this Privacy Policy from time to time to reflect operational, legal, technical, or service changes. The revised version will apply from the date it is published unless otherwise stated.',
            'For privacy questions, correction requests, opt-out requests, or other data-related concerns, please contact us at reservation@oliviaalleppey.com or mail@oliviaalleppey.com, or call +91 8075 416 514.',
        ],
    },
] as const;

export default function PrivacyPage() {
    return (
        <LegalPage
            eyebrow="Olivia Legal"
            title="Privacy Policy"
            summary="This policy explains what personal information we collect, why we collect it, how we use it, when we share it, how long we keep it, and what choices guests and website visitors have. It is designed to cover the practical privacy points that matter most before, during, and after a booking."
            lastUpdated="April 8, 2026"
            highlights={highlights}
            sections={[...sections]}
            relatedLink={[
                { href: '/policies', label: 'Reservation & Cancellation Policy' },
                { href: '/terms', label: 'Terms & Conditions' },
            ]}
        />
    );
}
