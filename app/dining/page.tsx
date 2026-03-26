import type { Metadata } from 'next';
import type { ComponentType } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { DiningHero } from '@/components/dining-hero';
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
        image: '/images/dining/aquapool.webp',
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

            {/* Hero Section */}
            <DiningHero />

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
                    {(outlet.slug === 'in-room-dining' || outlet.slug === 'finishing-point') ? (
                        <a
                            href="https://oliviaalleppey.com/menu.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-[#DCCFB8] bg-white px-4 py-2 text-[#8D6530] text-[11px] tracking-[0.14em] uppercase hover:bg-[#F9F4EA] transition-colors"
                        >
                            View Menu
                            <ArrowRight className="w-4 h-4" />
                        </a>
                    ) : (
                        <Link
                            href={`/dining/${outlet.slug}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-[#DCCFB8] bg-white px-4 py-2 text-[#8D6530] text-[11px] tracking-[0.14em] uppercase hover:bg-[#F9F4EA] transition-colors"
                        >
                            View Menu
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    )}
                    {outlet.slug !== 'in-room-dining' && (
                        <a
                            href="tel:+918075416514"
                            className="inline-flex items-center rounded-lg bg-[var(--gold-cta)] px-4 py-2 text-white text-[11px] tracking-[0.14em] uppercase hover:bg-[var(--gold-cta-dark)] transition-colors"
                        >
                            Reserve Table
                        </a>
                    )}
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
            <Icon className="w-4 h-4 text-[var(--gold-cta)]" />
            <span>{value}</span>
        </span>
    );
}
