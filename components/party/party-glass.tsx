'use client';

import { useId } from 'react';

export type DrinkKind = 'bubbly' | 'cocktail' | 'mocktail';

type Drink = {
    name: string;
    /** The bowl's outline, in a 100 × 160 box. */
    bowl: string;
    /** Where the poured drink stops, from the top of the box. */
    top: number;
    colors: [string, string];
    /** Where the stem starts; tumblers have none. */
    stem: number | null;
};

export const DRINKS: Record<DrinkKind, Drink> = {
    bubbly: {
        name: 'Bubbly',
        bowl: 'M37 8H63C64 44 61 72 50 88 39 72 36 44 37 8Z',
        top: 17,
        colors: ['#fff0b8', '#e6ad3c'],
        stem: 88,
    },
    cocktail: {
        name: 'Cocktail',
        bowl: 'M12 34H88C88 58 71 71 50 71 29 71 12 58 12 34Z',
        top: 40,
        colors: ['#ff7a8c', '#a3122a'],
        stem: 71,
    },
    mocktail: {
        name: 'Mocktail',
        bowl: 'M27 24H73L68 150H32Z',
        top: 40,
        colors: ['#ffd36e', '#ff6f91'],
        stem: null,
    },
};

const BUBBLES = [
    { x: 44, d: 0 },
    { x: 52, d: 0.6 },
    { x: 48, d: 1.2 },
    { x: 56, d: 0.3 },
    { x: 41, d: 0.9 },
    { x: 59, d: 1.5 },
];

/** A glass that pours itself when it first appears, then fizzes. */
export function Glass({ kind, className = '', full = false }: { kind: DrinkKind; className?: string; full?: boolean }) {
    const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
    const drink = DRINKS[kind];
    const bottom = drink.stem ?? 150;

    return (
        <svg className={`pt-glass${full ? ' full' : ''} ${className}`} viewBox="0 0 100 160" aria-hidden="true">
            <defs>
                <clipPath id={`c${id}`}><path d={drink.bowl} /></clipPath>
                <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={drink.colors[0]} />
                    <stop offset="1" stopColor={drink.colors[1]} />
                </linearGradient>
            </defs>

            {kind === 'mocktail' && <path className="pt-glass-straw" d="M62 2 52 120" />}

            <g clipPath={`url(#c${id})`}>
                <rect className="pt-glass-liquid" x="0" y="0" width="100" height="160" fill={`url(#g${id})`} style={{ ['--top' as string]: `${drink.top}px` }} />
                {BUBBLES.map((b, i) => (
                    <circle
                        key={i}
                        className="pt-glass-bubble"
                        cx={b.x}
                        cy={bottom - 6}
                        r={i % 2 ? 1.6 : 2.2}
                        style={{ animationDelay: `${1.1 + b.d}s`, ['--rise' as string]: `${drink.top - bottom + 10}px` }}
                    />
                ))}
            </g>

            <path className="pt-glass-bowl" d={drink.bowl} />
            <path className="pt-glass-shine" d={kind === 'mocktail' ? 'M33 34 36 130' : kind === 'cocktail' ? 'M22 40C24 52 30 58 36 61' : 'M42 14C41 36 42 56 46 72'} />

            {drink.stem !== null && (
                <>
                    <path className="pt-glass-bowl" d={`M50 ${drink.stem}V146`} />
                    <ellipse className="pt-glass-bowl" cx="50" cy="148" rx="20" ry="4" />
                </>
            )}

            {kind === 'cocktail' && (
                <g className="pt-glass-garnish">
                    <path d="M70 28C71 20 76 15 83 12" fill="none" stroke="#5b8f3a" strokeWidth="1.6" />
                    <circle cx="70" cy="31" r="5.5" fill="#c21a32" />
                    <circle cx="68.3" cy="29.3" r="1.5" fill="#ff9aa6" />
                </g>
            )}
            {kind === 'mocktail' && (
                <g className="pt-glass-garnish">
                    <circle cx="72" cy="24" r="11" fill="#ffe680" stroke="#f2c200" strokeWidth="1.5" />
                    <path d="M72 14V34M62 24H82M65 17 79 31M79 17 65 31" stroke="#f2c200" strokeWidth=".9" />
                </g>
            )}
        </svg>
    );
}
