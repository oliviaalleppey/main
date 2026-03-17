'use client';

import Link from 'next/link';

export default function CompactIntro() {
    return (
        <section className="py-6 md:py-10 px-4 text-center bg-white">
            <div className="max-w-2xl mx-auto">
                <span className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-[#7A5E28] mb-4 block font-medium">
                    Welcome to Olivia Alleppey
                </span>

                <h2 className="text-3xl md:text-4xl font-serif text-[#1C1C1C] leading-snug mb-6">
                    Backwater calm,<br className="hidden md:block" /> contemporary comfort
                </h2>

                <p className="text-[#59544D] text-sm md:text-base font-light leading-relaxed mb-6 md:mb-8 max-w-lg mx-auto">
                    Slow down by the water, stay in thoughtfully designed rooms, and discover the experiences that make Alleppey unforgettable.
                </p>

                <Link
                    href="/discover"
                    className="inline-flex text-[10px] md:text-xs uppercase tracking-[0.2em] border border-[#1C1C1C]/20 px-6 py-3 hover:border-[#1C1C1C] hover:bg-[#1C1C1C] hover:text-white transition-all duration-300"
                >
                    Explore Discover
                </Link>
            </div>
        </section>
    );
}
