'use client';


import Link from 'next/link';

const offers = [
    {
        id: 1,
        title: 'Early Bird Special',
        discount: '20% OFF',
        description: 'Book 30 days in advance and save 20% on your stay',
        validUntil: '2025-12-31',
        terms: ['Valid for bookings made 30+ days in advance', 'Non-refundable', 'Subject to availability'],
        badge: 'Popular',
    },
    {
        id: 2,
        title: 'Weekend Getaway',
        discount: '15% OFF',
        description: 'Enjoy a relaxing weekend with special rates on Friday-Sunday stays',
        validUntil: '2025-12-31',
        terms: ['Valid for Friday-Sunday stays', 'Minimum 2-night stay', 'Includes breakfast'],
        badge: 'Limited Time',
    },
    {
        id: 3,
        title: 'Extended Stay',
        discount: '25% OFF',
        description: 'Stay 5 nights or more and receive 25% off your entire booking',
        validUntil: '2025-12-31',
        terms: ['Minimum 5-night stay required', 'Includes daily breakfast', 'Free airport transfer'],
        badge: 'Best Value',
    },
    {
        id: 4,
        title: 'Honeymoon Package',
        discount: 'Special Rate',
        description: 'Romantic package with champagne, spa treatments, and candlelight dinner',
        validUntil: '2025-12-31',
        terms: ['Includes champagne on arrival', 'Couples spa treatment', 'Romantic dinner for two', 'Room decoration'],
        badge: 'Exclusive',
    },
    {
        id: 5,
        title: 'Business Traveler',
        discount: '10% OFF',
        description: 'Special corporate rates with flexible cancellation and late checkout',
        validUntil: '2025-12-31',
        terms: ['Valid for corporate bookings', 'Free late checkout until 2 PM', 'Complimentary meeting room access'],
        badge: 'Corporate',
    },
    {
        id: 6,
        title: 'Spa & Wellness Retreat',
        discount: 'Package Deal',
        description: 'Rejuvenate with our wellness package including spa treatments and yoga',
        validUntil: '2025-12-31',
        terms: ['Daily spa treatment', 'Morning yoga sessions', 'Healthy meal options', 'Wellness consultation'],
        badge: 'Wellness',
    },
];

export default function OffersPage() {
    return (
        <main className="min-h-screen bg-[#FBFBF9] font-sans">

            {/* Hero Section */}
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0A4D4E]/30 to-[#0A4D4E]/70" />
                <div className="absolute inset-0 bg-[url('/images/offers/hero.jpg')] bg-cover bg-center" />
                <div className="relative z-10 text-center px-6">
                    <p className="text-[#C9A961] text-sm tracking-[0.3em] uppercase mb-4">Exclusive Deals</p>
                    <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 tracking-wide">Special Offers</h1>
                    <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto font-light">
                        Curated packages and exclusive deals for your perfect stay
                    </p>
                </div>
            </section>

            {/* Offers Grid */}
            <section className="py-24 px-6 md:px-12">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {offers.map((offer) => (
                            <div
                                key={offer.id}
                                className="bg-white border border-gray-100 hover:border-[#C9A961] transition-colors"
                            >
                                {/* Badge */}
                                <div className="bg-[#C9A961] px-4 py-2 text-center">
                                    <span className="text-white text-xs uppercase tracking-[0.2em] font-medium">{offer.badge}</span>
                                </div>

                                {/* Content */}
                                <div className="p-8">
                                    {/* Discount */}
                                    <div className="text-center mb-6">
                                        <p className="text-4xl font-serif text-[#0A4D4E] mb-2">
                                            {offer.discount}
                                        </p>
                                        <h3 className="text-xl font-serif text-[#1C1C1C] mb-3">
                                            {offer.title}
                                        </h3>
                                        <p className="text-[#1C1C1C]/60 text-sm leading-relaxed">
                                            {offer.description}
                                        </p>
                                    </div>

                                    {/* Terms */}
                                    <div className="border-t border-gray-200 pt-6 mb-6">
                                        <p className="text-xs uppercase tracking-wider text-[#1C1C1C]/50 mb-3">Terms & Conditions</p>
                                        <ul className="space-y-2">
                                            {offer.terms.map((term, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-xs text-[#1C1C1C]/70">
                                                    <svg className="w-4 h-4 text-[#C9A961] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    {term}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Valid Until */}
                                    <p className="text-xs text-[#1C1C1C]/40 text-center mb-6">
                                        Valid until {new Date(offer.validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>

                                    {/* CTA */}
                                    <Link
                                        href="#booking-search"
                                        className="block w-full bg-[#0A4D4E] text-white text-center py-4 text-sm uppercase tracking-[0.2em] hover:bg-[#15443B] transition-colors"
                                    >
                                        Book Now
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Newsletter Section */}
            <section className="py-24 px-6 md:px-12 bg-white">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-serif text-[#1C1C1C] mb-6 tracking-wide">
                        Never Miss an Offer
                    </h2>
                    <p className="text-[#1C1C1C]/70 text-lg mb-8">
                        Subscribe to our newsletter and be the first to know about exclusive deals and promotions
                    </p>
                    <form className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 px-6 py-4 border border-gray-300 focus:border-[#C9A961] outline-none transition-colors"
                        />
                        <button
                            type="submit"
                            className="bg-[#0A4D4E] text-white px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-[#15443B] transition-colors whitespace-nowrap"
                        >
                            Subscribe
                        </button>
                    </form>
                </div>
            </section>

            {/* Contact CTA */}
            <section className="py-20 px-6 md:px-12 bg-[#0A4D4E]">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-6 tracking-wide">
                        Need a Custom Package?
                    </h2>
                    <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
                        Our team can create a personalized package tailored to your specific needs
                    </p>
                    <Link
                        href="/contact"
                        className="inline-block bg-white text-[#0A4D4E] px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-[#C9A961] hover:text-white transition-colors"
                    >
                        Contact Us
                    </Link>
                </div>
            </section>
        </main>
    );
}
