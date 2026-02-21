'use client';

import { useState } from 'react';

import Link from 'next/link';
import Image from 'next/image';

const wellnessServices = [
    {
        id: 'spa',
        title: 'The Spa at Olivia',
        subtitle: 'Ayurvedic & International Therapies',
        description: 'Immerse yourself in a sanctuary of serenity where ancient Ayurvedic wisdom meets contemporary wellness practices. Our spa offers a curated menu of treatments designed to restore balance and rejuvenate your spirit.',
        treatments: [
            { name: 'Kerala Ayurvedic Massage', duration: '90 min', price: '₹8,500' },
            { name: 'Abhyanga Therapy', duration: '75 min', price: '₹7,000' },
            { name: 'Shirodhara', duration: '60 min', price: '₹6,500' },
            { name: 'Potala Massage', duration: '90 min', price: '₹9,000' },
            { name: 'Aromatherapy Journey', duration: '60 min', price: '₹5,500' },
            { name: 'Deep Tissue Relief', duration: '60 min', price: '₹6,000' },
        ],
        image: '/images/wellness/spa.jpg',
    },
    {
        id: 'yoga',
        title: 'Yoga & Meditation',
        subtitle: 'Find Your Inner Peace',
        description: 'Begin your journey inward with our expert yoga practitioners. Set against the tranquil backwaters of Alappuzha, our yoga pavilion offers the perfect setting for mindfulness and spiritual renewal.',
        offerings: [
            { name: 'Sunrise Hatha Yoga', time: '6:00 AM - 7:15 AM', level: 'All Levels' },
            { name: 'Vinyasa Flow', time: '8:00 AM - 9:00 AM', level: 'Intermediate' },
            { name: 'Pranayama & Breathwork', time: '5:00 PM - 5:45 PM', level: 'All Levels' },
            { name: 'Sunset Meditation', time: '6:00 PM - 7:00 PM', level: 'All Levels' },
            { name: 'Private Yoga Session', time: 'By Appointment', level: 'Customized' },
        ],
        image: '/images/wellness/yoga.jpg',
    },
    {
        id: 'fitness',
        title: 'Fitness Centre',
        subtitle: 'State-of-the-Art Equipment',
        description: 'Maintain your fitness routine in our premium gymnasium, featuring the latest Technogym equipment and panoramic views of the surrounding greenery. Personal trainers available upon request.',
        facilities: [
            'Technogym Cardio Equipment',
            'Free Weights & Strength Training',
            'Functional Training Zone',
            'Personal Training Sessions',
            'Pilates Studio',
            'Spin Classes',
        ],
        image: '/images/wellness/fitness.jpg',
    },
    {
        id: 'pool',
        title: 'Infinity Pool',
        subtitle: 'Swim with a View',
        description: 'Our stunning infinity pool appears to merge with the horizon, offering breathtaking views of the Kerala landscape. Surrounded by lush tropical gardens, it\'s the perfect place to unwind.',
        features: [
            'Temperature-controlled Water',
            'Poolside Cabanas',
            'Refreshing Beverages',
            'Sunset Swimming',
            'Lap Swimming Hours',
            'Private Pool Parties',
        ],
        image: '/images/wellness/pool.jpg',
    },
];

const wellnessPackages = [
    {
        name: 'Serene Escape',
        duration: 'Half Day',
        price: '₹15,000',
        includes: ['90-min Signature Massage', 'Access to Pool & Steam', 'Healthy Lunch', 'Yoga Session'],
    },
    {
        name: 'Renewal Journey',
        duration: 'Full Day',
        price: '₹28,000',
        includes: ['Ayurvedic Consultation', 'Two Spa Treatments', 'All Meals', 'Yoga & Meditation', 'Pool Access'],
    },
    {
        name: 'Ultimate Wellness',
        duration: '3 Days',
        price: '₹75,000',
        includes: ['Personalized Wellness Plan', 'Daily Spa Treatments', 'Private Yoga Sessions', 'All Meals', 'Accommodation'],
    },
];

export default function WellnessPage() {
    const [activeService, setActiveService] = useState('spa');

    return (
        <main className="min-h-screen bg-[#FBFBF9] font-sans">

            {/* Hero Section */}
            <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0A4D4E]/30 to-[#0A4D4E]/60" />
                <div className="absolute inset-0 bg-[url('/images/wellness/hero.jpg')] bg-cover bg-center" />
                <div className="relative z-10 text-center px-6">
                    <p className="text-[#C9A961] text-sm tracking-[0.3em] uppercase mb-4">Wellness & Rejuvenation</p>
                    <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 tracking-wide">Wellness Sanctuary</h1>
                    <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
                        Discover a haven of tranquility where mind, body, and spirit unite in perfect harmony
                    </p>
                </div>
            </section>

            {/* Introduction */}
            <section className="py-20 px-6 md:px-12">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-serif text-[#1C1C1C] mb-8 tracking-wide">
                        A Journey to Inner Peace
                    </h2>
                    <p className="text-[#1C1C1C]/70 text-lg leading-relaxed mb-8">
                        At Olivia International, wellness is not merely a service—it is a philosophy deeply rooted in Kerala's
                        ancient healing traditions. Our wellness center draws inspiration from Ayurveda, the 5,000-year-old
                        science of life, while embracing modern therapeutic practices. Every treatment, every session,
                        every moment is designed to guide you toward optimal well-being.
                    </p>
                    <div className="flex justify-center gap-8 text-center">
                        <div>
                            <p className="text-4xl font-serif text-[#0A4D4E]">15+</p>
                            <p className="text-sm text-[#1C1C1C]/60 uppercase tracking-wider mt-2">Treatments</p>
                        </div>
                        <div>
                            <p className="text-4xl font-serif text-[#0A4D4E]">8</p>
                            <p className="text-sm text-[#1C1C1C]/60 uppercase tracking-wider mt-2">Expert Therapists</p>
                        </div>
                        <div>
                            <p className="text-4xl font-serif text-[#0A4D4E]">5★</p>
                            <p className="text-sm text-[#1C1C1C]/60 uppercase tracking-wider mt-2">Spa Rating</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Navigation */}
            <section className="bg-white py-8 border-y border-gray-200 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex justify-center gap-4 md:gap-8 overflow-x-auto">
                        {wellnessServices.map((service) => (
                            <button
                                key={service.id}
                                onClick={() => setActiveService(service.id)}
                                className={`px-4 py-2 text-sm uppercase tracking-wider whitespace-nowrap transition-all ${activeService === service.id
                                    ? 'text-[#0A4D4E] border-b-2 border-[#0A4D4E]'
                                    : 'text-[#1C1C1C]/60 hover:text-[#1C1C1C]'
                                    }`}
                            >
                                {service.title}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Active Service Detail */}
            {wellnessServices.map((service) => (
                <section
                    key={service.id}
                    className={`py-20 px-6 md:px-12 ${activeService === service.id ? 'block' : 'hidden'}`}
                >
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <p className="text-[#C9A961] text-sm tracking-[0.2em] uppercase mb-4">{service.subtitle}</p>
                                <h2 className="text-4xl md:text-5xl font-serif text-[#1C1C1C] mb-6 tracking-wide">
                                    {service.title}
                                </h2>
                                <p className="text-[#1C1C1C]/70 text-lg leading-relaxed mb-8">
                                    {service.description}
                                </p>

                                {/* Treatments/offerings list */}
                                {'treatments' in service && service.treatments && (
                                    <div className="space-y-4">
                                        <h3 className="text-sm uppercase tracking-[0.2em] text-[#0A4D4E] mb-4">Signature Treatments</h3>
                                        {service.treatments.map((treatment, idx) => (
                                            <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-200">
                                                <div>
                                                    <p className="text-[#1C1C1C] font-medium">{treatment.name}</p>
                                                    <p className="text-sm text-[#1C1C1C]/60">{treatment.duration}</p>
                                                </div>
                                                <p className="text-[#0A4D4E] font-medium">{treatment.price}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {'offerings' in service && service.offerings && (
                                    <div className="space-y-4">
                                        <h3 className="text-sm uppercase tracking-[0.2em] text-[#0A4D4E] mb-4">Weekly Schedule</h3>
                                        {service.offerings.map((offering, idx) => (
                                            <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-200">
                                                <div>
                                                    <p className="text-[#1C1C1C] font-medium">{offering.name}</p>
                                                    <p className="text-sm text-[#1C1C1C]/60">{offering.time}</p>
                                                </div>
                                                <span className="text-xs uppercase tracking-wider text-[#C9A961] bg-[#C9A961]/10 px-3 py-1">
                                                    {offering.level}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {'facilities' in service && service.facilities && (
                                    <div className="grid grid-cols-2 gap-4">
                                        {service.facilities.map((facility, idx) => (
                                            <div key={idx} className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-[#C9A961] rounded-full" />
                                                <p className="text-[#1C1C1C]/80">{facility}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {'features' in service && service.features && (
                                    <div className="grid grid-cols-2 gap-4">
                                        {service.features.map((feature, idx) => (
                                            <div key={idx} className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-[#C9A961] rounded-full" />
                                                <p className="text-[#1C1C1C]/80">{feature}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="relative h-[500px] bg-gray-100">
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0A4D4E]/20 to-transparent" />
                                <div className="w-full h-full bg-[#F5F5F0] flex items-center justify-center">
                                    <p className="text-[#1C1C1C]/30 text-sm">Image: {service.title}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            ))}

            {/* Wellness Packages */}
            <section className="py-20 px-6 md:px-12 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-[#C9A961] text-sm tracking-[0.3em] uppercase mb-4">Curated Experiences</p>
                        <h2 className="text-4xl md:text-5xl font-serif text-[#1C1C1C] tracking-wide">Wellness Packages</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {wellnessPackages.map((pkg, idx) => (
                            <div key={idx} className="border border-gray-200 p-8 hover:border-[#C9A961] transition-colors group">
                                <p className="text-[#C9A961] text-sm tracking-wider mb-2">{pkg.duration}</p>
                                <h3 className="text-2xl font-serif text-[#1C1C1C] mb-4">{pkg.name}</h3>
                                <p className="text-3xl font-serif text-[#0A4D4E] mb-6">{pkg.price}</p>
                                <ul className="space-y-3 mb-8">
                                    {pkg.includes.map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-[#1C1C1C]/70">
                                            <svg className="w-4 h-4 text-[#C9A961]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <button className="w-full bg-[#0A4D4E] text-white py-4 text-sm uppercase tracking-[0.2em] hover:bg-[#15443B] transition-colors">
                                    Book Now
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Operating Hours */}
            <section className="py-20 px-6 md:px-12 bg-[#F5F5F0]">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-serif text-[#1C1C1C] tracking-wide">Operating Hours</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <div className="bg-white p-8">
                            <h3 className="text-lg font-serif text-[#1C1C1C] mb-4">The Spa</h3>
                            <p className="text-[#1C1C1C]/70">9:00 AM - 9:00 PM</p>
                            <p className="text-sm text-[#1C1C1C]/50 mt-2">Daily</p>
                        </div>
                        <div className="bg-white p-8">
                            <h3 className="text-lg font-serif text-[#1C1C1C] mb-4">Fitness Centre</h3>
                            <p className="text-[#1C1C1C]/70">6:00 AM - 10:00 PM</p>
                            <p className="text-sm text-[#1C1C1C]/50 mt-2">Daily</p>
                        </div>
                        <div className="bg-white p-8">
                            <h3 className="text-lg font-serif text-[#1C1C1C] mb-4">Infinity Pool</h3>
                            <p className="text-[#1C1C1C]/70">7:00 AM - 8:00 PM</p>
                            <p className="text-sm text-[#1C1C1C]/50 mt-2">Daily</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6 md:px-12 bg-[#0A4D4E]">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-6 tracking-wide">
                        Begin Your Wellness Journey
                    </h2>
                    <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
                        Reserve your spa treatment or wellness package in advance to ensure availability during your stay.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="#booking-search"
                            className="bg-white text-[#0A4D4E] px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-[#C9A961] hover:text-white transition-colors"
                        >
                            Reserve Now
                        </Link>
                        <a
                            href="tel:+911234567890"
                            className="border border-white text-white px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-white hover:text-[#0A4D4E] transition-colors"
                        >
                            Call Us
                        </a>
                    </div>
                </div>
            </section>
        </main>
    );
}
