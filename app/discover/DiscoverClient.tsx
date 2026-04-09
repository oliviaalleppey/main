'use client';

import Link from 'next/link';
import Image from 'next/image';
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

interface RoomType {
    name: string;
    slug: string;
    shortDescription: string | null;
    images: string[] | null;
}

interface DiscoverClientProps {
    headerImage?: string;
    rooms?: RoomType[];
}

export default function DiscoverClient({ headerImage, rooms = [] }: DiscoverClientProps) {
    return (
        <main className="min-h-screen bg-[#FAF7F0] text-[var(--text-dark)] overflow-hidden">

            {/* ── Hero ──────────────────────────────────────────────────────── */}
            <section className="relative h-[80vh] md:h-[90vh] w-full overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                    {headerImage ? (
                        <Image src={headerImage} alt="Discover Olivia" fill className="object-cover" priority />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#1C2822] via-[#2A3B35] to-[#0F1A15]" />
                    )}
                    {/* Lighter overlay for better image visibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/20 to-black/10" />
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--brand-primary)_0%,_transparent_60%)] opacity-10" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_#8C7A6B_0%,_transparent_50%)] opacity-10" />
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
                                <p className="font-sans font-semibold text-[2rem] md:text-[2.5rem] text-white leading-none tracking-tight">{stat.value}</p>
                                <p className="text-[10px] tracking-[0.2em] uppercase text-white/45 mt-2">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Accommodation ─────────────────────────────────────────── */}
            <section className="w-full bg-[#FAF7F0] py-14 md:py-20 px-6 md:px-12 lg:px-16">
                <div className="max-w-[1400px] mx-auto">

                    <motion.p
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-[10px] tracking-[0.45em] uppercase text-[var(--gold-accent-dark)] mb-8"
                    >
                        Accommodation
                    </motion.p>

                    <HorizontalScroller>
                        {rooms.slice(0, 6).map((room, idx) => (
                            <Link key={idx} href={`/rooms/${room.slug}`} className="flex-none w-[280px] md:w-[320px] group">
                                <div className="relative aspect-[4/5] overflow-hidden rounded-sm mb-4 bg-[var(--surface-soft)]">
                                    {room.images?.[0] ? (
                                        <Image src={room.images[0]} alt={room.name} fill className="object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 bg-[var(--surface-soft)]" />
                                    )}
                                    <div className="absolute bottom-4 left-4 text-white/80 text-[10px] tracking-[0.2em]">ROOM</div>
                                </div>
                                <h3 className="font-serif text-[1.25rem] text-[var(--text-dark)] mb-1 group-hover:text-[var(--gold-accent-dark)] transition-colors">
                                    {room.name}
                                </h3>
                                <p className="text-[var(--text-dark)]/50 text-xs">{room.shortDescription || 'Luxury room at Olivia'}</p>
                            </Link>
                        ))}
                    </HorizontalScroller>

                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mt-10 text-center"
                    >
                        <Link href="/rooms" className="inline-flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase font-semibold text-[var(--text-dark)] hover:text-[var(--gold-accent-dark)] transition-colors">
                            View All Accommodation <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* ── Experiences ───────────────────────────────────────────── */}
            <section className="py-14 md:py-20 px-6 md:px-12 lg:px-16 bg-white">
                <div className="max-w-[1400px] mx-auto">
                    <motion.p
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-[10px] tracking-[0.45em] uppercase text-[var(--gold-accent-dark)] mb-8"
                    >
                        Curated for You
                    </motion.p>

                    <HorizontalScroller>
                        {EXPERIENCES.map((exp, i) => (
                            <Link key={i} href={exp.href} className="flex-none w-[280px] md:w-[320px] group">
                                <div className="relative aspect-[4/5] overflow-hidden rounded-sm mb-4 bg-[var(--surface-soft)]">
                                    <div className="absolute inset-0 bg-[var(--surface-soft)]" />
                                    <span className="absolute top-4 left-4 text-[9px] tracking-[0.25em] uppercase text-white/90 border border-white/40 px-2 py-1 backdrop-blur-sm">
                                        {exp.tag}
                                    </span>
                                </div>
                                <h3 className="font-serif text-[1.25rem] text-[var(--text-dark)] mb-1 group-hover:text-[var(--gold-accent-dark)] transition-colors">
                                    {exp.title}
                                </h3>
                                <p className="text-[var(--text-dark)]/55 text-xs leading-relaxed">{exp.description}</p>
                            </Link>
                        ))}
                    </HorizontalScroller>

                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mt-10 text-center"
                    >
                        <Link href="/experiences" className="inline-flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase font-semibold text-[var(--text-dark)] hover:text-[var(--gold-accent-dark)] transition-colors">
                            View All Experiences <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* ── Wellness ─────────────────────────────────────────────── */}
            <section className="bg-[#1C2822] py-14 md:py-20 px-6 md:px-12 lg:px-16">
                <div className="max-w-[1400px] mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
                        <div>
                            <motion.p
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="text-[10px] tracking-[0.45em] uppercase text-[var(--gold-accent)] mb-4"
                            >
                                Wellness
                            </motion.p>
                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                                className="font-serif text-[2.5rem] md:text-[3.5rem] text-white leading-tight"
                            >
                                Restore Balance
                            </motion.h2>
                        </div>
                        <Link href="/wellness" className="hidden md:inline-flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase font-semibold text-white/70 hover:text-white transition-colors mt-6 md:mt-0">
                            Explore Wellness <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {WELLNESS_HIGHLIGHTS.map((item, i) => (
                            <motion.div
                                key={item.name}
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.08 }}
                            >
                                <Link href={item.href} className="block group p-6 border border-white/10 rounded-sm hover:border-white/30 transition-colors">
                                    <h3 className="font-serif text-xl text-white mb-1 group-hover:text-[var(--gold-accent)] transition-colors">{item.name}</h3>
                                    <p className="text-[var(--gold-accent)] text-xs tracking-wider mb-3">{item.subtitle}</p>
                                    <p className="text-white/50 text-sm leading-relaxed">{item.detail}</p>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Dining ────────────────────────────────────────────────── */}
            <section className="py-14 md:py-20 px-6 md:px-12 lg:px-16 bg-[#FAF7F0]">
                <div className="max-w-[1400px] mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
                        <div>
                            <motion.p
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="text-[10px] tracking-[0.45em] uppercase text-[var(--gold-accent-dark)] mb-4"
                            >
                                Dining
                            </motion.p>
                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                                className="font-serif text-[2.5rem] md:text-[3.5rem] text-[var(--text-dark)]"
                            >
                                Culinary Journeys
                            </motion.h2>
                        </div>
                        <Link href="/dining" className="hidden md:inline-flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase font-semibold text-[var(--text-dark)]/60 hover:text-[var(--text-dark)] transition-colors mt-6 md:mt-0">
                            View Dining <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {DINING_OUTLETS.slice(0, 3).map((outlet, i) => (
                            <motion.div
                                key={outlet.name}
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.08 }}
                                className="group p-6 bg-white border border-[var(--text-dark)]/5 rounded-sm hover:border-[var(--gold-accent)]/30 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-serif text-lg text-[var(--text-dark)]">{outlet.name}</h3>
                                    <span className={`text-[9px] tracking-[0.2em] uppercase px-2 py-0.5 rounded-full ${outlet.status === 'open' ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                        {outlet.status === 'open' ? 'Open' : 'Coming Soon'}
                                    </span>
                                </div>
                                <p className="text-[var(--text-dark)]/40 text-xs mb-4">{outlet.type} · {outlet.hours}</p>
                                <p className="text-[var(--text-dark)]/60 text-sm leading-relaxed">{outlet.description}</p>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mt-10 text-center"
                    >
                        <Link href="/dining" className="inline-flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase font-semibold text-[var(--text-dark)] hover:text-[var(--gold-accent-dark)] transition-colors">
                            View All Dining <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* ── Wedding ────────────────────────────────────────────────── */}
            <section className="bg-[#FAF7F0] py-14 md:py-20 px-6 md:px-12 lg:px-16 border-t border-[var(--text-dark)]/5">
                <div className="max-w-[1400px] mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                        <div>
                            <motion.p
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="text-[10px] tracking-[0.45em] uppercase text-[var(--gold-accent-dark)] mb-4"
                            >
                                Celebrations
                            </motion.p>
                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                                className="font-serif text-[2.5rem] md:text-[3.5rem] text-[var(--text-dark)] mb-6"
                            >
                                Unforgettable Weddings
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="text-[var(--text-dark)]/60 text-base leading-relaxed mb-8"
                            >
                                From intimate poolside ceremonies to grand ballroom celebrations, we craft weddings that reflect your unique love story against the breathtaking backdrops of Kerala.
                            </motion.p>

                            <div className="space-y-4 mb-8">
                                {WEDDING_VENUES.map((venue, i) => (
                                    <motion.div
                                        key={venue.name}
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.4, delay: 0.3 + i * 0.05 }}
                                        className="flex items-center justify-between py-3 border-b border-[var(--text-dark)]/10"
                                    >
                                        <span className="text-[var(--text-dark)] font-medium">{venue.name}</span>
                                        <span className="text-[var(--text-dark)]/40 text-sm">{venue.area} · {venue.capacity}</span>
                                    </motion.div>
                                ))}
                            </div>

                            <Link href="/wedding" className="inline-flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase font-semibold text-[var(--text-dark)] hover:text-[var(--gold-accent-dark)] transition-colors">
                                Plan Your Wedding <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div>
                            <div className="grid grid-cols-1 gap-4">
                                {WEDDING_PACKAGES.map((pkg, i) => (
                                    <motion.div
                                        key={pkg.name}
                                        initial={{ opacity: 0, y: 15 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: i * 0.1 }}
                                        className="p-6 bg-white border border-[var(--text-dark)]/5 rounded-sm hover:border-[var(--gold-accent)]/30 transition-colors"
                                    >
                                        <h3 className="font-serif text-lg text-[var(--text-dark)] mb-2">{pkg.name}</h3>
                                        <p className="text-[var(--gold-accent-dark)] text-xs tracking-wider mb-4">{pkg.guests}</p>
                                        <ul className="space-y-2">
                                            {pkg.highlights.map((h, j) => (
                                                <li key={j} className="text-[var(--text-dark)]/50 text-sm flex items-center gap-2">
                                                    <span className="w-1 h-1 bg-[var(--gold-accent)] rounded-full" />
                                                    {h}
                                                </li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Membership ───────────────────────────────────────────── */}
            <section className="bg-[#1C2822] py-14 md:py-20 px-6 md:px-12 lg:px-16">
                <div className="max-w-[1400px] mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <p className="text-[10px] tracking-[0.45em] uppercase text-[var(--gold-accent)] mb-4">Membership</p>
                            <h2 className="font-serif text-[2.5rem] md:text-[3.5rem] text-white mb-6">The Olivia Circle</h2>
                            <p className="text-white/50 text-base leading-relaxed mb-8">
                                Year-round privileges across dining, wellness, stays, and events — crafted for a select circle of members who expect more from every visit.
                            </p>
                            <ul className="space-y-4 mb-8">
                                {['Unlimited wellness & spa privileges', 'Priority event bookings', 'Exclusive member events'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-white/70">
                                        <span className="w-6 h-6 rounded-full bg-[var(--gold-accent)]/20 flex items-center justify-center">
                                            <span className="w-1.5 h-1.5 bg-[var(--gold-accent)] rounded-full" />
                                        </span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/membership" className="inline-flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase font-semibold text-white hover:text-[var(--gold-accent)] transition-colors">
                                Explore Membership <ArrowRight className="w-4 h-4" />
                            </Link>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="grid grid-cols-2 gap-4"
                        >
                            {[['Dining', 'Year-round'], ['Wellness', 'Unlimited'], ['Events', 'Priority'], ['Stays', 'Exclusive']].map(([cat, detail], i) => (
                                <div key={i} className="p-6 bg-white/5 rounded-sm border border-white/10">
                                    <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--gold-accent)] mb-2">{cat}</p>
                                    <p className="text-white text-xl font-serif">{detail}</p>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── Footer CTA ───────────────────────────────────────────── */}
            <section className="py-16 md:py-24 px-6 md:px-12 bg-[#FAF7F0] text-center">
                <div className="max-w-2xl mx-auto">
                    <motion.p
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-[10px] tracking-[0.45em] uppercase text-[var(--gold-accent-dark)] mb-6"
                    >
                        Begin Your Journey
                    </motion.p>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-serif text-[2rem] md:text-[3rem] text-[var(--text-dark)] mb-6"
                    >
                        We Look Forward to Welcoming You
                    </motion.h2>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                        <Link href="/book/search" className="bg-[var(--text-dark)] text-white px-8 py-4 text-[10px] tracking-[0.25em] uppercase font-semibold hover:bg-[var(--gold-accent-dark)] transition-colors">
                            Book Your Stay
                        </Link>
                        <Link href="/contact" className="border border-[var(--text-dark)] text-[var(--text-dark)] px-8 py-4 text-[10px] tracking-[0.25em] uppercase font-semibold hover:bg-[var(--text-dark)] hover:text-white transition-colors">
                            Contact Us
                        </Link>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}