'use client';

import { useState, useEffect } from 'react';

const TESTIMONIALS = [
    {
        quote: "The silence of the backwaters at dawn, a cup of chai in hand — Olivia gave us something no five-star hotel ever did. Time.",
        name: "Catherine & James",
        country: "🇬🇧 United Kingdom",
        trip: "Honeymoon"
    },
    {
        quote: "We have stayed at Aman properties across Asia, but Olivia Alleppey moved us in a way none of them could. It feels like home — an impossibly beautiful home.",
        name: "Rahul S.",
        country: "🇮🇳 India",
        trip: "Anniversary Stay"
    },
    {
        quote: "Our children still talk about the cooking class, the village walk, the houseboat night. Olivia turned a holiday into a memory that will outlast all of us.",
        name: "The Andersons",
        country: "🇺🇸 United States",
        trip: "Family Vacation"
    },
    {
        quote: "I came for a weekend and stayed a week. The staff remembered how I take my coffee after the first morning. That is luxury.",
        name: "Sophie L.",
        country: "🇫🇷 France",
        trip: "Solo Retreat"
    },
];

export default function Testimonials() {
    const [current, setCurrent] = useState(0);
    const [fading, setFading] = useState(false);

    const goTo = (index: number) => {
        setFading(true);
        setTimeout(() => {
            setCurrent(index);
            setFading(false);
        }, 350);
    };

    useEffect(() => {
        const timer = setInterval(() => {
            goTo((current + 1) % TESTIMONIALS.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [current]);

    const t = TESTIMONIALS[current];

    return (
        <section className="py-14 md:py-24 bg-[#E8E2D9]">
            <div className="max-w-5xl mx-auto px-6 md:px-12 text-center">

                {/* Header */}
                <span className="text-[10px] uppercase tracking-[0.35em] text-[#7A5E28] block mb-8 md:mb-12 font-medium">
                    Voices of Olivia
                </span>

                {/* Large quote mark */}
                <div className="text-7xl md:text-8xl font-serif text-[#7A5E28]/30 leading-none mb-4 select-none">"</div>

                {/* Quote */}
                <blockquote
                    className={`text-xl md:text-2xl lg:text-3xl font-serif text-[#1C1C1C] leading-relaxed mb-10 max-w-4xl mx-auto transition-opacity duration-350 ${fading ? 'opacity-0' : 'opacity-100'}`}
                >
                    {t.quote}
                </blockquote>

                {/* Attribution */}
                <div className={`transition-opacity duration-350 ${fading ? 'opacity-0' : 'opacity-100'}`}>
                    <p className="text-sm font-semibold text-[#1C1C1C] uppercase tracking-widest mb-1">
                        — {t.name}
                    </p>
                    <p className="text-xs text-[#7C746B] font-light tracking-wide">
                        {t.country} &nbsp;·&nbsp; {t.trip}
                    </p>
                </div>

                {/* Dot indicators */}
                <div className="flex justify-center gap-3 mt-8 md:mt-12">
                    {TESTIMONIALS.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i)}
                            className={`transition-all duration-300 rounded-full ${i === current
                                    ? 'w-8 h-1.5 bg-[#C5A059]'
                                    : 'w-1.5 h-1.5 bg-[#1C1C1C]/20 hover:bg-[#1C1C1C]/40'
                                }`}
                            aria-label={`Testimonial ${i + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
