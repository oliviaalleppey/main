'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { formatRoomName } from '@/lib/utils';
// import { roomTypes } from '@/lib/data/rooms';

interface RoomInput {
    id: string;
    name: string;
    slug: string;
    shortDescription?: string | null;
    description?: string | null;
    images?: string[] | null;
    amenities?: string[] | null;
    basePrice?: number | string | null;
    size?: number | string | null;
    maxGuests?: number | string | null;
    bedType?: string | null;
    view?: string | null;
}

interface RoomViewModel {
    id: string;
    name: string;
    slug: string;
    shortDescription: string;
    image: string;
    images: string[];
    features: string[];
    shortName: string;
    view: string;
    basePrice: number;
    size: number | string;
    maxGuests: number;
    bedType: string;
}

interface RoomsClientProps {
    rooms: RoomInput[];
}

export default function RoomsClient({ rooms: initialRooms }: RoomsClientProps) {
    // Luxury amenities data
    const roomAmenities = [
        { name: 'Premium Bedding', description: '600-thread-count Egyptian cotton linens' },
        { name: 'Bespoke Toiletries', description: 'Artisan-crafted bath amenities' },
        { name: 'Smart Technology', description: 'Integrated room controls & entertainment' },
        { name: '24-Hour Concierge', description: 'Personalized service around the clock' },
        { name: 'Gourmet Minibar', description: 'Curated selection of refreshments' },
        { name: 'In-Room Dining', description: '24-hour culinary service' },
    ];

    // Room features icons
    const featuresList = [
        'Lake Views',
        'Private Balcony',
        'Rain Shower',
        'King Bed',
        'Work Desk',
        'Seating Area',
        'Mini Bar',
        'Safe Deposit',
    ];
    const roomTypes: RoomViewModel[] = initialRooms.map((room) => {
        const displayName = formatRoomName(room.name);
        return {
            id: room.id,
            name: displayName,
            slug: room.slug,
            images: room.images && room.images.length > 0 ? room.images : ['/images/placeholder.jpg'],
            // Ensure image property exists for compatibility
            image: room.images && room.images.length > 0 ? room.images[0] : '/images/placeholder.jpg',
            // Ensure features exists (map from amenities if needed)
            features: room.amenities || [],
            // Ensure shortName exists
            shortName: displayName,
            // Ensure view exists (default if missing)
            view: room.view || 'Lake View',
            shortDescription: (room.shortDescription || room.description || 'Refined accommodation with tailored comforts.').replace('watero', 'waterfront'),
            basePrice: Number(room.basePrice || 0),
            size: room.size || '—',
            maxGuests: Number(room.maxGuests || 2),
            bedType: room.bedType || 'King Bed',
        };
    });
    const containerRef = useRef(null);
    const [activeRoom, setActiveRoom] = useState(0);

    return (
        <div ref={containerRef} className="bg-[#FAF8F3]">

            {/* Compact Hero Section */}
            <section className="relative h-[44vh] md:h-[52vh] w-full overflow-hidden">
                <motion.div
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 8, ease: "easeOut" }}
                    className="absolute inset-0 z-0"
                >
                    {/* Placeholder background (image to be added later) */}
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,#1C2622_0%,#2B3A34_38%,#1B2421_100%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_25%_30%,rgba(231,212,173,0.18)_0%,rgba(231,212,173,0)_60%)]" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/40" />
                </motion.div>

                {/* Hero Content - Compact */}
                <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex items-center gap-4 mb-3"
                    >
                        <span className="w-8 h-[1px] bg-white/80" />
                        <p className="text-white text-[10px] tracking-[0.34em] uppercase font-light">
                            Accommodations
                        </p>
                        <span className="w-8 h-[1px] bg-white/80" />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 25 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-[2.75rem] md:text-[4.5rem] lg:text-[5.5rem] font-serif font-medium text-white mb-4 tracking-[-0.02em] leading-[1.05] [text-shadow:0_2px_18px_rgba(0,0,0,0.45)]"
                    >
                        Rooms & Suites
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="text-white/90 text-sm md:text-base font-light max-w-lg mx-auto leading-relaxed mb-5 [text-shadow:0_1px_12px_rgba(0,0,0,0.4)]"
                    >
                        Where Kerala&apos;s timeless beauty meets contemporary luxury
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className="flex gap-3"
                    >
                        <Link
                            href="#rooms-collection"
                            className="border border-white/80 bg-white/92 text-[#2D3933] px-5 py-2 text-[10px] tracking-[0.2em] uppercase hover:bg-white transition-colors duration-300"
                        >
                            Explore Rooms
                        </Link>
                        <Link
                            href="#booking-search"
                            className="border border-white/70 bg-transparent text-white px-5 py-2 text-[10px] tracking-[0.2em] uppercase hover:bg-white/12 transition-colors duration-300"
                        >
                            Check Availability
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Room Categories Navigation */}
            <section
                className="sticky z-40 bg-[#FBF9F3] border-b border-[#E8E0D1] py-3 md:py-3.5 transition-all duration-300"
                style={{ top: 'var(--site-header-height, 62px)' }}
            >
                <div className="w-full px-3 sm:px-6 md:px-12">
                    <div className="flex items-center justify-center gap-3 px-1 md:px-2 pb-2">
                        <p className="text-[10px] md:text-[11px] uppercase tracking-[0.28em] text-[#6B645C] whitespace-nowrap">
                            Select a room
                        </p>
                    </div>
                    <p className="text-center text-[10px] md:text-[11px] uppercase tracking-[0.28em] text-[#6B645C] whitespace-nowrap lg:hidden -mt-1 mb-2">
                        Swipe →
                    </p>
                    <div className="-mx-1 overflow-x-auto lg:overflow-x-visible no-scrollbar">
                        <div className="flex min-w-max lg:min-w-0 lg:w-full items-center gap-2 md:gap-3 px-1 md:px-2 lg:justify-between">
                            {roomTypes.map((room, index) => (
                                <button
                                    key={room.id}
                                    onClick={() => {
                                        setActiveRoom(index);
                                        document.getElementById(`room-${index}`)?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className={`relative px-4 md:px-5 py-2.5 text-[11px] md:text-xs tracking-[0.12em] uppercase whitespace-nowrap transition-colors duration-200 lg:flex-1 lg:text-center rounded-full border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BCA06F]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF9F3] cursor-pointer ${activeRoom === index
                                        ? 'bg-[#0A332B] border-[#0A332B] text-white shadow-[0_14px_30px_-22px_rgba(10,51,43,0.65)]'
                                        : 'bg-white/80 border-[#E6DDCE] text-[#2E3934] hover:bg-white hover:border-[#CFC2AD]'
                                        }`}
                                    aria-pressed={activeRoom === index}
                                >
                                    {room.shortName}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Rooms Collection */}
            <section id="rooms-collection" className="py-8 md:py-10 px-6 md:px-10 scroll-mt-[130px] md:scroll-mt-[150px]">
                <div className="max-w-[1600px] mx-auto">
                    <div className="text-center mb-10 md:mb-12">
                        <span className="inline-block w-12 h-[1px] bg-[#C6AF84] mb-5" />
                        <h2 className="text-4xl md:text-5xl font-serif text-[#2C3632] tracking-tight">The Collection</h2>
                    </div>

                    <div className="space-y-8 md:space-y-10">
                        {roomTypes.map((room, index) => (
                            <RoomCard key={room.id} room={room} index={index} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Amenities Section */}
            <section className="py-12 md:py-16 bg-[#F3EEE4] text-[#2D3732] border-y border-[#E4DCCB]">
                <div className="max-w-6xl mx-auto px-6 md:px-10">
                    <div className="text-center mb-10">
                        <span className="text-[#8D7858] text-[10px] tracking-[0.3em] uppercase mb-4 block">In-Room Amenities</span>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif mb-4 tracking-wide">
                            Every Detail Considered
                        </h2>
                        <p className="text-[#42524A]/75 text-base md:text-lg max-w-2xl mx-auto">
                            Thoughtfully curated amenities ensure your comfort is never compromised
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-8">
                        {roomAmenities.map((amenity, index) => (
                            <motion.div
                                key={amenity.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className="text-center group"
                            >
                                <div className="w-11 h-11 mx-auto mb-4 border border-[#D6C3A0] bg-[#FBF7EE] flex items-center justify-center group-hover:border-[#BCA06F] transition-colors duration-300">
                                    <span className="text-[#8D7858] text-lg font-serif">{String(index + 1).padStart(2, '0')}</span>
                                </div>
                                <h3 className="text-lg font-serif mb-1.5">{amenity.name}</h3>
                                <p className="text-[#4A5A52]/70 text-sm">{amenity.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Signature Suite Highlight */}
            <section className="py-12 md:py-16 px-6 md:px-10 bg-[#FAF8F3]">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-6 items-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1 }}
                            className="relative h-[44vh] md:h-[58vh] order-2 lg:order-1 rounded-sm overflow-hidden"
                        >
                            <Image
                                src="/images/rooms/balcony-room-5.jpg"
                                alt="Lake View Balcony Suite Room"
                                fill
                                className="object-cover"
                            />
                            <div className="absolute bottom-8 left-8 right-8">
                                <span className="text-[#324038] text-xs tracking-[0.2em] uppercase bg-[#FCFAF5]/85 px-3 py-1.5 inline-block">Starting from ₹45,000/night</span>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1 }}
                            className="order-1 lg:order-2 lg:pl-8"
                        >
                            <span className="text-[#8D7858] text-[10px] tracking-[0.3em] uppercase mb-3 block">Signature experiences</span>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-[#2D3732] mb-4 leading-tight">
                                Lake View Balcony Suite Room
                            </h2>
                            <p className="-mt-2 mb-5 font-serif text-xl md:text-2xl text-[#2D3732]/85 leading-tight">
                                Lake View Balcony Room
                            </p>
                            <p className="text-[#3E4C45]/75 text-base md:text-lg leading-relaxed mb-6">
                                Our most exclusive accommodation offers an unparalleled lakeside experience.
                                With 900 square feet of refined living space, a private balcony with panoramic views,
                                and a separate living area, this suite defines luxury living in Alappuzha.
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="border-l-2 border-[#BCA06F] pl-3">
                                    <p className="text-2xl font-serif text-[#2D3732]">900</p>
                                    <p className="text-sm text-[#4B5A53]/70">Square Feet</p>
                                </div>
                                <div className="border-l-2 border-[#BCA06F] pl-3">
                                    <p className="text-2xl font-serif text-[#2D3732]">4</p>
                                    <p className="text-sm text-[#4B5A53]/70">Max Guests</p>
                                </div>
                                <div className="border-l-2 border-[#BCA06F] pl-3">
                                    <p className="text-2xl font-serif text-[#2D3732]">King</p>
                                    <p className="text-sm text-[#4B5A53]/70">Bed Configuration</p>
                                </div>
                                <div className="border-l-2 border-[#BCA06F] pl-3">
                                    <p className="text-2xl font-serif text-[#2D3732]">Private</p>
                                    <p className="text-sm text-[#4B5A53]/70">Jacuzzi</p>
                                </div>
                            </div>

                            <Link
                                href="/rooms/lake-view-balcony-suite"
                                className="inline-flex items-center gap-4 group"
                            >
                                <span className="text-[#2D3732] text-sm tracking-[0.2em] uppercase font-medium">Discover the Suite</span>
                                <span className="w-8 h-[1px] bg-[#C6AF84] group-hover:w-14 transition-all duration-300" />
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Signature Room Highlight */}
            <section className="py-12 md:py-16 px-6 md:px-10 bg-[#FAF8F3]">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-6 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1 }}
                            className="lg:pr-8"
                        >
                            <span className="text-[#8D7858] text-[10px] tracking-[0.3em] uppercase mb-3 block">Signature experiences</span>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-[#2D3732] mb-4 leading-tight">
                                Lake View Balcony Room
                            </h2>
                            <p className="text-[#3E4C45]/75 text-base md:text-lg leading-relaxed mb-6">
                                A refined balcony room with sweeping lake views and a calmer pace throughout the day.
                                Step outside for morning light, fresh air, and a sense of place that feels effortless.
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="border-l-2 border-[#BCA06F] pl-3">
                                    <p className="text-2xl font-serif text-[#2D3732]">400</p>
                                    <p className="text-sm text-[#4B5A53]/70">Square Feet</p>
                                </div>
                                <div className="border-l-2 border-[#BCA06F] pl-3">
                                    <p className="text-2xl font-serif text-[#2D3732]">2</p>
                                    <p className="text-sm text-[#4B5A53]/70">Max Guests</p>
                                </div>
                                <div className="border-l-2 border-[#BCA06F] pl-3">
                                    <p className="text-2xl font-serif text-[#2D3732]">King</p>
                                    <p className="text-sm text-[#4B5A53]/70">Bed Configuration</p>
                                </div>
                                <div className="border-l-2 border-[#BCA06F] pl-3">
                                    <p className="text-2xl font-serif text-[#2D3732]">Private</p>
                                    <p className="text-sm text-[#4B5A53]/70">Balcony</p>
                                </div>
                            </div>

                            <Link href="/rooms/lake-view-balcony" className="inline-flex items-center gap-4 group">
                                <span className="text-[#2D3732] text-sm tracking-[0.2em] uppercase font-medium">Discover the Room</span>
                                <span className="w-8 h-[1px] bg-[#BCA06F] group-hover:w-14 transition-all duration-300" />
                            </Link>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1 }}
                            className="relative h-[44vh] md:h-[58vh] rounded-sm overflow-hidden"
                        >
                            <Image
                                src="/images/rooms/balcony-room-4.jpg"
                                alt="Lake View Balcony Room"
                                fill
                                className="object-cover"
                            />
                            <div className="absolute bottom-8 left-8 right-8">
                                <span className="text-[#324038] text-xs tracking-[0.2em] uppercase bg-[#FCFAF5]/85 px-3 py-1.5 inline-block">
                                    Starting from ₹22,000/night
                                </span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-10 md:py-14 px-6 md:px-10 bg-[#FCFAF5] border-t border-[#ECE5D7]">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-5">
                        {featuresList.map((feature, index) => (
                            <motion.div
                                key={feature}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="flex items-center gap-3 group"
                            >
                                <div className="w-9 h-9 border border-[#DCCBAA] bg-[#FEFCF7] flex items-center justify-center group-hover:bg-[#F4ECDD] transition-colors duration-300">
                                    <svg className="w-4 h-4 text-[#A48755] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-[#3E4D46]/80 text-sm tracking-wide">{feature}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Concierge CTA - Refined */}
            <section className="relative py-14 md:py-16 overflow-hidden">
                <div className="absolute inset-0 bg-[url('/images/rooms/balcony-room-2.jpg')] bg-cover bg-center" />

                <div className="relative z-10 max-w-3xl mx-auto text-center px-6 md:px-10 bg-[#FCFAF5]/92 border border-[#E6DDCE] py-8 md:py-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                    >
                        <span className="inline-block w-10 h-[1px] bg-[#BFA47A] mb-5" />
                        <p className="text-[#8E7859] text-[10px] tracking-[0.3em] uppercase mb-4">Personalized Service</p>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-[#2D3732] mb-5 leading-tight">
                            Let Us Curate Your
                            <span className="block italic text-[#8C7451]">Perfect Stay</span>
                        </h2>
                        <p className="text-[#3F5048]/75 mb-7 font-light text-base md:text-lg max-w-xl mx-auto leading-relaxed">
                            Our dedicated concierge team is at your service to personalize every aspect
                            of your visit, from room preferences to bespoke experiences.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href="/contact"
                                className="group relative border border-[#D3C2A4] bg-[#FCFAF5] text-[#2E3934] px-8 py-3 text-xs tracking-[0.24em] uppercase hover:bg-[#F3ECDD] transition-colors"
                            >
                                <span className="relative z-10">Contact Concierge</span>
                            </Link>
                            <Link
                                href="#booking-search"
                                className="border border-[#D3C2A4] text-[#2E3934] bg-[#F7F2E8]/85 px-8 py-3 text-xs tracking-[0.24em] uppercase hover:bg-[#EFE6D5] transition-colors"
                            >
                                Check Availability
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Bottom CTA Bar */}
            <section className="bg-[#F6F1E7] py-4 px-6 border-t border-[#E6DDCB]">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2.5">
                    <p className="text-[#3E4E47]/85 text-sm">
                        <span className="text-[#A68A5A]">✦</span> Best rate guarantee when you book directly
                    </p>
                    <Link
                        href="#booking-search"
                        className="border border-[#D3C3A7] bg-[#FCFAF5] text-[#31403A] px-6 py-2.5 text-xs tracking-[0.18em] uppercase hover:bg-[#F1E9D9] transition-colors duration-300"
                    >
                        Book Your Stay
                    </Link>
                </div>
            </section>
        </div>
    );
}

// Room Card Component
function RoomCard({ room, index }: { room: RoomViewModel; index: number }) {
    const isEven = index % 2 === 0;
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [18, -18]);

    return (
        <motion.div
            id={`room-${index}`}
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-6 lg:gap-8 items-stretch lg:min-h-[46vh] scroll-mt-[200px] md:scroll-mt-[220px]`}
        >
            {/* Image Section */}
            <div className="w-full lg:w-1/2 relative h-[34vh] sm:h-[40vh] lg:h-[44vh] xl:h-[46vh] overflow-hidden group">
                <motion.div style={{ y }} className="absolute inset-0 h-[120%] w-full -top-[10%]">
                    <Image
                        src={room.image}
                        alt={room.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                </motion.div>

                {/* Price Tag - Floating Premium Style */}
                <div className="absolute top-3 right-3 md:top-4 md:right-4 z-10">
                    {/* Mobile: compact chip */}
                    <div className="md:hidden rounded-full bg-black/35 text-white border border-white/20 backdrop-blur-sm px-3 py-1.5 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.45)]">
                        <span className="text-[10px] tracking-[0.22em] uppercase opacity-90">From</span>
                        <span className="ml-2 text-[13px] font-semibold tabular-nums">
                            ₹{(room.basePrice / 100).toLocaleString('en-IN')}
                        </span>
                        <span className="ml-1 text-[10px] tracking-[0.18em] uppercase opacity-80">/ night</span>
                    </div>

                    {/* Desktop: premium badge */}
                    <div className="hidden md:flex items-center gap-3 bg-gradient-to-b from-[#FBF8F3] to-[#F3EEE5] border border-white/85 ring-1 ring-black/5 shadow-[0_16px_36px_-26px_rgba(0,0,0,0.32)] px-4 py-2.5 rounded-full">
                        <span className="text-[#8A6B34] text-[10px] tracking-[0.32em] uppercase font-medium">
                            Room From
                        </span>
                        <span className="h-4 w-px bg-black/10" aria-hidden="true" />
                        <span className="text-[#1C1C1C] text-[1.25rem] font-serif font-[300] lining-nums tabular-nums tracking-[-0.01em] leading-none">
                            ₹{(room.basePrice / 100).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[#6B645C] text-[10px] font-medium tracking-[0.16em] uppercase">
                            / Night
                        </span>
                    </div>
                </div>

                {/* View Badge - Subtle Luxury */}
                <div className="absolute bottom-6 left-6 z-10 flex items-center gap-3">
                    <div className="backdrop-blur-md bg-black/25 border border-white/20 text-white text-[10px] font-accent tracking-[0.3em] uppercase px-5 py-2.5 rounded-full flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#BCA06F] animate-pulse" />
                        {room.view}
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className={`w-full lg:w-1/2 flex flex-col justify-center py-2 lg:py-0 ${isEven ? 'lg:pl-8' : 'lg:items-end lg:pr-8 text-right'}`}>
                <div className="max-w-lg">
                    <span className="text-[#BCA06F] text-[10px] md:text-[11px] font-accent tracking-[0.4em] uppercase mb-4 block">
                        {String(index + 1).padStart(2, '0')} — {['Lake View', 'Canal View', 'Canal View', 'Boat Race View', 'Lake View', 'Lake View'][index] || room.view}
                    </span>

                    <h3 className="text-3xl md:text-4xl lg:text-[2.55rem] font-serif text-[#1C1C1C] mb-4 leading-tight">
                        {room.name}
                    </h3>

                    <p className="text-[#403A35] text-base md:text-[1.05rem] leading-[1.7] tracking-wide mb-6 font-light">
                        {room.shortDescription}
                    </p>

                    {/* Room Details Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-6 py-5 border-y border-[#E3DDD4]">
                        <div>
                            <p className="text-[1.92rem] md:text-[2.08rem] font-sans font-[300] tabular-nums text-[#181818] leading-none mb-1 tracking-[-0.02em]">
                                {room.size}
                            </p>
                            <p className="text-[10px] text-[#655D55] uppercase tracking-[0.22em] font-medium">Sq Ft</p>
                        </div>
                        <div>
                            <p className="text-[1.92rem] md:text-[2.08rem] font-sans font-[300] tabular-nums text-[#181818] leading-none mb-1 tracking-[-0.02em]">
                                {room.maxGuests}
                            </p>
                            <p className="text-[10px] text-[#655D55] uppercase tracking-[0.22em] font-medium">Guests</p>
                        </div>
                        <div>
                            <p className="text-[1.62rem] md:text-[1.82rem] font-sans font-[300] text-[#181818] leading-none mb-1 tracking-[-0.01em]">
                                {room.bedType.split(' ')[0]}
                            </p>
                            <p className="text-[10px] text-[#655D55] uppercase tracking-[0.22em] font-medium">Bed Type</p>
                        </div>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                        {room.features.map((feature: string) => (
                            <span
                                key={feature}
                                className="text-xs text-[#403A35] border border-[#BCA06F] bg-[#FCFAF5] px-2.5 py-1"
                            >
                                {feature}
                            </span>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center pt-2">
                        <Link
                            href={`/rooms/${room.slug}`}
                            className="group relative inline-flex items-center justify-center px-8 py-3.5 border border-[#BCA06F] text-[#1C1C1C] overflow-hidden transition-colors duration-300 hover:border-[#15443B]"
                        >
                            <span className="absolute inset-0 w-full h-full bg-[#15443B] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out z-0"></span>
                            <span className="relative z-10 text-[11px] tracking-[0.24em] uppercase font-normal group-hover:text-white transition-colors duration-300">Explore Room</span>
                            <svg className="relative z-10 w-3.5 h-3.5 ml-3 transform group-hover:translate-x-1 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
