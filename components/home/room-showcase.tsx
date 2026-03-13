import Image from 'next/image';
import Link from 'next/link';
import { Share2, ArrowRight } from 'lucide-react';
import { db } from '@/lib/db';
import { roomTypes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { formatRoomName } from '@/lib/utils';

type RoomCard = {
    title: string;
    description: string;
    image: string | null;
    link: string;
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
        },
        orderBy: (table, { asc }) => [asc(table.sortOrder), asc(table.name)],
        limit: 3,
    });

    return rows.map((row) => {
        const images = Array.isArray(row.images) ? row.images : [];
        return {
            title: formatRoomName(row.name),
            description: row.shortDescription || row.description || 'Experience a thoughtfully designed stay with signature Olivia comforts.',
            image: row.featuredImage || images[0] || null,
            link: `/rooms/${row.slug}`,
        };
    });
}

export default async function RoomShowcase() {
    const rooms = await getShowcaseRooms();
    if (!rooms.length) return null;

    return (
        <section className="py-14 md:py-24 bg-[#E8E2D9]">
            <div className="container mx-auto px-4 max-w-7xl">

                {/* Header */}
                <div className="flex justify-between items-end mb-7 md:mb-12">
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
                    {rooms.map((room, index) => (
                        <div key={index} className="flex flex-col group">

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
