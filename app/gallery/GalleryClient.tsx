'use client';


import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface GalleryImage {
    id: string;
    title: string | null;
    imageUrl: string;
    category: string | null;
}

const categories = ['All', 'Rooms', 'Dining', 'Spa', 'Pool', 'Events'];

// Smart categorization based on image title
const getCategoryForImage = (title: string | null): string => {
    if (!title) return 'Events'; // Default fallback
    const t = title.toLowerCase();
    
    if (t.includes('room') || t.includes('suite') || t.includes('villa') || t.includes('bed') || t.includes('balcony')) return 'Rooms';
    if (t.includes('dining') || t.includes('restaurant') || t.includes('food') || t.includes('bar') || t.includes('cafe') || t.includes('breakfast') || t.includes('buffet')) return 'Dining';
    if (t.includes('spa') || t.includes('wellness') || t.includes('massage') || t.includes('gym') || t.includes('treatment')) return 'Spa';
    if (t.includes('pool') || t.includes('swim')) return 'Pool';
    
    return 'Events'; // Fallback for other things like lobby, exterior, etc.
};

export default function GalleryClient({ initialImages }: { initialImages: GalleryImage[] }) {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const filteredImages = selectedCategory === 'All'
        ? initialImages
        : initialImages.filter(img => getCategoryForImage(img.title) === selectedCategory);

    // Lightbox handlers
    const openLightbox = (index: number) => setSelectedIndex(index);
    const closeLightbox = () => setSelectedIndex(null);
    const showNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedIndex !== null) {
            setSelectedIndex((selectedIndex + 1) % filteredImages.length);
        }
    };
    const showPrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedIndex !== null) {
            setSelectedIndex((selectedIndex - 1 + filteredImages.length) % filteredImages.length);
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedIndex === null) return;
            if (e.key === 'ArrowRight') setSelectedIndex((selectedIndex + 1) % filteredImages.length);
            if (e.key === 'ArrowLeft') setSelectedIndex((selectedIndex - 1 + filteredImages.length) % filteredImages.length);
            if (e.key === 'Escape') closeLightbox();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIndex, filteredImages.length]);

    return (
        <main className="min-h-screen bg-[var(--surface-cream)] font-sans pt-[72px] md:pt-[84px]">



            {/* Category Filter */}
            <section id="gallery-collection"
                className="py-5 px-6 md:px-12 bg-[var(--brand-primary)] sticky z-40 shadow-md"
                style={{ top: 'var(--site-header-height, 62px)' }}
            >
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-wrap justify-center gap-2 md:gap-4">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-6 py-2.5 text-[11px] uppercase tracking-[0.15em] font-semibold transition-all rounded-full ${selectedCategory === category
                                    ? 'bg-[var(--gold-accent)] text-[#0F1C16] shadow-lg scale-105'
                                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Gallery Grid */}
            <section className="py-16 px-6 md:px-12">
                <div className="max-w-6xl mx-auto">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredImages.map((image, index) => (
                            <div
                                key={image.id}
                                className="group cursor-pointer"
                                onClick={() => openLightbox(index)}
                            >
                                {/* Image */}
                                <div className="relative h-72 bg-gray-100 mb-4 overflow-hidden rounded-lg">
                                    <Image 
                                        src={image.imageUrl} 
                                        alt={image.title || 'Gallery image'} 
                                        fill 
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-primary)]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                    {/* Overlay on Hover */}
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                        <svg className="w-12 h-12 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Image Info */}
                                <div>
                                    <p className="text-[var(--gold-accent-dark)] text-xs tracking-[0.2em] uppercase mb-1">{getCategoryForImage(image.title)}</p>
                                    <h3 className="text-lg font-serif text-[var(--text-dark)] mb-1">{image.title || 'Untitled'}</h3>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredImages.length === 0 && (
                        <div className="text-center py-16">
                            <p className="text-[#59544D]">No images found in this category.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6 md:px-12 bg-[var(--brand-primary)]">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-6 tracking-wide">
                        Experience It Yourself
                    </h2>
                    <p className="text-white/92 text-lg mb-8 max-w-2xl mx-auto">
                        Pictures can only tell part of the story. Book your stay and experience the luxury firsthand.
                    </p>
                    <a
                        href="#booking-search"
                        className="inline-block bg-white text-[var(--brand-primary)] px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-[var(--gold-accent)] hover:text-white transition-colors"
                    >
                        Book Your Stay
                    </a>
                </div>
            </section>
            {/* Lightbox Overlay */}
            <AnimatePresence>
                {selectedIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
                        onClick={closeLightbox}
                    >
                        {/* Close button */}
                        <button
                            className="absolute top-6 right-6 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-all z-50"
                            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
                        >
                            <X className="w-8 h-8" />
                        </button>

                        {/* Navigation Buttons */}
                        {filteredImages.length > 1 && (
                            <>
                                <button
                                    className="absolute left-6 p-4 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-all z-50 hidden md:block"
                                    onClick={showPrev}
                                >
                                    <ChevronLeft className="w-10 h-10" />
                                </button>
                                <button
                                    className="absolute right-6 p-4 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-all z-50 hidden md:block"
                                    onClick={showNext}
                                >
                                    <ChevronRight className="w-10 h-10" />
                                </button>
                            </>
                        )}

                        {/* Image Container */}
                        <div 
                            className="relative w-full max-w-6xl h-[80vh] md:h-[90vh] mx-4 flex flex-col items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative w-full h-full">
                                <Image
                                    src={filteredImages[selectedIndex].imageUrl}
                                    alt={filteredImages[selectedIndex].title || 'Gallery image'}
                                    fill
                                    className="object-contain"
                                    quality={100}
                                />
                            </div>
                            
                            {/* Mobile Navigation (shows under image on small screens) */}
                            {filteredImages.length > 1 && (
                                <div className="flex md:hidden items-center justify-between w-full px-4 mt-6">
                                    <button onClick={showPrev} className="p-3 text-white bg-white/10 rounded-full active:bg-white/20">
                                        <ChevronLeft className="w-8 h-8" />
                                    </button>
                                    <div className="text-white/80 text-sm font-medium tracking-widest">
                                        {selectedIndex + 1} / {filteredImages.length}
                                    </div>
                                    <button onClick={showNext} className="p-3 text-white bg-white/10 rounded-full active:bg-white/20">
                                        <ChevronRight className="w-8 h-8" />
                                    </button>
                                </div>
                            )}

                            {/* Title/Category Label */}
                            <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none hidden md:block">
                                <div className="inline-block bg-black/60 backdrop-blur-md px-6 py-3 rounded-full text-white">
                                    <span className="text-[var(--gold-accent)] text-xs tracking-[0.2em] uppercase mr-3">
                                        {getCategoryForImage(filteredImages[selectedIndex].title)}
                                    </span>
                                    <span className="font-serif text-lg">
                                        {filteredImages[selectedIndex].title || 'Untitled'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
