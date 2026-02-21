'use client';

import Link from 'next/link';

const comingSoonProducts = [
    {
        name: 'Olivia Signature Candle',
        description: 'Hand-poured soy candle with our signature backwaters scent',
        price: '₹2,500',
        category: 'Home Fragrance',
    },
    {
        name: 'Ayurvedic Wellness Kit',
        description: 'Curated selection of traditional Kerala wellness essentials',
        price: '₹5,000',
        category: 'Wellness',
    },
    {
        name: 'Kerala Spice Collection',
        description: 'Organic spices sourced directly from local farmers',
        price: '₹1,800',
        category: 'Culinary',
    },
    {
        name: 'Olivia Robe',
        description: 'Luxurious cotton robe as seen in our suites',
        price: '₹8,500',
        category: 'Apparel',
    },
    {
        name: 'Artisan Tea Set',
        description: 'Handcrafted ceramic tea set by local artisans',
        price: '₹4,200',
        category: 'Home',
    },
    {
        name: 'Gift Card',
        description: 'Give the gift of luxury with an Olivia gift card',
        price: 'From ₹5,000',
        category: 'Gifts',
    },
];

export default function ShopPage() {
    return (
        <main className="min-h-screen bg-[#FBFBF9] font-sans">

            {/* Hero Section */}
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0A4D4E]/30 to-[#0A4D4E]/70" />
                <div className="absolute inset-0 bg-[url('/images/shop/hero.jpg')] bg-cover bg-center" />
                <div className="relative z-10 text-center px-6">
                    <p className="text-[#C9A961] text-sm tracking-[0.3em] uppercase mb-4">Curated Collection</p>
                    <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 tracking-wide">The Olivia Shop</h1>
                    <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto font-light">
                        Bring the Olivia experience home with our exclusive collection
                    </p>
                </div>
            </section>

            {/* Coming Soon Banner */}
            <section className="py-16 px-6 md:px-12 bg-[#C9A961]">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-2xl md:text-3xl font-serif text-white mb-4 tracking-wide">
                        Coming Soon
                    </h2>
                    <p className="text-white/90 text-lg">
                        Our online boutique is currently being curated. Sign up to be the first to know when we launch.
                    </p>
                </div>
            </section>

            {/* Preview Products */}
            <section className="py-24 px-6 md:px-12">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-[#C9A961] text-sm tracking-[0.3em] uppercase mb-4">Preview</p>
                        <h2 className="text-4xl md:text-5xl font-serif text-[#1C1C1C] tracking-wide">
                            What's In Store
                        </h2>
                        <p className="text-[#1C1C1C]/60 mt-4 max-w-2xl mx-auto">
                            A sneak peek at the carefully curated products that will be available in our online boutique.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {comingSoonProducts.map((product, idx) => (
                            <div key={idx} className="group">
                                <div className="relative h-80 bg-[#F5F5F0] mb-6 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A4D4E]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-full h-full flex items-center justify-center">
                                        <p className="text-[#1C1C1C]/20 text-sm">Product Image</p>
                                    </div>
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-[#C9A961] text-white text-xs uppercase tracking-wider px-3 py-1">
                                            {product.category}
                                        </span>
                                    </div>
                                </div>
                                <h3 className="text-xl font-serif text-[#1C1C1C] mb-2">{product.name}</h3>
                                <p className="text-[#1C1C1C]/60 text-sm mb-3">{product.description}</p>
                                <p className="text-[#0A4D4E] font-medium">{product.price}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Newsletter Signup */}
            <section className="py-24 px-6 md:px-12 bg-white">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-serif text-[#1C1C1C] mb-6 tracking-wide">
                        Be the First to Know
                    </h2>
                    <p className="text-[#1C1C1C]/70 mb-8">
                        Subscribe to receive updates on our shop launch, exclusive pre-order opportunities, and special offers.
                    </p>
                    <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 px-6 py-4 border border-gray-300 focus:border-[#C9A961] outline-none text-sm"
                        />
                        <button
                            type="submit"
                            className="bg-[#0A4D4E] text-white px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-[#15443B] transition-colors whitespace-nowrap"
                        >
                            Notify Me
                        </button>
                    </form>
                    <p className="text-xs text-[#1C1C1C]/50 mt-4">
                        By subscribing, you agree to receive marketing communications from Olivia International.
                    </p>
                </div>
            </section>

            {/* Gift Cards Section */}
            <section className="py-24 px-6 md:px-12 bg-[#F5F5F0]">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <p className="text-[#C9A961] text-sm tracking-[0.3em] uppercase mb-4">Available Now</p>
                            <h2 className="text-4xl md:text-5xl font-serif text-[#1C1C1C] mb-8 tracking-wide">
                                Olivia Gift Cards
                            </h2>
                            <p className="text-[#1C1C1C]/70 text-lg leading-relaxed mb-6">
                                Give the gift of unforgettable experiences. Our gift cards can be used for stays,
                                dining, spa treatments, and more at Olivia International.
                            </p>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-3 text-[#1C1C1C]/70">
                                    <svg className="w-5 h-5 text-[#C9A961]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Available in denominations from ₹5,000 to ₹1,00,000
                                </li>
                                <li className="flex items-center gap-3 text-[#1C1C1C]/70">
                                    <svg className="w-5 h-5 text-[#C9A961]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Valid for 2 years from purchase date
                                </li>
                                <li className="flex items-center gap-3 text-[#1C1C1C]/70">
                                    <svg className="w-5 h-5 text-[#C9A961]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Beautiful presentation packaging
                                </li>
                                <li className="flex items-center gap-3 text-[#1C1C1C]/70">
                                    <svg className="w-5 h-5 text-[#C9A961]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Digital delivery available
                                </li>
                            </ul>
                            <Link
                                href="/contact"
                                className="inline-block bg-[#0A4D4E] text-white px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-[#15443B] transition-colors"
                            >
                                Inquire About Gift Cards
                            </Link>
                        </div>
                        <div className="relative h-[400px] bg-white shadow-lg">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center p-8">
                                    <p className="text-[#C9A961] text-sm tracking-[0.3em] uppercase mb-4">Gift Card</p>
                                    <p className="text-4xl font-serif text-[#1C1C1C] mb-2">Olivia International</p>
                                    <p className="text-[#1C1C1C]/60 text-sm">The Gift of Luxury</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* In-Room Amenities */}
            <section className="py-24 px-6 md:px-12">
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-[#C9A961] text-sm tracking-[0.3em] uppercase mb-4">For Our Guests</p>
                    <h2 className="text-4xl md:text-5xl font-serif text-[#1C1C1C] mb-8 tracking-wide">
                        In-Room Shopping
                    </h2>
                    <p className="text-[#1C1C1C]/70 text-lg leading-relaxed mb-8">
                        During your stay, you can purchase any of the amenities you've enjoyed—from our
                        luxurious linens and bath products to the artwork adorning your suite. Simply speak
                        with our concierge team.
                    </p>
                    <Link
                        href="/rooms"
                        className="inline-block border border-[#0A4D4E] text-[#0A4D4E] px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-[#0A4D4E] hover:text-white transition-colors"
                    >
                        Explore Our Rooms
                    </Link>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6 md:px-12 bg-[#0A4D4E]">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-6 tracking-wide">
                        Questions About Our Products?
                    </h2>
                    <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
                        Our concierge team is available to assist with any inquiries about our products or gift cards.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="tel:+911234567890"
                            className="bg-white text-[#0A4D4E] px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-[#C9A961] hover:text-white transition-colors"
                        >
                            Call Us
                        </a>
                        <Link
                            href="/contact"
                            className="border border-white text-white px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-white hover:text-[#0A4D4E] transition-colors"
                        >
                            Email Us
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
