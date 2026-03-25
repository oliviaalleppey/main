'use client';


import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

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
                        Contact Us
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className="flex gap-3"
                    >
                        <Link
                            href="#contact-form"
                            className="border border-white/90 bg-white text-[#2D3933] px-6 py-2.5 text-[10px] tracking-[0.22em] uppercase font-semibold shadow-[0_18px_40px_-28px_rgba(0,0,0,0.65)] hover:bg-white/95 transition-colors duration-300"
                        >
                            Send Message
                        </Link>
                        <Link
                            href="/book/search"
                            className="border border-white/85 bg-black/20 text-white px-6 py-2.5 text-[10px] tracking-[0.22em] uppercase font-semibold backdrop-blur-sm hover:bg-black/30 transition-colors duration-300"
                        >
                            Book Now
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact-form" className="py-24 px-6 md:px-12">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16">
                        {/* Contact Information */}
                        <div>
                            <p className="text-[var(--gold-accent-dark)] text-sm tracking-[0.3em] uppercase mb-4">Contact Information</p>
                            <h2 className="text-4xl font-serif text-[var(--text-dark)] mb-8 tracking-wide">
                                Get in Touch
                            </h2>
                            <p className="text-[#403A35] text-lg leading-relaxed mb-12">
                                Whether you have questions about our rooms, amenities, or would like to make
                                a reservation, our team is ready to assist you around the clock.
                            </p>

                            <div className="space-y-8 mb-12">
                                {/* Address */}
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-[var(--gold-accent)]/10 flex items-center justify-center shrink-0">
                                        <svg className="w-6 h-6 text-[var(--gold-accent-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-[var(--text-dark)] mb-1">Address</h3>
                                        <p className="text-[#59544D]">
                                            Olivia International<br />
                                            Finishing Point, Punnamada<br />
                                            Alappuzha, Kerala - 688013<br />
                                            India
                                        </p>
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-[var(--gold-accent)]/10 flex items-center justify-center shrink-0">
                                        <svg className="w-6 h-6 text-[var(--gold-accent-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-[var(--text-dark)] mb-1">Phone</h3>
                                        <p className="text-[#59544D]">
                                            Primary (Landline): +91/0 477225088, +91/0 4772250800<br />
                                            Primary: <a href="tel:+918075416514" className="hover:text-[var(--gold-accent-dark)] transition-colors">+91 8075 416 514</a><br />
                                            Reservations: <a href="tel:+918075416514" className="hover:text-[var(--gold-accent-dark)] transition-colors">+91 8075 416 514</a><br />
                                            Code: Outside India +91 | India 0
                                        </p>
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-[var(--gold-accent)]/10 flex items-center justify-center shrink-0">
                                        <svg className="w-6 h-6 text-[var(--gold-accent-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-[var(--text-dark)] mb-1">Email</h3>
                                        <p className="text-[#59544D]">
                                            Main: {' '}
                                            <a href="mailto:reservation@oliviaalleppey.com" className="hover:text-[var(--gold-accent-dark)] transition-colors">
                                                reservation@oliviaalleppey.com
                                            </a>
                                            <br />
                                            Reservations: {' '}
                                            <a href="mailto:reservation@oliviaalleppey.com" className="hover:text-[var(--gold-accent-dark)] transition-colors">
                                                reservation@oliviaalleppey.com
                                            </a>
                                            <br />
                                            Support: {' '}
                                            <a href="mailto:mail@oliviaalleppey.com" className="hover:text-[var(--gold-accent-dark)] transition-colors">
                                                mail@oliviaalleppey.com
                                            </a>
                                        </p>
                                    </div>
                                </div>

                                {/* WhatsApp */}
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-[var(--gold-accent)]/10 flex items-center justify-center shrink-0">
                                        <svg className="w-6 h-6 text-[var(--gold-accent-dark)]" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-[var(--text-dark)] mb-1">WhatsApp</h3>
                                        <a href="https://wa.me/918075416514" className="text-[#59544D] hover:text-[var(--gold-accent-dark)] transition-colors">
                                            +91 8075 416 514
                                        </a>
                                    </div>
                                </div>

                                {/* Working Hours */}
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-[var(--gold-accent)]/10 flex items-center justify-center shrink-0">
                                        <svg className="w-6 h-6 text-[var(--gold-accent-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-[var(--text-dark)] mb-1">Working Hours</h3>
                                        <p className="text-[#59544D]">
                                            Reservations: 09:00 - 18:00<br />
                                            Front Desk: 24/7 hrs
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Map Placeholder */}
                            <div className="relative h-64 bg-white border border-gray-200">
                                <div className="absolute inset-0 flex items-center justify-center px-6">
                                    <div className="text-center">
                                        <p className="text-[#59544D] text-sm mb-4">
                                            Finishing Point, Punnamada, Alappuzha, Kerala - 688013, India
                                        </p>
                                        <a
                                            href="https://maps.app.goo.gl/yZ4xyGBqp8i8uo1Z9"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-block bg-[var(--brand-primary)] text-white px-5 py-2.5 text-xs uppercase tracking-[0.2em] hover:bg-[var(--brand-primary-dark)] transition-colors"
                                        >
                                            Open in Google Maps
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="bg-white p-8 md:p-12 border border-gray-200">
                            <h2 className="text-2xl font-serif text-[var(--text-dark)] mb-8 tracking-wide">
                                Send Us a Message
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm text-[var(--text-dark)] mb-2">
                                        Your Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 border border-[#BEB4A8] focus:border-[var(--btn-dark)] outline-none transition-colors"
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-[var(--text-dark)] mb-2">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 border border-[#BEB4A8] focus:border-[var(--btn-dark)] outline-none transition-colors"
                                        placeholder="john@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-[var(--text-dark)] mb-2">
                                        Phone *
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 border border-[#BEB4A8] focus:border-[var(--btn-dark)] outline-none transition-colors"
                                        placeholder="+91-XXXXXXXXXX"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-[var(--text-dark)] mb-2">
                                        Subject *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="w-full px-4 py-3 border border-[#BEB4A8] focus:border-[var(--btn-dark)] outline-none transition-colors"
                                        placeholder="Booking Inquiry"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-[var(--text-dark)] mb-2">
                                        Message *
                                    </label>
                                    <textarea
                                        required
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        rows={5}
                                        className="w-full px-4 py-3 border border-[#BEB4A8] focus:border-[var(--btn-dark)] outline-none transition-colors resize-none"
                                        placeholder="How can we help you?"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-[var(--brand-primary)] text-white py-4 text-sm uppercase tracking-[0.2em] hover:bg-[var(--brand-primary-dark)] transition-colors"
                                >
                                    Send Message
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6 md:px-12 bg-[var(--brand-primary)]">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-6 tracking-wide">
                        Ready to Book Your Stay?
                    </h2>
                    <p className="text-white/92 text-lg mb-8 max-w-2xl mx-auto">
                        Reserve your room directly for the best rates and exclusive benefits.
                    </p>
                    <a
                        href="#booking-search"
                        className="inline-block bg-white text-[var(--brand-primary)] px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-[var(--gold-accent)] hover:text-white transition-colors"
                    >
                        Reserve Now
                    </a>
                </div>
            </section>


        </main>
    );
}
