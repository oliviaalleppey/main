'use client';

import { useEffect, useRef, useState, type Ref } from 'react';
import { formatRupees, type PartyPopupSettings } from '@/lib/config/party-popup';

/**
 * The Gotham masquerade's scenery, drawn in the browser (no photos): Manhattan
 * after dark in black and gold, lit from below in purple and red. The skyline
 * is generated, with a few landmark towers, windows that come and go, beacons
 * on the spires and a little rain; a tap lights a tower floor by floor.
 */

type Win = { x: number; y: number; t: number; warm: boolean };
type Tower = { x0: number; x1: number; top: number; path: Path2D; wins: Win[]; tips: [number, number][]; crown?: (ctx: CanvasRenderingContext2D) => void };
type Bind = (update: ((p: number) => void) | null) => void;

/** A small seeded random, so the city looks the same on every visit. */
function seeded(seed: number) {
    return () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Generates a skyline W wide and H tall, standing on the bottom edge. */
function buildCity(W: number, H: number, layer: 'far' | 'mid', seed: number, scale = 1): Tower[] {
    const r = seeded(seed);
    const between = (a: number, b: number) => a + r() * (b - a);
    const s = Math.min(1.15, Math.max(0.62, W / 1440)) * scale;
    const gx = 5.6 * s;
    const gy = 7.4 * s;
    const towers: Tower[] = [];

    const windows = (x: number, y: number, w: number, h: number, wins: Win[], density = 1) => {
        const d = density * (layer === 'far' ? 0.4 : 0.85);
        for (let wy = y + 6 * s; wy < y + h - 4 * s; wy += gy) {
            for (let wx = x + 3 * s; wx < x + w - 5 * s; wx += gx) {
                if (r() < d) wins.push({ x: wx, y: wy, t: r(), warm: r() < 0.86 });
            }
        }
    };

    let x = -between(0, 30) * s;
    while (x < W + 10) {
        const w = between(layer === 'far' ? 22 : 30, layer === 'far' ? 60 : 84) * s;
        const h = H * between(layer === 'far' ? 0.24 : 0.16, layer === 'far' ? 0.64 : 0.5);
        const path = new Path2D();
        const wins: Win[] = [];
        const tips: [number, number][] = [];
        path.rect(x, H - h, w, h + 1);
        windows(x, H - h, w, h, wins);
        let top = H - h;
        if (r() < 0.45) {
            const w2 = w * between(0.55, 0.8);
            const h2 = h * between(0.08, 0.22);
            path.rect(x + (w - w2) / 2, top - h2, w2, h2 + 1);
            windows(x + (w - w2) / 2, top - h2, w2, h2, wins);
            top -= h2;
            if (r() < 0.35) {
                const w3 = w2 * 0.6;
                const h3 = h * between(0.05, 0.12);
                path.rect(x + (w - w3) / 2, top - h3, w3, h3 + 1);
                top -= h3;
            }
        }
        const roof = r();
        if (layer === 'mid' && roof < 0.2) {
            // A New York water tower.
            const cx = x + w * between(0.3, 0.7);
            path.rect(cx - 5 * s, top - 4 * s, s, 4 * s);
            path.rect(cx + 4 * s, top - 4 * s, s, 4 * s);
            path.rect(cx - 6 * s, top - 13 * s, 12 * s, 9 * s);
            path.moveTo(cx - 7 * s, top - 13 * s);
            path.lineTo(cx, top - 18 * s);
            path.lineTo(cx + 7 * s, top - 13 * s);
            path.closePath();
        } else if (roof < 0.34) {
            const cx = x + w / 2;
            const ah = H * between(0.04, 0.09);
            path.rect(cx - 0.8 * s, top - ah, 1.6 * s, ah + 1);
            tips.push([cx, top - ah]);
        } else if (roof < 0.44) {
            path.moveTo(x + w * 0.1, top);
            path.lineTo(x + w / 2, top - w * 0.35);
            path.lineTo(x + w * 0.9, top);
            path.closePath();
        }
        towers.push({ x0: x, x1: x + w, top, path, wins, tips });
        x += w + between(0, 4) * s;
    }
    if (layer === 'far') return towers;

    // Landmarks, in front of the rest.
    const empire = (cx: number) => {
        const bw = 74 * s;
        const path = new Path2D();
        const wins: Win[] = [];
        let prev = H;
        for (const [f, y] of [[1, 0.5], [0.76, 0.66], [0.52, 0.76], [0.28, 0.82], [0.12, 0.87]]) {
            const w = bw * f;
            const top = H - H * y;
            path.rect(cx - w / 2, top, w, prev - top + 1);
            if (f > 0.2) windows(cx - w / 2, top, w, prev - top, wins);
            prev = top;
        }
        path.rect(cx - s, H - H * 0.96, 2 * s, H * 0.1);
        towers.push({
            x0: cx - bw / 2, x1: cx + bw / 2, top: H - H * 0.96, path, wins, tips: [[cx, H - H * 0.96]],
            // The top floors floodlit purple and red, as the real one is on big nights.
            crown: (ctx) => {
                const g = ctx.createLinearGradient(0, H - H * 0.88, 0, H - H * 0.62);
                g.addColorStop(0, 'rgba(150,70,200,.75)');
                g.addColorStop(0.55, 'rgba(196,24,47,.55)');
                g.addColorStop(1, 'rgba(196,24,47,0)');
                ctx.fillStyle = g;
                ctx.fillRect(cx - bw / 2, H - H * 0.9, bw, H * 0.3);
            },
        });
    };

    const chrysler = (cx: number) => {
        const bw = 50 * s;
        const path = new Path2D();
        const wins: Win[] = [];
        path.rect(cx - bw / 2, H - H * 0.6, bw, H * 0.6 + 1);
        windows(cx - bw / 2, H - H * 0.6, bw, H * 0.6, wins);
        path.rect(cx - bw * 0.36, H - H * 0.66, bw * 0.72, H * 0.06 + 1);
        const tiers = Array.from({ length: 5 }, (_, i) => ({ w: bw * 0.66 * (1 - i * 0.16), base: H - H * (0.66 + i * 0.04) }));
        for (const { w, base } of tiers) {
            path.moveTo(cx - w / 2, base + 1);
            path.lineTo(cx - w / 2, base - H * 0.012);
            path.ellipse(cx, base - H * 0.012, w / 2, H * 0.03, 0, Math.PI, 0);
            path.lineTo(cx + w / 2, base + 1);
            path.closePath();
        }
        const needleBase = tiers[4].base - H * 0.04;
        path.moveTo(cx - 2 * s, needleBase);
        path.lineTo(cx, H - H * 0.97);
        path.lineTo(cx + 2 * s, needleBase);
        path.closePath();
        towers.push({
            x0: cx - bw / 2, x1: cx + bw / 2, top: H - H * 0.97, path, wins, tips: [],
            // The stepped crown, traced in gold.
            crown: (ctx) => {
                ctx.strokeStyle = 'rgba(240,212,150,.85)';
                ctx.lineWidth = Math.max(1, 1.1 * s);
                for (const { w, base } of tiers) {
                    ctx.beginPath();
                    ctx.ellipse(cx, base - H * 0.012, w / 2 - 2.5 * s, H * 0.03 - 2.5 * s, 0, Math.PI, 0);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(255,226,160,.8)';
                    for (let k = 1; k < 6; k++) {
                        const a = Math.PI + (k / 6) * Math.PI;
                        const px = cx + Math.cos(a) * (w / 2 - 6 * s);
                        const py = base - H * 0.012 + Math.sin(a) * (H * 0.03 - 6 * s);
                        ctx.fillRect(px - s, py - s, 2 * s, 2 * s);
                    }
                }
            },
        });
    };

    const freedom = (cx: number) => {
        const bw = 60 * s;
        const top = H - H * 0.84;
        const path = new Path2D();
        const wins: Win[] = [];
        path.moveTo(cx - bw / 2, H + 1);
        path.lineTo(cx - bw * 0.2, top);
        path.lineTo(cx + bw * 0.2, top);
        path.lineTo(cx + bw / 2, H + 1);
        path.closePath();
        path.rect(cx - 0.8 * s, H - H * 0.98, 1.6 * s, H * 0.14);
        for (let wy = top + 8 * s; wy < H - 6 * s; wy += gy * 1.4) {
            const half = bw * 0.2 + (bw * 0.3 * (wy - top)) / (H - top) - 5 * s;
            for (let wx = cx - half; wx < cx + half - 2 * s; wx += gx) {
                if (r() < 0.5) wins.push({ x: wx, y: wy, t: r(), warm: r() < 0.4 });
            }
        }
        towers.push({
            x0: cx - bw / 2, x1: cx + bw / 2, top: H - H * 0.98, path, wins, tips: [[cx, H - H * 0.98]],
            crown: (ctx) => {
                ctx.fillStyle = 'rgba(170,150,210,.07)';
                ctx.beginPath();
                ctx.moveTo(cx, H);
                ctx.lineTo(cx + bw / 2, H);
                ctx.lineTo(cx + bw * 0.2, top);
                ctx.lineTo(cx, top);
                ctx.fill();
            },
        });
    };

    if (W < 700) {
        empire(W * 0.26);
        chrysler(W * 0.74);
    } else {
        empire(W * 0.28);
        chrysler(W * 0.57);
        freedom(W * 0.84);
    }
    return towers;
}

const FILL = { far: '#150d1b', mid: '#09070c' };

/** Paints the towers and the windows lit below `lit` (0 none, 1 all). */
function paintCity(ctx: CanvasRenderingContext2D, towers: Tower[], layer: 'far' | 'mid', lit: number, s: number) {
    const ww = 2.2 * s;
    const wh = 3.2 * s;
    for (const t of towers) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = FILL[layer];
        ctx.fill(t.path);
        if (t.crown) {
            ctx.save();
            ctx.clip(t.path);
            t.crown(ctx);
            ctx.restore();
        }
        for (const w of t.wins) {
            if (w.t >= lit) continue;
            ctx.fillStyle = w.warm ? (layer === 'far' ? '#8a6f86' : '#f0cf86') : '#c9d1ff';
            ctx.globalAlpha = (layer === 'far' ? 0.35 : 0.5) + 0.45 * (1 - w.t / Math.max(lit, 0.01));
            ctx.fillRect(w.x, w.y, ww, wh);
        }
    }
    ctx.globalAlpha = 1;
}

const scaleFor = (W: number, scale = 1) => Math.min(1.15, Math.max(0.62, W / 1440)) * scale;

function sizeCanvas(canvas: HTMLCanvasElement, cap = 1.75) {
    const ctx = canvas.getContext('2d')!;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, cap);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, W, H };
}

function glowSprite(rgb: string) {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.25, `rgba(${rgb},.8)`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 32, 32);
    return c;
}

/** Hero scenery: moon, clouds, a searchlight, two layers of skyline, haze, rain. */
export function GothamSky({ backRef, glowRef, reduced }: { backRef: Ref<HTMLDivElement>; glowRef: Ref<HTMLDivElement>; reduced: boolean }) {
    const farRef = useRef<HTMLCanvasElement>(null);
    const midRef = useRef<HTMLCanvasElement>(null);
    const fxRef = useRef<HTMLCanvasElement>(null);
    const rainRef = useRef<HTMLCanvasElement>(null);
    const farWrap = useRef<HTMLDivElement>(null);
    const nearWrap = useRef<HTMLDivElement>(null);
    const hintRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        const far = farRef.current;
        const mid = midRef.current;
        const fx = fxRef.current;
        const rain = rainRef.current;
        if (!far || !mid || !fx || !rain) return;
        const hero = mid.closest('section');
        const red = glowSprite('230,30,50');

        let towers: Tower[] = [];
        let W = 0;
        let H = 0;
        let s = 1;
        let fctx = fx.getContext('2d')!;
        let rctx = rain.getContext('2d')!;
        let RW = 0;
        let RH = 0;
        type Drop = { x: number; y: number; v: number; l: number };
        let drops: Drop[] = [];
        type Twinkle = { w: Win; on: boolean; life: number };
        const twinkles: Twinkle[] = [];
        const lights: { t: Tower; start: number }[] = [];
        const LIT = 0.34;

        const draw = () => {
            const f = sizeCanvas(far);
            paintCity(f.ctx, buildCity(f.W, f.H, 'far', 7), 'far', 0.5, scaleFor(f.W));
            const m = sizeCanvas(mid);
            W = m.W;
            H = m.H;
            s = scaleFor(W);
            towers = buildCity(W, H, 'mid', 31);
            paintCity(m.ctx, towers, 'mid', LIT, s);
            fctx = sizeCanvas(fx).ctx;
            const rr = sizeCanvas(rain, 1.25);
            rctx = rr.ctx;
            RW = rr.W;
            RH = rr.H;
            drops = Array.from({ length: RW < 700 ? 60 : 130 }, () => ({ x: Math.random() * RW, y: Math.random() * RH, v: 7 + Math.random() * 5, l: 8 + Math.random() * 12 }));
        };

        const ww = () => 2.2 * s;
        const wh = () => 3.2 * s;

        let frame = 0;
        let running = false;
        let visible = true;
        let time = 0;
        const step = (now: number) => {
            frame = requestAnimationFrame(step);
            time = now / 1000;

            // Windows coming on and going off, one at a time.
            if (Math.random() < 0.3 && towers.length) {
                const t = towers[Math.floor(Math.random() * towers.length)];
                const w = t.wins[Math.floor(Math.random() * t.wins.length)];
                if (w) twinkles.push({ w, on: w.t >= LIT, life: 0 });
            }
            fctx.clearRect(0, 0, W, H);
            for (let i = twinkles.length - 1; i >= 0; i--) {
                const k = twinkles[i];
                k.life += 1;
                const a = k.life < 30 ? k.life / 30 : k.life > 330 ? Math.max(0, (360 - k.life) / 30) : 1;
                fctx.globalAlpha = a * (k.on ? 0.85 : 1);
                fctx.fillStyle = k.on ? (k.w.warm ? '#f6d995' : '#d6dcff') : FILL.mid;
                fctx.fillRect(k.w.x, k.w.y, ww(), wh());
                if (k.life >= 360) twinkles.splice(i, 1);
            }
            // A tapped tower lights up from the street to the top, then dims.
            for (let i = lights.length - 1; i >= 0; i--) {
                const { t, start } = lights[i];
                const age = now - start;
                const out = age > 5000 ? Math.max(0, 1 - (age - 5000) / 1200) : 1;
                if (out <= 0) { lights.splice(i, 1); continue; }
                fctx.fillStyle = '#ffe3a0';
                for (const w of t.wins) {
                    const delay = ((H - w.y) / (H - t.top)) * 1100;
                    const a = Math.min(1, Math.max(0, (age - delay) / 180));
                    if (a <= 0) continue;
                    fctx.globalAlpha = a * out;
                    fctx.fillRect(w.x, w.y, ww(), wh());
                }
            }
            // Beacons on the spires.
            for (const t of towers) {
                for (const [bx, by] of t.tips) {
                    const pulse = Math.max(0, Math.sin(time * 2.2 + bx * 0.05));
                    fctx.globalAlpha = 0.15 + pulse * 0.85;
                    fctx.drawImage(red, bx - 7, by - 7, 14, 14);
                }
            }
            fctx.globalAlpha = 1;

            // Fine rain.
            rctx.clearRect(0, 0, RW, RH);
            rctx.strokeStyle = 'rgba(200,190,230,.16)';
            rctx.lineWidth = 1;
            rctx.beginPath();
            for (const d of drops) {
                d.y += d.v;
                d.x -= d.v * 0.12;
                if (d.y > RH) { d.y = -d.l; d.x = Math.random() * RW * 1.1; }
                rctx.moveTo(d.x, d.y);
                rctx.lineTo(d.x + d.l * 0.12, d.y - d.l);
            }
            rctx.stroke();
        };

        const start = () => {
            if (running || reduced) return;
            running = true;
            frame = requestAnimationFrame(step);
        };
        const stop = () => {
            running = false;
            cancelAnimationFrame(frame);
        };
        const sync = () => (visible && !document.hidden ? start() : stop());
        const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); });
        io.observe(mid);
        document.addEventListener('visibilitychange', sync);
        const sizer = new ResizeObserver(draw);
        sizer.observe(mid);
        draw();

        // The far skyline drifts a little against the near one as the pointer moves.
        let queued = false;
        let px = 0;
        const onMove = (e: PointerEvent) => {
            if (e.pointerType !== 'mouse' || reduced) return;
            px = e.clientX / window.innerWidth - 0.5;
            if (queued) return;
            queued = true;
            requestAnimationFrame(() => {
                queued = false;
                if (farWrap.current) farWrap.current.style.transform = `translate3d(${(px * -6).toFixed(1)}px,0,0)`;
                if (nearWrap.current) nearWrap.current.style.transform = `translate3d(${(px * -16).toFixed(1)}px,0,0)`;
            });
        };
        window.addEventListener('pointermove', onMove, { passive: true });

        const onTap = (e: PointerEvent) => {
            if (reduced || (e.target as HTMLElement).closest('a,button,input,select,textarea,label')) return;
            const box = mid.getBoundingClientRect();
            const x = e.clientX - box.left;
            const y = e.clientY - box.top;
            // The frontmost tower under the tap, or the nearest one if the tap is in the sky above it.
            let hit: Tower | undefined;
            for (let i = towers.length - 1; i >= 0; i--) {
                const t = towers[i];
                if (x >= t.x0 && x <= t.x1 && (y >= t.top || !hit)) { hit = t; if (y >= t.top) break; }
            }
            if (!hit) return;
            lights.push({ t: hit, start: performance.now() });
            hintRef.current?.classList.add('gone');
        };
        hero?.addEventListener('pointerdown', onTap);

        return () => {
            stop();
            io.disconnect();
            sizer.disconnect();
            document.removeEventListener('visibilitychange', sync);
            window.removeEventListener('pointermove', onMove);
            hero?.removeEventListener('pointerdown', onTap);
        };
    }, [reduced]);

    return (
        <>
            <div ref={backRef} className="gm-sky" aria-hidden="true">
                <div className="gm-sky-base" />
                <div className="gm-moon" />
                <div className="gm-clouds"><i /><i /></div>
                <div className="gm-beam"><i /></div>
                <div ref={farWrap} className="gm-far"><canvas ref={farRef} /></div>
                <div ref={glowRef} className="gm-glow" />
                <div ref={nearWrap} className="gm-near"><canvas ref={midRef} /><canvas ref={fxRef} /></div>
                <div className="gm-haze" />
                <canvas ref={rainRef} className="gm-rain" />
            </div>
            {!reduced && <p ref={hintRef} className="gm-hint" aria-hidden="true">Tap a tower to light it up</p>}
        </>
    );
}

/** The statement's backdrop: the city's windows come on as the guest scrolls through. */
export function GothamCity({ bind }: { bind: Bind }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        let towers: Tower[] = [];
        let ctx: CanvasRenderingContext2D | null = null;
        let s = 1;
        let drawn = -1;
        let want = 0;

        const paint = (p: number) => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
            paintCity(ctx, towers, 'mid', 0.08 + p * 0.85, s);
            drawn = p;
        };
        const draw = () => {
            const c = sizeCanvas(canvas, 1.5);
            ctx = c.ctx;
            s = scaleFor(c.W, 1.25);
            towers = buildCity(c.W, c.H, 'mid', 53, 1.25);
            paint(want);
        };
        const sizer = new ResizeObserver(draw);
        sizer.observe(canvas);

        bind((p) => {
            want = Math.round(p * 40) / 40;
            if (glowRef.current) glowRef.current.style.opacity = (0.3 + p * 0.7).toFixed(2);
            if (want !== drawn) paint(want);
        });
        return () => {
            sizer.disconnect();
            bind(null);
        };
    }, [bind]);

    return (
        <div className="gm-city" aria-hidden="true">
            <div className="gm-sky-base" />
            <div className="gm-moon" />
            <div className="gm-beam"><i /></div>
            <div ref={glowRef} className="gm-city-glow" />
            <canvas ref={canvasRef} />
            <div className="gm-haze" />
        </div>
    );
}

/** The night's highlights as floors of a brass Art Deco lift, rising to the penthouse. */
export function GothamElevator({ bind, act, count }: { bind: Bind; act: number; count: number }) {
    const rootRef = useRef<HTMLDivElement>(null);
    const needleRef = useRef<HTMLDivElement>(null);
    const labels = [...Array.from({ length: count }, (_, i) => String(i + 1)), 'PH'];
    const angleAt = (i: number) => -70 + (i / (labels.length - 1)) * 140;

    useEffect(() => {
        let open: boolean | null = null;
        const span = ((count - 1) / count) * 140;
        bind((p) => {
            const top = p > 0.97;
            const angle = top ? 70 : -70 + p * span;
            needleRef.current?.style.setProperty('transform', `rotate(${angle.toFixed(1)}deg)`);
            if (top !== open) {
                open = top;
                rootRef.current?.classList.toggle('open', top);
            }
        });
        return () => bind(null);
    }, [bind, count]);

    return (
        <div ref={rootRef} className="gm-lift">
            <div className="gm-dial">
                <svg viewBox="0 0 300 170" aria-hidden="true">
                    <path d="M30 160A120 120 0 0 1 270 160" fill="none" stroke="url(#gm-brass)" strokeWidth="3" />
                    <path d="M44 160A106 106 0 0 1 256 160" fill="none" stroke="url(#gm-brass)" strokeWidth=".8" />
                    <defs>
                        <linearGradient id="gm-brass" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="300" y2="170">
                            <stop offset="0" stopColor="#f1d99c" />
                            <stop offset=".5" stopColor="#a8823e" />
                            <stop offset="1" stopColor="#ecd49a" />
                        </linearGradient>
                    </defs>
                    {labels.map((label, i) => {
                        const a = ((angleAt(i) - 90) * Math.PI) / 180;
                        const x = Math.round((150 + Math.cos(a) * 88) * 10) / 10;
                        const y = Math.round((160 + Math.sin(a) * 88) * 10) / 10;
                        return (
                            <text key={label} x={x} y={y} className={i === Math.min(act, count - 1) && label !== 'PH' ? 'on' : label === 'PH' ? 'ph' : ''} textAnchor="middle" dominantBaseline="central">
                                {label}
                            </text>
                        );
                    })}
                    <circle cx="150" cy="160" r="9" fill="url(#gm-brass)" />
                </svg>
                <div ref={needleRef} className="gm-needle"><i /></div>
            </div>
            <div className="gm-doors">
                <div className="gm-inside">
                    <span className="gm-inside-ph">The Penthouse</span>
                    <span className="gm-inside-sub">Midnight, by invitation</span>
                </div>
                <i className="l" />
                <i className="r" />
            </div>
            <span className="pt-night-num" key={act}>{String(act + 1).padStart(2, '0')}</span>
        </div>
    );
}

/** A black metal card with the prices: it leans toward the pointer and turns over on a tap. */
export function GothamInvite({ content, over }: { content: PartyPopupSettings; over: boolean }) {
    const [back, setBack] = useState(false);
    const nrPrice = content.pricePerCoupleNonResidential;
    const stays = { R: 'R', NR: 'NR', both: 'R & NR' } as const;

    return (
        <section className="gm-invite pt-section" aria-labelledby="gm-invite-title">
            <p className="pt-kicker pt-cinzel" data-reveal>By invitation only</p>
            <h2 id="gm-invite-title" className="pt-h2 pt-serif" data-reveal>The black <em>card</em></h2>
            <p className="pt-lede" data-reveal>Every pass to the night on one card. Tap it to turn it over for the full price list.</p>
            <div className="gm-card-stage" data-reveal>
                <button
                    type="button"
                    className={`gm-card${back ? ' back' : ''}`}
                    onClick={() => setBack((b) => !b)}
                    aria-pressed={back}
                    onPointerMove={(e) => {
                        if (e.pointerType !== 'mouse') return;
                        const el = e.currentTarget;
                        const box = el.getBoundingClientRect();
                        const x = (e.clientX - box.left) / box.width;
                        const y = (e.clientY - box.top) / box.height;
                        el.style.setProperty('--ry', `${((x - 0.5) * 14).toFixed(2)}deg`);
                        el.style.setProperty('--rx', `${((0.5 - y) * 10).toFixed(2)}deg`);
                        el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
                        el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
                    }}
                    onPointerLeave={(e) => {
                        e.currentTarget.style.setProperty('--ry', '0deg');
                        e.currentTarget.style.setProperty('--rx', '0deg');
                    }}
                >
                    <span className="gm-card-in">
                        <span className="gm-face gm-front">
                            <span className="gm-card-row">
                                <span className="gm-brand">Olivia Alleppey</span>
                                <span className="gm-small">By invitation</span>
                            </span>
                            <span className="gm-chip" aria-hidden="true"><i /><i /><i /></span>
                            <span className="gm-card-name pt-serif">{content.theme}</span>
                            <span className="gm-card-price">
                                <b className="pt-serif">{formatRupees(content.pricePerCouple)}</b>
                                <span>Couple pass · room for the night included</span>
                            </span>
                            <span className="gm-card-row gm-card-foot">
                                <span>Admits two</span>
                                <span>{content.dateValue} · {content.timeValue}</span>
                            </span>
                            <span className="gm-turn" aria-hidden="true">Tap to turn over ↻</span>
                        </span>
                        <span className="gm-face gm-back">
                            <span className="gm-stripe" aria-hidden="true" />
                            <span className="gm-small">Every pass, at a glance</span>
                            <span className="gm-prices">
                                <span><span>Couple pass, staying <em>R</em></span><b>{formatRupees(content.pricePerCouple)}</b></span>
                                <span><span>Couple pass, party only <em>NR</em></span><b>{nrPrice ? formatRupees(nrPrice) : 'On request'}</b></span>
                                {content.guestPrices.map((g) => (
                                    <span key={`${g.label}${g.stay}`}>
                                        <span>{g.label} <small>{g.note}</small> <em>{stays[g.stay]}</em></span>
                                        <b>{formatRupees(g.price)}</b>
                                    </span>
                                ))}
                            </span>
                            <span className="gm-small gm-fine">R staying at Olivia · NR party only · {content.finePrint}</span>
                        </span>
                    </span>
                    <span className="gm-glare" aria-hidden="true" />
                </button>
            </div>
            {!over && (
                <div className="pt-ctas gm-invite-ctas" data-reveal>
                    <a href="#reserve" className="pt-btn pt-btn-gold">Plan your night</a>
                    <a href="#enquire" className="pt-btn pt-btn-ghost">{content.enquireLabel}</a>
                </div>
            )}
        </section>
    );
}

const MOODS: { key: string; name: string; note: string; mood?: 'gold' | 'purple' | 'crimson' | 'onyx'; wide?: boolean; tall?: boolean }[] = [
    { key: 'onyx', name: 'Onyx', note: 'Black on black. The room, the suits, the night.', mood: 'onyx', tall: true },
    { key: 'gold', name: 'Gold leaf', note: 'Gold only where it catches the light.', mood: 'gold' },
    { key: 'dress', name: 'Dress code', note: 'Black tie, evening gowns, and a mask.' },
    { key: 'purple', name: 'Royal purple', note: 'Velvet, low and quiet.', mood: 'purple' },
    { key: 'city', name: 'The skyline', note: 'Manhattan after dark, in the Grand Ballroom.', wide: true },
    { key: 'crimson', name: 'Crimson', note: 'One red light, burning till midnight.', mood: 'crimson', tall: true },
    { key: 'guests', name: 'The guest list', note: 'Kerala’s crème de la crème, by invitation.' },
    { key: 'sound', name: 'The sound', note: 'A live DJ, building to midnight.', wide: true },
];

/** The mood board: colours and textures of the night. Tapping a colour sets the mood of the whole page. */
export function GothamMoodBoard() {
    const [mood, setMood] = useState<string>('crimson');
    const rootRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const page = rootRef.current?.closest<HTMLElement>('.pt');
        if (page) page.dataset.mood = mood;
    }, [mood]);

    return (
        <section ref={rootRef} className="gm-board pt-section" aria-labelledby="gm-board-title">
            <p className="pt-kicker pt-cinzel" data-reveal>The mood board</p>
            <h2 id="gm-board-title" className="pt-h2 pt-serif" data-reveal>Quiet luxury, <em>loud midnight</em></h2>
            <p className="pt-lede" data-reveal>Tap a colour to set the mood of the night.</p>
            <div className="gm-tiles" data-reveal>
                {MOODS.map((m) => {
                    const pick = m.mood;
                    const inner = (
                        <>
                            <span className={`gm-tile-art gm-art-${m.key}`} aria-hidden="true">
                                {m.key === 'dress' && <MaskMark />}
                                {m.key === 'city' && <MiniSkyline />}
                                {m.key === 'guests' && <span className="gm-creme pt-serif">Crème de la crème</span>}
                                {m.key === 'sound' && <span className="gm-bars"><i /><i /><i /><i /><i /><i /><i /></span>}
                            </span>
                            <span className="gm-tile-text">
                                <b className="pt-serif">{m.name}</b>
                                <span>{m.note}</span>
                            </span>
                        </>
                    );
                    const cls = `gm-tile${m.wide ? ' wide' : ''}${m.tall ? ' tall' : ''}${pick && pick === mood ? ' on' : ''}`;
                    return pick ? (
                        <button key={m.key} type="button" className={cls} aria-pressed={pick === mood} onClick={() => setMood(pick)}>
                            {inner}
                        </button>
                    ) : (
                        <div key={m.key} className={cls}>{inner}</div>
                    );
                })}
            </div>
        </section>
    );
}

function MaskMark() {
    return (
        <svg viewBox="0 0 64 34" aria-hidden="true">
            <path
                fillRule="evenodd"
                d="M32 10C25 3 13 1 5 5 1 7 0 13 2 19c3 8 12 13 21 10 4-1 6-4 9-4s5 3 9 4c9 3 18-2 21-10 2-6 1-12-3-14-8-4-20-2-27 5ZM13 15c3-3 9-3 12 1-3 4-9 4-12-1Zm38 0c-3-3-9-3-12 1 3 4 9 4 12-1Z"
            />
        </svg>
    );
}

function MiniSkyline() {
    return (
        <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
            <path
                fill="#050407"
                d="M0 120V78h14V62h12v16h10V50h16v70h6V70h14V40h4V20h2V8h2v12h2v20h4v80h8V66h18V54h10v66h6V58l8-6V30l6-14 6 14v22l8 6v62h10V72h20V46h8V34h2V14h2v20h2v12h8v74h10V64h16v56h8V80h14V60h12v60z"
            />
            <g fill="#f0cf86">
                <rect x="40" y="58" width="3" height="4" /><rect x="46" y="70" width="3" height="4" /><rect x="84" y="50" width="3" height="4" />
                <rect x="90" y="64" width="3" height="4" /><rect x="152" y="66" width="3" height="4" /><rect x="160" y="80" width="3" height="4" />
                <rect x="222" y="56" width="3" height="4" /><rect x="228" y="72" width="3" height="4" /><rect x="270" y="74" width="3" height="4" />
            </g>
            <g fill="#e61e32"><circle cx="89" cy="8" r="2" /><circle cx="243" cy="14" r="2" /></g>
        </svg>
    );
}
