'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useCallback, useEffect } from 'react';

// ─── Data ─────────────────────────────────────────────────────────────────────

const STATS = [
    { value: '88', label: 'Rooms & Suites' },
    { value: '6', label: 'Dining Outlets' },
    { value: '550', label: 'Guest Ballroom' },
    { value: '40+', label: 'Spa Treatments' },
    { value: '5', label: 'Wellness Spaces' },
    { value: '9', label: 'Event Venues' },
];

const DINING_OUTLETS = [
    {
        name: 'Finishing Point',
        type: 'All-Day Dining',
        hours: '7:00 – 23:00',
        capacity: '94 Guests',
        description: 'The heart of the hotel — a vibrant all-day restaurant serving local Kerala cuisine and global favourites.',
        status: 'open',
    },
    {
        name: 'Brew & Bite',
        type: 'Coffee & Snacks',
        hours: '24 Hours',
        capacity: '24 Guests',
        description: 'A relaxed lounge for artisan coffee, light bites, and unhurried conversations at any hour.',
        status: 'open',
    },
    {
        name: 'Aqua Pool Lounge',
        type: 'Poolside',
        hours: '7:00 – 19:00',
        capacity: '24 Guests',
        description: 'Refreshing beverages and poolside snacks beside the Atrium infinity pool on the 3rd floor.',
        status: 'open',
    },
    {
        name: 'In-Room Dining',
        type: 'Room Service',
        hours: '24 Hours',
        capacity: '88 Rooms',
        description: 'Curated menus delivered to your room around the clock — local comfort or international classics.',
        status: 'open',
    },
    {
        name: 'Club 9',
        type: 'Evening Lounge',
        hours: '11:00 – 23:00',
        capacity: '44 Guests',
        description: 'A stylish 1st floor lounge for evening cocktails and beverages in an intimate setting.',
        status: 'soon',
    },
    {
        name: 'Kaayal',
        type: 'Live Seafood',
        hours: '19:00 – 23:00',
        capacity: '72 Guests',
        description: 'A dedicated seafood concept on the 3rd floor — global and local preparations of the freshest catch.',
        status: 'soon',
    },
];

const WEDDING_PACKAGES = [
    {
        name: 'Intimate Wedding',
        guests: '40 – 80 Guests',
        highlights: ['Poolside vows', 'Curated plated dinner', 'One-night couple suite'],
    },
    {
        name: 'Classic Destination',
        guests: '120 – 220 Guests',
        highlights: ['Two event venues', 'Sangeet + wedding day', 'On-site wedding manager'],
    },
    {
        name: 'Full Wedding Weekend',
        guests: '250 – 400 Guests',
        highlights: ['Three-day itinerary', 'Large banquet setup', 'Full guest coordination'],
    },
];

const WEDDING_VENUES = [
    { name: 'Grand Ballroom', capacity: 'Up to 550 Guests', area: '5,500 sq ft' },
    { name: 'Forum Hall', capacity: 'Up to 180 Guests', area: '2,000 sq ft' },
    { name: 'Pool Side Venue', capacity: 'Up to 200 Guests', area: '3,200 sq ft' },
];

const WELLNESS_HIGHLIGHTS = [
    {
        name: 'The Spa at Olivia',
        subtitle: 'Ayurvedic & International Therapies',
        detail: '40+ treatments across Abhayangam, Kizhi, Body Spa, Body Treatments, and Facial Packages.',
        href: '/wellness#spa',
    },
    {
        name: 'Atrium Pool',
        subtitle: 'Swim with a View',
        detail: 'Temperature-controlled infinity pool with poolside cabanas and sunset swimming hours.',
        href: '/wellness#pool',
    },
    {
        name: 'Fitness Centre',
        subtitle: 'State-of-the-Art Training',
        detail: 'Technogym cardio, free weights, functional training, Pilates studio, and spin classes.',
        href: '/wellness#gym',
    },
    {
        name: 'Steam & Sauna',
        subtitle: 'Purify. Restore. Renew.',
        detail: 'Eucalyptus steam room, Finnish dry sauna, contrast therapy, and Himalayan salt room.',
        href: '/wellness#steam',
    },
    {
        name: 'Yoga & Meditation',
        subtitle: 'Find Your Inner Peace',
        detail: 'Daily sessions from sunrise Hatha yoga to sunset meditation, led by expert practitioners.',
        href: '/wellness#yoga',
    },
];

const EXPERIENCES = [
    {
        title: 'The Spa at Olivia',
        tag: 'Wellness',
        description: 'Ayurvedic therapies and international treatments in a sanctuary of serenity.',
        href: '/wellness#spa',
    },
    {
        title: 'Kerala Cuisine',
        tag: 'Dining',
        description: 'Authentic flavours crafted with locally sourced ingredients at Finishing Point.',
        href: '/dining',
    },
    {
        title: 'Backwater Cruises',
        tag: 'Experiences',
        description: 'Drift through the serene backwaters of Alappuzha at golden hour.',
        href: '/contact',
    },
    {
        title: 'Yoga & Meditation',
        tag: 'Wellness',
        description: 'Sunrise sessions overlooking the backwaters with expert practitioners.',
        href: '/wellness#yoga',
    },
    {
        title: 'Lifestyle Membership',
        tag: 'Membership',
        description: 'Year-round privileges across dining, wellness, stays, and events.',
        href: '/membership',
    },
];

// ─── Horizontal Scroller ──────────────────────────────────────────────────────

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
        el.scrollBy({ left: direction === 'left' ? -(el.clientWidth * 0.7) : el.clientWidth * 0.7, behavior: 'smooth' });
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
                <button onClick={() => scroll('left')} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
                    <ChevronLeft className="w-5 h-5 text-[var(--text-dark)]" />
                </button>
            )}
            {canScrollRight && (
                <button onClick={() => scroll('right')} className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
                    <ChevronRight className="w-5 h-5 text-[var(--text-dark)]" />
                </button>
            )}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
    return (
        <main className="min-h-screen bg-[#FAF7F0] text-[var(--text-dark)] overflow-hidden">

            {/* ── Hero (unchanged) ──────────────────────────────────────── */}
            <section className="relative h-[80vh] md:h-[90vh] w-full overflow-hidden bg-gradient-to-br from-[#1C2822] via-[#2A3B35] to-[#0F1A15]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--brand-primary)_0%,_transparent_60%)] opacity-20" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_#8C7A6B_0%,_transparent_50%)] opacity-15" />
                <div className="relative z-10 h-full flex flex-col justify-end items-start px-6 md:px-16 lg:px-24 pb-16 md:pb-24">
                    <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-[10px] md:text-[11px] tracking-[0.4em] uppercase text-white/70 mb-4">
                        Olivia Alleppey
                    </motion.p>
                    <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.4 }} className="font-serif text-[3.5rem] sm:text-[5rem] md:text-[7rem] lg:text-[8.5rem] leading-[0.85] text-white tracking-[-0.03em] max-w-4xl">
                        Discover
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }} className="mt-6 text-white/70 text-base md:text-lg max-w-lg leading-relaxed">
                        Every facet of Olivia — where refined hospitality meets the timeless beauty of Kerala.
                    </motion.p>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 1.1 }} className="mt-10 flex gap-4">
                        <Link href="/book/search" className="bg-white text-[var(--text-dark)] px-7 py-3 text-[10px] tracking-[0.25em] uppercase font-semibold hover:bg-white/90 transition-colors">
                            Book Now
                        </Link>
                        <Link href="/rooms" className="border border-white/70 text-white px-7 py-3 text-[10px] tracking-[0.25em] uppercase font-semibold hover:bg-white/10 transition-colors">
                            Explore Rooms
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* ── Stats Strip ───────────────────────────────────────────── */}
            <section className="bg-[#1C2822] py-10 px-6 md:px-12">
                <div className="max-w-[1400px] mx-auto">
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-8 text-center">
                        {STATS.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.07 }}
                            >
                                <p className="font-serif text-[2rem] md:text-[2.5rem] text-white leading-none">{stat.value}</p>
                                <p className="text-[10px] tracking-[0.2em] uppercase text-white/45 mt-2">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Dining ────────────────────────────────────────────────── */}
            <section className="py-16 md:py-24 bg-[#F4F0E8] px-6 md:px-12 lg:px-16">
                <div className="max-w-[1400px] mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                        <div>
                            <p className="text-[10px] tracking-[0.4em] uppercase text-[#9A8A72] mb-3">Dining</p>
                            <h2 className="font-serif text-[2.5rem] md:text-[3.5rem] leading-[0.95] tracking-[-0.02em]">
                                Six ways to<br />savour Olivia.
                            </h2>
                        </div>
                        <p className="text-[#59544D] text-[15px] leading-[1.8] max-w-sm">
                            From all-day dining to live seafood, poolside cocktails to in-room midnight snacks — every craving, covered.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {DINING_OUTLETS.map((outlet, i) => (
                            <motion.div
                                key={outlet.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.07 }}
                                className="bg-white border border-[#E8E1D6] p-7 flex flex-col gap-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-serif font-bold text-[1.3rem] text-[var(--text-dark)] leading-tight">{outlet.name}</p>
                                        <p className="text-[11px] tracking-[0.15em] uppercase text-[var(--gold-accent-dark)] mt-1">{outlet.type}</p>
                                    </div>
                                    {outlet.status === 'soon' && (
                                        <span className="text-[9px] tracking-[0.2em] uppercase bg-[var(--surface-soft)] text-[#9A8A72] px-2.5 py-1 shrink-0">
                                            Opening Soon
                                        </span>
                                    )}
                                </div>
                                <p className="text-[#59544D] text-sm leading-relaxed flex-1">{outlet.description}</p>
                                <div className="flex gap-5 pt-3 border-t border-[#EEE8DF]">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.15em] text-[#9A8A72]">Hours</p>
                                        <p className="text-sm text-[var(--text-dark)] mt-0.5">{outlet.hours}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.15em] text-[#9A8A72]">Capacity</p>
                                        <p className="text-sm text-[var(--text-dark)] mt-0.5">{outlet.capacity}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-10 text-center">
                        <Link href="/dining" className="inline-flex items-center gap-3 group/link">
                            <span className="text-[11px] tracking-[0.35em] uppercase font-semibold border-b border-[#C4BAA8] pb-1 group-hover/link:border-[var(--brand-primary)] transition-colors">
                                Explore All Dining
                            </span>
                            <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Wedding ───────────────────────────────────────────────── */}
            <section className="py-16 md:py-24 px-6 md:px-12 lg:px-16">
                <div className="max-w-[1400px] mx-auto">
                    <div className="flex flex-col lg:flex-row-reverse items-start gap-16">
                        {/* Right: image placeholder */}
                        <div className="lg:w-[45%] w-full shrink-0">
                            <div className="aspect-[4/3] rounded-[32px] lg:rounded-[40px] bg-gradient-to-br from-[#1C2822] to-[#2A3B35] relative overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--brand-primary)_0%,_transparent_50%)] opacity-20" />
                                <div className="absolute inset-0 flex items-end p-8">
                                    <div className="space-y-2 w-full">
                                        {WEDDING_VENUES.map(v => (
                                            <div key={v.name} className="flex justify-between items-center bg-white/8 backdrop-blur-sm border border-white/10 px-4 py-3">
                                                <p className="text-white text-sm font-medium">{v.name}</p>
                                                <div className="text-right">
                                                    <p className="text-white/80 text-xs">{v.capacity}</p>
                                                    <p className="text-white/45 text-[10px]">{v.area}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Left: content */}
                        <div className="lg:w-[55%] w-full">
                            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
                                <p className="text-[10px] tracking-[0.4em] uppercase text-[#9A8A72] mb-5">Wedding</p>
                                <h2 className="font-serif text-[2.8rem] md:text-[3.8rem] leading-[0.95] tracking-[-0.02em] mb-6">
                                    Celebrate where<br />nature officiates.
                                </h2>
                                <p className="text-[#59544D] text-[15px] leading-[1.8] mb-10">
                                    Three venues, three scales of celebration — backed by a single point wedding manager, menu tasting, and meticulous day-of coordination.
                                </p>

                                <div className="space-y-3 mb-10">
                                    {WEDDING_PACKAGES.map((pkg, i) => (
                                        <div key={pkg.name} className="flex gap-5 p-5 border border-[#E4DDD4] bg-white hover:border-[#C4BAA8] transition-colors">
                                            <div className="w-7 h-7 rounded-full bg-[#1C2822] text-white flex items-center justify-center text-xs font-serif shrink-0 mt-0.5">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-baseline gap-3 mb-2.5">
                                                    <p className="font-serif text-[1.1rem] text-[var(--text-dark)]">{pkg.name}</p>
                                                    <span className="text-[10px] text-[#9A8A72] uppercase tracking-[0.15em] border border-[#E4DDD4] px-2 py-0.5">{pkg.guests}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                                                    {pkg.highlights.map(h => (
                                                        <span key={h} className="text-[12px] text-[#59544D] flex items-center gap-1.5">
                                                            <span className="w-1 h-1 rounded-full bg-[var(--gold-accent)] shrink-0" />
                                                            {h}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

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

            {/* ── Conference (unchanged) ────────────────────────────────── */}
            <section className="relative h-[70vh] md:h-[80vh] w-full overflow-hidden bg-gradient-to-br from-[#1C2822] via-[#2A3B35] to-[#0F1A15]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--brand-primary)_0%,_transparent_60%)] opacity-15" />
                <div className="relative z-10 h-full flex items-center justify-center">
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }} className="text-center px-6 max-w-3xl">
                        <p className="text-[10px] tracking-[0.4em] uppercase text-[var(--gold-accent)] mb-5">Conference & Events</p>
                        <h2 className="font-serif text-[3rem] sm:text-[4.5rem] md:text-[6rem] leading-[0.88] text-white tracking-[-0.03em] [text-shadow:0_2px_30px_rgba(0,0,0,0.5)]">
                            Scale meets<br />sophistication.
                        </h2>
                        <p className="mt-6 text-white/70 text-[15px] leading-relaxed max-w-xl mx-auto">
                            9 venues — boardrooms for 12 to a ballroom for 550 — each backed by AV support, dedicated event managers, and seamless F&B service.
                        </p>
                        <div className="mt-8 flex flex-wrap justify-center gap-6">
                            {[['9', 'Event Venues'], ['550', 'Max Capacity'], ['5,035 sq ft', 'Grand Ballroom']].map(([val, lbl]) => (
                                <div key={lbl} className="text-center">
                                    <p className="font-serif text-[1.8rem] text-white">{val}</p>
                                    <p className="text-[10px] tracking-[0.2em] uppercase text-white/45 mt-1">{lbl}</p>
                                </div>
                            ))}
                        </div>
                        <Link href="/conference-events" className="mt-10 inline-flex items-center gap-3 border border-white/60 px-8 py-3 text-[10px] tracking-[0.3em] uppercase font-semibold text-white hover:bg-white hover:text-[var(--text-dark)] transition-all duration-300">
                            Explore Venues
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* ── Wellness ──────────────────────────────────────────────── */}
            <section className="py-16 md:py-24 px-6 md:px-12 lg:px-16">
                <div className="max-w-[1400px] mx-auto">
                    <div className="flex flex-col lg:flex-row items-start gap-16">
                        {/* Left: content */}
                        <div className="lg:w-[40%] w-full shrink-0">
                            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
                                <p className="text-[10px] tracking-[0.4em] uppercase text-[#9A8A72] mb-5">Wellness</p>
                                <h2 className="font-serif text-[2.8rem] md:text-[3.8rem] leading-[0.95] tracking-[-0.02em] mb-6">
                                    Ancient healing.<br />Timeless renewal.
                                </h2>
                                <p className="text-[#59544D] text-[15px] leading-[1.8] mb-8">
                                    Five wellness spaces rooted in Kerala's Ayurvedic heritage — from 40+ spa treatments to sunrise yoga over the backwaters.
                                </p>
                                <div className="flex gap-8 mb-10">
                                    <div>
                                        <p className="font-serif text-[2rem] text-[var(--text-dark)]">40+</p>
                                        <p className="text-[11px] tracking-[0.15em] uppercase text-[#9A8A72] mt-1">Treatments</p>
                                    </div>
                                    <div>
                                        <p className="font-serif text-[2rem] text-[var(--text-dark)]">8</p>
                                        <p className="text-[11px] tracking-[0.15em] uppercase text-[#9A8A72] mt-1">Therapists</p>
                                    </div>
                                    <div>
                                        <p className="font-serif text-[2rem] text-[var(--text-dark)]">5</p>
                                        <p className="text-[11px] tracking-[0.15em] uppercase text-[#9A8A72] mt-1">Spaces</p>
                                    </div>
                                </div>
                                <Link href="/wellness" className="inline-flex items-center gap-3 group/link">
                                    <span className="text-[11px] tracking-[0.35em] uppercase font-semibold border-b border-[#C4BAA8] pb-1 group-hover/link:border-[var(--brand-primary)] transition-colors">
                                        Explore Wellness
                                    </span>
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                                </Link>
                            </motion.div>
                        </div>

                        {/* Right: 5 wellness cards */}
                        <div className="lg:w-[60%] w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {WELLNESS_HIGHLIGHTS.map((item, i) => (
                                <motion.div
                                    key={item.name}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.07 }}
                                >
                                    <Link href={item.href} className="group block bg-white border border-[#E8E1D6] p-6 hover:border-[var(--gold-accent)]/50 transition-colors">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-serif text-[1.1rem] text-[var(--text-dark)]">{item.name}</p>
                                                <p className="text-[11px] tracking-[0.15em] uppercase text-[var(--gold-accent-dark)] mt-0.5">{item.subtitle}</p>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-[#C4BAA8] group-hover:text-[var(--brand-primary)] group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                                        </div>
                                        <p className="text-[#59544D] text-sm leading-relaxed">{item.detail}</p>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Experiences ───────────────────────────────────────────── */}
            <section className="py-16 md:py-24 bg-[#F4F0E8] px-6 md:px-12 lg:px-16">
                <div className="max-w-[1400px] mx-auto">
                    <div className="flex items-end justify-between mb-10 md:mb-14">
                        <div>
                            <p className="text-[10px] tracking-[0.4em] uppercase text-[#9A8A72] mb-3">Experiences</p>
                            <h2 className="font-serif text-[2.5rem] md:text-[3.5rem] leading-[0.95] tracking-[-0.02em]">
                                A world awaits
                            </h2>
                        </div>
                        <p className="hidden md:block text-[12px] text-[#9A8A72] tracking-[0.15em] uppercase">Scroll to explore →</p>
                    </div>
                    <HorizontalScroller>
                        {EXPERIENCES.map((exp) => (
                            <Link key={exp.title} href={exp.href} className="group flex-shrink-0 w-[70vw] sm:w-[50vw] md:w-[35vw] lg:w-[26vw] snap-start">
                                <div className="relative aspect-[3/4] overflow-hidden rounded-[24px] bg-gradient-to-br from-[#1C2822] to-[#2A3B35]">
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--brand-primary)_0%,_transparent_50%)] opacity-15" />
                                    <div className="absolute top-5 left-5">
                                        <span className="text-[9px] tracking-[0.25em] uppercase text-white/60 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                                            {exp.tag}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-0 left-0 p-6 md:p-7">
                                        <h3 className="font-serif text-[1.3rem] md:text-[1.5rem] text-white leading-tight mb-2">{exp.title}</h3>
                                        <p className="text-[12px] text-white/65 leading-relaxed max-w-[200px]">{exp.description}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </HorizontalScroller>
                </div>
            </section>

            {/* ── Membership ────────────────────────────────────────────── */}
            <section className="py-16 md:py-24 px-6 md:px-12 lg:px-16">
                <div className="max-w-[1400px] mx-auto">
                    <div className="flex flex-col lg:flex-row items-center gap-0">
                        <div className="lg:w-[55%] w-full">
                            <div className="aspect-[4/3] lg:aspect-[3/2] rounded-[32px] lg:rounded-[40px] bg-gradient-to-br from-[#1C2822] to-[#2A3B35] relative overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--brand-primary)_0%,_transparent_50%)] opacity-20" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center px-8">
                                        <p className="font-serif text-[2.5rem] text-white leading-tight mb-3">For those<br />who belong.</p>
                                        <div className="w-10 h-[1px] bg-[var(--gold-accent)]/60 mx-auto" />
                                    </div>
                                </div>
                                <div className="absolute bottom-8 left-8 right-8 grid grid-cols-3 gap-3 text-center">
                                    {[['Dining', 'Year-round'], ['Wellness', 'Unlimited'], ['Events', 'Priority']].map(([cat, detail]) => (
                                        <div key={cat} className="bg-white/8 backdrop-blur-sm border border-white/10 p-3">
                                            <p className="text-white text-sm font-medium">{cat}</p>
                                            <p className="text-white/45 text-[10px] tracking-wide mt-0.5">{detail}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="lg:w-[45%] w-full lg:pl-16 xl:pl-24 mt-10 lg:mt-0">
                            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}>
                                <p className="text-[10px] tracking-[0.4em] uppercase text-[#9A8A72] mb-5">Membership</p>
                                <h2 className="font-serif text-[2.8rem] md:text-[3.8rem] leading-[0.95] tracking-[-0.02em] mb-6">
                                    For those<br />who belong.
                                </h2>
                                <p className="text-[#59544D] text-[15px] leading-[1.8] mb-8">
                                    Year-round dining, wellness, stay, and event privileges — crafted for a select circle of members who expect more from every visit.
                                </p>
                                <div className="space-y-3 mb-10">
                                    {[
                                        'Priority access to all dining venues',
                                        'Unlimited wellness & spa privileges',
                                        'Exclusive room rates and suite upgrades',
                                        'Early access to events and private functions',
                                    ].map(benefit => (
                                        <div key={benefit} className="flex items-start gap-3 text-[14px] text-[#59544D]">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold-accent)] mt-2 shrink-0" />
                                            {benefit}
                                        </div>
                                    ))}
                                </div>
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
            </section>

            {/* ── Closing CTA ───────────────────────────────────────────── */}
            <section className="py-20 md:py-28 px-6 bg-[#1C2822]">
                <div className="max-w-3xl mx-auto text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
                        <p className="text-[10px] tracking-[0.4em] uppercase text-white/45 mb-5">Begin Your Stay</p>
                        <h2 className="font-serif text-[2.5rem] md:text-[3.5rem] leading-[0.95] tracking-[-0.02em] mb-6 text-white">
                            Your story at Olivia<br />starts here.
                        </h2>
                        <p className="text-white/55 text-[15px] leading-[1.8] max-w-lg mx-auto mb-10">
                            Check availability, choose your room, and reserve in moments — without leaving the calm of this page.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/book/search" className="inline-flex items-center justify-center bg-white text-[var(--text-dark)] px-8 py-3.5 text-[10px] tracking-[0.25em] uppercase font-semibold hover:bg-white/90 transition-colors">
                                Check Availability
                            </Link>
                            <Link href="/contact" className="inline-flex items-center justify-center border border-white/30 text-white px-8 py-3.5 text-[10px] tracking-[0.25em] uppercase font-semibold hover:bg-white/10 transition-colors">
                                Contact Us
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

        </main>
    );
}
