'use client';


import Link from 'next/link';

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-[#FBFBF9] font-sans">


            {/* Hero Section */}
            <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0A4D4E]/30 to-[#0A4D4E]/70" />
                <div className="absolute inset-0 bg-[url('/images/about/hero.jpg')] bg-cover bg-center" />
                <div className="relative z-10 text-center px-6">
                    <p className="text-[#C9A961] text-sm tracking-[0.3em] uppercase mb-4">Our Story</p>
                    <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 tracking-wide">
                        About Olivia
                    </h1>
                    <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto font-light">
                        Where luxury meets Kerala's timeless beauty
                    </p>
                </div>
            </section>

            {/* Brand Story */}
            <section className="py-24 px-6 md:px-12">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-serif text-[#1C1C1C] mb-8 tracking-wide">
                            Our Story
                        </h2>
                        <div className="w-16 h-[1px] bg-[#C9A961] mx-auto mb-8" />
                    </div>

                    <div className="space-y-6 text-[#1C1C1C]/70 text-lg leading-relaxed">
                        <p>
                            Nestled in the heart of Alappuzha, Kerala's enchanting backwater paradise,
                            Olivia International Hotel stands as a beacon of luxury and hospitality. Our
                            journey began with a simple vision: to create a sanctuary where discerning
                            travelers could experience the perfect blend of contemporary elegance and
                            Kerala's rich cultural heritage.
                        </p>

                        <p>
                            Since our inception, we have been committed to redefining luxury hospitality
                            in God's Own Country. Every corner of our hotel tells a story – from the
                            carefully curated art pieces that adorn our walls to the thoughtfully designed
                            spaces that invite relaxation and contemplation.
                        </p>

                        <p>
                            Our team of dedicated professionals works tirelessly to ensure that every
                            guest's stay is nothing short of extraordinary. We believe that true luxury
                            lies not just in opulent surroundings, but in the warmth of genuine hospitality
                            and attention to the smallest details.
                        </p>

                        <p>
                            At Olivia International, we are more than just a hotel – we are custodians of
                            unforgettable experiences, creating memories that our guests cherish long after
                            they've departed our shores.
                        </p>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-24 px-6 md:px-12 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-[#C9A961] text-sm tracking-[0.3em] uppercase mb-4">What Drives Us</p>
                        <h2 className="text-4xl md:text-5xl font-serif text-[#1C1C1C] tracking-wide">Our Values</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center p-8 border border-gray-100 hover:border-[#C9A961] transition-colors">
                            <div className="w-16 h-16 bg-[#C9A961]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-[#C9A961]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-serif text-[#1C1C1C] mb-4">Excellence</h3>
                            <p className="text-[#1C1C1C]/60 leading-relaxed">
                                We strive for perfection in every aspect of our service, from the quality
                                of our amenities to the warmth of our hospitality.
                            </p>
                        </div>

                        <div className="text-center p-8 border border-gray-100 hover:border-[#C9A961] transition-colors">
                            <div className="w-16 h-16 bg-[#C9A961]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-[#C9A961]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-serif text-[#1C1C1C] mb-4">Authenticity</h3>
                            <p className="text-[#1C1C1C]/60 leading-relaxed">
                                We celebrate Kerala's rich heritage while embracing modern luxury,
                                creating experiences that are both genuine and extraordinary.
                            </p>
                        </div>

                        <div className="text-center p-8 border border-gray-100 hover:border-[#C9A961] transition-colors">
                            <div className="w-16 h-16 bg-[#C9A961]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-[#C9A961]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-serif text-[#1C1C1C] mb-4">Community</h3>
                            <p className="text-[#1C1C1C]/60 leading-relaxed">
                                We are committed to supporting our local community and preserving the
                                natural beauty that surrounds us.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Location */}
            <section className="py-24 px-6 md:px-12 bg-[#F5F5F0]">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <p className="text-[#C9A961] text-sm tracking-[0.3em] uppercase mb-4">Alappuzha, Kerala</p>
                            <h2 className="text-4xl font-serif text-[#1C1C1C] mb-8 tracking-wide">
                                Our Location
                            </h2>
                            <p className="text-[#1C1C1C]/70 text-lg leading-relaxed mb-6">
                                Situated in the picturesque town of Alappuzha, often called the "Venice of
                                the East," our hotel offers easy access to Kerala's famous backwaters, pristine
                                beaches, and rich cultural attractions.
                            </p>
                            <p className="text-[#1C1C1C]/70 text-lg leading-relaxed mb-8">
                                Whether you're here for business or leisure, our strategic location ensures
                                you're never far from the experiences that make Kerala truly special.
                            </p>
                            <Link
                                href="/contact"
                                className="inline-block bg-[#0A4D4E] text-white px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-[#15443B] transition-colors"
                            >
                                Get Directions
                            </Link>
                        </div>

                        <div className="relative h-[400px] bg-white">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center text-[#1C1C1C]/30">
                                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <p>Map Integration</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6 md:px-12 bg-[#0A4D4E]">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-6 tracking-wide">
                        Experience Olivia International
                    </h2>
                    <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
                        Book your stay and discover why we're Alappuzha's premier luxury destination
                    </p>
                    <Link
                        href="#booking-search"
                        className="inline-block bg-white text-[#0A4D4E] px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-[#C9A961] hover:text-white transition-colors"
                    >
                        Book Your Stay
                    </Link>
                </div>
            </section>


        </main>
    );
}
