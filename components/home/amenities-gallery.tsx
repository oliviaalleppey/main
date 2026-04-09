'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface AmenityImages {
    pool?: string;
    gym?: string;
    spa?: string;
    yoga?: string;
}

const AMENITIES = [
    {
        title: "Atrium Pool",
        description: "A seamless merge of azure waters and the horizon.",
        key: "pool",
        link: "/wellness#pool",
        colSpan: "md:col-span-2",
        height: "h-[400px] md:h-[500px]"
    },
    {
        title: "State-of-the-Art Gym",
        description: "maintain your wellness routine with premium Technogym equipment.",
        key: "gym",
        link: "/wellness#fitness",
        colSpan: "md:col-span-1",
        height: "h-[400px] md:h-[500px]"
    },
    {
        title: "The Spa",
        description: "Rejuvenate with holistic treatments inspired by ancient traditions.",
        key: "spa",
        link: "/wellness#spa",
        colSpan: "md:col-span-1",
        height: "h-[400px] md:h-[500px]"
    },
    {
        title: "Yoga & Meditation",
        description: "Breathe, stretch, and reset with guided sessions in a serene setting.",
        key: "yoga",
        link: "/wellness#yoga",
        colSpan: "md:col-span-2",
        height: "h-[400px] md:h-[500px]"
    }
];

export default function AmenitiesGallery() {
    const [images, setImages] = useState<AmenityImages>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/media/amenities')
            .then(res => res.json())
            .then(data => setImages(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <section className="py-14 md:py-24 bg-white">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="text-center mb-8 md:mb-16">
                    <span className="text-xs uppercase tracking-[0.3em] text-[var(--gold-accent-dark)] block mb-4">Wellness & Recreation</span>
                    <h2 className="text-3xl md:text-5xl font-serif text-gray-900 tracking-wide">
                        RESTORE YOUR BALANCE
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {AMENITIES.map((item) => {
                        const imageUrl = images[item.key as keyof AmenityImages];

                        return (
                            <Link
                                key={item.key}
                                href={item.link}
                                className={`group relative overflow-hidden rounded-sm ${item.colSpan} ${item.height} ${!imageUrl ? 'bg-[var(--surface-soft)]' : ''}`}
                            >
                                {imageUrl ? (
                                    <>
                                        <Image
                                            src={imageUrl}
                                            alt={item.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />
                                    </>
                                ) : (
                                    <div className="absolute inset-0 bg-[var(--surface-soft)] flex items-center justify-center">
                                        {loading ? (
                                            <div className="w-8 h-8 border-2 border-gray-300 border-t-amber-500 rounded-full animate-spin" />
                                        ) : (
                                            <span className="text-gray-400 text-sm">Add image in admin</span>
                                        )}
                                    </div>
                                )}

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
                        );
                    })}
                </div>
            </div>
        </section>
    );
}