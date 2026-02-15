import Navigation from '@/components/navigation';
import Footer from '@/components/footer';
import StickyBookButton from '@/components/sticky-book-button';
import WhatsAppWidget from '@/components/whatsapp-widget';
import Link from 'next/link';
import { formatCurrency } from '@/lib/services/payment';

// Mock data - will be replaced with database query
const roomTypes = [
    {
        id: '1',
        name: 'Balcony Room',
        slug: 'balcony-room',
        shortDescription: 'Entry-level luxury with private balcony and stunning views',
        basePrice: 1500000, // ₹15,000 in paise
        maxGuests: 2,
        size: 325,
        bedType: 'King or Queen Bed',
        featuredImage: '/images/rooms/balcony-room.jpg',
    },
    {
        id: '2',
        name: 'Deluxe Room',
        slug: 'deluxe-room',
        shortDescription: 'Enhanced amenities with spacious layout and premium bedding',
        basePrice: 2000000, // ₹20,000 in paise
        maxGuests: 3,
        size: 425,
        bedType: 'King Bed',
        featuredImage: '/images/rooms/deluxe-room.jpg',
    },
    {
        id: '3',
        name: 'Superior Deluxe Room',
        slug: 'superior-deluxe-room',
        shortDescription: 'Premium category with upgraded furnishings and sitting area',
        basePrice: 2500000, // ₹25,000 in paise
        maxGuests: 3,
        size: 525,
        bedType: 'King Bed',
        featuredImage: '/images/rooms/superior-deluxe-room.jpg',
    },
    {
        id: '4',
        name: 'Suite Room',
        slug: 'suite-room',
        shortDescription: 'Ultimate luxury with separate living area and premium amenities',
        basePrice: 3500000, // ₹35,000 in paise
        maxGuests: 4,
        size: 750,
        bedType: 'King Bed + Sofa Bed',
        featuredImage: '/images/rooms/suite-room.jpg',
    },
];

export default function RoomsPage() {
    return (
        <>
            <Navigation />
            <main className="min-h-screen">
                {/* Hero Section */}
                <section className="relative h-[50vh] flex items-center justify-center overflow-hidden bg-gradient-luxury">
                    <div className="relative z-10 text-center text-white px-4">
                        <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl mb-4 tracking-tight">
                            Rooms & Suites
                        </h1>
                        <p className="text-xl md:text-2xl text-pearl-white/90 max-w-2xl mx-auto">
                            Discover your perfect sanctuary
                        </p>
                    </div>
                </section>

                {/* Rooms Grid */}
                <section className="py-20 px-4 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {roomTypes.map((room, index) => (
                                <div
                                    key={room.id}
                                    className="group bg-white rounded-lg overflow-hidden shadow-luxury hover:shadow-gold transition-luxury animate-fade-in"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    {/* Image */}
                                    <div className="relative h-64 bg-gray-50 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-luxury opacity-20 group-hover:opacity-10 transition-luxury" />
                                        <div className="absolute inset-0 flex items-center justify-center text-white/50">
                                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        <h3 className="font-serif text-2xl md:text-3xl text-teal-deep mb-2">
                                            {room.name}
                                        </h3>
                                        <p className="text-charcoal/70 mb-4">
                                            {room.shortDescription}
                                        </p>

                                        {/* Details */}
                                        <div className="flex flex-wrap gap-4 mb-4 text-sm text-charcoal/60">
                                            <div className="flex items-center">
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                {room.maxGuests} Guests
                                            </div>
                                            <div className="flex items-center">
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                                </svg>
                                                {room.size} sq ft
                                            </div>
                                            <div className="flex items-center">
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                </svg>
                                                {room.bedType}
                                            </div>
                                        </div>

                                        {/* Price & CTA */}
                                        <div className="flex items-center justify-between pt-4 border-t border-soft-gray">
                                            <div>
                                                <div className="text-sm text-charcoal/60">Starting from</div>
                                                <div className="text-2xl font-bold text-gold">
                                                    {formatCurrency(room.basePrice)}
                                                    <span className="text-sm text-charcoal/60 font-normal">/night</span>
                                                </div>
                                            </div>
                                            <Link
                                                href={`/rooms/${room.slug}`}
                                                className="bg-teal-deep hover:bg-teal-deep/90 text-white px-6 py-3 rounded-lg font-semibold transition-luxury"
                                            >
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* CTA Section */}
                        <div className="mt-16 text-center bg-gray-50 rounded-lg p-12">
                            <h2 className="font-serif text-3xl md:text-4xl text-teal-deep mb-4">
                                Ready to Book Your Stay?
                            </h2>
                            <p className="text-lg text-charcoal/70 mb-6 max-w-2xl mx-auto">
                                Experience luxury and comfort at Olivia International Hotel. Book directly for the best rates and exclusive offers.
                            </p>
                            <Link
                                href="/book"
                                className="inline-block bg-gold hover:bg-gold/90 text-off-black px-8 py-4 rounded-lg font-semibold text-lg transition-luxury shadow-gold"
                            >
                                Book Now
                            </Link>
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
