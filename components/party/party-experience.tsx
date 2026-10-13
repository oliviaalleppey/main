'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
    Baby, BedDouble, Car, Martini, Minus, Music, Pause, Plus, Sparkles, UtensilsCrossed, type LucideIcon,
} from 'lucide-react';
import PartyEnquiryForm from './party-enquiry-form';
import { PartyMusic } from './party-music';
import {
    DEFAULT_PARTY_CROWD_IMAGE,
    DEFAULT_PARTY_LIGHTS_IMAGE,
    DEFAULT_PARTY_MASK,
    DEFAULT_PARTY_PAGE_IMAGE,
    PARTY_START,
    formatRupees,
    type PartyPopupSettings,
    type PartyStay,
} from '@/lib/config/party-popup';
import './party.css';

/** Short notes for the highlights we know; anything the admin adds shows as a title only. */
const DETAILS: Record<string, { note: string; icon: LucideIcon }> = {
    'Live DJ': { note: 'A full night of music on the Grand Ballroom stage, building all the way to midnight.', icon: Music },
    Spirits: { note: 'Premium spirits from the first toast to the last, for guests 23 and above.', icon: Martini },
    'Gala dinner': { note: 'A festive spread served through the evening, so nobody dances hungry.', icon: UtensilsCrossed },
    "Kids' care": { note: 'A kids’ area with trained carers, so the little ones have their own party while you celebrate.', icon: Baby },
    'Stay included': { note: 'Residential passes come with a room at Olivia, so the night ends upstairs.', icon: BedDouble },
};

/** Lights up gold, word by word, as the section scrolls past. */
const STATEMENT = ['Masks', 'on.', 'Lights', 'down.', 'Hands', 'up', 'for', 'midnight.'];

const MAX_COUNT = 10;
const CONFETTI = ['#f1dba0', '#d4b06a', '#8d6b2e', '#fff6dc', '#e8a64a'];
/** One colour per price line, shared by its guest tokens and its dot in the summary. */
const TOKEN = ['#e9c77b', '#f6efe0', '#e8a0a8', '#9fd3c7', '#c7b4f0', '#f0b37e', '#a8c8f0', '#d9e6a3'];
const MAX_TOKENS = 24;

const STAY_TEXT: Record<'R' | 'NR', { code: string; name: string; title: string; text: string }> = {
    R: { code: 'R', name: 'Residential', title: 'Staying with us', text: 'Your couple pass includes a room at Olivia for the night.' },
    NR: { code: 'NR', name: 'Non-residential', title: 'Party only', text: 'Join the celebration and head home after. No room included.' },
};

type Dust = { x: number; y: number; r: number; vx: number; vy: number; a: number; t: number };
type Bit = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; w: number; h: number; c: string; life: number };

type Row = {
    key: string;
    label: string;
    note: string;
    /** null when the price is given on request. */
    price: number | null;
    per: 'couple' | 'person';
    stay: PartyStay;
    people: number;
    min: number;
    color: string;
};

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

/** Counts toward a number instead of jumping to it. */
function useTween(target: number, skip: boolean, ms = 650) {
    const [value, setValue] = useState(target);
    const current = useRef(target);
    useEffect(() => {
        if (skip) {
            current.current = target;
            return;
        }
        const from = current.current;
        const start = performance.now();
        let frame = 0;
        const step = (now: number) => {
            const k = Math.min(1, (now - start) / ms);
            const v = Math.round(from + (target - from) * (1 - Math.pow(1 - k, 3)));
            current.current = v;
            setValue(v);
            if (k < 1) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frame);
    }, [target, skip, ms]);
    return skip ? target : value;
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
        [now === null ? '–' : pad(Math.floor((left % 36e5) / 6e4)), 'Minutes'],
        [now === null ? '–' : pad(Math.floor((left % 6e4) / 1e3)), 'Seconds'],
    ];

    return (
        <div className="pt-count" role="timer" aria-label="Time until the party starts">
            {parts.map(([value, label]) => (
                <div key={label}>
                    <b key={value} className="pt-serif">{value}</b>
                    <span>{label}</span>
                </div>
            ))}
        </div>
    );
}

/** A small domino mask, used for the guest tokens. */
function MaskGlyph() {
    return (
        <svg viewBox="0 0 64 34" aria-hidden="true">
            <path
                fillRule="evenodd"
                d="M32 10C25 3 13 1 5 5 1 7 0 13 2 19c3 8 12 13 21 10 4-1 6-4 9-4s5 3 9 4c9 3 18-2 21-10 2-6 1-12-3-14-8-4-20-2-27 5ZM13 15c3-3 9-3 12 1-3 4-9 4-12-1Zm38 0c-3-3-9-3-12 1 3 4 9 4 12-1Z"
            />
        </svg>
    );
}

/** A gold flourish between sections. */
function Ornament() {
    return (
        <svg className="pt-orn" viewBox="0 0 240 24" aria-hidden="true">
            <path d="M0 12h92M148 12h92" />
            <path d="M92 12c8 0 10-8 18-8s10 8 10 8-2 8-10 8-10-8-18-8Zm56 0c-8 0-10-8-18-8s-10 8-10 8 2 8 10 8 10-8 18-8Z" />
            <path className="fill" d="m120 6 6 6-6 6-6-6Z" />
        </svg>
    );
}

/** The equaliser bars on the sound button; they move while music plays. */
function Eq() {
    return <span className="pt-eq" aria-hidden="true"><i /><i /><i /><i /></span>;
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
        },
        onPointerLeave(e: React.PointerEvent<HTMLElement>) {
            const el = e.currentTarget;
            el.style.setProperty('--ry', '0deg');
            el.style.setProperty('--rx', '0deg');
        },
    };
}

const forStay = (row: Row, stay: 'R' | 'NR') => row.stay === 'both' || row.stay === stay;

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
    const heroPhotoRef = useRef<HTMLDivElement>(null);
    const flaresRef = useRef<HTMLDivElement>(null);
    const maskRef = useRef<HTMLDivElement>(null);
    const maskGlowRef = useRef<HTMLSpanElement>(null);
    const statementRef = useRef<HTMLElement>(null);
    const statementPhotoRef = useRef<HTMLDivElement>(null);
    const wordsRef = useRef<HTMLParagraphElement>(null);

    const musicRef = useRef<PartyMusic | null>(null);
    const playingRef = useRef(false);
    const bitsRef = useRef<Bit[]>([]);
    const reduced = useReducedMotion();

    const [playing, setPlaying] = useState(false);
    const [act, setAct] = useState(0);
    const [stay, setStay] = useState<'R' | 'NR'>('R');
    const [counts, setCounts] = useState<Record<string, number>>({ coupleR: 1, coupleNR: 1 });
    // Reveal-on-scroll styles apply only once the script is running.
    const [scripted, setScripted] = useState(false);

    const mask = content.maskImage || DEFAULT_PARTY_MASK;
    const heroPhoto = content.pageImage || DEFAULT_PARTY_PAGE_IMAGE;
    const crowdPhoto = content.crowdImage || DEFAULT_PARTY_CROWD_IMAGE;
    const lightsPhoto = content.lightsImage || DEFAULT_PARTY_LIGHTS_IMAGE;
    const nightPhotos = [crowdPhoto, lightsPhoto, heroPhoto];
    const name = `${content.titleMain} ${content.titleAccent}`;

    // ── Price list and the guest's plan ────────────────────
    const rows = useMemo<Row[]>(() => [
        {
            key: 'coupleR', label: 'Couple pass', note: 'Two guests, room for the night included',
            price: content.pricePerCouple, per: 'couple', stay: 'R', people: 2, min: 1, color: TOKEN[0],
        },
        {
            key: 'coupleNR', label: 'Couple pass', note: 'Two guests, party only',
            price: content.pricePerCoupleNonResidential || null, per: 'couple', stay: 'NR', people: 2, min: 1, color: TOKEN[0],
        },
        ...content.guestPrices.map((g, i): Row => ({
            key: `guest${i}`, label: g.label, note: g.note, price: g.price, per: 'person', stay: g.stay, people: 1, min: 0,
            color: TOKEN[(i + 1) % TOKEN.length],
        })),
    ], [content.pricePerCouple, content.pricePerCoupleNonResidential, content.guestPrices]);

    const lines = rows.filter((row) => forStay(row, stay) && (counts[row.key] ?? 0) > 0);
    const total = lines.reduce((sum, row) => sum + (row.price ?? 0) * (counts[row.key] ?? 0), 0);
    const onRequest = lines.some((row) => row.price === null);
    const people = lines.reduce((sum, row) => sum + row.people * (counts[row.key] ?? 0), 0);
    const shownTotal = useTween(total, reduced);

    const tokens = lines.flatMap((row) =>
        Array.from({ length: row.people * (counts[row.key] ?? 0) }, (_, i) => ({ id: `${row.key}-${i}`, color: row.color, small: /kid|child|infant/i.test(row.label) })),
    );

    const lineText = (row: Row) => {
        const count = counts[row.key] ?? 0;
        const amount = row.price === null ? 'price on request' : formatRupees(row.price * count);
        return `${row.label}${row.note ? ` (${row.note})` : ''} × ${count} = ${amount}`;
    };
    const planMessage = [
        `${name} plan: ${STAY_TEXT[stay].name} (${stay}), ${STAY_TEXT[stay].title.toLowerCase()}`,
        ...lines.map((row) => `• ${lineText(row)}`),
        `Estimated total: ${formatRupees(total)}${onRequest ? ' + couple pass (price on request)' : ''}`,
    ].join('\n');

    // ── Gold confetti, for the planner and the buttons ─────
    const burst = useCallback((x: number, y: number, count = 70) => {
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

    // In-page links glide instead of jumping.
    function onLinkClick(e: React.MouseEvent<HTMLDivElement>) {
        const anchor = (e.target as HTMLElement).closest('a[href^="#"]');
        if (!anchor) return;
        const section = document.querySelector(anchor.getAttribute('href')!);
        if (!section) return;
        e.preventDefault();
        section.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    }

    // ── Music ──────────────────────────────────────────────
    async function toggleMusic() {
        const music = musicRef.current;
        if (!music) {
            try {
                const next = new PartyMusic(content.musicUrl);
                await next.start();
                musicRef.current = next;
                playingRef.current = true;
                setPlaying(true);
            } catch {
                setPlaying(false);
            }
            return;
        }
        if (playing) music.pause();
        else music.resume();
        playingRef.current = !playing;
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

    // ── Scroll and pointer: written straight onto a few layers, never the whole page ──
    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        setScripted(true);

        const fine = window.matchMedia('(pointer: fine)').matches;
        const words = Array.from(wordsRef.current?.children ?? []) as HTMLElement[];
        const actRows = Array.from(root.querySelectorAll<HTMLElement>('[data-act]'));
        // Where each highlight's middle sits on the page; measured again on resize.
        let actMiddles: number[] = [];
        const measure = () => {
            actMiddles = actRows.map((li) => li.getBoundingClientRect().top + window.scrollY + li.offsetHeight / 2);
        };
        let currentAct = -1;
        let nx = 0;
        let ny = 0;
        let y = window.scrollY;
        let lit = -1;
        let queued = false;

        const paint = () => {
            queued = false;
            const vh = window.innerHeight;

            if (y < vh * 1.3) {
                if (heroPhotoRef.current) heroPhotoRef.current.style.transform = `translate3d(0,${(y * 0.35).toFixed(1)}px,0)`;
                if (maskRef.current) {
                    maskRef.current.style.transform = `translate3d(${(nx * 22).toFixed(1)}px,${(ny * 14 - y * 0.18).toFixed(1)}px,0) rotate(${(nx * 4).toFixed(2)}deg)`;
                    maskRef.current.style.opacity = Math.max(0, 1 - y / (vh * 0.9)).toFixed(2);
                }
            }

            // The highlight nearest the middle of the screen is the lit one.
            if (actMiddles.length) {
                const line = y + vh * 0.55;
                let nearest = 0;
                actMiddles.forEach((m, i) => { if (Math.abs(m - line) < Math.abs(actMiddles[nearest] - line)) nearest = i; });
                if (nearest !== currentAct) {
                    currentAct = nearest;
                    setAct(nearest);
                }
            }

            const band = statementRef.current;
            if (band) {
                const top = band.offsetTop;
                const travel = band.offsetHeight - vh;
                const p = Math.min(1, Math.max(0, (y - top + vh * 0.35) / (travel + vh * 0.35)));
                if (y > top - vh && y < top + band.offsetHeight && statementPhotoRef.current) {
                    statementPhotoRef.current.style.transform = `scale(${(1.04 + p * 0.12).toFixed(3)})`;
                }
                const next = Math.round(p * words.length * 1.2);
                if (next !== lit) {
                    lit = next;
                    words.forEach((w, i) => w.classList.toggle('lit', i < lit));
                }
            }
        };
        const queue = () => {
            if (queued) return;
            queued = true;
            requestAnimationFrame(paint);
        };
        const onScroll = () => {
            y = window.scrollY;
            queue();
        };
        const onMove = (e: PointerEvent) => {
            if (!fine || e.pointerType !== 'mouse') return;
            nx = e.clientX / window.innerWidth - 0.5;
            ny = e.clientY / window.innerHeight - 0.5;
            queue();
        };
        const onResize = () => {
            measure();
            queue();
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('pointermove', onMove, { passive: true });
        window.addEventListener('resize', onResize);
        onResize();
        void document.fonts?.ready.then(onResize);

        const reveal = new IntersectionObserver(
            (entries) => entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    reveal.unobserve(entry.target);
                }
            }),
            { threshold: 0.12 },
        );
        root.querySelectorAll('[data-reveal]').forEach((el) => reveal.observe(el));

        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('resize', onResize);
            reveal.disconnect();
        };
    }, []);

    // ── Canvas: gold dust over the opening, and confetti; the glow follows the beat ──
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = 0;
        let height = 0;
        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            const dpr = Math.min(window.devicePixelRatio || 1, width < 700 ? 1.5 : 2);
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
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

        const dust: Dust[] = Array.from({ length: reduced ? 0 : width < 700 ? 22 : 46 }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            r: 2 + Math.random() * 6,
            vx: (Math.random() - 0.5) * 0.15,
            vy: -0.1 - Math.random() * 0.3,
            a: 0.2 + Math.random() * 0.55,
            t: Math.random() * Math.PI * 2,
        }));

        // Only touch a layer when its value has really changed.
        const last = new Map<HTMLElement, number>();
        const setOpacity = (el: HTMLElement | null, value: number) => {
            if (!el) return;
            const v = Math.round(value * 50) / 50;
            if (last.get(el) === v) return;
            last.set(el, v);
            el.style.opacity = String(v);
        };

        let beat = 0;
        let frame = 0;
        let drawn = true;
        const loop = () => {
            const level = playingRef.current ? musicRef.current?.level() ?? 0 : 0;
            beat = beat * 0.8 + level * 0.2;
            setOpacity(flaresRef.current, 0.75 + beat * 0.5);
            setOpacity(maskGlowRef.current, 0.35 + beat * 0.65);

            // The dust belongs to the opening; it fades as you scroll on.
            const fade = Math.max(0, 1 - window.scrollY / height);
            const bits = bitsRef.current;
            if (fade === 0 && bits.length === 0) {
                if (drawn) {
                    ctx.clearRect(0, 0, width, height);
                    drawn = false;
                }
                frame = requestAnimationFrame(loop);
                return;
            }
            drawn = true;

            ctx.clearRect(0, 0, width, height);
            if (fade > 0) {
                ctx.globalCompositeOperation = 'lighter';
                for (const d of dust) {
                    d.t += 0.02;
                    d.x += d.vx + Math.sin(d.t) * 0.15;
                    d.y += d.vy * (1 + beat * 2.5);
                    if (d.y < -20) { d.y = height + 20; d.x = Math.random() * width; }
                    if (d.x < -20) d.x = width + 20;
                    if (d.x > width + 20) d.x = -20;
                    const size = d.r * (2.2 + beat * 2);
                    ctx.globalAlpha = fade * Math.min(1, d.a * (0.55 + 0.45 * Math.sin(d.t * 1.7)) + beat * 0.3);
                    ctx.drawImage(sprite, d.x - size, d.y - size, size * 2, size * 2);
                }
                ctx.globalCompositeOperation = 'source-over';
            }

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

    const change = (e: React.MouseEvent<HTMLButtonElement>, row: Row, delta: number) => {
        setCounts((prev) => ({
            ...prev,
            [row.key]: Math.min(MAX_COUNT, Math.max(row.min, (prev[row.key] ?? 0) + delta)),
        }));
        if (delta > 0) burstFrom(e, 22);
    };

    const ticker = [...content.highlights, content.theme];
    const priceText = `${formatRupees(total)}${onRequest ? '+' : ''}`;

    return (
        <div ref={rootRef} className={`pt${scripted ? ' pt-js' : ''}${playing ? ' pt-playing' : ''}`} onClick={onLinkClick}>
            <canvas ref={canvasRef} className="pt-canvas" aria-hidden="true" />

            <nav className="pt-top pt-cinzel" aria-label="Olivia Alleppey">
                <Link href="/">Olivia Alleppey</Link>
                <div>
                    <Link href="/rooms" className="pt-top-rooms">Rooms</Link>
                    <button type="button" className="pt-top-sound" onClick={() => void toggleMusic()} aria-pressed={playing} aria-label={playing ? 'Pause the music' : 'Play the music'}>
                        {playing ? <Eq /> : <Music aria-hidden="true" />}<span>{playing ? 'Sound on' : 'Sound'}</span>
                    </button>
                    {!over && (
                        <a href="#reserve" className="pt-top-price">
                            {priceText}<span> · {people} {people === 1 ? 'guest' : 'guests'}</span>
                        </a>
                    )}
                </div>
            </nav>

            <main className="pt-main">
                <section className="pt-hero">
                    <div ref={heroPhotoRef} className="pt-hero-photo" aria-hidden="true">
                        <i style={{ backgroundImage: `url("${heroPhoto}")` }} />
                    </div>
                    <div className="pt-hero-shade" aria-hidden="true" />
                    <div ref={flaresRef} className="pt-flares" aria-hidden="true"><i className="a" /><i className="b" /></div>

                    <div className="pt-hero-in">
                        <div ref={maskRef} className="pt-mask">
                            <div className="pt-mask-in">
                                <span ref={maskGlowRef} className="pt-mask-glow" aria-hidden="true" />
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={mask} alt="Masquerade mask" width={709} height={502} />
                                <span className="pt-glint" style={{ ['--mask-url' as string]: `url("${mask}")` }} aria-hidden="true"><i /></span>
                            </div>
                        </div>
                        <p className="pt-pre pt-cinzel">{content.presenter} · {content.eyebrow}</p>
                        <h1 className="pt-title pt-serif">
                            <span className="w1">{content.titleMain}</span> <em className="w2">{content.titleAccent}</em>
                        </h1>
                        <p className="pt-theme pt-cinzel"><span>{content.theme}</span></p>
                        <div className="pt-facts">
                            <div><small>Date</small><p>{content.dateValue}</p></div>
                            <div><small>Time</small><p>{content.timeValue}</p></div>
                            <div><small>Dress</small><p>{content.dressValue}</p></div>
                        </div>
                        {!over && <Countdown />}
                        {!over && (
                            <div className="pt-ctas">
                                <a href="#reserve" className="pt-btn pt-btn-gold" onClick={(e) => burstFrom(e)}>
                                    {content.reserveLabel}
                                </a>
                                <a href="#enquire" className="pt-btn pt-btn-ghost">{content.enquireLabel}</a>
                            </div>
                        )}
                        <button type="button" className="pt-sound-cta" onClick={() => void toggleMusic()} aria-pressed={playing}>
                            {playing ? <Pause aria-hidden="true" /> : <Music aria-hidden="true" />}
                            {playing ? 'Pause the music' : 'Play the party music'}
                        </button>
                    </div>
                    <div className="pt-scroll" aria-hidden="true"><i /></div>
                </section>

                <div className="pt-ticker" aria-hidden="true">
                    <div className="pt-ticker-track pt-cinzel">
                        {[...ticker, ...ticker].map((item, i) => <span key={i}>{item}</span>)}
                    </div>
                </div>

                <section className="pt-night">
                    <div className="pt-night-media" aria-hidden="true">
                        <div className="pt-night-frame">
                            {nightPhotos.map((src, i) => (
                                <i key={i} className={i === act % nightPhotos.length ? 'on' : ''} style={{ backgroundImage: `url("${src}")` }} />
                            ))}
                            <span className="pt-night-num pt-serif" key={act}>{String(act + 1).padStart(2, '0')}</span>
                        </div>
                    </div>
                    <div className="pt-night-text">
                        <p className="pt-kicker pt-cinzel" data-reveal>The night</p>
                        <h2 className="pt-h2 pt-serif" data-reveal>The Grand <em>Masquerade</em></h2>
                        <p className="pt-lede" data-reveal>{content.intro}</p>
                        <ol className="pt-acts">
                            {content.highlights.map((title, i) => {
                                const detail = DETAILS[title];
                                const Icon = detail?.icon ?? Sparkles;
                                return (
                                    <li
                                        key={title}
                                        data-act={i}
                                        className={i === act ? 'on' : ''}
                                        onPointerEnter={(e) => { if (e.pointerType === 'mouse') setAct(i); }}
                                    >
                                        <span className="pt-act-num pt-serif">{String(i + 1).padStart(2, '0')}</span>
                                        <div>
                                            <h3 className="pt-serif"><Icon aria-hidden="true" />{title}</h3>
                                            {detail && <p>{detail.note}</p>}
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    </div>
                </section>

                <section ref={statementRef} className="pt-statement" aria-label="Masks on. Lights down. Hands up for midnight.">
                    <div className="pt-statement-pin">
                        <div ref={statementPhotoRef} className="pt-statement-photo" style={{ backgroundImage: `url("${lightsPhoto}")` }} aria-hidden="true" />
                        <div className="pt-statement-shade" aria-hidden="true" />
                        <p ref={wordsRef} className="pt-words pt-serif" aria-hidden="true">
                            {STATEMENT.map((word, i) => <span key={i}>{word} </span>)}
                        </p>
                        <p className="pt-statement-sub">{content.dateValue} · The Grand Ballroom · Olivia Alleppey</p>
                    </div>
                </section>

                <section id="reserve" className="pt-section" style={{ scrollMarginTop: 60 }}>
                    <Ornament />
                    <p className="pt-kicker pt-cinzel" data-reveal>Passes and prices</p>
                    <h2 className="pt-h2 pt-serif" data-reveal>Plan your <em>night</em></h2>
                    <p className="pt-lede" data-reveal>
                        {over
                            ? 'This celebration has ended. See you next year.'
                            : 'First choose how you are joining us. Then add your guests and watch your total as you go.'}
                    </p>

                    <div className="pt-stays" role="radiogroup" aria-label="How are you joining us?" data-reveal>
                        {(['R', 'NR'] as const).map((code) => {
                            const info = STAY_TEXT[code];
                            const Icon = code === 'R' ? BedDouble : Car;
                            const active = stay === code;
                            return (
                                <button
                                    key={code}
                                    type="button"
                                    role="radio"
                                    aria-checked={active}
                                    className={`pt-stay${active ? ' on' : ''}`}
                                    onClick={(e) => { if (!active) { setStay(code); burstFrom(e, 30); } }}
                                >
                                    <span className="pt-stay-code pt-cinzel">{info.code}</span>
                                    <span className="pt-stay-body">
                                        <span className="pt-stay-name">{info.name}</span>
                                        <span className="pt-stay-title pt-serif"><Icon aria-hidden="true" />{info.title}</span>
                                        <span className="pt-stay-text">{info.text}</span>
                                    </span>
                                    <span className="pt-stay-tick" aria-hidden="true" />
                                </button>
                            );
                        })}
                    </div>

                    <div className="pt-plan" data-reveal>
                        <div className="pt-list">
                            <div className="pt-list-head">
                                <span>Guest</span>
                                <span>Price</span>
                            </div>
                            {rows.map((row) => {
                                const active = forStay(row, stay);
                                const count = counts[row.key] ?? 0;
                                const stays = row.stay === 'both' ? 'R & NR' : row.stay;
                                return (
                                    <div key={row.key} className={`pt-row${active ? '' : ' off'}${active && count > 0 ? ' has' : ''}`}>
                                        <span className="pt-row-dot" style={{ background: row.color }} aria-hidden="true" />
                                        <div className="pt-row-name">
                                            <p>
                                                {row.label}
                                                <span className={`pt-chip${row.stay === 'both' ? ' both' : ''}`} title={row.stay === 'both' ? 'Residential and non-residential' : STAY_TEXT[row.stay].name}>
                                                    {stays}
                                                </span>
                                            </p>
                                            {row.note && <small>{row.note}</small>}
                                        </div>
                                        <div className="pt-row-price">
                                            {row.price === null ? (
                                                <b className="ask">On request</b>
                                            ) : (
                                                <b className="pt-serif">{formatRupees(row.price)}</b>
                                            )}
                                            <small>per {row.per}</small>
                                        </div>
                                        <div className="pt-row-step">
                                            {over ? null : active ? (
                                                <div className="pt-step">
                                                    <button type="button" aria-label={`One ${row.label.toLowerCase()} fewer`} disabled={count <= row.min} onClick={(e) => change(e, row, -1)}>
                                                        <Minus aria-hidden="true" />
                                                    </button>
                                                    <output aria-live="polite" aria-label={`${row.label}: ${count}`}>{count}</output>
                                                    <button type="button" aria-label={`One ${row.label.toLowerCase()} more`} disabled={count >= MAX_COUNT} onClick={(e) => change(e, row, 1)}>
                                                        <Plus aria-hidden="true" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="pt-row-only">{row.stay === 'R' ? 'Staying guests only' : 'Party-only guests'}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            <p className="pt-legend">
                                <span className="pt-chip">R</span> Residential, staying at Olivia
                                <span className="pt-chip">NR</span> Non-residential, party only
                            </p>
                        </div>

                        <aside className="pt-ticket" aria-label="Your plan" {...tiltHandlers(4)}>
                            <div className="pt-ticket-top">
                                <span className="pt-cinzel">{content.presenter}</span>
                                <h3 className="pt-serif">{content.titleMain} <em>{content.titleAccent}</em></h3>
                                <p>{content.dateValue} · {content.timeValue}</p>
                            </div>
                            <div className="pt-ticket-body">
                                <div className="pt-tokens" aria-hidden="true">
                                    {tokens.slice(0, MAX_TOKENS).map((t) => (
                                        <span key={t.id} className={`pt-token${t.small ? ' sm' : ''}`} style={{ color: t.color }}><MaskGlyph /></span>
                                    ))}
                                    {tokens.length > MAX_TOKENS && <span className="pt-token-more">+{tokens.length - MAX_TOKENS}</span>}
                                </div>
                                <p className="pt-ticket-who">
                                    {people} {people === 1 ? 'guest' : 'guests'} · {STAY_TEXT[stay].title}
                                </p>
                                <ul className="pt-lines">
                                    {lines.map((row) => (
                                        <li key={row.key}>
                                            <span><i style={{ background: row.color }} aria-hidden="true" />{row.label} × {counts[row.key]}</span>
                                            <b>{row.price === null ? 'Ask us' : formatRupees(row.price * (counts[row.key] ?? 0))}</b>
                                        </li>
                                    ))}
                                </ul>
                                <div className="pt-sum">
                                    <span>Estimated total</span>
                                    <b className="pt-serif" aria-hidden="true">{formatRupees(shownTotal)}</b>
                                    <span className="pt-sr" aria-live="polite">{formatRupees(total)}</span>
                                </div>
                                {onRequest && <p className="pt-note">Plus the party-only couple pass. Our team will confirm its price.</p>}
                                {!over && (
                                    <>
                                        <a href="#enquire" className="pt-btn pt-btn-gold" onClick={(e) => burstFrom(e, 60)}>Send this plan to us</a>
                                        {stay === 'R' && (
                                            <Link href={bookHref} className="pt-ticket-link">Or book your room for 31 December</Link>
                                        )}
                                    </>
                                )}
                            </div>
                        </aside>
                    </div>
                    <p className="pt-fine">{content.finePrint}</p>
                </section>

                {!over && (
                    <section id="enquire" className="pt-section" style={{ paddingTop: 20, scrollMarginTop: 60 }}>
                        <Ornament />
                        <p className="pt-kicker pt-cinzel" data-reveal>Reserve your passes</p>
                        <h2 className="pt-h2 pt-serif" data-reveal>We&apos;ll <em>call you</em></h2>
                        <div className="pt-enquire" data-reveal>
                            <p className="pt-enquire-lede">
                                Leave your name and number. Our team will call you to confirm your passes and payment.
                            </p>
                            <div className="pt-enquire-plan">
                                <p>Your plan · {STAY_TEXT[stay].name} ({stay})</p>
                                <ul>
                                    {lines.map((row) => <li key={row.key}>{lineText(row)}</li>)}
                                </ul>
                                <p className="pt-enquire-total">
                                    Estimated total <b>{formatRupees(total)}</b>
                                    {onRequest && <span> + couple pass on request</span>}
                                </p>
                                <a href="#reserve" className="pt-enquire-edit">Change your plan</a>
                            </div>
                            <PartyEnquiryForm
                                eventType={`${name}: ${content.theme}`}
                                guestCount={`${people} guests (${stay})`}
                                message={planMessage}
                                onSent={() => burst(window.innerWidth / 2, window.innerHeight / 2, 160)}
                            />
                        </div>
                    </section>
                )}

                <p className="pt-end"><Link href="/">Olivia Alleppey</Link> · Alappuzha, Kerala</p>
            </main>
        </div>
    );
}
