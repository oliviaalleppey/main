'use client';

import Link from 'next/link';

const PILLARS = [
    {
        title: "Heritage",
        description: "Rooted in the stories of Alleppey's waterways, our design and cuisine honour centuries of Kerala tradition."
    },
    {
        title: "Sustainability",
        description: "From solar-powered kitchens to zero-plastic policies, we protect the backwaters that inspire us."
    },
    {
        title: "Hospitality",
        description: "Every gesture is personal. We do not have guests — we have family who return home to us."
    },
];

export default function EditorialStory() {
    return (
        <section className="py-14 md:py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch">

                    {/* Left — Large editorial photo */}
                    <div className="relative w-full h-[420px] md:h-[500px] lg:h-auto lg:min-h-[560px] overflow-hidden group bg-[var(--surface-soft)]">
                        {/* Caption overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/60 to-transparent">
                            <span className="text-white/60 text-[10px] uppercase tracking-[0.3em]">
                                Alleppey Backwaters, Kerala
                            </span>
                        </div>
                    </div>

                    {/* Right — Story + Pillars */}
                    <div className="flex flex-col justify-center lg:pl-16 py-8 md:py-12 lg:py-0 border-t lg:border-t-0 lg:border-l border-[var(--text-dark)]/10">
                        <span className="text-[10px] uppercase tracking-[0.35em] text-[var(--gold-accent-dark)] block mb-6 font-medium">
                            Est. 2006 · Alleppey, Kerala
                        </span>

                        <h2 className="text-3xl md:text-4xl font-serif text-[var(--text-dark)] mb-6 leading-snug">
                            Born from the<br />Waters of Kerala
                        </h2>

                        <p className="text-[#59544D] text-sm md:text-base font-light leading-relaxed mb-4">
                            Olivia Alleppey was conceived not as a hotel, but as a love letter to the backwaters —
                            a place where the slow rhythm of the canals teaches you to breathe again.
                        </p>
                        <p className="text-[#59544D] text-sm md:text-base font-light leading-relaxed mb-10">
                            Over nearly two decades, we have welcomed guests from 78 countries, each leaving with
                            something they did not expect: a sense of belonging to a place they had never been before.
                        </p>

                        {/* 3 Pillars */}
                        <div className="space-y-6 mb-10">
                            {PILLARS.map((pillar, i) => (
                                <div key={i} className="flex gap-5 items-start group">
                                    <div className="flex-none">
                                        <div className="w-8 h-[1px] bg-[var(--gold-accent)] mt-3 group-hover:w-12 transition-all duration-300" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-[var(--text-dark)] uppercase tracking-widest mb-1">
                                            {pillar.title}
                                        </h4>
                                        <p className="text-[var(--text-dark)]/55 text-sm font-light leading-relaxed">
                                            {pillar.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Link
                            href="/about"
                            className="inline-flex items-center gap-3 text-xs uppercase tracking-widest text-[var(--text-dark)] hover:text-[var(--gold-accent-dark)] transition-colors font-semibold group w-fit"
                        >
                            Our Full Story
                            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
