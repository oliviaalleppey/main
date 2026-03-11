'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { useState } from 'react';

export default function DiscoverPage() {
    const [activeSection, setActiveSection] = useState(0);

    const experiences = [
        {
            title: 'Backwater Serenity',
            subtitle: 'Tranquil Escapes',
            description: 'Drift through the serene backwaters of Alappuzha, where time slows and nature whispers ancient stories',
            image: '/images/discover/backwater-serenity.png',
        },
        {
            title: 'Ayurvedic Wellness',
            subtitle: 'Ancient Healing',
            description: 'Experience the transformative power of authentic Ayurvedic treatments in our world-class wellness center',
            image: '/images/discover/ayurvedic-wellness.png',
        },
        {
            title: 'Culinary Journey',
            subtitle: 'Farm to Table',
            description: 'Savor the rich flavors of Kerala cuisine, crafted with locally-sourced ingredients and centuries-old recipes',
            image: '/images/discover/culinary-journey.png',
        },
        {
            title: 'Cultural Heritage',
            subtitle: 'Living Traditions',
            description: 'Immerse yourself in Kerala\'s vibrant cultural tapestry through traditional art forms and local experiences',
            image: '/images/discover/heritage-hotel.png',
        },
    ];

    const philosophy = [
        {
            icon: (
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
            title: 'Authenticity',
            description: 'Every experience is rooted in genuine Kerala traditions and culture',
        },
        {
            icon: (
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
                    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
            description: 'Immerse yourself in Kerala\'s vibrant cultural tapestry through traditional art forms and local experiences',
            image: '/images/placeholder.jpg',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#f5f5f0] via-white to-[#fafaf8]">
            {/* Hero Section */}
            <section className="relative overflow-hidden border-b border-[#ece5d8]">
                <div className="absolute inset-0">
                    <NextImage
                        src="/images/discover/heritage-hotel.png"
                        alt="Discover Olivia background"
                        fill
                        priority
                        className="object-cover object-center opacity-25"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#f6f2e8]/94 via-[#f8f5ee]/95 to-[#fafaf8]" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16 lg:py-20">
                    <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-7 md:gap-10 items-center">
                        <div className="rounded-2xl border border-[#e7decd] bg-white/88 backdrop-blur-sm p-6 md:p-9 shadow-[0_26px_70px_-48px_rgba(30,29,26,0.7)]">
                            <div className="w-16 h-[1px] bg-gradient-to-r from-[#B8956A] to-transparent mb-6" />
                            <p className="text-[#B8956A] text-xs md:text-sm tracking-[0.28em] uppercase mb-4 font-light">
                                Where Luxury Meets Legacy
                            </p>

                            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl mb-5 text-[#2c2c2c] tracking-tight leading-[0.9]">
                                Discover
                                <span className="block">Olivia</span>
                            </h1>

                            <p className="text-base md:text-xl text-gray-600 max-w-2xl leading-relaxed font-light">
                                A sanctuary where Kerala&apos;s timeless beauty converges with contemporary elegance, creating moments that transcend the ordinary.
                            </p>

                            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                                <button
                                    onClick={() => document.getElementById('heritage')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="px-8 py-3 bg-[#B8956A] text-white text-sm tracking-wider uppercase hover:bg-[#a07d54] transition-all duration-300"
                                >
                                    Our Story →
                                </button>
                                <button
                                    onClick={() => document.getElementById('philosophy')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="px-8 py-3 border border-[#B8956A] text-[#B8956A] text-sm tracking-wider uppercase hover:bg-[#B8956A] hover:text-white transition-all duration-300"
                                >
                                    Our Philosophy →
                                </button>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="relative h-[320px] sm:h-[420px] md:h-[500px] rounded-2xl overflow-hidden border border-[#e3dac9] shadow-[0_30px_70px_-50px_rgba(30,29,26,0.9)]">
                                <NextImage
                                    src="/images/discover/backwater-serenity.png"
                                    alt="Backwater view at Olivia Alleppey"
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
                            </div>

                            <div className="hidden sm:block absolute -bottom-5 md:-bottom-6 -left-4 md:-left-6 rounded-xl border border-[#dec8a4]/60 bg-[#0A332B] text-white px-4 md:px-5 py-3 md:py-4 shadow-[0_20px_45px_-28px_rgba(10,51,43,0.95)]">
                                <p className="text-[10px] md:text-[11px] tracking-[0.2em] uppercase text-[#e6cfa8]">Olivia Alleppey</p>
                                <p className="font-serif text-lg md:text-xl leading-tight">Backwater Luxury</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Our Heritage Section - Compact */}
            <section id="heritage" className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Image with Decorative Frame */}
                        <div className="relative">
                            <div className="absolute -top-4 -left-4 w-20 h-20 border-l border-t border-[#B8956A] opacity-30" />
                            <div className="absolute -bottom-4 -right-4 w-20 h-20 border-r border-b border-[#B8956A] opacity-30" />
                            <div className="aspect-[4/5] bg-gray-200 relative overflow-hidden">
                                <NextImage
                                    src="/images/discover/heritage-hotel.png"
                                    alt="Olivia International Heritage"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>

                        {/* Content */}
                        <div>
                            <div className="w-12 h-[1px] bg-[#B8956A] mb-4" />
                            <p className="text-[#B8956A] text-sm tracking-[0.3em] uppercase mb-3 font-light">
                                Our Story
                            </p>
                            <h2 className="font-serif text-4xl md:text-5xl mb-6 text-[#2c2c2c] leading-tight">
                                A Legacy of<br />Refined Hospitality
                            </h2>
                            <div className="space-y-4 text-gray-600 leading-relaxed">
                                <p>
                                    Nestled along the tranquil backwaters of Alappuzha, Olivia Alleppey, a 5 Star Classified Hotel, was born from a vision to create a sanctuary where Kerala&apos;s rich heritage meets contemporary luxury.
                                </p>
                                <p>
                                    Inspired by the timeless charm of God&apos;s Own Country, Olivia was designed to be more than just a destination. It is an experience where elegance, comfort, and nature exist in perfect harmony. From the gentle rhythm of the backwaters to the warm hospitality that welcomes every guest, each moment at Olivia reflects the spirit of Kerala.
                                </p>
                                <p>
                                    Since our inception, we have been dedicated to crafting meaningful experiences for discerning travelers who seek both serenity and sophistication. Every detail, from our thoughtfully designed architecture to our personalized service philosophy, celebrates the cultural essence of Kerala while embracing modern refinement.
                                </p>
                                <p>
                                    At Olivia Alleppey, tradition flows gracefully into luxury, creating a place where every stay becomes a story of comfort, beauty, and unforgettable memories.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Philosophy Section - Compact */}
            <section id="philosophy" className="py-20 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#B8956A] to-transparent mx-auto mb-4" />
                        <p className="text-[#B8956A] text-sm tracking-[0.3em] uppercase mb-3 font-light">
                            Our Principles
                        </p>
                        <h2 className="font-serif text-4xl md:text-5xl text-[#2c2c2c]">
                            The Olivia Philosophy
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            {
                                icon: (
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                                    </svg>
                                ),
                                subtitle: 'Tranquil Escapes',
                                title: 'Backwater Serenity',
                                description: 'Experience the peaceful rhythm of life along Kerala\'s legendary waterways'
                            },
                            {
                                icon: (
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                ),
                                subtitle: 'Ancient Healing',
                                title: 'Ayurvedic Wellness',
                                description: 'Discover holistic rejuvenation through time-honored Ayurvedic practices'
                            },
                            {
                                icon: (
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                ),
                                subtitle: 'Farm to Table',
                                title: 'Culinary Journey',
                                description: 'Savor authentic Kerala flavors crafted with locally-sourced ingredients'
                            },
                            {
                                icon: (
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                    </svg>
                                ),
                                subtitle: 'Living Traditions',
                                title: 'Cultural Heritage',
                                description: 'Immerse yourself in Kerala\'s vibrant arts, dance, and traditions'
                            }
                        ].map((item, index) => (
                            <div
                                key={index}
                                className="group bg-white border border-gray-200 p-8 hover:border-[#B8956A] transition-all duration-500 hover:shadow-lg"
                            >
                                <div className="text-[#B8956A] mb-4 group-hover:scale-110 transition-transform duration-500">
                                    {item.icon}
                                </div>
                                <p className="text-xs tracking-[0.3em] uppercase text-[#B8956A] mb-2 font-light">
                                    {item.subtitle}
                                </p>
                                <h3 className="font-serif text-2xl mb-3 text-[#2c2c2c]">
                                    {item.title}
                                </h3>
                                <div className="w-12 h-[1px] bg-gray-300 mb-3" />
                                <p className="text-gray-600 leading-relaxed text-sm">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Discover Kerala Experiences - Compact */}
            <section className="py-20 px-6 bg-[#fafaf8]">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#B8956A] to-transparent mx-auto mb-4" />
                        <p className="text-[#B8956A] text-sm tracking-[0.3em] uppercase mb-3 font-light">
                            Experiences
                        </p>
                        <h2 className="font-serif text-4xl md:text-5xl text-[#2c2c2c] mb-3">
                            Discover Kerala
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Immerse yourself in the essence of God's Own Country
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-10">
                        {experiences.map((exp, index) => (
                            <div
                                key={index}
                                className="group relative aspect-[4/3] overflow-hidden cursor-pointer"
                            >
                                <NextImage
                                    src={exp.image}
                                    alt={exp.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                />

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500" />

                                {/* Content */}
                                <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                                    <p className="text-xs tracking-[0.3em] uppercase mb-1 opacity-90">
                                        {exp.subtitle}
                                    </p>
                                    <h3 className="font-serif text-3xl mb-2">
                                        {exp.title}
                                    </h3>
                                    <p className="text-sm leading-relaxed mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-4 group-hover:translate-y-0">
                                        {exp.description}
                                    </p>
                                    <button className="text-sm tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500 text-left text-[#B8956A]">
                                        Explore →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center">
                        <Link
                            href="/experiences"
                            className="inline-block px-8 py-3 border border-[#B8956A] text-[#B8956A] text-sm tracking-wider uppercase hover:bg-[#B8956A] hover:text-white transition-all duration-300"
                        >
                            View All Experiences →
                        </Link>
                    </div>
                </div>
            </section>

            {/* Quote Section - Compact */}
            <section className="py-20 px-6 bg-white">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#B8956A] to-transparent mx-auto mb-8" />

                    <blockquote className="font-serif text-2xl md:text-3xl lg:text-4xl text-[#2c2c2c] leading-relaxed mb-8 italic">
                        "We don't just offer a place to stay—we offer a passage to Kerala's soul,
                        where every sunrise over the backwaters tells a story older than time itself."
                    </blockquote>

                    <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#B8956A] to-transparent mx-auto mb-4" />

                    <p className="text-sm tracking-[0.3em] uppercase text-[#B8956A] font-light">
                        The Olivia Philosophy
                    </p>
                </div>
            </section>

            {/* CTA Section - Compact */}
            <section className="py-16 px-6 bg-gradient-to-b from-[#fafaf8] to-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="font-serif text-3xl md:text-4xl text-[#2c2c2c] mb-6">
                        Begin Your Journey
                    </h2>
                    <p className="text-gray-600 mb-10 text-lg">
                        Experience the perfect harmony of luxury and tradition
                    </p>
                    <div className="flex gap-4 justify-center flex-wrap">
                        <Link
                            href="/rooms"
                            className="px-8 py-3 bg-[#B8956A] text-white text-sm tracking-wider uppercase hover:bg-[#a07d54] transition-all duration-300"
                        >
                            Explore Accommodations
                        </Link>
                        <Link
                            href="/contact"
                            className="px-8 py-3 border border-[#B8956A] text-[#B8956A] text-sm tracking-wider uppercase hover:bg-[#B8956A] hover:text-white transition-all duration-300"
                        >
                            Contact Us
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
