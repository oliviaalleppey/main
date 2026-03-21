'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

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
        image: '',
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
        image: '',
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
        image: '',
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
        image: '',
    },
];


export default function WellnessPage() {
    const [activeService, setActiveService] = useState('spa');

    useEffect(() => {
        const validServiceIds = new Set(wellnessServices.map((service) => service.id));

        const applyHashSelection = () => {
            const hash = window.location.hash.replace('#', '').trim();
            if (hash && validServiceIds.has(hash)) {
                setActiveService(hash);
            }
        };

        applyHashSelection();
        window.addEventListener('hashchange', applyHashSelection);
        return () => window.removeEventListener('hashchange', applyHashSelection);
    }, []);

    const handleServiceSelect = (serviceId: string) => {
        setActiveService(serviceId);
        window.history.replaceState(null, '', `#${serviceId}`);
    };

    return (
        <main className="min-h-screen bg-[#F6F1E8] font-sans">

            {/* Hero Section - Compact style like rooms page */}
            <section className="relative h-[44vh] md:h-[52vh] w-full overflow-hidden">
                <motion.div
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 8, ease: "easeOut" }}
                    className="absolute inset-0 z-0"
                >
                    {/* Dark gradient background like rooms page hero */}
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,#1C2622_0%,#2B3A34_38%,#1B2421_100%)]" />
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
                        className="text-[3rem] sm:text-[4rem] md:text-[6rem] lg:text-[8rem] font-serif font-medium text-white mb-5 tracking-[-0.03em] leading-[0.92] [text-shadow:0_2px_22px_rgba(0,0,0,0.55)]"
                    >
                        Wellness
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className="flex gap-3"
                    >
                        <Link
                            href="#wellness-services"
                            className="border border-white/90 bg-white text-[#2D3933] px-6 py-2.5 text-[10px] tracking-[0.22em] uppercase font-semibold shadow-[0_18px_40px_-28px_rgba(0,0,0,0.65)] hover:bg-white/95 transition-colors duration-300"
                        >
                            Explore Spa
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

            {/* Introduction */}
            <section className="py-20 px-6 md:px-12">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-serif text-[#1C1C1C] mb-8 tracking-wide">
                        A Journey to Inner Peace
                    </h2>
                    <p className="text-[#403A35] text-lg leading-relaxed mb-8">
                        At Olivia International, wellness is not merely a service; it is a philosophy deeply rooted in Kerala&apos;s
                        ancient healing traditions. Our wellness center draws inspiration from Ayurveda, the 5,000-year-old
                        science of life, while embracing modern therapeutic practices. Every treatment, every session,
                        every moment is designed to guide you toward optimal well-being.
                    </p>
                    <div className="flex justify-center gap-8 text-center">
                        <div>
                            <p className="text-4xl font-serif text-[#0A4D4E]">15+</p>
                            <p className="text-sm text-[#59544D] uppercase tracking-wider mt-2">Treatments</p>
                        </div>
                        <div>
                            <p className="text-4xl font-serif text-[#0A4D4E]">8</p>
                            <p className="text-sm text-[#59544D] uppercase tracking-wider mt-2">Expert Therapists</p>
                        </div>
                        <div>
                            <p className="text-4xl font-serif text-[#0A4D4E]">5★</p>
                            <p className="text-sm text-[#59544D] uppercase tracking-wider mt-2">Spa Rating</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Navigation */}
            <section
                className="bg-white py-8 border-y border-gray-200 sticky z-40"
                style={{ top: 'var(--site-header-height, 62px)' }}
            >
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex justify-center gap-4 md:gap-8 overflow-x-auto">
                        {wellnessServices.map((service) => (
                            <button
                                key={service.id}
                                onClick={() => handleServiceSelect(service.id)}
                                className={`px-4 py-2 text-sm uppercase tracking-wider whitespace-nowrap transition-all ${activeService === service.id
                                    ? 'text-[#0A4D4E] border-b-2 border-[#0A4D4E]'
                                    : 'text-[#59544D] hover:text-[#1C1C1C]'
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
                    id={service.id}
                    className={`py-20 px-6 md:px-12 ${activeService === service.id ? 'block' : 'hidden'}`}
                >
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <p className="text-[#7A5E28] text-sm tracking-[0.2em] uppercase mb-4">{service.subtitle}</p>
                                <h2 className="text-4xl md:text-5xl font-serif text-[#1C1C1C] mb-6 tracking-wide">
                                    {service.title}
                                </h2>
                                <p className="text-[#403A35] text-lg leading-relaxed mb-8">
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
                                                    <p className="text-sm text-[#59544D]">{treatment.duration}</p>
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
                                                    <p className="text-sm text-[#59544D]">{offering.time}</p>
                                                </div>
                                                <span className="text-xs uppercase tracking-wider text-[#7A5E28] bg-[#C5A059]/10 px-3 py-1">
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
                                                <div className="w-2 h-2 bg-[#C5A059] rounded-full" />
                                                <p className="text-[#1C1C1C]/80">{facility}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {'features' in service && service.features && (
                                    <div className="grid grid-cols-2 gap-4">
                                        {service.features.map((feature, idx) => (
                                            <div key={idx} className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-[#C5A059] rounded-full" />
                                                <p className="text-[#1C1C1C]/80">{feature}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="relative h-[500px] bg-gray-100">
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0A4D4E]/20 to-transparent" />
                                <div className="w-full h-full bg-[#E8E2D9] flex items-center justify-center">
                                    <p className="text-[#8F877F] text-sm">Image: {service.title}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            ))}


            {/* Operating Hours */}
            <section className="py-20 px-6 md:px-12 bg-[#E8E2D9]">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-serif text-[#1C1C1C] tracking-wide">Operating Hours</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <div className="bg-white p-8">
                            <h3 className="text-lg font-serif text-[#1C1C1C] mb-4">The Spa</h3>
                            <p className="text-[#403A35]">9:00 AM - 9:00 PM</p>
                            <p className="text-sm text-[#6B645C] mt-2">Daily</p>
                        </div>
                        <div className="bg-white p-8">
                            <h3 className="text-lg font-serif text-[#1C1C1C] mb-4">Fitness Centre</h3>
                            <p className="text-[#403A35]">6:00 AM - 10:00 PM</p>
                            <p className="text-sm text-[#6B645C] mt-2">Daily</p>
                        </div>
                        <div className="bg-white p-8">
                            <h3 className="text-lg font-serif text-[#1C1C1C] mb-4">Infinity Pool</h3>
                            <p className="text-[#403A35]">7:00 AM - 8:00 PM</p>
                            <p className="text-sm text-[#6B645C] mt-2">Daily</p>
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
                    <p className="text-white/92 text-lg mb-8 max-w-2xl mx-auto">
                        Reserve your spa treatment or wellness package in advance to ensure availability during your stay.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="#booking-search"
                            className="bg-white text-[#0A4D4E] px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-[#C5A059] hover:text-white transition-colors"
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
