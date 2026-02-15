import Navigation from '@/components/navigation';
import Footer from '@/components/footer';
import StickyBookButton from '@/components/sticky-book-button';
import WhatsAppWidget from '@/components/whatsapp-widget';

const experiences = [
    {
        id: 'pool',
        name: 'Swimming Pool',
        description: 'Dive into luxury at our stunning swimming pool. Whether you prefer a refreshing morning swim or a relaxing evening dip, our temperature-controlled pool offers the perfect escape. Surrounded by lush landscaping and comfortable loungers.',
        features: [
            'Temperature-controlled water',
            'Separate kids pool',
            'Poolside bar service',
            'Comfortable sun loungers',
            'Towel service',
            'Changing rooms & showers',
        ],
        timings: '6:00 AM - 9:00 PM',
    },
    {
        id: 'gym',
        name: 'Fitness Center',
        description: 'Maintain your fitness routine in our state-of-the-art gym. Equipped with the latest cardio and strength training equipment, our fitness center caters to all your workout needs. Personal training sessions available upon request.',
        features: [
            'Latest cardio equipment',
            'Free weights & machines',
            'Personal training available',
            'Yoga mats & accessories',
            'Complimentary water & towels',
            'Air-conditioned space',
        ],
        timings: '24/7 Access',
    },
    {
        id: 'spa',
        name: 'Luxury Spa & Wellness',
        description: 'Rejuvenate your mind, body, and soul at our luxury spa. Our expert therapists offer a range of traditional and contemporary treatments designed to relax, refresh, and revitalize. Experience true tranquility in our serene spa environment.',
        features: [
            'Ayurvedic treatments',
            'Aromatherapy massages',
            'Body scrubs & wraps',
            'Facial treatments',
            'Couples spa packages',
            'Steam & sauna facilities',
        ],
        timings: '10:00 AM - 9:00 PM',
    },
    {
        id: 'concierge',
        name: '24/7 Concierge Services',
        description: 'Our dedicated concierge team is available round-the-clock to ensure your stay is seamless and memorable. From arranging local tours to making restaurant reservations, we\'re here to assist with all your needs.',
        features: [
            'Tour & activity bookings',
            'Restaurant reservations',
            'Transportation arrangements',
            'Local recommendations',
            'Special occasion planning',
            'Business services',
        ],
        timings: 'Available 24/7',
    },
];

export default function ExperiencesPage() {
    return (
        <>
            <Navigation />
            <main className="min-h-screen">
                {/* Hero Section */}
                <section className="relative h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-luxury">
                    <div className="relative z-10 text-center text-white px-4">
                        <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl mb-4 tracking-tight">
                            Experiences & Amenities
                        </h1>
                        <p className="text-xl md:text-2xl text-pearl-white/90 max-w-2xl mx-auto">
                            Indulge in world-class facilities and services
                        </p>
                    </div>
                </section>

                {/* Experiences Grid */}
                <section className="py-20 px-4 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {experiences.map((experience, index) => (
                                <div
                                    key={experience.id}
                                    id={experience.id}
                                    className="bg-white rounded-lg overflow-hidden shadow-luxury hover:shadow-gold transition-luxury animate-fade-in"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    {/* Image Placeholder */}
                                    <div className="relative h-64 bg-gray-50 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-luxury opacity-20" />
                                        <div className="absolute inset-0 flex items-center justify-center text-white/50">
                                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        <h3 className="font-serif text-3xl text-teal-deep mb-3">
                                            {experience.name}
                                        </h3>
                                        <p className="text-charcoal/80 mb-4 leading-relaxed">
                                            {experience.description}
                                        </p>

                                        {/* Timings */}
                                        <div className="flex items-center text-sm text-gold mb-4">
                                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                            </svg>
                                            {experience.timings}
                                        </div>

                                        {/* Features */}
                                        <div className="space-y-2">
                                            {experience.features.map((feature, idx) => (
                                                <div key={idx} className="flex items-center text-sm text-charcoal/70">
                                                    <svg className="w-4 h-4 text-gold mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    {feature}
                                                </div>
                                            ))}
                                        </div>

                                        {experience.id === 'spa' && (
                                            <div className="mt-6">
                                                <a
                                                    href="/contact"
                                                    className="inline-block bg-teal-deep hover:bg-teal-deep/90 text-white px-6 py-3 rounded-lg font-semibold transition-luxury"
                                                >
                                                    Book Spa Treatment
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-16 px-4 bg-gray-50">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="font-serif text-3xl md:text-4xl text-teal-deep mb-4">
                            Experience Luxury at Olivia International
                        </h2>
                        <p className="text-lg text-charcoal/70 mb-8">
                            Book your stay and enjoy access to all our premium amenities
                        </p>
                        <a
                            href="/book"
                            className="inline-block bg-gold hover:bg-gold/90 text-off-black px-8 py-4 rounded-lg font-semibold text-lg transition-luxury shadow-gold"
                        >
                            Book Your Stay
                        </a>
                    </div>
                </section>
            </main>

            <Footer />
            <StickyBookButton />
            <WhatsAppWidget />
        </>
    );
}
