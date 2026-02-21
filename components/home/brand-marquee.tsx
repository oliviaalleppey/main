'use client';

const TICKER_TEXT = 'OLIVIA · ALLEPPEY · KERALA · LUXURY · HERITAGE · WELLNESS · TRADITION · EXCELLENCE · ';

export default function BrandMarquee() {
    return (
        <section className="bg-[#0A332B] py-5 overflow-hidden">
            <div className="flex overflow-hidden select-none">
                <div className="flex animate-marquee whitespace-nowrap">
                    {[...Array(4)].map((_, i) => (
                        <span key={i} className="text-white/90 text-[11px] tracking-[0.5em] uppercase font-medium">
                            {TICKER_TEXT}
                        </span>
                    ))}
                </div>
                <div className="flex animate-marquee whitespace-nowrap" aria-hidden>
                    {[...Array(4)].map((_, i) => (
                        <span key={i} className="text-white/90 text-[11px] tracking-[0.5em] uppercase font-medium">
                            {TICKER_TEXT}
                        </span>
                    ))}
                </div>
            </div>

            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
            `}</style>
        </section>
    );
}
