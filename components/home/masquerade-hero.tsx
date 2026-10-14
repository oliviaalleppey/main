'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { CONTACT } from '@/lib/seo';
import { JEWELS } from './masquerade-jewels';

const BOOK_MESSAGE = encodeURIComponent(
    "Hello Olivia Alleppey, I would like to book The Grand Masquerade, 31st Night (₹49,999)."
);

function scrollPastHero(section: HTMLElement | null) {
    if (!section) return;
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--site-header-height')) || 62;
    window.scrollTo({ top: section.getBoundingClientRect().bottom + window.scrollY - header, behavior: 'smooth' });
}

function CoinButton({ children, onFlipped, className = '' }: { children: React.ReactNode; onFlipped: () => void; className?: string }) {
    const [flipping, setFlipping] = useState(false);
    const click = () => {
        if (flipping) return;
        setFlipping(true);
        setTimeout(onFlipped, 750);
        setTimeout(() => setFlipping(false), 1100);
    };
    return (
        <span className="inline-block [perspective:700px]">
            <button type="button" onClick={click} className={`masq-btn masq-coin ${flipping ? 'masq-flip' : ''} ${className}`}>
                {children}
            </button>
        </span>
    );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.32em] text-[#d9b668]/80">{label}</span>
            <span className="font-serif text-xl md:text-2xl text-[#f3e3b5] leading-tight">{children}</span>
        </div>
    );
}

export default function MasqueradeHero() {
    const sectionRef = useRef<HTMLElement>(null);

    return (
        <section
            ref={sectionRef}
            aria-label="The Grand Masquerade, New Year's Eve at Olivia Alleppey"
            className="masq relative w-full bg-[#0a0608] flex flex-col md:h-[calc(100vh-var(--site-header-height))] md:supports-[height:100dvh]:h-[calc(100dvh-var(--site-header-height))] [--bar:0px] md:[--bar:116px]"
        >
            {/* The hall */}
            <div className="relative w-full aspect-[16/9] md:aspect-auto md:flex-1 overflow-hidden">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4, ease: 'easeOut' }} className="absolute inset-0">
                    {/* Scene box: always 16:9 and always covering, so each glint sits on its diamond */}
                    <div className="[container-type:inline-size] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 aspect-[16/9] w-full md:w-[max(100vw,calc((100dvh-var(--site-header-height)-var(--bar))*1.7778))]">
                        <Image
                            src="/images/masquerade/hall.webp"
                            alt="The Grand Masquerade at Olivia Alleppey: a candlelit ballroom and a gold feathered mask on red velvet."
                            fill
                            priority
                            sizes="100vw"
                            className="object-cover"
                        />
                        {JEWELS.map(([x, y, size], i) => {
                            const sweep = i % 2 === 0;
                            return (
                                <span
                                    key={i}
                                    className="masq-glint"
                                    style={{
                                        left: `${x}%`,
                                        top: `${y}%`,
                                        width: `max(${(size * 1.4) / 16.71}cqw, 10px)`,
                                        height: `max(${(size * 1.4) / 16.71}cqw, 10px)`,
                                        animationDuration: sweep ? '5.5s' : `${2.4 + ((i * 7) % 5) * 0.6}s`,
                                        animationDelay: sweep ? `${(x / 100) * 3.2}s` : `${((i * 13) % 40) / 10}s`,
                                    }}
                                />
                            );
                        })}
                    </div>
                </motion.div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[8%] bg-gradient-to-t from-[#0a0608] to-transparent" />
            </div>

            {/* The details bar */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.9 }}
                className="relative border-t border-[#d9b668]/50 bg-[#0a0608] px-5 md:px-10 xl:px-16 py-6 md:py-0 md:h-[var(--bar)]"
            >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f3dc9c] to-transparent" />
                <div className="mx-auto max-w-7xl h-full grid gap-6 md:gap-0 grid-cols-2 md:grid-cols-[1fr_1fr_1fr_auto] items-center">
                    <div className="md:pr-8"><Detail label="Date">Thursday, 31 December</Detail></div>
                    <div className="md:px-8 md:border-l border-[#d9b668]/25"><Detail label="Check-in">2:00 PM</Detail></div>
                    <div className="col-span-2 md:col-span-1 md:px-8 md:border-l border-[#d9b668]/25">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] uppercase tracking-[0.32em] text-[#d9b668]/80">The 31st Night</span>
                            <span className="masq-gold font-serif font-semibold text-3xl md:text-4xl leading-none tabular-nums">&#8377;49,999</span>
                        </div>
                    </div>
                    <div className="col-span-2 md:col-span-1 md:pl-8 md:border-l border-[#d9b668]/25 flex flex-col sm:flex-row gap-3">
                        <a
                            href={`https://wa.me/${CONTACT.phone.replace(/[^0-9]/g, '')}?text=${BOOK_MESSAGE}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="masq-btn px-8 py-3.5 text-xs uppercase tracking-[0.28em] font-medium text-[#1a0d06]"
                        >
                            Book Now
                        </a>
                        <CoinButton onFlipped={() => scrollPastHero(sectionRef.current)} className="w-full sm:w-auto px-8 py-3.5 text-xs uppercase tracking-[0.28em] font-medium text-[#1a0d06]">
                            Other Dates
                        </CoinButton>
                    </div>
                </div>
            </motion.div>

            <style>{`
                .masq-gold {
                    background: linear-gradient(180deg, #fff3cf 0%, #e6c36f 45%, #a97e3f 100%);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                }
                .masq-btn {
                    background: linear-gradient(135deg, #f3dc9c 0%, #d9b668 45%, #b68845 100%);
                    box-shadow: 0 0 22px rgba(217,182,104,0.25);
                    transition: box-shadow .3s, filter .3s;
                    position: relative;
                    overflow: hidden;
                    text-align: center;
                    display: inline-block;
                    white-space: nowrap;
                }
                .masq-btn::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%);
                    transform: translateX(-120%);
                    animation: masq-btn-shine 4.5s ease-in-out infinite;
                }
                @keyframes masq-btn-shine { 0%, 60% { transform: translateX(-120%); } 100% { transform: translateX(120%); } }
                .masq-btn:hover { filter: brightness(1.08); box-shadow: 0 0 36px rgba(217,182,104,0.55); }
                .masq-coin { transform-style: preserve-3d; }
                .masq-flip { animation: masq-coin 0.9s cubic-bezier(.3,.1,.3,1); }
                @keyframes masq-coin {
                    0% { transform: rotateY(0) scale(1); }
                    50% { transform: rotateY(540deg) scale(1.12); }
                    100% { transform: rotateY(720deg) scale(1); }
                }
                .masq-glint {
                    position: absolute;
                    transform: translate(-50%, -50%) scale(0) rotate(0deg);
                    pointer-events: none;
                    mix-blend-mode: screen;
                    background:
                        radial-gradient(circle, #fff 0 14%, rgba(255,250,225,1) 20%, rgba(255,230,150,.55) 38%, transparent 60%),
                        linear-gradient(90deg, transparent 0, #fff 50%, transparent 100%) center / 100% 9% no-repeat,
                        linear-gradient(0deg, transparent 0, #fff 50%, transparent 100%) center / 9% 100% no-repeat;
                    filter: brightness(1.2) drop-shadow(0 0 3px #fff) drop-shadow(0 0 9px rgba(255,225,140,.9));
                    animation: masq-twinkle ease-in-out infinite;
                }
                @keyframes masq-twinkle {
                    0%, 68%, 100% { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 0; }
                    80% { transform: translate(-50%, -50%) scale(1) rotate(45deg); opacity: 1; }
                    92% { transform: translate(-50%, -50%) scale(.35) rotate(90deg); opacity: .6; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .masq-btn::after, .masq-flip { animation: none; }
                    .masq-glint { animation: none; transform: translate(-50%, -50%) scale(.5); opacity: .7; }
                }
            `}</style>
        </section>
    );
}
