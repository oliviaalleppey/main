'use client';


import Link from 'next/link';

const experiences = [
    {
        id: 'backwaters',
        name: 'Backwater Cruises',
        description: 'Explore the enchanting network of Kerala\'s backwaters on our private houseboat. Witness the serene beauty of palm-fringed canals, traditional villages, and exotic birdlife as you glide through these ancient waterways.',
        features: [
            'Private houseboat tours',
            'Sunset cruises',
            'Traditional Kerala lunch on board',
            'Bird watching opportunities',
            'Village visits',
            'Overnight cruise options',
        ],
        timings: '6:00 AM - 8:00 PM',
        icon: '🚤',
    },
    {
        id: 'ayurveda',
        name: 'Ayurvedic Wellness',
        description: 'Experience authentic Ayurvedic treatments passed down through generations. Our expert practitioners create personalized wellness programs using traditional herbs, oils, and techniques.',
        features: [
            'Ayurvedic consultations',
            'Abhyanga massage',
            'Shirodhara therapy',
            'Panchakarma programs',
            'Herbal baths',
            'Yoga & meditation',
        ],
        timings: '9:00 AM - 9:00 PM',
        icon: '🌿',
    },
    {
        id: 'cultural',
        name: 'Cultural Experiences',
        description: 'Immerse yourself in Kerala\'s rich cultural heritage through traditional performances, art forms, and craft workshops. Experience the vibrant traditions that make this region unique.',
        features: [
            'Kathakali performances',
            'Kalaripayattu demonstrations',
            'Cooking classes',
            'Kerala art workshops',
            'Temple visits',
            'Local market tours',
        ],
        timings: 'Varies by activity',
        icon: '🎭',
    },
    {
        id: 'adventure',
        name: 'Adventure Activities',
        description: 'For those seeking excitement, we offer a range of adventure activities that showcase Kerala\'s natural beauty while getting your adrenaline pumping.',
        features: [
            'Kayaking expeditions',
            'Cycling tours',
            'Nature treks',
            'Fishing experiences',
            'Bamboo rafting',
            'Wildlife safaris',
        ],
        timings: 'Early morning & late afternoon',
        icon: '🏔️',
    },
    {
        id: 'culinary',
        name: 'Culinary Journeys',
        description: 'Discover the flavors of Kerala through curated culinary experiences. From spice plantation visits to cooking masterclasses, explore the rich gastronomic heritage of the region.',
        features: [
            'Spice plantation tours',
            'Cooking masterclasses',
            'Farm-to-table experiences',
            'Seafood adventures',
            'Traditional feast (Sadya)',
            'Wine & dine evenings',
        ],
        timings: 'By reservation',
        icon: '🍽️',
    },
    {
        id: 'concierge',
        name: 'Concierge Services',
        description: 'Our dedicated concierge team is available around the clock to curate personalized experiences and ensure every moment of your stay is memorable.',
        features: [
            'Custom itinerary planning',
            'Restaurant reservations',
            'Transportation arrangements',
            'Special occasion planning',
            'Business services',
            '24/7 assistance',
        ],
        timings: 'Available 24/7',
        icon: '🎩',
    },
];

export default function ExperiencesPage() {
    return (
        <main className="min-h-screen bg-[#FBFBF9] font-sans">

            {/* Hero Section */}
            <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0A4D4E]/30 to-[#0A4D4E]/70" />
                <div className="absolute inset-0 bg-[url('/images/experiences/hero.jpg')] bg-cover bg-center" />
                <div className="relative z-10 text-center px-6">
                    <p className="text-[#C9A961] text-sm tracking-[0.3em] uppercase mb-4">Discover Kerala</p>
                    <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 tracking-wide">Experiences</h1>
                    <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto font-light">
                        Curated journeys through Kerala's rich culture, nature, and traditions
                    </p>
                </div>
            </section>

            {/* Introduction */}
            <section className="py-24 px-6 md:px-12">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-serif text-[#1C1C1C] mb-8 tracking-wide">
                        Unforgettable Moments Await
                    </h2>
                    <p className="text-[#1C1C1C]/70 text-lg leading-relaxed">
                        At Olivia International, we believe that true luxury lies in experiences that touch
                        the soul. Our curated collection of activities and excursions showcases the very best
                        of Kerala—from tranquil backwater cruises to vibrant cultural performances. Each
                        experience is designed to create lasting memories and deeper connections with this
                        enchanting land.
                    </p>
                </div>
            </section>

            {/* Experiences Grid */}
            <section className="pb-24 px-6 md:px-12">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {experiences.map((experience) => (
                            <div
                                key={experience.id}
                                id={experience.id}
                                className="bg-white border border-gray-100 hover:border-[#C9A961] transition-colors group"
                            >
                                {/* Icon Header */}
                                <div className="p-8 pb-0">
                                    <div className="text-4xl mb-4">{experience.icon}</div>
                                    <h3 className="text-xl font-serif text-[#1C1C1C] mb-3 tracking-wide">
                                        {experience.name}
                                    </h3>
                                    <p className="text-[#1C1C1C]/60 text-sm leading-relaxed mb-6">
                                        {experience.description}
                                    </p>
                                </div>

                                {/* Features */}
                                <div className="px-8 pb-8">
                                    <div className="grid grid-cols-2 gap-2 mb-6">
                                        {experience.features.map((feature, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-xs text-[#1C1C1C]/60">
                                                <div className="w-1 h-1 bg-[#C9A961] rounded-full" />
                                                {feature}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Timings */}
                                    <div className="flex items-center gap-2 text-xs text-[#C9A961] mb-6">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                        {experience.timings}
                                    </div>

                                    <Link
                                        href="/contact"
                                        className="inline-block text-[#0A4D4E] text-sm uppercase tracking-wider hover:text-[#C9A961] transition-colors"
                                    >
                                        Inquire Now →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Experience */}
            <section className="py-24 px-6 md:px-12 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="relative h-[500px] bg-gray-100">
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A4D4E]/20 to-transparent" />
                            <div className="w-full h-full flex items-center justify-center">
                                <p className="text-[#1C1C1C]/30 text-sm">Image: Houseboat Cruise</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-[#C9A961] text-sm tracking-[0.3em] uppercase mb-4">Signature Experience</p>
                            <h2 className="text-4xl font-serif text-[#1C1C1C] mb-8 tracking-wide">
                                Private Houseboat Cruise
                            </h2>
                            <p className="text-[#1C1C1C]/70 text-lg leading-relaxed mb-8">
                                Our signature experience takes you on a journey through Kerala's legendary
                                backwaters aboard a traditional houseboat. Enjoy a private chef-prepared meal,
                                watch the sunset paint the waters gold, and experience the timeless beauty of
                                village life along the canals.
                            </p>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-3 text-[#1C1C1C]/70">
                                    <svg className="w-5 h-5 text-[#C9A961]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Private 4-hour or full-day cruises
                                </li>
                                <li className="flex items-center gap-3 text-[#1C1C1C]/70">
                                    <svg className="w-5 h-5 text-[#C9A961]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Traditional Kerala cuisine on board
                                </li>
                                <li className="flex items-center gap-3 text-[#1C1C1C]/70">
                                    <svg className="w-5 h-5 text-[#C9A961]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Expert local guide
                                </li>
                                <li className="flex items-center gap-3 text-[#1C1C1C]/70">
                                    <svg className="w-5 h-5 text-[#C9A961]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Complimentary refreshments
                                </li>
                            </ul>
                            <Link
                                href="/contact"
                                className="inline-block bg-[#0A4D4E] text-white px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-[#15443B] transition-colors"
                            >
                                Reserve Your Cruise
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6 md:px-12 bg-[#0A4D4E]">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-6 tracking-wide">
                        Create Your Perfect Kerala Journey
                    </h2>
                    <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
                        Our concierge team can help you plan and book all your experiences during your stay.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/contact"
                            className="bg-white text-[#0A4D4E] px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-[#C9A961] hover:text-white transition-colors"
                        >
                            Contact Concierge
                        </Link>
                        <Link
                            href="#booking-search"
                            className="border border-white text-white px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-white hover:text-[#0A4D4E] transition-colors"
                        >
                            Book Your Stay
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
