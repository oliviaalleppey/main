'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { LuxuryDatePicker } from '@/components/ui/luxury-date-picker';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone } from 'lucide-react';

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
            videoRef.current.play().catch(() => { });
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
        <section className="relative h-[calc(100vh-var(--site-header-height))] supports-[height:100dvh]:h-[calc(100dvh-var(--site-header-height))] w-full select-none bg-black">
            {/* Background Media — overflow-hidden here only, so content layer is never clipped */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
                        {/* Lighter overlay for better visibility */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-black/30" />
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
                            sizes="100vw"
                            className="object-cover"
                            priority={currentIndex === 0}
                        />
                        {/* Lighter overlay for better image visibility */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-black/30" />
                    </motion.div>
                )}
            </AnimatePresence>
            </div>

            {/* ── Single flex-column content layer ── */}
            {/* All content lives here so flex distributes space — no fixed px offsets needed */}
            <div className="absolute inset-0 flex flex-col z-10 text-white">

                {/* Dubai booking office — MOBILE: full-width emerald booking bar at top */}
                <div className="sm:hidden w-full z-20 bg-gradient-to-r from-[#065f46] via-[#0a7c54] to-[#065f46] border-b border-[var(--gold-accent)]/50 shadow-lg px-3 py-2 text-center animate-fade-in-up">
                    <p className="font-serif uppercase tracking-[0.25em] text-[10px] leading-none text-[var(--gold-accent)]">
                        Dubai Booking Office
                    </p>
                    <div className="mt-1 flex items-center justify-center gap-2 text-[11px] font-semibold text-white">
                        <a href="tel:+971505587651" className="inline-flex items-center gap-1 hover:text-[var(--gold-accent)] transition-colors">
                            <Phone className="h-2.5 w-2.5 text-[var(--gold-accent)]" strokeWidth={2.5} />
                            +971 50 558 7651
                        </a>
                        <span className="text-[var(--gold-accent)]/50">|</span>
                        <a href="tel:+971504522043" className="hover:text-[var(--gold-accent)] transition-colors">
                            +971 50 452 2043
                        </a>
                    </div>
                </div>

                {/* Dubai booking office — DESKTOP/TABLET: top-right emerald card */}
                <div className="hidden sm:block absolute sm:top-4 sm:right-5 md:top-6 md:right-8 z-20 animate-fade-in-up">
                    <div className="relative overflow-hidden rounded-2xl border border-[var(--gold-accent)]/60 bg-gradient-to-br from-[#0a7c54] via-[#065f46] to-[#043b2c] px-3.5 py-2.5 sm:px-5 sm:py-3.5 md:px-6 md:py-4 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.7)]">
                        {/* inner highlight ring + soft gold corner glow for depth */}
                        <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
                        <span className="pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full bg-[var(--gold-accent)]/25 blur-2xl" />

                        <div className="relative text-right text-white">
                            {/* header */}
                            <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                                <span className="h-px w-5 sm:w-7 bg-gradient-to-l from-[var(--gold-accent)] to-transparent" />
                                <span className="font-serif uppercase tracking-[0.2em] text-sm sm:text-lg md:text-xl leading-none text-[var(--gold-accent)]">
                                    Dubai
                                </span>
                            </div>
                            <p className="uppercase tracking-[0.25em] text-[8px] sm:text-[10px] md:text-[11px] font-light text-white/70 mt-1 mb-2">
                                Booking Office
                            </p>
                            {/* numbers */}
                            <div className="flex flex-col items-end gap-1 text-xs sm:text-sm md:text-base font-semibold tracking-wide">
                                <a href="tel:+971505587651" className="inline-flex items-center gap-1.5 hover:text-[var(--gold-accent)] transition-colors">
                                    <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[var(--gold-accent)]" strokeWidth={2.5} />
                                    +971 50 558 7651
                                </a>
                                <a href="tel:+971504522043" className="inline-flex items-center gap-1.5 hover:text-[var(--gold-accent)] transition-colors">
                                    <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[var(--gold-accent)]" strokeWidth={2.5} />
                                    +971 50 452 2043
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ① Five-star plaque — top */}
                <div className="flex justify-center pt-6 md:pt-10 flex-shrink-0 animate-fade-in-up">
                    <Image
                        src="/images/5star.png"
                        alt="Olivia International Alleppey — Five Star Classified"
                        width={480}
                        height={320}
                        className="w-[240px] sm:w-[280px] md:w-[400px] lg:w-[500px] h-auto drop-shadow-2xl"
                        priority
                    />
                </div>

                {/* ② Typography — grows to fill space between logo and booking bar */}
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4 min-h-0">
                    <h2 className="text-white text-[2.4rem] xs:text-5xl sm:text-5xl md:text-7xl lg:text-8xl font-serif mb-3 md:mb-6 tracking-wide animate-fade-in-up delay-100 drop-shadow-lg leading-tight">
                        Experience The Unexperienced
                    </h2>
                    <p className="text-white text-sm md:text-lg font-light tracking-wider opacity-90 max-w-2xl animate-fade-in-up delay-200 drop-shadow-md">
                        Where Luxury Meets the Backwaters.
                    </p>

                    {/* Carousel dots — inside text area, below subtitle */}
                    {!showVideo && slides.length > 1 && (
                        <div className="flex gap-3 mt-6">
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
                </div>

                {/* ③ Booking widget — pinned to bottom, fully in flow */}
                <div id="booking-search" className="flex-shrink-0 w-full px-4 md:px-6 pb-4 flex flex-col items-center">
                    <div className="max-w-5xl w-full mx-auto flex flex-col md:flex-row items-end gap-3 md:gap-4">

                        {/* Stay Period Segment */}
                        <div className="w-full md:flex-1 relative group">
                            <label className="text-white text-xs font-bold uppercase tracking-widest mb-2 block ml-1 drop-shadow-md">Stay period</label>
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
                            <label className="text-white text-xs font-bold uppercase tracking-widest mb-2 block ml-1 drop-shadow-md">Guests</label>
                            <div className="w-full bg-white h-14 rounded-lg px-2 flex items-center shadow-lg">
                                {/* Adults */}
                                <div className="flex-1 flex items-center justify-between px-2">
                                    <span className="text-sm font-medium text-gray-900">Adult</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setGuests(g => ({ ...g, adults: Math.max(1, g.adults - 1) }))}
                                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:text-black hover:border-black transition-all"
                                        >−</button>
                                        <span className="text-sm font-bold w-4 text-center text-gray-900">{guests.adults}</span>
                                        <button
                                            type="button"
                                            onClick={() => setGuests(g => ({ ...g, adults: Math.min(8, g.adults + 1) }))}
                                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:text-black hover:border-black transition-all"
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
                                            type="button"
                                            onClick={() => setGuests(g => ({ ...g, children: Math.max(0, g.children - 1) }))}
                                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:text-black hover:border-black transition-all"
                                        >−</button>
                                        <span className="text-sm font-bold w-4 text-center text-gray-900">{guests.children}</span>
                                        <button
                                            type="button"
                                            onClick={() => setGuests(g => ({ ...g, children: Math.min(6, g.children + 1) }))}
                                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:text-black hover:border-black transition-all"
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

            </div>
        </section>
    );
}
