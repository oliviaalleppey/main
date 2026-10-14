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
            className="masq relative w-full overflow-hidden bg-[#0b0507] flex flex-col lg:block min-h-[calc(100vh-var(--site-header-height))] supports-[height:100dvh]:min-h-[calc(100dvh-var(--site-header-height))] lg:h-[calc(100vh-var(--site-header-height))] lg:supports-[height:100dvh]:h-[calc(100dvh-var(--site-header-height))]"
        >
            {/* Phones: blurred fill behind the picture and the panel below it */}
            <Image
                src="/images/masquerade/landscape.webp"
                alt=""
                fill
                sizes="100vw"
                aria-hidden
                className="lg:hidden object-cover scale-125 blur-xl brightness-50"
            />

            {/* The scene: full-bleed landscape on desktop, full width on phones */}
            <motion.div
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.8, ease: 'easeOut' }}
                className="relative z-10 w-full aspect-[16/9] lg:absolute lg:inset-0 lg:aspect-auto"
            >
                <Image
                    src="/images/masquerade/landscape.webp"
                    alt="The Grand Masquerade at Olivia Alleppey: a candlelit ballroom, a gold feathered mask on red velvet."
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                />
                <div className="hidden lg:block absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(5,2,3,0.65)_100%)]" />
                <div className="masq-sheen pointer-events-none absolute inset-x-[22%] top-[14%] h-[34%]" />
            </motion.div>

            {/* Date line, set in the same serif as the title */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 1 }}
                className="relative z-20 lg:hidden text-center px-4 pt-6"
            >
                <p className="masq-gold font-serif font-semibold uppercase tracking-[0.3em] text-sm md:text-lg">
                    The Grand New Year&rsquo;s Eve
                </p>
                <p className="mt-1 font-serif font-semibold uppercase tracking-[0.25em] text-[#e8cf94] text-xs md:text-sm">
                    Thursday &middot; 31 December &middot; Check-in 2:00 PM
                </p>
            </motion.div>

            {/* Left: stay on other dates (desktop) */}
            <motion.div
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 1 }}
                className="hidden lg:flex absolute z-20 left-8 xl:left-14 top-1/2 -translate-y-1/2 flex-col items-center gap-5 p-6 bg-black/55 backdrop-blur-md border border-[#d9b668]/30"
            >
                <span className="masq-gold font-serif font-semibold uppercase tracking-[0.25em] text-base">Other Dates</span>
                <StayForm className="flex flex-col gap-4 w-60" />
            </motion.div>

            {/* Right: reserve the evening (desktop) */}
            <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 1 }}
                className="hidden lg:flex absolute z-20 right-8 xl:right-14 top-1/2 -translate-y-1/2 flex-col items-center gap-5 p-6 bg-black/55 backdrop-blur-md border border-[#d9b668]/30"
            >
                <span className="masq-gold font-serif font-semibold uppercase tracking-[0.25em] text-base">31 December</span>
                <p className="-mt-3 text-center font-serif font-semibold uppercase tracking-[0.2em] text-[#e8cf94] text-xs leading-relaxed">
                    Thursday<br />Check-in 2:00 PM
                </p>
                <Actions className="flex flex-col gap-3 w-60" />
            </motion.div>

            {/* Below the picture (mobile / tablet) */}
            <div className="relative z-10 lg:hidden flex flex-col items-center gap-5 px-4 pb-8 pt-4 w-full">
                <Actions className="flex flex-col gap-3 w-full max-w-xs" />
                <span className="masq-gold mt-3 font-serif font-semibold uppercase tracking-[0.25em] text-base">Other Dates</span>
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
                className="hidden lg:flex absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex-col items-center gap-1 text-[9px] uppercase tracking-[0.35em] text-[#d9b668]/80 hover:text-[#d9b668] transition-colors"
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
