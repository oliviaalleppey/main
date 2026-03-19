import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, CalendarDays, Clock3, Dumbbell, HeartPulse, MapPin, Sparkles, Sunrise, Users, UtensilsCrossed, Waves } from 'lucide-react';
import { ExperiencesHero } from '@/components/experiences/experiences-hero';
import StickyBookButton from '@/components/sticky-book-button';
import WhatsAppWidget from '@/components/whatsapp-widget';

export const metadata: Metadata = {
    title: 'Experiences | Olivia Alleppey',
    description:
        'Curated backwater, wellness, culinary, and cultural experiences designed around your stay at Olivia Alleppey.',
};

type Experience = {
    ids: string[];
    eyebrow: string;
    title: string;
    description: string;
    image: string;
    imageAlt: string;
    icon: LucideIcon;
    location: string;
    timing: string;
    reservation: string;
    highlights: string[];
};

type QuickLink = {
    label: string;
    href: string;
    blurb: string;
    icon: LucideIcon;
};

type HotelFacility = {
    id: string;
    title: string;
    description: string;
    detail: string;
    icon: LucideIcon;
};

type PlanningStep = {
    title: string;
    description: string;
    icon: LucideIcon;
};

const heroBeats = ['Private cruises', 'Ayurvedic wellness', 'Village walks', 'Dining-led evenings'];

const quickLinks: QuickLink[] = [
    {
        label: 'Backwater Cruise',
        href: '#backwater',
        blurb: 'Slow canals, golden-hour sailings, and overnight houseboat options.',
        icon: Waves,
    },
    {
        label: 'Ayurveda & Spa',
        href: '#ayurveda',
        blurb: 'Restorative therapies designed to soften the pace of travel.',
        icon: HeartPulse,
    },
    {
        label: 'Sunrise Yoga',
        href: '#yoga',
        blurb: 'Gentle sessions to begin the day with stillness and breath.',
        icon: Sunrise,
    },
    {
        label: 'Village Walks',
        href: '#village',
        blurb: 'A quieter, more local view of Alleppey beyond the usual stops.',
        icon: Users,
    },
    {
        label: 'Kerala Cooking',
        href: '#cooking',
        blurb: 'Spice-led culinary moments and local table traditions.',
        icon: UtensilsCrossed,
    },
    {
        label: 'Swimming Pool',
        href: '#pool',
        blurb: 'Easy leisure time between excursions and evening dining.',
        icon: Waves,
    },
    {
        label: 'Fitness Studio',
        href: '#gym',
        blurb: 'Keep your movement routine steady during the stay.',
        icon: Dumbbell,
    },
];

const experiences: Experience[] = [
    {
        ids: ['backwater', 'houseboat'],
        eyebrow: 'Signature Water Journey',
        title: 'Backwater Cruises & Houseboat Evenings',
        description:
            'Set out from Olivia for slow-moving cruises through Alleppey’s canals and lake stretches. Choose a short golden-hour sail, a lunch route, or an overnight houseboat stay when you want the backwaters to become the stay itself.',
        image: '',
        imageAlt: 'Backwater cruising experience near Olivia Alleppey',
        icon: Waves,
        location: 'Punnamada and nearby backwater routes',
        timing: 'Best at sunrise, late afternoon, and sunset',
        reservation: 'Recommended 24 hours in advance',
        highlights: [
            'Private or shared cruise planning',
            'Village canal passages and open-water views',
            'Lunch, tea, or dinner pacing based on route length',
            'Houseboat night extensions for a slower experience',
        ],
    },
    {
        ids: ['ayurveda', 'spa'],
        eyebrow: 'Wellness Ritual',
        title: 'Ayurveda, Spa & Deep Rest',
        description:
            'Balance the energy of travel with therapies inspired by Ayurvedic traditions. Treatments are best approached as a calm sequence: consultation, oil-based therapy, unhurried recovery time, and a gentle return to the rest of the day.',
        image: '',
        imageAlt: 'Ayurvedic wellness treatment at Olivia Alleppey',
        icon: HeartPulse,
        location: 'Wellness spaces arranged through the hotel',
        timing: 'Late morning and early evening feel most restorative',
        reservation: 'Ideal to book on arrival or one day ahead',
        highlights: [
            'Personalized treatment recommendations',
            'Massage and therapy pacing based on your stay',
            'Calm recovery windows after each session',
            'Easy pairing with quiet dining and room downtime',
        ],
    },
    {
        ids: ['yoga'],
        eyebrow: 'Daily Ritual',
        title: 'Sunrise Yoga & Breathwork',
        description:
            'Start softly. These sessions focus on gentle movement, longer breaths, and a clearer transition into the day. It is a strong choice for guests who want to travel with more space and less rush.',
        image: '',
        imageAlt: 'Calm morning atmosphere suitable for yoga at Olivia Alleppey',
        icon: Sunrise,
        location: 'Quiet hotel spaces selected by the team',
        timing: 'Early morning sessions before breakfast',
        reservation: 'Same-day requests may be possible',
        highlights: [
            'Gentle guided movement for all experience levels',
            'Breath-led reset after travel or long drives',
            'Optional meditation finish for a slower morning',
            'Works well before a cruise or spa appointment',
        ],
    },
    {
        ids: ['village'],
        eyebrow: 'Local Discovery',
        title: 'Village Walks & Cultural Moments',
        description:
            'Step beyond the hotel and into the everyday rhythm of Alappuzha. These outings lean toward local lanes, waterside homes, market energy, and small encounters that feel rooted rather than performative.',
        image: '',
        imageAlt: 'Local heritage-inspired experience in Alleppey',
        icon: Users,
        location: 'Neighborhood routes around Alappuzha',
        timing: 'Morning and late-afternoon walks are most comfortable',
        reservation: 'Best reserved a day before departure',
        highlights: [
            'Flexible walking routes shaped around interest and pace',
            'Market, temple-street, and waterside storytelling moments',
            'A good option for families and curious first-time visitors',
            'Can be paired with tea stops or light shopping time',
        ],
    },
    {
        ids: ['cooking'],
        eyebrow: 'Taste Kerala',
        title: 'Kerala Cooking & Culinary Discovery',
        description:
            'Learn the flavor logic behind Kerala cuisine through spice-led cooking, ingredient stories, and plated meals that feel both generous and grounded. This experience suits guests who enjoy culture through the table.',
        image: '',
        imageAlt: 'Kerala culinary journey experience at Olivia Alleppey',
        icon: UtensilsCrossed,
        location: 'Hotel dining spaces and curated culinary settings',
        timing: 'Late morning and early evening sessions',
        reservation: 'Reserve 24 hours ahead for the best setup',
        highlights: [
            'Spice-forward cooking moments with local cues',
            'Menu pacing that can stay light or become celebratory',
            'Pairs naturally with family travel and longer stays',
            'Ideal for guests who want a tactile cultural memory',
        ],
    },
];

const hotelFacilities: HotelFacility[] = [
    {
        id: 'pool',
        title: 'Swimming Pool',
        description:
            'Use the pool as a quiet pause between a cruise, a massage, or dinner. It works best as unstructured leisure time built around the rest of your itinerary.',
        detail: 'Best enjoyed before breakfast or just ahead of sunset.',
        icon: Waves,
    },
    {
        id: 'gym',
        title: 'Fitness Studio',
        description:
            'For guests who want to keep a routine, the gym offers a practical reset before the day opens up. We recommend shorter sessions that leave room for the destination itself.',
        detail: 'Works well on arrival day, between excursions, or before checkout.',
        icon: Dumbbell,
    },
];

const planningSteps: PlanningStep[] = [
    {
        title: 'Share your pace before arrival',
        description:
            'Tell us whether the trip should feel restorative, cultural, family-focused, or quietly indulgent. We can begin shaping the sequence before you check in.',
        icon: CalendarDays,
    },
    {
        title: 'We coordinate timing around the stay',
        description:
            'The concierge can help balance departures, recovery time, meals, and evening plans so the itinerary feels smooth instead of overfilled.',
        icon: MapPin,
    },
    {
        title: 'Layer in special touches when needed',
        description:
            'Celebrations, photographers, private dining, or last-minute adjustments can be added without making the stay feel overproduced.',
        icon: Sparkles,
    },
];

export default function ExperiencesPage() {
    return (
        <main className="min-h-screen bg-[#FBF8F2] text-[#2C2A27] selection:bg-[#C5A059] selection:text-white">
            <StickyBookButton />
            <WhatsAppWidget />

            {/* Hero Section */}
            <ExperiencesHero />

            {/* Experience index */}
            <section className="max-w-7xl mx-auto px-4 md:px-6 pb-10 md:pb-14">
                <div className="mt-8 md:mt-10 rounded-[24px] border border-[#E2D7C7] bg-white p-4 md:p-6">
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
                            <div>
                                <p className="text-[#9C7A45] text-[10px] tracking-[0.3em] uppercase">Experience index</p>
                                <h2 className="mt-2 font-serif text-3xl md:text-4xl text-[#2E2A24]">Choose what you want to feel</h2>
                            </div>
                            <p className="text-sm text-[#6E6456] max-w-2xl">
                                Every section below is anchor-linked so guests can jump directly to water journeys, wellness,
                                culinary moments, or on-property leisure.
                            </p>
                        </div>

                        <div className="mt-5 grid md:grid-cols-2 xl:grid-cols-4 gap-3">
                            {quickLinks.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <a
                                        key={item.label}
                                        href={item.href}
                                        className="group rounded-2xl border border-[#E6DDCF] bg-[#FFFCF7] px-4 py-4 hover:border-[#D4BB91] hover:bg-white transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D8C0A0] bg-white text-[#B68845]">
                                                <Icon className="w-4 h-4" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="font-serif font-semibold text-xl leading-none text-[#2E2A24] group-hover:text-[#8C6832] transition-colors">
                                                    {item.label}
                                                </p>
                                                <p className="mt-2 text-sm leading-relaxed text-[#6F685D]">{item.blurb}</p>
                                            </div>
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                </div>
            </section>

            {/* Collection */}
            <section id="experience-collection" className="mt-10 md:mt-14 scroll-mt-[calc(var(--site-header-height,88px)+24px)]">
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="max-w-3xl">
                        <p className="text-[#9C7A45] text-[10px] tracking-[0.3em] uppercase">Signature collection</p>
                        <h2 className="mt-2 font-serif text-[2.3rem] md:text-[4rem] leading-[0.95] text-[#2E2A24]">
                            Curated experiences with a quieter sense of luxury.
                        </h2>
                        <p className="mt-3 text-[#5A5348] text-base md:text-lg leading-relaxed">
                            The focus is not to fill every hour, but to compose the right sequence for your stay:
                            enough discovery to feel immersed, enough stillness to feel restored.
                        </p>
                    </div>

                    <div className="mt-6 md:mt-8 space-y-8 md:space-y-10">
                        {experiences.map((experience, index) => {
                            const Icon = experience.icon;
                            const isReversed = index % 2 === 1;
                            return (
                                <div key={experience.title}>
                                    <AnchorTargets ids={experience.ids} />
                                    <article className="overflow-hidden rounded-[30px] border border-[#E1D7C8] bg-white shadow-[0_22px_70px_-55px_rgba(27,33,31,0.22)]">
                                        <div className={`grid lg:grid-cols-2 ${isReversed ? 'lg:[&>div:first-child]:order-2' : ''}`}>
                                            <div className={`relative min-h-[320px] md:min-h-[440px] ${experience.image ? '' : 'bg-[#E8E2D9]'}`}>
                                                {experience.image ? (
                                                    <>
                                                        <Image src={experience.image} alt={experience.imageAlt} fill className="object-cover" />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-white/75 via-transparent to-transparent" />
                                                    </>
                                                ) : null}
                                                <div className="absolute left-5 top-5 rounded-full border border-[#E6DDCE] bg-white/90 px-3 py-1.5 text-[10px] tracking-[0.24em] uppercase text-[#7C6338]">
                                                    {experience.eyebrow}
                                                </div>
                                            </div>

                                            <div className="p-6 md:p-8 lg:p-10">
                                                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#D8C0A0] bg-[#FFF8ED] text-[#B68845]">
                                                    <Icon className="w-5 h-5" />
                                                </span>
                                                <p className="mt-5 text-[#9C7A45] text-[10px] tracking-[0.28em] uppercase">{experience.eyebrow}</p>
                                                <h3 className="mt-3 font-serif text-[2rem] md:text-[3rem] leading-[0.96] text-[#2E2A24]">
                                                    {experience.title}
                                                </h3>
                                                <p className="mt-4 text-[#544E44] text-base md:text-lg leading-relaxed">
                                                    {experience.description}
                                                </p>

                                                <div className="mt-6 grid sm:grid-cols-3 gap-3">
                                                    <ExperienceFact icon={MapPin} label="Location" value={experience.location} />
                                                    <ExperienceFact icon={Clock3} label="Timing" value={experience.timing} />
                                                    <ExperienceFact icon={CalendarDays} label="Booking" value={experience.reservation} />
                                                </div>

                                                <div className="mt-6 grid sm:grid-cols-2 gap-2.5">
                                                    {experience.highlights.map((item) => (
                                                        <div
                                                            key={item}
                                                            className="rounded-xl border border-[#EEE5D7] bg-[#FBF8F2] px-3.5 py-3 text-sm text-[#4E473C] leading-relaxed"
                                                        >
                                                            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#B68845]" />
                                                            {item}
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                                                    <Link
                                                        href="/contact"
                                                        className="inline-flex items-center justify-center rounded-xl bg-[#0A332B] px-6 py-3 text-white text-[11px] tracking-[0.16em] uppercase hover:bg-[#15443B] transition-colors"
                                                    >
                                                        Plan This Experience
                                                    </Link>
                                                    <Link
                                                        href="/book/search"
                                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D9C6A7] bg-[#FFFCF7] px-6 py-3 text-[#7F6438] text-[11px] tracking-[0.16em] uppercase hover:bg-[#FAF4E8] transition-colors"
                                                    >
                                                        Check Stay Availability
                                                        <ArrowRight className="w-4 h-4" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                </div>
                            );
                        })}
                    </div>

                    {/* Leisure + concierge */}
                    <section className="mt-10 md:mt-14 grid lg:grid-cols-[0.94fr_1.06fr] gap-4 md:gap-6 items-stretch">
                        <div className="overflow-hidden rounded-[28px] border border-[#E2D7C7] bg-white p-6 md:p-8 lg:p-10">
                            <p className="text-[#9C7A45] text-[10px] tracking-[0.3em] uppercase">On-property leisure</p>
                            <h2 className="mt-2 font-serif text-[2.2rem] md:text-[3.4rem] leading-[0.96] text-[#2E2A24]">
                                Restore your rhythm without leaving the hotel.
                            </h2>
                            <p className="mt-4 text-[#554D42] text-base md:text-lg leading-relaxed max-w-2xl">
                                Not every memorable part of the stay needs a car ride or a schedule. Pool time, fitness,
                                and slower in-between hours help the more immersive experiences breathe.
                            </p>

                            <div className="mt-6 space-y-3">
                                {hotelFacilities.map((facility) => {
                                    const Icon = facility.icon;
                                    return (
                                        <div key={facility.id}>
                                            <AnchorTargets ids={[facility.id]} />
                                            <div className="rounded-[22px] border border-[#EEE5D7] bg-[#FBF8F2] px-4 md:px-5 py-4 md:py-5">
                                                <div className="flex items-start gap-3">
                                                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#D8C0A0] bg-white text-[#B68845]">
                                                        <Icon className="w-5 h-5" />
                                                    </span>
                                                    <div>
                                                        <h3 className="font-serif text-2xl leading-none text-[#2E2A24]">{facility.title}</h3>
                                                        <p className="mt-2 text-[#5D554A] leading-relaxed">{facility.description}</p>
                                                        <p className="mt-3 text-xs tracking-[0.18em] uppercase text-[#8B7247]">
                                                            {facility.detail}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-[28px] border border-[#E2D7C7] bg-[#FFFCF7] p-6 md:p-8 lg:p-10">
                            <p className="text-[#9C7A45] text-[10px] tracking-[0.3em] uppercase">Concierge planning</p>
                            <h2 className="mt-2 font-serif text-[2.2rem] md:text-[3.4rem] leading-[0.96] text-[#2E2A24]">
                                We shape the itinerary so it feels effortless, not overplanned.
                            </h2>
                            <p className="mt-4 text-[#554D42] text-base md:text-lg leading-relaxed">
                                The strongest itineraries leave room for appetite, weather, mood, and rest. Our team can
                                help sequence the right experience at the right point in the stay.
                            </p>

                            <div className="mt-6 space-y-4">
                                {planningSteps.map((step) => {
                                    const Icon = step.icon;
                                    return (
                                        <div
                                            key={step.title}
                                            className="rounded-[22px] border border-[#E8DFD1] bg-white px-4 md:px-5 py-4 md:py-5"
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#D8C0A0] bg-[#FFF8ED] text-[#B68845]">
                                                    <Icon className="w-5 h-5" />
                                                </span>
                                                <div>
                                                    <h3 className="font-serif text-2xl leading-none text-[#2E2A24]">{step.title}</h3>
                                                    <p className="mt-2 text-[#5D554A] leading-relaxed">{step.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-8 flex flex-col sm:flex-row gap-3">
                                <Link
                                    href="/contact"
                                    className="inline-flex items-center justify-center rounded-xl bg-[#B68845] px-7 py-3 text-white text-[11px] tracking-[0.16em] uppercase hover:bg-[#A87D3F] transition-colors"
                                >
                                    Contact Concierge
                                </Link>
                                <Link
                                    href="/book/search"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D5C09F] bg-white px-7 py-3 text-[#7C6338] text-[11px] tracking-[0.16em] uppercase hover:bg-[#FAF4E8] transition-colors"
                                >
                                    Reserve Your Stay
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* Final CTA */}
                    <section className="mt-10 md:mt-14 overflow-hidden rounded-[30px] border border-[#DDCFBB] bg-white">
                        <div className="grid lg:grid-cols-[1.02fr_0.98fr]">
                            <div className="min-h-[280px] md:min-h-[360px] bg-[#E8E2D9]" />

                            <div className="bg-[#FFFCF7] p-6 md:p-8 lg:p-10">
                                <p className="text-[#9C7A45] text-[10px] tracking-[0.3em] uppercase">Tailored itinerary</p>
                                <h2 className="mt-2 font-serif text-[2.1rem] md:text-[3.2rem] leading-[0.98] text-[#2E2A24]">
                                    Tell us how you want the trip to feel, and we will shape the rest.
                                </h2>
                                <p className="mt-4 text-[#564F43] text-base md:text-lg leading-relaxed">
                                    Some guests want water, stillness, and spa time. Others want local discovery, food,
                                    and movement. The best version is the one that matches your pace, not someone else’s
                                    checklist.
                                </p>

                                <div className="mt-6 grid sm:grid-cols-2 gap-3">
                                    <div className="rounded-2xl border border-[#E3D6C2] bg-white px-4 py-4">
                                        <p className="text-[10px] tracking-[0.2em] uppercase text-[#8B7247]">Ideal for</p>
                                        <p className="mt-2 text-[#453E34] leading-relaxed">
                                            Anniversaries, slow weekends, family breaks, and longer Kerala stays.
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-[#E3D6C2] bg-white px-4 py-4">
                                        <p className="text-[10px] tracking-[0.2em] uppercase text-[#8B7247]">Best time to plan</p>
                                        <p className="mt-2 text-[#453E34] leading-relaxed">
                                            Reach out before arrival or at check-in for the most relaxed sequencing.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                                    <Link
                                        href="/contact"
                                        className="inline-flex items-center justify-center rounded-xl bg-[#0A332B] px-7 py-3 text-white text-[11px] tracking-[0.16em] uppercase hover:bg-[#15443B] transition-colors"
                                    >
                                        Start Planning
                                    </Link>
                                    <Link
                                        href="/book/search"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D5C09F] bg-white px-7 py-3 text-[#7C6338] text-[11px] tracking-[0.16em] uppercase hover:bg-[#FAF4E8] transition-colors"
                                    >
                                        Book Olivia
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </section>
        </main>
    );
}

function AnchorTargets({ ids }: { ids: string[] }) {
    return (
        <>
            {ids.map((id) => (
                <div key={id} id={id} className="scroll-mt-[calc(var(--site-header-height,88px)+24px)]" aria-hidden />
            ))}
        </>
    );
}

function ExperienceFact({
    icon: Icon,
    label,
    value,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl border border-[#ECE3D6] bg-[#FBF8F2] px-4 py-4">
            <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[#8C7249]">
                <Icon className="w-3.5 h-3.5" />
                {label}
            </span>
            <p className="mt-2 text-sm leading-relaxed text-[#4D463C]">{value}</p>
        </div>
    );
}
