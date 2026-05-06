'use client';


import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

import Image from 'next/image';

interface GalleryImage {
    id: string;
    title: string;
    imageUrl: string;
    category: string;
}

export default function GalleryClient({ initialImages }: { initialImages: GalleryImage[] }) {
    return (
        <main className="min-h-screen bg-[var(--surface-cream)] font-sans">

            {/* Hero Section - Compact style like rooms page */}
            <section className="relative h-[44vh] md:h-[52vh] w-full overflow-hidden">
                <motion.div
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 8, ease: "easeOut" }}
                    className="absolute inset-0 z-0"
                >
                    {/* Dark gradient background like rooms page hero */}
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--brand-primary-deep)_0%,var(--brand-primary-dark)_38%,var(--brand-primary-deep)_100%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_25%_30%,rgba(231,212,173,0.18)_0%,rgba(231,212,173,0)_60%)]" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/40" />
                </motion.div>

                {/* Hero Content - Compact */}
                <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex items-center gap-4 mb-3"
                    >
                        <span className="w-8 h-[1px] bg-white/80" />
                        <p className="text-white text-[10px] tracking-[0.34em] uppercase font-light">
                            Olivia Alleppey
                        </p>
                        <span className="w-8 h-[1px] bg-white/80" />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 25 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-[4.25rem] sm:text-[5.25rem] md:text-[8.25rem] lg:text-[10.5rem] font-serif font-medium text-white mb-5 tracking-[-0.03em] leading-[0.92] [text-shadow:0_2px_22px_rgba(0,0,0,0.55)]"
                    >
                        Gallery
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className="flex gap-3"
                    >
                        <Link
                            href="#gallery-collection"
                            className="border border-white/90 bg-white text-[#2D3933] px-6 py-2.5 text-[10px] tracking-[0.22em] uppercase font-semibold shadow-[0_18px_40px_-28px_rgba(0,0,0,0.65)] hover:bg-white/95 transition-colors duration-300"
                        >
                            Explore Gallery
                        </Link>
                        <Link
                            href="/contact"
                            className="border border-white/85 bg-black/20 text-white px-6 py-2.5 text-[10px] tracking-[0.22em] uppercase font-semibold backdrop-blur-sm hover:bg-black/30 transition-colors duration-300"
                        >
                            Contact now
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Category Filter (Removed as all images are general gallery images) */}

            {/* Gallery Grid */}
            <section className="py-24 px-6 md:px-12">
                <div className="max-w-6xl mx-auto">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {initialImages.map((image) => (
                            <div
                                key={image.id}
                                className="group cursor-pointer"
                            >
                                {/* Image */}
                                <div className="relative h-72 bg-gray-100 mb-4 overflow-hidden rounded-lg">
                                    <Image 
                                        src={image.imageUrl} 
                                        alt={image.title} 
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
                                    <h3 className="text-lg font-serif text-[var(--text-dark)] mb-1">{image.title}</h3>
                                </div>
                            </div>
                        ))}
                    </div>

                    {initialImages.length === 0 && (
                        <div className="text-center py-16">
                            <p className="text-[#59544D]">No images in the gallery yet.</p>
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
        </main>
    );
}
