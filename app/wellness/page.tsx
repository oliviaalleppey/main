'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Star } from 'lucide-react';
import EventInquiryForm from '@/components/conference/event-inquiry-form';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TreatmentItem {
    name: string;
    duration: string;
    description?: string;
}

interface TreatmentCategory {
    id: string;
    name: string;
    subtitle?: string;
    treatments: TreatmentItem[];
}

interface SpaService {
    id: 'spa';
    title: string;
    subtitle: string;
    intro: string;
    categories: TreatmentCategory[];
}

interface FeatureService {
    id: 'pool' | 'gym' | 'steam';
    title: string;
    subtitle: string;
    description: string;
    features: string[];
}

interface ScheduleItem {
    name: string;
    time: string;
    level: string;
}

interface YogaService {
    id: 'yoga';
    title: string;
    subtitle: string;
    description: string;
    offerings: ScheduleItem[];
}

type WellnessService = SpaService | FeatureService | YogaService;

// ─── Data ─────────────────────────────────────────────────────────────────────

const wellnessServices: WellnessService[] = [
    {
        id: 'spa',
        title: 'The Spa at Olivia',
        subtitle: 'Ayurvedic & International Therapies',
        intro: 'Immerse yourself in a sanctuary of serenity where ancient Ayurvedic wisdom meets contemporary wellness practices. Our spa in Alleppey draws from 5,000 years of Kerala healing tradition — every touch, every herb, every ritual attuned to your body\'s unique needs.',
        categories: [
            {
                id: 'abhayangam',
                name: 'ABHAYANGAM',
                subtitle: 'Snehana Therapies',
                treatments: [
                    {
                        name: 'Uzhichil',
                        duration: '60 + 15 min',
                        description: 'In ayurveda, the abhayangam massage has become popular because of its effective way to conditioning the body',
                    },
                    {
                        name: 'Udhvarthanam',
                        duration: '60 + 15 min',
                        description: 'Massage of body with herbal powder in opposite direction of hair according to disorders',
                    },
                    { name: 'Four Hand Synchronized', duration: '60 + 15 min' },
                    { name: 'Shirodhara', duration: '90 min' },
                    { name: 'Shirodhara', duration: '75 min' },
                    { name: 'Podikizhi', duration: '90 min' },
                ],
            },
            {
                id: 'kizhi',
                name: 'KIZHI',
                subtitle: 'Warm Herbal Poultice',
                treatments: [
                    { name: 'Njavara Kizhi', duration: '60 min' },
                    { name: 'Podikizhi', duration: '60 min' },
                    {
                        name: 'Pizhichil',
                        duration: '60 min',
                        description: 'Warm medicated oil is poured all over the body.',
                    },
                ],
            },
            {
                id: 'localized',
                name: 'LOCALIZED TREATMENTS',
                treatments: [
                    { name: 'Head & Neck', duration: '30 min' },
                    { name: 'Head, Neck & Back', duration: '45 min' },
                    { name: 'Leg Massage', duration: '30 min' },
                ],
            },
            {
                id: 'body-spa',
                name: 'BODY SPA',
                treatments: [
                    { name: 'Swedish Massage', duration: '60 min' },
                    { name: 'Aroma Therapy Massage', duration: '60 min' },
                    { name: 'Deep Tissue Massage', duration: '60 min' },
                    { name: 'Thai Massage', duration: '60 min' },
                    { name: 'Foot Reflexology', duration: '30 min' },
                    { name: 'Sports Massage', duration: '60 min' },
                    { name: 'Balinese Massage', duration: '60 min' },
                    { name: 'Prenatal Massage', duration: '60 min' },
                    { name: 'Sports Massage', duration: '90 min' },
                ],
            },
            {
                id: 'body-treatments',
                name: 'BODY TREATMENTS',
                treatments: [
                    { name: 'Chocolate Wrap', duration: '60 min' },
                    { name: 'Fruit Wrap', duration: '60 min' },
                    { name: 'Sandal Wrap', duration: '60 min' },
                    { name: 'Herbal Body Scrub', duration: '45 min' },
                    { name: 'Balancing Banana / Sugar Body Scrub', duration: '45 min' },
                    { name: 'Pedicure', duration: '' },
                    { name: 'Manicure', duration: '' },
                    { name: 'Threading', duration: '' },
                ],
            },
            {
                id: 'facial',
                name: 'DAZZLING FACIAL PACKAGES',
                treatments: [
                    { name: 'Deep Cleansing Facial', duration: '60 min' },
                    { name: 'Fruit Facial', duration: '60 min' },
                    { name: "Men's Facial", duration: '60 min' },
                    { name: 'Silver Facial', duration: '60 min' },
                    { name: 'Anti-Ageing Facial', duration: '60 min' },
                    { name: 'Anti-Tan Facial', duration: '60 min' },
                    { name: 'Pearl Facial', duration: '60 min' },
                    { name: 'Gold Facial', duration: '60 min' },
                    {
                        name: 'Diamond Reflection',
                        duration: '60 min',
                        description: 'Ayurvedic facial with foot massage',
                    },
                ],
            },
        ],
    },
    {
        id: 'pool',
        title: 'Atrium Pool',
        subtitle: 'Swim with a View',
        description:
            'Our stunning infinity pool appears to merge with the horizon, offering breathtaking views of the Kerala landscape. Surrounded by lush tropical gardens, the Atrium Pool is the perfect place to drift, unwind, and let the warmth of the sun restore you.',
        features: [
            'Temperature-controlled Water',
            'Poolside Cabanas',
            'Refreshing Poolside Beverages',
            'Sunset Swimming Hours',
            'Lap Swimming Sessions',
            'Private Pool Party Hire',
        ],
    },
    {
        id: 'gym',
        title: 'Fitness Centre',
        subtitle: 'State-of-the-Art Training',
        description:
            'Maintain your fitness ritual in our premium gymnasium, featuring the latest Technogym equipment and panoramic views of the surrounding greenery. From high-intensity cardio to restorative stretch sessions, our space adapts to every goal.',
        features: [
            'Technogym Cardio Equipment',
            'Free Weights & Strength Training',
            'Functional Training Zone',
            'Personal Training Sessions',
            'Pilates Studio',
            'Spin & Cycle Classes',
        ],
    },
    {
        id: 'steam',
        title: 'Steam & Sauna',
        subtitle: 'Purify. Restore. Renew.',
        description:
            'Step into our thermal sanctuary and let heat do its ancient work. The eucalyptus-infused steam room and Finnish-style dry sauna work together to open pores, ease muscle tension, and reset the nervous system — ideal before or after a spa treatment.',
        features: [
            'Eucalyptus Steam Room',
            'Finnish Dry Sauna',
            'Contrast Therapy Circuit',
            'Himalayan Salt Room',
            'Post-Treatment Lounge',
            'Herbal Steam Ritual',
        ],
    },
    {
        id: 'yoga',
        title: 'Yoga & Meditation',
        subtitle: 'Find Your Inner Peace',
        description:
            'Begin your journey inward with our expert yoga practitioners. Set against the tranquil backwaters of Alappuzha, our open-air yoga pavilion offers the perfect setting for mindfulness, pranayama, and spiritual renewal.',
        offerings: [
            { name: 'Sunrise Hatha Yoga', time: '6:00 AM – 7:15 AM', level: 'All Levels' },
            { name: 'Vinyasa Flow', time: '8:00 AM – 9:00 AM', level: 'Intermediate' },
            { name: 'Pranayama & Breathwork', time: '5:00 PM – 5:45 PM', level: 'All Levels' },
            { name: 'Sunset Meditation', time: '6:00 PM – 7:00 PM', level: 'All Levels' },
            { name: 'Private Yoga Session', time: 'By Appointment', level: 'Customised' },
        ],
    },
];

const tabLabels: Record<string, string> = {
    spa: 'The Spa at Olivia',
    pool: 'Atrium Pool',
    gym: 'Gym',
    steam: 'Steam & Sauna',
    yoga: 'Yoga & Meditation',
};

// ─── Inner Components ─────────────────────────────────────────────────────────

function TreatmentRow({ treatment }: { treatment: TreatmentItem }) {
    return (
        <div className="py-3 border-b border-[#E8E1D6] group">
            <div className="flex justify-between items-baseline gap-4">
                <p className="text-[#2A2420] text-[0.95rem] md:text-[1rem] font-light leading-snug group-hover:text-[var(--gold-accent-dark)] transition-colors duration-200">
                    {treatment.name}
                </p>
                {treatment.duration && (
                    <span className="text-[#9E968C] text-[0.8rem] tracking-wider whitespace-nowrap shrink-0">
                        {treatment.duration}
                    </span>
                )}
            </div>
            {treatment.description && (
                <p className="mt-1 text-[#9E968C] text-xs italic leading-relaxed">
                    {treatment.description}
                </p>
            )}
        </div>
    );
}

function CategoryBlock({ category, index }: { category: TreatmentCategory; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: index * 0.03 }}
        >
            {/* Category header */}
            <div className="flex items-center gap-5 mb-6">
                <span className="w-10 h-[1.5px] bg-[var(--gold-accent)] shrink-0" />
                <div className="flex items-baseline gap-3 shrink-0">
                    <h3 className="text-[var(--gold-accent-dark)] text-[1rem] md:text-[1.1rem] tracking-[0.18em] uppercase font-semibold">
                        {category.name}
                    </h3>
                    {category.subtitle && (
                        <span className="text-[#B0A89E] text-[0.75rem] tracking-[0.14em] uppercase font-normal">
                            — {category.subtitle}
                        </span>
                    )}
                </div>
                <span className="flex-1 h-[1px] bg-[#E0D9CF]" />
            </div>

            {/* Two-column treatment grid */}
            <div className="grid md:grid-cols-2 gap-x-10">
                {category.treatments.map((treatment, idx) => (
                    <TreatmentRow key={`${treatment.name}-${idx}`} treatment={treatment} />
                ))}
            </div>
        </motion.div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface WellnessImages {
    wellness_spa?: string;
    wellness_pool?: string;
    wellness_gym?: string;
    wellness_steam?: string;
    wellness_yoga?: string;
}

export default function WellnessPage() {
    const [activeService, setActiveService] = useState<string>('spa');
    const [images, setImages] = useState<WellnessImages>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/media/amenities')
            .then(res => res.json())
            .then(data => setImages(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const validIds = new Set<string>(wellnessServices.map((s) => s.id));
        const applyHash = () => {
            const hash = window.location.hash.replace('#', '').trim();
            if (hash && validIds.has(hash)) setActiveService(hash);
        };
        applyHash();
        window.addEventListener('hashchange', applyHash);
        return () => window.removeEventListener('hashchange', applyHash);
    }, []);

    const handleServiceSelect = (id: string) => {
        setActiveService(id);
        window.history.replaceState(null, '', `#${id}`);
        setTimeout(() => {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    };

    const activeData = wellnessServices.find((s) => s.id === activeService);

    return (
        <main className="min-h-screen bg-[var(--surface-cream)] font-sans">

            {/* ── Hero ─────────────────────────────────────────────────────── */}
            <section className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
                <motion.div
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 9, ease: 'easeOut' }}
                    className="absolute inset-0 z-0"
                >
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--brand-primary-deep)_0%,var(--brand-primary-dark)_38%,var(--brand-primary-deep)_100%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_25%_30%,rgba(231,212,173,0.18)_0%,rgba(231,212,173,0)_60%)]" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/40" />
                </motion.div>

                <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex items-center gap-4 mb-4"
                    >
                        <span className="w-8 h-[1px] bg-white/70" />
                        <p className="text-white text-[10px] tracking-[0.34em] uppercase font-light">Olivia Alleppey</p>
                        <span className="w-8 h-[1px] bg-white/70" />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 25 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-[3rem] sm:text-[4.5rem] md:text-[7rem] lg:text-[9rem] font-serif font-medium text-white tracking-[-0.03em] leading-[0.92] [text-shadow:0_2px_24px_rgba(0,0,0,0.55)]"
                    >
                        Wellness
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.65 }}
                        className="font-serif italic text-white/65 text-base md:text-2xl mt-5 mb-8 tracking-wide"
                    >
                        Ancient Healing. Timeless Renewal.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.85 }}
                        className="flex gap-3"
                    >
                        <Link
                            href="#spa"
                            className="border border-white/90 bg-white text-[#2D3933] px-7 py-3 text-[10px] tracking-[0.22em] uppercase font-semibold shadow-[0_18px_40px_-28px_rgba(0,0,0,0.65)] hover:bg-white/95 transition-colors duration-300"
                        >
                            Explore Spa
                        </Link>
                        <Link
                            href="/contact"
                            className="border border-white/80 bg-black/20 text-white px-7 py-3 text-[10px] tracking-[0.22em] uppercase font-semibold backdrop-blur-sm hover:bg-black/30 transition-colors duration-300"
                        >
                            Contact now
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* ── Intro ────────────────────────────────────────────────────── */}
            <section className="py-20 md:py-28 px-6 md:px-12 bg-[var(--surface-cream)]">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                    >
                        <p className="text-[var(--gold-accent-dark)] text-[11px] tracking-[0.35em] uppercase mb-5">
                            A Philosophy of Healing
                        </p>
                        <h2 className="font-serif text-[2.5rem] md:text-[3.5rem] text-[var(--text-dark)] mb-8 leading-tight tracking-[-0.02em]">
                            A Journey to Inner Peace
                        </h2>
                        <p className="text-[#403A35] text-lg md:text-xl leading-[1.8] font-light mb-12">
                            At Olivia International, wellness is not merely a service — it is a philosophy deeply rooted
                            in Kerala&apos;s ancient healing traditions. Our wellness centre draws inspiration from Ayurveda,
                            the 5,000-year-old science of life, while embracing modern therapeutic practices. Every treatment,
                            every session, every moment is designed to guide you toward optimal well-being.
                        </p>
                        <div className="flex justify-center gap-12 md:gap-20">
                            <div>
                                <p className="text-5xl md:text-6xl font-serif text-[var(--brand-primary)]">40+</p>
                                <p className="text-xs text-[#59544D] uppercase tracking-[0.18em] mt-3">Treatments</p>
                            </div>
                            <div>
                                <p className="text-5xl md:text-6xl font-serif text-[var(--brand-primary)]">8</p>
                                <p className="text-xs text-[#59544D] uppercase tracking-[0.18em] mt-3">Expert Therapists</p>
                            </div>
                            <div>
                                <div className="flex items-center justify-center gap-1 mb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-[var(--gold-accent)] text-[var(--gold-accent)]" />
                                    ))}
                                </div>
                                <p className="text-5xl md:text-6xl font-serif text-[var(--brand-primary)]">5.0</p>
                                <p className="text-xs text-[#59544D] uppercase tracking-[0.18em] mt-3">Spa Rating</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── Tab Navigation ───────────────────────────────────────────── */}
            <div
                className="bg-white/95 backdrop-blur-md border-b border-[#E8DFD0] sticky z-40"
                style={{ top: 'var(--site-header-height, 62px)' }}
            >
                <div className="max-w-6xl mx-auto px-4 md:px-6">
                    <div className="flex justify-start md:justify-center overflow-x-auto scrollbar-hide">
                        {wellnessServices.map((service) => (
                            <button
                                key={service.id}
                                onClick={() => handleServiceSelect(service.id)}
                                className={`relative px-5 md:px-7 py-5 text-[10px] md:text-[11px] tracking-[0.24em] uppercase font-medium whitespace-nowrap transition-colors duration-300 shrink-0 ${
                                    activeService === service.id
                                        ? 'text-[var(--brand-primary)]'
                                        : 'text-[#7A6F64] hover:text-[var(--text-dark)]'
                                }`}
                            >
                                {tabLabels[service.id]}
                                {activeService === service.id && (
                                    <motion.span
                                        layoutId="tab-indicator"
                                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--gold-accent)]"
                                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Service Panels ───────────────────────────────────────────── */}
            <AnimatePresence mode="wait">
                {activeData && (
                    <motion.div
                        key={activeData.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                    >
                        {/* SPA PANEL */}
                        {activeData.id === 'spa' && (
                            <div id="spa">
                                {/* Zone A: Intro */}
                                <section className="py-20 md:py-28 px-6 md:px-12 bg-[var(--surface-cream)]">
                                    <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-start">
                                        <div>
                                            <p className="text-[var(--gold-accent-dark)] text-[11px] tracking-[0.3em] uppercase mb-5">
                                                {activeData.subtitle}
                                            </p>
                                            <h2 className="font-serif text-[3rem] md:text-[4rem] text-[var(--text-dark)] leading-[1.0] mb-8 tracking-[-0.02em]">
                                                The Spa<br />at Olivia
                                            </h2>
                                            <p className="text-[#403A35] text-lg md:text-xl leading-[1.8] font-light">
                                                {activeData.intro}
                                            </p>
                                            <div className="mt-10 pt-8 border-t border-[var(--surface-soft)]">
                                                <a
                                                    href="#spa-menu"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        document.getElementById('spa-menu')?.scrollIntoView({ behavior: 'smooth' });
                                                    }}
                                                    className="inline-flex items-center gap-3 text-[var(--brand-primary)] text-[11px] tracking-[0.22em] uppercase font-medium hover:gap-5 transition-all duration-300"
                                                >
                                                    View Full Treatment Menu
                                                    <ArrowRight className="w-4 h-4 shrink-0" />
                                                </a>
                                            </div>
                                        </div>

                                        <div className="relative h-[460px] md:h-[540px] bg-[var(--surface-soft)] overflow-hidden">
                                            {images.wellness_spa ? (
                                                <Image src={images.wellness_spa} alt="The Spa at Olivia" fill className="object-cover" />
                                            ) : (
                                                <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-primary-deep)]/25 to-transparent" />
                                            )}
                                            {!images.wellness_spa && !loading && (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <p className="text-[#8F877F] text-sm">Add image in admin</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                {/* Zone B: Treatment Menu */}
                                <section id="spa-menu" className="py-14 md:py-20 px-6 md:px-12 bg-[#FDFAF5]">
                                    <div className="max-w-5xl mx-auto">
                                        {/* Heading */}
                                        <div className="text-center mb-12 md:mb-14">
                                            <div className="flex items-center justify-center gap-6 mb-5">
                                                <span className="w-14 h-[1px] bg-[var(--gold-accent)]/50" />
                                                <span className="text-[var(--gold-accent-dark)] text-[10px] tracking-[0.4em] uppercase">
                                                    Our Offerings
                                                </span>
                                                <span className="w-14 h-[1px] bg-[var(--gold-accent)]/50" />
                                            </div>
                                            <h2 className="font-serif text-[2rem] md:text-[2.75rem] text-[var(--text-dark)] leading-tight tracking-[-0.02em]">
                                                Treatment Menu
                                            </h2>
                                            <p className="mt-3 text-[#9E968C] text-sm max-w-xl mx-auto font-light leading-relaxed">
                                                All treatments are tailored to your constitution and may be modified on consultation with our therapists.
                                            </p>
                                        </div>

                                        {/* Categories */}
                                        <div className="space-y-10 md:space-y-12">
                                            {activeData.categories.map((cat, idx) => (
                                                <CategoryBlock key={cat.id} category={cat} index={idx} />
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* STANDARD PANELS: pool, gym, steam */}
                        {(activeData.id === 'pool' || activeData.id === 'gym' || activeData.id === 'steam') && (
                            <section id={activeData.id} className="py-20 md:py-28 px-6 md:px-12 bg-[var(--surface-cream)]">
                                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-start">
                                    <div>
                                        <p className="text-[var(--gold-accent-dark)] text-[11px] tracking-[0.3em] uppercase mb-5">
                                            {activeData.subtitle}
                                        </p>
                                        <h2 className="font-serif text-[3rem] md:text-[4rem] text-[var(--text-dark)] leading-[1.0] mb-8 tracking-[-0.02em]">
                                            {activeData.title}
                                        </h2>
                                        <p className="text-[#403A35] text-lg md:text-xl leading-[1.8] font-light mb-12">
                                            {activeData.description}
                                        </p>
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                                            {activeData.features.map((feature, idx) => (
                                                <div key={idx} className="flex items-start gap-3">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold-accent)] mt-[0.45rem] shrink-0" />
                                                    <p className="text-[#403A35] text-sm md:text-base leading-relaxed">{feature}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="relative h-[480px] md:h-[560px] bg-[var(--surface-soft)] overflow-hidden">
                                        {activeData.id === 'pool' && images.wellness_pool ? (
                                            <Image src={images.wellness_pool} alt={activeData.title} fill className="object-cover" />
                                        ) : activeData.id === 'gym' && images.wellness_gym ? (
                                            <Image src={images.wellness_gym} alt={activeData.title} fill className="object-cover" />
                                        ) : activeData.id === 'steam' && images.wellness_steam ? (
                                            <Image src={images.wellness_steam} alt={activeData.title} fill className="object-cover" />
                                        ) : (
                                            <>
                                                <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-primary-deep)]/20 to-transparent" />
                                                {!loading && (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <p className="text-[#8F877F] text-sm">Add image in admin</p>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* YOGA PANEL */}
                        {activeData.id === 'yoga' && (
                            <section id="yoga" className="py-20 md:py-28 px-6 md:px-12 bg-[var(--surface-cream)]">
                                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-start">
                                    <div>
                                        <p className="text-[var(--gold-accent-dark)] text-[11px] tracking-[0.3em] uppercase mb-5">
                                            {activeData.subtitle}
                                        </p>
                                        <h2 className="font-serif text-[3rem] md:text-[4rem] text-[var(--text-dark)] leading-[1.0] mb-8 tracking-[-0.02em]">
                                            Yoga &amp;<br />Meditation
                                        </h2>
                                        <p className="text-[#403A35] text-lg md:text-xl leading-[1.8] font-light mb-12">
                                            {activeData.description}
                                        </p>

                                        <h3 className="text-[11px] uppercase tracking-[0.28em] text-[var(--gold-accent-dark)] mb-6">
                                            Daily Schedule
                                        </h3>
                                        <div className="space-y-0">
                                            {activeData.offerings.map((offering, idx) => (
                                                <div key={idx} className="flex justify-between items-center py-4 border-b border-[var(--surface-soft)]">
                                                    <div>
                                                        <p className="text-[var(--text-dark)] text-base md:text-lg font-medium">{offering.name}</p>
                                                        <p className="text-sm text-[#7A6F64] mt-0.5">{offering.time}</p>
                                                    </div>
                                                    <span className="text-[10px] uppercase tracking-wider text-[var(--gold-accent-dark)] bg-[var(--gold-accent)]/12 px-3 py-1.5 shrink-0 ml-4">
                                                        {offering.level}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="relative h-[480px] md:h-[560px] bg-[var(--surface-soft)] overflow-hidden">
                                        {images.wellness_yoga ? (
                                            <Image src={images.wellness_yoga} alt="Yoga & Meditation" fill className="object-cover" />
                                        ) : (
                                            <>
                                                <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-primary-deep)]/20 to-transparent" />
                                                {!loading && (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <p className="text-[#8F877F] text-sm">Add image in admin</p>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Booking CTA ──────────────────────────────────────────────── */}
            <section id="event-form" className="py-20 md:py-28 px-6 md:px-12 bg-white border-t border-[var(--surface-soft)]">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-[var(--gold-accent-dark)] text-[11px] tracking-[0.35em] uppercase mb-5">
                            Personalised Wellness
                        </p>
                        <h2 className="font-serif text-[2.5rem] md:text-[3.5rem] text-[var(--text-dark)] tracking-[-0.02em] leading-tight">
                            Reserve Your Wellness Experience
                        </h2>
                        <p className="mt-5 text-[#5D5A53] text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                            Share your preferences and our wellness team will curate a personalised spa and
                            wellness itinerary for your stay.
                        </p>
                    </div>
                    <EventInquiryForm />
                </div>
            </section>
        </main>
    );
}
