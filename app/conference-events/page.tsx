'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import StickyBookButton from '@/components/sticky-book-button';
import WhatsAppWidget from '@/components/whatsapp-widget';
import EventInquiryForm from '@/components/conference/event-inquiry-form';
import { ArrowRight, MapPin, PhoneCall, CalendarClock } from 'lucide-react';

type VenueLayout = {
    theatre: string;
    cluster: string;
    classroom: string;
    uShape: string;
    boardroom: string;
};

type Venue = {
    name: string;
    slug: string;
    image: string;
    description: string;
    bestFor: string;
    dimensions: {
        length: string;
        width: string;
        height: string;
    };
    area: string;
    layout: VenueLayout;
};

const venues: Venue[] = [
    {
        name: 'Grand BallRoom',
        slug: 'grand-ballroom',
        image: '/images/conference/hero.png',
        description:
            'A flagship venue meticulously designed for high-impact corporate events and large-scale conferences. Featuring refined interiors, adaptable layouts, and seamless service support, it provides an ideal setting for conventions, product launches, corporate gatherings, and business summits where scale, precision, and sophistication come together effortlessly.',
        bestFor: 'Conferences, corporate events, product launches',
        dimensions: { length: '95', width: '53', height: '13' },
        area: '5035',
        layout: {
            theatre: '500',
            cluster: '180-200',
            classroom: '120-130',
            uShape: '60',
            boardroom: '60',
        },
    },
    {
        name: 'Grand BallRoom 1',
        slug: 'grand-ballroom-1',
        image: '/images/conference/meeting-room.png',
        description:
            'Divisible section of the ballroom for focused sessions and medium-format gatherings. Thoughtfully designed for comfort and functionality, it offers a refined setting for conferences, social events, and private functions.',
        bestFor: 'Meetings, seminars, corporate sessions',
        dimensions: { length: '53', width: '33', height: '13' },
        area: '5035',
        layout: {
            theatre: '550',
            cluster: '196',
            classroom: '180',
            uShape: '24',
            boardroom: '40',
        },
    },
    {
        name: 'Grand BallRoom 2',
        slug: 'grand-ballroom-2',
        image: '/images/conference/meeting-room.png',
        description:
            'Balanced format venue suitable for workshops, leadership meets, and conference tracks. The open layout allows for creative décor, lighting, and customised configurations.',
        bestFor: 'Conferences, workshops, breakouts',
        dimensions: { length: '53', width: '35', height: '13' },
        area: '5035',
        layout: {
            theatre: '550',
            cluster: '196',
            classroom: '180',
            uShape: '24',
            boardroom: '40',
        },
    },
    {
        name: 'Grand BallRoom 3',
        slug: 'grand-ballroom-3',
        image: '/images/conference/meeting-room.png',
        description:
            'Flexible ballroom section built for training batches and presentation-led sessions. Ideal for structured learning environments and interactive workshops.',
        bestFor: 'Training sessions, presentations',
        dimensions: { length: '53', width: '27', height: '13' },
        area: '1431',
        layout: {
            theatre: '170',
            cluster: '66',
            classroom: '42',
            uShape: '24',
            boardroom: '24',
        },
    },
    {
        name: 'Forum',
        slug: 'forum',
        image: '/images/conference/meeting-room.png',
        description:
            'Mid-scale conference venue that balances capacity with focused business interaction. Perfect for conferences that require intimacy with structure, strategy meets, and high-level corporate sessions.',
        bestFor: 'Mid-size conferences, strategy meets',
        dimensions: { length: '61', width: '33', height: '9' },
        area: '2000',
        layout: {
            theatre: '170',
            cluster: '66',
            classroom: '42',
            uShape: '24',
            boardroom: '30',
        },
    },
    {
        name: 'Forum 1',
        slug: 'forum-1',
        image: '/images/conference/meeting-room.png',
        description:
            'Compact breakout venue for private workshops and internal planning sessions. Designed with focus in mind, Forum 1 provides an environment where ideas flow naturally.',
        bestFor: 'Workshops, meetings',
        dimensions: { length: '33', width: '20', height: '9' },
        area: '2000',
        layout: {
            theatre: '170',
            cluster: '66',
            classroom: '42',
            uShape: '24',
            boardroom: '25',
        },
    },
    {
        name: 'Forum 2',
        slug: 'forum-2',
        image: '/images/conference/meeting-room.png',
        description:
            'Breakout-focused space with straightforward layouts for productive work sessions. Forum 2 offers the ideal environment for committee meetings and focused team collaboration.',
        bestFor: 'Breakouts, committee meetings',
        dimensions: { length: '33', width: '20', height: '9' },
        area: '2000',
        layout: {
            theatre: '170',
            cluster: '66',
            classroom: '42',
            uShape: '24',
            boardroom: '25',
        },
    },
    {
        name: 'Forum 3',
        slug: 'forum-3',
        image: '/images/conference/meeting-room.png',
        description:
            'Private-format meeting room suited for decision rooms and leadership briefings. An intimate space that encourages high-level conversation and strategic thinking.',
        bestFor: 'Leadership meetings, workshops',
        dimensions: { length: '42', width: '21', height: '9' },
        area: '2000',
        layout: {
            theatre: '30',
            cluster: '20',
            classroom: '18',
            uShape: '18',
            boardroom: '12',
        },
    },
    {
        name: 'Poolside',
        slug: 'poolside',
        image: '/images/conference/hero.png',
        description:
            'An exquisite open-air venue crafted for refined social evenings, elegant celebrations, and thoughtfully curated hospitality experiences. Framed by the serene allure of water, this sophisticated setting transforms effortlessly to reflect the essence of any occasion—be it an intimate sunset soirée, a stylish cocktail gathering, or a bespoke themed celebration.',
        bestFor: 'Outdoor celebrations, dinners, networking',
        dimensions: { length: '—', width: '—', height: '—' },
        area: '4000',
        layout: {
            theatre: 'As per event needs',
            cluster: 'As per event needs',
            classroom: 'As per event needs',
            uShape: 'As per event needs',
            boardroom: '4000',
        },
    },
];

function formatArea(area: string) {
    return /^\d+$/.test(area) ? `${Number(area).toLocaleString('en-IN')} sq ft` : area;
}

function formatGuestLabel(theatre: string) {
    if (/^\d+$/.test(theatre)) return `Up to ${theatre} Guests`;
    return theatre;
}

const topLevelVenues = [
    {
        name: 'Grand BallRoom',
        slug: 'grand-ballroom',
        subItems: [
            { label: 'Cluster', slug: 'grand-ballroom-1' },
            { label: 'Theatre', slug: 'grand-ballroom-2' },
        ],
    },
    {
        name: 'Forum',
        slug: 'forum',
        subItems: [
            { label: 'Cluster', slug: 'forum-1' },
            { label: 'Theatre', slug: 'forum-2' },
        ],
    },
    { name: 'Board Room', slug: 'forum-3', subItems: [] },
    { name: 'Pool Side', slug: 'poolside', subItems: [] },
];

export default function ConferenceEventsPage() {
    const [activeSlug, setActiveSlug] = useState<string>('grand-ballroom');

    const activeVenue = venues.find((v) => v.slug === activeSlug) ?? venues[0];

    return (
        <>
            <main className="min-h-screen bg-[#F8F6F1] text-[#1D1D1D]">
                {/* Hero */}
                <section className="relative h-[44vh] md:h-[52vh] w-full overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--brand-primary-deep)_0%,var(--brand-primary-dark)_38%,var(--brand-primary-deep)_100%)]" />
                        <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_25%_30%,rgba(231,212,173,0.18)_0%,rgba(231,212,173,0)_60%)]" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/40" />
                    </div>

                    <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6">
                        <div className="flex items-center gap-4 mb-3">
                            <span className="w-8 h-[1px] bg-white/80" />
                            <p className="text-white text-[10px] tracking-[0.34em] uppercase font-light">
                                Olivia Alleppey
                            </p>
                            <span className="w-8 h-[1px] bg-white/80" />
                        </div>

                        <h1 className="text-[3rem] sm:text-[4rem] md:text-[6rem] lg:text-[8rem] font-serif font-medium text-white mb-5 tracking-[-0.03em] leading-[0.92] [text-shadow:0_2px_22px_rgba(0,0,0,0.55)]">
                            Conference &amp; Events
                        </h1>

                        <div className="flex gap-3">
                            <Link
                                href="#event-form"
                                className="border border-white/90 bg-white text-[#2D3933] px-6 py-2.5 text-[10px] tracking-[0.22em] uppercase font-semibold shadow-[0_18px_40px_-28px_rgba(0,0,0,0.65)] hover:bg-white/95 transition-colors duration-300"
                            >
                                Inquire Now
                            </Link>
                            <Link
                                href="/contact"
                                className="border border-white/85 bg-black/20 text-white px-6 py-2.5 text-[10px] tracking-[0.22em] uppercase font-semibold backdrop-blur-sm hover:bg-black/30 transition-colors duration-300"
                            >
                                Contact now
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Venue Selector — sidebar + image panel */}
                <section className="py-16 md:py-20 px-6 md:px-12 lg:px-20">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col lg:flex-row gap-0 min-h-[520px]">
                            {/* Left Sidebar — single unified nav list */}
                            <aside className="lg:w-64 xl:w-72 flex-shrink-0 lg:pr-10 border-b lg:border-b-0 lg:border-r border-[#DDD5C5] pb-6 lg:pb-0 mb-6 lg:mb-0 flex flex-col justify-center">
                                <nav className="flex flex-col">
                                    {topLevelVenues.map((venue) => {
                                        // This venue is "active" if it's selected directly, or one of its sub-items is selected
                                        const isTopActive =
                                            venue.slug === activeSlug ||
                                            venue.subItems.some((s) => s.slug === activeSlug);

                                        return (
                                            <div key={venue.slug} className="border-b border-[#E6DDD0] last:border-b-0">
                                                {/* Top-level venue button */}
                                                <button
                                                    onClick={() => setActiveSlug(venue.slug)}
                                                    className={`group text-left w-full flex items-center justify-between cursor-pointer transition-all duration-200 ${isTopActive
                                                        ? 'font-bold text-[#1D1D1D] text-[1.6rem] md:text-[1.9rem] leading-tight py-4'
                                                        : 'font-semibold text-[#7A7670] hover:text-[#1D1D1D] text-sm py-4'
                                                        }`}
                                                >
                                                    {venue.name}
                                                    {!isTopActive && (
                                                        <svg
                                                            className="w-3.5 h-3.5 flex-shrink-0 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200"
                                                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    )}
                                                </button>

                                                {/* Sub-items — only show when this venue is active */}
                                                {isTopActive && venue.subItems.length > 0 && (
                                                    <div className="flex flex-col items-end gap-2 pb-4 pr-1">
                                                        {venue.subItems.map((item) => (
                                                            <button
                                                                key={item.slug}
                                                                onClick={() => setActiveSlug(item.slug)}
                                                                className={`group flex items-center gap-1.5 text-sm font-semibold cursor-pointer transition-all duration-200 ${activeSlug === item.slug
                                                                    ? 'text-[#1C3A32] underline underline-offset-2'
                                                                    : 'text-[#C9A167] hover:text-[#9A6E30] hover:translate-x-[-2px]'
                                                                    }`}
                                                            >
                                                                {activeSlug !== item.slug && (
                                                                    <svg className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                                    </svg>
                                                                )}
                                                                {item.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </nav>
                            </aside>

                            {/* Right Panel — Image + Info */}
                            <div className="flex-1 lg:pl-10 xl:pl-14">
                                <div className="flex flex-col gap-6">
                                    {/* Image Placeholder */}
                                    <div className="relative w-full aspect-[16/9] overflow-hidden bg-[#E0D9CE] flex items-center justify-center">
                                        <div className="text-center">
                                            <p className="text-[#6C6860] text-lg font-serif">{activeVenue.name}</p>
                                            <p className="text-[#9A8060] text-sm mt-2">Venue Image Coming Soon</p>
                                        </div>
                                    </div>

                                    {/* Description — shown for all venues */}
                                    <div>
                                        <p className="text-[#3D3A33] text-sm md:text-base leading-relaxed">
                                            {activeVenue.description}
                                        </p>
                                        <p className="mt-3 text-[#9A8060] text-sm">
                                            Best for: {activeVenue.bestFor}
                                        </p>
                                        <Link
                                            href="#event-form"
                                            className="mt-5 inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-[#A47436] hover:text-[#8E5F22] font-semibold transition-colors"
                                        >
                                            Inquire About This Venue
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>

                                    {/* Capacity Stats — Board Room shows only Boardroom capacity, others show full grid */}
                                    {activeVenue.slug === 'forum-3' ? (
                                        <div className="flex flex-wrap gap-3">
                                            <div className="border border-[#E8E0D1] bg-[#FAF8F2] px-4 py-3 min-w-[90px]">
                                                <p className="text-[10px] uppercase tracking-[0.16em] text-[#7A756A]">Boardroom</p>
                                                <p className="font-serif text-xl text-[#1D1C19] leading-none mt-1">12</p>
                                            </div>
                                        </div>
                                    ) : (!/As per/.test(activeVenue.layout.theatre) && (
                                        <div className="flex flex-wrap gap-3">
                                            {[
                                                { label: 'Theatre', value: activeVenue.layout.theatre },
                                                { label: 'Cluster', value: activeVenue.layout.cluster },
                                                { label: 'Classroom', value: activeVenue.layout.classroom },
                                                { label: 'U-Shape', value: activeVenue.layout.uShape },
                                                { label: 'Area', value: formatArea(activeVenue.area) },
                                            ].map((item) => (
                                                <div key={item.label} className="border border-[#E8E0D1] bg-[#FAF8F2] px-4 py-3 min-w-[90px]">
                                                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#7A756A]">{item.label}</p>
                                                    <p className="font-serif text-xl text-[#1D1C19] leading-none mt-1">{item.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </section>

                {/* Inquiry Form */}
                <section id="event-form" className="py-12 md:py-16 px-6 md:px-12 lg:px-20 bg-[#F8F6F1]">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="font-serif text-3xl md:text-4xl text-[#1E1D1A] tracking-tight text-center">Plan Your Event</h2>
                        <p className="mt-3 text-[#5D5A53] text-sm text-center max-w-2xl mx-auto">
                            Share your event brief and our team will suggest the right venue, layout and service plan.
                        </p>
                        <EventInquiryForm />
                    </div>
                </section>
            </main>

            <StickyBookButton />
            <WhatsAppWidget />
        </>
    );
}
