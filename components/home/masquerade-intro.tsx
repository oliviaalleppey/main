'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';


// Runs before first paint, so visitors who asked for reduced motion never get a flash of the intro.
const GUARD = `try{if(matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.setAttribute('data-masq-seen','1')}}catch(e){}`;

// Plays on every full page load or refresh, but not again when someone navigates back to the homepage
// from another page of the site (this module stays loaded during that navigation).
let playedThisLoad = false;

const OPEN_DURATION_MS = 1900;

const GOLD_TEXT = 'bg-gradient-to-b from-[#fff6d8] via-[#f0cf7a] to-[#b8883f] bg-clip-text text-transparent';
const cinzel = { fontFamily: 'var(--font-cinzel), serif' } as const;

type Phase = 'playing' | 'opening' | 'done';

/**
 * Curtain-raiser for the Grand Masquerade opener. Plays on every page load: the title appears on closed velvet curtains,
 * then they part onto the page, but only when the visitor presses Enter. That tap also lets the music start.
 */
export default function MasqueradeIntro() {
    const [phase, setPhase] = useState<Phase>(() => (playedThisLoad ? 'done' : 'playing'));

    const open = useCallback(() => {
        setPhase((p) => (p === 'playing' ? 'opening' : p));
    }, []);

    // The guard script has already hidden the intro for repeat visitors; just finish in that case.
    useEffect(() => {
        if (document.documentElement.hasAttribute('data-masq-seen')) {
            setPhase('done');
            return;
        }
        if (playedThisLoad) return;
        playedThisLoad = true;
    }, []);

    // Once the curtains start to part, remove the overlay when they're clear of the screen.
    useEffect(() => {
        if (phase !== 'opening') return;
        const t = setTimeout(() => setPhase('done'), OPEN_DURATION_MS + 200);
        return () => clearTimeout(t);
    }, [phase]);

    // No scrolling behind the curtains.
    useEffect(() => {
        if (phase === 'done') return;
        if (document.documentElement.hasAttribute('data-masq-seen')) return;
        const html = document.documentElement;
        const prev = html.style.overflow;
        html.style.overflow = 'hidden';
        return () => {
            html.style.overflow = prev;
        };
    }, [phase]);

    const opening = phase === 'opening';
    const slide = { duration: OPEN_DURATION_MS / 1000, ease: [0.7, 0, 0.2, 1] as [number, number, number, number] };

    return (
        <>
            <script dangerouslySetInnerHTML={{ __html: GUARD }} />
            <style>{`
                html[data-masq-seen] .masq-intro { display: none !important; }
                .masq-curtain {
                    background:
                        repeating-linear-gradient(90deg, rgba(0,0,0,.42) 0 3px, transparent 3px 30px, rgba(255,130,130,.12) 30px 36px, transparent 36px 66px),
                        linear-gradient(180deg, #61101c 0%, #420812 55%, #240409 100%);
                }
                .masq-curtain::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(180deg, rgba(0,0,0,.55) 0%, transparent 22%, transparent 70%, rgba(0,0,0,.6) 100%);
                    pointer-events: none;
                }
                .masq-fringe {
                    background: linear-gradient(180deg, #fff1c4, #d9b668 45%, #8f6a2c);
                    box-shadow: 0 0 18px rgba(240,205,120,.6);
                }
                .masq-intro-glow { animation: masq-intro-glow 3.2s ease-in-out infinite; }
                @keyframes masq-intro-glow { 50% { filter: drop-shadow(0 0 16px rgba(240,205,120,.55)); } }
            `}</style>

            {phase !== 'done' && (
                <div className="masq-intro fixed inset-0 z-[100] overflow-hidden" role="presentation">
                    {/* Closed curtains, parting to the sides */}
                    <motion.div
                        className="masq-curtain absolute inset-y-0 left-0 w-1/2"
                        animate={{ x: opening ? '-102%' : '0%' }}
                        transition={slide}
                    >
                        <span className="masq-fringe absolute inset-y-0 right-0 w-[3px]" />
                    </motion.div>
                    <motion.div
                        className="masq-curtain absolute inset-y-0 right-0 w-1/2"
                        animate={{ x: opening ? '102%' : '0%' }}
                        transition={slide}
                    >
                        <span className="masq-fringe absolute inset-y-0 left-0 w-[3px]" />
                    </motion.div>

                    {/* The title card, hung on the curtains */}
                    <motion.div
                        className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center"
                        animate={{ opacity: opening ? 0 : 1, scale: opening ? 1.06 : 1 }}
                        transition={{ duration: 0.9, ease: 'easeIn' }}
                    >
                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 0.3, duration: 1.2, ease: 'easeOut' }}
                            className="h-px w-48 md:w-80 bg-gradient-to-r from-transparent via-[#f0cf7a] to-transparent"
                        />

                        <motion.p
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9, duration: 1 }}
                            className="mt-6 text-[10px] md:text-xs uppercase tracking-[0.5em] text-[#e8cf94]"
                            style={cinzel}
                        >
                            Olivia Alleppey presents
                        </motion.p>

                        <motion.h2
                            initial={{ opacity: 0, filter: 'blur(14px)', letterSpacing: '0.5em' }}
                            animate={{ opacity: 1, filter: 'blur(0px)', letterSpacing: '0.12em' }}
                            transition={{ delay: 1.7, duration: 1.6, ease: 'easeOut' }}
                            className={`masq-intro-glow mt-5 font-bold uppercase leading-[1.05] text-4xl sm:text-6xl md:text-7xl xl:text-8xl ${GOLD_TEXT}`}
                            style={cinzel}
                        >
                            The Grand
                            <span className="block">Masquerade</span>
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 3.3, duration: 1 }}
                            className="mt-6 text-[10px] md:text-sm uppercase tracking-[0.45em] text-[#e8cf94]"
                            style={cinzel}
                        >
                            New Year&rsquo;s Eve &middot; 31 December
                        </motion.p>

                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 0.3, duration: 1.2, ease: 'easeOut' }}
                            className="mt-8 h-px w-48 md:w-80 bg-gradient-to-r from-transparent via-[#f0cf7a] to-transparent"
                        />

                        <motion.button
                            type="button"
                            onClick={open}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 2.4, duration: 0.9 }}
                            className="mt-10 border border-[#d9b668]/70 bg-black/40 px-8 py-3 text-[11px] uppercase tracking-[0.35em] text-[#f3dc9c] backdrop-blur hover:bg-[#d9b668] hover:text-[#1a0d06] transition-colors"
                            style={cinzel}
                        >
                            Enter &#9835;
                        </motion.button>
                    </motion.div>

                </div>
            )}
        </>
    );
}
