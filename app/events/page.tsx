'use client';


import { useState } from 'react';

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
        <main className="min-h-screen bg-[#FBFBF9] font-sans">

            {/* Hero Section */}
            <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0A4D4E]/30 to-[#0A4D4E]/70" />
                <div className="absolute inset-0 bg-[url('/images/events/hero.jpg')] bg-cover bg-center" />
                <div className="relative z-10 text-center px-6">
                    <p className="text-[#C9A961] text-sm tracking-[0.3em] uppercase mb-4">Celebrate in Style</p>
                    <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 tracking-wide">Events & Weddings</h1>
                    <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto font-light">
                        Create unforgettable memories in our stunning venues
                    </p>
                </div>
            </section>

            {/* Banquet Hall Section */}
            <section className="py-24 px-6 md:px-12">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
                        {/* Image */}
                        <div className="relative h-[400px] bg-gray-100">
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A4D4E]/20 to-transparent" />
                            <div className="w-full h-full flex items-center justify-center">
                                <p className="text-[#1C1C1C]/30 text-sm">Image: Grand Banquet Hall</p>
                            </div>
                        </div>

                        {/* Content */}
                        <div>
                            <p className="text-[#C9A961] text-sm tracking-[0.3em] uppercase mb-4">Our Venue</p>
                            <h2 className="text-4xl font-serif text-[#1C1C1C] mb-8 tracking-wide">
                                Grand Banquet Hall
                            </h2>
                            <p className="text-[#1C1C1C]/70 text-lg leading-relaxed mb-8">
                                Our magnificent banquet hall is the perfect setting for weddings, corporate events,
                                conferences, and celebrations. With elegant décor, state-of-the-art facilities, and
                                impeccable service, we ensure your event is truly memorable.
                            </p>

                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="bg-white p-6 border border-gray-200">
                                    <p className="text-4xl font-serif text-[#0A4D4E] mb-2">500+</p>
                                    <p className="text-sm text-[#1C1C1C]/60 uppercase tracking-wider">Seating Capacity</p>
                                </div>
                                <div className="bg-white p-6 border border-gray-200">
                                    <p className="text-4xl font-serif text-[#0A4D4E] mb-2">800+</p>
                                    <p className="text-sm text-[#1C1C1C]/60 uppercase tracking-wider">Standing Capacity</p>
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
                                    <li key={idx} className="flex items-center gap-3 text-[#1C1C1C]/70">
                                        <svg className="w-5 h-5 text-[#C9A961]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        <div className="text-center p-8 bg-white border border-gray-100 hover:border-[#C9A961] transition-colors">
                            <div className="w-16 h-16 bg-[#C9A961]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-[#C9A961]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-serif text-[#1C1C1C] mb-4">Weddings</h3>
                            <p className="text-[#1C1C1C]/60 text-sm leading-relaxed">
                                Create your dream wedding with our customizable packages and dedicated planning team
                            </p>
                        </div>

                        <div className="text-center p-8 bg-white border border-gray-100 hover:border-[#C9A961] transition-colors">
                            <div className="w-16 h-16 bg-[#C9A961]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-[#C9A961]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-serif text-[#1C1C1C] mb-4">Corporate Events</h3>
                            <p className="text-[#1C1C1C]/60 text-sm leading-relaxed">
                                Host successful conferences, seminars, and business meetings in our professional setting
                            </p>
                        </div>

                        <div className="text-center p-8 bg-white border border-gray-100 hover:border-[#C9A961] transition-colors">
                            <div className="w-16 h-16 bg-[#C9A961]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-[#C9A961]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-serif text-[#1C1C1C] mb-4">Celebrations</h3>
                            <p className="text-[#1C1C1C]/60 text-sm leading-relaxed">
                                Celebrate birthdays, anniversaries, and special occasions in style
                            </p>
                        </div>
                    </div>

                    {/* Inquiry Form */}
                    <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 border border-gray-200">
                        <h2 className="text-3xl font-serif text-[#1C1C1C] mb-4 text-center tracking-wide">
                            Plan Your Event
                        </h2>
                        <p className="text-center text-[#1C1C1C]/60 mb-8">
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
                                        className="w-full px-4 py-3 border border-gray-300 focus:border-[#C9A961] outline-none transition-colors"
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
                                        className="w-full px-4 py-3 border border-gray-300 focus:border-[#C9A961] outline-none transition-colors"
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
                                        className="w-full px-4 py-3 border border-gray-300 focus:border-[#C9A961] outline-none transition-colors"
                                        placeholder="+91-XXXXXXXXXX"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-[#1C1C1C] mb-2">Event Type *</label>
                                    <select
                                        required
                                        value={formData.eventType}
                                        onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 focus:border-[#C9A961] outline-none transition-colors"
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
                                        className="w-full px-4 py-3 border border-gray-300 focus:border-[#C9A961] outline-none transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-[#1C1C1C] mb-2">Expected Guest Count *</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.guestCount}
                                        onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 focus:border-[#C9A961] outline-none transition-colors"
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
                                    className="w-full px-4 py-3 border border-gray-300 focus:border-[#C9A961] outline-none transition-colors resize-none"
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
                    <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
                        Our dedicated events team is ready to bring your vision to life
                    </p>
                    <a
                        href="tel:+911234567890"
                        className="inline-block bg-white text-[#0A4D4E] px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-[#C9A961] hover:text-white transition-colors"
                    >
                        Call Our Events Team
                    </a>
                </div>
            </section>
        </main>
    );
}
