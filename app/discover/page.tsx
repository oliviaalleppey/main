'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';

const sections = [
    {
        id: 'accommodation',
        label: '01',
        title: 'Accommodation',
        tagline: 'Where stillness is the luxury.',
        description: 'Lake and canal view rooms with panoramic windows, curated amenities, and the quiet pace of Alappuzha.',
        href: '/rooms',
        image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1600&auto=format&fit=crop',
        layout: 'split-left',
    },
    {
        id: 'wedding',
        label: '02',
        title: 'Wedding',
        tagline: 'Celebrate where nature officiates.',
        description: 'From poolside vows to grand ballroom receptions, we design weddings around your story — not the other way around.',
        href: '/wedding',
        image: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1600&auto=format&fit=crop',
        layout: 'split-right',
    },
    {
        id: 'conference',
        label: '03',
        title: 'Conference & Events',
        tagline: 'Scale meets sophistication.',
        description: 'Versatile venues from boardrooms for 12 to ballrooms for 500 — each backed by seamless service and AV support.',
        href: '/conference-events',
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1600&auto=format&fit=crop',
        layout: 'full-bleed',
    },
    {
        id: 'dining',
        label: '04',
        title: 'Dining',
        tagline: 'A palate shaped by place.',
        description: 'Kerala spices, global techniques, and locally sourced ingredients — served across multiple signature outlets.',
        href: '/dining',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1600&auto=format&fit=crop',
        layout: 'split-left',
    },
    {
        id: 'wellness',
        label: '05',
        title: 'Wellness',
        tagline: 'Ancient healing, modern calm.',
        description: 'Ayurvedic therapies, guided yoga, and a state-of-the-art fitness centre — all overlooking the backwaters.',
        href: '/wellness',
        image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1600&auto=format&fit=crop',
        layout: 'split-right',
    },
    {
        id: 'membership',
        label: '06',
        title: 'Membership',
        tagline: 'For those who belong.',
        description: 'Year-round dining, wellness, stay, and event privileges — crafted for a select circle of members.',
        href: '/membership',
        image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1600&auto=format&fit=crop',
        layout: 'cinematic',
    },
];

function SplitSection({ section, index }: { section: typeof sections[0]; index: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
    const imageY = useTransform(scrollYProgress, [0, 1], [40, -40]);
    const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.08, 1, 1.02]);
    const isLeft = section.layout === 'split-left';

    return (
        <motion.section
            ref={ref}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="relative"
        >
            <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16">
                <div className={`flex flex-col ${isLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-0 lg:gap-0`}>

                    {/* Image side */}
                    <div className="lg:w-[58%] w-full relative overflow-hidden rounded-[32px] lg:rounded-[40px] aspect-[4/3] lg:aspect-[3/2] bg-[#E8E0D2]">
                        <motion.div style={{ y: imageY, scale: imageScale }} className="absolute inset-0">
                            <Image
                                src={section.image}
                                alt={section.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 1024px) 100vw, 58vw"
                            />
                        </motion.div>
                        <div className="absolute inset-0 bg-black/10" />
                    </div>

                    {/* Text side */}
                    <div className={`lg:w-[42%] w-full ${isLeft ? 'lg:pl-14 xl:pl-20' : 'lg:pr-14 xl:pr-20'} mt-8 lg:mt-0`}>
                        <motion.div
                            initial={{ opacity: 0, x: isLeft ? 30 : -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            className="max-w-md"
                        >
                            <span className="text-[11px] tracking-[0.4em] uppercase text-[var(--gold-accent-dark)] font-medium">{section.label} /</span>
                            <h2 className="mt-5 font-serif text-[2.8rem] md:text-[3.4rem] lg:text-[3.8rem] leading-[0.95] text-[var(--text-dark)] tracking-[-0.02em]">
                                {section.title}
                            </h2>
                            <p className="mt-5 font-serif text-lg md:text-xl italic text-[#8C7A6B]">
                                {section.tagline}
                            </p>
                            <p className="mt-5 text-[#59544D] text-[15px] leading-[1.75]">
                                {section.description}
                            </p>
                            <Link
                                href={section.href}
                                className="mt-8 inline-flex items-center gap-3 group/link"
                            >
                                <span className="text-[11px] tracking-[0.35em] uppercase font-semibold text-[var(--text-dark)] border-b border-[#C4BAA8] pb-1 group-hover/link:border-[var(--brand-primary)] transition-colors">
                                    Discover
                                </span>
                                <ArrowRight className="w-4 h-4 text-[var(--text-dark)] transition-transform group-hover/link:translate-x-1" />
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.section>
    );
}

function FullBleedSection({ section }: { section: typeof sections[0] }) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
    const y = useTransform(scrollYProgress, [0, 1], [60, -60]);

    return (
        <motion.section
            ref={ref}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="relative overflow-hidden"
        >
            <div className="relative h-[70vh] md:h-[80vh] w-full overflow-hidden">
                <motion.div style={{ y }} className="absolute inset-[-60px]">
                    <Image
                        src={section.image}
                        alt={section.title}
                        fill
                        className="object-cover"
                        sizes="100vw"
                    />
                </motion.div>
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/40" />

                <div className="relative z-10 h-full flex items-center justify-center">
                    <div className="text-center px-6 max-w-4xl">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                        >
                            <span className="text-[11px] tracking-[0.4em] uppercase text-[var(--gold-accent)] font-medium">{section.label} /</span>
                            <h2 className="mt-6 font-serif text-[3rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[7rem] leading-[0.9] text-white tracking-[-0.03em] [text-shadow:0_2px_30px_rgba(0,0,0,0.5)]">
                                {section.title}
                            </h2>
                            <p className="mt-6 font-serif text-xl md:text-2xl italic text-white/80">
                                {section.tagline}
                            </p>
                            <p className="mt-4 text-white/70 text-[15px] leading-relaxed max-w-2xl mx-auto">
                                {section.description}
                            </p>
                            <Link
                                href={section.href}
                                className="mt-10 inline-flex items-center gap-3 border border-white/70 px-8 py-3 text-[11px] tracking-[0.3em] uppercase font-semibold text-white hover:bg-white hover:text-[var(--text-dark)] transition-all duration-300"
                            >
                                Discover
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.section>
    );
}

function CinematicSection({ section }: { section: typeof sections[0] }) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
    const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.15, 1, 0.95]);
    const y = useTransform(scrollYProgress, [0, 1], [80, -80]);

    return (
        <motion.section
            ref={ref}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1 }}
            className="relative overflow-hidden"
        >
            <div className="relative h-[85vh] md:h-[95vh] w-full overflow-hidden">
                <motion.div style={{ scale }} className="absolute inset-0">
                    <Image
                        src={section.image}
                        alt={section.title}
                        fill
                        className="object-cover"
                        sizes="100vw"
                    />
                </motion.div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.65)_100%)]" />

                <div className="relative z-10 h-full flex items-end justify-center pb-16 md:pb-24">
                    <div className="text-center px-6 max-w-3xl">
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.9, delay: 0.3 }}
                        >
                            <span className="text-[11px] tracking-[0.4em] uppercase text-[var(--gold-accent)] font-medium">{section.label} /</span>
                            <h2 className="mt-6 font-serif text-[3.5rem] sm:text-[5rem] md:text-[7rem] lg:text-[8rem] leading-[0.85] text-white tracking-[-0.04em] [text-shadow:0_4px_40px_rgba(0,0,0,0.6)]">
                                {section.title}
                            </h2>
                            <p className="mt-6 font-serif text-xl md:text-2xl italic text-white/80">
                                {section.tagline}
                            </p>
                            <Link
                                href={section.href}
                                className="mt-10 inline-flex items-center gap-3 border border-white/70 px-10 py-3.5 text-[11px] tracking-[0.3em] uppercase font-semibold text-white hover:bg-white hover:text-[var(--text-dark)] transition-all duration-300"
                            >
                                Discover
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.section>
    );
}

export default function DiscoverPage() {
    return (
        <main className="min-h-screen bg-[#F3EEE4] text-[var(--text-dark)] selection:bg-[var(--text-dark)] selection:text-white">

            {/* HERO */}
            <section className="relative h-[50vh] md:h-[60vh] w-full overflow-hidden">
                <motion.div
                    initial={{ scale: 1.06 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 10, ease: 'easeOut' }}
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
                        className="flex items-center gap-4 mb-5"
                    >
                        <span className="w-10 h-[1px] bg-white/60" />
                        <p className="text-white/70 text-[10px] tracking-[0.5em] uppercase font-light">Olivia Alleppey</p>
                        <span className="w-10 h-[1px] bg-white/60" />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.4 }}
                        className="text-[4rem] sm:text-[5.5rem] md:text-[7rem] lg:text-[9rem] font-serif font-medium text-white tracking-[-0.03em] leading-[0.88] [text-shadow:0_4px_40px_rgba(0,0,0,0.4)]"
                    >
                        Discover
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                        className="mt-6 text-white/60 text-[13px] md:text-[14px] tracking-[0.15em] uppercase max-w-xl"
                    >
                        Every facet of Olivia, distilled into one page
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 1.2 }}
                        className="mt-12"
                    >
                        <div className="w-[1px] h-12 bg-gradient-to-b from-white/50 to-transparent mx-auto" />
                    </motion.div>
                </div>
            </section>

            {/* SECTION 1 — Accommodation (Split Left) */}
            <div className="pt-20 md:pt-28 pb-16 md:pb-24">
                <SplitSection section={sections[0]} index={0} />
            </div>

            {/* SECTION 2 — Wedding (Split Right) */}
            <div className="py-16 md:py-24 bg-[var(--surface-soft)]/30">
                <SplitSection section={sections[1]} index={1} />
            </div>

            {/* SECTION 3 — Conference (Full Bleed) */}
            <div className="py-0">
                <FullBleedSection section={sections[2]} />
            </div>

            {/* SECTION 4 — Dining (Split Left) */}
            <div className="py-16 md:py-24">
                <SplitSection section={sections[3]} index={3} />
            </div>

            {/* SECTION 5 — Wellness (Split Right) */}
            <div className="py-16 md:py-24 bg-[var(--surface-soft)]/30">
                <SplitSection section={sections[4]} index={4} />
            </div>

            {/* SECTION 6 — Membership (Cinematic) */}
            <div className="py-0">
                <CinematicSection section={sections[5]} />
            </div>

        </main>
    );
}
