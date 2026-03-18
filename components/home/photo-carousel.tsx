'use client';

import Image from 'next/image';
import { useRef } from 'react';

export default function PhotoCarousel() {
    const topRowRef = useRef<HTMLDivElement>(null);
    const bottomRowRef = useRef<HTMLDivElement>(null);

    const scrollRow = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
        const scrollAmount = 410;
        const scrollValue = direction === 'left' ? -scrollAmount : scrollAmount;

        if (ref.current) {
            ref.current.scrollBy({ left: scrollValue, behavior: 'smooth' });
        }
    };

    const images = {
        topRow: [
            { src: '', label: 'Olivia Alappuzha' },
            { src: '', label: 'Olivia Grand Lobby' },
            { src: '', label: 'Olivia Restaurant' },
            { src: '', label: 'Olivia Pool Ibiza' },
            { src: '', label: 'Olivia Rooftop' },
            { src: '', label: 'Olivia Suites' },
        ],
        bottomRow: [
            { src: '', label: 'Olivia Deluxe Room' },
            { src: '', label: 'Olivia Spa' },
            { src: '', label: 'Olivia Banquet' },
            { src: '', label: 'Olivia Gardens' },
            { src: '', label: 'Olivia Events' },
            { src: '', label: 'Olivia Premium' },
        ],
    };

    // Triple the images for infinite loop effect
    const topRowLooped = [...images.topRow, ...images.topRow, ...images.topRow];
    const bottomRowLooped = [...images.bottomRow, ...images.bottomRow, ...images.bottomRow];

    return (
        <section className="py-12 bg-white overflow-hidden">
            <div className="flex flex-col gap-1">
                {/* Top Row with Independent Navigation */}
                <div className="relative">
                    <button
                        onClick={() => scrollRow(topRowRef, 'left')}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/80 backdrop-blur-sm border border-gray-200/50 flex items-center justify-center hover:bg-white hover:border-gray-300 transition-all group"
                        aria-label="Previous"
                    >
                        <svg className="w-4 h-4 text-gray-700 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => scrollRow(topRowRef, 'right')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/80 backdrop-blur-sm border border-gray-200/50 flex items-center justify-center hover:bg-white hover:border-gray-300 transition-all group"
                        aria-label="Next"
                    >
                        <svg className="w-4 h-4 text-gray-700 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    <div
                        ref={topRowRef}
                        className="flex gap-1 overflow-x-auto scrollbar-hide scroll-smooth px-0"
                    >
                        {topRowLooped.map((image, index) => (
                            <div key={index} className={`relative flex-shrink-0 w-[400px] h-[250px] group overflow-hidden ${image.src ? '' : 'bg-[#E8E2D9]'}`}>
                                {image.src ? (
                                    <>
                                        <Image
                                            src={image.src}
                                            alt={image.label}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors"></div>
                                    </>
                                ) : null}
                                <div className="absolute bottom-4 left-4 text-white z-10">
                                    <p className="text-sm font-semibold drop-shadow-lg">{image.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Row with Independent Navigation - Offset for staggered effect */}
                <div className="relative -ml-[200px]">
                    <button
                        onClick={() => scrollRow(bottomRowRef, 'left')}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/80 backdrop-blur-sm border border-gray-200/50 flex items-center justify-center hover:bg-white hover:border-gray-300 transition-all group"
                        aria-label="Previous"
                    >
                        <svg className="w-4 h-4 text-gray-700 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => scrollRow(bottomRowRef, 'right')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/80 backdrop-blur-sm border border-gray-200/50 flex items-center justify-center hover:bg-white hover:border-gray-300 transition-all group"
                        aria-label="Next"
                    >
                        <svg className="w-4 h-4 text-gray-700 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    <div
                        ref={bottomRowRef}
                        className="flex gap-1 overflow-x-auto scrollbar-hide scroll-smooth"
                    >
                        {bottomRowLooped.map((image, index) => (
                            <div key={index} className={`relative flex-shrink-0 w-[400px] h-[250px] group overflow-hidden ${image.src ? '' : 'bg-[#E8E2D9]'}`}>
                                {image.src ? (
                                    <>
                                        <Image
                                            src={image.src}
                                            alt={image.label}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors"></div>
                                    </>
                                ) : null}
                                <div className="absolute bottom-4 left-4 text-white z-10">
                                    <p className="text-sm font-semibold drop-shadow-lg">{image.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
