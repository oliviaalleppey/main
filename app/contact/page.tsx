'use client';

import Navigation from '@/components/navigation';
import Footer from '@/components/footer';
import StickyBookButton from '@/components/sticky-book-button';
import WhatsAppWidget from '@/components/whatsapp-widget';
import { useState } from 'react';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement form submission
        console.log('Form submitted:', formData);
        alert('Thank you for contacting us! We will respond within 24 hours.');
    };

    return (
        <>
            <Navigation />
            <main className="min-h-screen">
                {/* Hero Section */}
                <section className="relative h-[50vh] flex items-center justify-center overflow-hidden bg-gradient-luxury">
                    <div className="relative z-10 text-center text-white px-4">
                        <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl mb-4 tracking-tight">
                            Contact Us
                        </h1>
                        <p className="text-xl md:text-2xl text-pearl-white/90 max-w-2xl mx-auto">
                            We're here to assist you
                        </p>
                    </div>
                </section>

                {/* Contact Section */}
                <section className="py-20 px-4 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Contact Information */}
                            <div>
                                <h2 className="font-serif text-3xl md:text-4xl text-teal-deep mb-6">
                                    Get in Touch
                                </h2>
                                <p className="text-lg text-charcoal/80 mb-8 leading-relaxed">
                                    Whether you have questions about our rooms, amenities, or would like to make a reservation, our team is ready to assist you.
                                </p>

                                <div className="space-y-6 mb-8">
                                    {/* Address */}
                                    <div className="flex items-start">
                                        <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0 mr-4">
                                            <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-teal-deep mb-1">Address</h3>
                                            <p className="text-charcoal/70">
                                                Olivia International Hotel<br />
                                                Alappuzha, Kerala<br />
                                                India - 688001
                                            </p>
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div className="flex items-start">
                                        <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0 mr-4">
                                            <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-teal-deep mb-1">Phone</h3>
                                            <a href="tel:+91XXXXXXXXXX" className="text-charcoal/70 hover:text-gold transition-luxury">
                                                +91-XXXXXXXXXX
                                            </a>
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="flex items-start">
                                        <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0 mr-4">
                                            <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-teal-deep mb-1">Email</h3>
                                            <a href="mailto:reservations@oliviahotel.com" className="text-charcoal/70 hover:text-gold transition-luxury">
                                                reservations@oliviahotel.com
                                            </a>
                                        </div>
                                    </div>

                                    {/* WhatsApp */}
                                    <div className="flex items-start">
                                        <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0 mr-4">
                                            <svg className="w-6 h-6 text-gold" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-teal-deep mb-1">WhatsApp</h3>
                                            <a href="https://wa.me/91XXXXXXXXXX" className="text-charcoal/70 hover:text-gold transition-luxury">
                                                Chat with us
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* Map Placeholder */}
                                <div className="bg-gray-50 rounded-lg h-64 flex items-center justify-center">
                                    <div className="text-center text-charcoal/50">
                                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                        </svg>
                                        <p>Google Maps Integration</p>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Form */}
                            <div className="bg-white rounded-lg shadow-luxury p-8">
                                <h2 className="font-serif text-3xl text-teal-deep mb-6">
                                    Send Us a Message
                                </h2>

                                <form onSubmit={handleSubmit} className="space-y-6">
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
                                            Subject *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            className="w-full px-4 py-3 border border-soft-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-deep"
                                            placeholder="Booking Inquiry"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-charcoal mb-2">
                                            Message *
                                        </label>
                                        <textarea
                                            required
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            rows={5}
                                            className="w-full px-4 py-3 border border-soft-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-deep"
                                            placeholder="How can we help you?"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-gold hover:bg-gold/90 text-off-black px-8 py-4 rounded-lg font-semibold text-lg transition-luxury shadow-gold"
                                    >
                                        Send Message
                                    </button>
                                </form>
                            </div>
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
