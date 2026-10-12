import type { Metadata } from 'next';
import Link from 'next/link';
import PartyEnquiryForm from '@/components/party/party-enquiry-form';
import { getPartyPopup } from '@/lib/db/actions/settings-actions';
import { DEFAULT_PARTY_BACKGROUND, PARTY_END, formatRupees } from '@/lib/config/party-popup';
import { pageMetadata } from '@/lib/seo';

export const revalidate = 60;

export const metadata: Metadata = pageMetadata({
    title: '31st Night Celebrity Masquerade, New Year\'s Eve in Alappuzha',
    description:
        'Ring in the new year at Olivia Alleppey with a celebrity masquerade: live DJ, open bar, gala dinner and kids\' care, stay included. 31 December, 8 pm.',
    path: '/31st-night',
});

/** Short notes for the highlights we know; anything the admin adds shows as a title only. */
const DETAILS: Record<string, string> = {
    'Live DJ': 'A full night of music on the Grand Ballroom stage.',
    'Open bar': 'Premium pours all evening for guests 23 and above.',
    'Gala dinner': 'A festive spread, served through the night.',
    "Kids' care": 'Trained carers look after infants and children while you celebrate.',
    'Stay included': 'Your pass comes with a room at Olivia, so the night ends upstairs.',
};

const bookHref = '/book/search?checkIn=2026-12-31&checkOut=2027-01-01&adults=2';

export default async function ThirtyFirstNightPage() {
    const content = await getPartyPopup();
    const over = Date.now() >= new Date(PARTY_END).getTime();
    const cinzel = { fontFamily: 'var(--font-cinzel), Georgia, serif' } as const;
    const serif = { fontFamily: 'var(--font-serif), Georgia, serif' } as const;
    const background = content.backgroundImage || DEFAULT_PARTY_BACKGROUND;

    return (
        <main className="min-h-screen bg-[#12050a] text-[#f6efe0]">
            <section className="relative isolate">
                <div
                    className="absolute inset-0 -z-10 bg-no-repeat"
                    style={{
                        backgroundImage: `url("${background}")`,
                        backgroundSize: content.backgroundImage ? 'cover' : '200% auto',
                        backgroundPosition: content.backgroundImage ? 'center' : '0 40%',
                    }}
                />
                <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#12050a]/70 via-[#12050a]/55 to-[#12050a]" />
                <div className="mx-auto max-w-3xl px-5 pb-16 pt-32 text-center sm:pt-40">
                    <p className="text-[11px] uppercase tracking-[0.38em] text-[#d4b06a]" style={cinzel}>{content.presenter}</p>
                    <h1 className="mt-3 text-6xl leading-[0.95] sm:text-8xl" style={serif}>
                        {content.titleMain} <em className="text-[#f1dba0]">{content.titleAccent}</em>
                    </h1>
                    <p className="mt-3 text-2xl italic text-[#c9b89a]" style={serif}>{content.theme}</p>
                    <p className="mx-auto mt-8 max-w-xl text-[15px] leading-relaxed text-[#e8e2d9]">{content.intro}</p>
                    <dl className="mx-auto mt-8 grid max-w-xl grid-cols-3 border-y border-[#d4b06a]/40 text-center">
                        {[['DATE', content.dateValue], ['TIME', content.timeValue], ['DRESS', content.dressValue]].map(([k, v], i) => (
                            <div key={k} className={`px-2 py-4 ${i ? 'border-l border-[#d4b06a]/30' : ''}`}>
                                <dt className="text-[10.5px] tracking-[0.28em] text-[#d4b06a]" style={cinzel}>{k}</dt>
                                <dd className="mt-1 text-xl sm:text-2xl" style={serif}>{v}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </section>

            <section className="mx-auto max-w-5xl px-5 py-14">
                <div className="grid gap-px border border-[#d4b06a]/30 bg-[#d4b06a]/30 sm:grid-cols-2 lg:grid-cols-3">
                    {content.highlights.map((title) => (
                        <div key={title} className="bg-[#12050a] p-6">
                            <h2 className="text-lg uppercase tracking-[0.12em] text-[#f1dba0]" style={cinzel}>{title}</h2>
                            {DETAILS[title] && <p className="mt-2 text-sm leading-relaxed text-[#c9b89a]">{DETAILS[title]}</p>}
                        </div>
                    ))}
                </div>
            </section>

            <section id="reserve" className="mx-auto max-w-3xl scroll-mt-24 px-5 pb-14 text-center">
                <p className="text-[11px] uppercase tracking-[0.26em] text-[#c9b89a]" style={cinzel}>{content.priceLabel}</p>
                <p className="mt-1 text-6xl text-[#f1dba0]" style={serif}>{formatRupees(content.pricePerCouple)}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#c9b89a]">{content.finePrint}</p>
                {over ? (
                    <p className="mt-8 text-[#c9b89a]">This celebration has ended. See you next year.</p>
                ) : (
                    <Link
                        href={bookHref}
                        className="mt-8 inline-block border border-[#d4b06a] bg-[#d4b06a] px-10 py-4 text-[12px] uppercase tracking-[0.26em] text-[#1a0709] transition-colors hover:bg-[#f1dba0]"
                        style={cinzel}
                    >
                        {content.reserveLabel}
                    </Link>
                )}
            </section>

            {!over && (
                <section id="enquire" className="mx-auto max-w-2xl scroll-mt-24 px-5 pb-24">
                    <div className="border border-[#d4b06a]/40 p-6 sm:p-8">
                        <h2 className="text-center text-3xl" style={serif}>Prefer to talk first?</h2>
                        <p className="mb-6 mt-2 text-center text-sm text-[#c9b89a]">Leave your details and our team will call you about passes.</p>
                        <PartyEnquiryForm />
                    </div>
                </section>
            )}
        </main>
    );
}
