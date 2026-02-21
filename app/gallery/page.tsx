'use client';


import { useState } from 'react';

const categories = ['All', 'Rooms', 'Dining', 'Spa', 'Pool', 'Events'];

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
        <main className="min-h-screen bg-[#FBFBF9] font-sans">

            {/* Hero Section */}
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0A4D4E]/30 to-[#0A4D4E]/70" />
                <div className="absolute inset-0 bg-[url('/images/gallery/hero.jpg')] bg-cover bg-center" />
                <div className="relative z-10 text-center px-6">
                    <p className="text-[#C9A961] text-sm tracking-[0.3em] uppercase mb-4">Visual Stories</p>
                    <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 tracking-wide">Gallery</h1>
                    <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto font-light">
                        Explore our luxury hotel through images
                    </p>
                </div>
            </section>

            {/* Category Filter */}
            <section className="py-8 px-6 md:px-12 bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-wrap justify-center gap-4">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-6 py-3 text-sm uppercase tracking-wider transition-all ${selectedCategory === category
                                    ? 'text-[#0A4D4E] border-b-2 border-[#0A4D4E]'
                                    : 'text-[#1C1C1C]/60 hover:text-[#1C1C1C]'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Gallery Grid */}
            <section className="py-24 px-6 md:px-12">
                <div className="max-w-6xl mx-auto">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredImages.map((image) => (
                            <div
                                key={image.id}
                                className="group cursor-pointer"
                            >
                                {/* Image */}
                                <div className="relative h-72 bg-gray-100 mb-4 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A4D4E]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-full h-full flex items-center justify-center">
                                        <p className="text-[#1C1C1C]/20 text-sm">Image: {image.title}</p>
                                    </div>

                                    {/* Overlay on Hover */}
                                    <div className="absolute inset-0 bg-[#0A4D4E]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Image Info */}
                                <div>
                                    <p className="text-[#C9A961] text-xs tracking-[0.2em] uppercase mb-1">{image.category}</p>
                                    <h3 className="text-lg font-serif text-[#1C1C1C] mb-1">{image.title}</h3>
                                    <p className="text-sm text-[#1C1C1C]/60">{image.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredImages.length === 0 && (
                        <div className="text-center py-16">
                            <p className="text-[#1C1C1C]/60">No images found in this category</p>
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6 md:px-12 bg-[#0A4D4E]">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-6 tracking-wide">
                        Experience It Yourself
                    </h2>
                    <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
                        Pictures can only tell part of the story. Book your stay and experience the luxury firsthand.
                    </p>
                    <a
                        href="#booking-search"
                        className="inline-block bg-white text-[#0A4D4E] px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-[#C9A961] hover:text-white transition-colors"
                    >
                        Book Your Stay
                    </a>
                </div>
            </section>
        </main>
    );
}
