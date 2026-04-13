'use client';

import StickyBookButton from '@/components/sticky-book-button';
import WhatsAppWidget from '@/components/whatsapp-widget';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import SimpleInquiryForm from '@/components/conference/simple-inquiry-form';
import { useState, useEffect, useRef } from 'react';

const mainVenues = [
    {
        key: 'grand-ballroom',
        name: 'Grand BallRoom',
        capacity: 'Up to 550',
        area: '5,035 sq ft',
        tag: 'Grand Scale',
        bestFor: 'Conferences, Corporate Events, Product Launches',
        description:
            'A flagship venue meticulously designed for high-impact corporate events and large-scale conferences. Featuring refined interiors, adaptable layouts, and seamless service support, it provides an ideal setting for conventions, product launches, corporate gatherings, and business summits where scale, precision, and sophistication come together effortlessly.',
        subVenues: [
            { name: 'Grand BallRoom 1', theatre: '550', cluster: '196', classroom: '180', area: '1,749 sq ft' },
            { name: 'Grand BallRoom 2', theatre: '550', cluster: '196', classroom: '180', area: '1,855 sq ft' },
            { name: 'Grand BallRoom 3', theatre: '170', cluster: '66', classroom: '42', area: '1,431 sq ft' },
        ],
    },
    {
        key: 'forum',
        name: 'Forum',
        capacity: 'Up to 180',
        area: '2,000 sq ft',
        tag: 'Focused Sessions',
        bestFor: 'Mid-size Conferences, Strategy Meets, Corporate Sessions',
        description:
            'Mid-scale conference venue that balances capacity with focused business interaction. Perfect for conferences that require intimacy with structure, strategy meets, and high-level corporate sessions where every voice carries weight and every decision matters.',
        subVenues: [
            { name: 'Forum 1', theatre: '170', cluster: '66', classroom: '42', area: '660 sq ft' },
            { name: 'Forum 2', theatre: '170', cluster: '66', classroom: '42', area: '660 sq ft' },
        ],
    },
    {
        key: 'forum-3',
        name: 'Board Room',
        capacity: 'Up to 12',
        area: '882 sq ft',
        tag: 'Executive Suite',
        bestFor: 'Leadership Meetings, Decision Rooms, Private Briefings',
        description:
            'Private-format meeting room suited for decision rooms and leadership briefings. An intimate space that encourages high-level conversation and strategic thinking, with all the refinement expected of executive-grade hospitality.',
        subVenues: [],
    },
    {
        key: 'poolside',
        name: 'Poolside',
        capacity: 'Up to 200',
        area: '4,000 sq ft',
        tag: 'Open Air',
        bestFor: 'Networking Dinners, Outdoor Celebrations, Cocktail Evenings',
        description:
            'An exquisite open-air venue crafted for refined social evenings, elegant celebrations, and thoughtfully curated hospitality experiences. Framed by the serene allure of water, this sophisticated setting transforms effortlessly to reflect the essence of any occasion.',
        subVenues: [],
    },
];

const venueNavNames = mainVenues.map((v) => v.name);

export default function ConferenceEventsPage() {
    const [venueImages, setVenueImages] = useState<Record<string, string>>({});
    const [activeVenue, setActiveVenue] = useState(0);

    useEffect(() => {
        fetch('/api/admin/media/conference')
            .then((res) => res.json())
            .then((data) => {
                if (data.venueImages) setVenueImages(data.venueImages);
            })
            .catch(console.error);
    }, []);

    return (
        <>
            <main className="min-h-screen bg-[#FAF8F3] text-[#26322D]">

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
                                {venueNavNames.map((name, index) => (
                                    <button
                                        key={name}
                                        onClick={() => {
                                            setActiveVenue(index);
                                            document.getElementById(`venue-${index}`)?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className={`relative px-4 md:px-5 py-2.5 text-[11px] md:text-xs tracking-[0.12em] uppercase whitespace-nowrap transition-colors duration-200 lg:flex-1 lg:text-center rounded-full border focus:outline-none cursor-pointer ${
                                            activeVenue === index
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

                {/* Venue Collection */}
                <section className="py-8 md:py-10 px-6 md:px-10 scroll-mt-[130px] md:scroll-mt-[150px]">
                    <div className="max-w-[1600px] mx-auto">
                        <div className="text-center mb-10 md:mb-12">
                            <span className="inline-block w-12 h-[1px] bg-[#C6AF84] mb-5" />
                            <h2 className="text-4xl md:text-5xl font-serif text-[#2C3632] tracking-tight">Spaces Designed for Business Flow</h2>
                        </div>
                        <div className="space-y-8 md:space-y-10">
                            {mainVenues.map((venue, index) => (
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
                            <p className="text-[#8E7859] text-[10px] tracking-[0.3em] uppercase mb-4">Event Inquiry</p>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-[#2D3732] mb-3 leading-tight">
                                Plan Your
                                <span className="block italic text-[#8C7451]">Perfect Event</span>
                            </h2>
                            <p className="text-[#3F5048]/75 mb-8 font-light text-base md:text-lg max-w-xl leading-relaxed">
                                Share your event brief and our team will suggest the right venue, layout and service plan.
                            </p>
                            <SimpleInquiryForm />
                        </motion.div>
                    </div>
                </section>

                {/* Bottom CTA Bar */}
                <section className="bg-[#F6F1E7] py-4 px-6 border-t border-[#E6DDCB]">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2.5">
                        <p className="text-[#3E4E47]/85 text-sm">
                            <span className="text-[#A68A5A]">✦</span> Every event is unique — every proposal is custom
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

function VenueCard({ venue, index, imageUrl }: { venue: typeof mainVenues[0]; index: number; imageUrl?: string }) {
    const isEven = index % 2 === 0;
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
    const y = useTransform(scrollYProgress, [0, 1], [18, -18]);

    return (
        <motion.div
            id={`venue-${index}`}
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-6 lg:gap-8 items-stretch lg:min-h-[46vh] scroll-mt-[200px] md:scroll-mt-[220px]`}
        >
            {/* Image */}
            <div className="w-full lg:w-1/2 relative h-[34vh] sm:h-[40vh] lg:h-[44vh] xl:h-[46vh] overflow-hidden group">
                <motion.div style={{ y }} className="absolute inset-0 h-[120%] w-full -top-[10%]">
                    {imageUrl ? (
                        <img src={imageUrl} alt={venue.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                        <div className="w-full h-full bg-[linear-gradient(135deg,var(--brand-primary-deep),var(--brand-primary-dark))]" />
                    )}
                </motion.div>
                <div className="absolute bottom-6 left-6 z-10">
                    <div className="backdrop-blur-md bg-black/25 border border-white/20 text-white text-[10px] tracking-[0.3em] uppercase px-5 py-2.5 rounded-full flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#BCA06F] animate-pulse" />
                        {venue.tag}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className={`w-full lg:w-1/2 flex flex-col justify-center py-2 lg:py-0 ${isEven ? 'lg:pl-8' : 'lg:items-end lg:pr-8 text-right'}`}>
                <div className="max-w-lg">
                    <span className="text-[#BCA06F] text-[10px] md:text-[11px] tracking-[0.4em] uppercase mb-4 block">
                        {String(index + 1).padStart(2, '0')} — Conference Venue
                    </span>
                    <h3 className="text-3xl md:text-4xl lg:text-[2.55rem] font-serif font-bold tracking-tight text-[var(--text-dark)] mb-4 leading-tight">
                        {venue.name}
                    </h3>
                    <p className="text-[#403A35] text-base md:text-[1.05rem] leading-[1.7] tracking-wide mb-6 font-light">
                        {venue.description}
                    </p>

                    {/* Capacity Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6 py-5 border-y border-[#E3DDD4]">
                        <div>
                            <p className="text-[1.5rem] md:text-[1.7rem] font-sans font-[300] text-[#181818] leading-none mb-1 tracking-[-0.01em]">
                                {venue.capacity.replace('Up to ', '')}
                            </p>
                            <p className="text-[10px] text-[#655D55] uppercase tracking-[0.22em] font-medium">Max Guests</p>
                        </div>
                        <div>
                            <p className="text-[1.5rem] md:text-[1.7rem] font-sans font-[300] text-[#181818] leading-none mb-1 tracking-[-0.01em]">
                                {venue.area.split(' ')[0]}
                            </p>
                            <p className="text-[10px] text-[#655D55] uppercase tracking-[0.22em] font-medium">Sq Ft</p>
                        </div>
                        <div>
                            <p className="text-[1.1rem] font-sans font-[300] text-[#181818] leading-none mb-1">
                                {venue.tag}
                            </p>
                            <p className="text-[10px] text-[#655D55] uppercase tracking-[0.22em] font-medium">Setting</p>
                        </div>
                    </div>

                    {/* Best For Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-6">
                        {venue.bestFor.split(', ').map((tag) => (
                            <span key={tag} className="text-xs text-[#403A35] border border-[#BCA06F] bg-[#FCFAF5] px-2.5 py-1">
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* Sub-venue capacity breakdown */}
                    {venue.subVenues.length > 0 && (
                        <div className="mb-6 border border-[#E6DDCE] bg-[#FCFAF5] px-4 py-3">
                            <p className="text-[10px] tracking-[0.28em] uppercase text-[#6B645C] mb-3">Divisible Sections</p>
                            <div className="space-y-2">
                                {venue.subVenues.map((sub) => (
                                    <div key={sub.name} className="flex items-start justify-between gap-3 text-xs">
                                        <span className="text-[#403A35] font-medium whitespace-nowrap">{sub.name}</span>
                                        <span className="text-[#655D55] text-right">Theatre {sub.theatre} · Cluster {sub.cluster} · {sub.area}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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
