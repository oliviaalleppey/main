import Navigation from '@/components/navigation';
import Footer from '@/components/footer';
import StickyBookButton from '@/components/sticky-book-button';
import WhatsAppWidget from '@/components/whatsapp-widget';
import Link from 'next/link';

// Mock offers data - in production this would come from database
const offers = [
    {
        id: 1,
        title: 'Early Bird Special',
        discount: '20% OFF',
        description: 'Book 30 days in advance and save 20% on your stay',
        validUntil: '2024-12-31',
        terms: ['Valid for bookings made 30+ days in advance', 'Non-refundable', 'Subject to availability'],
        badge: 'Popular',
    },
    {
        id: 2,
        title: 'Weekend Getaway',
        discount: '15% OFF',
        description: 'Enjoy a relaxing weekend with special rates on Friday-Sunday stays',
        validUntil: '2024-12-31',
        terms: ['Valid for Friday-Sunday stays', 'Minimum 2-night stay', 'Includes breakfast'],
        badge: 'Limited Time',
    },
    {
        id: 3,
        title: 'Extended Stay',
        discount: '25% OFF',
        description: 'Stay 5 nights or more and receive 25% off your entire booking',
        validUntil: '2024-12-31',
        terms: ['Minimum 5-night stay required', 'Includes daily breakfast', 'Free airport transfer'],
        badge: 'Best Value',
    },
    {
        id: 4,
        title: 'Honeymoon Package',
        discount: 'Special Rate',
        description: 'Romantic package with champagne, spa treatments, and candlelight dinner',
        validUntil: '2024-12-31',
        terms: ['Includes champagne on arrival', 'Couples spa treatment', 'Romantic dinner for two', 'Room decoration'],
        badge: 'Exclusive',
    },
    {
        id: 5,
        title: 'Business Traveler',
        discount: '10% OFF',
        description: 'Special corporate rates with flexible cancellation and late checkout',
        validUntil: '2024-12-31',
        terms: ['Valid for corporate bookings', 'Free late checkout until 2 PM', 'Complimentary meeting room access'],
        badge: 'Corporate',
    },
    {
        id: 6,
        title: 'Spa & Wellness Retreat',
        discount: 'Package Deal',
        description: 'Rejuvenate with our wellness package including spa treatments and yoga',
        validUntil: '2024-12-31',
        terms: ['Daily spa treatment', 'Morning yoga sessions', 'Healthy meal options', 'Wellness consultation'],
        badge: 'Wellness',
    },
];

export default function OffersPage() {
    return (
        <>
            <Navigation />
            <main className="min-h-screen bg-white">
                {/* Hero Section */}
                <section className="relative h-[50vh] flex items-center justify-center overflow-hidden bg-gradient-luxury">
                    <div className="relative z-10 text-center text-white px-4">
                        <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl mb-4 tracking-tight">
                            Special Offers
                        </h1>
                        <p className="text-xl md:text-2xl text-pearl-white/90 max-w-2xl mx-auto">
                            Exclusive deals and packages for your perfect stay
                        </p>
                    </div>
                </section>

                {/* Offers Grid */}
                <section className="py-16 px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {offers.map((offer, index) => (
                                <div
                                    key={offer.id}
                                    className="bg-white rounded-lg overflow-hidden shadow-luxury hover:shadow-gold transition-luxury animate-fade-in"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    {/* Badge */}
                                    <div className="bg-gold px-4 py-2 text-center">
                                        <span className="text-off-black font-bold text-sm">{offer.badge}</span>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        {/* Discount */}
                                        <div className="text-center mb-4">
                                            <div className="text-4xl font-bold text-teal-deep mb-2">
                                                {offer.discount}
                                            </div>
                                            <h3 className="font-serif text-2xl text-charcoal mb-2">
                                                {offer.title}
                                            </h3>
                                            <p className="text-charcoal/70">
                                                {offer.description}
                                            </p>
                                        </div>

                                        {/* Terms */}
                                        <div className="border-t border-soft-gray pt-4 mb-4">
                                            <h4 className="font-semibold text-sm text-charcoal mb-2">Terms & Conditions:</h4>
                                            <ul className="space-y-1">
                                                {offer.terms.map((term, idx) => (
                                                    <li key={idx} className="text-xs text-charcoal/60 flex items-start">
                                                        <svg className="w-4 h-4 mr-1 text-gold flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                        {term}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Valid Until */}
                                        <div className="text-xs text-charcoal/50 mb-4 text-center">
                                            Valid until {new Date(offer.validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>

                                        {/* CTA */}
                                        <Link
                                            href="/book"
                                            className="block w-full bg-teal-deep hover:bg-teal-deep/90 text-white text-center px-6 py-3 rounded-lg font-semibold transition-luxury"
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
                <section className="py-16 px-4 bg-gray-50">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="font-serif text-3xl md:text-4xl text-teal-deep mb-4">
                            Never Miss an Offer
                        </h2>
                        <p className="text-lg text-charcoal/70 mb-8">
                            Subscribe to our newsletter and be the first to know about exclusive deals and promotions
                        </p>
                        <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 px-6 py-3 rounded-lg border border-soft-gray focus:outline-none focus:ring-2 focus:ring-teal-deep"
                            />
                            <button
                                type="submit"
                                className="bg-gold hover:bg-gold/90 text-off-black px-8 py-3 rounded-lg font-semibold transition-luxury shadow-gold whitespace-nowrap"
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>
                </section>

                {/* Contact CTA */}
                <section className="py-16 px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="font-serif text-3xl md:text-4xl text-teal-deep mb-4">
                            Need a Custom Package?
                        </h2>
                        <p className="text-lg text-charcoal/70 mb-8">
                            Our team can create a personalized package tailored to your specific needs
                        </p>
                        <Link
                            href="/contact"
                            className="inline-block bg-teal-deep hover:bg-teal-deep/90 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-luxury shadow-luxury"
                        >
                            Contact Us
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
            <StickyBookButton />
            <WhatsAppWidget />
        </>
    );
}
