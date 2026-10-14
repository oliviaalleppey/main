'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { CONTACT } from '@/lib/seo';

const WHATSAPP_MESSAGE = encodeURIComponent(
    "Hello Olivia Alleppey, I would like to reserve for The Grand Masquerade on 31st December."
);

// Fixed positions so server and client render the same markup.
const SPARKS = Array.from({ length: 22 }, (_, i) => ({
    left: `${(i * 37 + 11) % 100}%`,
    size: 2 + (i % 3),
    delay: `${(i * 0.9) % 9}s`,
    duration: `${9 + (i % 6) * 2}s`,
}));

function StayForm({ className = '' }: { className?: string }) {
    const router = useRouter();
    const today = format(new Date(), 'yyyy-MM-dd');
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [adults, setAdults] = useState(2);
    const [error, setError] = useState<string | null>(null);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!checkIn || !checkOut || checkOut <= checkIn) {
            setError('Choose check-in and a later check-out date');
            return;
        }
        const params = new URLSearchParams({ checkIn, checkOut, adults: String(adults), children: '0' });
        router.push(`/book/search?${params.toString()}`);
    };

    const field =
        'w-full bg-black/40 border border-[#d9b668]/40 text-[#f3e3b5] text-sm px-3 py-2.5 [color-scheme:dark] focus:outline-none focus:border-[#d9b668]';
    const label = 'block mb-1.5 text-[9px] uppercase tracking-[0.25em] text-[#d9b668]/70';

    return (
        <form onSubmit={submit} className={className}>
            <div>
                <label className={label} htmlFor="masq-in">Check-in</label>
                <input id="masq-in" type="date" min={today} value={checkIn} className={field}
                    onChange={(e) => { setCheckIn(e.target.value); setError(null); if (checkOut && e.target.value >= checkOut) setCheckOut(''); }} />
            </div>
            <div>
                <label className={label} htmlFor="masq-out">Check-out</label>
                <input id="masq-out" type="date" min={checkIn || today} value={checkOut} className={field}
                    onChange={(e) => { setCheckOut(e.target.value); setError(null); }} />
            </div>
            <div>
                <label className={label} htmlFor="masq-guests">Guests</label>
                <select id="masq-guests" value={adults} onChange={(e) => setAdults(Number(e.target.value))} className={field}>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>{n} {n === 1 ? 'adult' : 'adults'}</option>
                    ))}
                </select>
            </div>
            <button type="submit" className="masq-btn px-7 py-3.5 text-[11px] uppercase tracking-[0.3em] font-medium text-[#1a0d06]">
                Check Availability
            </button>
            {error && <p role="alert" className="text-xs text-[#f0a0a0] text-center">{error}</p>}
        </form>
    );
}

function Actions({ className = '' }: { className?: string }) {
    return (
        <div className={className}>
            <a
                href={`https://wa.me/${CONTACT.phone.replace(/[^0-9]/g, '')}?text=${WHATSAPP_MESSAGE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="masq-btn text-center px-7 py-3.5 text-[11px] uppercase tracking-[0.3em] font-medium text-[#1a0d06]"
            >
                Reserve Your Evening
            </a>
            <a
                href={`tel:${CONTACT.phone}`}
                className="text-center px-7 py-3.5 text-[11px] uppercase tracking-[0.3em] text-[#e8cf94] border border-[#d9b668]/50 hover:bg-[#d9b668]/10 transition-colors"
            >
                Call {CONTACT.phoneDisplay}
            </a>
        </div>
    );
}

export default function MasqueradeHero() {
    return (
        <section
            aria-label="The Grand Masquerade, New Year's Eve at Olivia Alleppey"
            className="masq relative w-full overflow-hidden bg-[#0b0507] flex flex-col lg:flex-row items-center lg:justify-center min-h-[calc(100vh-var(--site-header-height))] supports-[height:100dvh]:min-h-[calc(100dvh-var(--site-header-height))] lg:h-[calc(100vh-var(--site-header-height))] lg:supports-[height:100dvh]:h-[calc(100dvh-var(--site-header-height))]"
        >
            {/* Ambient glow: the same corridor, blurred, fills the space around the invitation */}
            <Image
                src="/images/masquerade/ambient.webp"
                alt=""
                fill
                sizes="100vw"
                aria-hidden
                className="object-cover scale-125 blur-xl brightness-75 saturate-125"
            />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(5,2,3,0.8)_100%)]" />

            {/* Left: countdown (desktop) */}
            <motion.div
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 1 }}
                className="relative z-10 hidden lg:flex flex-1 flex-col items-center gap-8"
            >
                <span className="text-[10px] uppercase tracking-[0.4em] text-[#d9b668]/80">Stay with us on other dates</span>
                <StayForm className="flex flex-col gap-4 w-64" />
            </motion.div>

            {/* The invitation */}
            <motion.div
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.6, ease: 'easeOut' }}
                className="relative z-10 shrink-0 w-full max-w-[560px] aspect-[4/5] lg:max-w-none lg:w-auto lg:h-full"
            >
                <Image
                    src="/images/masquerade/poster.webp"
                    alt="The Grand Masquerade, the Grand New Year's Eve at Olivia Alleppey. Thursday 31 December, check-in 2:00 PM."
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 80vh"
                    className="object-cover"
                />
                {/* Diamond shimmer sweeping over the title */}
                <div className="masq-sheen pointer-events-none absolute inset-x-[12%] top-[10%] h-[34%]" />
                <div className="pointer-events-none absolute inset-2 lg:inset-3 border border-[#d9b668]/40" />
            </motion.div>

            {/* Right: reserve (desktop) */}
            <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 1 }}
                className="relative z-10 hidden lg:flex flex-1 flex-col items-center gap-6"
            >
                <span className="text-[10px] uppercase tracking-[0.4em] text-[#d9b668]/80">Join us on 31 December</span>
                <Actions className="flex flex-col gap-3 w-64" />
            </motion.div>

            {/* Below the invitation (mobile / tablet) */}
            <div className="relative z-10 lg:hidden flex flex-col items-center gap-5 px-4 py-6 w-full">
                <Actions className="flex flex-col gap-3 w-full max-w-xs" />
                <span className="mt-2 text-[10px] uppercase tracking-[0.4em] text-[#d9b668]/80">Stay with us on other dates</span>
                <StayForm className="flex flex-col gap-4 w-full max-w-xs" />
                <p className="mt-2 text-[9px] uppercase tracking-[0.35em] text-[#d9b668]/60">Scroll to explore Olivia</p>
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

            {/* Scroll cue */}
            <button
                type="button"
                onClick={(e) => {
                    const el = e.currentTarget.closest('section');
                    if (el) window.scrollTo({ top: el.getBoundingClientRect().bottom + window.scrollY, behavior: 'smooth' });
                }}
                className="hidden lg:flex absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex-col items-center gap-1 text-[9px] uppercase tracking-[0.35em] text-[#d9b668]/70 hover:text-[#d9b668] transition-colors"
            >
                Discover Olivia
                <span className="masq-chevron block w-2 h-2 border-b border-r border-current rotate-45" />
            </button>

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
                }
                .masq-btn:hover { filter: brightness(1.08); box-shadow: 0 0 40px rgba(217,182,104,0.6); }
                .masq-sheen {
                    background: linear-gradient(105deg, transparent 40%, rgba(255,246,214,0.35) 50%, transparent 60%);
                    background-size: 250% 100%;
                    mix-blend-mode: soft-light;
                    animation: masq-sheen 6s ease-in-out infinite;
                }
                @keyframes masq-sheen {
                    0%, 55% { background-position: 150% 0; }
                    100% { background-position: -50% 0; }
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
                    .masq-sheen, .masq-spark, .masq-chevron { animation: none; }
                    .masq-spark { display: none; }
                }
            `}</style>
        </section>
    );
}
