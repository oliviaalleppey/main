import Image from 'next/image';

interface RoomHeroProps {
    images: { id: number; alt: string; src?: string }[];
}

export default function RoomHero({ images }: RoomHeroProps) {
    // Generate enough placeholders if we have fewer than 5 images
    const displayImages = Array.from({ length: 5 }, (_, i) => ({
        id: images[i]?.id || i + 100,
        alt: images[i]?.alt || `Room view ${i + 1}`,
        src: images[i]?.src || `/images/rooms/balcony-room-${(i % 5) + 1}.jpg` // Cycle through available placeholders
    }));

    return (
        <section className="mb-12">
            {/* Horizontal Scrollable Carousel - Potato Head Studios Style */}
            {/* Horizontal Scrollable Carousel - Potato Head Studios Style */}
            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-0 px-6 md:px-12 gap-4 pb-4">
                {displayImages.map((image, idx) => (
                    <div
                        key={image.id}
                        className="relative flex-none w-[85vw] md:w-[22vw] h-[500px] snap-center first:pl-0 group overflow-hidden cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-[#E8E4DD]">
                            {image.src && (
                                <Image
                                    src={image.src}
                                    alt={image.alt}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    sizes="(max-width: 768px) 85vw, 400px"
                                    priority={idx === 0}
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
