'use client';


import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function EventsPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        eventType: 'wedding',
        eventDate: '',
        guestCount: '',
        message: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
        alert('Thank you! We will contact you within 24 hours.');
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
                        Events & Weddings
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className="flex gap-3"
                    >
                        <Link
                            href="#venue-details"
                            className="border border-white/90 bg-white text-[#2D3933] px-6 py-2.5 text-[10px] tracking-[0.22em] uppercase font-semibold shadow-[0_18px_40px_-28px_rgba(0,0,0,0.65)] hover:bg-white/95 transition-colors duration-300"
                        >
                            Explore Venue
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

            {/* Banquet Hall Section */}
            <section id="venue-details" className="py-24 px-6 md:px-12">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
                        {/* Image */}
                        <div className="relative h-[400px] bg-gray-100">
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A4D4E]/20 to-transparent" />
                            <div className="w-full h-full flex items-center justify-center">
                                <p className="text-[#8F877F] text-sm">Image: Grand Banquet Hall</p>
                            </div>
                        </div>

                        {/* Content */}
                        <div>
                            <p className="text-[#7A5E28] text-sm tracking-[0.3em] uppercase mb-4">Our Venue</p>
                            <h2 className="text-4xl font-serif text-[#1C1C1C] mb-8 tracking-wide">
                                Grand Banquet Hall
                            </h2>
                            <p className="text-[#403A35] text-lg leading-relaxed mb-8">
                                Our magnificent banquet hall is the perfect setting for weddings, corporate events,
                                conferences, and celebrations. With elegant décor, state-of-the-art facilities, and
                                impeccable service, we ensure your event is truly memorable.
                            </p>

                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="bg-white p-6 border border-gray-200">
                                    <p className="text-4xl font-serif text-[#0A4D4E] mb-2">500+</p>
                                    <p className="text-sm text-[#59544D] uppercase tracking-wider">Seating Capacity</p>
                                </div>
                                <div className="bg-white p-6 border border-gray-200">
                                    <p className="text-4xl font-serif text-[#0A4D4E] mb-2">800+</p>
                                    <p className="text-sm text-[#59544D] uppercase tracking-wider">Standing Capacity</p>
                                </div>
                            </div>

                            <ul className="space-y-3">
                                {[
                                    'State-of-the-art audio-visual equipment',
                                    'Customizable lighting and décor',
                                    'Dedicated event planning team',
                                    'In-house catering services',
                                    'Ample parking space',
                                ].map((feature, idx) => (
                                    <li key={idx} className="flex items-center gap-3 text-[#403A35]">
                                        <svg className="w-5 h-5 text-[#7A5E28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Event Types */}
                    <div className="grid md:grid-cols-3 gap-8 mb-24">
                        <div className="text-center p-8 bg-white border border-[#DED6CB] hover:border-[#C5A059] transition-colors">
                            <div className="w-16 h-16 bg-[#C5A059]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-[#7A5E28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-serif text-[#1C1C1C] mb-4">Weddings</h3>
                            <p className="text-[#59544D] text-sm leading-relaxed">
                                Create your dream wedding with our customizable packages and dedicated planning team
                            </p>
                        </div>

                        <div className="text-center p-8 bg-white border border-[#DED6CB] hover:border-[#C5A059] transition-colors">
                            <div className="w-16 h-16 bg-[#C5A059]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-[#7A5E28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-serif text-[#1C1C1C] mb-4">Corporate Events</h3>
                            <p className="text-[#59544D] text-sm leading-relaxed">
                                Host successful conferences, seminars, and business meetings in our professional setting
                            </p>
                        </div>

                        <div className="text-center p-8 bg-white border border-[#DED6CB] hover:border-[#C5A059] transition-colors">
                            <div className="w-16 h-16 bg-[#C5A059]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-[#7A5E28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-serif text-[#1C1C1C] mb-4">Celebrations</h3>
                            <p className="text-[#59544D] text-sm leading-relaxed">
                                Celebrate birthdays, anniversaries, and special occasions in style
                            </p>
                        </div>
                    </div>

                    {/* Inquiry Form */}
                    <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 border border-gray-200">
                        <h2 className="text-3xl font-serif text-[#1C1C1C] mb-4 text-center tracking-wide">
                            Plan Your Event
                        </h2>
                        <p className="text-center text-[#59544D] mb-8">
                            Fill out the form below and our events team will contact you within 24 hours
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm text-[#1C1C1C] mb-2">Your Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 border border-[#BEB4A8] focus:border-[#2C2C2C] outline-none transition-colors"
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-[#1C1C1C] mb-2">Email *</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 border border-[#BEB4A8] focus:border-[#2C2C2C] outline-none transition-colors"
                                        placeholder="john@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-[#1C1C1C] mb-2">Phone *</label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 border border-[#BEB4A8] focus:border-[#2C2C2C] outline-none transition-colors"
                                        placeholder="+91-XXXXXXXXXX"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-[#1C1C1C] mb-2">Event Type *</label>
                                    <select
                                        required
                                        value={formData.eventType}
                                        onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                                        className="w-full px-4 py-3 border border-[#BEB4A8] focus:border-[#2C2C2C] outline-none transition-colors"
                                    >
                                        <option value="wedding">Wedding</option>
                                        <option value="corporate">Corporate Event</option>
                                        <option value="birthday">Birthday Party</option>
                                        <option value="anniversary">Anniversary</option>
                                        <option value="other">Other Celebration</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-[#1C1C1C] mb-2">Event Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.eventDate}
                                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                                        className="w-full px-4 py-3 border border-[#BEB4A8] focus:border-[#2C2C2C] outline-none transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-[#1C1C1C] mb-2">Expected Guest Count *</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.guestCount}
                                        onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                                        className="w-full px-4 py-3 border border-[#BEB4A8] focus:border-[#2C2C2C] outline-none transition-colors"
                                        placeholder="100"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-[#1C1C1C] mb-2">Additional Details</label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-[#BEB4A8] focus:border-[#2C2C2C] outline-none transition-colors resize-none"
                                    placeholder="Tell us more about your event..."
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-[#0A4D4E] text-white py-4 text-sm uppercase tracking-[0.2em] hover:bg-[#15443B] transition-colors"
                            >
                                Submit Inquiry
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6 md:px-12 bg-[#0A4D4E]">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-6 tracking-wide">
                        Let's Create Something Beautiful
                    </h2>
                    <p className="text-white/92 text-lg mb-8 max-w-2xl mx-auto">
                        Our dedicated events team is ready to bring your vision to life
                    </p>
                    <a
                        href="tel:+911234567890"
                        className="inline-block bg-white text-[#0A4D4E] px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-[#C5A059] hover:text-white transition-colors"
                    >
                        Call Our Events Team
                    </a>
                </div>
            </section>
        </main>
    );
}
