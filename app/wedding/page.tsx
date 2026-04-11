'use client';

import StickyBookButton from '@/components/sticky-book-button';
import WhatsAppWidget from '@/components/whatsapp-widget';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import EventInquiryForm from '@/components/conference/event-inquiry-form';
import { useState, useEffect, useRef } from 'react';

const venueNames = ['Grand Ballroom', 'Forum Hall', 'Pool Side Venue'];

const venues = [
    {
        key: 'grand_ballroom',
        name: 'Grand Ballroom',
        capacity: 'Up to 550 Guests',
        area: '5,500 sq ft',
        bestFor: 'Reception, sangeet, large guest dining',
        description: 'The Grand Ballroom comfortably hosts up to 550 guests. With refined interiors, flexible layouts, and seamless service support, it is ideal for weddings, receptions, large conferences, and milestone events where scale meets sophistication.',
        tag: 'Grand Scale',
    },
    {
        key: 'forum_hall',
        name: 'Forum Hall',
        capacity: 'Up to 180 Guests',
        area: '2,000 sq ft',
        bestFor: 'Varmala, cocktail evening, phera mandap',
        description: 'Perfect for intimate celebrations and corporate gatherings, Forum Hall accommodates up to 180 guests. Thoughtfully designed for comfort and functionality, it offers a refined setting for social events and private functions with effortless flow and privacy.',
        tag: 'Intimate Setting',
    },
    {
        key: 'pool_side',
        name: 'Pool Side Venue',
        capacity: 'Up to 200 Guests',
        area: '3,200 sq ft',
        bestFor: 'Mehendi, welcome dinner, farewell brunch',
        description: 'Set against the tranquil backdrop of the water, the Poolside venue hosts up to 200 guests and can be transformed to suit the spirit of your occasion — be it a sunset soirée, cocktail evening, mehndi, or themed celebration.',
        tag: 'Open Air',
    },
];

const faqs = [
    { question: 'Do you support outside decorators and photographers?', answer: 'Yes. You can bring your own vendors, or use our curated partner network. We coordinate both models.' },
    { question: 'Can we reserve room blocks for families?', answer: 'Yes. Room blocks with release dates and category-wise allocations can be configured based on event size.' },
    { question: 'How early should we confirm dates?', answer: 'For prime wedding months, we recommend 4 to 8 months in advance for best venue and room availability.' },
    { question: 'Do you offer fully custom packages?', answer: 'Yes. Every proposal is customizable. You can choose per-event menu, decor level, and venue allocation.' },
];

export default function WeddingPage() {
    const [venueImages, setVenueImages] = useState<Record<string, string>>({});
    const [sectionImages, setSectionImages] = useState<Record<string, string>>({});
    const [activeVenue, setActiveVenue] = useState(0);

    useEffect(() => {
        fetch('/api/admin/media/wedding')
            .then(res => res.json())
            .then(data => {
                if (data.venueImages) setVenueImages(data.venueImages);
                if (data.sectionImages) setSectionImages(data.sectionImages);
            })
            .catch(console.error);
    }, []);

    return (
        <>
            <main className="min-h-screen bg-[#FAF8F3] text-[#26322D]">

                {/* Hero */}
                <section className="relative h-[44vh] md:h-[52vh] w-full overflow-hidden">
                    <motion.div
                        initial={{ scale: 1.05 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 8, ease: "easeOut" }}
                        className="absolute inset-0 z-0"
                    >
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--brand-primary-deep)_0%,var(--brand-primary-dark)_38%,var(--brand-primary-deep)_100%)]" />
                        <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_25%_30%,rgba(231,212,173,0.18)_0%,rgba(231,212,173,0)_60%)]" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/40" />
                    </motion.div>

                    <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="flex items-center gap-4 mb-3">
                            <span className="w-8 h-[1px] bg-white/80" />
                            <p className="text-white text-[10px] tracking-[0.34em] uppercase font-light">Olivia Alleppey</p>
                            <span className="w-8 h-[1px] bg-white/80" />
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 25 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="text-[4.25rem] sm:text-[5.25rem] md:text-[8.25rem] lg:text-[10.5rem] font-serif font-medium text-white mb-5 tracking-[-0.03em] leading-[0.92] [text-shadow:0_2px_22px_rgba(0,0,0,0.55)]"
                        >
                            Celebrations
                        </motion.h1>

                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }} className="flex gap-3">
                            <Link href="#venues" className="border border-white/90 bg-white text-[#2D3933] px-6 py-2.5 text-[10px] tracking-[0.22em] uppercase font-semibold shadow-[0_18px_40px_-28px_rgba(0,0,0,0.65)] hover:bg-white/95 transition-colors duration-300">
                                Explore Venues
                            </Link>
                            <Link href="#event-form" className="border border-white/85 bg-black/20 text-white px-6 py-2.5 text-[10px] tracking-[0.22em] uppercase font-semibold backdrop-blur-sm hover:bg-black/30 transition-colors duration-300">
                                Plan Your Wedding
                            </Link>
                        </motion.div>
                    </div>
                </section>

                {/* Facts Bar */}
                <section className="border-b border-[#E8E0D2] bg-[#F6F1E7]">
                    <div className="max-w-6xl mx-auto px-6 md:px-10 py-6 md:py-7 grid grid-cols-2 md:grid-cols-4 gap-5">
                        {[
                            { label: 'Celebration Size', value: '25 – 750 Guests' },
                            { label: 'Venue Options', value: 'Indoor + Outdoor' },
                            { label: 'Response Time', value: 'Within 24 Hours' },
                            { label: 'Location', value: 'Olivia Alleppey' },
                        ].map(({ label, value }) => (
                            <div key={label} className="border border-[#E7DDCC] bg-[#FCFAF5] px-4 py-3">
                                <p className="text-[10px] tracking-[0.2em] uppercase text-[#8F7750] mb-1">{label}</p>
                                <p className="text-sm md:text-base text-[#2D3933]">{value}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Sticky Venue Nav */}
                <section
                    id="venues"
                    className="sticky z-40 bg-[#FBF9F3] border-b border-[#E8E0D1] py-3 md:py-3.5 transition-all duration-300"
                    style={{ top: 'var(--site-header-height, 62px)' }}
                >
                    <div className="w-full px-3 sm:px-6 md:px-12">
                        <div className="flex items-center justify-center gap-3 px-1 md:px-2 pb-2">
                            <p className="text-[10px] md:text-[11px] uppercase tracking-[0.28em] text-[#6B645C] whitespace-nowrap">Select a venue</p>
                        </div>
                        <div className="-mx-1 overflow-x-auto lg:overflow-x-visible no-scrollbar">
                            <div className="flex min-w-max lg:min-w-0 lg:w-full items-center gap-2 md:gap-3 px-1 md:px-2 lg:justify-between">
                                {venueNames.map((name, index) => (
                                    <button
                                        key={name}
                                        onClick={() => {
                                            setActiveVenue(index);
                                            document.getElementById(`venue-${index}`)?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className={`relative px-4 md:px-5 py-2.5 text-[11px] md:text-xs tracking-[0.12em] uppercase whitespace-nowrap transition-colors duration-200 lg:flex-1 lg:text-center rounded-full border focus:outline-none cursor-pointer ${activeVenue === index
                                            ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white shadow-[0_14px_30px_-22px_rgba(10,51,43,0.65)]'
                                            : 'bg-white/80 border-[#E6DDCE] text-[#2E3934] hover:bg-white hover:border-[#CFC2AD]'
                                        }`}
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Venues Collection */}
                <section className="py-8 md:py-10 px-6 md:px-10 scroll-mt-[130px] md:scroll-mt-[150px]">
                    <div className="max-w-[1600px] mx-auto">
                        <div className="text-center mb-10 md:mb-12">
                            <span className="inline-block w-12 h-[1px] bg-[#C6AF84] mb-5" />
                            <h2 className="text-4xl md:text-5xl font-serif text-[#2C3632] tracking-tight">Spaces Designed for Wedding Flow</h2>
                        </div>
                        <div className="space-y-8 md:space-y-10">
                            {venues.map((venue, index) => (
                                <VenueCard
                                    key={venue.key}
                                    venue={venue}
                                    index={index}
                                    imageUrl={venueImages[venue.key]}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* How We Plan */}
                <section className="py-12 md:py-16 px-6 md:px-10 bg-[#FAF8F3]">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-6 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1 }}
                                className="lg:pr-8"
                            >
                                <span className="text-[#8D7858] text-[10px] tracking-[0.3em] uppercase mb-3 block">How We Plan</span>
                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-[#2D3732] mb-4 leading-tight">
                                    Real Wedding Operations, Wrapped In Luxury Hospitality
                                </h2>
                                <p className="text-[#3E4C45]/75 text-base md:text-lg leading-relaxed mb-6">
                                    At Olivia, every banquet marks the beginning of a legacy. Curated with soulful flavours, graceful details, and effortless service — each celebration honours tradition while embracing timeless luxury.
                                </p>
                                <div className="mb-7 border border-[#E6DDCE] bg-[#FCFAF5] px-5 py-4">
                                    <p className="text-[10px] tracking-[0.28em] uppercase text-[#6B645C] mb-3">What We Handle</p>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            'Backup plan for weather and delays',
                                            'Menu tasting and finalisation',
                                            'Single point wedding manager',
                                            'Venue and guest movement plan',
                                            'Family check-in and hospitality desk',
                                            'Ceremony and function coordination',
                                        ].map((item) => (
                                            <span key={item} className="text-[11px] text-[#403A35] border border-[#BCA06F] bg-white/70 px-2.5 py-1">
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <Link href="#event-form" className="inline-flex items-center gap-4 group">
                                    <span className="text-[#2D3732] text-sm tracking-[0.2em] uppercase font-medium">Start Planning</span>
                                    <span className="w-8 h-[1px] bg-[#BCA06F] group-hover:w-14 transition-all duration-300" />
                                </Link>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1 }}
                                className="grid gap-4"
                            >
                                <div className="relative h-56 md:h-64 rounded-sm overflow-hidden bg-[#E8E0D2]">
                                    {sectionImages.how_we_plan_1 && (
                                        <img src={sectionImages.how_we_plan_1} alt="Wedding planning" className="w-full h-full object-cover" />
                                    )}
                                </div>
                                <div className="relative h-48 md:h-56 rounded-sm overflow-hidden bg-[#DCD4C4]">
                                    {sectionImages.how_we_plan_2 && (
                                        <img src={sectionImages.how_we_plan_2} alt="Wedding details" className="w-full h-full object-cover" />
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Inquiry Form — Concierge CTA Style */}
                <section id="event-form" className="relative py-14 md:py-16 overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,#EFE6D7_0%,#F7F2E8_45%,#EEE4D3_100%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_30%_35%,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0)_60%)]" />
                    <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-10 bg-[#FCFAF5]/92 border border-[#E6DDCE] py-8 md:py-10">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1 }}
                        >
                            <span className="inline-block w-10 h-[1px] bg-[#BFA47A] mb-5" />
                            <p className="text-[#8E7859] text-[10px] tracking-[0.3em] uppercase mb-4">Wedding Inquiry</p>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-[#2D3732] mb-3 leading-tight">
                                Plan Your
                                <span className="block italic text-[#8C7451]">Perfect Wedding</span>
                            </h2>
                            <p className="text-[#3F5048]/75 mb-8 font-light text-base md:text-lg max-w-xl leading-relaxed">
                                Share your vision and our team will suggest the right venue, layout and service plan.
                            </p>
                            <EventInquiryForm />
                        </motion.div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="py-12 md:py-14 px-6 md:px-10">
                    <div className="max-w-3xl mx-auto">
                        <span className="inline-block w-10 h-[1px] bg-[#BFA47A] mb-5" />
                        <h2 className="font-serif text-3xl md:text-4xl text-[#1F2925] mb-8">Frequently Asked Questions</h2>
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

                {/* Bottom CTA Bar */}
                <section className="bg-[#F6F1E7] py-4 px-6 border-t border-[#E6DDCB]">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2.5">
                        <p className="text-[#3E4E47]/85 text-sm">
                            <span className="text-[#A68A5A]">✦</span> Every wedding is unique — every proposal is custom
                        </p>
                        <Link
                            href="#event-form"
                            className="border border-[#D3C3A7] bg-[#FCFAF5] text-[#31403A] px-6 py-2.5 text-xs tracking-[0.18em] uppercase hover:bg-[#F1E9D9] transition-colors duration-300"
                        >
                            Get a Proposal
                        </Link>
                    </div>
                </section>

            </main>
            <StickyBookButton />
            <WhatsAppWidget />
        </>
    );
}

function VenueCard({ venue, index, imageUrl }: { venue: typeof venues[0]; index: number; imageUrl?: string }) {
    const isEven = index % 2 === 0;
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
    const y = useTransform(scrollYProgress, [0, 1], [18, -18]);

    return (
        <motion.div
            id={`venue-${index}`}
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-6 lg:gap-8 items-stretch lg:min-h-[46vh] scroll-mt-[200px] md:scroll-mt-[220px]`}
        >
            {/* Image */}
            <div className="w-full lg:w-1/2 relative h-[34vh] sm:h-[40vh] lg:h-[44vh] xl:h-[46vh] overflow-hidden group">
                <motion.div style={{ y }} className="absolute inset-0 h-[120%] w-full -top-[10%]">
                    {imageUrl ? (
                        <img src={imageUrl} alt={venue.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                        <div className="w-full h-full bg-[#E8E0D2]" />
                    )}
                </motion.div>
                <div className="absolute bottom-6 left-6 z-10 flex items-center gap-3">
                    <div className="backdrop-blur-md bg-black/25 border border-white/20 text-white text-[10px] font-accent tracking-[0.3em] uppercase px-5 py-2.5 rounded-full flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#BCA06F] animate-pulse" />
                        {venue.tag}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className={`w-full lg:w-1/2 flex flex-col justify-center py-2 lg:py-0 ${isEven ? 'lg:pl-8' : 'lg:items-end lg:pr-8 text-right'}`}>
                <div className="max-w-lg">
                    <span className="text-[#BCA06F] text-[10px] md:text-[11px] tracking-[0.4em] uppercase mb-4 block">
                        {String(index + 1).padStart(2, '0')} — Signature Venue
                    </span>
                    <h3 className="text-3xl md:text-4xl lg:text-[2.55rem] font-serif font-bold tracking-tight text-[var(--text-dark)] mb-4 leading-tight">
                        {venue.name}
                    </h3>
                    <p className="text-[#403A35] text-base md:text-[1.05rem] leading-[1.7] tracking-wide mb-6 font-light">
                        {venue.description}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6 py-5 border-y border-[#E3DDD4]">
                        <div>
                            <p className="text-[1.62rem] md:text-[1.82rem] font-sans font-[300] text-[#181818] leading-none mb-1 tracking-[-0.01em]">
                                {venue.capacity.replace('Up to ', '').replace(' Guests', '')}
                            </p>
                            <p className="text-[10px] text-[#655D55] uppercase tracking-[0.22em] font-medium">Max Guests</p>
                        </div>
                        <div>
                            <p className="text-[1.62rem] md:text-[1.82rem] font-sans font-[300] text-[#181818] leading-none mb-1 tracking-[-0.01em]">
                                {venue.area.split(' ')[0]}
                            </p>
                            <p className="text-[10px] text-[#655D55] uppercase tracking-[0.22em] font-medium">Sq Ft</p>
                        </div>
                        <div>
                            <p className="text-[1.2rem] font-sans font-[300] text-[#181818] leading-none mb-1">
                                {venue.tag}
                            </p>
                            <p className="text-[10px] text-[#655D55] uppercase tracking-[0.22em] font-medium">Setting</p>
                        </div>
                    </div>

                    {/* Best For Tag */}
                    <div className="flex flex-wrap gap-1.5 mb-6">
                        {venue.bestFor.split(', ').map((tag) => (
                            <span key={tag} className="text-xs text-[#403A35] border border-[#BCA06F] bg-[#FCFAF5] px-2.5 py-1">
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* CTA */}
                    <Link
                        href="#event-form"
                        className="group relative inline-flex items-center justify-center px-8 py-3.5 border border-[var(--brand-primary-dark)] text-white overflow-hidden transition-colors duration-300 bg-[var(--brand-primary-dark)]"
                    >
                        <span className="absolute inset-0 w-full h-full bg-black origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out z-0" />
                        <span className="relative z-10 text-[11px] tracking-[0.24em] uppercase font-normal">Enquire About This Venue</span>
                        <svg className="relative z-10 w-3.5 h-3.5 ml-3 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}

