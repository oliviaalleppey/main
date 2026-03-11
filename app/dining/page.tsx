import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
    ArrowRight,
    CalendarDays,
    ChevronDown,
    Clock3,
    MapPin,
    Users,
    UtensilsCrossed,
    Clock
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
        name: 'Finishing Point',
        description: 'Immerse yourself in a culinary journey at our signature restaurant. Experience the finest local delicacies alongside a curated selection of global cuisine in an elegant setting.',
        slug: 'finishing-point',
        image: '/images/dining/finishing-point.png',
        capacity: '94 Guests',
        location: 'Lobby Level',
        operatingHours: '07:00 HRS to 23:00 HRS',
        cuisine: 'Local & Global',
        status: 'operational',
    },
    {
        name: 'Brew & Bite',
        description: 'Your tranquil 24-hour sanctuary for artisanal coffee, premium teas, and delectable short bites. Perfect for casual meetings or a quiet moment of reflection.',
        slug: 'brew-bar',
        image: '/images/dining/brew-bar.png',
        capacity: '24 Guests',
        location: 'Lobby Level',
        operatingHours: '24 Hours',
        cuisine: 'Short Bites and Refreshments',
        status: 'operational',
    },
    {
        name: 'In-Room Dining',
        description: 'Experience our exceptional culinary offerings in the privacy and comfort of your own room or suite, available around the clock to satisfy your cravings.',
        slug: 'in-room-dining',
        image: '/images/rooms/balcony-room-5.jpg',
        capacity: '88 Rooms and Suites',
        location: 'Lobby Level',
        operatingHours: '24 Hours',
        cuisine: 'Local & Global',
        status: 'operational',
    },
    {
        name: 'Aqua Pool Lounge',
        description: 'Relax by the shimmering waters with refreshing beverages and light bites. The perfect oasis to unwind under the Kerala sun.',
        slug: 'aqua-pool-lounge',
        image: '/images/rooms/balcony-room-2.jpg',
        capacity: '24 Guests',
        location: '3rd Floor',
        operatingHours: '07:00 HRS to 19:00 HRS',
        cuisine: 'Short Bites and Refreshments',
        status: 'operational',
    },
    {
        name: 'Kaayal',
        description: 'Anticipate a transcendent seafood experience. Kaayal will showcase the freshest local catches prepared with both traditional and international techniques.',
        slug: 'kaayal',
        image: '/images/dining/kaayal.png',
        capacity: '72 Guests',
        location: '3rd Floor',
        operatingHours: '19:00 HRS to 23:00 HRS (as per Local Govt regs)',
        cuisine: 'Live Seafood - Global & Local (Bar & Beverages)',
        status: 'upcoming',
    },
    {
        name: 'Club 9',
        description: 'Soon to be Alappuzha\'s premier destination for evening sophistication, offering a curated selection of premium beverages and craft cocktails.',
        slug: 'club-9',
        image: '/images/rooms/balcony-room-4.jpg',
        capacity: '44 Guests',
        location: '1st Floor',
        operatingHours: '11:00 HRS to 23:00 HRS (as per Local Govt regs)',
        cuisine: 'Bar & beverage',
        status: 'upcoming',
    },
];

export default function DiningPage() {
    const operationalOutlets = outlets.filter(o => o.status === 'operational');
    const upcomingOutlets = outlets.filter(o => o.status === 'upcoming');

    return (
        <main className="min-h-screen bg-[#FBF9F6] text-[#2C2A27]">
            <StickyBookButton />
            <WhatsAppWidget />

            {/* Hero Section */}
            <section className="relative h-[65vh] md:h-[80vh] w-full overflow-hidden">
                <Image
                    src="/images/dining/hero.jpg"
                    alt="Dining at Olivia"
                    fill
                    priority
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-[#1A1814]/40" />

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                    <span className="text-[#E5D5B5] text-[10px] sm:text-xs tracking-[0.3em] uppercase mb-6 drop-shadow-md">
                        Culinary Excellence
                    </span>
                    <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-6 drop-shadow-xl tracking-tight">
                        Taste of Olivia
                    </h1>
                    <p className="text-white/90 text-sm md:text-lg max-w-2xl font-light leading-relaxed drop-shadow-md">
                        A curated journey of global flavors and Kerala heritage, meticulously crafted
                        to elevate your dining experience by the backwaters.
                    </p>
                    <div className="mt-10">
                        <a
                            href="#reserve-table"
                            className="inline-flex items-center justify-center border border-white/50 bg-white/10 backdrop-blur-sm px-8 py-3 text-white text-[11px] tracking-[0.2em] uppercase hover:bg-white hover:text-[#1A1814] transition-all duration-300"
                        >
                            Reserve a Table
                        </a>
                    </div>
                </div>
            </section>

            {/* Operational Outlets - Alternating Layout */}
            <section className="py-20 md:py-32 px-6 lg:px-12 max-w-[1600px] mx-auto">
                <div className="text-center mb-20 md:mb-32">
                    <h2 className="font-serif text-4xl md:text-5xl text-[#2C2A27]">Our Restaurants</h2>
                    <div className="w-12 h-px bg-[#B68845] mx-auto mt-6" />
                </div>

                <div className="space-y-24 md:space-y-40">
                    {operationalOutlets.map((outlet, index) => (
                        <div
                            key={outlet.slug}
                            className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-10 lg:gap-20 items-center`}
                        >
                            {/* Image Side */}
                            <div className="w-full lg:w-1/2">
                                <div className="relative aspect-[4/3] md:aspect-[16/10] w-full overflow-hidden shadow-2xl">
                                    <Image
                                        src={outlet.image}
                                        alt={outlet.name}
                                        fill
                                        className="object-cover hover:scale-105 transition-transform duration-1000"
                                    />
                                </div>
                            </div>

                            {/* Content Side */}
                            <div className="w-full lg:w-1/2 flex flex-col justify-center">
                                <span className="text-[#B68845] text-[10px] tracking-[0.25em] uppercase mb-4">
                                    {outlet.location}
                                </span>
                                <h3 className="font-serif text-4xl md:text-5xl lg:text-[3.5rem] leading-none text-[#1A1814] mb-6">
                                    {outlet.name}
                                </h3>
                                <p className="text-[#4A453D] text-base md:text-lg leading-relaxed font-light mb-10">
                                    {outlet.description}
                                </p>

                                <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-10 border-y border-[#E5DCCB] py-8">
                                    <div className="flex items-start gap-3">
                                        <UtensilsCrossed className="w-5 h-5 text-[#B68845] shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-[#8A857D] mb-1">Cuisine</p>
                                            <p className="text-sm font-medium text-[#2C2A27]">{outlet.cuisine}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Clock className="w-5 h-5 text-[#B68845] shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-[#8A857D] mb-1">Hours</p>
                                            <p className="text-sm font-medium text-[#2C2A27]">{outlet.operatingHours}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Users className="w-5 h-5 text-[#B68845] shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-[#8A857D] mb-1">Capacity</p>
                                            <p className="text-sm font-medium text-[#2C2A27]">{outlet.capacity}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-[#B68845] shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-[#8A857D] mb-1">Location</p>
                                            <p className="text-sm font-medium text-[#2C2A27]">{outlet.location}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <a
                                        href="#reserve-table"
                                        className="inline-flex items-center gap-3 text-[#B68845] text-[11px] tracking-[0.2em] uppercase font-semibold hover:text-[#8B6732] transition-colors group"
                                    >
                                        Reserve Experience
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#B68845]/30 group-hover:border-[#B68845] transition-colors">
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Upcoming Outlets Selection */}
            <section className="bg-[#1A1814] text-[#FBF9F6] py-20 md:py-32">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <div className="text-center mb-16 md:mb-24">
                        <span className="text-[#B68845] text-[10px] tracking-[0.3em] uppercase mb-4 block">The Future of Dining</span>
                        <h2 className="font-serif text-4xl md:text-5xl text-white">Upcoming Experiences</h2>
                        <div className="w-12 h-px bg-[#B68845] mx-auto mt-6" />
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
                        {upcomingOutlets.map((outlet) => (
                            <div key={outlet.slug} className="group cursor-default relative border border-white/10 bg-white/5 hover:bg-white/10 p-6 md:p-10 transition-colors duration-500">
                                <div className="absolute top-6 right-6">
                                    <span className="inline-block border border-[#B68845] text-[#B68845] text-[9px] px-3 py-1 uppercase tracking-[0.2em]">
                                        Opening Soon
                                    </span>
                                </div>

                                <span className="text-white/50 text-[10px] tracking-[0.25em] uppercase mb-3 block">
                                    {outlet.location}
                                </span>
                                <h3 className="font-serif text-3xl md:text-4xl text-white mb-4">
                                    {outlet.name}
                                </h3>
                                <p className="text-white/60 text-sm md:text-base leading-relaxed font-light mb-8 max-w-sm">
                                    {outlet.description}
                                </p>

                                <div className="space-y-4 pt-6 border-t border-white/10 text-sm text-white/80">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/40 uppercase tracking-wider text-[10px]">Cuisine</span>
                                        <span className="text-right pl-4">{outlet.cuisine}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/40 uppercase tracking-wider text-[10px]">Hours</span>
                                        <span className="text-right pl-4">{outlet.operatingHours}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/40 uppercase tracking-wider text-[10px]">Capacity</span>
                                        <span className="text-right pl-4">{outlet.capacity}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Reservation Section */}
            <section id="reserve-table" className="py-20 md:py-32 bg-[#FBF9F6]">
                <div className="max-w-5xl mx-auto px-6 lg:px-12">
                    <div className="relative overflow-hidden rounded-2xl md:rounded-[2rem] border border-[#E0D6C6] shadow-2xl">
                        <Image
                            src="/images/dining/hero.jpg"
                            alt="Reserve your table at Olivia"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#1B1612]/95 via-[#1B1612]/80 to-[#1B1612]/40" />

                        <div className="relative z-10 p-8 md:p-14 lg:p-20 text-white">
                            <span className="text-[#B68845] text-[10px] tracking-[0.3em] uppercase mb-4 block">Secure Your Seat</span>
                            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.1] mb-4">Reserve Your<br />Table</h2>
                            <p className="text-white/80 text-base md:text-lg max-w-md font-light mb-10">
                                Experience flavors crafted with passion, inspired by Kerala & the world. Let us prepare a place for you.
                            </p>

                            <div className="grid lg:grid-cols-[1.5fr_1fr_1fr_auto] gap-4 md:gap-3">
                                <div className="relative rounded-lg border border-white/20 bg-white/10 backdrop-blur-md px-4 py-3 min-h-[50px] flex items-center">
                                    <label htmlFor="restaurant" className="sr-only">Restaurant</label>
                                    <select
                                        id="restaurant"
                                        name="restaurant"
                                        className="w-full appearance-none bg-transparent text-sm md:text-base outline-none text-white cursor-pointer"
                                        defaultValue=""
                                    >
                                        <option value="" disabled className="text-black">Select Restaurant</option>
                                        {operationalOutlets.map((outlet) => (
                                            <option key={`select-${outlet.slug}`} value={outlet.name} className="text-black">{outlet.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                                </div>

                                <label className="relative rounded-lg border border-white/20 bg-white/10 backdrop-blur-md px-4 py-3 min-h-[50px] flex items-center gap-3 cursor-pointer">
                                    <CalendarDays className="w-4 h-4 text-white/50 shrink-0" />
                                    <span className="sr-only">Date</span>
                                    <input
                                        type="date"
                                        className="w-full bg-transparent text-sm md:text-base outline-none text-white [color-scheme:dark]"
                                    />
                                </label>

                                <label className="relative rounded-lg border border-white/20 bg-white/10 backdrop-blur-md px-4 py-3 min-h-[50px] flex items-center gap-3 cursor-pointer">
                                    <Clock3 className="w-4 h-4 text-white/50 shrink-0" />
                                    <span className="sr-only">Time</span>
                                    <input
                                        type="time"
                                        className="w-full bg-transparent text-sm md:text-base outline-none text-white [color-scheme:dark]"
                                    />
                                </label>

                                <Link
                                    href="/contact?type=dining"
                                    className="inline-flex items-center justify-center rounded-lg bg-[#B68845] min-h-[50px] px-8 text-white text-[11px] tracking-[0.2em] font-semibold uppercase hover:bg-[#8B6732] transition-colors"
                                >
                                    Book Table
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
