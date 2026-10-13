'use client';

import { useEffect, useRef, useState, type Ref } from 'react';
import { NOIR_BACKDROP, formatRupees, type PartyPopupSettings } from '@/lib/config/party-popup';

/**
 * The Dark Night masquerade: the candlelit mask photo as a fixed backdrop,
 * graded red and black with a touch of purple, a soft light that follows the
 * pointer, film grain, and gold. Quiet on purpose. Adds a black card with every
 * price and a mood board.
 */

/** The fixed backdrop behind the whole page; it dims as the guest scrolls into the details. */
export function NoirBackdrop({ reduced }: { reduced: boolean }) {
    const lightRef = useRef<HTMLDivElement>(null);
    const dimRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let queued = false;
        let x = window.innerWidth / 2;
        let y = window.innerHeight * 0.4;
        const paint = () => {
            queued = false;
            if (lightRef.current) lightRef.current.style.transform = `translate3d(${x.toFixed(0)}px,${y.toFixed(0)}px,0)`;
            if (dimRef.current) dimRef.current.style.opacity = Math.min(0.62, window.scrollY / window.innerHeight * 0.62).toFixed(2);
        };
        const queue = () => {
            if (queued) return;
            queued = true;
            requestAnimationFrame(paint);
        };
        const onMove = (e: PointerEvent) => {
            if (e.pointerType !== 'mouse' || reduced) return;
            x = e.clientX;
            y = e.clientY;
            queue();
        };
        window.addEventListener('pointermove', onMove, { passive: true });
        window.addEventListener('scroll', queue, { passive: true });
        paint();
        return () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('scroll', queue);
        };
    }, [reduced]);

    return (
        <div className="nr-scene" aria-hidden="true">
            <div className="nr-photo" style={{ backgroundImage: `url("${NOIR_BACKDROP}")` }} />
            <div className="nr-grade" />
            <div ref={lightRef} className="nr-light" />
            <div ref={dimRef} className="nr-dim" />
            <div className="nr-grain" />
        </div>
    );
}

/** The opening's own layers over the fixed backdrop: a shade that drifts, and a glow that follows the beat. */
export function NoirHero({ backRef, glowRef }: { backRef: Ref<HTMLDivElement>; glowRef: Ref<HTMLDivElement> }) {
    return (
        <>
            <div ref={backRef} className="nr-hero-shade" aria-hidden="true" />
            <div ref={glowRef} className="nr-hero-glow" aria-hidden="true" />
        </>
    );
}

/** Camera moves across the candlelit photo, one for each highlight. */
const SHOTS: [string, number][] = [
    ['56% 30%', 1.7],
    ['66% 80%', 1.9],
    ['32% 62%', 1.8],
    ['14% 14%', 2],
    ['50% 45%', 1.08],
];

export function NoirFrame({ act }: { act: number }) {
    const [origin, zoom] = SHOTS[act % SHOTS.length];
    return (
        <div className="pt-night-frame nr-frame">
            <i style={{ backgroundImage: `url("${NOIR_BACKDROP}")`, transformOrigin: origin, transform: `scale(${zoom})` }} />
            <span className="pt-night-num" key={act}>{String(act + 1).padStart(2, '0')}</span>
        </div>
    );
}

/** A spotlight that opens on the stage as the statement's words light up. */
export function NoirSpot({ bind }: { bind: (update: ((p: number) => void) | null) => void }) {
    const spotRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        bind((p) => {
            const el = spotRef.current;
            if (!el) return;
            el.style.opacity = (0.25 + p * 0.75).toFixed(2);
            el.style.transform = `scale(${(0.7 + p * 0.5).toFixed(3)})`;
        });
        return () => bind(null);
    }, [bind]);
    return <div ref={spotRef} className="nr-spot" aria-hidden="true" />;
}

/** A black metal card with the prices: it leans toward the pointer and turns over on a tap. */
export function NoirInvite({ content, over }: { content: PartyPopupSettings; over: boolean }) {
    const [back, setBack] = useState(false);
    const nrPrice = content.pricePerCoupleNonResidential;
    const stays = { R: 'R', NR: 'NR', both: 'R & NR' } as const;

    return (
        <section className="nr-invite pt-section" aria-labelledby="nr-invite-title">
            <p className="pt-kicker pt-cinzel" data-reveal>By invitation only</p>
            <h2 id="nr-invite-title" className="pt-h2 pt-serif" data-reveal>The black <em>card</em></h2>
            <p className="pt-lede" data-reveal>Every pass to the night on one card. Tap it to turn it over for the full price list.</p>
            <div className="nr-card-stage" data-reveal>
                <button
                    type="button"
                    className={`nr-card${back ? ' back' : ''}`}
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
                    <span className="nr-card-in">
                        <span className="nr-face nr-front">
                            <span className="nr-card-row">
                                <span className="nr-brand">Olivia Alleppey</span>
                                <span className="nr-small">By invitation</span>
                            </span>
                            <span className="nr-chip" aria-hidden="true"><i /><i /><i /></span>
                            <span className="nr-card-name pt-serif">{content.theme}</span>
                            <span className="nr-card-price">
                                <b className="pt-serif">{formatRupees(content.pricePerCouple)}</b>
                                <span>Couple pass · room for the night included</span>
                            </span>
                            <span className="nr-card-row nr-card-foot">
                                <span>Admits two</span>
                                <span>{content.dateValue} · {content.timeValue}</span>
                            </span>
                            <span className="nr-turn" aria-hidden="true">Tap to turn over ↻</span>
                        </span>
                        <span className="nr-face nr-back">
                            <span className="nr-stripe" aria-hidden="true" />
                            <span className="nr-small">Every pass, at a glance</span>
                            <span className="nr-prices">
                                <span><span>Couple pass, staying <em>R</em></span><b>{formatRupees(content.pricePerCouple)}</b></span>
                                <span><span>Couple pass, party only <em>NR</em></span><b>{nrPrice ? formatRupees(nrPrice) : 'On request'}</b></span>
                                {content.guestPrices.map((g) => (
                                    <span key={`${g.label}${g.stay}`}>
                                        <span>{g.label} <small>{g.note}</small> <em>{stays[g.stay]}</em></span>
                                        <b>{formatRupees(g.price)}</b>
                                    </span>
                                ))}
                            </span>
                            <span className="nr-small nr-fine">R staying at Olivia · NR party only · {content.finePrint}</span>
                        </span>
                    </span>
                    <span className="nr-glare" aria-hidden="true" />
                </button>
            </div>
            {!over && (
                <div className="pt-ctas nr-invite-ctas" data-reveal>
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
    { key: 'candle', name: 'Candlelight', note: 'Low gold light on every table, and nothing brighter.', wide: true },
    { key: 'crimson', name: 'Crimson', note: 'One red light, burning till midnight.', mood: 'crimson', tall: true },
    { key: 'guests', name: 'The guest list', note: 'Kerala’s crème de la crème, by invitation.' },
    { key: 'sound', name: 'The sound', note: 'A live DJ, building to midnight.', wide: true },
];

/** The mood board: colours and textures of the night. Tapping a colour sets the mood of the whole page. */
export function NoirMoodBoard() {
    const [mood, setMood] = useState<string>('crimson');
    const rootRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const page = rootRef.current?.closest<HTMLElement>('.pt');
        if (page) page.dataset.mood = mood;
    }, [mood]);

    return (
        <section ref={rootRef} className="nr-board pt-section" aria-labelledby="nr-board-title">
            <p className="pt-kicker pt-cinzel" data-reveal>The mood board</p>
            <h2 id="nr-board-title" className="pt-h2 pt-serif" data-reveal>Quiet luxury, <em>loud midnight</em></h2>
            <p className="pt-lede" data-reveal>Tap a colour to set the mood of the night.</p>
            <div className="nr-tiles" data-reveal>
                {MOODS.map((m) => {
                    const pick = m.mood;
                    const inner = (
                        <>
                            <span className={`nr-tile-art nr-art-${m.key}`} aria-hidden="true">
                                {m.key === 'dress' && <MaskMark />}
                                {m.key === 'candle' && <span className="nr-flames"><i /><i /><i /></span>}
                                {m.key === 'guests' && <span className="nr-creme pt-serif">Crème de la crème</span>}
                                {m.key === 'sound' && <span className="nr-bars"><i /><i /><i /><i /><i /><i /><i /></span>}
                            </span>
                            <span className="nr-tile-text">
                                <b className="pt-serif">{m.name}</b>
                                <span>{m.note}</span>
                            </span>
                        </>
                    );
                    const cls = `nr-tile${m.wide ? ' wide' : ''}${m.tall ? ' tall' : ''}${pick && pick === mood ? ' on' : ''}`;
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
