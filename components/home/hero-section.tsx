'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { LuxuryDatePicker } from '@/components/ui/luxury-date-picker';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const HERO_IMAGES = [
    {
        url: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=2560&auto=format&fit=crop",
        alt: "Infinity Pool overlooking lush greenery"
    },
    {
        url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2560&auto=format&fit=crop",
        alt: "Luxury Resort Atmosphere"
    },
    {
        url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2560&auto=format&fit=crop",
        alt: "Relaxing Poolside"
    },
    {
        url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2560&auto=format&fit=crop",
        alt: "Fine Dining Experience"
    }
];

export default function HeroSection() {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [date, setDate] = useState<DateRange | undefined>();
    const [guests, setGuests] = useState({ adults: 2, children: 0 });
    const router = useRouter();

    const [heroImages, setHeroImages] = useState(HERO_IMAGES);

    // Fetch dynamic images on mount
    useEffect(() => {
        async function fetchImages() {
            try {
                // Dynamic import to avoid server-side issues if needed, or just standard fetch
                // We'll use a server action wrapper or direct fetch if we made an API
                // But since we have a server action, let's call it via an API route or pass it down?
                // Actually, server actions can be called directly in Client Components.
                const { getHeroImages } = await import('@/lib/db/actions/settings-actions');
                const dynamicImages = await getHeroImages();
                if (dynamicImages && dynamicImages.length > 0) {
                    setHeroImages(dynamicImages);
                }
            } catch (error) {
                console.error("Failed to fetch hero images", error);
            }
        }
        fetchImages();
    }, []);

    // Auto-advance image every 6 seconds (using heroImages instead of constant)
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [heroImages]); // Added dependency on heroImages

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (date?.from) params.set('checkIn', date.from.toISOString());
        if (date?.to) params.set('checkOut', date.to.toISOString());
        params.set('adults', guests.adults.toString());
        params.set('children', guests.children.toString());

        router.push(`/rooms?${params.toString()}`);
    };

    return (
        <section className="relative h-screen w-full select-none overflow-hidden bg-black">
            {/* Background Image Carousel */}
            <AnimatePresence>
                <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-0"
                >
                    <Image
                        src={heroImages[currentImageIndex].url}
                        alt={heroImages[currentImageIndex].alt}
                        fill
                        className="object-cover"
                        priority
                    />
                    {/* Cinematic Overlay */}
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
                </motion.div>
            </AnimatePresence>

            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                {heroImages.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`h-1 rounded-full transition-all duration-300 ${index === currentImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>

            {/* Centered Typography */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 text-center px-4 pt-32">
                <p className="text-white text-xs md:text-sm uppercase tracking-[0.3em] mb-4 animate-fade-in-up">The Collection</p>
                <h2 className="text-white text-5xl md:text-7xl lg:text-8xl font-serif mb-6 tracking-wide animate-fade-in-up delay-100 drop-shadow-lg">
                    A SENSE OF PLACE
                </h2>
                <p className="text-white text-sm md:text-lg font-light tracking-wider opacity-90 max-w-2xl animate-fade-in-up delay-200 drop-shadow-md">
                    Discover a world of refined elegance and timeless luxury.
                </p>
            </div>

            {/* Floating Search Bar - Unified Pill Style */}
            <div id="booking-search" className="absolute bottom-10 left-0 right-0 z-30 px-4 md:px-0 safe-area-bottom flex justify-center">

                {/* Floating Search Bar - Segmented Style */}
                <div id="booking-search" className="absolute bottom-10 left-0 right-0 z-30 px-4 md:px-0 safe-area-bottom flex justify-center">
                    <div className="max-w-5xl w-full mx-auto flex flex-col md:flex-row items-end gap-4 animate-fade-in-up delay-300">

                        {/* Stay Period Segment */}
                        <div className="w-full md:flex-1 relative group">
                            <label className="text-white text-xs font-bold uppercase tracking-widest mb-2 block ml-1 shadow-black/50 drop-shadow-md">Stay period</label>
                            <button
                                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                                className="w-full bg-white h-14 rounded-lg px-4 flex items-center justify-between hover:bg-gray-50 transition-colors shadow-lg"
                            >
                                <span className={`text-base font-medium ${!date?.from ? "text-gray-500" : "text-gray-900"}`}>
                                    {date?.from ? format(date.from, 'EEE, dd MMM yyyy') : 'Check-in'}
                                </span>
                                <span className="text-gray-300">→</span>
                                <span className={`text-base font-medium ${!date?.to ? "text-gray-500" : "text-gray-900"}`}>
                                    {date?.to ? format(date.to, 'EEE, dd MMM yyyy') : 'Check-out'}
                                </span>
                            </button>

                            {/* Date Picker Popover */}
                            {isDatePickerOpen && (
                                <div className="absolute bottom-full left-0 mb-2 z-50">
                                    <LuxuryDatePicker
                                        date={date}
                                        setDate={setDate}
                                        onClose={() => setIsDatePickerOpen(false)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Guests Segment */}
                        <div className="w-full md:w-[320px]">
                            <label className="text-white text-xs font-bold uppercase tracking-widest mb-2 block ml-1 shadow-black/50 drop-shadow-md">Guests</label>
                            <div className="w-full bg-white h-14 rounded-lg px-2 flex items-center shadow-lg">
                                {/* Adults */}
                                <div className="flex-1 flex items-center justify-between px-2">
                                    <span className="text-sm font-medium text-gray-900">Adult</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setGuests({ ...guests, adults: Math.max(1, guests.adults - 1) })}
                                            className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:text-black hover:border-black transition-all"
                                        >−</button>
                                        <span className="text-sm font-bold w-4 text-center">{guests.adults}</span>
                                        <button
                                            onClick={() => setGuests({ ...guests, adults: guests.adults + 1 })}
                                            className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:text-black hover:border-black transition-all"
                                        >+</button>
                                    </div>
                                </div>

                                <div className="w-px h-8 bg-gray-200 mx-1"></div>

                                {/* Children */}
                                <div className="flex-1 flex items-center justify-between px-2">
                                    <span className="text-sm font-medium text-gray-900">Child</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setGuests({ ...guests, children: Math.max(0, guests.children - 1) })}
                                            className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:text-black hover:border-black transition-all"
                                        >−</button>
                                        <span className="text-sm font-bold w-4 text-center">{guests.children}</span>
                                        <button
                                            onClick={() => setGuests({ ...guests, children: guests.children + 1 })}
                                            className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:text-black hover:border-black transition-all"
                                        >+</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Search Button */}
                        <div className="w-full md:w-auto">
                            <button
                                onClick={handleSearch}
                                className="w-full bg-[#0A332B] hover:bg-[#15443B] text-white h-14 px-8 rounded-lg text-sm font-bold uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                                Search Availability
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
