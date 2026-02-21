'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Share2, ArrowRight } from 'lucide-react';

const ROOMS = [
    {
        title: "Sunrise Studio",
        description: "A studio with views of Seminyak featuring a king size bed and all Olivia amenities.",
        image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=2874&auto=format&fit=crop",
        link: "/rooms/sunrise-studio"
    },
    {
        title: "Desa Studio",
        description: "A studio overlooking the Desa featuring a king size bed and all Olivia amenities.",
        image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2940&auto=format&fit=crop",
        link: "/rooms/desa-studio"
    },
    {
        title: "Bamboo Studio",
        description: "A studio with views of our bamboo courtyard featuring a king size bed and all Olivia amenities.",
        image: "https://images.unsplash.com/photo-1616594039964-40891a90c3d9?q=80&w=2940&auto=format&fit=crop",
        link: "/rooms/bamboo-studio"
    }
];

export default function RoomShowcase() {
    return (
        <section className="py-24 bg-[#F5F5F0]">
            <div className="container mx-auto px-4 max-w-7xl">

                {/* Header */}
                <div className="flex justify-between items-end mb-12">
                    <h2 className="text-3xl md:text-4xl font-serif text-[#1C1C1C]">Rooms</h2>
                    <Link
                        href="/rooms"
                        className="hidden md:inline-flex items-center gap-2 text-[#1C1C1C] hover:text-[#B8956A] transition-colors uppercase tracking-widest text-xs font-medium"
                    >
                        All Rooms
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {ROOMS.map((room, index) => (
                        <div key={index} className="flex flex-col group">

                            {/* Image Container */}
                            <div className="relative aspect-[4/3] overflow-hidden rounded-lg mb-6 bg-[#E5E5E5]">
                                <Image
                                    src={room.image}
                                    alt={room.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                {/* Share Button Overlay */}
                                <button className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full text-white transition-colors">
                                    <Share2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex flex-col flex-1 px-1">
                                <h3 className="text-xl font-bold text-[#1C1C1C] mb-3 font-sans">
                                    {room.title}
                                </h3>
                                <p className="text-[#1C1C1C]/80 text-sm leading-relaxed mb-8 flex-1">
                                    {room.description}
                                </p>

                                {/* Actions */}
                                <div className="flex items-center justify-between mt-auto">
                                    <Link
                                        href={room.link}
                                        className="px-8 py-3 rounded-full border border-[#1C1C1C] text-[#1C1C1C] text-sm font-bold hover:bg-[#1C1C1C] hover:text-white transition-all uppercase tracking-wide"
                                    >
                                        Book Now
                                    </Link>

                                    <Link
                                        href={room.link}
                                        className="flex items-center gap-2 text-sm font-bold text-[#1C1C1C] hover:opacity-70 transition-opacity group/link"
                                    >
                                        More
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}
