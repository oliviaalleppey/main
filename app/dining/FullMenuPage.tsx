'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import StickyBookButton from '@/components/sticky-book-button';
import WhatsAppWidget from '@/components/whatsapp-widget';
import { BREAKFAST, LUNCH_DINNER, BEVERAGES, type MenuItem, type MenuSection } from './full-menu-data';

// ─── Veg / Non-Veg indicators ─────────────────────────────────────────────────

const VEG = () => (
    <span className="inline-flex items-center justify-center w-[15px] h-[15px] border-2 border-green-600 rounded-sm flex-shrink-0">
        <span className="w-[7px] h-[7px] rounded-full bg-green-600" />
    </span>
);

const NONVEG = () => (
    <span className="inline-flex items-center justify-center w-[15px] h-[15px] border-2 border-red-600 rounded-sm flex-shrink-0">
        <span className="w-[7px] h-[7px] rounded-full bg-red-600" />
    </span>
);

// ─── Single item row ──────────────────────────────────────────────────────────

function ItemRow({ item }: { item: MenuItem }) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-[#EDE5D8] last:border-0">
            <div className="mt-[3px] w-[15px] flex-shrink-0">
                {item.type === 'veg' && <VEG />}
                {item.type === 'nonveg' && <NONVEG />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[#26322D] font-medium text-[0.875rem] leading-snug">{item.name}</p>
                {item.desc && (
                    <p className="text-[#7A6A58] text-[0.72rem] mt-0.5 leading-relaxed">{item.desc}</p>
                )}
            </div>
            <p className="text-[#5C3D1E] font-semibold text-[0.875rem] tabular-nums whitespace-nowrap flex-shrink-0 pt-0.5 pl-2">
                ₹{item.price}
            </p>
        </div>
    );
}

// ─── Section block ────────────────────────────────────────────────────────────

function SectionBlock({ section }: { section: MenuSection }) {
    return (
        <div id={`section-${section.id}`} className="scroll-mt-[160px]">
            <div className="flex items-center gap-3 mb-2">
                <span className="w-1 h-5 bg-[#BCA06F] rounded-full" />
                <h3 className="text-[0.65rem] tracking-[0.35em] uppercase text-[#BCA06F] font-semibold">{section.title}</h3>
            </div>
            {section.note && (
                <p className="text-[#8C7A5A] text-[0.72rem] italic mb-3 ml-4">{section.note}</p>
            )}
            <div>
                {section.items.map((item, i) => (
                    <ItemRow key={`${item.name}-${i}`} item={item} />
                ))}
            </div>
        </div>
    );
}

// ─── Sub-section pill nav (Lunch & Dinner) ────────────────────────────────────

const LD_SECTIONS = LUNCH_DINNER.map(s => ({ id: s.id, label: s.title }));

function SectionPillNav({ active }: { active: string }) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scrollTo = (id: string) => {
        const el = document.getElementById(`section-${id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="sticky z-30 bg-[#F5EFE6]/95 backdrop-blur-sm border-b border-[#E4D8C8] py-2"
            style={{ top: 'calc(var(--site-header-height, 62px) + 52px)' }}>
            <div ref={scrollRef} className="overflow-x-auto no-scrollbar px-5 md:px-10">
                <div className="flex gap-2 min-w-max">
                    {LD_SECTIONS.map(s => (
                        <button
                            key={s.id}
                            onClick={() => scrollTo(s.id)}
                            className={`px-3 py-1.5 rounded-full text-[0.65rem] tracking-[0.12em] uppercase whitespace-nowrap border transition-colors duration-200 ${active === s.id
                                ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white'
                                : 'bg-white border-[#DDD3C2] text-[#4A3F33] hover:border-[#BCA06F] hover:text-[#8C6A2E]'
                                }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    outletName: string;
    outletTagline: string;
    hours: string;
}

// ─── Main component ───────────────────────────────────────────────────────────

type Tab = 'breakfast' | 'lunch-dinner' | 'beverages';

export default function FullMenuPage({ outletName, outletTagline, hours }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('breakfast');
    const [activeSection, setActiveSection] = useState(LUNCH_DINNER[0].id);

    // Track which L&D section is in view
    useEffect(() => {
        if (activeTab !== 'lunch-dinner') return;
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter(e => e.isIntersecting);
                if (visible.length > 0) {
                    setActiveSection(visible[0].target.id.replace('section-', ''));
                }
            },
            { rootMargin: '-30% 0px -60% 0px' }
        );
        LUNCH_DINNER.forEach(s => {
            const el = document.getElementById(`section-${s.id}`);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [activeTab]);

    return (
        <>
            <main className="min-h-screen bg-[#FAF8F3]">

                {/* ── Hero ──────────────────────────────────────────────────── */}
                <section className="relative bg-[#1C2E28] overflow-hidden">
                    <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: 'radial-gradient(ellipse at 15% 60%, #C6AF84 0%, transparent 55%), radial-gradient(ellipse at 85% 25%, #BCA06F 0%, transparent 55%)' }}
                    />
                    <div className="relative max-w-5xl mx-auto px-6 py-12 md:py-16">
                        <Link
                            href="/dining"
                            className="inline-flex items-center gap-1.5 text-[#C6AF84]/60 hover:text-[#C6AF84] text-[0.68rem] tracking-[0.3em] uppercase mb-8 transition-colors"
                        >
                            <ArrowLeft className="w-3 h-3" />
                            All Dining Outlets
                        </Link>

                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                            <div>
                                <p className="text-[#C6AF84] text-[0.65rem] tracking-[0.45em] uppercase mb-3">Olivia International · Alappuzha</p>
                                <h1 className="font-serif text-4xl md:text-5xl text-white font-bold tracking-tight leading-tight">{outletName}</h1>
                                <p className="text-white/55 text-sm mt-2 font-light">{outletTagline}</p>
                            </div>
                            <div className="flex flex-col gap-1 md:text-right">
                                <p className="text-[#C6AF84]/70 text-[0.65rem] tracking-[0.3em] uppercase">Operating Hours</p>
                                <p className="text-white/80 text-sm font-light">{hours}</p>
                            </div>
                        </div>

                        <div className="mt-8 flex items-center gap-4">
                            <span className="flex-1 h-[1px] bg-[#C6AF84]/25" />
                            <p className="text-[#C6AF84]/50 text-[0.65rem] tracking-[0.3em] uppercase">À La Carte Menu</p>
                            <span className="flex-1 h-[1px] bg-[#C6AF84]/25" />
                        </div>
                    </div>
                </section>

                {/* ── Tab navigation ────────────────────────────────────────── */}
                <div
                    className="sticky z-40 bg-[#FAF8F3]/95 backdrop-blur-sm border-b border-[#E4D8C8]"
                    style={{ top: 'var(--site-header-height, 62px)' }}
                >
                    <div className="max-w-5xl mx-auto px-5 md:px-10">
                        <div className="flex">
                            {([
                                { key: 'breakfast', label: 'Breakfast', sub: '7:00 – 10:00 am' },
                                { key: 'lunch-dinner', label: 'Lunch & Dinner', sub: '12:30 – 3 pm · 7 – 10:30 pm' },
                                { key: 'beverages', label: 'Beverages', sub: 'All Day' },
                            ] as { key: Tab; label: string; sub: string }[]).map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex-1 py-3 text-center transition-all duration-200 border-b-2 ${activeTab === tab.key
                                        ? 'border-[#BCA06F] text-[#26322D]'
                                        : 'border-transparent text-[#7A6A58] hover:text-[#26322D]'
                                        }`}
                                >
                                    <p className={`text-[0.78rem] font-medium tracking-[0.04em] ${activeTab === tab.key ? 'text-[#26322D]' : ''}`}>{tab.label}</p>
                                    <p className="text-[0.62rem] text-[#9A8A78] mt-0.5 hidden sm:block">{tab.sub}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Section sub-nav (Lunch & Dinner only) ─────────────────── */}
                {activeTab === 'lunch-dinner' && <SectionPillNav active={activeSection} />}

                {/* ── Menu content ──────────────────────────────────────────── */}
                <div className="max-w-5xl mx-auto px-5 md:px-10 py-10 md:py-12">

                    {/* Legend */}
                    <div className="flex items-center gap-6 mb-8 pb-6 border-b border-[#E4D8C8]">
                        <p className="text-[#9A8A78] text-[0.68rem] tracking-[0.22em] uppercase">Guide</p>
                        <div className="flex items-center gap-2"><VEG /><span className="text-[#5A4A38] text-[0.75rem]">Vegetarian</span></div>
                        <div className="flex items-center gap-2"><NONVEG /><span className="text-[#5A4A38] text-[0.75rem]">Non-Vegetarian</span></div>
                    </div>

                    {/* ── BREAKFAST ─────────────────────────────────────────── */}
                    {activeTab === 'breakfast' && (
                        <div className="space-y-10">
                            {BREAKFAST.map(section => (
                                <SectionBlock key={section.id} section={section} />
                            ))}
                        </div>
                    )}

                    {/* ── LUNCH & DINNER ────────────────────────────────────── */}
                    {activeTab === 'lunch-dinner' && (
                        <div className="space-y-12">
                            {LUNCH_DINNER.map((section, idx) => (
                                <div key={section.id}>
                                    {/* Divider with cuisine label between major cuisine groups */}
                                    {[0, 3, 5, 7, 8, 10, 11, 12].includes(idx) && (
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="flex-1 h-[1px] bg-[#DDD3C2]" />
                                            <span className="text-[0.65rem] tracking-[0.35em] uppercase text-[#9A8A78] px-1">
                                                {idx === 0 && 'Salads & Soups'}
                                                {idx === 3 && 'Indian Appetizers'}
                                                {idx === 5 && 'Asian & Western'}
                                                {idx === 7 && 'Pasta'}
                                                {idx === 8 && 'Kerala Cuisine'}
                                                {idx === 10 && 'North Indian Cuisine'}
                                                {idx === 11 && 'Rice & Breads'}
                                                {idx === 12 && 'Desserts'}
                                            </span>
                                            <div className="flex-1 h-[1px] bg-[#DDD3C2]" />
                                        </div>
                                    )}
                                    <SectionBlock section={section} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── BEVERAGES ─────────────────────────────────────────── */}
                    {activeTab === 'beverages' && (
                        <div className="space-y-10">
                            {BEVERAGES.map(section => (
                                <SectionBlock key={section.id} section={section} />
                            ))}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-14 pt-8 border-t border-[#E4D8C8] text-center">
                        <p className="text-[#9A8A78] text-[0.72rem] leading-relaxed">
                            Please inform your server of any food allergies or dietary requirements.<br />
                            All prices are subject to applicable taxes.
                        </p>
                        <div className="mt-6 flex items-center justify-center gap-3">
                            <span className="w-8 h-[1px] bg-[#BCA06F]/50" />
                            <p className="text-[#8C7A5A] text-[0.65rem] tracking-[0.35em] uppercase font-medium">Olivia International · Alappuzha, Kerala</p>
                            <span className="w-8 h-[1px] bg-[#BCA06F]/50" />
                        </div>
                    </div>
                </div>

            </main>
            <StickyBookButton />
            <WhatsAppWidget />
        </>
    );
}
