import type { Metadata } from 'next';
import PartyExperience from '@/components/party/party-experience';
import ClassicExperience from '@/components/party/classic-experience';
import { getPartyPopup } from '@/lib/db/actions/settings-actions';
import {
    PARTY_BOOK_HREF,
    PARTY_END,
    PARTY_PATH,
    PARTY_START,
    partyShareImage,
    type PartyPopupSettings,
} from '@/lib/config/party-popup';
import { absoluteUrl, pageMetadata } from '@/lib/seo';
import JsonLd from '@/components/seo/json-ld';
import { eventSchema } from '@/lib/structured-data';

export const revalidate = 60;

const description = (content: PartyPopupSettings) =>
    `${content.theme} at Olivia Alleppey: live DJ, spirits, gala dinner, kids' area and nanny passes, stay included. New Year's Eve, 31 December, 8 pm.`;

export async function generateMetadata(): Promise<Metadata> {
    const content = await getPartyPopup();
    return pageMetadata({
        // Kept near 60 characters with the brand suffix so Google shows it whole.
        title: '31st Night New Year\'s Eve Party in Alappuzha',
        description: description(content),
        path: PARTY_PATH,
        // The party picture shares far better on WhatsApp than the generic card.
        image: partyShareImage(content),
    });
}

export default async function ThirtyFirstNightPage() {
    const content = await getPartyPopup();
    const over = Date.now() >= new Date(PARTY_END).getTime();
    const image = partyShareImage(content);

    return (
        <>
            {!over && (
                <JsonLd
                    data={eventSchema({
                        name: `${content.titleMain} ${content.titleAccent}: ${content.theme}`,
                        description: description(content),
                        path: PARTY_PATH,
                        startDate: PARTY_START,
                        endDate: PARTY_END,
                        image: image.startsWith('/') ? absoluteUrl(image) : image,
                        price: content.pricePerCouple,
                        priceNote: content.priceLabel,
                    })}
                />
            )}
            {/* The Dark Night theme is the 12 October design, kept as its own page. */}
            {content.pageTheme === 'noir' ? (
                <ClassicExperience content={content} over={over} bookHref={PARTY_BOOK_HREF} />
            ) : (
                <PartyExperience content={content} over={over} bookHref={PARTY_BOOK_HREF} />
            )}
        </>
    );
}
