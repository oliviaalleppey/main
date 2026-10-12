import type { Metadata } from 'next';
import PartyExperience from '@/components/party/party-experience';
import { getPartyPopup } from '@/lib/db/actions/settings-actions';
import { PARTY_END } from '@/lib/config/party-popup';
import { pageMetadata } from '@/lib/seo';

export const revalidate = 60;

export const metadata: Metadata = pageMetadata({
    title: '31st Night Celebrity Masquerade, New Year\'s Eve in Alappuzha',
    description:
        'Ring in the new year at Olivia Alleppey with a celebrity masquerade: live DJ, open bar, gala dinner and kids\' care, stay included. 31 December, 8 pm.',
    path: '/31st-night',
});

const bookHref = '/book/search?checkIn=2026-12-31&checkOut=2027-01-01&adults=2';

export default async function ThirtyFirstNightPage() {
    const content = await getPartyPopup();
    const over = Date.now() >= new Date(PARTY_END).getTime();
    return <PartyExperience content={content} over={over} bookHref={bookHref} />;
}
