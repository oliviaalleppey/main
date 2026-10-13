import type { Metadata } from 'next';
import PartyExperience from '@/components/party/party-experience';
import { getPartyPopup } from '@/lib/db/actions/settings-actions';
import { DEFAULT_PARTY_SHARE_IMAGE, PARTY_END, PARTY_PATH, PARTY_START } from '@/lib/config/party-popup';
import { absoluteUrl, pageMetadata } from '@/lib/seo';
import JsonLd from '@/components/seo/json-ld';
import { eventSchema } from '@/lib/structured-data';

export const revalidate = 60;

const DESCRIPTION =
    'The Grand Masquerade at Olivia Alleppey: live DJ, spirits, gala dinner, kids\' area and nanny passes, stay included. New Year\'s Eve, 31 December, 8 pm.';

export async function generateMetadata(): Promise<Metadata> {
    const content = await getPartyPopup();
    return pageMetadata({
        // Kept near 60 characters with the brand suffix so Google shows it whole.
        title: '31st Night New Year\'s Eve Party in Alappuzha',
        description: DESCRIPTION,
        path: PARTY_PATH,
        // The party photo shares far better on WhatsApp than the generic card.
        image: content.pageImage || DEFAULT_PARTY_SHARE_IMAGE,
    });
}

const bookHref = '/book/search?checkIn=2026-12-31&checkOut=2027-01-01&adults=2';

export default async function ThirtyFirstNightPage() {
    const content = await getPartyPopup();
    const over = Date.now() >= new Date(PARTY_END).getTime();
    const image = content.pageImage || DEFAULT_PARTY_SHARE_IMAGE;

    return (
        <>
            {!over && (
                <JsonLd
                    data={eventSchema({
                        name: `${content.titleMain} ${content.titleAccent}: ${content.theme}`,
                        description: DESCRIPTION,
                        path: PARTY_PATH,
                        startDate: PARTY_START,
                        endDate: PARTY_END,
                        image: image.startsWith('/') ? absoluteUrl(image) : image,
                        price: content.pricePerCouple,
                        priceNote: content.priceLabel,
                    })}
                />
            )}
            <PartyExperience content={content} over={over} bookHref={bookHref} />
        </>
    );
}
