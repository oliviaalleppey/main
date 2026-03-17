import StickyBookButton from '@/components/sticky-book-button';
import WhatsAppWidget from '@/components/whatsapp-widget';
import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays, Flower2, Sparkles, Users, type LucideIcon } from 'lucide-react';

interface CelebrationStyle {
    title: string;
    capacity: string;
    investment: string;
    idealFor: string;
    highlights: string[];
    icon: LucideIcon;
}

interface VenueInfo {
    name: string;
    image: string;
    capacity: string;
    area: string;
    description: string;
    bestFor: string;
}

const celebrationStyles: CelebrationStyle[] = [
    {
        title: 'Intimate Wedding',
        capacity: '40 to 80 guests',
        investment: 'From INR 6.5 lakh',
        idealFor: 'Families preferring private, highly personal ceremonies',
        highlights: ['Poolside vows', 'Curated plated dinner', 'One-night couple suite stay'],
        icon: Flower2,
    },
    {
        title: 'Classic Destination Wedding',
        capacity: '120 to 220 guests',
        investment: 'From INR 15 lakh',
        idealFor: 'Multi-function celebrations with room blocks',
        highlights: ['Two event venues', 'Sangeet + wedding day flow', 'On-site wedding manager'],
        icon: Sparkles,
    },
    {
        title: 'Full Wedding Weekend',
        capacity: '250 to 400 guests',
        investment: 'From INR 28 lakh',
        idealFor: 'Large-format weddings with receptions and hospitality desks',
        highlights: ['Three day itinerary', 'Large banquet setup', 'Guest movement coordination'],
        icon: Users,
    },
];

const venueList: VenueInfo[] = [
    {
        name: 'Backwater Lawn',
        image: '/images/rooms/balcony-room-5.jpg',
        capacity: 'Up to 180',
        area: '6,000 sq ft',
        description: 'Sunset-facing ceremony lawn with soft ambient lighting and open-sky aisle setup.',
        bestFor: 'Varmala, cocktail evening, phera mandap',
    },
    {
        name: 'Olivia Grand Hall',
        image: '/images/conference/hero.png',
        capacity: 'Up to 400',
        area: '8,500 sq ft',
        description: 'An elegant indoor venue for formal receptions, stage events, and weather-safe celebrations.',
        bestFor: 'Reception, sangeet, large guest dining',
    },
    {
        name: 'Canal Terrace',
        image: '/images/dining/hero.jpg',
        capacity: 'Up to 120',
        area: '3,200 sq ft',
        description: 'A refined semi-outdoor venue with water views, ideal for welcome dinners and brunches.',
        bestFor: 'Mehendi, welcome dinner, farewell brunch',
    },
];

const planningTimeline = [
    {
        label: 'Step 01',
        title: 'Consultation & Budget Match',
        detail: 'We map your guest count, style and budget range into a venue and function plan within 48 hours.',
    },
    {
        label: 'Step 02',
        title: 'Menu, Decor & Rooming',
        detail: 'Finalise cuisine style, decor direction, room blocks and movement flow for each function.',
    },
    {
        label: 'Step 03',
        title: 'Execution Blueprint',
        detail: 'Shared timeline with vendor slots, setup windows, rehearsal timing, and function wise checklists.',
    },
    {
        label: 'Step 04',
        title: 'On-Ground Wedding Management',
        detail: 'Dedicated operations lead and hospitality desk ensure guest handling and event transitions run smoothly.',
    },
];

const includedServices = [
    'Dedicated wedding planning lead',
    'Function wise setup and dismantle coordination',
    'Chef-led menu tasting for final shortlist',
    'Guest room allocation support',
    'Vendor docking and service corridor logistics',
    'Power backup and technical readiness',
    'Valet and arrival management',
    'Rain backup options for outdoor functions',
];

const faqs = [
    {
        question: 'Do you support outside decorators and photographers?',
        answer: 'Yes. You can bring your own vendors, or use our curated partner network. We coordinate both models.',
    },
    {
        question: 'Can we reserve room blocks for families?',
        answer: 'Yes. Room blocks with release dates and category-wise allocations can be configured based on event size.',
    },
    {
        question: 'How early should we confirm dates?',
        answer: 'For prime wedding months, we recommend 4 to 8 months in advance for best venue and room availability.',
    },
    {
        question: 'Do you offer fully custom packages?',
        answer: 'Yes. Every proposal is customizable. You can choose per-event menu, decor level, and venue allocation.',
    },
];

export default function WeddingPage() {
    return (
        <>
            <main className="min-h-screen bg-[#FAF8F3] text-[#26322D]">
                <section className="relative overflow-hidden border-b border-[#E8E0D2]">
                    <div className="relative h-[72vh] md:h-[78vh]">
                        {/* Placeholder background (image to be added later) */}
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,#1C2622_0%,#2B3A34_38%,#1B2421_100%)]" />
                        <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_25%_30%,rgba(231,212,173,0.18)_0%,rgba(231,212,173,0)_60%)]" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#1F2623]/65 via-[#1F2623]/30 to-transparent" />
                    </div>

                    <div className="absolute inset-0 flex items-center">
                        <div className="max-w-6xl mx-auto px-6 md:px-10 w-full">
                            <div className="max-w-3xl">
                                <p className="text-[#E2CC9E] text-[11px] tracking-[0.35em] uppercase mb-5">
                                    Wedding Experiences At Olivia Alleppey
                                </p>
                                <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-[#F8F5EE] leading-[1.05] mb-5">
                                    A Wedding Program That Feels Personal, Not Packaged
                                </h1>
                                <p className="text-[#F3EFE4]/90 text-base md:text-lg max-w-2xl leading-relaxed mb-8">
                                    From intimate vow ceremonies to multi-day family celebrations, our team builds a realistic wedding plan
                                    around guest comfort, timing, and elegant execution.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Link
                                        href="/contact?type=wedding"
                                        className="inline-flex items-center justify-center bg-[#E7D4AD] text-[#2A332F] px-7 py-3 text-xs tracking-[0.2em] uppercase hover:bg-[#E1CB9C] transition-colors"
                                    >
                                        Plan A Consultation
                                    </Link>
                                    <Link
                                        href="#wedding-venues"
                                        className="inline-flex items-center justify-center border border-[#F3EADB]/60 text-[#F8F5EE] px-7 py-3 text-xs tracking-[0.2em] uppercase hover:bg-white/10 transition-colors"
                                    >
                                        Explore Venues
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="border-b border-[#E8E0D2] bg-[#F6F1E7]">
                    <div className="max-w-6xl mx-auto px-6 md:px-10 py-6 md:py-7 grid grid-cols-2 md:grid-cols-4 gap-5">
                        <Fact label="Celebration Size" value="40 to 400 Guests" />
                        <Fact label="Planning Window" value="4 to 8 Months" />
                        <Fact label="Venue Options" value="Indoor + Outdoor" />
                        <Fact label="Response Time" value="Within 24 Hours" />
                    </div>
                </section>

                <section className="py-14 md:py-16">
                    <div className="max-w-6xl mx-auto px-6 md:px-10 grid lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-10 items-start">
                        <div>
                            <p className="text-[#9E8152] text-[11px] tracking-[0.3em] uppercase mb-4">
                                How We Plan
                            </p>
                            <h2 className="font-serif text-3xl md:text-5xl leading-tight mb-5 text-[#1F2925]">
                                Real Wedding Operations, Wrapped In Luxury Hospitality
                            </h2>
                            <p className="text-[#3E4D46]/80 leading-relaxed mb-6">
                                We build the day around real service logic: guest flow, vendor timing, room readiness, weather fallback,
                                and function transitions. That means the celebration feels effortless because the operations are tight.
                            </p>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {[
                                    'Single point wedding manager',
                                    'Venue and guest movement plan',
                                    'Family check-in and hospitality desk',
                                    'Function wise setup windows',
                                    'Menu tasting and finalisation',
                                    'Backup plan for weather and delays',
                                ].map((item) => (
                                    <div key={item} className="border border-[#E7DFD0] bg-[#FCFAF5] px-4 py-3 text-sm text-[#35453E]">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-4">
                            <div className="relative h-56 md:h-64 rounded-sm overflow-hidden">
                                <Image
                                    src="/images/rooms/balcony-room-3.jpg"
                                    alt="Wedding welcome setup"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="relative h-52 md:h-56 rounded-sm overflow-hidden">
                                <Image
                                    src="/images/rooms/balcony-room-4.jpg"
                                    alt="Wedding dinner setup"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-12 md:py-14 bg-[#F6F1E7] border-y border-[#E8E0D2]">
                    <div className="max-w-6xl mx-auto px-6 md:px-10">
                        <p className="text-[#9E8152] text-[11px] tracking-[0.3em] uppercase mb-3">
                            Celebration Formats
                        </p>
                        <h2 className="font-serif text-3xl md:text-5xl text-[#1F2925] mb-8">
                            Choose Your Wedding Scale
                        </h2>
                        <div className="grid lg:grid-cols-3 gap-5">
                            {celebrationStyles.map((style) => {
                                const Icon = style.icon;
                                return (
                                    <article key={style.title} className="border border-[#E4D9C7] bg-[#FCFAF5] p-6">
                                        <Icon className="w-6 h-6 text-[#B18F59] mb-4" />
                                        <h3 className="font-serif text-2xl text-[#1F2925] mb-3">{style.title}</h3>
                                        <p className="text-sm text-[#3C4B44] mb-1">{style.capacity}</p>
                                        <p className="text-sm text-[#3C4B44] mb-1">{style.investment}</p>
                                        <p className="text-sm text-[#3C4B44]/80 mb-4">{style.idealFor}</p>
                                        <ul className="space-y-2">
                                            {style.highlights.map((item) => (
                                                <li key={item} className="text-sm text-[#425149]">
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section id="wedding-venues" className="py-12 md:py-14">
                    <div className="max-w-6xl mx-auto px-6 md:px-10">
                        <p className="text-[#9E8152] text-[11px] tracking-[0.3em] uppercase mb-3">
                            Signature Venues
                        </p>
                        <h2 className="font-serif text-3xl md:text-5xl text-[#1F2925] mb-8">
                            Spaces Designed For Wedding Flow
                        </h2>
                        <div className="grid lg:grid-cols-3 gap-5">
                            {venueList.map((venue) => (
                                <article key={venue.name} className="border border-[#E4D9C7] bg-[#FCFAF5] overflow-hidden">
                                    <div className="relative h-52">
                                        <Image
                                            src={venue.image}
                                            alt={venue.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="p-5">
                                        <h3 className="font-serif text-2xl text-[#1F2925] mb-2">{venue.name}</h3>
                                        <p className="text-sm text-[#43534B] mb-2">{venue.description}</p>
                                        <p className="text-sm text-[#3A4942]">Capacity: {venue.capacity}</p>
                                        <p className="text-sm text-[#3A4942]">Area: {venue.area}</p>
                                        <p className="text-sm text-[#3A4942] mt-2">Best for: {venue.bestFor}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-12 md:py-14 bg-[#FCFAF5] border-y border-[#E8E0D2]">
                    <div className="max-w-6xl mx-auto px-6 md:px-10">
                        <p className="text-[#9E8152] text-[11px] tracking-[0.3em] uppercase mb-3">
                            Execution Timeline
                        </p>
                        <h2 className="font-serif text-3xl md:text-5xl text-[#1F2925] mb-8">
                            Planning In Four Clear Stages
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {planningTimeline.map((step) => (
                                <article key={step.title} className="border border-[#E6DDCF] p-5 bg-white">
                                    <p className="text-[11px] tracking-[0.24em] uppercase text-[#9A7C4A] mb-2">{step.label}</p>
                                    <h3 className="font-serif text-2xl text-[#1F2925] mb-2">{step.title}</h3>
                                    <p className="text-sm text-[#3F4F47] leading-relaxed">{step.detail}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-12 md:py-14">
                    <div className="max-w-6xl mx-auto px-6 md:px-10 grid lg:grid-cols-2 gap-8">
                        <div>
                            <p className="text-[#9E8152] text-[11px] tracking-[0.3em] uppercase mb-3">
                                Included In Most Wedding Proposals
                            </p>
                            <h2 className="font-serif text-3xl md:text-5xl text-[#1F2925] mb-6">
                                Core Services Covered
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {includedServices.map((service) => (
                                    <div key={service} className="border border-[#E7DFD0] bg-[#FCFAF5] px-4 py-3 text-sm text-[#3F4F47]">
                                        {service}
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm text-[#5A6962] mt-5">
                                Final inclusions depend on chosen venue, function count, and seasonal rates.
                            </p>
                        </div>

                        <div className="border border-[#E6DDCF] bg-[#F7F2E8] p-6 h-fit">
                            <div className="flex items-start gap-3 mb-4">
                                <CalendarDays className="w-5 h-5 text-[#A88750] mt-0.5" />
                                <div>
                                    <h3 className="font-serif text-2xl text-[#1F2925] mb-1">
                                        Investment Notes
                                    </h3>
                                    <p className="text-sm text-[#4A5952]">
                                        Indicative figures are before taxes and premium decor upgrades.
                                    </p>
                                </div>
                            </div>
                            <ul className="space-y-2 text-sm text-[#3E4E46]">
                                <li>Peak dates may have minimum room commitment.</li>
                                <li>Menu pricing depends on cuisine mix and service style.</li>
                                <li>Outside vendor policies are shared at proposal stage.</li>
                                <li>Audio/lighting upgrades are quoted per event plan.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="py-10 md:py-12 border-y border-[#E8E0D2] bg-[#F6F1E7]">
                    <div className="max-w-5xl mx-auto px-6 md:px-10">
                        <h2 className="font-serif text-3xl md:text-4xl text-[#1F2925] mb-6">
                            Frequently Asked Questions
                        </h2>
                        <div className="space-y-3">
                            {faqs.map((faq) => (
                                <details key={faq.question} className="group border border-[#E3D9C8] bg-[#FCFAF5] px-5 py-4">
                                    <summary className="cursor-pointer list-none text-[#24302B] font-medium pr-8 relative">
                                        {faq.question}
                                        <span className="absolute right-0 top-0 text-[#9E8152] transition-transform group-open:rotate-45">+</span>
                                    </summary>
                                    <p className="text-sm text-[#3E4D46] mt-3 leading-relaxed">{faq.answer}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-12 md:py-14">
                    <div className="max-w-5xl mx-auto px-6 md:px-10 text-center border border-[#E4D9C7] bg-[#FCFAF5] p-8 md:p-10">
                        <p className="text-[#9E8152] text-[11px] tracking-[0.3em] uppercase mb-3">
                            Ready To Begin
                        </p>
                        <h2 className="font-serif text-3xl md:text-5xl text-[#1F2925] mb-4">
                            Tell Us Your Wedding Dates And Guest Range
                        </h2>
                        <p className="text-[#46554D] max-w-2xl mx-auto mb-7">
                            Share your expected function dates, guest count, and room requirement. We will send a tailored wedding proposal
                            with venue flow and indicative budget split.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href="/contact?type=wedding"
                                className="inline-flex items-center justify-center bg-[#2A3430] text-[#F7F4EC] px-7 py-3 text-xs tracking-[0.2em] uppercase hover:bg-[#39443F] transition-colors"
                            >
                                Request Wedding Proposal
                            </Link>
                            <Link
                                href="/contact"
                                className="inline-flex items-center justify-center border border-[#CAB38A] text-[#384740] px-7 py-3 text-xs tracking-[0.2em] uppercase hover:bg-[#F2EADB] transition-colors"
                            >
                                Speak To Planning Team
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <StickyBookButton />
            <WhatsAppWidget />
        </>
    );
}

function Fact({ label, value }: { label: string; value: string }) {
    return (
        <div className="border border-[#E7DDCC] bg-[#FCFAF5] px-4 py-3">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#8F7750] mb-1">{label}</p>
            <p className="text-sm md:text-base text-[#2D3933]">{value}</p>
        </div>
    );
}
