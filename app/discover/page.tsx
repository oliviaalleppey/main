'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import React from 'react';

export default function DiscoverPage() {
    const experiences = [
        {
            title: 'Backwater Serenity',
            subtitle: 'Tranquil Escapes',
            description: 'Drift through the serene backwaters of Alappuzha, where time slows and nature whispers ancient stories',
            image: '',
        },
        {
            title: 'Ayurvedic Wellness',
            subtitle: 'Ancient Healing',
            description: 'Experience the transformative power of authentic Ayurvedic treatments in our world-class wellness center',
            image: '',
        },
        {
            title: 'Culinary Journey',
            subtitle: 'Farm to Table',
            description: 'Savor the rich flavors of Kerala cuisine, crafted with locally-sourced ingredients and centuries-old recipes',
            image: '',
        },
        {
            title: 'Cultural Heritage',
            subtitle: 'Living Traditions',
            description: 'Immerse yourself in Kerala\'s vibrant cultural tapestry through traditional art forms and local experiences',
            image: '',
        },
    ];

    return (
        <div className="min-h-screen bg-[#F3EEE4] text-[var(--text-dark)] selection:bg-[var(--text-dark)] selection:text-white">

            {/* HERO: Compact style like rooms page */}
            <section className="relative h-[44vh] md:h-[52vh] w-full overflow-hidden">
                <motion.div
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 8, ease: "easeOut" }}
                    className="absolute inset-0 z-0"
                >
                    {/* Dark gradient background like rooms page hero */}
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--brand-primary-deep)_0%,var(--brand-primary-dark)_38%,var(--brand-primary-deep)_100%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_25%_30%,rgba(231,212,173,0.12)_0%,rgba(231,212,173,0)_60%)]" />
                </motion.div>

                <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex items-center gap-4 mb-3"
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
                        className="text-[3.5rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[8rem] font-serif font-medium text-white mb-5 tracking-[-0.02em] leading-[0.92] [text-shadow:0_2px_22px_rgba(0,0,0,0.55)]"
                    >
                        Discover
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className="flex gap-3"
                    >
                        <Link
                            href="/book/search"
                            className="border border-white/90 bg-white text-[#2D3933] px-6 py-2.5 text-[10px] tracking-[0.22em] uppercase font-semibold shadow-[0_18px_40px_-28px_rgba(0,0,0,0.65)] hover:bg-white/95 transition-colors duration-300"
                        >
                            Explore & Book
                        </Link>
                        <Link
                            href="/contact"
                            className="border border-white/85 bg-black/20 text-white px-6 py-2.5 text-[10px] tracking-[0.22em] uppercase font-semibold backdrop-blur-sm hover:bg-black/30 transition-colors duration-300"
                        >
                            Contact now
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* CHAPTERS: clean rhythm, no split-template */}
            <section id="heritage" className="pt-14 md:pt-18">
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="grid lg:grid-cols-12 gap-6 md:gap-8 items-start">
                        <div className="lg:col-span-4">
                            <div className="rounded-[28px] border border-[#E2D7C7] bg-[#FBF8F2] p-7 md:p-8">
                                <p className="text-[10px] tracking-[0.36em] uppercase text-[#6B645C]">Chapter 01</p>
                                <h2 className="mt-4 font-serif text-[2.1rem] md:text-[2.6rem] leading-[1.02]">
                                    A legacy of refined hospitality.
                                </h2>
                                <p className="mt-4 text-[#59544D] leading-relaxed">
                                    Nestled along the tranquil backwaters of Alappuzha, Olivia Alleppey, a 5 Star Classified Hotel, was born from a vision to create a sanctuary where Kerala&apos;s rich heritage meets contemporary luxury.
                                </p>
                            </div>

                            <div className="mt-5 rounded-[28px] border border-[#E2D7C7] bg-[#FDFBF7] p-7 md:p-8">
                                <p className="text-[10px] tracking-[0.36em] uppercase text-[#6B645C]">Setting</p>
                                <p className="mt-3 font-medium">Alappuzha backwaters</p>
                                <p className="mt-2 text-[#59544D] text-sm leading-relaxed">
                                    Water, palms, and a slower rhythm — the backdrop to a more intentional stay.
                                </p>
                            </div>

                            <div className="mt-5 rounded-[28px] border border-[#E2D7C7] bg-[#FBF8F2] p-7 md:p-8">
                                <p className="text-[10px] tracking-[0.36em] uppercase text-[#6B645C]">Signature moments</p>
                                <div className="mt-4 space-y-3 text-sm text-[#59544D]">
                                    <div className="flex items-start justify-between gap-4">
                                        <p className="leading-relaxed">Sunrise on the water</p>
                                        <span className="text-[10px] tracking-[0.26em] uppercase text-[#6B645C]">Quiet</span>
                                    </div>
                                    <div className="h-px bg-[#E2D7C7]" aria-hidden />
                                    <div className="flex items-start justify-between gap-4">
                                        <p className="leading-relaxed">Ayurvedic restoration</p>
                                        <span className="text-[10px] tracking-[0.26em] uppercase text-[#6B645C]">Slow</span>
                                    </div>
                                    <div className="h-px bg-[#E2D7C7]" aria-hidden />
                                    <div className="flex items-start justify-between gap-4">
                                        <p className="leading-relaxed">Kerala cuisine, refined</p>
                                        <span className="text-[10px] tracking-[0.26em] uppercase text-[#6B645C]">Local</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-8">
                            <div className="rounded-[34px] border border-[#E2D7C7] bg-[#FDFBF7] overflow-hidden">
                                <div className="relative h-[320px] md:h-[420px] lg:h-[520px] bg-[var(--surface-soft)] flex items-center justify-center">
                                    <p className="text-[#8D8378] text-sm">Olivia Heritage</p>
                                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.10)_0%,rgba(0,0,0,0)_52%,rgba(0,0,0,0.08)_100%)]" />
                                </div>
                                <div className="p-7 md:p-10 lg:p-12">
                                    <div className="space-y-4 text-[#59544D] leading-relaxed">
                                        <p>
                                            Inspired by the timeless charm of God&apos;s Own Country, Olivia was designed to be more than just a destination. It is an experience where elegance, comfort, and nature exist in perfect harmony. From the gentle rhythm of the backwaters to the warm hospitality that welcomes every guest, each moment at Olivia reflects the spirit of Kerala.
                                        </p>
                                        <p>
                                            Since our inception, we have been dedicated to crafting meaningful experiences for discerning travelers who seek both serenity and sophistication. Every detail, from our thoughtfully designed architecture to our personalized service philosophy, celebrates the cultural essence of Kerala while embracing modern refinement.
                                        </p>
                                        <p>
                                            At Olivia Alleppey, tradition flows gracefully into luxury, creating a place where every stay becomes a story of comfort, beauty, and unforgettable memories.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="philosophy" className="pt-14 md:pt-18">
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="rounded-[34px] border border-[#E2D7C7] bg-[#FBF8F2] p-7 md:p-10 lg:p-12">
                        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                            <div className="max-w-2xl">
                                <p className="text-[10px] tracking-[0.36em] uppercase text-[#6B645C]">Chapter 02</p>
                                <h2 className="mt-4 font-serif text-[2.25rem] md:text-[3.5rem] leading-[0.98]">
                                    The Olivia philosophy.
                                </h2>
                                <p className="mt-4 text-[#59544D] text-base md:text-lg leading-relaxed">
                                    A lighter pace, a clearer sense of place, and service that feels intuitive rather than performative.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-[#E2D7C7] bg-[#FDFBF7] px-6 py-5">
                                <p className="text-[10px] tracking-[0.32em] uppercase text-[#6B645C]">In three words</p>
                                <p className="mt-2 font-serif text-2xl leading-none">Quiet. Natural. Unhurried.</p>
                            </div>
                        </div>

                        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                            {[
                                {
                                    subtitle: 'Tranquil Escapes',
                                    title: 'Backwater Serenity',
                                    description: 'Experience the peaceful rhythm of life along Kerala\'s legendary waterways',
                                },
                                {
                                    subtitle: 'Ancient Healing',
                                    title: 'Ayurvedic Wellness',
                                    description: 'Discover holistic rejuvenation through time-honored Ayurvedic practices',
                                },
                                {
                                    subtitle: 'Farm to Table',
                                    title: 'Culinary Journey',
                                    description: 'Savor authentic Kerala flavors crafted with locally-sourced ingredients',
                                },
                                {
                                    subtitle: 'Living Traditions',
                                    title: 'Cultural Heritage',
                                    description: 'Immerse yourself in Kerala\'s vibrant arts, dance, and traditions',
                                },
                            ].map((item) => (
                                <div
                                    key={item.title}
                                    className="rounded-[22px] border border-[#E2D7C7] bg-[#FDFBF7] p-6"
                                >
                                    <p className="text-[10px] tracking-[0.28em] uppercase text-[#6B645C]">
                                        {item.subtitle}
                                    </p>
                                    <h3 className="mt-3 font-serif font-semibold text-[1.65rem] leading-tight">
                                        {item.title}
                                    </h3>
                                    <p className="mt-3 text-sm text-[#59544D] leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* EXPERIENCES */}
            <section className="pt-14 md:pt-18 pb-14 md:pb-18">
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                        <div className="max-w-3xl">
                            <p className="text-[10px] tracking-[0.36em] uppercase text-[#6B645C]">Discover Kerala</p>
                            <h2 className="mt-4 font-serif text-[2.25rem] md:text-[3.6rem] leading-[0.98]">
                                Moments, curated with restraint.
                            </h2>
                            <p className="mt-3 text-[#59544D] text-base md:text-lg leading-relaxed">
                                Immerse yourself in the essence of God&apos;s Own Country.
                            </p>
                        </div>
                        <Link
                            href="/experiences"
                            className="inline-flex items-center gap-3 text-[var(--text-dark)] hover:opacity-80 transition-opacity"
                        >
                            <span className="text-[11px] tracking-[0.36em] uppercase border-b border-[#BDB6AD] pb-1 hover:border-[var(--text-dark)] transition-colors">
                                View all experiences
                            </span>
                            <span aria-hidden className="text-lg leading-none">→</span>
                        </Link>
                    </div>

                    <div className="mt-8 grid lg:grid-cols-12 gap-4 md:gap-5">
                        {experiences.map((exp, idx) => (
                            <article
                                key={exp.title}
                                className={[
                                    'group overflow-hidden rounded-[34px] border border-[#E2D7C7] bg-[#FBF8F2] hover:bg-[#FDFBF7] transition-colors',
                                    idx === 0 ? 'lg:col-span-7' : 'lg:col-span-5',
                                ].join(' ')}
                            >
                                <div className="h-[240px] md:h-[290px] lg:h-[320px] bg-[var(--surface-soft)]" />
                                <div className="p-7 md:p-8 lg:p-10">
                                    <p className="text-[10px] tracking-[0.32em] uppercase text-[#6B645C]">{exp.subtitle}</p>
                                    <h3 className="mt-3 font-serif font-semibold text-[2.1rem] leading-tight">
                                        {exp.title}
                                    </h3>
                                    <p className="mt-3 text-[#59544D] leading-relaxed">{exp.description}</p>
                                    <div className="mt-7 inline-flex items-center gap-3 text-[var(--text-dark)] opacity-70 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[11px] tracking-[0.36em] uppercase border-b border-[#BDB6AD] pb-1 group-hover:border-[var(--text-dark)] transition-colors">
                                            Explore
                                        </span>
                                        <span aria-hidden className="text-lg leading-none">→</span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className="mt-10 rounded-[34px] border border-[#E2D7C7] bg-[#FBF8F2] p-8 md:p-10 lg:p-12">
                        <div className="grid lg:grid-cols-12 gap-6 md:gap-8 items-center">
                            <div className="lg:col-span-7">
                                <p className="text-[10px] tracking-[0.36em] uppercase text-[#6B645C]">A quieter way to arrive</p>
                                <p className="mt-4 font-serif text-[1.9rem] md:text-[2.5rem] leading-[1.05]">
                                    The most luxurious stays feel effortless — the details simply fall into place.
                                </p>
                                <p className="mt-4 text-[#59544D] leading-relaxed">
                                    Browse rooms, check availability, and reserve in moments — without leaving the calm of the page.
                                </p>
                            </div>
                            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3">
                                <Link
                                    href="/rooms"
                                    className="inline-flex items-center justify-center rounded-xl bg-[var(--text-dark)] px-8 py-3.5 text-white text-[11px] font-semibold tracking-[0.18em] uppercase hover:bg-[#333333] transition-colors"
                                >
                                    View rooms
                                </Link>
                                <Link
                                    href="/book/search"
                                    className="inline-flex items-center justify-center rounded-xl border border-[#CFC6BA] bg-transparent px-8 py-3.5 text-[var(--text-dark)] text-[11px] tracking-[0.18em] uppercase hover:bg-white/60 transition-colors"
                                >
                                    Check availability
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
