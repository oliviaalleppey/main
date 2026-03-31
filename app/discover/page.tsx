'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useCallback, useEffect } from 'react';

const EDITORIAL_STORIES = [
    {
        title: 'Where stillness is the luxury.',
        subtitle: 'Accommodation',
        description: 'Lake and canal view rooms with panoramic windows and curated amenities.',
        href: '/rooms',
    },
    {
        title: 'Celebrate where nature officiates.',
        subtitle: 'Wedding',
        description: 'From poolside vows to grand ballroom receptions, designed around your story.',
        href: '/wedding',
    },
    {
        title: 'Scale meets sophistication.',
        subtitle: 'Conference & Events',
        description: 'Boardrooms for 12 to ballrooms for 500, each backed by seamless service.',
        href: '/conference-events',
    },
];

const EXPERIENCES = [
    {
        title: 'The Spa at Olivia',
        description: 'Ayurvedic therapies and international treatments in a sanctuary of serenity.',
        href: '/wellness#spa',
    },
    {
        title: 'Kerala Cuisine',
        description: 'Authentic flavours crafted with locally sourced ingredients.',
        href: '/dining',
    },
    {
        title: 'Backwater Cruises',
        description: 'Drift through the serene backwaters of Alappuzha at golden hour.',
        href: '/discover',
    },
    {
        title: 'Yoga & Meditation',
        description: 'Sunrise sessions overlooking the backwaters with expert practitioners.',
        href: '/wellness#yoga',
    },
    {
        title: 'Lifestyle Membership',
        description: 'Year-round privileges across dining, wellness, stays, and events.',
        href: '/membership',
    },
];

function HorizontalScroller({ children }: { children: React.ReactNode }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 10);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        checkScroll();
        el.addEventListener('scroll', checkScroll, { passive: true });
        window.addEventListener('resize', checkScroll);
        return () => {
            el.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
        };
    }, [checkScroll]);

    const scroll = (direction: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;
        const amount = el.clientWidth * 0.7;
        el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    };

    return (
        <div className="relative group">
            <div
                ref={scrollRef}
                className="flex gap-5 md:gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {children}
            </div>

            {canScrollLeft && (
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                >
                    <ChevronLeft className="w-5 h-5 text-[var(--text-dark)]" />
                </button>
            )}
            {canScrollRight && (
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                >
                    <ChevronRight className="w-5 h-5 text-[var(--text-dark)]" />
                </button>
            )}
        </div>
    );
}

export default function DiscoverPage() {
    return (
        <main className="min-h-screen bg-[#FAF7F0] text-[var(--text-dark)] selection:bg-[var(--text-dark)] selection:text-white overflow-hidden">

            {/* === HERO: Fullscreen cinematic === */}
            <section className="relative h-[80vh] md:h-[90vh] w-full overflow-hidden bg-gradient-to-br from-[#1C2822] via-[#2A3B35] to-[#0F1A15]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--brand-primary)_0%,_transparent_60%)] opacity-20" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_#8C7A6B_0%,_transparent_50%)] opacity-15" />

                <div className="relative z-10 h-full flex flex-col justify-end items-start px-6 md:px-16 lg:px-24 pb-16 md:pb-24">
                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-[10px] md:text-[11px] tracking-[0.4em] uppercase text-white/70 mb-4"
                    >
                        Olivia Alleppey
                    </motion.p>
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.4 }}
                        className="font-serif text-[3.5rem] sm:text-[5rem] md:text-[7rem] lg:text-[8.5rem] leading-[0.85] text-white tracking-[-0.03em] max-w-4xl"
                    >
                        Discover
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className="mt-6 text-white/70 text-base md:text-lg max-w-lg leading-relaxed"
                    >
                        Every facet of Olivia — where refined hospitality meets the timeless beauty of Kerala.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 1.1 }}
                        className="mt-10 flex gap-4"
                    >
                        <Link
                            href="/book/search"
                            className="bg-white text-[var(--text-dark)] px-7 py-3 text-[10px] tracking-[0.25em] uppercase font-semibold hover:bg-white/90 transition-colors"
                        >
                            Book Now
                        </Link>
                        <Link
                            href="/rooms"
                            className="border border-white/70 text-white px-7 py-3 text-[10px] tracking-[0.25em] uppercase font-semibold hover:bg-white/10 transition-colors"
                        >
                            Explore Rooms
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* === EDITORIAL STORIES: Horizontal scroll === */}
            <section className="py-16 md:py-24 px-6 md:px-12 lg:px-16">
                <div className="max-w-[1400px] mx-auto">
                    <div className="flex items-end justify-between mb-10 md:mb-14">
                        <div>
                            <p className="text-[10px] tracking-[0.4em] uppercase text-[#9A8A72] mb-3">Stories</p>
                            <h2 className="font-serif text-[2.5rem] md:text-[3.5rem] leading-[0.95] tracking-[-0.02em]">
                                Discover Olivia
                            </h2>
                        </div>
                        <p className="hidden md:block text-[12px] text-[#9A8A72] tracking-[0.15em] uppercase">
                            Scroll to explore →
                        </p>
                    </div>

                    <HorizontalScroller>
                        {EDITORIAL_STORIES.map((story, idx) => (
                            <Link
                                key={story.title}
                                href={story.href}
                                className="group flex-shrink-0 w-[85vw] md:w-[55vw] lg:w-[42vw] snap-start"
                            >
                                <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1C2822] to-[#2A3B35]">
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--brand-primary)_0%,_transparent_60%)] opacity-15" />
                                    <div className="absolute bottom-0 left-0 p-7 md:p-9">
                                        <p className="text-[10px] tracking-[0.35em] uppercase text-white/70 mb-2">{story.subtitle}</p>
                                        <h3 className="font-serif text-[1.6rem] md:text-[2rem] text-white leading-tight max-w-sm">
                                            {story.title}
                                        </h3>
                                    </div>
                                </div>
                                <p className="mt-4 text-[14px] text-[#59544D] leading-relaxed max-w-md pl-1">
                                    {story.description}
                                </p>
                            </Link>
                        ))}
                    </HorizontalScroller>
                </div>
            </section>

            {/* === ACCOMMODATION: Large split feature === */}
            <section className="py-16 md:py-24">
                <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16">
                    <div className="flex flex-col lg:flex-row items-center gap-0">
                        <div className="lg:w-[55%] w-full">
                            <div className="aspect-[4/3] lg:aspect-[3/2] rounded-[32px] lg:rounded-[40px] bg-gradient-to-br from-[#1C2822] to-[#2A3B35] relative overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--brand-primary)_0%,_transparent_50%)] opacity-20" />
                            </div>
                        </div>
                        <div className="lg:w-[45%] w-full lg:pl-16 xl:pl-24 mt-10 lg:mt-0">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.7, delay: 0.2 }}
                            >
                                <p className="text-[10px] tracking-[0.4em] uppercase text-[#9A8A72] mb-5">Accommodation</p>
                                <h2 className="font-serif text-[2.8rem] md:text-[3.8rem] leading-[0.95] tracking-[-0.02em] mb-6">
                                    Where stillness<br />is the luxury.
                                </h2>
                                <p className="text-[#59544D] text-[15px] leading-[1.8] max-w-md mb-8">
                                    Lake and canal view rooms with panoramic windows, premium amenities, and the quiet pace of Alappuzha. Each stay is an invitation to slow down.
                                </p>
                                <Link href="/rooms" className="inline-flex items-center gap-3 group/link">
                                    <span className="text-[11px] tracking-[0.35em] uppercase font-semibold border-b border-[#C4BAA8] pb-1 group-hover/link:border-[var(--brand-primary)] transition-colors">
                                        View Rooms
                                    </span>
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* === WEDDING: Reversed split === */}
            <section className="py-16 md:py-24 bg-[var(--surface-soft)]/40">
                <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16">
                    <div className="flex flex-col lg:flex-row-reverse items-center gap-0">
                        <div className="lg:w-[55%] w-full">
                            <div className="aspect-[4/3] lg:aspect-[3/2] rounded-[32px] lg:rounded-[40px] bg-gradient-to-br from-[#1C2822] to-[#2A3B35] relative overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--brand-primary)_0%,_transparent_50%)] opacity-20" />
                            </div>
                        </div>
                        <div className="lg:w-[45%] w-full lg:pr-16 xl:pr-24 mt-10 lg:mt-0">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.7, delay: 0.2 }}
                            >
                                <p className="text-[10px] tracking-[0.4em] uppercase text-[#9A8A72] mb-5">Wedding</p>
                                <h2 className="font-serif text-[2.8rem] md:text-[3.8rem] leading-[0.95] tracking-[-0.02em] mb-6">
                                    Celebrate where<br />nature officiates.
                                </h2>
                                <p className="text-[#59544D] text-[15px] leading-[1.8] max-w-md mb-8">
                                    From poolside vows to grand ballroom receptions, our venues and planning team craft unforgettable wedding experiences at every scale.
                                </p>
                                <Link href="/wedding" className="inline-flex items-center gap-3 group/link">
                                    <span className="text-[11px] tracking-[0.35em] uppercase font-semibold border-b border-[#C4BAA8] pb-1 group-hover/link:border-[var(--brand-primary)] transition-colors">
                                        Plan Your Wedding
                                    </span>
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* === CONFERENCE: Full-bleed cinematic === */}
            <section className="relative h-[70vh] md:h-[80vh] w-full overflow-hidden bg-gradient-to-br from-[#1C2822] via-[#2A3B35] to-[#0F1A15]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--brand-primary)_0%,_transparent_60%)] opacity-15" />

                <div className="relative z-10 h-full flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-center px-6 max-w-3xl"
                    >
                        <p className="text-[10px] tracking-[0.4em] uppercase text-[var(--gold-accent)] mb-5">Conference & Events</p>
                        <h2 className="font-serif text-[3rem] sm:text-[4.5rem] md:text-[6rem] leading-[0.88] text-white tracking-[-0.03em] [text-shadow:0_2px_30px_rgba(0,0,0,0.5)]">
                            Scale meets<br />sophistication.
                        </h2>
                        <p className="mt-6 text-white/70 text-[15px] leading-relaxed max-w-xl mx-auto">
                            Boardrooms for 12 to ballrooms for 500 — each backed by seamless service and AV support.
                        </p>
                        <Link
                            href="/conference-events"
                            className="mt-10 inline-flex items-center gap-3 border border-white/60 px-8 py-3 text-[10px] tracking-[0.3em] uppercase font-semibold text-white hover:bg-white hover:text-[var(--text-dark)] transition-all duration-300"
                        >
                            Explore Venues
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* === EXPERIENCES: Horizontal scroll cards === */}
            <section className="py-16 md:py-24 px-6 md:px-12 lg:px-16">
                <div className="max-w-[1400px] mx-auto">
                    <div className="flex items-end justify-between mb-10 md:mb-14">
                        <div>
                            <p className="text-[10px] tracking-[0.4em] uppercase text-[#9A8A72] mb-3">Experiences</p>
                            <h2 className="font-serif text-[2.5rem] md:text-[3.5rem] leading-[0.95] tracking-[-0.02em]">
                                A world awaits
                            </h2>
                        </div>
                        <p className="hidden md:block text-[12px] text-[#9A8A72] tracking-[0.15em] uppercase">
                            Scroll to explore →
                        </p>
                    </div>

                    <HorizontalScroller>
                        {EXPERIENCES.map((exp) => (
                            <Link
                                key={exp.title}
                                href={exp.href}
                                className="group flex-shrink-0 w-[70vw] sm:w-[50vw] md:w-[35vw] lg:w-[26vw] snap-start"
                            >
                                <div className="relative aspect-[3/4] overflow-hidden rounded-[24px] bg-gradient-to-br from-[#1C2822] to-[#2A3B35]">
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--brand-primary)_0%,_transparent_50%)] opacity-15" />
                                    <div className="absolute bottom-0 left-0 p-6 md:p-7">
                                        <h3 className="font-serif text-[1.3rem] md:text-[1.5rem] text-white leading-tight mb-1">
                                            {exp.title}
                                        </h3>
                                        <p className="text-[12px] text-white/65 leading-relaxed max-w-[200px]">
                                            {exp.description}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </HorizontalScroller>
                </div>
            </section>

            {/* === MEMBERSHIP: Large split feature === */}
            <section className="relative overflow-hidden">
                <div className="py-16 md:py-24">
                    <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16">
                        <div className="flex flex-col lg:flex-row items-center gap-0">
                            <div className="lg:w-[55%] w-full">
                                <div className="aspect-[4/3] lg:aspect-[3/2] rounded-[32px] lg:rounded-[40px] bg-gradient-to-br from-[#1C2822] to-[#2A3B35] relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--brand-primary)_0%,_transparent_50%)] opacity-20" />
                                </div>
                            </div>
                            <div className="lg:w-[45%] w-full lg:pl-16 xl:pl-24 mt-10 lg:mt-0">
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.7, delay: 0.2 }}
                                >
                                    <p className="text-[10px] tracking-[0.4em] uppercase text-[#9A8A72] mb-5">Membership</p>
                                    <h2 className="font-serif text-[2.8rem] md:text-[3.8rem] leading-[0.95] tracking-[-0.02em] mb-6">
                                        For those<br />who belong.
                                    </h2>
                                    <p className="text-[#59544D] text-[15px] leading-[1.8] max-w-md mb-8">
                                        Year-round dining, wellness, stay, and event privileges — crafted for a select circle of members who expect more.
                                    </p>
                                    <Link href="/membership" className="inline-flex items-center gap-3 group/link">
                                        <span className="text-[11px] tracking-[0.35em] uppercase font-semibold border-b border-[#C4BAA8] pb-1 group-hover/link:border-[var(--brand-primary)] transition-colors">
                                            Explore Membership
                                        </span>
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                                    </Link>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* === CLOSING CTA === */}
            <section className="py-20 md:py-28 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <p className="text-[10px] tracking-[0.4em] uppercase text-[#9A8A72] mb-5">Begin Your Stay</p>
                        <h2 className="font-serif text-[2.5rem] md:text-[3.5rem] leading-[0.95] tracking-[-0.02em] mb-6">
                            Your story at Olivia<br />starts here.
                        </h2>
                        <p className="text-[#59544D] text-[15px] leading-[1.8] max-w-lg mx-auto mb-10">
                            Check availability, choose your room, and reserve in moments — without leaving the calm of this page.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/book/search"
                                className="inline-flex items-center justify-center bg-[var(--text-dark)] text-white px-8 py-3.5 text-[10px] tracking-[0.25em] uppercase font-semibold hover:bg-[#333333] transition-colors"
                            >
                                Check Availability
                            </Link>
                            <Link
                                href="/contact"
                                className="inline-flex items-center justify-center border border-[var(--text-dark)]/20 px-8 py-3.5 text-[10px] tracking-[0.25em] uppercase font-semibold hover:bg-white/60 transition-colors"
                            >
                                Contact Us
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

        </main>
    );
}
