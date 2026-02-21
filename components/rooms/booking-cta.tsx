'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface BookingCTAProps {
    roomName: string;
    basePrice: number;
    roomSlug: string;
}

export default function BookingCTA({ roomName, basePrice, roomSlug }: BookingCTAProps) {
    return (
        <section className="relative py-16 px-6 md:px-12 bg-[#07221D] overflow-hidden">
            {/* Background Image with sophisticated overlay */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/images/rooms/cta-luxury.jpg"
                    alt="Luxury ambience"
                    fill
                    className="object-cover opacity-30 mix-blend-overlay"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#051b17] via-[#07221D]/90 to-[#051b17]" />
            </div>

            {/* Gold Border Frame for that "Premium Card" look */}
            <div className="absolute inset-4 md:inset-8 border border-[#B8956A]/20 pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16 px-4 md:px-8">

                    {/* Left: Text Content with elegant typography */}
                    <div className="text-center md:text-left md:flex-1">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                            <span className="h-px w-8 bg-[#B8956A]/50" />
                            <span className="text-[#B8956A] text-xs uppercase tracking-[0.2em] font-medium">Exclusive Offer</span>
                        </div>

                        <h2 className="font-serif text-3xl md:text-5xl text-white font-light leading-tight mb-4">
                            Your Perfect <span className="italic text-[#B8956A]">Kerala Escape</span>
                        </h2>
                        <p className="text-white/70 text-base md:text-lg font-light leading-relaxed max-w-xl">
                            Indulge in the serenity of {roomName}. A sanctuary designed for those who seek the extraordinary.
                        </p>

                        {/* Refined Trust Badges */}
                        <div className="flex flex-wrap justify-center md:justify-start gap-8 mt-8 border-t border-white/5 pt-6">
                            <div className="text-center md:text-left">
                                <p className="text-[#B8956A] text-lg font-serif italic">5-Star</p>
                                <p className="text-white/40 text-[10px] uppercase tracking-wider">Service</p>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div className="text-center md:text-left">
                                <p className="text-[#B8956A] text-lg font-serif italic">Best Rate</p>
                                <p className="text-white/40 text-[10px] uppercase tracking-wider">Guaranteed</p>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div className="text-center md:text-left">
                                <p className="text-[#B8956A] text-lg font-serif italic">Instant</p>
                                <p className="text-white/40 text-[10px] uppercase tracking-wider">Confirmation</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Premium Pricing & Action */}
                    <div className="flex flex-col items-center md:items-end gap-3 min-w-[280px]">
                        <div className="text-right">
                            <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-1">Starting From</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-white font-serif text-5xl md:text-6xl">
                                    ₹{Math.floor(basePrice / 1000)},<span className="text-3xl">{String(basePrice % 1000).padStart(3, '0')}</span>
                                </span>
                            </div>
                            <p className="text-[#B8956A] text-xs font-medium text-right mt-1">+ Taxes & Fees</p>
                        </div>

                        <Link
                            href={`/book/search?room=${roomSlug}`}
                            className="group mt-6 relative overflow-hidden bg-[#B8956A] text-white px-10 py-4 rounded-sm font-medium tracking-widest uppercase text-sm transition-all duration-500 hover:shadow-[0_0_20px_rgba(184,149,106,0.3)]"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Book Now
                                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                            </span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
