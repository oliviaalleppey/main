import Image from 'next/image';
import Link from 'next/link';
import { pageMetadata, absoluteUrl, BRAND } from '@/lib/seo';
import { getGuide } from '@/lib/guides';
import { PACKAGE_PRICE_PAISE, GST_RATE, formatINR } from '@/lib/masquerade-offer';
import JsonLd from '@/components/seo/json-ld';
import { breadcrumbSchema, faqSchema, HOTEL_ID } from '@/lib/structured-data';

const guide = getGuide('new-years-eve-in-alleppey')!;

export const metadata = pageMetadata({
    title: guide.title,
    description: guide.description,
    path: '/guides/new-years-eve-in-alleppey',
    image: absoluteUrl('/images/masquerade/ballroom.webp'),
});

const serif = { fontFamily: 'var(--font-cinzel), serif' };

const MOMENTS = [
    { title: 'The Masked Gala', text: 'Arrive masked and dressed for the evening. A candlelit ballroom, gold and velvet, built for one night.' },
    { title: 'Dinner & Spirits', text: 'A gala evening of fine dining and spirits as the year turns.' },
    { title: 'Midnight', text: 'Welcome the new year with the backwaters of Alleppey in the dark beyond the glass.' },
];

export default function NewYearsEvePage() {
    const price = formatINR(PACKAGE_PRICE_PAISE);

    return (
        <main className="min-h-screen bg-[#0a0608] text-[#efe6d3] font-sans">
            <JsonLd
                data={[
                    {
                        '@context': 'https://schema.org',
                        '@type': 'Article',
                        headline: guide.h1,
                        description: guide.description,
                        mainEntityOfPage: absoluteUrl('/guides/new-years-eve-in-alleppey'),
                        dateModified: guide.updated,
                        datePublished: guide.updated,
                        author: { '@type': 'Organization', name: BRAND },
                        publisher: { '@id': HOTEL_ID },
                    },
                    faqSchema(guide.faqs),
                    breadcrumbSchema([
                        { name: 'Guides', path: '/guides' },
                        { name: guide.h1, path: '/guides/new-years-eve-in-alleppey' },
                    ]),
                ]}
            />

            {/* Hero: the artwork already carries the title, so the heading sits below it */}
            <section className="relative isolate overflow-hidden">
                <div className="relative w-full aspect-[4/5] md:aspect-[16/9] max-h-[88vh]">
                    <Image
                        src="/images/masquerade/mobile-poster.webp"
                        alt="The Grand Masquerade, New Year's Eve in Alleppey: a gold diamond-set title, a feathered mask and candlelit velvet."
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover md:hidden"
                    />
                    <Image
                        src="/images/masquerade/ballroom.webp"
                        alt="The Grand Masquerade, New Year's Eve in Alleppey: a candlelit ballroom and a gold feathered mask on red velvet."
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover hidden md:block"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0a0608] to-transparent" />
                </div>
                <div className="px-6 pb-20 pt-4 md:pt-0 -mt-10 relative text-center max-w-4xl mx-auto">
                    <p className="text-[11px] md:text-xs uppercase tracking-[0.5em] text-[#d9b668] mb-6" style={serif}>
                        Olivia Alleppey &middot; 31 December
                    </p>
                    <h1 className="masq-gold text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight" style={serif}>
                        New Year&rsquo;s Eve in Alleppey
                    </h1>
                    <div className="mx-auto my-8 h-px w-24 bg-gradient-to-r from-transparent via-[#d9b668] to-transparent" />
                    <p className="text-lg md:text-2xl font-serif italic text-[#f3dc9c]">
                        The Grand Masquerade &middot; A night of masks, gold and candlelight
                    </p>
                    <p className="mt-6 max-w-2xl mx-auto text-base md:text-lg text-[#efe6d3]/80 leading-relaxed">{guide.intro}</p>
                    <Link href="/" className="masq-btn mt-10 inline-flex items-center gap-3 px-8 h-14 text-[#1a0d06] text-[11px] uppercase tracking-[0.25em] font-semibold">
                        Book the 31st Night <span aria-hidden>&rarr;</span>
                    </Link>
                </div>
            </section>

            {/* The evening */}
            <section className="px-6 md:px-12 py-20 md:py-28">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-center masq-gold text-3xl md:text-5xl font-bold mb-4" style={serif}>The Evening</h2>
                    <div className="mx-auto mb-14 h-px w-16 bg-[#d9b668]/70" />
                    <div className="grid gap-px md:grid-cols-3 bg-[#d9b668]/25 border border-[#d9b668]/25">
                        {MOMENTS.map((m) => (
                            <div key={m.title} className="bg-[#120a0d] p-8 md:p-10 text-center">
                                <h3 className="text-sm uppercase tracking-[0.3em] text-[#d9b668] mb-4" style={serif}>{m.title}</h3>
                                <p className="text-[#efe6d3]/80 leading-relaxed">{m.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stay */}
            <section className="relative px-6 md:px-12 py-20 md:py-28 bg-[#120a0d] border-y border-[#d9b668]/20">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="masq-gold text-3xl md:text-5xl font-bold mb-4" style={serif}>Stay the Night</h2>
                    <div className="mx-auto mb-10 h-px w-16 bg-[#d9b668]/70" />
                    <p className="text-[#efe6d3]/80 text-lg leading-relaxed mb-8">
                        One room for the night of 31 December, room price included. Add-ons are available for additional guests and children, and visiting guests can book a gala pass for the evening.
                    </p>
                    <p className="font-serif text-5xl md:text-6xl text-[#f3dc9c] tabular-nums">{price}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.35em] text-[#d9b668]" style={serif}>
                        Per room &middot; plus {GST_RATE}% GST
                    </p>
                    <Link href="/" className="masq-btn mt-10 inline-flex items-center gap-3 px-8 h-14 text-[#1a0d06] text-[11px] uppercase tracking-[0.25em] font-semibold">
                        Reserve Your Room <span aria-hidden>&rarr;</span>
                    </Link>
                    <p className="mt-6 text-sm text-[#efe6d3]/60">Rooms are limited and sold online on a first-come basis.</p>
                </div>
            </section>

            {/* Plan */}
            <section className="px-6 md:px-12 py-20 md:py-28">
                <div className="max-w-3xl mx-auto space-y-6 text-[#efe6d3]/85 text-lg leading-relaxed">
                    {guide.sections.slice(2).flatMap((section) => section.paragraphs).map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                    ))}
                </div>
            </section>

            {/* FAQ */}
            <section className="px-6 md:px-12 pb-24">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-center masq-gold text-3xl md:text-4xl font-bold mb-12" style={serif}>Questions</h2>
                    <dl className="space-y-8">
                        {guide.faqs.map((faq) => (
                            <div key={faq.question} className="border-t border-[#d9b668]/25 pt-6">
                                <dt className="font-serif text-xl text-[#f3dc9c] mb-2">{faq.question}</dt>
                                <dd className="text-[#efe6d3]/80 leading-relaxed">{faq.answer}</dd>
                            </div>
                        ))}
                    </dl>
                    <p className="mt-14 text-center text-sm text-[#efe6d3]/60">
                        More to plan?{' '}
                        <Link href="/guides" className="underline hover:text-[#f3dc9c]">Alleppey travel guides</Link>
                        {' '}&middot;{' '}
                        <Link href="/rooms" className="underline hover:text-[#f3dc9c]">Rooms &amp; suites</Link>
                    </p>
                </div>
            </section>

            <style>{`
                .masq-gold {
                    background: linear-gradient(180deg, #fff6d8 0%, #f0cf7a 40%, #b8883f 100%);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    filter: drop-shadow(0 2px 14px rgba(0,0,0,.7)) drop-shadow(0 0 22px rgba(240,200,110,.3));
                }
                .masq-btn {
                    background: linear-gradient(135deg, #f3dc9c 0%, #d9b668 45%, #b68845 100%);
                    box-shadow: 0 0 26px rgba(217,182,104,0.35);
                    transition: box-shadow .3s, filter .3s;
                }
                .masq-btn:hover { filter: brightness(1.08); box-shadow: 0 0 40px rgba(217,182,104,0.65); }
            `}</style>
        </main>
    );
}
