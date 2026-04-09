import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ShareButton from './share-button';
import { db } from '@/lib/db';
import { roomTypes, roomInventory } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

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
            id: true,
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

    // Fetch today's price overrides from roomInventory for all active room types
    const today = new Date().toISOString().split('T')[0];
    const roomTypeIds = rows.map((r) => r.id);
    const todayOverrides = roomTypeIds.length > 0
        ? await db.select({ roomTypeId: roomInventory.roomTypeId, price: roomInventory.price })
            .from(roomInventory)
            .where(and(
                eq(roomInventory.date, today),
                inArray(roomInventory.roomTypeId, roomTypeIds),
            ))
        : [];

    const overrideMap = new Map(todayOverrides.map((o) => [o.roomTypeId, o.price]));

    return rows.map((row) => {
        const images = Array.isArray(row.images) ? row.images : [];
        const todayPrice = overrideMap.get(row.id);
        return {
            title: row.name,  // Use actual room name from database
            description: row.shortDescription || row.description || 'Experience a thoughtfully designed stay with signature Olivia comforts.',
            image: row.featuredImage || images[0] || null,
            link: `/rooms/${row.slug}`,
            basePrice: todayPrice ?? row.basePrice ?? null,
        };
    });
}

export default async function RoomShowcase() {
    const rooms = await getShowcaseRooms();
    if (!rooms.length) return null;

    return (
        <section id="rooms" className="py-10 md:py-14 bg-[var(--surface-soft)]">
            <div className="container mx-auto px-4 max-w-7xl">

                {/* Header */}
                <div className="flex justify-between items-end mb-6 md:mb-8">
                    <h2 className="text-3xl md:text-4xl font-serif text-[var(--text-dark)]">Rooms</h2>
                    <Link
                        href="/rooms"
                        className="hidden md:flex items-center gap-2 text-sm font-bold text-[var(--text-dark)] uppercase tracking-widest hover:opacity-70 transition-opacity"
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

                            {/* Image Container - Clickable */}
                            <Link href={room.link} className="relative aspect-[4/3] overflow-hidden rounded-lg mb-6 bg-[#E5E5E5] block">
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
                                <div className="absolute top-3 right-3 z-10">
                                    <ShareButton title={room.title} url={room.link} />
                                </div>
                            </Link>

                                {/* Content */}
                                <div className="flex flex-col flex-1 px-1 mt-2">
                                    <h3 className="text-[24px] md:text-[28px] font-serif font-bold tracking-tight text-[var(--text-dark)] mb-2 leading-tight">
                                        {room.title}
                                    </h3>
                                    <p className="text-[var(--text-dark)]/70 text-[14px] leading-relaxed mb-6 flex-1">
                                        {room.description}
                                    </p>

                                    {/* Actions */}
                                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--text-dark)]/10">
                                        <Link
                                            href={`/book/search?room=${room.link.replace('/rooms/', '')}`}
                                            className="px-6 py-2.5 md:px-7 md:py-3 rounded-full bg-[var(--brand-primary)] text-white text-[11px] md:text-[12px] font-bold hover:bg-[var(--brand-primary-dark)] transition-all uppercase tracking-[0.2em] whitespace-nowrap"
                                        >
                                            Book Now
                                        </Link>

                                        {room.basePrice != null && (
                                            <div className="flex flex-col items-end whitespace-nowrap px-2">
                                                <span className="text-[9px] font-bold text-[#8C7A6B] uppercase tracking-[0.25em] mb-0.5 leading-none">Starting From</span>
                                                <div className="flex items-baseline gap-1.5">
                                                  <span className="font-sans font-bold text-[24px] md:text-[26px] text-[var(--text-dark)] tracking-tight">
                                                      ₹{(room.basePrice / 100).toLocaleString('en-IN')}
                                                  </span>
                                                  <span className="text-[11px] text-[#8C7A6B] font-medium tracking-wide">/ night</span>
                                                </div>
                                            </div>
                                        )}

                                        <Link
                                            href={room.link}
                                            className="flex items-center gap-1.5 md:gap-2 text-[11px] md:text-[12px] font-bold tracking-[0.2em] uppercase text-[var(--text-dark)] hover:opacity-70 transition-opacity group/link whitespace-nowrap"
                                        >
                                            Explore
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
                            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[var(--text-dark)] text-white text-sm font-bold hover:bg-[#333333] transition-all uppercase tracking-wide"
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
