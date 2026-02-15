'use client';

export default function CompactIntro() {
    return (
        <section className="py-16 px-4 text-center bg-white">
            <div className="max-w-2xl mx-auto">
                <span className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-[#8C7A5C] mb-4 block font-medium">
                    Welcome to Olivia
                </span>

                <h2 className="text-3xl md:text-4xl font-serif text-[#1C1C1C] leading-snug mb-6">
                    A sanctuary of modern luxury<br className="hidden md:block" /> in the heart of the city
                </h2>

                <p className="text-[#1C1C1C]/60 text-sm md:text-base font-light leading-relaxed mb-8 max-w-lg mx-auto">
                    Where heritage meets contemporary elegance. Experience a stay defined by personalized service and breathtaking views.
                </p>

                <button className="text-[10px] md:text-xs uppercase tracking-[0.2em] border border-[#1C1C1C]/20 px-6 py-3 hover:border-[#1C1C1C] hover:bg-[#1C1C1C] hover:text-white transition-all duration-300">
                    Read Our Story
                </button>
            </div>
        </section>
    );
}
