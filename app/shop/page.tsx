'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

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
        <main className="min-h-screen bg-[var(--surface-cream)] font-sans">

            {/* Hero Section - Compact style like rooms page */}
            <section className="relative h-[44vh] md:h-[52vh] w-full overflow-hidden">
                <motion.div
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 8, ease: "easeOut" }}
                    className="absolute inset-0 z-0"
                >
                    {/* Dark gradient background like rooms page hero */}
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--brand-primary-deep)_0%,var(--brand-primary-dark)_38%,var(--brand-primary-deep)_100%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_25%_30%,rgba(231,212,173,0.18)_0%,rgba(231,212,173,0)_60%)]" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/40" />
                </motion.div>

                {/* Hero Content - Compact */}
                <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex items-center gap-4 mb-3"
                    >
                        <span className="w-8 h-[1px] bg-white/80" />
                        <p className="text-white text-[10px] tracking-[0.34em] uppercase font-light">
                            Olivia Alleppey
                        </p>
                        <span className="w-8 h-[1px] bg-white/80" />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 25 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-[3rem] sm:text-[4rem] md:text-[6rem] lg:text-[8rem] font-serif font-medium text-white mb-5 tracking-[-0.03em] leading-[0.92] [text-shadow:0_2px_22px_rgba(0,0,0,0.55)]"
                    >
                        The Olivia Shop
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className="flex gap-3"
                    >
                        <Link
                            href="#shop-collection"
                            className="border border-white/90 bg-white text-[#2D3933] px-6 py-2.5 text-[10px] tracking-[0.22em] uppercase font-semibold shadow-[0_18px_40px_-28px_rgba(0,0,0,0.65)] hover:bg-white/95 transition-colors duration-300"
                        >
                            Explore Collection
                        </Link>
                        <Link
                            href="/contact"
                            className="border border-white/85 bg-black/20 text-white px-6 py-2.5 text-[10px] tracking-[0.22em] uppercase font-semibold backdrop-blur-sm hover:bg-black/30 transition-colors duration-300"
                        >
                            Contact now
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Coming Soon Banner */}
            <section id="shop-collection" className="py-16 px-6 md:px-12 bg-[var(--gold-accent)]">
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
                        <p className="text-[var(--gold-accent-dark)] text-sm tracking-[0.3em] uppercase mb-4">Preview</p>
                        <h2 className="text-4xl md:text-5xl font-serif text-[var(--text-dark)] tracking-wide">
                            What's In Store
                        </h2>
                        <p className="text-[#59544D] mt-4 max-w-2xl mx-auto">
                            A sneak peek at the carefully curated products that will be available in our online boutique.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {comingSoonProducts.map((product, idx) => (
                            <div key={idx} className="group">
                                <div className="relative h-80 bg-[var(--surface-soft)] mb-6 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-primary)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-full h-full flex items-center justify-center">
                                        <p className="text-[var(--text-dark)]/20 text-sm">Product Image</p>
                                    </div>
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-[var(--gold-accent)] text-white text-xs uppercase tracking-wider px-3 py-1">
                                            {product.category}
                                        </span>
                                    </div>
                                </div>
                                <h3 className="text-xl font-serif text-[var(--text-dark)] mb-2">{product.name}</h3>
                                <p className="text-[#59544D] text-sm mb-3">{product.description}</p>
                                <p className="text-[var(--brand-primary)] font-medium">{product.price}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Newsletter Signup */}
            <section className="py-24 px-6 md:px-12 bg-white">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-serif text-[var(--text-dark)] mb-6 tracking-wide">
                        Be the First to Know
                    </h2>
                    <p className="text-[#403A35] mb-8">
                        Subscribe to receive updates on our shop launch, exclusive pre-order opportunities, and special offers.
                    </p>
                    <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 px-6 py-4 border border-[#BEB4A8] focus:border-[var(--btn-dark)] outline-none text-sm"
                        />
                        <button
                            type="submit"
                            className="bg-[var(--brand-primary)] text-white px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-[var(--brand-primary-dark)] transition-colors whitespace-nowrap"
                        >
                            Notify Me
                        </button>
                    </form>
                    <p className="text-xs text-[#6B645C] mt-4">
                        By subscribing, you agree to receive marketing communications from Olivia International.
                    </p>
                </div>
            </section>

            {/* Gift Cards Section */}
            <section className="py-24 px-6 md:px-12 bg-[var(--surface-soft)]">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <p className="text-[var(--gold-accent-dark)] text-sm tracking-[0.3em] uppercase mb-4">Available Now</p>
                            <h2 className="text-4xl md:text-5xl font-serif text-[var(--text-dark)] mb-8 tracking-wide">
                                Olivia Gift Cards
                            </h2>
                            <p className="text-[#403A35] text-lg leading-relaxed mb-6">
                                Give the gift of unforgettable experiences. Our gift cards can be used for stays,
                                dining, spa treatments, and more at Olivia International.
                            </p>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-3 text-[#403A35]">
                                    <svg className="w-5 h-5 text-[var(--gold-accent-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Available in denominations from ₹5,000 to ₹1,00,000
                                </li>
                                <li className="flex items-center gap-3 text-[#403A35]">
                                    <svg className="w-5 h-5 text-[var(--gold-accent-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Valid for 2 years from purchase date
                                </li>
                                <li className="flex items-center gap-3 text-[#403A35]">
                                    <svg className="w-5 h-5 text-[var(--gold-accent-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Beautiful presentation packaging
                                </li>
                                <li className="flex items-center gap-3 text-[#403A35]">
                                    <svg className="w-5 h-5 text-[var(--gold-accent-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Digital delivery available
                                </li>
                            </ul>
                            <Link
                                href="/contact"
                                className="inline-block bg-[var(--brand-primary)] text-white px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-[var(--brand-primary-dark)] transition-colors"
                            >
                                Inquire About Gift Cards
                            </Link>
                        </div>
                        <div className="relative h-[400px] bg-white shadow-lg">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center p-8">
                                    <p className="text-[var(--gold-accent-dark)] text-sm tracking-[0.3em] uppercase mb-4">Gift Card</p>
                                    <p className="text-4xl font-serif text-[var(--text-dark)] mb-2">Olivia International</p>
                                    <p className="text-[#59544D] text-sm">The Gift of Luxury</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* In-Room Amenities */}
            <section className="py-24 px-6 md:px-12">
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-[var(--gold-accent-dark)] text-sm tracking-[0.3em] uppercase mb-4">For Our Guests</p>
                    <h2 className="text-4xl md:text-5xl font-serif text-[var(--text-dark)] mb-8 tracking-wide">
                        In-Room Shopping
                    </h2>
                    <p className="text-[#403A35] text-lg leading-relaxed mb-8">
                        During your stay, you can purchase any of the amenities you've enjoyed—from our
                        luxurious linens and bath products to the artwork adorning your suite. Simply speak
                        with our concierge team.
                    </p>
                    <Link
                        href="/rooms"
                        className="inline-block border border-[var(--brand-primary)] text-[var(--brand-primary)] px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-[var(--brand-primary)] hover:text-white transition-colors"
                    >
                        Explore Our Rooms
                    </Link>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6 md:px-12 bg-[var(--brand-primary)]">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-6 tracking-wide">
                        Questions About Our Products?
                    </h2>
                    <p className="text-white/92 text-lg mb-8 max-w-2xl mx-auto">
                        Our concierge team is available to assist with any inquiries about our products or gift cards.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="tel:+911234567890"
                            className="bg-white text-[var(--brand-primary)] px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-[var(--gold-accent)] hover:text-white transition-colors"
                        >
                            Call Us
                        </a>
                        <Link
                            href="/contact"
                            className="border border-white text-white px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-white hover:text-[var(--brand-primary)] transition-colors"
                        >
                            Email Us
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
