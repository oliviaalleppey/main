'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { LuxuryDatePicker } from '@/components/ui/luxury-date-picker';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const FALLBACK_SLIDES = [
    { url: "/images/home/ambal.jpeg", alt: "Olivia Hotel" }
];

interface HeroSlide { url: string; alt: string; }

export default function HeroSection({
    initialMedia,
    heroSlides = [],
}: {
    initialMedia?: { type: 'video' | 'image', url: string } | null;
    heroSlides?: HeroSlide[];
}) {
    // Use DB slides if available; otherwise fall back to hardcoded image
    const slides: HeroSlide[] = heroSlides.length > 0 ? heroSlides : FALLBACK_SLIDES;
    const showVideo = initialMedia?.type === 'video';

    const [currentIndex, setCurrentIndex] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (showVideo && videoRef.current) {
            videoRef.current.play().catch(() => {});
        }
    }, [showVideo]);

    // Auto-advance carousel (skip if video)
    useEffect(() => {
        if (showVideo || slides.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [showVideo, slides.length]);

    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [date, setDate] = useState<DateRange | undefined>(undefined);
    const [guests, setGuests] = useState({ adults: 2, children: 0 });
    const router = useRouter();

    useEffect(() => {
        const onEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsDatePickerOpen(false);
        };

        if (isDatePickerOpen) {
            const html = document.documentElement;
            window.addEventListener('keydown', onEscape);
            const previousBodyOverflow = document.body.style.overflow;
            const previousHtmlOverflow = html.style.overflow;
            const previousBodyOverscroll = document.body.style.overscrollBehavior;
            const previousHtmlOverscroll = html.style.overscrollBehavior;
            document.body.style.overflow = 'hidden';
            html.style.overflow = 'hidden';
            document.body.style.overscrollBehavior = 'none';
            html.style.overscrollBehavior = 'none';
            return () => {
                window.removeEventListener('keydown', onEscape);
                document.body.style.overflow = previousBodyOverflow;
                html.style.overflow = previousHtmlOverflow;
                document.body.style.overscrollBehavior = previousBodyOverscroll;
                html.style.overscrollBehavior = previousHtmlOverscroll;
            };
        }
    }, [isDatePickerOpen]);

    useEffect(() => {
        if (date?.from && date?.to) {
            setSearchError(null);
        }
    }, [date]);

    const handleSearch = () => {
        if (!date?.from || !date?.to) {
            setSearchError('Select check-in and check-out to continue');
            setIsDatePickerOpen(true);
            return;
        }
        setSearchError(null);

        const params = new URLSearchParams();
        params.set('checkIn', format(date.from, 'yyyy-MM-dd'));
        params.set('checkOut', format(date.to, 'yyyy-MM-dd'));
        params.set('adults', guests.adults.toString());
        params.set('children', guests.children.toString());

        router.push(`/book/search?${params.toString()}`);
    };

    return (
        <section className="relative h-[100vh] supports-[height:100dvh]:h-[100dvh] w-full select-none overflow-hidden bg-black">
            {/* Background Media */}
            <AnimatePresence>
                {showVideo ? (
                    <motion.div
                        key="hero-video"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="absolute inset-0"
                    >
                        <video
                            ref={videoRef}
                            src={initialMedia!.url}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
                    </motion.div>
                ) : (
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="absolute inset-0"
                    >
                        <Image
                            src={slides[currentIndex].url}
                            alt={slides[currentIndex].alt}
                            fill
                            className="object-cover"
                            priority={currentIndex === 0}
                        />
                        <div className="absolute inset-0 bg-black/30" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Carousel dot indicators (only when multiple slides) */}
            {!showVideo && slides.length > 1 && (
                <div className="absolute bottom-64 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`h-1 rounded-full transition-all duration-300 ${index === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'}`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Centered Typography */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 text-center px-4 pb-48">
                <p className="text-white text-xs md:text-sm uppercase tracking-[0.3em] mb-4 animate-fade-in-up"></p>
                <h2 className="text-white text-5xl md:text-7xl lg:text-8xl font-serif mb-6 tracking-wide animate-fade-in-up delay-100 drop-shadow-lg">
                    Experience The Inexperienced
                </h2>
                <p className="text-white text-sm md:text-lg font-light tracking-wider opacity-90 max-w-2xl animate-fade-in-up delay-200 drop-shadow-md">
                    Discover a world of refined elegance and timeless luxury.
                </p>
            </div>

            {/* Floating Search Bar - Unified Pill Style */}
            <div id="booking-search" className="absolute bottom-40 left-0 right-0 z-30 px-4 md:px-0 safe-area-bottom flex flex-col items-center">
                <div className="max-w-5xl w-full mx-auto flex flex-col md:flex-row items-end gap-4 animate-fade-in-up delay-300">

                    {/* Stay Period Segment */}
                    <div className="w-full md:flex-1 relative group">
                        <label className="text-white text-xs font-bold uppercase tracking-widest mb-2 block ml-1 shadow-black/50 drop-shadow-md">Stay period</label>
                        <button
                            onClick={() => setIsDatePickerOpen(true)}
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

                        {/* Date Picker Overlay */}
                        {isDatePickerOpen && (
                            <>
                                <button
                                    aria-label="Close date picker"
                                    className="fixed inset-0 z-40 cursor-default bg-black/35"
                                    onClick={() => setIsDatePickerOpen(false)}
                                />
                                <div className="fixed inset-x-0 bottom-0 md:inset-0 z-50 flex items-end md:items-center justify-center p-2 md:p-6 overscroll-none">
                                    <LuxuryDatePicker
                                        date={date}
                                        setDate={setDate}
                                        onClose={() => setIsDatePickerOpen(false)}
                                        className="w-full max-w-[860px] rounded-t-3xl md:rounded-3xl max-h-[90vh] overflow-auto overscroll-contain"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Guests Segment */}
                    <div className="w-full md:w-[360px]">
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
                                        onClick={() => setGuests({ ...guests, adults: Math.min(8, guests.adults + 1) })}
                                        className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:text-black hover:border-black transition-all"
                                    >+</button>
                                </div>
                            </div>

                            <div className="w-px h-8 bg-gray-200 mx-1"></div>

                            {/* Children */}
                            <div className="flex-1 flex items-center justify-between px-2">
                                <div className="flex flex-col xl:flex-row xl:items-baseline gap-0 xl:gap-1 leading-tight">
                                    <span className="text-sm font-medium text-gray-900">Child</span>
                                    <span className="text-[10px] text-gray-500 font-normal whitespace-nowrap">(&lt; 7 yrs)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setGuests({ ...guests, children: Math.max(0, guests.children - 1) })}
                                        className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:text-black hover:border-black transition-all"
                                    >−</button>
                                    <span className="text-sm font-bold w-4 text-center">{guests.children}</span>
                                    <button
                                        onClick={() => setGuests({ ...guests, children: Math.min(6, guests.children + 1) })}
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
                            className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white h-14 px-8 rounded-lg text-sm font-bold uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                            Search Availability
                        </button>
                    </div>

                </div>
                {searchError && (
                    <p className="text-[11px] text-red-100 bg-black/35 rounded px-3 py-1.5 mt-2 inline-block">
                        {searchError}
                    </p>
                )}
            </div>
        </section>
    );
}
