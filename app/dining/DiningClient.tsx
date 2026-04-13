'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useState, useRef } from 'react';
import StickyBookButton from '@/components/sticky-book-button';
import WhatsAppWidget from '@/components/whatsapp-widget';

type OutletStatus = 'operational' | 'upcoming';

type DiningOutlet = {
    name: string;
    description: string;
    slug: string;
    image: string;
    capacity: string;
    location: string;
    operatingHours: string;
    cuisine: string;
    status: OutletStatus;
    tag: string;
    menuUrl?: string;
};

interface Props {
    outlets: DiningOutlet[];
}

export default function DiningClient({ outlets }: Props) {
    const [activeOutlet, setActiveOutlet] = useState(0);

    return (
        <>
            <main className="min-h-screen bg-[#FAF8F3] text-[#26322D]">

                {/* Sticky Outlet Nav */}
                <section
                    id="outlets"
                    className="sticky z-40 bg-[#FBF9F3] border-b border-[#E8E0D1] py-3 md:py-3.5 transition-all duration-300"
                    style={{ top: 'var(--site-header-height, 62px)' }}
                >
                    <div className="w-full px-3 sm:px-6 md:px-12">
                        <div className="flex items-center justify-center gap-3 px-1 md:px-2 pb-2">
                            <p className="text-[10px] md:text-[11px] uppercase tracking-[0.28em] text-[#6B645C] whitespace-nowrap">Select an outlet</p>
                        </div>
                        <div className="-mx-1 overflow-x-auto lg:overflow-x-visible no-scrollbar">
                            <div className="flex min-w-max lg:min-w-0 lg:w-full items-center gap-2 md:gap-3 px-1 md:px-2 lg:justify-between">
                                {outlets.map((outlet, index) => (
                                    <button
                                        key={outlet.slug}
                                        onClick={() => {
                                            setActiveOutlet(index);
                                            document.getElementById(`outlet-${index}`)?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className={`relative px-4 md:px-5 py-2.5 text-[11px] md:text-xs tracking-[0.12em] uppercase whitespace-nowrap transition-colors duration-200 lg:flex-1 lg:text-center rounded-full border focus:outline-none cursor-pointer ${
                                            activeOutlet === index
                                                ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white shadow-[0_14px_30px_-22px_rgba(10,51,43,0.65)]'
                                                : 'bg-white/80 border-[#E6DDCE] text-[#2E3934] hover:bg-white hover:border-[#CFC2AD]'
                                        }`}
                                    >
                                        {outlet.name}
                                        {outlet.status === 'upcoming' && (
                                            <span className="ml-1.5 text-[8px] text-[#BCA06F] uppercase tracking-widest">Soon</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Outlet Collection */}
                <section className="py-8 md:py-10 px-6 md:px-10 scroll-mt-[130px] md:scroll-mt-[150px]">
                    <div className="max-w-[1600px] mx-auto">
                        <div className="text-center mb-10 md:mb-12">
                            <span className="inline-block w-12 h-[1px] bg-[#C6AF84] mb-5" />
                            <h2 className="text-4xl md:text-5xl font-serif text-[#2C3632] tracking-tight">A Culinary Journey at Olivia</h2>
                        </div>
                        <div className="space-y-8 md:space-y-10">
                            {outlets.map((outlet, index) => (
                                <OutletCard key={outlet.slug} outlet={outlet} index={index} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* Reservation CTA */}
                <section id="reserve" className="relative py-14 md:py-16 overflow-hidden">
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
                            <p className="text-[#8E7859] text-[10px] tracking-[0.3em] uppercase mb-4">Dining Reservations</p>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-[#2D3732] mb-3 leading-tight">
                                Reserve Your
                                <span className="block italic text-[#8C7451]">Table</span>
                            </h2>
                            <p className="text-[#3F5048]/75 mb-8 font-light text-base md:text-lg max-w-xl leading-relaxed">
                                Call us or reach out via WhatsApp to reserve your table at any of our dining outlets.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <a
                                    href="tel:+918075416514"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[var(--brand-primary-dark)] text-white text-[11px] tracking-[0.24em] uppercase hover:bg-black transition-colors duration-300"
                                >
                                    Call to Reserve
                                </a>
                                <a
                                    href="https://wa.me/918075416514"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-[#D3C3A7] bg-[#FCFAF5] text-[#31403A] text-[11px] tracking-[0.24em] uppercase hover:bg-[#F1E9D9] transition-colors duration-300"
                                >
                                    WhatsApp Us
                                </a>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Bottom CTA Bar */}
                <section className="bg-[#F6F1E7] py-4 px-6 border-t border-[#E6DDCB]">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2.5">
                        <p className="text-[#3E4E47]/85 text-sm">
                            <span className="text-[#A68A5A]">✦</span> Every meal at Olivia is crafted with care
                        </p>
                        <a
                            href="https://oliviaalleppey.com/menu.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border border-[#D3C3A7] bg-[#FCFAF5] text-[#31403A] px-6 py-2.5 text-xs tracking-[0.18em] uppercase hover:bg-[#F1E9D9] transition-colors duration-300"
                        >
                            View Menu
                        </a>
                    </div>
                </section>

            </main>
            <StickyBookButton />
            <WhatsAppWidget />
        </>
    );
}

function OutletCard({ outlet, index }: { outlet: DiningOutlet; index: number }) {
    const isEven = index % 2 === 0;
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
    const y = useTransform(scrollYProgress, [0, 1], [18, -18]);

    return (
        <motion.div
            id={`outlet-${index}`}
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
                    {outlet.image ? (
                        <img
                            src={outlet.image}
                            alt={outlet.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full bg-[linear-gradient(135deg,var(--brand-primary-deep),var(--brand-primary-dark))]" />
                    )}
                </motion.div>
                <div className="absolute bottom-6 left-6 z-10">
                    <div className="backdrop-blur-md bg-black/25 border border-white/20 text-white text-[10px] tracking-[0.3em] uppercase px-5 py-2.5 rounded-full flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#BCA06F] animate-pulse" />
                        {outlet.tag}
                    </div>
                </div>
                {outlet.status === 'upcoming' && (
                    <div className="absolute top-5 right-5 z-10 border border-[#D8BE94] bg-[#F0E3CF]/90 backdrop-blur-sm px-3 py-1 text-[10px] tracking-[0.15em] uppercase text-[#936C35]">
                        Opening Soon
                    </div>
                )}
            </div>

            {/* Content */}
            <div className={`w-full lg:w-1/2 flex flex-col justify-center py-2 lg:py-0 ${isEven ? 'lg:pl-8' : 'lg:items-end lg:pr-8 text-right'}`}>
                <div className="max-w-lg">
                    <span className="text-[#BCA06F] text-[10px] md:text-[11px] tracking-[0.4em] uppercase mb-4 block">
                        {String(index + 1).padStart(2, '0')} — Dining Outlet
                    </span>
                    <h3 className="text-3xl md:text-4xl lg:text-[2.55rem] font-serif font-bold tracking-tight text-[var(--text-dark)] mb-4 leading-tight">
                        {outlet.name}
                    </h3>
                    <p className="text-[#403A35] text-base md:text-[1.05rem] leading-[1.7] tracking-wide mb-6 font-light">
                        {outlet.description}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6 py-5 border-y border-[#E3DDD4]">
                        <div>
                            <p className="text-[1.4rem] md:text-[1.6rem] font-sans font-[300] text-[#181818] leading-none mb-1 tracking-[-0.01em]">
                                {outlet.capacity.replace(' Guests', '').replace(' Rooms and Suites', '+')}
                            </p>
                            <p className="text-[10px] text-[#655D55] uppercase tracking-[0.22em] font-medium">Covers</p>
                        </div>
                        <div>
                            <p className="text-[1rem] font-sans font-[300] text-[#181818] leading-tight mb-1">
                                {outlet.operatingHours.split(' (')[0]}
                            </p>
                            <p className="text-[10px] text-[#655D55] uppercase tracking-[0.22em] font-medium">Hours</p>
                        </div>
                        <div>
                            <p className="text-[1rem] font-sans font-[300] text-[#181818] leading-tight mb-1">
                                {outlet.location}
                            </p>
                            <p className="text-[10px] text-[#655D55] uppercase tracking-[0.22em] font-medium">Location</p>
                        </div>
                    </div>

                    {/* Cuisine Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-6">
                        {outlet.cuisine.split(' & ').concat(outlet.cuisine.includes('Bar') ? [] : []).map((tag, i) => (
                            <span key={i} className="text-xs text-[#403A35] border border-[#BCA06F] bg-[#FCFAF5] px-2.5 py-1">
                                {tag.trim()}
                            </span>
                        ))}
                    </div>

                    {/* CTAs */}
                    <div className="flex flex-wrap gap-3">
                        {(outlet.slug === 'in-room-dining' || outlet.slug === 'finishing-point') ? (
                            <a
                                href="https://oliviaalleppey.com/menu.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative inline-flex items-center justify-center px-8 py-3.5 border border-[var(--brand-primary-dark)] text-white overflow-hidden transition-colors duration-300 bg-[var(--brand-primary-dark)]"
                            >
                                <span className="absolute inset-0 w-full h-full bg-black origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out z-0" />
                                <span className="relative z-10 text-[11px] tracking-[0.24em] uppercase font-normal">View Menu</span>
                                <svg className="relative z-10 w-3.5 h-3.5 ml-3 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </a>
                        ) : outlet.slug === 'brew-bar' ? (
                            <Link
                                href="/dining/brew-bar"
                                className="group relative inline-flex items-center justify-center px-8 py-3.5 border border-[var(--brand-primary-dark)] text-white overflow-hidden transition-colors duration-300 bg-[var(--brand-primary-dark)]"
                            >
                                <span className="absolute inset-0 w-full h-full bg-black origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out z-0" />
                                <span className="relative z-10 text-[11px] tracking-[0.24em] uppercase font-normal">View Menu</span>
                                <svg className="relative z-10 w-3.5 h-3.5 ml-3 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </Link>
                        ) : (
                            <Link
                                href={`/dining/${outlet.slug}`}
                                className="group relative inline-flex items-center justify-center px-8 py-3.5 border border-[var(--brand-primary-dark)] text-white overflow-hidden transition-colors duration-300 bg-[var(--brand-primary-dark)]"
                            >
                                <span className="absolute inset-0 w-full h-full bg-black origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out z-0" />
                                <span className="relative z-10 text-[11px] tracking-[0.24em] uppercase font-normal">View Details</span>
                                <svg className="relative z-10 w-3.5 h-3.5 ml-3 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </Link>
                        )}
                        {outlet.slug !== 'in-room-dining' && (
                            <a
                                href="tel:+918075416514"
                                className="inline-flex items-center justify-center px-8 py-3.5 border border-[#D3C3A7] bg-[#FCFAF5] text-[#31403A] text-[11px] tracking-[0.24em] uppercase hover:bg-[#F1E9D9] transition-colors duration-300"
                            >
                                Reserve Table
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
