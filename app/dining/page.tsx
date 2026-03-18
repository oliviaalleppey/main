import type { Metadata } from 'next';
import type { ComponentType } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
    ArrowRight,
    MapPin,
    Users,
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
        description: 'Round-the-clock dining service delivered to rooms and suites with local and global delicacy.',
        slug: 'in-room-dining',
        image: '/images/rooms/balcony-room-5.jpg',
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
        image: '/images/dining/FINISHING POINT.webp',
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
        image: '/images/dining/BREW& BITE.webp',
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
        image: '/images/dining/aquapool.jpeg',
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
        image: '/images/dining/CLUB 9.webp',
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
        image: '/images/dining/KAAYAL.webp',
        capacity: '72 Guests',
        location: '3rd Floor',
        operatingHours: '19:00 HRS to 23:00 HRS (as per local government regulations)',
        cuisine: 'Live Seafood - Global & Local (Bar & Beverages)',
        status: 'upcoming',
    },
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

            {/* Hero Section - Full width like rooms page */}
            <section className="relative overflow-hidden mb-8 md:mb-10 -mx-4 md:-mx-6">
                <div className="relative h-[44vh] md:h-[52vh]">
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
            </section>
        </main>
    );
}

function DiningCard({ outlet }: { outlet: DiningOutlet }) {
    const isUpcoming = outlet.status === 'upcoming';

    return (
        <article className="rounded-[18px] border border-[#E3DACA] bg-[#FAF7F2] overflow-hidden shadow-[0_14px_34px_-26px_rgba(20,20,20,0.5)]">
            <div className="relative h-[190px] md:h-[215px]">
                {outlet.image ? (
                    <Image
                        src={outlet.image}
                        alt={outlet.name}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 bg-[#E8E0D2]" />
                )}
                {isUpcoming && (
                    <span className="absolute top-3 right-3 rounded-full border border-[#D8BE94] bg-[#F0E3CF] px-3 py-1 text-[10px] tracking-[0.15em] uppercase text-[#936C35]">
                        Opening Soon
                    </span>
                )}
            </div>

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
                    <a
                        href="tel:+918075416514"
                        className="inline-flex items-center rounded-lg bg-[#B68845] px-4 py-2 text-white text-[11px] tracking-[0.14em] uppercase hover:bg-[#A97E3F] transition-colors"
                    >
                        Reserve Table
                    </a>
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
