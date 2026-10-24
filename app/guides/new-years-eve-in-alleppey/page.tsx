import Image from 'next/image';
import Link from 'next/link';
import { pageMetadata, absoluteUrl, BRAND } from '@/lib/seo';
import { getGuide } from '@/lib/guides';
import { PACKAGE_PRICE_PAISE, GST_RATE, ROOM_ADDONS, EXTRAS, formatINR } from '@/lib/masquerade-offer';
import JsonLd from '@/components/seo/json-ld';
import { breadcrumbSchema, faqSchema, HOTEL_ID } from '@/lib/structured-data';

const guide = getGuide('new-years-eve-in-alleppey')!;

export const metadata = pageMetadata({
    title: guide.title,
    description: guide.description,
    path: '/guides/new-years-eve-in-alleppey',
    image: absoluteUrl('/images/masquerade/ballroom.webp'),
});

const glance = [
    ['Date', '31 December'],
    ['Place', 'Olivia Alleppey, Alappuzha, Kerala'],
    ['Theme', 'The Grand Masquerade: masks, gold and candlelight'],
    ['Room package', `From ${formatINR(PACKAGE_PRICE_PAISE)} + ${GST_RATE}% GST per room`],
    ['Booking', 'Online, on oliviaalleppey.com'],
];

const rooms = [
    ['Lake View Twin', '/rooms/lake-view-twin'],
    ['Canal View King', '/rooms/canal-view-king'],
    ['Lake View Balcony', '/rooms/lake-view-balcony'],
    ['Canal View Superior Family', '/rooms/canal-view-superior-family'],
    ['Boat Race Suite', '/rooms/boat-race-suite'],
    ['Lake View Balcony Suite', '/rooms/lake-view-balcony-suite'],
];

const days = [
    ['29 and 30 December', 'Arrive, settle in and take a backwater cruise through the village canals. Book a spa treatment for the afternoon.'],
    ['31 December', 'A slow morning, a late lunch and an afternoon by the pool. Dress for the evening and join the Grand Masquerade at night.'],
    ['1 January', 'Breakfast without hurry, then Alappuzha Beach or a drive through the paddy fields of Kuttanad before you check out.'],
];

const h2 = 'text-2xl md:text-4xl font-serif text-[var(--text-dark)] mb-5 tracking-wide';
const p = 'text-lg text-[#403A35] leading-relaxed';

export default function NewYearsEvePage() {
    const price = formatINR(PACKAGE_PRICE_PAISE);

    return (
        <main className="min-h-screen bg-[var(--surface-cream)] font-sans">
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

            {/* Hero picture */}
            <section className="relative w-full aspect-[4/5] md:aspect-[21/9] max-h-[80vh] overflow-hidden bg-[#0a0608]">
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
                    alt="The Grand Masquerade, New Year's Eve at Olivia Alleppey: a candlelit ballroom and a gold feathered mask on red velvet."
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover hidden md:block"
                />
            </section>

            <article className="px-6 md:px-12 py-16 md:py-24">
                <div className="max-w-3xl mx-auto">
                    <nav className="text-xs tracking-[0.2em] uppercase text-[#6B645C] mb-6">
                        <Link href="/guides" className="hover:text-[var(--text-dark)]">Guides</Link>
                    </nav>
                    <h1 className="text-4xl md:text-6xl font-serif text-[var(--text-dark)] tracking-wide leading-tight mb-8">
                        New Year&rsquo;s Eve in Alleppey
                    </h1>
                    <p className="text-xl text-[#403A35] leading-relaxed mb-10">{guide.intro}</p>
                    <Link href="/" className="inline-block bg-[var(--btn-dark)] text-white px-8 py-3 text-[11px] tracking-[0.22em] uppercase">
                        Book the 31st Night
                    </Link>

                    {/* At a glance */}
                    <dl className="my-14 bg-white border border-[#DED6CB] divide-y divide-[#DED6CB]">
                        {glance.map(([k, v]) => (
                            <div key={k} className="grid grid-cols-3 gap-4 px-6 py-4">
                                <dt className="text-[11px] uppercase tracking-[0.25em] text-[#6B645C]">{k}</dt>
                                <dd className="col-span-2 text-[#2D3933]">{v}</dd>
                            </div>
                        ))}
                    </dl>

                    <h2 className={h2}>Why spend New Year&rsquo;s Eve in Alleppey</h2>
                    <div className={`${p} space-y-4 mb-12`}>
                        <p>Late December is the best time of year on the Kerala backwaters. The monsoon has gone, the days are dry and warm, the evenings are cool, and the lagoons and canals are calm enough for long boat rides.</p>
                        <p>It is also Alleppey&rsquo;s busiest season. If you want a New Year&rsquo;s Eve that combines a proper celebration with a rest by the water, booking early matters, because rooms across Alappuzha fill in the last week of the year.</p>
                    </div>

                    <h2 className={h2}>The Grand Masquerade, 31 December</h2>
                    <div className={`${p} space-y-4 mb-12`}>
                        <p>The Grand Masquerade is Olivia Alleppey&rsquo;s New Year&rsquo;s Eve gala, built around masks, gold and candlelight. It is a themed evening, so guests are invited to arrive masked and dressed for the night, and to leave the ordinary New Year party behind.</p>
                        <p>Staying guests book a room package that includes the gala. Visiting guests who are not staying can book an evening pass for a couple or a single guest. Programme details are shared with guests when they book.</p>
                    </div>

                    <h2 className={h2}>What to wear: a masquerade dress guide</h2>
                    <div className={`${p} space-y-4 mb-12`}>
                        <p>Think evening wear with a mask. For women, a gown, saree or cocktail dress works well, with a mask in gold, black or deep red. For men, a dark suit, tuxedo or bandhgala with a simple half mask suits the theme.</p>
                        <p>Masks are easiest to buy before you travel. Keep it comfortable enough to wear through dinner, and carry a light wrap, since evenings by the water can be cool.</p>
                    </div>

                    <h2 className={h2}>Stay the night</h2>
                    <div className={`${p} space-y-4 mb-6`}>
                        <p>The room package covers one room for the night of 31 December, with the room price included. It starts at {price} plus {GST_RATE}% GST per room.</p>
                        <p>Add-ons for your room:</p>
                    </div>
                    <ul className="mb-6 space-y-2 text-[#403A35]">
                        {ROOM_ADDONS.map((item) => (
                            <li key={item.id}><strong>{item.name}</strong>, {formatINR(item.pricePaise)}: {item.note}</li>
                        ))}
                    </ul>
                    <p className={`${p} mb-12`}>Prices exclude {GST_RATE}% GST. Rooms are limited, so check availability on the booking form.</p>

                    <h2 className={h2}>Visiting for the evening only</h2>
                    <p className={`${p} mb-6`}>You do not need a room to attend. Gala passes for visiting guests:</p>
                    <ul className="mb-12 space-y-2 text-[#403A35]">
                        {EXTRAS.map((item) => (
                            <li key={item.id}><strong>{item.name}</strong>, {formatINR(item.pricePaise)}: {item.note}</li>
                        ))}
                    </ul>

                    <h2 className={h2}>Choose your room</h2>
                    <p className={`${p} mb-6`}>Rooms are sold on a first-come basis. Browse them before you book:</p>
                    <ul className="mb-12 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {rooms.map(([name, href]) => (
                            <li key={href}><Link href={href} className="underline text-[#403A35] hover:text-[var(--text-dark)]">{name}</Link></li>
                        ))}
                    </ul>

                    <h2 className={h2}>Make a long weekend of it</h2>
                    <div className="mb-12 space-y-5">
                        {days.map(([day, text]) => (
                            <div key={day}>
                                <h3 className="font-serif text-xl text-[var(--text-dark)] mb-1">{day}</h3>
                                <p className="text-[#403A35] leading-relaxed">{text}</p>
                            </div>
                        ))}
                        <p className="text-[#403A35] leading-relaxed">
                            More ideas in our guide to <Link href="/guides/things-to-do-in-alleppey" className="underline">things to do in Alleppey</Link>, and our spa and <Link href="/wellness" className="underline">wellness</Link> and <Link href="/dining" className="underline">dining</Link> pages.
                        </p>
                    </div>

                    <h2 className={h2}>Getting here</h2>
                    <p className={`${p} mb-12`}>Cochin International Airport is roughly 80 to 90 km away, about two to two and a half hours by car. Alappuzha also has a railway station. Read our <Link href="/guides/kochi-airport-to-alleppey" className="underline">Kochi airport to Alleppey guide</Link>. Allow extra time for the roads on the 31st.</p>

                    <h2 className={h2}>Planning tips</h2>
                    <ul className="mb-12 space-y-2 text-[#403A35] list-disc pl-6 text-lg">
                        <li>Book early. New Year week is peak season in Kerala.</li>
                        <li>Arrive on the 30th if you can, to avoid road delays.</li>
                        <li>Bring or buy your mask before you travel.</li>
                        <li>Add a night either side of the 31st to enjoy the backwaters.</li>
                        <li>Check the booking form for what is still available for your group.</li>
                    </ul>

                    <section className="mt-14 mb-12">
                        <h2 className={h2}>Frequently asked questions</h2>
                        <dl className="space-y-6">
                            {guide.faqs.map((faq) => (
                                <div key={faq.question}>
                                    <dt className="font-serif text-xl text-[var(--text-dark)] mb-2">{faq.question}</dt>
                                    <dd className="text-[#403A35] leading-relaxed">{faq.answer}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>

                    <div className="bg-white border border-[#DED6CB] p-8 text-center mb-14">
                        <p className="font-serif text-2xl text-[var(--text-dark)] mb-4">Spend the 31st at Olivia Alleppey</p>
                        <Link href="/" className="inline-block bg-[var(--btn-dark)] text-white px-8 py-3 text-[11px] tracking-[0.22em] uppercase">
                            Book the 31st Night
                        </Link>
                    </div>

                    <h2 className="text-xl font-serif text-[var(--text-dark)] mb-4">More guides</h2>
                    <ul className="space-y-2">
                        <li><Link href="/guides/best-time-to-visit-alleppey" className="underline text-[#403A35]">Best time to visit Alleppey</Link></li>
                        <li><Link href="/guides/alleppey-honeymoon-guide" className="underline text-[#403A35]">A honeymoon in Alleppey</Link></li>
                        <li><Link href="/guides/alleppey-family-stay" className="underline text-[#403A35]">Alleppey with family and kids</Link></li>
                        <li><Link href="/guides/alleppey-houseboat-vs-resort" className="underline text-[#403A35]">Houseboat vs backwater resort</Link></li>
                    </ul>
                </div>
            </article>
        </main>
    );
}
