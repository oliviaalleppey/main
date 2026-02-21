'use client';

import Image from 'next/image';
import Link from 'next/link';

const EXPERIENCES = [
    {
        title: "Backwater Cruise",
        caption: "Drift through emerald canals at golden hour",
        image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=1200&auto=format&fit=crop",
        href: "/experiences#backwater",
        tag: "Signature"
    },
    {
        title: "Ayurveda & Spa",
        caption: "Ancient healing rituals, reimagined for today",
        image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1200&auto=format&fit=crop",
        href: "/experiences#ayurveda",
        tag: "Wellness"
    },
    {
        title: "Sunrise Yoga",
        caption: "Breathe with the backwaters each morning",
        image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1200&auto=format&fit=crop",
        href: "/experiences#yoga",
        tag: "Daily"
    },
    {
        title: "Village Walk",
        caption: "Discover the soul of Alleppey on foot",
        image: "https://images.unsplash.com/photo-1571436954891-89f4e1b5a5f4?q=80&w=1200&auto=format&fit=crop",
        href: "/experiences#village",
        tag: "Cultural"
    },
    {
        title: "Kerala Cooking",
        caption: "Learn the spice stories of a timeless cuisine",
        image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=1200&auto=format&fit=crop",
        href: "/experiences#cooking",
        tag: "Culinary"
    },
    {
        title: "Houseboat Night",
        caption: "Sleep on still waters beneath a canopy of stars",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop",
        href: "/experiences#houseboat",
        tag: "Overnight"
    },
];

export default function ExperiencesStrip() {
    return (
        <section className="py-20 bg-[#FBFBF9] overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 md:px-12 mb-10">
                <div className="flex items-end justify-between">
                    <div>
                        <span className="text-[10px] uppercase tracking-[0.35em] text-[#8C7A5C] block mb-3 font-medium">
                            Curated for You
                        </span>
                        <h2 className="text-3xl md:text-4xl font-serif text-[#1C1C1C]">
                            Kerala Experiences
                        </h2>
                    </div>
                    <Link
                        href="/experiences"
                        className="hidden md:inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#1C1C1C] hover:text-[#8C7A5C] transition-colors font-medium"
                    >
                        View All
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </div>

            {/* Scrollable strip */}
            <div className="flex gap-5 px-6 md:px-12 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                {EXPERIENCES.map((exp, i) => (
                    <Link
                        key={i}
                        href={exp.href}
                        className="group flex-none w-[240px] md:w-[280px] snap-start"
                    >
                        {/* Portrait image */}
                        <div className="relative w-full h-[360px] md:h-[400px] overflow-hidden rounded-sm mb-4">
                            <Image
                                src={exp.image}
                                alt={exp.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            {/* Dark gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                            {/* Tag pill */}
                            <span className="absolute top-4 left-4 text-[10px] uppercase tracking-[0.25em] text-white/90 border border-white/40 px-3 py-1 backdrop-blur-sm">
                                {exp.tag}
                            </span>
                        </div>
                        <h3 className="font-serif text-[#1C1C1C] text-lg mb-1 group-hover:text-[#8C7A5C] transition-colors">
                            {exp.title}
                        </h3>
                        <p className="text-[#1C1C1C]/50 text-xs font-light leading-relaxed">
                            {exp.caption}
                        </p>
                    </Link>
                ))}
            </div>

            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </section>
    );
}
