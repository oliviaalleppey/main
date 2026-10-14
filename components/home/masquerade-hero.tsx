'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { CONTACT } from '@/lib/seo';
import { JEWELS } from './masquerade-jewels';

const BOOK_MESSAGE = encodeURIComponent(
    "Hello Olivia Alleppey, I would like to book The Grand Masquerade, 31st Night (₹49,999)."
);

// Fixed values so server and client render the same markup.
const SPARKS = Array.from({ length: 22 }, (_, i) => ({
    left: `${(i * 37 + 11) % 100}%`,
    size: 2 + (i % 3),
    delay: `${(i * 0.9) % 9}s`,
    duration: `${9 + (i % 6) * 2}s`,
}));

function scrollPastHero(section: HTMLElement | null) {
    if (!section) return;
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--site-header-height')) || 62;
    const top = section.getBoundingClientRect().bottom + window.scrollY - header;
    window.scrollTo({ top, behavior: 'smooth' });
}

function CoinButton({
    children,
    onFlipped,
    className = '',
}: {
    children: React.ReactNode;
    onFlipped: () => void;
    className?: string;
}) {
    const [flipping, setFlipping] = useState(false);
    const click = () => {
        if (flipping) return;
        setFlipping(true);
        setTimeout(onFlipped, 750);
        setTimeout(() => setFlipping(false), 1100);
    };
    return (
        <span className="inline-block [perspective:700px]">
            <button
                type="button"
                onClick={click}
                className={`masq-btn masq-coin ${flipping ? 'masq-flip' : ''} ${className}`}
            >
                {children}
            </button>
        </span>
    );
}

function NightOffer() {
    return (
        <>
            <span className="masq-gold font-serif font-semibold uppercase tracking-[0.25em] text-base">31st Night</span>
            <span className="masq-gold font-serif font-semibold text-4xl leading-none tabular-nums">&#8377;49,999</span>
            <a
                href={`https://wa.me/${CONTACT.phone.replace(/[^0-9]/g, '')}?text=${BOOK_MESSAGE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="masq-btn mt-2 w-full px-9 py-3.5 text-xs uppercase tracking-[0.3em] font-medium text-[#1a0d06]"
            >
                Book Now
            </a>
        </>
    );
}

export default function MasqueradeHero() {
    const sectionRef = useRef<HTMLElement>(null);
    const sceneRef = useRef<HTMLDivElement>(null);
    const [trail, setTrail] = useState<{ id: number; x: number; y: number }[]>([]);
    const last = useRef(0);
    const idRef = useRef(0);

    const onMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
        const sec = sectionRef.current;
        if (!sec || e.pointerType === 'touch') return;
        const r = sec.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        // Parallax: the hall drifts gently against the pointer.
        if (sceneRef.current) {
            sceneRef.current.style.transform = `translate(calc(-50% + ${px * -18}px), calc(-50% + ${py * -12}px)) scale(1.04)`;
        }
        // Gold dust follows the cursor.
        const now = performance.now();
        if (now - last.current < 70) return;
        last.current = now;
        const id = ++idRef.current;
        setTrail((t) => [...t.slice(-11), { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
        setTimeout(() => setTrail((t) => t.filter((p) => p.id !== id)), 800);
    }, []);

    return (
        <section
            ref={sectionRef}
            onPointerMove={onMove}
            aria-label="The Grand Masquerade, New Year's Eve at Olivia Alleppey"
            className="masq relative w-full overflow-hidden bg-[#0b0507] flex flex-col md:block min-h-[calc(100vh-var(--site-header-height))] supports-[height:100dvh]:min-h-[calc(100dvh-var(--site-header-height))] md:h-[calc(100vh-var(--site-header-height))] md:supports-[height:100dvh]:h-[calc(100dvh-var(--site-header-height))]"
        >
            {/* Phones: blurred fill behind the picture and the panel below it */}
            <Image
                src="/images/masquerade/hall.webp"
                alt=""
                fill
                sizes="100vw"
                aria-hidden
                className="md:hidden object-cover scale-125 blur-xl brightness-50"
            />

            {/* Phone: the picture at its own shape. Desktop: it fills the screen. */}
            <div className="relative z-10 w-full aspect-[16/9] md:absolute md:inset-0 md:aspect-auto overflow-hidden">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.8, ease: 'easeOut' }}
                    className="absolute inset-0"
                >
                    {/* Scene box: always 16:9 and always covering, so glints sit on the jewels */}
                    <div
                        ref={sceneRef}
                        className="masq-scene [container-type:inline-size] absolute left-1/2 top-1/2 aspect-[16/9] w-full md:w-[max(100vw,calc((100vh-var(--site-header-height))*1.7778))]"
                        style={{ transform: 'translate(-50%, -50%) scale(1.04)' }}
                    >
                        <Image
                            src="/images/masquerade/hall.webp"
                            alt="The Grand Masquerade at Olivia Alleppey: a candlelit ballroom and a gold feathered mask on red velvet."
                            fill
                            priority
                            sizes="100vw"
                            className="object-cover"
                        />
                        {/* Each diamond has its own glint: some twinkle on their own beat,
                            the rest catch a light that travels across the title */}
                        {JEWELS.map(([x, y, size], i) => {
                            const sweep = i % 2 === 0;
                            return (
                                <span
                                    key={i}
                                    className="masq-glint"
                                    style={{
                                        left: `${x}%`,
                                        top: `${y}%`,
                                        width: `max(${(size * 0.9) / 16.71}cqw, 7px)`,
                                        height: `max(${(size * 0.9) / 16.71}cqw, 7px)`,
                                        animationDuration: sweep ? '6s' : `${2.6 + ((i * 7) % 5) * 0.6}s`,
                                        animationDelay: sweep ? `${(x / 100) * 3.2}s` : `${((i * 13) % 40) / 10}s`,
                                    }}
                                />
                            );
                        })}
                    </div>
                </motion.div>
                <div className="hidden md:block absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(5,2,3,0.65)_100%)] pointer-events-none" />
            </div>

            {/* Gold dust following the cursor */}
            {trail.map((p) => (
                <span key={p.id} className="masq-trail" style={{ left: p.x, top: p.y }} />
            ))}

            {/* Left (desktop): one button for every other date */}
            <motion.div
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 1 }}
                className="hidden md:flex absolute z-20 left-6 xl:left-14 bottom-10"
            >
                <CoinButton onFlipped={() => scrollPastHero(sectionRef.current)} className="px-9 py-4 text-xs uppercase tracking-[0.3em] font-medium text-[#1a0d06]">
                    Other Dates
                </CoinButton>
            </motion.div>

            {/* Right (desktop): the 31st Night */}
            <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 1 }}
                className="hidden md:flex absolute z-20 right-6 xl:right-14 bottom-10 flex-col items-center gap-3 px-8 py-6 bg-black/55 backdrop-blur-md border border-[#d9b668]/30"
            >
                <NightOffer />
            </motion.div>

            {/* Below the picture (mobile / tablet) */}
            <div className="relative z-10 md:hidden flex flex-col items-center gap-6 px-4 pb-8 pt-6 w-full">
                <div className="flex flex-col items-center gap-3 px-8 py-6 bg-black/55 border border-[#d9b668]/30 w-full max-w-xs">
                    <NightOffer />
                </div>
                <CoinButton onFlipped={() => scrollPastHero(sectionRef.current)} className="w-full max-w-xs py-4 text-xs uppercase tracking-[0.3em] font-medium text-[#1a0d06]">
                    Other Dates
                </CoinButton>
            </div>

            {/* Floating gold dust */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden z-20" aria-hidden>
                {SPARKS.map((s, i) => (
                    <span
                        key={i}
                        className="masq-spark"
                        style={{
                            left: s.left,
                            width: s.size,
                            height: s.size,
                            animationDelay: s.delay,
                            animationDuration: s.duration,
                        }}
                    />
                ))}
            </div>

            <style>{`
                .masq-gold {
                    background: linear-gradient(180deg, #fff3cf 0%, #e6c36f 45%, #a97e3f 100%);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                }
                .masq-btn {
                    background: linear-gradient(135deg, #f3dc9c 0%, #d9b668 45%, #b68845 100%);
                    box-shadow: 0 0 28px rgba(217,182,104,0.35);
                    transition: box-shadow .3s, filter .3s;
                    position: relative;
                    overflow: hidden;
                    text-align: center;
                    display: inline-block;
                }
                .masq-btn::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.65) 50%, transparent 65%);
                    transform: translateX(-120%);
                    animation: masq-btn-shine 3.6s ease-in-out infinite;
                }
                @keyframes masq-btn-shine { 0%, 55% { transform: translateX(-120%); } 100% { transform: translateX(120%); } }
                .masq-btn:hover { filter: brightness(1.08); box-shadow: 0 0 44px rgba(217,182,104,0.65); }
                .masq-coin { transform-style: preserve-3d; }
                .masq-flip { animation: masq-coin 0.9s cubic-bezier(.3,.1,.3,1); }
                @keyframes masq-coin {
                    0% { transform: rotateY(0) scale(1); }
                    50% { transform: rotateY(540deg) scale(1.12); }
                    100% { transform: rotateY(720deg) scale(1); }
                }
                .masq-scene { transition: transform 0.35s ease-out; will-change: transform; }
                .masq-glint {
                    position: absolute;
                    transform: translate(-50%, -50%) scale(0) rotate(0deg);
                    pointer-events: none;
                    mix-blend-mode: screen;
                    background:
                        radial-gradient(circle, #fff 0 8%, rgba(255,244,205,0.9) 12%, transparent 32%),
                        linear-gradient(90deg, transparent 0, #fff8e0 50%, transparent 100%) center / 100% 7% no-repeat,
                        linear-gradient(0deg, transparent 0, #fff8e0 50%, transparent 100%) center / 7% 100% no-repeat;
                    filter: drop-shadow(0 0 6px rgba(255,236,170,0.95));
                    animation: masq-twinkle ease-in-out infinite;
                }
                @keyframes masq-twinkle {
                    0%, 78%, 100% { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 0; }
                    86% { transform: translate(-50%, -50%) scale(1) rotate(45deg); opacity: 1; }
                    94% { transform: translate(-50%, -50%) scale(0.4) rotate(90deg); opacity: .7; }
                }
                .masq-trail {
                    position: absolute;
                    z-index: 30;
                    width: 10px;
                    height: 10px;
                    pointer-events: none;
                    transform: translate(-50%, -50%);
                    background:
                        radial-gradient(circle, #fff 0 15%, rgba(255,240,190,.9) 25%, transparent 60%),
                        linear-gradient(90deg, transparent, #fff3c4, transparent) center / 100% 12% no-repeat,
                        linear-gradient(0deg, transparent, #fff3c4, transparent) center / 12% 100% no-repeat;
                    filter: drop-shadow(0 0 5px rgba(255,226,150,.9));
                    animation: masq-trail .8s ease-out forwards;
                }
                @keyframes masq-trail {
                    from { opacity: 1; transform: translate(-50%, -50%) scale(1.4) rotate(0); }
                    to { opacity: 0; transform: translate(-50%, 18px) scale(.2) rotate(120deg); }
                }
                .masq-spark {
                    position: absolute;
                    bottom: -10px;
                    border-radius: 9999px;
                    background: #f0d58c;
                    box-shadow: 0 0 8px 2px rgba(240,213,140,0.7);
                    opacity: 0;
                    animation: masq-rise linear infinite;
                }
                @keyframes masq-rise {
                    0% { transform: translateY(0) translateX(0); opacity: 0; }
                    10% { opacity: .9; }
                    90% { opacity: .6; }
                    100% { transform: translateY(-110vh) translateX(24px); opacity: 0; }
                }
                .masq-chevron { animation: masq-bob 1.8s ease-in-out infinite; }
                @keyframes masq-bob { 50% { transform: translateY(5px) rotate(45deg); } }
                @media (prefers-reduced-motion: reduce) {
                    .masq-spark, .masq-chevron, .masq-btn::after, .masq-flip { animation: none; }
                    .masq-spark, .masq-trail { display: none; }
                    .masq-glint { animation: none; transform: translate(-50%, -50%) scale(.5); opacity: .7; }
                }
            `}</style>
        </section>
    );
}
