'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface RoomHeroProps {
    images: { id: number; alt: string; src?: string }[];
}

export default function RoomHero({ images }: RoomHeroProps) {
    const displayImages = useMemo(
        () =>
            Array.from({ length: 5 }, (_, i) => ({
                id: images[i]?.id || i + 100,
                alt: images[i]?.alt || `Room view ${i + 1}`,
                src: images[i]?.src || `/images/rooms/balcony-room-${(i % 5) + 1}.jpg`,
            })),
        [images],
    );

    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const touchStartX = useRef<number | null>(null);

    const closeLightbox = useCallback(() => setLightboxIndex(null), []);
    const openLightbox = useCallback((index: number) => setLightboxIndex(index), []);

    const goNext = useCallback(() => {
        setLightboxIndex((prev) => {
            if (prev == null) return prev;
            return (prev + 1) % displayImages.length;
        });
    }, [displayImages.length]);

    const goPrev = useCallback(() => {
        setLightboxIndex((prev) => {
            if (prev == null) return prev;
            return (prev - 1 + displayImages.length) % displayImages.length;
        });
    }, [displayImages.length]);

    useEffect(() => {
        if (lightboxIndex == null) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') closeLightbox();
            if (event.key === 'ArrowRight') goNext();
            if (event.key === 'ArrowLeft') goPrev();
        };

        window.addEventListener('keydown', onKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [closeLightbox, goNext, goPrev, lightboxIndex]);

    return (
        <section className="mb-12">
            {/* Horizontal Scrollable Carousel - Potato Head Studios Style */}
            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-0 px-6 md:px-12 gap-4 pb-4">
                {displayImages.map((image, idx) => (
                    <button
                        key={image.id}
                        type="button"
                        className="relative flex-none w-[85vw] md:w-[22vw] h-[500px] snap-center first:pl-0 group overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BCA06F]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F1E8]"
                        onClick={() => openLightbox(idx)}
                        aria-label={`Open image ${idx + 1} of ${displayImages.length}`}
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
                        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute inset-0 bg-black/15" />
                            <div className="absolute bottom-4 left-4 rounded-full bg-black/35 text-white text-[10px] tracking-[0.22em] uppercase px-3 py-1.5 backdrop-blur-sm">
                                View
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {lightboxIndex != null && (
                <div
                    className="fixed inset-0 z-[100] bg-black/80"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Room photo viewer"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) closeLightbox();
                    }}
                    onTouchStart={(e) => {
                        touchStartX.current = e.touches[0]?.clientX ?? null;
                    }}
                    onTouchEnd={(e) => {
                        const startX = touchStartX.current;
                        const endX = e.changedTouches[0]?.clientX ?? null;
                        touchStartX.current = null;
                        if (startX == null || endX == null) return;
                        const delta = endX - startX;
                        if (Math.abs(delta) < 40) return;
                        if (delta < 0) goNext();
                        else goPrev();
                    }}
                >
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-3 text-white">
                        <p className="text-[10px] tracking-[0.28em] uppercase opacity-90">
                            {lightboxIndex + 1} / {displayImages.length}
                        </p>
                        <button
                            type="button"
                            onClick={closeLightbox}
                            className="rounded-full bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-2 text-[11px] tracking-[0.18em] uppercase transition-colors"
                            aria-label="Close viewer"
                        >
                            Close
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={goPrev}
                        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white transition-colors"
                        aria-label="Previous image"
                    >
                        <span className="text-2xl leading-none">‹</span>
                    </button>

                    <button
                        type="button"
                        onClick={goNext}
                        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white transition-colors"
                        aria-label="Next image"
                    >
                        <span className="text-2xl leading-none">›</span>
                    </button>

                    <div className="absolute inset-x-0 top-14 bottom-6 md:top-16 md:bottom-8 px-4 md:px-16">
                        <div className="relative w-full h-full">
                            <Image
                                src={displayImages[lightboxIndex].src ?? '/images/placeholder.jpg'}
                                alt={displayImages[lightboxIndex].alt}
                                fill
                                className="object-contain"
                                sizes="100vw"
                                priority
                            />
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
