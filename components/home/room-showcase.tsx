import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Share2 } from 'lucide-react';
import { db } from '@/lib/db';
import { roomTypes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { formatRoomName } from '@/lib/utils';

type RoomCard = {
    title: string;
    description: string;
    image: string | null;
    link: string;
    basePrice: number | null;
};

async function getShowcaseRooms(): Promise<RoomCard[]> {
    const rows = await db.query.roomTypes.findMany({
        where: eq(roomTypes.status, 'active'),
        columns: {
            name: true,
            slug: true,
            shortDescription: true,
            description: true,
            featuredImage: true,
            images: true,
            sortOrder: true,
            basePrice: true,
        },
        orderBy: (table, { asc }) => [asc(table.sortOrder), asc(table.name)],
    });

    return rows.map((row) => {
        const images = Array.isArray(row.images) ? row.images : [];
        return {
            title: formatRoomName(row.name),
            description: row.shortDescription || row.description || 'Experience a thoughtfully designed stay with signature Olivia comforts.',
            image: row.featuredImage || images[0] || null,
            link: `/rooms/${row.slug}`,
            basePrice: row.basePrice ?? null,
        };
    });
}

export default async function RoomShowcase() {
    const rooms = await getShowcaseRooms();
    if (!rooms.length) return null;

    return (
        <section className="py-10 md:py-14 bg-[#E8E2D9]">
            <div className="container mx-auto px-4 max-w-7xl">

                {/* Header */}
                <div className="flex justify-between items-end mb-6 md:mb-8">
                    <h2 className="text-3xl md:text-4xl font-serif text-[#1C1C1C]">Rooms</h2>
                    <Link
                        href="/rooms"
                        className="hidden md:flex items-center gap-2 text-sm font-bold text-[#1C1C1C] uppercase tracking-widest hover:opacity-70 transition-opacity"
                    >
                        All Rooms
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {/* On mobile, only show first 3. On desktop, show all */}
                    {rooms.map((room, index) => (
                        <div
                            key={room.title}
                            className={`flex flex-col group ${index >= 3 ? 'hidden md:flex' : 'flex'}`}
                        >

                            {/* Image Container */}
                            <div className="relative aspect-[4/3] overflow-hidden rounded-lg mb-6 bg-[#E5E5E5]">
                                {room.image ? (
                                    <Image
                                        src={room.image}
                                        alt={room.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#E8E8E4] to-[#DADAD3]" />
                                )}
                                {/* Share Button Overlay */}
                                <button className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full text-white transition-colors">
                                    <Share2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex flex-col flex-1 px-1">
                                <h3 className="text-xl font-bold text-[#1C1C1C] mb-1 font-sans">
                                    {room.title}
                                </h3>
                                <p className="text-[#1C1C1C]/80 text-sm leading-relaxed mb-5 flex-1">
                                    {room.description}
                                </p>

                                {/* Actions */}
                                <div className="flex items-center justify-between mt-auto pt-2">
                                    <Link
                                        href={`/book/search?room=${room.link.replace('/rooms/', '')}`}
                                        className="px-4 py-2 md:px-6 md:py-2.5 rounded-full border border-[#07221D] text-[#1C1C1C] text-[10px] md:text-sm font-bold hover:bg-[#15443B] hover:border-[#15443B] hover:text-white transition-all uppercase tracking-wide whitespace-nowrap"
                                    >
                                        Book Now
                                    </Link>

                                    {room.basePrice != null && (
                                        <div className="text-[11px] md:text-sm text-[#7A5E28] font-medium px-2 text-center leading-tight">
                                            From ₹{(room.basePrice / 100).toLocaleString('en-IN')} <br className="sm:hidden" /><span className="text-[#1C1C1C]/50 font-normal">/ night</span>
                                        </div>
                                    )}

                                    <Link
                                        href={room.link}
                                        className="flex items-center gap-1.5 md:gap-2 text-[11px] md:text-sm font-bold text-[#1C1C1C] hover:opacity-70 transition-opacity group/link whitespace-nowrap"
                                    >
                                        More
                                        <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 transition-transform group-hover/link:translate-x-1" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Mobile 'View All' Button (Hidden on md and up) */}
                {rooms.length > 3 && (
                    <div className="mt-8 flex justify-center md:hidden">
                        <Link
                            href="/rooms"
                            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#1C1C1C] text-white text-sm font-bold hover:bg-[#333333] transition-all uppercase tracking-wide"
                        >
                            View All Rooms
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}

            </div>
        </section>
    );
}
