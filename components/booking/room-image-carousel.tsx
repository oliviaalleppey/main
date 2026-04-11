'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RoomImageCarouselProps {
    images: string[];
    roomName: string;
    children?: React.ReactNode; // overlays (badges, sold-out, etc.)
}

export function RoomImageCarousel({ images, roomName, children }: RoomImageCarouselProps) {
    const [index, setIndex] = useState(0);

    const prev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIndex((i) => (i - 1 + images.length) % images.length);
    };

    const next = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIndex((i) => (i + 1) % images.length);
    };

    if (!images.length) return <>{children}</>;

    return (
        <>
            <Image
                src={images[index]}
                alt={`${roomName} ${index + 1}`}
                fill
                className="object-cover transition-all duration-500"
            />

            {images.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
                        aria-label="Previous image"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
                        aria-label="Next image"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Dot indicators */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1">
                        {images.map((_, i) => (
                            <button
                                key={i}
                                onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${i === index ? 'bg-white scale-125' : 'bg-white/50'}`}
                                aria-label={`Image ${i + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}

            {children}
        </>
    );
}
