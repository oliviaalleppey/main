'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import EventInquiryForm from '@/components/conference/event-inquiry-form';
import StickyBookButton from '@/components/sticky-book-button';
import WhatsAppWidget from '@/components/whatsapp-widget';

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

// ─── Data ─────────────────────────────────────────────────────────────────────

const spaCategories: TreatmentCategory[] = [
    {
        id: 'abhayangam',
        name: 'ABHAYANGAM',
        subtitle: 'Snehana Therapies',
        treatments: [
            { name: 'Uzhichil', duration: '60 + 15 min', description: 'In ayurveda, the abhayangam massage has become popular because of its effective way to conditioning the body' },
            { name: 'Udhvarthanam', duration: '60 + 15 min', description: 'Massage of body with herbal powder in opposite direction of hair according to disorders' },
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
            { name: 'Pizhichil', duration: '60 min', description: 'Warm medicated oil is poured all over the body.' },
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
            { name: 'Diamond Reflection', duration: '60 min', description: 'Ayurvedic facial with foot massage' },
        ],
    },
];

const featureServices = [
    {
        key: 'pool',
        name: 'Atrium Pool',
        tag: 'Swim & Relax',
        subtitle: 'Swim with a View',
        description: 'Our stunning pool appears to merge with the horizon, offering breathtaking views of the Kerala landscape. Surrounded by lush tropical gardens, the Atrium Pool is the perfect place to drift, unwind, and let the warmth of the sun restore you.',
        features: ['Temperature-controlled Water', 'Poolside Cabanas', 'Refreshing Poolside Beverages', 'Sunset Swimming Hours', 'Lap Swimming Sessions', 'Private Pool Party Hire'],
    },
    {
        key: 'gym',
        name: 'Fitness Centre',
        tag: 'Strength & Cardio',
        subtitle: 'State-of-the-Art Training',
        description: 'Maintain your fitness ritual in our premium gymnasium, featuring the latest Technogym equipment and panoramic views of the surrounding greenery. From high-intensity cardio to restorative stretch sessions, our space adapts to every goal.',
        features: ['Technogym Cardio Equipment', 'Free Weights & Strength Training', 'Functional Training Zone', 'Personal Training Sessions', 'Pilates Studio', 'Spin & Cycle Classes'],
    },
    {
        key: 'steam',
        name: 'Steam & Sauna',
        tag: 'Purify & Restore',
        subtitle: 'Purify. Restore. Renew.',
        description: 'Step into our thermal sanctuary and let heat do its ancient work. The eucalyptus-infused steam room and Finnish-style dry sauna work together to open pores, ease muscle tension, and reset the nervous system — ideal before or after a spa treatment.',
        features: ['Eucalyptus Steam Room', 'Finnish Dry Sauna', 'Contrast Therapy Circuit', 'Himalayan Salt Room', 'Post-Treatment Lounge', 'Herbal Steam Ritual'],
    },
];

const yogaOfferings = [
    { name: 'Sunrise Hatha Yoga', time: '6:00 AM – 7:15 AM', level: 'All Levels' },
    { name: 'Vinyasa Flow', time: '8:00 AM – 9:00 AM', level: 'Intermediate' },
    { name: 'Pranayama & Breathwork', time: '5:00 PM – 5:45 PM', level: 'All Levels' },
    { name: 'Sunset Meditation', time: '6:00 PM – 7:00 PM', level: 'All Levels' },
    { name: 'Private Yoga Session', time: 'By Appointment', level: 'Customised' },
];

const navLabels = ['The Spa', 'Atrium Pool', 'Fitness Centre', 'Steam & Sauna', 'Yoga'];
const navIds = ['spa', 'pool', 'gym', 'steam', 'yoga'];

// ─── Sub-components ────────────────────────────────────────────────────────────

function TreatmentRow({ treatment }: { treatment: TreatmentItem }) {
    return (
        <div className="py-3 border-b border-[#E8E0D2] group">
            <div className="flex justify-between items-baseline gap-4">
                <p className="text-[#2A2420] text-[0.95rem] font-light leading-snug group-hover:text-[#8C7451] transition-colors duration-200">
                    {treatment.name}
                </p>
                {treatment.duration && (
                    <span className="text-[#9E968C] text-[0.8rem] tracking-wider whitespace-nowrap shrink-0">
                        {treatment.duration}
                    </span>
                )}
            </div>
            {treatment.description && (
                <p className="mt-1 text-[#9E968C] text-xs italic leading-relaxed">{treatment.description}</p>
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
            <div className="flex items-center gap-5 mb-6">
                <span className="w-10 h-[1.5px] bg-[#BCA06F] shrink-0" />
                <div className="flex items-baseline gap-3 shrink-0">
                    <h3 className="text-[#8C7451] text-[1rem] tracking-[0.18em] uppercase font-semibold">{category.name}</h3>
                    {category.subtitle && (
                        <span className="text-[#B0A89E] text-[0.75rem] tracking-[0.14em] uppercase font-normal">— {category.subtitle}</span>
                    )}
                </div>
                <span className="flex-1 h-[1px] bg-[#E0D9CF]" />
            </div>
            <div className="grid md:grid-cols-2 gap-x-10">
                {category.treatments.map((treatment, idx) => (
                    <TreatmentRow key={`${treatment.name}-${idx}`} treatment={treatment} />
                ))}
            </div>
        </motion.div>
    );
}

function FeatureCard({ service, index, imageUrl }: { service: typeof featureServices[0]; index: number; imageUrl?: string }) {
    const isEven = index % 2 === 0;
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
    const y = useTransform(scrollYProgress, [0, 1], [18, -18]);

    return (
        <motion.div
            id={service.key}
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-6 lg:gap-8 items-stretch lg:min-h-[46vh] scroll-mt-[200px] md:scroll-mt-[220px]`}
        >
            {/* Image */}
            <div className="w-full lg:w-1/2 relative h-[34vh] sm:h-[40vh] lg:h-[44vh] xl:h-[46vh] overflow-hidden group">
                <motion.div style={{ y }} className="absolute inset-0 h-[120%] w-full -top-[10%]">
                    {imageUrl ? (
                        <img src={imageUrl} alt={service.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                        <div className="w-full h-full bg-[linear-gradient(135deg,var(--brand-primary-deep),var(--brand-primary-dark))]" />
                    )}
                </motion.div>
                <div className="absolute bottom-6 left-6 z-10">
                    <div className="backdrop-blur-md bg-black/25 border border-white/20 text-white text-[10px] tracking-[0.3em] uppercase px-5 py-2.5 rounded-full flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#BCA06F] animate-pulse" />
                        {service.tag}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className={`w-full lg:w-1/2 flex flex-col justify-center py-2 lg:py-0 ${isEven ? 'lg:pl-8' : 'lg:items-end lg:pr-8 text-right'}`}>
                <div className="max-w-lg">
                    <span className="text-[#BCA06F] text-[10px] md:text-[11px] tracking-[0.4em] uppercase mb-4 block">{service.subtitle}</span>
                    <h3 className="text-3xl md:text-4xl lg:text-[2.55rem] font-serif font-bold tracking-tight text-[var(--text-dark)] mb-4 leading-tight">
                        {service.name}
                    </h3>
                    <p className="text-[#403A35] text-base md:text-[1.05rem] leading-[1.7] tracking-wide mb-6 font-light">
                        {service.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-6">
                        {service.features.map((f) => (
                            <span key={f} className="text-xs text-[#403A35] border border-[#BCA06F] bg-[#FCFAF5] px-2.5 py-1">{f}</span>
                        ))}
                    </div>
                    <Link
                        href="#wellness-form"
                        className="group relative inline-flex items-center justify-center px-8 py-3.5 border border-[var(--brand-primary-dark)] text-white overflow-hidden transition-colors duration-300 bg-[var(--brand-primary-dark)]"
                    >
                        <span className="absolute inset-0 w-full h-full bg-black origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out z-0" />
                        <span className="relative z-10 text-[11px] tracking-[0.24em] uppercase font-normal">Reserve an Experience</span>
                        <svg className="relative z-10 w-3.5 h-3.5 ml-3 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </Link>
                </div>
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
    [key: string]: string | undefined;
}

export default function WellnessPage() {
    const [images, setImages] = useState<WellnessImages>({});
    const [activeNav, setActiveNav] = useState(0);

    useEffect(() => {
        fetch('/api/admin/media/amenities')
            .then((res) => res.json())
            .then((data) => {
                if (data && typeof data === 'object') {
                    const filtered: WellnessImages = {};
                    (Object.keys(data) as string[]).forEach((key) => {
                        if (key.startsWith('wellness_') && typeof data[key] === 'string') {
                            filtered[key] = data[key];
                        }
                    });
                    setImages(filtered);
                }
            })
            .catch(console.error);
    }, []);

    return (
        <>
            <main className="min-h-screen bg-[#FAF8F3] text-[#26322D]">

                {/* Hero */}
                <section className="relative h-[44vh] md:h-[52vh] w-full overflow-hidden">
                    <motion.div
                        initial={{ scale: 1.05 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 8, ease: 'easeOut' }}
                        className="absolute inset-0 z-0"
                    >
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--brand-primary-deep)_0%,var(--brand-primary-dark)_38%,var(--brand-primary-deep)_100%)]" />
                        <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_25%_30%,rgba(231,212,173,0.18)_0%,rgba(231,212,173,0)_60%)]" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/40" />
                    </motion.div>

                    <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="flex items-center gap-4 mb-3">
                            <span className="w-8 h-[1px] bg-white/80" />
                            <p className="text-white text-[10px] tracking-[0.34em] uppercase font-light">Olivia Alleppey</p>
                            <span className="w-8 h-[1px] bg-white/80" />
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 25 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="text-[4.25rem] sm:text-[5.25rem] md:text-[8.25rem] lg:text-[10.5rem] font-serif font-medium text-white mb-5 tracking-[-0.03em] leading-[0.92] [text-shadow:0_2px_22px_rgba(0,0,0,0.55)]"
                        >
                            Wellness
                        </motion.h1>

                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }} className="flex gap-3">
                            <Link href="#spa" className="border border-white/90 bg-white text-[#2D3933] px-6 py-2.5 text-[10px] tracking-[0.22em] uppercase font-semibold shadow-[0_18px_40px_-28px_rgba(0,0,0,0.65)] hover:bg-white/95 transition-colors duration-300">
                                Explore Spa
                            </Link>
                            <Link href="#wellness-form" className="border border-white/85 bg-black/20 text-white px-6 py-2.5 text-[10px] tracking-[0.22em] uppercase font-semibold backdrop-blur-sm hover:bg-black/30 transition-colors duration-300">
                                Reserve an Experience
                            </Link>
                        </motion.div>
                    </div>
                </section>

                {/* Facts Bar */}
                <section className="border-b border-[#E8E0D2] bg-[#F6F1E7]">
                    <div className="max-w-6xl mx-auto px-6 md:px-10 py-6 md:py-7 grid grid-cols-2 md:grid-cols-4 gap-5">
                        {[
                            { label: 'Treatments', value: '40+ Therapies' },
                            { label: 'Expert Therapists', value: '8 Specialists' },
                            { label: 'Wellness Spaces', value: '5 Offerings' },
                            { label: 'Spa Rating', value: '5-Star Rated' },
                        ].map(({ label, value }) => (
                            <div key={label} className="border border-[#E7DDCC] bg-[#FCFAF5] px-4 py-3">
                                <p className="text-[10px] tracking-[0.2em] uppercase text-[#8F7750] mb-1">{label}</p>
                                <p className="text-sm md:text-base text-[#2D3933]">{value}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Sticky Nav */}
                <section
                    id="wellness-nav"
                    className="sticky z-40 bg-[#FBF9F3] border-b border-[#E8E0D1] py-3 md:py-3.5 transition-all duration-300"
                    style={{ top: 'var(--site-header-height, 62px)' }}
                >
                    <div className="w-full px-3 sm:px-6 md:px-12">
                        <div className="flex items-center justify-center gap-3 px-1 md:px-2 pb-2">
                            <p className="text-[10px] md:text-[11px] uppercase tracking-[0.28em] text-[#6B645C] whitespace-nowrap">Select a service</p>
                        </div>
                        <div className="-mx-1 overflow-x-auto lg:overflow-x-visible no-scrollbar">
                            <div className="flex min-w-max lg:min-w-0 lg:w-full items-center gap-2 md:gap-3 px-1 md:px-2 lg:justify-between">
                                {navLabels.map((label, index) => (
                                    <button
                                        key={label}
                                        onClick={() => {
                                            setActiveNav(index);
                                            document.getElementById(navIds[index])?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className={`relative px-4 md:px-5 py-2.5 text-[11px] md:text-xs tracking-[0.12em] uppercase whitespace-nowrap transition-colors duration-200 lg:flex-1 lg:text-center rounded-full border focus:outline-none cursor-pointer ${
                                            activeNav === index
                                                ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white shadow-[0_14px_30px_-22px_rgba(10,51,43,0.65)]'
                                                : 'bg-white/80 border-[#E6DDCE] text-[#2E3934] hover:bg-white hover:border-[#CFC2AD]'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── The Spa Section ─────────────────────────────────────────── */}
                <section id="spa" className="py-8 md:py-10 px-6 md:px-10 scroll-mt-[200px] md:scroll-mt-[220px]">
                    <div className="max-w-[1600px] mx-auto">
                        <div className="text-center mb-10 md:mb-12">
                            <span className="inline-block w-12 h-[1px] bg-[#C6AF84] mb-5" />
                            <h2 className="text-4xl md:text-5xl font-serif text-[#2C3632] tracking-tight">The Spa at Olivia</h2>
                        </div>

                        {/* Spa intro — alternating layout */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={{ duration: 0.8 }}
                            className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch lg:min-h-[46vh] mb-12 md:mb-16"
                        >
                            {/* Image */}
                            <div className="w-full lg:w-1/2 relative h-[34vh] sm:h-[40vh] lg:h-[44vh] xl:h-[48vh] overflow-hidden group">
                                {images.wellness_spa ? (
                                    <img src={images.wellness_spa} alt="The Spa at Olivia" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                ) : (
                                    <div className="w-full h-full bg-[linear-gradient(135deg,var(--brand-primary-deep),var(--brand-primary-dark))]" />
                                )}
                                <div className="absolute bottom-6 left-6 z-10">
                                    <div className="backdrop-blur-md bg-black/25 border border-white/20 text-white text-[10px] tracking-[0.3em] uppercase px-5 py-2.5 rounded-full flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#BCA06F] animate-pulse" />
                                        Ayurvedic & International
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="w-full lg:w-1/2 flex flex-col justify-center py-2 lg:py-0 lg:pl-8">
                                <div className="max-w-lg">
                                    <span className="text-[#BCA06F] text-[10px] md:text-[11px] tracking-[0.4em] uppercase mb-4 block">01 — Wellness Sanctuary</span>
                                    <h3 className="text-3xl md:text-4xl lg:text-[2.55rem] font-serif font-bold tracking-tight text-[var(--text-dark)] mb-4 leading-tight">
                                        Ancient Healing.<br />Timeless Renewal.
                                    </h3>
                                    <p className="text-[#403A35] text-base md:text-[1.05rem] leading-[1.7] tracking-wide mb-6 font-light">
                                        Immerse yourself in a sanctuary of serenity where ancient Ayurvedic wisdom meets contemporary wellness practices. Our spa in Alleppey draws from 5,000 years of Kerala healing tradition — every touch, every herb, every ritual attuned to your body's unique needs.
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 mb-6">
                                        {['Abhayangam', 'Shirodhara', 'Kizhi Therapies', 'Body Spa', 'Facials', 'Ayurvedic Rituals'].map((tag) => (
                                            <span key={tag} className="text-xs text-[#403A35] border border-[#BCA06F] bg-[#FCFAF5] px-2.5 py-1">{tag}</span>
                                        ))}
                                    </div>
                                    <a
                                        href="#spa-menu"
                                        onClick={(e) => { e.preventDefault(); document.getElementById('spa-menu')?.scrollIntoView({ behavior: 'smooth' }); }}
                                        className="group relative inline-flex items-center justify-center px-8 py-3.5 border border-[var(--brand-primary-dark)] text-white overflow-hidden transition-colors duration-300 bg-[var(--brand-primary-dark)]"
                                    >
                                        <span className="absolute inset-0 w-full h-full bg-black origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out z-0" />
                                        <span className="relative z-10 text-[11px] tracking-[0.24em] uppercase font-normal">View Full Treatment Menu</span>
                                        <svg className="relative z-10 w-3.5 h-3.5 ml-3 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </motion.div>

                        {/* Treatment Menu */}
                        <div id="spa-menu" className="border-t border-[#E8E0D2] pt-10 md:pt-14">
                            <div className="text-center mb-10 md:mb-12">
                                <div className="flex items-center justify-center gap-6 mb-4">
                                    <span className="w-14 h-[1px] bg-[#BCA06F]/50" />
                                    <span className="text-[#8C7451] text-[10px] tracking-[0.4em] uppercase">Our Offerings</span>
                                    <span className="w-14 h-[1px] bg-[#BCA06F]/50" />
                                </div>
                                <h3 className="font-serif text-2xl md:text-3xl text-[#2C3632]">Treatment Menu</h3>
                                <p className="mt-3 text-[#9E968C] text-sm max-w-xl mx-auto font-light leading-relaxed">
                                    All treatments are tailored to your constitution and may be modified on consultation with our therapists.
                                </p>
                            </div>
                            <div className="max-w-5xl mx-auto space-y-10 md:space-y-12">
                                {spaCategories.map((cat, idx) => (
                                    <CategoryBlock key={cat.id} category={cat} index={idx} />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Marquee Break */}
                <section className="bg-[#FAF8F3] px-6 md:px-10 py-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="border-y border-[#0F2F28] bg-[var(--brand-primary-dark)] overflow-hidden">
                            <div className="py-5 md:py-6">
                                <p className="text-center text-[15px] md:text-[18px] uppercase tracking-[0.42em] text-white/90 font-semibold">
                                    Pool · Gym · Steam & Sauna · Yoga
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Feature Services ─────────────────────────────────────────── */}
                <section className="py-8 md:py-10 px-6 md:px-10">
                    <div className="max-w-[1600px] mx-auto">
                        <div className="text-center mb-10 md:mb-12">
                            <span className="inline-block w-12 h-[1px] bg-[#C6AF84] mb-5" />
                            <h2 className="text-4xl md:text-5xl font-serif text-[#2C3632] tracking-tight">Wellness Facilities</h2>
                        </div>
                        <div className="space-y-8 md:space-y-10">
                            {featureServices.map((service, index) => (
                                <FeatureCard
                                    key={service.key}
                                    service={service}
                                    index={index}
                                    imageUrl={images[`wellness_${service.key}` as keyof WellnessImages]}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Yoga Section ─────────────────────────────────────────────── */}
                <section id="yoga" className="py-12 md:py-16 px-6 md:px-10 bg-[#FAF8F3] scroll-mt-[200px] md:scroll-mt-[220px]">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-6 items-start">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1 }}
                                className="lg:pr-8"
                            >
                                <span className="text-[#BCA06F] text-[10px] md:text-[11px] tracking-[0.4em] uppercase mb-4 block">Find Your Inner Peace</span>
                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-[#2D3732] mb-4 leading-tight">
                                    Yoga &amp; Meditation
                                </h2>
                                <p className="text-[#3E4C45]/75 text-base md:text-lg leading-relaxed mb-8">
                                    Begin your journey inward with our expert yoga practitioners. Set against the tranquil backwaters of Alappuzha, our open-air yoga pavilion offers the perfect setting for mindfulness, pranayama, and spiritual renewal.
                                </p>

                                <div className="border border-[#E6DDCE] bg-[#FCFAF5] px-5 py-4 mb-6">
                                    <p className="text-[10px] tracking-[0.28em] uppercase text-[#6B645C] mb-4">Daily Schedule</p>
                                    <div className="space-y-0">
                                        {yogaOfferings.map((offering, idx) => (
                                            <div key={idx} className="flex justify-between items-center py-3.5 border-b border-[#E8E0D2] last:border-b-0">
                                                <div>
                                                    <p className="text-[#2A2420] text-sm font-medium">{offering.name}</p>
                                                    <p className="text-xs text-[#7A6F64] mt-0.5">{offering.time}</p>
                                                </div>
                                                <span className="text-[10px] uppercase tracking-wider text-[#8C7451] bg-[#BCA06F]/10 px-3 py-1.5 shrink-0 ml-4">
                                                    {offering.level}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Link href="#wellness-form" className="inline-flex items-center gap-4 group">
                                    <span className="text-[#2D3732] text-sm tracking-[0.2em] uppercase font-medium">Reserve a Session</span>
                                    <span className="w-8 h-[1px] bg-[#BCA06F] group-hover:w-14 transition-all duration-300" />
                                </Link>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1 }}
                                className="relative h-[44vh] md:h-[52vh] overflow-hidden bg-[#E8E0D2]"
                            >
                                {images.wellness_yoga ? (
                                    <img src={images.wellness_yoga} alt="Yoga & Meditation" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-[linear-gradient(135deg,var(--brand-primary-deep),var(--brand-primary-dark))]" />
                                )}
                                <div className="absolute bottom-6 left-6 z-10">
                                    <div className="backdrop-blur-md bg-black/25 border border-white/20 text-white text-[10px] tracking-[0.3em] uppercase px-5 py-2.5 rounded-full flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#BCA06F] animate-pulse" />
                                        Mind & Body
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Inquiry Form — Concierge CTA Style */}
                <section id="wellness-form" className="relative py-14 md:py-16 overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,#EFE6D7_0%,#F7F2E8_45%,#EEE4D3_100%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_30%_35%,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0)_60%)]" />
                    <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-10 bg-[#FCFAF5]/92 border border-[#E6DDCE] py-8 md:py-10">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1 }}
                        >
                            <span className="inline-block w-10 h-[1px] bg-[#BFA47A] mb-5" />
                            <p className="text-[#8E7859] text-[10px] tracking-[0.3em] uppercase mb-4">Personalised Wellness</p>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-[#2D3732] mb-3 leading-tight">
                                Reserve Your
                                <span className="block italic text-[#8C7451]">Wellness Experience</span>
                            </h2>
                            <p className="text-[#3F5048]/75 mb-8 font-light text-base md:text-lg max-w-xl leading-relaxed">
                                Share your preferences and our wellness team will curate a personalised spa and wellness itinerary for your stay.
                            </p>
                            <EventInquiryForm />
                        </motion.div>
                    </div>
                </section>

                {/* Bottom CTA Bar */}
                <section className="bg-[#F6F1E7] py-4 px-6 border-t border-[#E6DDCB]">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2.5">
                        <p className="text-[#3E4E47]/85 text-sm">
                            <span className="text-[#A68A5A]">✦</span> Every treatment is tailored to your unique needs
                        </p>
                        <Link
                            href="#wellness-form"
                            className="border border-[#D3C3A7] bg-[#FCFAF5] text-[#31403A] px-6 py-2.5 text-xs tracking-[0.18em] uppercase hover:bg-[#F1E9D9] transition-colors duration-300"
                        >
                            Book a Treatment
                        </Link>
                    </div>
                </section>

            </main>
            <StickyBookButton />
            <WhatsAppWidget />
        </>
    );
}
