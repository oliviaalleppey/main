'use client';


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
        <main className="min-h-screen bg-[#FBFBF9] font-sans">


            {/* Hero Section */}
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0A4D4E]/30 to-[#0A4D4E]/70" />
                <div className="absolute inset-0 bg-[url('/images/contact/hero.jpg')] bg-cover bg-center" />
                <div className="relative z-10 text-center px-6">
                    <p className="text-[#C9A961] text-sm tracking-[0.3em] uppercase mb-4">Get in Touch</p>
                    <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 tracking-wide">Contact Us</h1>
                    <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto font-light">
                        We're here to assist you with any inquiries
                    </p>
                </div>
            </section>

            {/* Contact Section */}
            <section className="py-24 px-6 md:px-12">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16">
                        {/* Contact Information */}
                        <div>
                            <p className="text-[#C9A961] text-sm tracking-[0.3em] uppercase mb-4">Contact Information</p>
                            <h2 className="text-4xl font-serif text-[#1C1C1C] mb-8 tracking-wide">
                                Get in Touch
                            </h2>
                            <p className="text-[#1C1C1C]/70 text-lg leading-relaxed mb-12">
                                Whether you have questions about our rooms, amenities, or would like to make
                                a reservation, our team is ready to assist you around the clock.
                            </p>

                            <div className="space-y-8 mb-12">
                                {/* Address */}
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-[#C9A961]/10 flex items-center justify-center shrink-0">
                                        <svg className="w-6 h-6 text-[#C9A961]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-[#1C1C1C] mb-1">Address</h3>
                                        <p className="text-[#1C1C1C]/60">
                                            Olivia International Hotel<br />
                                            Alappuzha, Kerala<br />
                                            India - 688001
                                        </p>
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-[#C9A961]/10 flex items-center justify-center shrink-0">
                                        <svg className="w-6 h-6 text-[#C9A961]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-[#1C1C1C] mb-1">Phone</h3>
                                        <a href="tel:+911234567890" className="text-[#1C1C1C]/60 hover:text-[#C9A961] transition-colors">
                                            +91 1234 567890
                                        </a>
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-[#C9A961]/10 flex items-center justify-center shrink-0">
                                        <svg className="w-6 h-6 text-[#C9A961]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-[#1C1C1C] mb-1">Email</h3>
                                        <a href="mailto:info@olivia-alappuzha.com" className="text-[#1C1C1C]/60 hover:text-[#C9A961] transition-colors">
                                            info@olivia-alappuzha.com
                                        </a>
                                    </div>
                                </div>

                                {/* WhatsApp */}
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-[#C9A961]/10 flex items-center justify-center shrink-0">
                                        <svg className="w-6 h-6 text-[#C9A961]" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-[#1C1C1C] mb-1">WhatsApp</h3>
                                        <a href="https://wa.me/911234567890" className="text-[#1C1C1C]/60 hover:text-[#C9A961] transition-colors">
                                            Chat with us
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Map Placeholder */}
                            <div className="relative h-64 bg-white border border-gray-200">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center text-[#1C1C1C]/30">
                                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                        </svg>
                                        <p className="text-sm">Google Maps Integration</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="bg-white p-8 md:p-12 border border-gray-200">
                            <h2 className="text-2xl font-serif text-[#1C1C1C] mb-8 tracking-wide">
                                Send Us a Message
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm text-[#1C1C1C] mb-2">
                                        Your Name *
                                    </label>
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
                                    <label className="block text-sm text-[#1C1C1C] mb-2">
                                        Email *
                                    </label>
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
                                    <label className="block text-sm text-[#1C1C1C] mb-2">
                                        Phone *
                                    </label>
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
                                    <label className="block text-sm text-[#1C1C1C] mb-2">
                                        Subject *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 focus:border-[#C9A961] outline-none transition-colors"
                                        placeholder="Booking Inquiry"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-[#1C1C1C] mb-2">
                                        Message *
                                    </label>
                                    <textarea
                                        required
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        rows={5}
                                        className="w-full px-4 py-3 border border-gray-300 focus:border-[#C9A961] outline-none transition-colors resize-none"
                                        placeholder="How can we help you?"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-[#0A4D4E] text-white py-4 text-sm uppercase tracking-[0.2em] hover:bg-[#15443B] transition-colors"
                                >
                                    Send Message
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6 md:px-12 bg-[#0A4D4E]">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-6 tracking-wide">
                        Ready to Book Your Stay?
                    </h2>
                    <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
                        Reserve your room directly for the best rates and exclusive benefits.
                    </p>
                    <a
                        href="#booking-search"
                        className="inline-block bg-white text-[#0A4D4E] px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-[#C9A961] hover:text-white transition-colors"
                    >
                        Reserve Now
                    </a>
                </div>
            </section>


        </main>
    );
}
