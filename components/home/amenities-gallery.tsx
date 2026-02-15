'use client';

import Image from 'next/image';
import Link from 'next/link';

const AMENITIES = [
    {
        title: "Infinity Pool",
        description: "A seamless merge of azure waters and the horizon.",
        image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=2940&auto=format&fit=crop", // Pool
        link: "/experiences#pool",
        colSpan: "md:col-span-2",
        height: "h-[400px] md:h-[500px]"
    },
    {
        title: "State-of-the-Art Gym",
        description: "maintain your wellness routine with premium Technogym equipment.",
        image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2940&auto=format&fit=crop", // Gym
        link: "/experiences#gym",
        colSpan: "md:col-span-1",
        height: "h-[400px] md:h-[500px]"
    },
    {
        title: "The Spa",
        description: "Rejuvenate with holistic treatments inspired by ancient traditions.",
        image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2940&auto=format&fit=crop", // Spa
        link: "/experiences#spa",
        colSpan: "md:col-span-1",
        height: "h-[400px] md:h-[500px]"
    },
    {
        title: "Concierge Services",
        description: "Tailored experiences curated by our dedicated team.",
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2940&auto=format&fit=crop", // Concierge/Lobby
        link: "/experiences#concierge",
        colSpan: "md:col-span-2",
        height: "h-[400px] md:h-[500px]"
    }
];

export default function AmenitiesGallery() {
    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="text-center mb-16">
                    <span className="text-xs uppercase tracking-[0.3em] text-[#8C7A5C] block mb-4">Wellness & Recreation</span>
                    <h2 className="text-3xl md:text-5xl font-serif text-gray-900 tracking-wide">
                        RESTORE YOUR BALANCE
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {AMENITIES.map((item, index) => (
                        <Link
                            key={index}
                            href={item.link}
                            className={`group relative overflow-hidden rounded-sm ${item.colSpan} ${item.height}`}
                        >
                            <Image
                                src={item.image}
                                alt={item.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />

                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
                                <h3 className="text-2xl md:text-3xl font-serif text-white mb-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                    {item.title}
                                </h3>
                                <p className="text-white/90 font-light text-sm md:text-base max-w-sm transform opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">
                                    {item.description}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
