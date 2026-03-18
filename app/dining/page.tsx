import type { Metadata } from 'next';
import type { ComponentType } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
    ArrowRight,
    CalendarDays,
    ChevronDown,
    Clock3,
    Coffee,
    Fish,
    Globe2,
    MapPin,
    Martini,
    Soup,
    Waves,
    Users,
    UtensilsCrossed,
} from 'lucide-react';
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
};

export const metadata: Metadata = {
    title: 'Dining | Olivia Alleppey',
    description: 'Dining at Olivia Alleppey. A culinary journey of global flavors and Kerala heritage.',
};

const outlets: DiningOutlet[] = [
    {
        name: 'In-Room Dining',
        description: 'Round-the-clock dining service delivered to rooms and suites with local and global options.',
        slug: 'in-room-dining',
        image: '',
        capacity: '88 Rooms and Suites',
        location: 'Lobby Level',
        operatingHours: '24 Hours',
        cuisine: 'Local & Global',
        status: 'operational',
    },
    {
        name: 'Finishing Point',
        description: 'Our all-day dining venue with a refined spread of Kerala favorites and global classics.',
        slug: 'finishing-point',
        image: '',
        capacity: '94 Guests',
        location: 'Lobby Level',
        operatingHours: '07:00 HRS to 23:00 HRS',
        cuisine: 'Local & Global',
        status: 'operational',
    },
    {
        name: 'Brew & Bite',
        description: 'A 24-hour coffee and snack lounge for quick meetings, relaxed breaks, and comfort bites.',
        slug: 'brew-bar',
        image: '',
        capacity: '24 Guests',
        location: 'Lobby Level',
        operatingHours: '24 Hours',
        cuisine: 'Short Bites and Refreshments',
        status: 'operational',
    },
    {
        name: 'Aqua Pool Lounge',
        description: 'Poolside refreshments and light bites with a calm daytime setting.',
        slug: 'aqua-pool-lounge',
        image: '',
        capacity: '24 Guests',
        location: '3rd Floor',
        operatingHours: '07:00 HRS to 19:00 HRS',
        cuisine: 'Short Bites and Refreshments',
        status: 'operational',
    },
    {
        name: 'Club 9',
        description: 'Upcoming evening lounge with curated bar and beverage experiences.',
        slug: 'club-9',
        image: '',
        capacity: '44 Guests',
        location: '1st Floor',
        operatingHours: '11:00 HRS to 23:00 HRS (as per local government regulations)',
        cuisine: 'Bar & Beverage',
        status: 'upcoming',
    },
    {
        name: 'Kaayal',
        description: 'Upcoming seafood concept with global and local culinary direction.',
        slug: 'kaayal',
        image: '',
        capacity: '72 Guests',
        location: '3rd Floor',
        operatingHours: '19:00 HRS to 23:00 HRS (as per local government regulations)',
        cuisine: 'Live Seafood - Global & Local (Bar & Beverages)',
        status: 'upcoming',
    },
];

const experiences = [
    { label: 'All Day Dining', icon: Soup },
    { label: 'Coffee & Bites', icon: Coffee },
    { label: 'Poolside Lounge', icon: Waves },
    { label: 'Seafood Experience', icon: Fish },
    { label: 'Evening Bar', icon: Martini },
    { label: 'Global Cuisine', icon: Globe2 },
];

export default function DiningPage() {
    // All outlets in sorted order (already sorted in the array)
    const allOutlets = outlets;
    const operationalOutlets = outlets.filter((outlet) => outlet.status === 'operational');
    const upcomingOutlets = outlets.filter((outlet) => outlet.status === 'upcoming');

    return (
        <main className="min-h-screen bg-[#F6F3EE] text-[#2C2A27]">
            <StickyBookButton />
            <WhatsAppWidget />

            {/* Hero Section - Full width dark gradient like rooms page */}
            <section className="relative overflow-hidden mb-8 md:mb-10 -mx-4 md:-mx-6">
                <div className="relative h-[320px] md:h-[380px]">
                    {/* Dark gradient background */}
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,#1C2622_0%,#2B3A34_38%,#1B2421_100%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_25%_30%,rgba(231,212,173,0.18)_0%,rgba(231,212,173,0)_60%)]" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/40" />
                </div>

                <div className="absolute inset-0 flex items-center">
                    <div className="max-w-7xl mx-auto px-4 md:px-6 w-full text-center">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <span className="w-8 h-[1px] bg-white/80" />
                            <p className="text-white/70 text-[10px] tracking-[0.34em] uppercase">Dining</p>
                            <span className="w-8 h-[1px] bg-white/80" />
                        </div>
                        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-4">
                            Explore Our Dining Options
                        </h1>
                        <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                            Every outlet includes live operating hours, location, and capacity so guests can decide quickly.
                        </p>
                    </div>
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 md:px-6 pb-10 md:pb-14">

                <section id="dining-options" className="mt-8 md:mt-10">
                    <div className="mt-7 grid md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
                        {allOutlets.map((outlet) => (
                            <DiningCard key={outlet.slug} outlet={outlet} />
                        ))}
                    </div>
                </section>

                <section className="mt-8 md:mt-10 rounded-[18px] border border-[#E5DCCB] bg-[#FBF8F2] px-4 md:px-6 py-5 md:py-6">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
                        <h3 className="font-serif text-2xl md:text-3xl text-[#2E2A24]">Dining Signatures</h3>
                        <p className="text-sm text-[#746A5B]">Curated experiences across all dining venues.</p>
                    </div>

                    <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
                        {experiences.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={item.label}
                                    className="rounded-xl border border-[#E8DECE] bg-white px-3.5 py-3 inline-flex items-center gap-2.5 hover:border-[#D2BA93] transition-colors"
                                >
                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#D9C09A] bg-[#FFFDF8]">
                                        <Icon className="w-4 h-4 text-[#B68845]" />
                                    </span>
                                    <span className="text-[#3E3A34] text-sm">{item.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section id="reserve-table" className="mt-8 md:mt-10">
                    <div className="overflow-hidden rounded-[22px] border border-[#E1D6C4] bg-white">
                        <div className="grid lg:grid-cols-[1fr_1.1fr]">
                            <div className="bg-gradient-to-br from-[#F6EFE3] via-[#F8F2E7] to-[#F4EBDD] p-6 md:p-9 lg:p-10">
                                <p className="text-[#9D7A44] text-[10px] tracking-[0.3em] uppercase mb-3">Reservation Desk</p>
                                <h2 className="font-serif text-[2.2rem] md:text-[3.1rem] leading-none text-[#2E2A24]">Reserve Your Table</h2>
                                <p className="mt-3 text-[#4E473B] text-base md:text-lg max-w-lg">
                                    Experience flavors crafted with passion, inspired by Kerala and the world.
                                </p>
                                <p className="mt-3 text-xs text-[#7B7365]">
                                    Select outlet, date, and time. We will assist you with final confirmation.
                                </p>
                            </div>

                            <div className="relative min-h-[220px] md:min-h-[300px] bg-[#E8E0D2]" />
                        </div>
                    </div>

                    <form
                        action="/contact"
                        method="GET"
                        className="relative z-10 -mt-8 mx-3 md:mx-6 lg:mx-8 rounded-2xl border border-[#DDD1BD] bg-white p-4 md:p-5 shadow-[0_18px_38px_-28px_rgba(20,20,20,0.45)]"
                    >
                        <input type="hidden" name="type" value="dining" />

                        <div className="grid lg:grid-cols-[1.2fr_1fr_1fr_auto] gap-3">
                            <div className="relative rounded-xl border border-[#D8C9AF] bg-white text-[#2E2A25] px-4 py-3">
                                <label htmlFor="restaurant" className="sr-only">Restaurant</label>
                                <select
                                    id="restaurant"
                                    name="restaurant"
                                    className="w-full appearance-none bg-transparent text-base outline-none"
                                    defaultValue=""
                                    required
                                >
                                    <option value="" disabled>Select Restaurant</option>
                                    {operationalOutlets.map((outlet) => (
                                        <option key={`select-${outlet.slug}`} value={outlet.name}>{outlet.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A7845]" />
                            </div>

                            <label className="relative rounded-xl border border-[#D8C9AF] bg-white text-[#2E2A25] px-4 py-3 flex items-center gap-2.5">
                                <CalendarDays className="w-4 h-4 text-[#9A7845]" />
                                <span className="sr-only">Date</span>
                                <input
                                    type="date"
                                    name="date"
                                    className="w-full bg-transparent text-base outline-none"
                                    required
                                />
                            </label>

                            <label className="relative rounded-xl border border-[#D8C9AF] bg-white text-[#2E2A25] px-4 py-3 flex items-center gap-2.5">
                                <Clock3 className="w-4 h-4 text-[#9A7845]" />
                                <span className="sr-only">Time</span>
                                <input
                                    type="time"
                                    name="time"
                                    className="w-full bg-transparent text-base outline-none"
                                    required
                                />
                            </label>

                            <button
                                type="submit"
                                className="inline-flex items-center justify-center rounded-xl bg-[#B68845] px-8 py-3 text-white text-[12px] tracking-[0.14em] uppercase hover:bg-[#A97E3F] transition-colors"
                            >
                                Book Now
                            </button>
                        </div>
                    </form>
                </section>
            </section>
        </main>
    );
}

function DiningCard({ outlet }: { outlet: DiningOutlet }) {
    const isUpcoming = outlet.status === 'upcoming';

    return (
        <article className="rounded-[18px] border border-[#E3DACA] bg-[#FAF7F2] overflow-hidden shadow-[0_14px_34px_-26px_rgba(20,20,20,0.5)]">
            <div className="relative h-[190px] md:h-[215px] bg-[#E8E0D2]" />

            <div className="p-5 md:p-6">
                <h3 className="font-serif text-4xl leading-none text-[#2C2A27]">{outlet.name}</h3>
                <p className="mt-2 text-[#645B4F] leading-relaxed">{outlet.description}</p>

                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[#474239]">
                    <DataLine icon={Users} value={outlet.capacity} />
                    <span className="text-[#B9AA90]">|</span>
                    <DataLine icon={MapPin} value={outlet.location} />
                </div>

                <p className="mt-3 text-[#3F3A32]">
                    {outlet.operatingHours} <span className="text-[#BAA98E]">•</span> {outlet.cuisine}
                </p>

                <div className="mt-5 flex items-center gap-3">
                    <Link
                        href={`/dining/${outlet.slug}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-[#DCCFB8] bg-white px-4 py-2 text-[#8D6530] text-[11px] tracking-[0.14em] uppercase hover:bg-[#F9F4EA] transition-colors"
                    >
                        View Menu
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                        href="/contact?type=dining"
                        className="inline-flex items-center rounded-lg bg-[#B68845] px-4 py-2 text-white text-[11px] tracking-[0.14em] uppercase hover:bg-[#A97E3F] transition-colors"
                    >
                        Reserve Table
                    </Link>
                </div>
            </div>
        </article>
    );
}

function DataLine({
    icon: Icon,
    value,
}: {
    icon: ComponentType<{ className?: string }>;
    value: string;
}) {
    return (
        <span className="inline-flex items-center gap-1.5 text-sm md:text-base">
            <Icon className="w-4 h-4 text-[#B68845]" />
            <span>{value}</span>
        </span>
    );
}
