
import StickyBookButton from '@/components/sticky-book-button';
import WhatsAppWidget from '@/components/whatsapp-widget';
import Link from 'next/link';
import NextImage from 'next/image';
import { Heart, Camera, Wine, Flower2, Music, Sparkles } from 'lucide-react';

const weddingFeatures = [
    {
        icon: Heart,
        title: 'Romantic Venues',
        description: 'Choose from our stunning indoor and outdoor venues with breathtaking backdrops for your ceremony and reception.',
    },
    {
        icon: Camera,
        title: 'Photography Locations',
        description: 'Picturesque spots throughout our property for capturing your most precious moments.',
    },
    {
        icon: Wine,
        title: 'Customized Catering',
        description: 'Our expert culinary team creates bespoke menus tailored to your preferences and dietary requirements.',
    },
    {
        icon: Flower2,
        title: 'Floral Arrangements',
        description: 'Beautiful floral designs by our partner florists to match your wedding theme and colors.',
    },
    {
        icon: Music,
        title: 'Entertainment',
        description: 'Live bands, DJs, and traditional performances to keep your guests entertained.',
    },
    {
        icon: Sparkles,
        title: 'Bridal Suite',
        description: 'Luxurious accommodation for the wedding couple with special amenities and services.',
    },
];

const weddingPackages = [
    {
        name: 'Intimate Affair',
        description: 'Perfect for small gatherings',
        guests: 'Up to 50 guests',
        price: 'Starting from ₹5,00,000',
        features: ['Venue decoration', '3-course dinner', 'Wedding cake', 'Bridal suite (1 night)', 'Basic photography'],
    },
    {
        name: 'Grand Celebration',
        description: 'Our most popular package',
        guests: 'Up to 200 guests',
        price: 'Starting from ₹15,00,000',
        features: ['Premium venue decoration', '5-course dinner', 'Designer wedding cake', 'Bridal suite (2 nights)', 'Professional photography', 'Live music', 'Pre-wedding events'],
        featured: true,
    },
    {
        name: 'Royal Wedding',
        description: 'The ultimate experience',
        guests: 'Up to 500 guests',
        price: 'Custom pricing',
        features: ['Luxury venue decoration', 'Gourmet dining experience', 'Custom wedding cake', 'Presidential suite (3 nights)', 'Cinematic photography & videography', 'Celebrity entertainment', 'Multiple events', 'Guest accommodations'],
    },
];

export default function WeddingPage() {
    return (
        <>

            <main className="min-h-screen bg-white">
                {/* Hero Section */}
                {/* Hero Section */}
                <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
                    {/* Background Image */}
                    <div className="absolute inset-0 z-0">
                        {/* Placeholder until image generation completes - utilizing the likely path or a fallback */}
                        <div className="absolute inset-0 bg-teal-900" />
                        {/* We will update this src once the image is generated */}
                        <NextImage
                            src="/images/dining/hero.jpg"
                            alt="Dream Wedding Destination"
                            fill
                            className="object-cover opacity-60"
                            priority
                        />
                        <div className="absolute inset-0 bg-black/40" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                    </div>

                    <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto">
                        <div className="mb-6 animate-fade-in-up">
                            <span className="inline-block py-1 px-3 border border-white/30 rounded-full bg-white/10 backdrop-blur-sm text-xs md:text-sm uppercase tracking-[0.3em] text-white/90">
                                Olivia International
                            </span>
                        </div>

                        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl mb-6 tracking-tight leading-tight text-white drop-shadow-lg">
                            Begin Your <span className="italic text-[#B8956A]">Forever</span>
                        </h1>

                        <p className="text-lg md:text-2xl text-white/90 max-w-2xl mx-auto mb-10 font-light leading-relaxed drop-shadow-md">
                            Celebrate your love story in the heart of Alappuzha, where timeless elegance meets the serene backwaters.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link
                                href="/contact?type=wedding"
                                className="group relative px-8 py-4 bg-[#B8956A] text-white font-medium tracking-wider uppercase text-sm transition-all hover:bg-[#a38258] overflow-hidden"
                            >
                                <span className="relative z-10">Inquire Now</span>
                            </Link>
                            <Link
                                href="#packages"
                                className="group px-8 py-4 border border-white text-white font-medium tracking-wider uppercase text-sm transition-all hover:bg-white hover:text-black"
                            >
                                View Packages
                            </Link>
                        </div>
                    </div>

                    {/* Scroll Indicator */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-white/50">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                    </div>
                </section>

                {/* Introduction */}
                <section className="py-20 px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="font-serif text-4xl md:text-5xl text-teal-deep mb-6">
                            Your Dream Wedding Awaits
                        </h2>
                        <div className="w-24 h-1 bg-gold mx-auto mb-8"></div>
                        <p className="text-lg text-charcoal/80 leading-relaxed">
                            At Olivia International Hotel, we believe your wedding day should be as unique as your love story.
                            Our dedicated wedding specialists work closely with you to create a celebration that reflects your
                            personality, style, and dreams. From intimate ceremonies to grand celebrations, we ensure every
                            detail is perfect.
                        </p>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-16 px-4 bg-gray-50">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="font-serif text-3xl md:text-4xl text-teal-deep mb-12 text-center">
                            Wedding Services
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {weddingFeatures.map((feature) => {
                                const Icon = feature.icon;
                                return (
                                    <div key={feature.title} className="bg-white p-8 rounded-lg shadow-luxury text-center">
                                        <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Icon className="w-8 h-8 text-gold" />
                                        </div>
                                        <h3 className="font-serif text-2xl text-teal-deep mb-3">{feature.title}</h3>
                                        <p className="text-charcoal/70">{feature.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Wedding Packages */}
                <section className="py-20 px-4">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="font-serif text-3xl md:text-4xl text-teal-deep mb-4 text-center">
                            Wedding Packages
                        </h2>
                        <p className="text-center text-charcoal/70 mb-12 max-w-2xl mx-auto">
                            Choose from our curated packages or let us create a custom experience for your special day
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {weddingPackages.map((pkg) => (
                                <div
                                    key={pkg.name}
                                    className={`rounded-lg overflow-hidden ${pkg.featured
                                        ? 'bg-gradient-to-b from-teal-800 to-teal-900 text-white shadow-xl scale-105'
                                        : 'bg-white shadow-luxury'
                                        }`}
                                >
                                    {pkg.featured && (
                                        <div className="bg-gold text-off-black text-center py-2 text-sm font-semibold">
                                            Most Popular
                                        </div>
                                    )}
                                    <div className="p-6">
                                        <h3 className={`font-serif text-2xl mb-2 ${pkg.featured ? 'text-white' : 'text-teal-deep'}`}>
                                            {pkg.name}
                                        </h3>
                                        <p className={`text-sm mb-4 ${pkg.featured ? 'text-white/80' : 'text-charcoal/60'}`}>
                                            {pkg.description}
                                        </p>
                                        <p className={`text-sm font-medium mb-2 ${pkg.featured ? 'text-gold' : 'text-gold'}`}>
                                            {pkg.guests}
                                        </p>
                                        <p className={`text-xl font-bold mb-6 ${pkg.featured ? 'text-white' : 'text-teal-deep'}`}>
                                            {pkg.price}
                                        </p>
                                        <ul className="space-y-3 mb-6">
                                            {pkg.features.map((feature) => (
                                                <li key={feature} className="flex items-center gap-2">
                                                    <svg className={`w-5 h-5 flex-shrink-0 ${pkg.featured ? 'text-gold' : 'text-gold'}`} fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className={`text-sm ${pkg.featured ? 'text-white/90' : 'text-charcoal/70'}`}>
                                                        {feature}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                        <Link
                                            href="/contact?type=wedding"
                                            className={`block w-full text-center py-3 rounded-lg font-semibold transition-all ${pkg.featured
                                                ? 'bg-gold hover:bg-gold/90 text-off-black'
                                                : 'bg-teal-deep hover:bg-teal-800 text-white'
                                                }`}
                                        >
                                            Inquire Now
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Venues */}
                <section className="py-16 px-4 bg-gray-50">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="font-serif text-3xl md:text-4xl text-teal-deep mb-12 text-center">
                            Wedding Venues
                        </h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white rounded-lg overflow-hidden shadow-luxury">
                                <div className="h-64 bg-gradient-luxury opacity-20 flex items-center justify-center">
                                    <span className="text-gray-400">Indoor Venue Image</span>
                                </div>
                                <div className="p-6">
                                    <h3 className="font-serif text-2xl text-teal-deep mb-2">Grand Ballroom</h3>
                                    <p className="text-charcoal/70 mb-4">
                                        Our elegant ballroom accommodates up to 500 guests with crystal chandeliers,
                                        customizable lighting, and state-of-the-art sound systems.
                                    </p>
                                    <p className="text-sm text-charcoal/60">Capacity: 500 guests | 8,000 sq ft</p>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg overflow-hidden shadow-luxury">
                                <div className="h-64 bg-gradient-luxury opacity-20 flex items-center justify-center">
                                    <span className="text-gray-400">Outdoor Venue Image</span>
                                </div>
                                <div className="p-6">
                                    <h3 className="font-serif text-2xl text-teal-deep mb-2">Garden Terrace</h3>
                                    <p className="text-charcoal/70 mb-4">
                                        A romantic outdoor setting with lush gardens, perfect for ceremonies
                                        and cocktail receptions under the stars.
                                    </p>
                                    <p className="text-sm text-charcoal/60">Capacity: 300 guests | 10,000 sq ft</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-16 px-4 bg-gradient-luxury">
                    <div className="max-w-4xl mx-auto text-center text-white">
                        <h2 className="font-serif text-3xl md:text-4xl mb-6">
                            Start Planning Your Special Day
                        </h2>
                        <p className="text-xl text-white/90 mb-8">
                            Our wedding specialists are ready to help you create the celebration of your dreams
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/contact?type=wedding"
                                className="bg-gold hover:bg-gold/90 text-off-black px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-lg"
                            >
                                Request Consultation
                            </Link>
                            <Link
                                href="/contact"
                                className="border-2 border-white text-white hover:bg-white hover:text-teal-deep px-8 py-4 rounded-lg font-semibold text-lg transition-all"
                            >
                                Contact Us
                            </Link>
                        </div>
                    </div>
                </section>
            </main>


            <StickyBookButton />
            <WhatsAppWidget />
        </>
    );
}
