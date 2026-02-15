'use client';

import Navigation from '@/components/navigation';
import Footer from '@/components/footer';
import StickyBookButton from '@/components/sticky-book-button';
import WhatsAppWidget from '@/components/whatsapp-widget';
import { useState } from 'react';

const categories = ['All', 'Rooms', 'Dining', 'Spa', 'Pool', 'Events'];

// Mock gallery data - in production this would come from database
const galleryImages = [
    { id: 1, category: 'Rooms', title: 'Deluxe Suite', description: 'Spacious luxury accommodation' },
    { id: 2, category: 'Rooms', title: 'Balcony View', description: 'Stunning backwater views' },
    { id: 3, category: 'Dining', title: 'Fine Dining', description: 'Exquisite culinary experience' },
    { id: 4, category: 'Dining', title: 'Rooftop Bar', description: 'Sunset cocktails' },
    { id: 5, category: 'Spa', title: 'Wellness Center', description: 'Rejuvenation and relaxation' },
    { id: 6, category: 'Spa', title: 'Treatment Room', description: 'Luxury spa treatments' },
    { id: 7, category: 'Pool', title: 'Infinity Pool', description: 'Panoramic views' },
    { id: 8, category: 'Pool', title: 'Poolside Lounge', description: 'Relaxation area' },
    { id: 9, category: 'Events', title: 'Grand Ballroom', description: 'Perfect for celebrations' },
    { id: 10, category: 'Events', title: 'Wedding Setup', description: 'Dream wedding venue' },
    { id: 11, category: 'Rooms', title: 'Suite Bathroom', description: 'Marble luxury' },
    { id: 12, category: 'Dining', title: 'Breakfast Buffet', description: 'International cuisine' },
];

export default function GalleryPage() {
    const [selectedCategory, setSelectedCategory] = useState('All');

    const filteredImages = selectedCategory === 'All'
        ? galleryImages
        : galleryImages.filter(img => img.category === selectedCategory);

    return (
        <>
            <Navigation />
            <main className="min-h-screen bg-white">
                {/* Hero Section */}
                <section className="relative h-[50vh] flex items-center justify-center overflow-hidden bg-gradient-luxury">
                    <div className="relative z-10 text-center text-white px-4">
                        <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl mb-4 tracking-tight">
                            Gallery
                        </h1>
                        <p className="text-xl md:text-2xl text-pearl-white/90 max-w-2xl mx-auto">
                            Explore our luxury hotel through images
                        </p>
                    </div>
                </section>

                {/* Category Filter */}
                <section className="py-8 px-4 bg-white shadow-sm sticky top-20 z-40">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-wrap justify-center gap-3">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-6 py-2 rounded-lg font-semibold transition-luxury ${selectedCategory === category
                                        ? 'bg-teal-deep text-white shadow-luxury'
                                        : 'bg-gray-50 text-charcoal/70 hover:bg-teal-deep/10 hover:text-teal-deep'
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Gallery Grid */}
                <section className="py-16 px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredImages.map((image, index) => (
                                <div
                                    key={image.id}
                                    className="group relative bg-white rounded-lg overflow-hidden shadow-luxury hover:shadow-gold transition-luxury cursor-pointer animate-fade-in"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    {/* Image Placeholder */}
                                    <div className="relative h-64 bg-gray-50 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-luxury opacity-20 group-hover:opacity-40 transition-luxury" />
                                        <div className="absolute inset-0 flex items-center justify-center text-white/50">
                                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>

                                        {/* Overlay on Hover */}
                                        <div className="absolute inset-0 bg-teal-deep/90 opacity-0 group-hover:opacity-100 transition-luxury flex items-center justify-center">
                                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Image Info */}
                                    <div className="p-4">
                                        <div className="text-xs text-gold font-semibold mb-1">{image.category}</div>
                                        <h3 className="font-serif text-xl text-teal-deep mb-1">{image.title}</h3>
                                        <p className="text-sm text-charcoal/70">{image.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredImages.length === 0 && (
                            <div className="text-center py-16">
                                <p className="text-xl text-charcoal/60">No images found in this category</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-16 px-4 bg-gray-50">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="font-serif text-3xl md:text-4xl text-teal-deep mb-4">
                            Experience It Yourself
                        </h2>
                        <p className="text-lg text-charcoal/70 mb-8">
                            Pictures can only tell part of the story. Book your stay and experience the luxury firsthand.
                        </p>
                        <a
                            href="/book"
                            className="inline-block bg-gold hover:bg-gold/90 text-off-black px-8 py-4 rounded-lg font-semibold text-lg transition-luxury shadow-gold"
                        >
                            Book Your Stay
                        </a>
                    </div>
                </section>
            </main>

            <Footer />
            <StickyBookButton />
            <WhatsAppWidget />
        </>
    );
}
