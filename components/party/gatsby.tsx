'use client';

import { useEffect, useRef, type MutableRefObject, type Ref } from 'react';

/** Hands the parent a function it calls with scroll progress, 0 to 1; null when unmounted. */
type Bind = (update: ((p: number) => void) | null) => void;

/**
 * The Gatsby ball's scenery, all drawn in the browser (no photos): a night sky
 * over the water with a rising Art Deco sun, searchlights and fireworks; a
 * clock that runs to midnight; and a tunnel of marquee arches.
 */

type Burst = 'peony' | 'willow' | 'ring';
type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; c: string; w: number; drag: number; g: number; tail: number; twinkle: boolean };
type Rocket = { x: number; y: number; vx: number; vy: number; kind: Burst; colors: string[] };
type Flash = { x: number; y: number; life: number; size: number };
type Star = { x: number; y: number; s: number; a: number; sp: number; t: number };
type Glint = { x: number; y: number; len: number; a: number; sp: number; t: number; vx: number };

const GOLD = ['#fff3d1', '#f6d98f', '#ebbd62', '#ffe7b0'];
const CHAMPAGNE = ['#fffaf0', '#f5e6c4', '#ead39f'];
const ROSE = ['#ffd9c9', '#f5b9a3', '#fff2ea'];
const EMERALD = ['#a8f7d8', '#45d9a6', '#e3fff3'];
const PALETTES = [GOLD, GOLD, CHAMPAGNE, ROSE, EMERALD];
const KINDS: Burst[] = ['peony', 'peony', 'willow', 'ring'];
const ROCKET_GRAVITY = 0.055;
const MAX_SPARKS = 900;
const MAX_ROCKETS = 9;

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** A soft round glow in one colour, drawn once and stamped wherever it is needed. */
function glowSprite(rgb: string) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const s = c.getContext('2d')!;
    const g = s.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.18, `rgba(${rgb},.75)`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    s.fillStyle = g;
    s.fillRect(0, 0, 64, 64);
    return c;
}

export function GatsbySky({
    backRef,
    glowRef,
    beatRef,
    reduced,
}: {
    backRef: Ref<HTMLDivElement>;
    glowRef: Ref<HTMLDivElement>;
    beatRef: MutableRefObject<number>;
    reduced: boolean;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const horizonRef = useRef<HTMLDivElement>(null);
    const hintRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const horizonEl = horizonRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !horizonEl || !ctx) return;
        const hero = canvas.closest('section');

        const gold = glowSprite('246,217,143');
        const green = glowSprite('69,217,166');

        let width = 0;
        let height = 0;
        let horizon = 0;
        let small = false;
        let stars: Star[] = [];
        let glints: Glint[] = [];
        const sparks: Spark[] = [];
        const rockets: Rocket[] = [];
        const flashes: Flash[] = [];

        // Most of the light on the water lies in a path under the glow at the centre.
        const glint = (): Glint => {
            const depth = Math.pow(Math.random(), 1.5);
            const spread = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
            return {
                x: width / 2 + spread * width * (0.1 + depth * 0.3),
                y: horizon + 4 + depth * (height - horizon - 8),
                len: rand(6, 24) * (0.6 + depth),
                a: rand(0.3, 0.85) * (1 - depth * 0.45),
                sp: rand(1.5, 4),
                t: Math.random() * 7,
                vx: rand(-0.12, 0.12),
            };
        };

        const seed = () => {
            stars = Array.from({ length: small ? 70 : 150 }, () => ({
                x: Math.random() * width,
                y: Math.pow(Math.random(), 1.35) * (horizon - 14),
                s: Math.random() < 0.1 ? 1.7 : rand(0.6, 1.15),
                a: rand(0.25, 0.9),
                sp: rand(0.6, 2.2),
                t: Math.random() * 7,
            }));
            glints = Array.from({ length: small ? 45 : 90 }, glint);
        };

        const greenX = () => width * (small ? 0.09 : 0.12);

        const drawScenery = (time: number) => {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = '#fff4dc';
            for (const s of stars) {
                ctx.globalAlpha = s.a * (0.55 + 0.45 * Math.sin(time * s.sp + s.t));
                ctx.fillRect(s.x, s.y, s.s, s.s);
            }
            ctx.fillStyle = '#f3d48c';
            for (let i = 0; i < glints.length; i++) {
                const g = glints[i];
                g.x += g.vx;
                const f = 0.5 + 0.5 * Math.sin(time * g.sp + g.t);
                ctx.globalAlpha = g.a * f * f;
                ctx.fillRect(g.x - g.len / 2, g.y, g.len, 1.3);
                if (g.x < -30 || g.x > width + 30) glints[i] = glint();
            }

            // The green light across the water, and its reflection.
            ctx.globalCompositeOperation = 'lighter';
            const gx = greenX();
            const pulse = 0.75 + 0.25 * Math.sin(time * 1.6);
            ctx.globalAlpha = pulse;
            ctx.drawImage(green, gx - 15, horizon - 17, 30, 30);
            ctx.fillStyle = '#8ff0c8';
            for (let k = 0; k < 8; k++) {
                const len = (11 - k) * 1.5;
                ctx.globalAlpha = pulse * (0.55 - k * 0.06) * (0.6 + 0.4 * Math.sin(time * 5 + k * 1.7));
                ctx.fillRect(gx - len / 2 + Math.sin(time * 2 + k) * 1.5, horizon + 5 + k * 6 + k * k * 0.9, len, 1.4);
            }
        };

        const resize = () => {
            width = canvas.clientWidth;
            height = canvas.clientHeight;
            small = width < 700;
            horizon = horizonEl.offsetTop;
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            seed();
            if (reduced) {
                ctx.clearRect(0, 0, width, height);
                drawScenery(0);
                ctx.globalAlpha = 1;
            }
        };

        /** Sends a rocket up from the water so that it bursts at (tx, ty). */
        const launch = (tx: number, ty: number, kind: Burst = pick(KINDS)) => {
            if (rockets.length >= MAX_ROCKETS) return;
            const x0 = tx + rand(-0.05, 0.05) * width;
            const y0 = horizon + 2;
            const vy = -Math.sqrt(2 * ROCKET_GRAVITY * Math.max(40, y0 - ty));
            const frames = -vy / ROCKET_GRAVITY;
            rockets.push({ x: x0, y: y0, vx: (tx - x0) / frames, vy, kind, colors: kind === 'willow' ? GOLD : pick(PALETTES) });
        };
        const launchSomewhere = (kind?: Burst) => launch(rand(0.12, 0.88) * width, rand(0.1, 0.62) * horizon, kind);

        const explode = (r: Rocket) => {
            const base = r.kind === 'ring' ? 56 : r.kind === 'willow' ? 84 : 100;
            const count = Math.min(Math.round(base * (small ? 0.6 : 1)), MAX_SPARKS - sparks.length);
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2 + rand(-0.06, 0.06);
                const speed =
                    r.kind === 'ring' ? 3 : r.kind === 'willow' ? rand(1.1, 2.6) : 3.5 * (0.5 + 0.5 * Math.sqrt(Math.random()));
                const life = r.kind === 'willow' ? rand(130, 180) : rand(60, 86);
                sparks.push({
                    x: r.x,
                    y: r.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed * (r.kind === 'ring' ? 0.5 : 1),
                    life,
                    max: life,
                    c: pick(r.colors),
                    w: r.kind === 'willow' ? 1.3 : 1.8,
                    drag: r.kind === 'willow' ? 0.982 : 0.964,
                    g: r.kind === 'willow' ? 0.028 : 0.042,
                    tail: r.kind === 'willow' ? 7 : 3.4,
                    twinkle: r.kind === 'willow' || Math.random() < 0.3,
                });
            }
            flashes.push({ x: r.x, y: r.y, life: 1, size: r.kind === 'ring' ? 120 : 170 });
        };

        let frame = 0;
        let running = false;
        let visible = true;
        let last = 0;
        let time = 0;
        let nextAuto = 150;

        const step = (now: number) => {
            frame = requestAnimationFrame(step);
            const dt = last ? Math.min(3, (now - last) / 16.67) : 1;
            last = now;
            time += dt / 60;

            // More fireworks while the music plays.
            nextAuto -= dt * (beatRef.current > 0.02 ? 1.8 : 1);
            if (nextAuto <= 0) {
                launchSomewhere();
                if (Math.random() < 0.25) { launchSomewhere(); launchSomewhere(); }
                nextAuto = rand(70, 165);
            }

            ctx.clearRect(0, 0, width, height);
            drawScenery(time);

            for (let i = flashes.length - 1; i >= 0; i--) {
                const f = flashes[i];
                const size = f.size * (1.5 - f.life * 0.5);
                ctx.globalAlpha = f.life * 0.6;
                ctx.drawImage(gold, f.x - size / 2, f.y - size / 2, size, size);
                const ry = horizon + (horizon - f.y) * 0.55;
                if (ry < height) {
                    ctx.globalAlpha = f.life * 0.3;
                    ctx.drawImage(gold, f.x - size, ry - size * 0.12, size * 2, size * 0.24);
                }
                f.life -= 0.045 * dt;
                if (f.life <= 0) flashes.splice(i, 1);
            }

            ctx.lineCap = 'round';
            ctx.strokeStyle = '#ffe9b8';
            ctx.lineWidth = 2;
            for (let i = rockets.length - 1; i >= 0; i--) {
                const r = rockets[i];
                r.vy += ROCKET_GRAVITY * dt;
                r.x += r.vx * dt;
                r.y += r.vy * dt;
                ctx.globalAlpha = 0.9;
                ctx.beginPath();
                ctx.moveTo(r.x - r.vx * 5, r.y - r.vy * 5);
                ctx.lineTo(r.x, r.y);
                ctx.stroke();
                if (r.vy >= -0.35) {
                    explode(r);
                    rockets.splice(i, 1);
                }
            }

            for (let i = sparks.length - 1; i >= 0; i--) {
                const p = sparks[i];
                const drag = Math.pow(p.drag, dt);
                p.vx *= drag;
                p.vy = p.vy * drag + p.g * dt;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.life -= dt;
                // Anything that falls to the water goes out.
                if (p.life <= 0 || p.y > horizon) {
                    sparks[i] = sparks[sparks.length - 1];
                    sparks.pop();
                    continue;
                }
                const k = p.life / p.max;
                let alpha = Math.min(1, k * 1.7);
                if (p.twinkle && Math.random() < 0.35) alpha *= 0.25;
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = p.c;
                ctx.lineWidth = p.w * (0.55 + 0.45 * k);
                ctx.beginPath();
                ctx.moveTo(p.x - p.vx * p.tail, p.y - p.vy * p.tail);
                ctx.lineTo(p.x, p.y);
                ctx.stroke();

                // Its reflection, squashed and wobbling on the water.
                const ry = horizon + (horizon - p.y) * 0.55;
                if (ry < height) {
                    const wobble = Math.sin(ry * 0.09 + time * 4) * 2.5;
                    ctx.globalAlpha = alpha * 0.28;
                    ctx.beginPath();
                    ctx.moveTo(p.x + wobble - p.vx * p.tail, ry + p.vy * p.tail * 0.55);
                    ctx.lineTo(p.x + wobble, ry);
                    ctx.stroke();
                }
            }
            ctx.globalAlpha = 1;
        };

        const start = () => {
            if (running || reduced) return;
            running = true;
            last = 0;
            frame = requestAnimationFrame(step);
        };
        const stop = () => {
            running = false;
            cancelAnimationFrame(frame);
        };
        const sync = () => (visible && !document.hidden ? start() : stop());

        const io = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            sync();
        });
        io.observe(canvas);
        document.addEventListener('visibilitychange', sync);

        const sizer = new ResizeObserver(resize);
        sizer.observe(canvas);
        resize();

        // The opening volley, as the sun finishes rising.
        const intro = reduced
            ? 0
            : window.setTimeout(() => {
                  launch(width * 0.5, horizon * 0.3, 'peony');
                  launch(width * 0.26, horizon * 0.45, 'willow');
                  launch(width * 0.74, horizon * 0.4, 'ring');
              }, 1700);

        const onTap = (e: PointerEvent) => {
            if (reduced || (e.target as HTMLElement).closest('a,button,input,select,textarea,label')) return;
            const box = canvas.getBoundingClientRect();
            const x = e.clientX - box.left;
            const y = e.clientY - box.top;
            launch(x, Math.min(y, horizon * 0.85));
            hintRef.current?.classList.add('gone');
        };
        hero?.addEventListener('pointerdown', onTap);

        return () => {
            stop();
            io.disconnect();
            sizer.disconnect();
            window.clearTimeout(intro);
            document.removeEventListener('visibilitychange', sync);
            hero?.removeEventListener('pointerdown', onTap);
        };
    }, [beatRef, reduced]);

    return (
        <>
            <div ref={backRef} className="gt-sky" aria-hidden="true">
                <div className="gt-sky-base" />
                <div className="gt-sun" />
                <div ref={glowRef} className="gt-sunglow" />
                <div className="gt-beams"><i /><i /><i /><i /></div>
                <div className="gt-water" />
                <div ref={horizonRef} className="gt-horizon" />
                <canvas ref={canvasRef} className="gt-fx" />
            </div>
            <div className="gt-frame" aria-hidden="true"><i /><i /><i /><i /></div>
            {!reduced && <p ref={hintRef} className="gt-hint" aria-hidden="true">Tap the sky for fireworks</p>}
        </>
    );
}

const NUMERALS = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
const polar = (r: number, deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    // Rounded, so the server and the browser write the same numbers.
    return [Math.round((200 + r * Math.cos(a)) * 100) / 100, Math.round((200 + r * Math.sin(a)) * 100) / 100];
};

/**
 * A Deco clock that runs from eight towards midnight as the guest reads down
 * the list of what the night includes.
 */
export function GatsbyClock({ bind, act }: { bind: Bind; act: number }) {
    const hourRef = useRef<HTMLDivElement>(null);
    const minuteRef = useRef<HTMLDivElement>(null);
    const faceRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let midnight: boolean | null = null;
        const update = (p: number) => {
            // From 8 pm (240 degrees on the hour hand) to midnight (360).
            const minutes = p * 240;
            hourRef.current?.style.setProperty('transform', `rotate(${(240 + minutes / 2).toFixed(2)}deg)`);
            minuteRef.current?.style.setProperty('transform', `rotate(${(minutes * 6).toFixed(1)}deg)`);
            const now = p > 0.985;
            if (now !== midnight) {
                midnight = now;
                faceRef.current?.classList.toggle('midnight', now);
            }
        };
        update(0);
        bind(update);
        return () => bind(null);
    }, [bind]);

    return (
        <div ref={faceRef} className="gt-clock">
            <div className="gt-clock-dial">
                <svg viewBox="0 0 400 400" aria-hidden="true">
                    <defs>
                        <linearGradient id="gtc-gold" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="400" y2="400">
                            <stop offset="0" stopColor="#f6e2ae" />
                            <stop offset=".5" stopColor="#c99a48" />
                            <stop offset="1" stopColor="#f3d999" />
                        </linearGradient>
                        <radialGradient id="gtc-face" cx=".5" cy=".5" r=".5">
                            <stop offset="0" stopColor="#1b1810" />
                            <stop offset="1" stopColor="#0a0a0c" />
                        </radialGradient>
                    </defs>
                    <circle cx="200" cy="200" r="194" fill="url(#gtc-face)" stroke="url(#gtc-gold)" strokeWidth="3" />
                    <circle cx="200" cy="200" r="184" fill="none" stroke="url(#gtc-gold)" strokeWidth=".8" />
                    <g stroke="#d9b56c" strokeWidth=".7" opacity=".28">
                        {Array.from({ length: 48 }, (_, i) => {
                            const [x1, y1] = polar(44, i * 7.5);
                            const [x2, y2] = polar(118, i * 7.5);
                            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
                        })}
                    </g>
                    <g stroke="url(#gtc-gold)" strokeLinecap="round">
                        {Array.from({ length: 60 }, (_, i) => {
                            const hour = i % 5 === 0;
                            const [x1, y1] = polar(hour ? 160 : 170, i * 6);
                            const [x2, y2] = polar(178, i * 6);
                            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={hour ? 3 : 1} />;
                        })}
                    </g>
                    <g className="gt-clock-numerals" textAnchor="middle" dominantBaseline="central">
                        {NUMERALS.map((n, i) => {
                            const [x, y] = polar(138, i * 30);
                            return <text key={n} x={x} y={y}>{n}</text>;
                        })}
                    </g>
                    <circle cx="200" cy="200" r="38" fill="none" stroke="url(#gtc-gold)" strokeWidth="1.2" />
                    <path d="M200 156l6 6-6 6-6-6Z M200 232l6 6-6 6-6-6Z" fill="#d9b56c" />
                    <text className="gt-clock-mark" x="200" y="282" textAnchor="middle">OLIVIA · MMXXVII</text>
                </svg>
                <div ref={hourRef} className="gt-hand gt-hand-h">
                    <svg viewBox="0 0 400 400" aria-hidden="true">
                        <path d="M200 222l-9-22 9-92 9 92Z" fill="url(#gtc-gold)" />
                        <path d="M200 120l7 9-7 9-7-9Z" fill="#0c0b09" />
                    </svg>
                </div>
                <div ref={minuteRef} className="gt-hand gt-hand-m">
                    <svg viewBox="0 0 400 400" aria-hidden="true">
                        <path d="M200 230l-5-30 5-142 5 142Z" fill="url(#gtc-gold)" />
                        <circle cx="200" cy="200" r="9" fill="url(#gtc-gold)" />
                        <circle cx="200" cy="200" r="3" fill="#0c0b09" />
                    </svg>
                </div>
            </div>
            <p className="gt-clock-cap">
                <span className="gt-clock-label">Towards midnight</span>
                <span className="gt-clock-label gt-clock-twelve">Midnight. Happy New Year</span>
            </p>
            <span className="pt-night-num" key={act}>{String(act + 1).padStart(2, '0')}</span>
        </div>
    );
}

const ARCHES = 7;

/** Marquee arches that light up, one after another, as the guest scrolls into them. */
export function GatsbyArches({ bind }: { bind: Bind }) {
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        const arches = Array.from(root.querySelectorAll<HTMLElement>('.gt-arch'));
        let lit = -1;
        bind((p) => {
            root.style.transform = `scale(${(1 + p * 0.22).toFixed(3)})`;
            const next = Math.min(ARCHES, Math.floor(p * ARCHES * 1.3));
            if (next === lit) return;
            lit = next;
            arches.forEach((arch, i) => arch.classList.toggle('on', i < lit));
            root.classList.toggle('all', lit >= ARCHES);
        });
        return () => bind(null);
    }, [bind]);

    return (
        <div className="gt-stage" aria-hidden="true">
            <div ref={rootRef} className="gt-arches">
                {Array.from({ length: ARCHES }, (_, i) => (
                    <div key={i} className="gt-arch" style={{ ['--i' as string]: i }}>
                        <i />
                        <b />
                    </div>
                ))}
            </div>
            <div className="gt-stage-glow" />
        </div>
    );
}

/** A top hat, for the guest tokens on the ticket. */
export function HatGlyph() {
    return (
        <svg viewBox="0 0 64 34" aria-hidden="true">
            <path d="M22 2h20l1.6 15H20.4Z M20.2 18.6h23.6l.4 4H19.8Z M6 27c0-3 12-4.6 26-4.6S58 24 58 27s-12 4-26 4S6 30 6 27Z" />
        </svg>
    );
}

/** A feathered headband, the other guest token. */
export function FeatherGlyph() {
    return (
        <svg viewBox="0 0 64 34" aria-hidden="true">
            <path d="M8 27c9-6.5 39-6.5 48 0l-1.6 3.2c-8.6-5.4-36.2-5.4-44.8 0Z" />
            <circle cx="40" cy="23.4" r="3.6" />
            <path d="M41.5 20.5c-2.4-8 1.2-15.6 9.6-19.5-1.6 5.6-.6 9.2 2.4 12.2-3.4.2-7.2 2.8-12 7.3Z" />
        </svg>
    );
}

/** A Deco fan with stepped lines, between sections; it draws itself in when it scrolls into view. */
export function GatsbyOrnament() {
    const rays = [30, 60, 90, 120, 150].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return `M120 24L${(120 + 22 * Math.cos(a)).toFixed(1)} ${(24 - 22 * Math.sin(a)).toFixed(1)}`;
    });
    return (
        <svg className="gt-orn" viewBox="0 0 240 30" aria-hidden="true" data-reveal>
            <path className="ln" pathLength={1} d="M0 24h88M152 24h88" />
            <path className="ln thin" pathLength={1} d="M24 18h60M156 18h60" />
            <path className="ln" pathLength={1} d="M92 24a28 28 0 0 1 56 0" />
            {rays.map((d) => <path key={d} className="ln thin" pathLength={1} d={d} />)}
            <path className="fill" d="M120 0l4 4-4 4-4-4Z M2 21l3 3-3 3-3-3Z M238 21l3 3-3 3-3-3Z" />
        </svg>
    );
}
