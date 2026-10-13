'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Baby, BedDouble, Car, Minus, Music, Plus, Sparkles, UtensilsCrossed, Wine, type LucideIcon } from 'lucide-react';
import PartyEnquiryForm from './party-enquiry-form';
import { PartyMusic } from './party-music';
import {
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
    'Open bar': { note: 'Premium pours from the first toast to the last, for guests 23 and above.', icon: Wine },
    'Gala dinner': { note: 'A festive spread served through the evening, so nobody dances hungry.', icon: UtensilsCrossed },
    "Kids' care": { note: 'A kids’ area with trained carers, so the little ones have their own party while you celebrate.', icon: Baby },
    'Stay included': { note: 'Residential passes come with a room at Olivia, so the night ends upstairs.', icon: BedDouble },
};

const MAX_COUNT = 10;
const CONFETTI = ['#f1dba0', '#d4b06a', '#8d6b2e', '#b3202f', '#f6efe0'];
const FIREWORK = ['#f1dba0', '#ffd27a', '#ffe9c2', '#e8a64a', '#ff8a7a', '#f6efe0'];
/** One colour per price line, shared by its guest tokens and its dot in the summary. */
const TOKEN = ['#e9c77b', '#f6efe0', '#e8a0a8', '#9fd3c7', '#c7b4f0', '#f0b37e', '#a8c8f0', '#d9e6a3'];
const MAX_TOKENS = 24;

const STAY_TEXT: Record<'R' | 'NR', { code: string; name: string; title: string; text: string }> = {
    R: { code: 'R', name: 'Residential', title: 'Staying with us', text: 'Your couple pass includes a room at Olivia for the night.' },
    NR: { code: 'NR', name: 'Non-residential', title: 'Party only', text: 'Join the celebration and head home after. No room included.' },
};

type Dust = { x: number; y: number; r: number; vx: number; vy: number; a: number; t: number };
type Bit = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; w: number; h: number; c: string; life: number };
type Spark = { x: number; y: number; px: number; py: number; vx: number; vy: number; life: number; max: number; c: string };
type Rocket = { x: number; y: number; vx: number; vy: number; left: number; c: string };

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
    const musicRef = useRef<PartyMusic | null>(null);
    const bitsRef = useRef<Bit[]>([]);
    const sparksRef = useRef<Spark[]>([]);
    const rocketsRef = useRef<Rocket[]>([]);
    const showRef = useRef(false);
    const reduced = useReducedMotion();

    const [gate, setGate] = useState<'open' | 'leaving' | 'gone'>('open');
    const [playing, setPlaying] = useState(false);
    const [stay, setStay] = useState<'R' | 'NR'>('R');
    const [counts, setCounts] = useState<Record<string, number>>({ coupleR: 1, coupleNR: 1 });
    // Reveal-on-scroll styles apply only once the script is running.
    const [scripted, setScripted] = useState(false);

    const mask = content.maskImage || DEFAULT_PARTY_MASK;
    const photo = content.pageImage || DEFAULT_PARTY_PAGE_IMAGE;
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

    // ── Fireworks: a rocket climbs to the point, then bursts ──
    const launch = useCallback((x: number, y: number) => {
        if (reduced) return;
        const from = x + (Math.random() - 0.5) * 160;
        const start = window.innerHeight + 10;
        const frames = 34 + Math.random() * 14;
        rocketsRef.current.push({
            x: from,
            y: start,
            vx: (x - from) / frames,
            vy: (y - start) / frames,
            left: frames,
            c: FIREWORK[Math.floor(Math.random() * FIREWORK.length)],
        });
    }, [reduced]);

    function onStageClick(e: React.MouseEvent<HTMLDivElement>) {
        const target = e.target as HTMLElement;
        if (gate !== 'gone' || target.closest('a,button,input,label,textarea,select,form,output,[data-calm]')) return;
        launch(e.clientX, e.clientY);
    }

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

    // ── Gate: the curtains part ────────────────────────────
    function enter(withSound: boolean) {
        if (withSound) void startMusic();
        setGate('leaving');
        burst(window.innerWidth / 2, window.innerHeight * 0.6, 140);
        const w = window.innerWidth;
        const h = window.innerHeight;
        [[0.3, 0.28, 650], [0.7, 0.22, 1000], [0.5, 0.16, 1350]].forEach(([x, y, delay]) =>
            window.setTimeout(() => launch(w * x, h * y), delay));
        window.setTimeout(() => {
            setGate('gone');
            showRef.current = true;
        }, 1700);
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
            { threshold: 0.12 },
        );
        root.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));

        return () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('scroll', onScroll);
            observer.disconnect();
        };
    }, []);

    // ── Canvas: gold dust that swells with the beat, fireworks and confetti ──
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

        const explode = (x: number, y: number, c: string) => {
            const n = 70 + Math.floor(Math.random() * 40);
            const ring = 2.6 + Math.random() * 1.6;
            for (let i = 0; i < n; i++) {
                const angle = (i / n) * Math.PI * 2 + Math.random() * 0.15;
                const speed = i % 3 === 0 ? ring : 0.8 + Math.random() * ring;
                const life = 55 + Math.random() * 45;
                sparksRef.current.push({
                    x, y, px: x, py: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life, max: life,
                    c: Math.random() < 0.18 ? '#fff6dc' : c,
                });
            }
        };

        // While the hero is in view, the sky lights up on its own now and then.
        let nextShow = performance.now() + 2600;
        let beat = 0;
        let frame = 0;
        const loop = (now: number) => {
            const level = musicRef.current?.level() ?? 0;
            beat = beat * 0.82 + level * 0.18;
            root.style.setProperty('--beat', beat.toFixed(3));

            if (!reduced && showRef.current && now > nextShow) {
                nextShow = now + 3200 + Math.random() * 2800;
                if (!document.hidden && window.scrollY < height * 0.5) {
                    launch(width * (0.12 + Math.random() * 0.76), height * (0.1 + Math.random() * 0.24));
                }
            }

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

            const rockets = rocketsRef.current;
            ctx.lineCap = 'round';
            for (let i = rockets.length - 1; i >= 0; i--) {
                const r = rockets[i];
                r.x += r.vx;
                r.y += r.vy;
                r.left -= 1;
                ctx.globalAlpha = 0.9;
                ctx.strokeStyle = r.c;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(r.x - r.vx * 4, r.y - r.vy * 4);
                ctx.lineTo(r.x, r.y);
                ctx.stroke();
                ctx.drawImage(sprite, r.x - 8, r.y - 8, 16, 16);
                if (r.left <= 0) {
                    explode(r.x, r.y, r.c);
                    rockets.splice(i, 1);
                }
            }

            const sparks = sparksRef.current;
            ctx.lineWidth = 1.8;
            for (let i = sparks.length - 1; i >= 0; i--) {
                const p = sparks[i];
                p.px = p.x;
                p.py = p.y;
                p.vx *= 0.972;
                p.vy = p.vy * 0.972 + 0.035;
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 1;
                if (p.life <= 0) { sparks.splice(i, 1); continue; }
                const k = p.life / p.max;
                ctx.globalAlpha = k * (0.75 + Math.random() * 0.25);
                ctx.strokeStyle = p.c;
                ctx.beginPath();
                ctx.moveTo(p.px - p.vx * 2, p.py - p.vy * 2);
                ctx.lineTo(p.x, p.y);
                ctx.stroke();
                if (k > 0.6) ctx.drawImage(sprite, p.x - 5, p.y - 5, 10, 10);
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
    }, [reduced, launch]);

    const change = (e: React.MouseEvent<HTMLButtonElement>, row: Row, delta: number) => {
        setCounts((prev) => ({
            ...prev,
            [row.key]: Math.min(MAX_COUNT, Math.max(row.min, (prev[row.key] ?? 0) + delta)),
        }));
        if (delta > 0) burstFrom(e, 22);
    };

    const ticker = [...content.highlights, content.theme];

    return (
        <div
            ref={rootRef}
            className={`pt${scripted ? ' pt-js' : ''}${gate === 'open' ? ' pt-gated' : ''}`}
            style={{ ['--mask-url' as string]: `url("${mask}")` }}
            onClick={onStageClick}
        >
            <div className="pt-bg" style={{ backgroundImage: `url("${photo}")` }} aria-hidden="true" />
            <div className="pt-grade" aria-hidden="true" />
            <div className="pt-beams" aria-hidden="true"><i /><i /><i /></div>
            <div className="pt-veil" aria-hidden="true" />
            <div className="pt-grain" aria-hidden="true" />
            <canvas ref={canvasRef} className="pt-canvas" aria-hidden="true" />

            {gate !== 'gone' && (
                <div className={`pt-gate${gate === 'leaving' ? ' out' : ''}`} role="dialog" aria-modal="true" aria-labelledby="pt-gate-title">
                    <div className="pt-curtain l" aria-hidden="true" />
                    <div className="pt-curtain r" aria-hidden="true" />
                    <div className="pt-valance" aria-hidden="true" />
                    <div className="pt-gate-in">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={mask} alt="" width={709} height={502} />
                        <p className="pt-gate-pre pt-cinzel">{content.presenter}</p>
                        <h2 id="pt-gate-title" className="pt-serif">{content.titleMain} <em>{content.titleAccent}</em></h2>
                        <p className="pt-gate-theme pt-serif">{content.theme}</p>
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
                <Link href="/">Olivia Alleppey</Link>
                <div>
                    <Link href="/rooms">Rooms</Link>
                    {!over && <a href="#reserve">Prices</a>}
                </div>
            </nav>

            <main className="pt-main">
                <section className="pt-hero">
                    <div className="pt-mask">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={mask} alt="Gold masquerade mask" width={709} height={502} />
                    </div>
                    <p className="pt-pre pt-cinzel">{content.eyebrow}</p>
                    <h1 className="pt-title pt-serif">
                        {content.titleMain} <em>{content.titleAccent}</em>
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
                    {!reduced && <p className="pt-hint"><Sparkles aria-hidden="true" /> Tap anywhere to light a firework</p>}
                    <div className="pt-scroll" aria-hidden="true"><i /></div>
                </section>

                <div className="pt-ticker" aria-hidden="true">
                    <div className="pt-ticker-track pt-cinzel">
                        {[...ticker, ...ticker].map((item, i) => <span key={i}>{item}</span>)}
                    </div>
                </div>

                <section className="pt-section">
                    <Ornament />
                    <p className="pt-kicker pt-cinzel" data-reveal>The night</p>
                    <h2 className="pt-h2 pt-serif" data-reveal>The Grand <em>Masquerade</em></h2>
                    <p className="pt-lede" data-reveal>{content.intro}</p>
                    <div className="pt-grid">
                        {content.highlights.map((title) => {
                            const detail = DETAILS[title];
                            const Icon = detail?.icon ?? Sparkles;
                            return (
                                <article key={title} className="pt-card" data-reveal {...tiltHandlers(9)}>
                                    <span className="pt-card-icon"><Icon aria-hidden="true" /></span>
                                    <h3 className="pt-serif">{title}</h3>
                                    {detail && <p>{detail.note}</p>}
                                </article>
                            );
                        })}
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
                        <div className="pt-list" data-calm>
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

                        <aside className="pt-ticket" aria-label="Your plan" {...tiltHandlers(4)} data-calm>
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
                        <div className="pt-enquire" data-reveal data-calm>
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
                                onSent={() => {
                                    burst(window.innerWidth / 2, window.innerHeight / 2, 160);
                                    launch(window.innerWidth * 0.3, window.innerHeight * 0.25);
                                    launch(window.innerWidth * 0.7, window.innerHeight * 0.2);
                                }}
                            />
                        </div>
                    </section>
                )}

                <p className="pt-end"><Link href="/">Olivia Alleppey</Link> · Alappuzha, Kerala</p>
            </main>

            <button type="button" className={`pt-music${playing ? ' on' : ''}`} onClick={toggleMusic} aria-pressed={playing}>
                <span className="pt-eq" aria-hidden="true"><i /><i /><i /><i /></span>
                {playing ? 'Music on' : 'Play music'}
            </button>

            {!over && gate === 'gone' && (
                <div className="pt-bar">
                    <a href="#reserve" className="pt-btn pt-btn-gold">
                        {formatRupees(total)}{onRequest ? '+' : ''} · {people} {people === 1 ? 'guest' : 'guests'}
                    </a>
                </div>
            )}
        </div>
    );
}
