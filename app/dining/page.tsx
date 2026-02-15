import Navigation from '@/components/navigation';
import Footer from '@/components/footer';
import StickyBookButton from '@/components/sticky-book-button';
import WhatsAppWidget from '@/components/whatsapp-widget';

const diningOptions = [
    {
        name: 'The Grand Restaurant',
        type: 'Fine Dining',
        description: 'Experience culinary excellence at our signature fine dining restaurant. Our master chefs craft exquisite dishes using the finest local and international ingredients, creating a symphony of flavors that will delight your palate.',
        cuisine: 'Multi-Cuisine',
        timings: 'Breakfast: 7:00 AM - 10:30 AM | Lunch: 12:30 PM - 3:00 PM | Dinner: 7:00 PM - 11:00 PM',
        highlights: [
            'Award-winning chefs',
            'Live cooking stations',
            'Extensive wine collection',
            'Private dining rooms available',
        ],
    },
    {
        name: 'Café Olivia',
        type: 'Coffee Shop',
        description: 'A cozy retreat for coffee lovers and casual diners. Enjoy freshly brewed specialty coffees, artisanal pastries, and light meals in a relaxed, contemporary setting. Perfect for business meetings or leisurely afternoons.',
        cuisine: 'Café & Bakery',
        timings: 'Open Daily: 6:00 AM - 11:00 PM',
        highlights: [
            'Specialty coffee & teas',
            'Fresh-baked pastries',
            'Healthy breakfast options',
            'Free Wi-Fi',
        ],
    },
    {
        name: 'The Lounge Bar',
        type: 'Bar & Lounge',
        description: 'Unwind in sophisticated style at our elegant lounge bar. Featuring an extensive selection of premium spirits, signature cocktails, and fine wines, accompanied by live music on select evenings.',
        cuisine: 'Cocktails & Appetizers',
        timings: 'Open Daily: 5:00 PM - 1:00 AM',
        highlights: [
            'Signature cocktails',
            'Premium spirits collection',
            'Live music (weekends)',
            'Outdoor seating available',
        ],
    },
];

export default function DiningPage() {
    return (
        <>
            <Navigation />
            <main className="min-h-screen">
                {/* Hero Section */}
                <section className="relative h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-luxury">
                    <div className="relative z-10 text-center text-white px-4">
                        <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl mb-4 tracking-tight">
                            Dining Experiences
                        </h1>
                        <p className="text-xl md:text-2xl text-pearl-white/90 max-w-2xl mx-auto">
                            A culinary journey through flavors and traditions
                        </p>
                    </div>
                </section>

                {/* Dining Options */}
                <section className="py-20 px-4 bg-white">
                    <div className="max-w-7xl mx-auto space-y-16">
                        {diningOptions.map((option, index) => (
                            <div
                                key={option.name}
                                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                                    }`}
                            >
                                {/* Image */}
                                <div className={`${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                                    <div className="relative h-96 bg-gray-50 rounded-lg overflow-hidden shadow-luxury">
                                        <div className="absolute inset-0 bg-gradient-luxury opacity-20" />
                                        <div className="absolute inset-0 flex items-center justify-center text-white/50">
                                            <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className={`${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                                    <div className="inline-block bg-gold/10 text-gold px-4 py-1 rounded-full text-sm font-semibold mb-4">
                                        {option.type}
                                    </div>
                                    <h2 className="font-serif text-4xl md:text-5xl text-teal-deep mb-4">
                                        {option.name}
                                    </h2>
                                    <p className="text-lg text-charcoal/80 mb-6 leading-relaxed">
                                        {option.description}
                                    </p>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-start">
                                            <svg className="w-5 h-5 text-gold mr-3 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <div>
                                                <div className="font-semibold text-charcoal">Cuisine</div>
                                                <div className="text-charcoal/70">{option.cuisine}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <svg className="w-5 h-5 text-gold mr-3 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                            </svg>
                                            <div>
                                                <div className="font-semibold text-charcoal">Timings</div>
                                                <div className="text-charcoal/70 text-sm">{option.timings}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <div className="font-semibold text-charcoal mb-3">Highlights</div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {option.highlights.map((highlight, idx) => (
                                                <div key={idx} className="flex items-center text-sm text-charcoal/70">
                                                    <svg className="w-4 h-4 text-gold mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    {highlight}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <a
                                        href="/contact"
                                        className="inline-block bg-teal-deep hover:bg-teal-deep/90 text-white px-8 py-3 rounded-lg font-semibold transition-luxury"
                                    >
                                        Make a Reservation
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-16 px-4 bg-gray-50">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="font-serif text-3xl md:text-4xl text-teal-deep mb-4">
                            Book Your Culinary Experience
                        </h2>
                        <p className="text-lg text-charcoal/70 mb-8">
                            Reserve your table or inquire about private dining experiences
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="/contact"
                                className="bg-gold hover:bg-gold/90 text-off-black px-8 py-4 rounded-lg font-semibold text-lg transition-luxury shadow-gold"
                            >
                                Contact Us
                            </a>
                            <a
                                href="/book"
                                className="border-2 border-teal-deep text-teal-deep hover:bg-teal-deep hover:text-white px-8 py-4 rounded-lg font-semibold text-lg transition-luxury"
                            >
                                Book Your Stay
                            </a>
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
