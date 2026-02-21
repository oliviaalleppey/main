'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function OffersCarousel() {
    // Minimalist luxury offers
    const offers = [
        {
            title: "Early Bird Special",
            description: "Book 30 days in advance and save 20%",
            link: "/offers",
            image: "/Users/agt/.gemini/antigravity/brain/a259c4d7-874f-4ba5-82b8-e3035ab13fdd/early_bird_luxury_offer_1771148115304.png",
            discount: "20% OFF"
        },
        {
            title: "Long Stay Offer",
            description: "Stay 5 nights or more and get 25% off",
            link: "/offers",
            image: null,
            discount: "25% OFF"
        },
        {
            title: "Honeymoon Package",
            description: "Romantic getaway with spa and dinner",
            link: "/offers",
            image: null,
            discount: "SPECIAL"
        }
    ];

    return (
        <section className="relative py-20 px-6 md:px-12 bg-[#fafaf8] overflow-hidden">
            <div className="relative max-w-7xl mx-auto">
                {/* Minimalist Section Header */}
                <div className="flex items-center justify-between mb-16">
                    <div>
                        <p className="text-[#B8956A] text-[10px] font-medium uppercase tracking-[0.4em] mb-4">
                            Exclusive Offers
                        </p>
                        <h2 className="font-serif text-3xl md:text-4xl text-[#2c2c2c] font-light tracking-wide">
                            Special Privileges
                        </h2>
                    </div>
                    <Link
                        href="/offers"
                        className="group flex items-center gap-2 text-[#B8956A] hover:text-[#8B6F47] transition-colors duration-300"
                    >
                        <span className="text-[10px] font-medium uppercase tracking-widest">View All</span>
                        <span className="text-sm group-hover:translate-x-1 transition-transform duration-300">→</span>
                    </Link>
                </div>

                {/* Minimalist Horizontal Carousel */}
                <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory">
                    {offers.map((offer, idx) => (
                        <Link
                            key={idx}
                            href={offer.link}
                            className="flex-shrink-0 w-[360px] snap-start group"
                        >
                            <div className="relative h-[460px] bg-white border border-[#B8956A]/15 hover:border-[#B8956A]/40 transition-all duration-500 overflow-hidden hover:shadow-sm">
                                {/* Image Section */}
                                <div className="relative h-[260px] overflow-hidden bg-[#f5f5f3]">
                                    {offer.image ? (
                                        <Image
                                            src={offer.image}
                                            alt={offer.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-[#B8956A]/30 uppercase tracking-widest text-[10px]">Luxury Experience</span>
                                        </div>
                                    )}

                                    {/* Minimalist Discount Badge */}
                                    <div className="absolute top-4 right-4 bg-[#B8956A] text-white px-3 py-1.5">
                                        <span className="text-[9px] font-medium uppercase tracking-wider">{offer.discount}</span>
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="relative p-8 flex flex-col h-[200px]">
                                    {/* Simple divider */}
                                    <div className="w-8 h-px bg-[#B8956A]/20 mb-6" />

                                    {/* Title */}
                                    <h3 className="font-serif text-xl text-[#2c2c2c] font-light mb-3 group-hover:text-[#B8956A] transition-colors duration-500">
                                        {offer.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-[#6b6b6b] text-xs leading-relaxed mb-6 font-light">
                                        {offer.description}
                                    </p>

                                    {/* Minimalist CTA */}
                                    <div className="mt-auto flex items-center gap-2 text-[#B8956A] group-hover:text-[#8B6F47] transition-colors duration-300">
                                        <span className="text-[10px] font-medium uppercase tracking-widest">Explore</span>
                                        <span className="text-sm group-hover:translate-x-1 transition-transform duration-300">→</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </section>
    );
}
