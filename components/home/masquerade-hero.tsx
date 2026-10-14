'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { CONTACT } from '@/lib/seo';
import { JEWELS } from './masquerade-jewels';
import { MOBILE_JEWELS } from './masquerade-jewels-mobile';

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
        <span className={`inline-block [perspective:700px] ${className}`}>
            <button type="button" onClick={click} className={`masq-btn masq-coin ${flipping ? 'masq-flip' : ''} w-full h-full`}>
                {children}
            </button>
        </span>
    );
}


const MAX_VOLUME = 0.7;

/**
 * Background music for the opener. Browsers only allow sound after a tap or click, so it starts on the
 * visitor's first one. It loops, and fades out slowly as the page scrolls past the opener (and back in on
 * the way up). The speaker button turns it off for good.
 */
function useMasqueradeMusic(sectionRef: React.RefObject<HTMLElement | null>) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [on, setOn] = useState(true); // the visitor's choice
    const [playing, setPlaying] = useState(false);
    const onRef = useRef(true);
    const startedRef = useRef(false);

    useEffect(() => {
        onRef.current = on;
    }, [on]);

    useEffect(() => {
        const audio = new Audio('/audio/masquerade.mp3');
        audio.loop = true;
        audio.preload = 'auto';
        audio.volume = 0;
        audioRef.current = audio;

        let current = 0;
        let raf = 0;

        const target = () => {
            const sec = sectionRef.current;
            if (!sec || !onRef.current || document.hidden) return 0;
            const h = sec.offsetHeight || 1;
            const t = Math.min(1, Math.max(0, (window.scrollY - h * 0.1) / (h * 0.9)));
            return MAX_VOLUME * (1 - t);
        };

        const tick = () => {
            if (startedRef.current) {
                current += (target() - current) * 0.05; // slow glide, in both directions
                if (current < 0.005) {
                    current = 0;
                    if (!audio.paused) audio.pause();
                } else {
                    if (audio.paused && target() > 0.02) audio.play().catch(() => {});
                    audio.volume = Math.min(1, current);
                }
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);

        const start = () => {
            if (startedRef.current || !onRef.current) return;
            audio.volume = 0;
            audio.play().then(() => {
                startedRef.current = true;
                setPlaying(true);
            }).catch(() => {});
        };
        window.addEventListener('pointerdown', start);
        window.addEventListener('keydown', start);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('pointerdown', start);
            window.removeEventListener('keydown', start);
            audio.pause();
            audio.src = '';
        };
    }, [sectionRef]);

    const toggle = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (on) {
            setOn(false);
            onRef.current = false;
        } else {
            setOn(true);
            onRef.current = true;
            if (!startedRef.current) {
                audio.volume = 0;
                audio.play().then(() => {
                    startedRef.current = true;
                    setPlaying(true);
                }).catch(() => {});
            }
        }
    };

    return { on, playing, toggle };
}

export default function MasqueradeHero() {
    const sectionRef = useRef<HTMLElement>(null);
    const music = useMasqueradeMusic(sectionRef);

    return (
        <section
            ref={sectionRef}
            aria-label="The Grand Masquerade, New Year's Eve at Olivia Alleppey"
            className="masq relative w-full overflow-hidden bg-[#0a0608] h-[calc(100vh-var(--site-header-height))] supports-[height:100dvh]:h-[calc(100dvh-var(--site-header-height))] min-h-[520px]"
        >
            {/* Phones: the portrait poster, top-anchored, fading into dark velvet where the buttons sit */}
            <div className="md:hidden absolute inset-0">
                <Image src="/images/masquerade/mobile-poster.webp" alt="" fill sizes="100vw" aria-hidden className="object-cover scale-150 blur-2xl brightness-[0.35] saturate-125" />
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.4, ease: 'easeOut' }}
                    className="[container-type:inline-size] absolute top-0 aspect-[4/5]"
                    style={{ width: '100%', left: 0 }}
                >
                    <Image
                        src="/images/masquerade/mobile-poster.webp"
                        alt="The Grand Masquerade, New Year's Eve at Olivia Alleppey: a gold diamond-set title, a feathered mask and candlelit velvet. Olivia Alleppey is transitioning into Grand Mercure Alleppey, an Accor Hotel."
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover"
                    />
                    {MOBILE_JEWELS.map(([x, y, size], i) => (
                        <span
                            key={i}
                            className="masq-glint"
                            style={{
                                left: `${x}%`,
                                top: `${y}%`,
                                width: `max(${(size * 1.3) / 16}cqw, 9px)`,
                                height: `max(${(size * 1.3) / 16}cqw, 9px)`,
                                animationDuration: `${3 + ((i * 7) % 5) * 0.7}s`,
                                animationDelay: `${((i * 13) % 50) / 10}s`,
                            }}
                        />
                    ))}
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0a0608] via-[#0a0608]/80 to-transparent" />
                </motion.div>
            </div>

            {/* Full-screen picture. Scene box keeps the picture's 16:9 shape, so each glint stays on its diamond. */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4, ease: 'easeOut' }} className="hidden md:block absolute inset-0">
                <div className="[container-type:inline-size] absolute left-1/2 -translate-x-1/2 aspect-[16/9] w-full top-[10%] md:top-1/2 md:-translate-y-1/2 md:w-[max(100vw,calc((100dvh-var(--site-header-height))*1.7778))]">
                    <Image
                        src="/images/masquerade/ballroom.webp"
                        alt="The Grand Masquerade at Olivia Alleppey: a candlelit ballroom and a gold feathered mask on red velvet."
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover"
                    />
                    {JEWELS.map(([x, y, size], i) => (
                        <span
                            key={i}
                            className="masq-glint"
                            style={{
                                left: `${x}%`,
                                top: `${y}%`,
                                width: `max(${(size * 1.4) / 16.71}cqw, 9px)`,
                                height: `max(${(size * 1.4) / 16.71}cqw, 9px)`,
                                animationDuration: `${3 + ((i * 7) % 5) * 0.7}s`,
                                animationDelay: `${((i * 13) % 50) / 10}s`,
                            }}
                        />
                    ))}
                </div>
            </motion.div>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(5,2,3,0.6)_100%)]" />
            <div className="hidden md:block pointer-events-none absolute inset-y-0 left-0 w-[32%] bg-gradient-to-r from-black via-black/70 to-transparent" />
            <div className="hidden md:block pointer-events-none absolute inset-y-0 right-0 w-[32%] bg-gradient-to-l from-black via-black/70 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 md:h-24 bg-gradient-to-t from-black/80 to-transparent" />

            {/* Sound toggle */}
            <button
                type="button"
                onClick={music.toggle}
                aria-label={music.on ? 'Turn the music off' : 'Turn the music on'}
                aria-pressed={music.on}
                className="absolute z-20 top-4 left-4 md:left-auto md:top-5 md:right-6 flex h-10 w-10 items-center justify-center rounded-full border border-[#d9b668]/60 bg-black/50 text-[#f3dc9c] backdrop-blur hover:bg-black/70 transition-colors"
            >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" fill="currentColor" stroke="none" />
                    {music.on ? (
                        <>
                            <path d="M15.5 9a4 4 0 010 6" />
                            <path d="M18 6.5a7.5 7.5 0 010 11" className={music.playing ? '' : 'opacity-40'} />
                        </>
                    ) : (
                        <path d="M16 9.5l5 5M21 9.5l-5 5" />
                    )}
                </svg>
            </button>

            {/* Buttons, straight on the picture */}
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="absolute inset-x-0 bottom-0 md:top-0 z-10 flex flex-col-reverse md:flex-row md:items-end md:justify-between gap-3 px-4 pb-5 md:px-8 md:pb-[27vh] md:pointer-events-none [&>*]:pointer-events-auto"
            >
                {/* Left: every other date */}
                <CoinButton onFlipped={() => scrollPastHero(sectionRef.current)} className="h-14">
                    <span className="flex h-full items-center justify-center px-8 text-xs uppercase tracking-[0.28em] font-medium text-[#1a0d06]">
                        Other Dates
                    </span>
                </CoinButton>

                {/* Right: the 31st, set big on its own, with a compact price button under it */}
                <div className="flex flex-col items-center md:items-end gap-2 md:gap-3">
                    <div className="flex flex-col items-center md:items-end leading-none">
                        <span
                            className="masq-gold font-bold leading-[0.85] text-[5.5rem] md:text-[7rem] xl:text-[9.5rem] tracking-tight"
                            style={{ fontFamily: 'var(--font-cinzel), serif' }}
                        >
                            31<span className="align-top text-[2rem] md:text-[2.5rem] xl:text-[3.5rem] tracking-normal ml-1">st</span>
                        </span>
                        <span className="mt-2 text-[10px] md:text-xs uppercase tracking-[0.45em] text-[#f3dc9c]" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
                            December &middot; Thursday
                        </span>
                    </div>
                    <a
                        href={`https://wa.me/${CONTACT.phone.replace(/[^0-9]/g, '')}?text=${BOOK_MESSAGE}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Book the 31st Night, 31 December, for ₹49,999"
                        className="masq-btn flex items-center justify-center gap-3 px-6 h-14 text-[#1a0d06] w-full md:w-auto"
                    >
                        <span className="font-serif font-bold text-2xl md:text-3xl tabular-nums leading-none">&#8377;49,999</span>
                        <span className="h-6 w-px bg-[#1a0d06]/35" />
                        <span className="text-[11px] uppercase tracking-[0.25em] font-semibold">
                            Book Now <span aria-hidden>&rarr;</span>
                        </span>
                    </a>
                </div>
            </motion.div>

            <style>{`
                .masq-gold {
                    background: linear-gradient(180deg, #fff6d8 0%, #f0cf7a 40%, #b8883f 100%);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    filter: drop-shadow(0 2px 14px rgba(0,0,0,.7)) drop-shadow(0 0 22px rgba(240,200,110,.35));
                }
                .masq-btn {
                    background: linear-gradient(135deg, #f3dc9c 0%, #d9b668 45%, #b68845 100%);
                    box-shadow: 0 0 26px rgba(217,182,104,0.35);
                    transition: box-shadow .3s, filter .3s;
                    position: relative;
                    overflow: hidden;
                    text-align: center;
                    display: inline-block;
                    white-space: nowrap;
                }
                a.masq-btn { display: flex; }
                .masq-btn::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%);
                    transform: translateX(-120%);
                    animation: masq-btn-shine 4.5s ease-in-out infinite;
                    pointer-events: none;
                }
                @keyframes masq-btn-shine { 0%, 60% { transform: translateX(-120%); } 100% { transform: translateX(120%); } }
                .masq-btn:hover { filter: brightness(1.08); box-shadow: 0 0 40px rgba(217,182,104,0.65); }
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
                        radial-gradient(circle, #fff 0 14%, rgba(255,250,225,1) 20%, rgba(255,230,150,.5) 38%, transparent 60%),
                        linear-gradient(90deg, transparent 0, #fff 50%, transparent 100%) center / 100% 9% no-repeat,
                        linear-gradient(0deg, transparent 0, #fff 50%, transparent 100%) center / 9% 100% no-repeat;
                    filter: brightness(1.15) drop-shadow(0 0 3px #fff) drop-shadow(0 0 8px rgba(255,225,140,.85));
                    animation: masq-twinkle ease-in-out infinite;
                }
                @keyframes masq-twinkle {
                    0%, 70%, 100% { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 0; }
                    81% { transform: translate(-50%, -50%) scale(1) rotate(45deg); opacity: 1; }
                    92% { transform: translate(-50%, -50%) scale(.35) rotate(90deg); opacity: .5; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .masq-btn::after, .masq-flip { animation: none; }
                    .masq-glint { animation: none; transform: translate(-50%, -50%) scale(.5); opacity: .6; }
                }
            `}</style>
        </section>
    );
}
