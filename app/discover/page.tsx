'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const sections = [
    {
        title: 'Accommodation',
        subtitle: 'Rooms & Suites',
        description: 'Thoughtfully designed lake and canal view rooms with premium amenities, perfect for a restful stay in Alappuzha.',
        href: '/rooms',
        image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1600&auto=format&fit=crop',
    },
    {
        title: 'Wedding',
        subtitle: 'Celebrations',
        description: 'From intimate ceremonies to grand receptions, our venues and planning team craft unforgettable wedding experiences.',
        href: '/wedding',
        image: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1600&auto=format&fit=crop',
    },
    {
        title: 'Conference & Events',
        subtitle: 'Business Venues',
        description: 'Versatile banquet halls, boardrooms, and outdoor spaces equipped for conferences, launches, and corporate gatherings.',
        href: '/conference-events',
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1600&auto=format&fit=crop',
    },
    {
        title: 'Dining',
        subtitle: 'Restaurants & Bars',
        description: 'A culinary journey through Kerala flavours and global cuisine, served across multiple dining outlets.',
        href: '/dining',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1600&auto=format&fit=crop',
    },
    {
        title: 'Wellness',
        subtitle: 'Spa & Fitness',
        description: 'Ayurvedic therapies, yoga sessions, and a state-of-the-art fitness centre for complete rejuvenation.',
        href: '/wellness',
        image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1600&auto=format&fit=crop',
    },
    {
        title: 'Membership',
        subtitle: 'Lifestyle Privileges',
        description: 'Year-round access to dining, wellness, stay, and event benefits crafted for a select few.',
        href: '/membership',
        image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1600&auto=format&fit=crop',
    },
];

export default function DiscoverPage() {
    return (
        <main className="min-h-screen bg-[#F3EEE4] text-[var(--text-dark)] selection:bg-[var(--text-dark)] selection:text-white">

            {/* HERO */}
            <section className="relative h-[44vh] md:h-[52vh] w-full overflow-hidden">
                <motion.div
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 8, ease: 'easeOut' }}
                    className="absolute inset-0 z-0"
                >
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--brand-primary-deep)_0%,var(--brand-primary-dark)_38%,var(--brand-primary-deep)_100%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_25%_30%,rgba(231,212,173,0.12)_0%,rgba(231,212,173,0)_60%)]" />
                </motion.div>

                <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex items-center gap-4 mb-3"
                    >
                        <span className="w-8 h-[1px] bg-white/80" />
                        <p className="text-white text-[10px] tracking-[0.34em] uppercase font-light">Olivia Alleppey</p>
                        <span className="w-8 h-[1px] bg-white/80" />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 25 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-[3.5rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[8rem] font-serif font-medium text-white mb-5 tracking-[-0.02em] leading-[0.92] [text-shadow:0_2px_22px_rgba(0,0,0,0.55)]"
                    >
                        Discover
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-8"
                    >
                        Luxury stays, curated celebrations, fine dining, and holistic wellness — all under one roof.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className="flex gap-3"
                    >
                        <Link
                            href="/book/search"
                            className="border border-white/90 bg-white text-[#2D3933] px-6 py-2.5 text-[10px] tracking-[0.22em] uppercase font-semibold shadow-[0_18px_40px_-28px_rgba(0,0,0,0.65)] hover:bg-white/95 transition-colors duration-300"
                        >
                            Book Now
                        </Link>
                        <Link
                            href="/contact"
                            className="border border-white/85 bg-black/20 text-white px-6 py-2.5 text-[10px] tracking-[0.22em] uppercase font-semibold backdrop-blur-sm hover:bg-black/30 transition-colors duration-300"
                        >
                            Contact
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* SECTIONS GRID */}
            <section className="py-14 md:py-20 px-4 md:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {sections.map((section, idx) => (
                            <motion.div
                                key={section.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-60px' }}
                                transition={{ duration: 0.6, delay: idx * 0.1 }}
                            >
                                <Link
                                    href={section.href}
                                    className="group block rounded-[28px] border border-[#E2D7C7] bg-[#FBF8F2] overflow-hidden hover:border-[var(--brand-primary)]/30 transition-colors"
                                >
                                    {/* Image */}
                                    <div className="relative aspect-[16/10] overflow-hidden bg-[#E8E0D2]">
                                        <Image
                                            src={section.image}
                                            alt={section.title}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 md:p-8">
                                        <p className="text-[10px] tracking-[0.3em] uppercase text-[#6B645C]">{section.subtitle}</p>
                                        <h2 className="mt-3 font-serif text-[1.7rem] md:text-[2rem] leading-tight">{section.title}</h2>
                                        <p className="mt-3 text-sm md:text-[15px] text-[#59544D] leading-relaxed">{section.description}</p>
                                        <div className="mt-5 inline-flex items-center gap-2 text-[var(--text-dark)] opacity-60 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[11px] tracking-[0.28em] uppercase font-medium">Explore</span>
                                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

        </main>
    );
}
