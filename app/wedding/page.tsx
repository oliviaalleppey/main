'use client';

import StickyBookButton from '@/components/sticky-book-button';
import WhatsAppWidget from '@/components/whatsapp-widget';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
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
        name: 'Grand Ballroom',
        image: '',
        capacity: 'Up to 550 Guest',
        area: '5500 sq ft',
        description: 'the Grand Ballroom comfortably hosts up to 550 guests.With refined interiors, flexible layouts, and seamless service support, it i s ideal for weddings, receptions, large conferences, and milestone events where scale meets sophistication.',
        bestFor: 'Reception, sangeet, large guest dining',
    },
    {
        name: 'Forum Hall',
        image: '',
        capacity: 'Up to 180 Guest',
        area: '2000 sq ft',
        description: 'Perfect for intimate celebrations and corporate gatherings, Forum Hall accommodates up to 180 guests. Thoughtfully designed for comfort and functionality, it offers a refined setting for conferences, social events, and private functions with effortless flow and privacy.',
        bestFor: 'Varmala, cocktail evening, phera mandap',
    },
    {
        name: 'Pool Side Venue',
        image: '',
        capacity: 'Up to 200 Guest',
        area: '3,200 sq ft',
        description: 'Set against the tranquil backdrop o f the water, the Poolside venue hosts up to 200 guests and can b e transformed to suit the spirit of your occasion—be it a sunset soirée, cocktail evening, mehndi, o r themed celebration. The open-air ambience allows for creative décor, lighting, and customised layouts',
        bestFor: 'Mehendi, welcome dinner, farewell brunch',
    },
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
                <section className="relative h-[44vh] md:h-[52vh] w-full overflow-hidden">
                    <motion.div
                        initial={{ scale: 1.05 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 8, ease: "easeOut" }}
                        className="absolute inset-0 z-0"
                    >
                        {/* Dark gradient background */}
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--brand-primary-deep)_0%,var(--brand-primary-dark)_38%,var(--brand-primary-deep)_100%)]" />
                        <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_25%_30%,rgba(231,212,173,0.18)_0%,rgba(231,212,173,0)_60%)]" />
                    </motion.div>

                    <div className="relative z-10 h-full flex items-center justify-center text-center px-4 md:px-6 w-full">
                        <div className="w-full max-w-[1800px]">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="flex items-center justify-center gap-4 mb-3"
                            >
                                <span className="w-8 h-[1px] bg-white/80" />
                                <p className="text-white text-[10px] tracking-[0.34em] uppercase font-light">
                                    Olivia Alleppey
                                </p>
                                <span className="w-8 h-[1px] bg-white/80" />
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 25 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="text-[10.5vw] sm:text-[10vw] md:text-[9vw] lg:text-[8vw] xl:text-[7.5vw] w-full font-serif font-medium text-white mb-3 tracking-[-0.02em] leading-[0.9] whitespace-nowrap [text-shadow:0_2px_22px_rgba(0,0,0,0.55)]"
                            >
                                Celebrations at Olivia
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.6 }}
                                className="text-white text-sm md:text-base tracking-wide mb-6"
                            >
                                Plan your bespoke wedding at Olivia
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.8 }}
                            >
                                <Link
                                    href="/conference-events"
                                    className="border border-white/85 bg-black/20 text-white px-6 py-2.5 text-[10px] tracking-[0.22em] uppercase font-semibold backdrop-blur-sm hover:bg-black/30 transition-colors duration-300"
                                >
                                    Explore Venues
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </section>

                <section className="border-b border-[#E8E0D2] bg-[#F6F1E7]">
                    <div className="max-w-6xl mx-auto px-6 md:px-10 py-6 md:py-7 grid grid-cols-2 md:grid-cols-4 gap-5">
                        <Fact label="Celebration Size" value="25 - 750 Guests" />
                        <Fact label="Venue Options" value="Indoor + Outdoor" />
                        <Fact label="Response Time" value="Instant clarification" />
                        <Fact label="Location" value="Olivia Alleppey" />
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
                                At Olivia, Every banquet marks the beginning of a legacy. Curated with soulful flavours, graceful details,
                                and effortless service, each celebration honours tradition while
                                embraces timeless luxury. Surrounded by care, warmth, and family,
                                you are free to be present - to be a guest</p>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {[
                                    'Backup plan for weather and delays',
                                    'Menu tasting and finalisation',
                                    'Single point wedding manager',
                                    'Venue and guest movement plan',
                                    'Family check-in and hospitality desk',
                                    'Ceremony and function coordination',
                                ].map((item) => (
                                    <div key={item} className="border border-[#E7DFD0] bg-[#FCFAF5] px-4 py-3 text-sm text-[#35453E]">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-4">
                            <div className="relative h-56 md:h-64 rounded-sm overflow-hidden bg-[#E8E0D2]" />
                            <div className="relative h-52 md:h-56 rounded-sm overflow-hidden bg-[#DCD4C4]" />
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
                                    <div className="relative h-52 bg-[#E8E0D2]" />
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


                <section className="py-12 md:py-14">
                    <div className="max-w-6xl mx-auto px-6 md:px-10">
                        <div className="max-w-3xl mx-auto">
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
