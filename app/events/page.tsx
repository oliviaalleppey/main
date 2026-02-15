'use client';

import Navigation from '@/components/navigation';
import Footer from '@/components/footer';
import StickyBookButton from '@/components/sticky-book-button';
import WhatsAppWidget from '@/components/whatsapp-widget';
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
        // TODO: Implement form submission
        console.log('Form submitted:', formData);
        alert('Thank you! We will contact you within 24 hours.');
    };

    return (
        <>
            <Navigation />
            <main className="min-h-screen">
                {/* Hero Section */}
                <section className="relative h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-luxury">
                    <div className="relative z-10 text-center text-white px-4">
                        <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl mb-4 tracking-tight">
                            Events & Weddings
                        </h1>
                        <p className="text-xl md:text-2xl text-pearl-white/90 max-w-2xl mx-auto">
                            Create unforgettable memories in our stunning venues
                        </p>
                    </div>
                </section>

                {/* Banquet Hall Section */}
                <section className="py-20 px-4 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
                            {/* Image */}
                            <div>
                                <div className="relative h-96 bg-gray-50 rounded-lg overflow-hidden shadow-luxury">
                                    <div className="absolute inset-0 bg-gradient-luxury opacity-20" />
                                    <div className="absolute inset-0 flex items-center justify-center text-white/50">
                                        <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div>
                                <h2 className="font-serif text-4xl md:text-5xl text-teal-deep mb-4">
                                    Grand Banquet Hall
                                </h2>
                                <p className="text-lg text-charcoal/80 mb-6 leading-relaxed">
                                    Our magnificent banquet hall is the perfect setting for weddings, corporate events, conferences, and celebrations. With elegant décor, state-of-the-art facilities, and impeccable service, we ensure your event is truly memorable.
                                </p>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-white p-4 rounded-lg shadow-sm">
                                        <div className="text-3xl font-bold text-teal-deep mb-1">500+</div>
                                        <div className="text-sm text-charcoal/70">Seating Capacity</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg shadow-sm">
                                        <div className="text-3xl font-bold text-teal-deep mb-1">800+</div>
                                        <div className="text-sm text-charcoal/70">Standing Capacity</div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center text-charcoal/80">
                                        <svg className="w-5 h-5 text-gold mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        State-of-the-art audio-visual equipment
                                    </div>
                                    <div className="flex items-center text-charcoal/80">
                                        <svg className="w-5 h-5 text-gold mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Customizable lighting and décor
                                    </div>
                                    <div className="flex items-center text-charcoal/80">
                                        <svg className="w-5 h-5 text-gold mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Dedicated event planning team
                                    </div>
                                    <div className="flex items-center text-charcoal/80">
                                        <svg className="w-5 h-5 text-gold mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        In-house catering services
                                    </div>
                                    <div className="flex items-center text-charcoal/80">
                                        <svg className="w-5 h-5 text-gold mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Ample parking space
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Event Types */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                            <div className="bg-white p-8 rounded-lg shadow-luxury text-center">
                                <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                <h3 className="font-serif text-2xl text-teal-deep mb-2">Weddings</h3>
                                <p className="text-charcoal/70">
                                    Create your dream wedding with our customizable packages and dedicated planning team
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-lg shadow-luxury text-center">
                                <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="font-serif text-2xl text-teal-deep mb-2">Corporate Events</h3>
                                <p className="text-charcoal/70">
                                    Host successful conferences, seminars, and business meetings in our professional setting
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-lg shadow-luxury text-center">
                                <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                    </svg>
                                </div>
                                <h3 className="font-serif text-2xl text-teal-deep mb-2">Celebrations</h3>
                                <p className="text-charcoal/70">
                                    Celebrate birthdays, anniversaries, and special occasions in style
                                </p>
                            </div>
                        </div>

                        {/* Inquiry Form */}
                        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-luxury p-8">
                            <h2 className="font-serif text-3xl md:text-4xl text-teal-deep mb-6 text-center">
                                Plan Your Event
                            </h2>
                            <p className="text-center text-charcoal/70 mb-8">
                                Fill out the form below and our events team will contact you within 24 hours
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-charcoal mb-2">
                                            Your Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 border border-soft-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-deep"
                                            placeholder="John Doe"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-charcoal mb-2">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 border border-soft-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-deep"
                                            placeholder="john@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-charcoal mb-2">
                                            Phone *
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-4 py-3 border border-soft-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-deep"
                                            placeholder="+91-XXXXXXXXXX"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-charcoal mb-2">
                                            Event Type *
                                        </label>
                                        <select
                                            required
                                            value={formData.eventType}
                                            onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                                            className="w-full px-4 py-3 border border-soft-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-deep"
                                        >
                                            <option value="wedding">Wedding</option>
                                            <option value="corporate">Corporate Event</option>
                                            <option value="birthday">Birthday Party</option>
                                            <option value="anniversary">Anniversary</option>
                                            <option value="other">Other Celebration</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-charcoal mb-2">
                                            Event Date *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.eventDate}
                                            onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                                            className="w-full px-4 py-3 border border-soft-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-deep"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-charcoal mb-2">
                                            Expected Guest Count *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.guestCount}
                                            onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                                            className="w-full px-4 py-3 border border-soft-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-deep"
                                            placeholder="100"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-charcoal mb-2">
                                        Additional Details
                                    </label>
                                    <textarea
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-soft-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-deep"
                                        placeholder="Tell us more about your event..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-gold hover:bg-gold/90 text-off-black px-8 py-4 rounded-lg font-semibold text-lg transition-luxury shadow-gold"
                                >
                                    Submit Inquiry
                                </button>
                            </form>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
            <StickyBookButton />
            <WhatsAppWidget />
        </>
    );
}
