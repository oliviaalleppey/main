'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatRoomName } from '@/lib/utils';
import { Key, Star, Shield, Sparkles } from 'lucide-react';

interface BookingCTAProps {
    roomName: string;
    basePrice: number;
    roomSlug: string;
}

export default function BookingCTA({ roomName, basePrice, roomSlug }: BookingCTAProps) {
    const displayRoomName = formatRoomName(roomName);

    return (
        <section className="relative py-16 px-6 md:px-12 bg-[#07221D] overflow-hidden">
            {/* Background Image with sophisticated overlay */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/images/rooms/cta-luxury.jpg"
                    alt="Luxury ambience"
                    fill
                    className="object-cover opacity-20 mix-blend-overlay"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#051b17] via-[#07221D]/95 to-[#051b17]" />
            </div>

            {/* Gold Border Frame for that "Premium Card" look */}
            <div className="absolute inset-4 md:inset-8 border border-[#B8956A]/30 pointer-events-none rounded-sm" />

            <div className="relative z-10 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16 px-4 md:px-8">

                    {/* Left: Text Content with elegant typography */}
                    <div className="text-center md:text-left md:flex-1">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                            <span className="h-px w-8 bg-[#B8956A]/50" />
                            <span className="text-[#B8956A] text-xs uppercase tracking-[0.2em] font-medium flex items-center gap-2">
                                <Star className="w-3.5 h-3.5" /> Olivia Membership
                            </span>
                        </div>

                        <h2 className="font-serif text-3xl md:text-5xl text-white font-light leading-tight mb-4">
                            Unlock Exclusive <span className="italic text-[#B8956A]">Member Privileges</span>
                        </h2>
                        <p className="text-white/80 text-base md:text-lg font-light leading-relaxed max-w-2xl">
                            Join our inner circle to seamlessly upgrade your stay in the {displayRoomName}. Members enjoy an elevated level of hospitality, private offers, and thoughtfully curated experiences designed around your preferences.
                        </p>

                        {/* Refined Trust Badges */}
                        <div className="flex flex-wrap justify-center md:justify-start gap-8 mt-8 border-t border-white/5 pt-6">
                            <div className="text-center md:text-left flex items-center gap-3">
                                <Key className="w-6 h-6 text-[#B8956A]" strokeWidth={1.5} />
                                <div>
                                    <p className="text-[#B8956A] text-sm md:text-base font-serif italic">Preferred Rates</p>
                                    <p className="text-white/40 text-[9px] uppercase tracking-wider">Members Only</p>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-white/10 hidden md:block" />
                            <div className="text-center md:text-left flex items-center gap-3">
                                <Sparkles className="w-6 h-6 text-[#B8956A]" strokeWidth={1.5} />
                                <div>
                                    <p className="text-[#B8956A] text-sm md:text-base font-serif italic">Exclusive Access</p>
                                    <p className="text-white/40 text-[9px] uppercase tracking-wider">Private Offers</p>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-white/10 hidden md:block" />
                            <div className="text-center md:text-left flex items-center gap-3">
                                <Shield className="w-6 h-6 text-[#B8956A]" strokeWidth={1.5} />
                                <div>
                                    <p className="text-[#B8956A] text-sm md:text-base font-serif italic">Personalized</p>
                                    <p className="text-white/40 text-[9px] uppercase tracking-wider">Curated Stays</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Action */}
                    <div className="flex flex-col items-center md:items-end justify-center w-full md:w-auto mt-6 md:mt-0">
                        <Link
                            href="/membership"
                            className="group relative w-full md:w-auto overflow-hidden bg-[#B8956A] text-white px-10 py-4 rounded-sm font-medium tracking-widest uppercase text-[13px] transition-all duration-500 hover:shadow-[0_0_20px_rgba(184,149,106,0.3)] text-center flex items-center justify-center"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Become a Member
                                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                            </span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                        </Link>
                        
                        <p className="text-white/40 text-[10px] text-center mt-2 w-full">Fast, free sign-up.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
