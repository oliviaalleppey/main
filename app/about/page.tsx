import Navigation from '@/components/navigation';
import Footer from '@/components/footer';
import StickyBookButton from '@/components/sticky-book-button';
import WhatsAppWidget from '@/components/whatsapp-widget';
import Link from 'next/link';

export default function AboutPage() {
    return (
        <>
            <Navigation />
            <main className="min-h-screen bg-white">
                {/* Hero Section */}
                <section className="relative h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-luxury">
                    <div className="relative z-10 text-center text-white px-4">
                        <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl mb-4 tracking-tight">
                            About Olivia International
                        </h1>
                        <p className="text-xl md:text-2xl text-pearl-white/90 max-w-2xl mx-auto">
                            Where luxury meets Kerala's timeless beauty
                        </p>
                    </div>
                </section>

                {/* Brand Story */}
                <section className="py-20 px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="font-serif text-4xl md:text-5xl text-teal-deep mb-6">
                                Our Story
                            </h2>
                            <div className="w-24 h-1 bg-gold mx-auto mb-8"></div>
                        </div>

                        <div className="prose prose-lg max-w-none text-charcoal/80 leading-relaxed space-y-6">
                            <p>
                                Nestled in the heart of Alappuzha, Kerala's enchanting backwater paradise, Olivia International Hotel stands as a beacon of luxury and hospitality. Our journey began with a simple vision: to create a sanctuary where discerning travelers could experience the perfect blend of contemporary elegance and Kerala's rich cultural heritage.
                            </p>

                            <p>
                                Since our inception, we have been committed to redefining luxury hospitality in God's Own Country. Every corner of our hotel tells a story – from the carefully curated art pieces that adorn our walls to the thoughtfully designed spaces that invite relaxation and contemplation.
                            </p>

                            <p>
                                Our team of dedicated professionals works tirelessly to ensure that every guest's stay is nothing short of extraordinary. We believe that true luxury lies not just in opulent surroundings, but in the warmth of genuine hospitality and attention to the smallest details.
                            </p>

                            <p>
                                At Olivia International, we are more than just a hotel – we are custodians of unforgettable experiences, creating memories that our guests cherish long after they've departed our shores.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Values */}
                <section className="py-16 px-4 bg-gray-50">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="font-serif text-3xl md:text-4xl text-teal-deep mb-12 text-center">
                            Our Values
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-white rounded-lg p-8 text-center shadow-luxury">
                                <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                </div>
                                <h3 className="font-serif text-2xl text-teal-deep mb-3">Excellence</h3>
                                <p className="text-charcoal/70">
                                    We strive for perfection in every aspect of our service, from the quality of our amenities to the warmth of our hospitality.
                                </p>
                            </div>

                            <div className="bg-white rounded-lg p-8 text-center shadow-luxury">
                                <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                <h3 className="font-serif text-2xl text-teal-deep mb-3">Authenticity</h3>
                                <p className="text-charcoal/70">
                                    We celebrate Kerala's rich heritage while embracing modern luxury, creating experiences that are both genuine and extraordinary.
                                </p>
                            </div>

                            <div className="bg-white rounded-lg p-8 text-center shadow-luxury">
                                <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <h3 className="font-serif text-2xl text-teal-deep mb-3">Community</h3>
                                <p className="text-charcoal/70">
                                    We are committed to supporting our local community and preserving the natural beauty that surrounds us.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Location */}
                <section className="py-20 px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="font-serif text-4xl md:text-5xl text-teal-deep mb-6">
                                    Our Location
                                </h2>
                                <p className="text-lg text-charcoal/80 mb-6 leading-relaxed">
                                    Situated in the picturesque town of Alappuzha, often called the "Venice of the East," our hotel offers easy access to Kerala's famous backwaters, pristine beaches, and rich cultural attractions.
                                </p>
                                <p className="text-lg text-charcoal/80 mb-8 leading-relaxed">
                                    Whether you're here for business or leisure, our strategic location ensures you're never far from the experiences that make Kerala truly special.
                                </p>
                                <Link
                                    href="/contact"
                                    className="inline-block bg-teal-deep hover:bg-teal-deep/90 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-luxury shadow-luxury"
                                >
                                    Get Directions
                                </Link>
                            </div>

                            <div className="bg-gray-50 rounded-lg h-96 flex items-center justify-center">
                                <div className="text-center text-charcoal/50">
                                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <p className="text-lg">Map Integration</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-16 px-4 bg-gradient-luxury">
                    <div className="max-w-4xl mx-auto text-center text-white">
                        <h2 className="font-serif text-3xl md:text-4xl mb-6">
                            Experience Olivia International
                        </h2>
                        <p className="text-xl text-pearl-white/90 mb-8">
                            Book your stay and discover why we're Alappuzha's premier luxury destination
                        </p>
                        <Link
                            href="/book"
                            className="inline-block bg-gold hover:bg-gold/90 text-off-black px-8 py-4 rounded-lg font-semibold text-lg transition-luxury shadow-gold"
                        >
                            Book Your Stay
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
