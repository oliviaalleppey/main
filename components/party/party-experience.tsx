'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import PartyEnquiryForm from './party-enquiry-form';
import { PartyMusic } from './party-music';
import {
    DEFAULT_PARTY_MASK,
    DEFAULT_PARTY_PAGE_IMAGE,
    PARTY_START,
    formatRupees,
    type PartyPopupSettings,
} from '@/lib/config/party-popup';
import './party.css';

/** Short notes for the highlights we know; anything the admin adds shows as a title only. */
const DETAILS: Record<string, string> = {
    'Live DJ': 'A full night of music on the Grand Ballroom stage, building all the way to midnight.',
    'Open bar': 'Premium pours from the first toast to the last, for guests 23 and above.',
    'Gala dinner': 'A festive spread served through the evening, so nobody dances hungry.',
    "Kids' care": 'Trained carers look after infants and children while you celebrate.',
    'Stay included': 'Your pass comes with a room at Olivia, so the night ends upstairs.',
};

const MAX_COUPLES = 10;
const CONFETTI = ['#f1dba0', '#d4b06a', '#8d6b2e', '#b3202f', '#f6efe0'];

type Dust = { x: number; y: number; r: number; vx: number; vy: number; a: number; t: number };
type Bit = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; w: number; h: number; c: string; life: number };

function useReducedMotion() {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReduced(media.matches);
        const on = () => setReduced(media.matches);
        media.addEventListener('change', on);
        return () => media.removeEventListener('change', on);
    }, []);
    return reduced;
}

function Countdown() {
    const [now, setNow] = useState<number | null>(null);
    useEffect(() => {
        setNow(Date.now());
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    const left = now === null ? 0 : Math.max(0, new Date(PARTY_START).getTime() - now);
    const pad = (n: number) => String(n).padStart(2, '0');
    const parts: [string, string][] = [
        [now === null ? '–' : String(Math.floor(left / 864e5)), 'Days'],
        [now === null ? '–' : pad(Math.floor((left % 864e5) / 36e5)), 'Hours'],
        [now === null ? '–' : pad(Math.floor((left % 36e5) / 6e4)), 'Mins'],
        [now === null ? '–' : pad(Math.floor((left % 6e4) / 1e3)), 'Secs'],
    ];

    return (
        <div className="pt-count" aria-label="Time until the party starts">
            {parts.map(([value, label]) => (
                <div key={label}>
                    <b className="pt-serif">{value}</b>
                    <span className="pt-cinzel">{label.toUpperCase()}</span>
                </div>
            ))}
        </div>
    );
}

/** Tilts toward the pointer and moves a highlight with it. */
function tiltHandlers(strength = 8) {
    return {
        onPointerMove(e: React.PointerEvent<HTMLElement>) {
            if (e.pointerType !== 'mouse') return;
            const el = e.currentTarget;
            const box = el.getBoundingClientRect();
            const x = (e.clientX - box.left) / box.width;
            const y = (e.clientY - box.top) / box.height;
            el.style.setProperty('--ry', `${(x - 0.5) * strength}deg`);
            el.style.setProperty('--rx', `${(0.5 - y) * strength}deg`);
            el.style.setProperty('--gx', `${x * 100}%`);
            el.style.setProperty('--gy', `${y * 100}%`);
            el.style.setProperty('--shine', `${(x - 0.5) * 140}%`);
        },
        onPointerLeave(e: React.PointerEvent<HTMLElement>) {
            const el = e.currentTarget;
            el.style.setProperty('--ry', '0deg');
            el.style.setProperty('--rx', '0deg');
            el.style.setProperty('--shine', '-60%');
        },
    };
}

export default function PartyExperience({
    content,
    over,
    bookHref,
}: {
    content: PartyPopupSettings;
    over: boolean;
    bookHref: string;
}) {
    const rootRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const musicRef = useRef<PartyMusic | null>(null);
    const bitsRef = useRef<Bit[]>([]);
    const reduced = useReducedMotion();

    const [gate, setGate] = useState<'open' | 'leaving' | 'gone'>('open');
    const [playing, setPlaying] = useState(false);
    const [couples, setCouples] = useState(1);
    // Reveal-on-scroll styles apply only once the script is running.
    const [scripted, setScripted] = useState(false);

    const mask = content.maskImage || DEFAULT_PARTY_MASK;
    const photo = content.pageImage || DEFAULT_PARTY_PAGE_IMAGE;

    // ── Confetti ───────────────────────────────────────────
    const burst = useCallback((x: number, y: number, count = 90) => {
        if (reduced) return;
        for (let i = 0; i < count; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
            const speed = 6 + Math.random() * 9;
            bitsRef.current.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                rot: Math.random() * Math.PI,
                vr: (Math.random() - 0.5) * 0.4,
                w: 5 + Math.random() * 6,
                h: 2 + Math.random() * 4,
                c: CONFETTI[Math.floor(Math.random() * CONFETTI.length)],
                life: 160 + Math.random() * 80,
            });
        }
    }, [reduced]);

    const burstFrom = (e: React.MouseEvent<HTMLElement>, count?: number) => {
        const box = e.currentTarget.getBoundingClientRect();
        burst(box.left + box.width / 2, box.top + box.height / 2, count);
    };

    // ── Music ──────────────────────────────────────────────
    async function startMusic() {
        try {
            const music = new PartyMusic(content.musicUrl);
            await music.start();
            musicRef.current = music;
            setPlaying(true);
        } catch {
            setPlaying(false);
        }
    }

    function toggleMusic() {
        const music = musicRef.current;
        if (!music) {
            void startMusic();
            return;
        }
        if (playing) music.pause();
        else music.resume();
        setPlaying(!playing);
    }

    useEffect(() => {
        const onVisibility = () => {
            if (!musicRef.current || !playing) return;
            if (document.hidden) musicRef.current.pause();
            else musicRef.current.resume();
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, [playing]);

    useEffect(() => () => musicRef.current?.stop(), []);

    // ── Gate ───────────────────────────────────────────────
    function enter(withSound: boolean) {
        if (withSound) void startMusic();
        setGate('leaving');
        burst(window.innerWidth / 2, window.innerHeight * 0.6, 140);
        window.setTimeout(() => setGate('gone'), 900);
    }

    useEffect(() => {
        if (gate === 'gone') return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = previous; };
    }, [gate]);

    // ── Pointer spotlight, mask parallax, scroll parallax, reveals ─────
    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        setScripted(true);

        const onMove = (e: PointerEvent) => {
            root.style.setProperty('--mx', `${e.clientX}px`);
            root.style.setProperty('--my', `${e.clientY}px`);
            root.style.setProperty('--px', ((e.clientX / window.innerWidth) - 0.5).toFixed(3));
            root.style.setProperty('--py', ((e.clientY / window.innerHeight) - 0.5).toFixed(3));
        };
        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                root.style.setProperty('--sy', String(Math.round(window.scrollY)));
                ticking = false;
            });
        };
        window.addEventListener('pointermove', onMove, { passive: true });
        window.addEventListener('scroll', onScroll, { passive: true });

        const observer = new IntersectionObserver(
            (entries) => entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    observer.unobserve(entry.target);
                }
            }),
            { threshold: 0.15 },
        );
        root.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));

        return () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('scroll', onScroll);
            observer.disconnect();
        };
    }, []);

    // ── Canvas: drifting gold dust that swells with the beat, plus confetti ──
    useEffect(() => {
        const canvas = canvasRef.current;
        const root = rootRef.current;
        if (!canvas || !root) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        let width = 0;
        let height = 0;
        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        window.addEventListener('resize', resize);

        // One soft glow, drawn once and stamped for every mote.
        const sprite = document.createElement('canvas');
        sprite.width = sprite.height = 64;
        const s = sprite.getContext('2d')!;
        const glow = s.createRadialGradient(32, 32, 0, 32, 32, 32);
        glow.addColorStop(0, 'rgba(255,240,205,1)');
        glow.addColorStop(0.25, 'rgba(241,219,160,.55)');
        glow.addColorStop(1, 'rgba(212,176,106,0)');
        s.fillStyle = glow;
        s.fillRect(0, 0, 64, 64);

        const count = reduced ? 0 : width < 700 ? 34 : 70;
        const dust: Dust[] = Array.from({ length: count }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            r: 2 + Math.random() * 7,
            vx: (Math.random() - 0.5) * 0.15,
            vy: -0.1 - Math.random() * 0.35,
            a: 0.2 + Math.random() * 0.6,
            t: Math.random() * Math.PI * 2,
        }));

        let beat = 0;
        let frame = 0;
        const loop = () => {
            const level = musicRef.current?.level() ?? 0;
            beat = beat * 0.82 + level * 0.18;
            root.style.setProperty('--beat', beat.toFixed(3));

            ctx.clearRect(0, 0, width, height);
            ctx.globalCompositeOperation = 'lighter';
            for (const d of dust) {
                d.t += 0.02;
                d.x += d.vx + Math.sin(d.t) * 0.15;
                d.y += d.vy * (1 + beat * 2.5);
                if (d.y < -20) { d.y = height + 20; d.x = Math.random() * width; }
                if (d.x < -20) d.x = width + 20;
                if (d.x > width + 20) d.x = -20;
                const size = d.r * (2.2 + beat * 2);
                ctx.globalAlpha = Math.min(1, d.a * (0.55 + 0.45 * Math.sin(d.t * 1.7)) + beat * 0.3);
                ctx.drawImage(sprite, d.x - size, d.y - size, size * 2, size * 2);
            }

            ctx.globalCompositeOperation = 'source-over';
            const bits = bitsRef.current;
            for (let i = bits.length - 1; i >= 0; i--) {
                const b = bits[i];
                b.vy += 0.16;
                b.vx *= 0.985;
                b.vy *= 0.985;
                b.x += b.vx;
                b.y += b.vy;
                b.rot += b.vr;
                b.life -= 1;
                if (b.life <= 0 || b.y > height + 40) { bits.splice(i, 1); continue; }
                ctx.globalAlpha = Math.min(1, b.life / 50);
                ctx.save();
                ctx.translate(b.x, b.y);
                ctx.rotate(b.rot);
                ctx.scale(1, Math.cos(b.rot * 2.3));
                ctx.fillStyle = b.c;
                ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
                ctx.restore();
            }
            ctx.globalAlpha = 1;
            frame = requestAnimationFrame(loop);
        };
        frame = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('resize', resize);
        };
    }, [reduced]);

    const changeCouples = (e: React.MouseEvent<HTMLButtonElement>, delta: number) => {
        setCouples((n) => Math.min(MAX_COUPLES, Math.max(1, n + delta)));
        if (delta > 0) burstFrom(e, 26);
    };

    const ticker = [...content.highlights, content.theme];

    return (
        <div ref={rootRef} className={`pt${scripted ? ' pt-js' : ''}${gate === 'open' ? ' pt-gated' : ''}`}>
            <div className="pt-bg" style={{ backgroundImage: `url("${photo}")` }} aria-hidden="true" />
            <div className="pt-grade" aria-hidden="true" />
            <div className="pt-grain" aria-hidden="true" />
            <canvas ref={canvasRef} className="pt-canvas" aria-hidden="true" />

            {gate !== 'gone' && (
                <div className={`pt-gate${gate === 'leaving' ? ' out' : ''}`} role="dialog" aria-modal="true" aria-labelledby="pt-gate-title">
                    <div className="pt-gate-in">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={mask} alt="" width={709} height={502} />
                        <p className="small pt-cinzel">{content.presenter}</p>
                        <h2 id="pt-gate-title" className="pt-serif">{content.titleMain} <em>{content.titleAccent}</em></h2>
                        <button type="button" className="pt-enter pt-cinzel" onClick={() => enter(true)} autoFocus>
                            Enter the masquerade
                        </button>
                        <button type="button" className="pt-quiet" onClick={() => enter(false)}>
                            Enter without sound
                        </button>
                    </div>
                </div>
            )}

            <nav className="pt-top pt-cinzel" aria-label="Olivia Alleppey">
                <Link href="/">OLIVIA ALLEPPEY</Link>
                <div>
                    <Link href="/rooms">ROOMS</Link>
                    {!over && <a href="#reserve">PASSES</a>}
                </div>
            </nav>

            <main className="pt-main">
                <section className="pt-hero">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="pt-mask" src={mask} alt="Masquerade mask" width={709} height={502} />
                    <p className="pt-pre pt-cinzel">{content.eyebrow}</p>
                    <h1 className="pt-title pt-serif">
                        {content.titleMain} <em>{content.titleAccent}</em>
                    </h1>
                    <p className="pt-theme pt-serif">{content.theme}</p>
                    <div className="pt-facts">
                        <div><small className="pt-cinzel">DATE</small><p className="pt-serif">{content.dateValue}</p></div>
                        <div><small className="pt-cinzel">TIME</small><p className="pt-serif">{content.timeValue}</p></div>
                        <div><small className="pt-cinzel">DRESS</small><p className="pt-serif">{content.dressValue}</p></div>
                    </div>
                    {!over && <Countdown />}
                    {!over && (
                        <div className="pt-ctas">
                            <a href="#reserve" className="pt-btn pt-btn-gold pt-cinzel" onClick={(e) => burstFrom(e)}>
                                {content.reserveLabel}
                            </a>
                            <a href="#enquire" className="pt-btn pt-btn-ghost pt-cinzel">{content.enquireLabel}</a>
                        </div>
                    )}
                    <div className="pt-scroll pt-cinzel"><span>SCROLL</span><i /></div>
                </section>

                <div className="pt-ticker" aria-hidden="true">
                    <div className="pt-ticker-track pt-cinzel">
                        {[...ticker, ...ticker].map((item, i) => <span key={i}>{item}</span>)}
                    </div>
                </div>

                <section className="pt-section">
                    <p className="pt-kicker pt-cinzel" data-reveal>The night</p>
                    <h2 className="pt-h2 pt-serif" data-reveal>Come as a <em>celebrity</em></h2>
                    <p className="pt-lede" data-reveal>{content.intro}</p>
                    <div className="pt-grid">
                        {content.highlights.map((title, i) => (
                            <article key={title} className="pt-card" data-reveal {...tiltHandlers(10)}>
                                <span className="num pt-cinzel">{String(i + 1).padStart(2, '0')}</span>
                                <h3 className="pt-cinzel">{title}</h3>
                                {DETAILS[title] && <p>{DETAILS[title]}</p>}
                            </article>
                        ))}
                    </div>
                </section>

                <section id="reserve" className="pt-section" style={{ scrollMarginTop: 40 }}>
                    <p className="pt-kicker pt-cinzel" data-reveal>Your pass</p>
                    <h2 className="pt-h2 pt-serif" data-reveal>Admit <em>two</em></h2>
                    <div className="pt-pass-wrap" data-reveal>
                        <div className="pt-pass" {...tiltHandlers(6)}>
                            <div className="pt-pass-a">
                                <span className="admit pt-cinzel">{content.presenter.toUpperCase()}</span>
                                <h3 className="pt-serif">{content.titleMain} <em>{content.titleAccent}</em></h3>
                                <p className="pt-serif" style={{ margin: '6px 0 0', fontSize: 20, fontStyle: 'italic', color: 'var(--mute)' }}>
                                    {content.dateValue} · {content.timeValue}
                                </p>
                                <ul>{content.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
                            </div>
                            <div className="pt-pass-b">
                                <small className="pt-cinzel">{content.priceLabel}</small>
                                <div className="pt-price pt-serif">{formatRupees(content.pricePerCouple)}</div>
                                {!over && (
                                    <>
                                        <div className="pt-step">
                                            <button type="button" aria-label="One couple fewer" disabled={couples <= 1} onClick={(e) => changeCouples(e, -1)}>−</button>
                                            <output className="pt-cinzel" aria-live="polite">{couples} {couples === 1 ? 'COUPLE' : 'COUPLES'}</output>
                                            <button type="button" aria-label="One couple more" disabled={couples >= MAX_COUPLES} onClick={(e) => changeCouples(e, 1)}>+</button>
                                        </div>
                                        <div className="pt-total">Total <b>{formatRupees(content.pricePerCouple * couples)}</b></div>
                                        <Link href={bookHref} className="pt-btn pt-btn-gold pt-cinzel" style={{ minWidth: 0 }}>
                                            {content.reserveLabel}
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <p className="pt-fine">{over ? 'This celebration has ended. See you next year.' : content.finePrint}</p>
                </section>

                {!over && (
                    <section id="enquire" className="pt-section" style={{ paddingTop: 0, scrollMarginTop: 40 }}>
                        <p className="pt-kicker pt-cinzel" data-reveal>Prefer to talk first?</p>
                        <h2 className="pt-h2 pt-serif" data-reveal>We&apos;ll <em>call you</em></h2>
                        <div className="pt-enquire" data-reveal>
                            <p className="pt-lede" style={{ marginTop: 0, marginBottom: 22 }}>
                                Leave your details for {couples} {couples === 1 ? 'couple' : 'couples'} and our team will call you about passes.
                            </p>
                            <PartyEnquiryForm couples={couples} onSent={() => burst(window.innerWidth / 2, window.innerHeight / 2, 160)} />
                        </div>
                    </section>
                )}

                <p className="pt-end pt-cinzel"><Link href="/">Olivia Alleppey</Link> · Alappuzha, Kerala</p>
            </main>

            <button type="button" className={`pt-music pt-cinzel${playing ? ' on' : ''}`} onClick={toggleMusic} aria-pressed={playing}>
                <span className="pt-eq" aria-hidden="true"><i /><i /><i /><i /></span>
                {playing ? 'Music on' : 'Play music'}
            </button>

            {!over && (
                <div className="pt-bar">
                    <a href="#reserve" className="pt-btn pt-btn-gold pt-cinzel">{formatRupees(content.pricePerCouple)} · Reserve</a>
                </div>
            )}
        </div>
    );
}
