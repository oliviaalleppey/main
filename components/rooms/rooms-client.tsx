'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
// import { roomTypes } from '@/lib/data/rooms';

interface RoomsClientProps {
    rooms: any[];
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
    const roomTypes = initialRooms.map(room => ({
        ...room,
        // Ensure image property exists for compatibility
        image: room.images && room.images.length > 0 ? room.images[0] : '/images/placeholder.jpg',
        // Ensure features exists (map from amenities if needed)
        features: room.amenities || [],
        // Ensure shortName exists
        shortName: room.name.replace(' Room', '').replace(' Suite', ''),
        // Ensure view exists (default if missing)
        view: room.view || 'Lake View'
    }));
    const containerRef = useRef(null);
    const [activeRoom, setActiveRoom] = useState(0);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 100);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div ref={containerRef} className="bg-[#FBFBF9]">

            {/* Compact Hero Section */}
            <section className="relative h-[50vh] md:h-[60vh] w-full overflow-hidden">
                <motion.div
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 8, ease: "easeOut" }}
                    className="absolute inset-0 z-0"
                >
                    <Image
                        src="/images/rooms/balcony-room-5.jpg"
                        alt="Luxury Accommodations"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
                </motion.div>

                {/* Hero Content - Compact */}
                <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex items-center gap-4 mb-4"
                    >
                        <span className="w-8 h-[1px] bg-[#C9A961]" />
                        <p className="text-[#C9A961] text-[10px] tracking-[0.4em] uppercase font-light">
                            Accommodations
                        </p>
                        <span className="w-8 h-[1px] bg-[#C9A961]" />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 25 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-serif text-white mb-4 tracking-tight leading-none"
                    >
                        Rooms & Suites
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="text-white/70 text-sm md:text-base font-light max-w-lg mx-auto leading-relaxed mb-6"
                    >
                        Where Kerala's timeless beauty meets contemporary luxury
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className="flex gap-3"
                    >
                        <Link
                            href="#rooms-collection"
                            className="bg-white text-[#1C1C1C] px-6 py-2.5 text-[10px] tracking-[0.2em] uppercase hover:bg-[#C9A961] hover:text-white transition-all duration-300"
                        >
                            Explore Rooms
                        </Link>
                        <Link
                            href="/availability"
                            className="border border-white/40 text-white px-6 py-2.5 text-[10px] tracking-[0.2em] uppercase hover:bg-white hover:text-[#1C1C1C] transition-all duration-300"
                        >
                            Check Availability
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Room Categories Navigation */}
            <section className="sticky top-[62px] z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 py-4 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-center gap-2 md:gap-8 overflow-x-auto no-scrollbar">
                        {roomTypes.map((room, index) => (
                            <button
                                key={room.id}
                                onClick={() => {
                                    setActiveRoom(index);
                                    document.getElementById(`room-${index}`)?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className={`px-4 py-2 text-xs md:text-sm tracking-wider whitespace-nowrap transition-all duration-300 ${activeRoom === index
                                    ? 'text-[#C9A961] border-b-2 border-[#C9A961]'
                                    : 'text-[#1C1C1C]/50 hover:text-[#1C1C1C]'
                                    }`}
                            >
                                {room.shortName}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Rooms Collection */}
            <section id="rooms-collection" className="py-16 md:py-24 px-6 md:px-12">
                <div className="max-w-[1600px] mx-auto">
                    <div className="text-center mb-16 md:mb-24">
                        <span className="inline-block w-12 h-[1px] bg-[#C9A961] mb-6" />
                        <h2 className="text-3xl md:text-4xl font-serif text-[#1C1C1C] tracking-wide">The Collection</h2>
                    </div>

                    <div className="space-y-24 md:space-y-32">
                        {roomTypes.map((room, index) => (
                            <RoomCard key={room.id} room={room} index={index} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Amenities Section */}
            <section className="py-24 md:py-32 bg-[#1C1C1C] text-white">
                <div className="max-w-6xl mx-auto px-6 md:px-12">
                    <div className="text-center mb-16">
                        <span className="text-[#C9A961] text-[10px] tracking-[0.4em] uppercase mb-6 block">In-Room Amenities</span>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif mb-6 tracking-wide">
                            Every Detail Considered
                        </h2>
                        <p className="text-white/60 text-lg max-w-2xl mx-auto">
                            Thoughtfully curated amenities ensure your comfort is never compromised
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
                        {roomAmenities.map((amenity, index) => (
                            <motion.div
                                key={amenity.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className="text-center group"
                            >
                                <div className="w-12 h-12 mx-auto mb-6 border border-[#C9A961]/30 flex items-center justify-center group-hover:border-[#C9A961] transition-colors duration-300">
                                    <span className="text-[#C9A961] text-lg font-serif">{String(index + 1).padStart(2, '0')}</span>
                                </div>
                                <h3 className="text-lg font-serif mb-2">{amenity.name}</h3>
                                <p className="text-white/50 text-sm">{amenity.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Signature Suite Highlight */}
            <section className="py-24 md:py-32 px-6 md:px-12 bg-[#FBFBF9]">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-8 items-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1 }}
                            className="relative h-[50vh] md:h-[70vh] order-2 lg:order-1"
                        >
                            <Image
                                src="/images/rooms/balcony-room-5.jpg"
                                alt="Lake View Balcony Suite"
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                            <div className="absolute bottom-8 left-8 right-8">
                                <span className="text-white/80 text-xs tracking-[0.3em] uppercase">Starting from ₹45,000/night</span>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1 }}
                            className="order-1 lg:order-2 lg:pl-12"
                        >
                            <span className="text-[#C9A961] text-[10px] tracking-[0.4em] uppercase mb-4 block">Signature Experience</span>
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-[#1C1C1C] mb-6 leading-tight">
                                Lake View Balcony Suite
                            </h2>
                            <p className="text-[#1C1C1C]/60 text-lg leading-relaxed mb-8">
                                Our most exclusive accommodation offers an unparalleled lakeside experience.
                                With 900 square feet of refined living space, a private balcony with panoramic views,
                                and a separate living area, this suite defines luxury living in Alappuzha.
                            </p>

                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="border-l-2 border-[#C9A961] pl-4">
                                    <p className="text-2xl font-serif text-[#1C1C1C]">900</p>
                                    <p className="text-sm text-[#1C1C1C]/50">Square Feet</p>
                                </div>
                                <div className="border-l-2 border-[#C9A961] pl-4">
                                    <p className="text-2xl font-serif text-[#1C1C1C]">4</p>
                                    <p className="text-sm text-[#1C1C1C]/50">Max Guests</p>
                                </div>
                                <div className="border-l-2 border-[#C9A961] pl-4">
                                    <p className="text-2xl font-serif text-[#1C1C1C]">King</p>
                                    <p className="text-sm text-[#1C1C1C]/50">Bed Configuration</p>
                                </div>
                                <div className="border-l-2 border-[#C9A961] pl-4">
                                    <p className="text-2xl font-serif text-[#1C1C1C]">Private</p>
                                    <p className="text-sm text-[#1C1C1C]/50">Jacuzzi</p>
                                </div>
                            </div>

                            <Link
                                href="/rooms/lake-view-balcony-suite"
                                className="inline-flex items-center gap-4 group"
                            >
                                <span className="text-[#1C1C1C] text-sm tracking-[0.2em] uppercase font-medium">Discover the Suite</span>
                                <span className="w-8 h-[1px] bg-[#C9A961] group-hover:w-16 transition-all duration-300" />
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-16 md:py-24 px-6 md:px-12 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-8">
                        {featuresList.map((feature, index) => (
                            <motion.div
                                key={feature}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="flex items-center gap-4 group"
                            >
                                <div className="w-10 h-10 border border-[#C9A961]/30 flex items-center justify-center group-hover:bg-[#C9A961] transition-colors duration-300">
                                    <svg className="w-4 h-4 text-[#C9A961] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-[#1C1C1C]/70 text-sm tracking-wide">{feature}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Concierge CTA - Refined */}
            <section className="relative py-32 md:py-40 overflow-hidden">
                <div className="absolute inset-0 bg-[url('/images/rooms/balcony-room-2.jpg')] bg-cover bg-center bg-fixed" />
                <div className="absolute inset-0 bg-[#1C1C1C]/80" />

                <div className="relative z-10 max-w-3xl mx-auto text-center px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                    >
                        <span className="inline-block w-12 h-[1px] bg-[#C9A961] mb-8" />
                        <p className="text-[#C9A961] text-[10px] tracking-[0.4em] uppercase mb-6">Personalized Service</p>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white mb-8 leading-tight">
                            Let Us Curate Your
                            <span className="block italic text-[#C9A961]">Perfect Stay</span>
                        </h2>
                        <p className="text-white/60 mb-12 font-light text-lg max-w-xl mx-auto leading-relaxed">
                            Our dedicated concierge team is at your service to personalize every aspect
                            of your visit, from room preferences to bespoke experiences.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/contact"
                                className="group relative bg-[#C9A961] text-[#1C1C1C] px-10 py-4 text-xs tracking-[0.3em] uppercase overflow-hidden"
                            >
                                <span className="relative z-10">Contact Concierge</span>
                            </Link>
                            <Link
                                href="/availability"
                                className="border border-white/30 text-white px-10 py-4 text-xs tracking-[0.3em] uppercase hover:bg-white hover:text-[#1C1C1C] transition-all duration-500"
                            >
                                Check Availability
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Bottom CTA Bar */}
            <section className="bg-[#0A4D4E] py-8 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-white/80 text-sm">
                        <span className="text-[#C9A961]">✦</span> Best rate guarantee when you book directly
                    </p>
                    <Link
                        href="/availability"
                        className="bg-white text-[#0A4D4E] px-8 py-3 text-xs tracking-[0.2em] uppercase hover:bg-[#C9A961] hover:text-white transition-colors duration-300"
                    >
                        Book Your Stay
                    </Link>
                </div>
            </section>
        </div>
    );
}

// Room Card Component
function RoomCard({ room, index }: { room: any; index: number }) {
    const isEven = index % 2 === 0;
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [50, -50]);

    return (
        <motion.div
            id={`room-${index}`}
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 lg:gap-16 items-center scroll-mt-48`}
        >
            {/* Image Section */}
            <div className="w-full lg:w-1/2 relative h-[50vh] lg:h-[70vh] overflow-hidden group">
                <motion.div style={{ y }} className="absolute inset-0 h-[120%] w-full -top-[10%]">
                    <Image
                        src={room.image}
                        alt={room.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-700" />
                </motion.div>

                {/* Price Tag */}
                <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm px-4 py-2 z-10">
                    <p className="text-[#C9A961] text-xs tracking-wider uppercase">From</p>
                    <p className="text-[#1C1C1C] text-xl font-serif">₹{room.basePrice.toLocaleString()}</p>
                </div>

                {/* View Badge */}
                <div className="absolute bottom-6 left-6 z-10">
                    <span className="bg-[#1C1C1C]/80 backdrop-blur-sm text-white text-xs tracking-[0.2em] uppercase px-4 py-2">
                        {room.view}
                    </span>
                </div>
            </div>

            {/* Content Section */}
            <div className={`w-full lg:w-1/2 flex flex-col justify-center py-8 lg:py-0 ${isEven ? 'lg:pl-12' : 'lg:items-end lg:pr-12 text-right'}`}>
                <div className="max-w-lg">
                    <span className="text-[#C9A961] text-[10px] tracking-[0.4em] uppercase mb-4 block">
                        0{index + 1} — {room.view}
                    </span>

                    <h3 className="text-3xl md:text-4xl lg:text-5xl font-serif text-[#1C1C1C] mb-6 leading-tight">
                        {room.name}
                    </h3>

                    <p className="text-[#1C1C1C]/60 text-lg leading-relaxed mb-8">
                        {room.shortDescription}
                    </p>

                    {/* Room Details Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-8 py-6 border-y border-gray-200">
                        <div>
                            <p className="text-2xl font-serif text-[#1C1C1C]">{room.size}</p>
                            <p className="text-xs text-[#1C1C1C]/50 uppercase tracking-wider">Sq Ft</p>
                        </div>
                        <div>
                            <p className="text-2xl font-serif text-[#1C1C1C]">{room.maxGuests}</p>
                            <p className="text-xs text-[#1C1C1C]/50 uppercase tracking-wider">Guests</p>
                        </div>
                        <div>
                            <p className="text-2xl font-serif text-[#1C1C1C]">{room.bedType.split(' ')[0]}</p>
                            <p className="text-xs text-[#1C1C1C]/50 uppercase tracking-wider">Bed</p>
                        </div>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-8">
                        {room.features.map((feature: string) => (
                            <span
                                key={feature}
                                className="text-xs text-[#1C1C1C]/70 border border-gray-200 px-3 py-1"
                            >
                                {feature}
                            </span>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-8">
                        <Link
                            href={`/rooms/${room.slug}`}
                            className="group relative inline-flex items-center gap-4"
                        >
                            <span className="text-[#1C1C1C] text-sm tracking-[0.2em] uppercase font-medium">Explore Room</span>
                            <span className="w-8 h-[1px] bg-[#C9A961] group-hover:w-16 transition-all duration-300" />
                        </Link>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
