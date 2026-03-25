'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function ExperiencesHero() {
    return (
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
                    className="text-[3rem] sm:text-[4rem] md:text-[5.5rem] lg:text-[7rem] font-serif font-medium text-white mb-5 tracking-[-0.03em] leading-[0.92] [text-shadow:0_2px_22px_rgba(0,0,0,0.55)]"
                >
                    Experiences
                </motion.h1>

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="flex gap-3"
                >
                    <Link
                        href="#experience-collection"
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
    );
}
