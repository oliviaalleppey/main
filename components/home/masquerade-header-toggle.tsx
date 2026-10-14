'use client';

import { useEffect } from 'react';

const ATTR = 'data-masq-hero';

// Set before first paint, so the header never flashes at the top of the page. The opener is one screen tall,
// so it is on screen exactly while the page is scrolled less than a screen.
const GUARD = `try{if(window.scrollY<window.innerHeight-1){document.documentElement.setAttribute('${ATTR}','1')}}catch(e){}`;

/**
 * Hides the site header while the Grand Masquerade opener is on screen, and brings it back once the opener has
 * scrolled completely out of view. While hidden, the opener also grows into the space the header leaves, so its
 * height plus the header's height is unchanged and nothing below it moves when the header returns.
 */
export default function MasqueradeHeaderToggle() {
    useEffect(() => {
        const html = document.documentElement;
        let raf = 0;

        const update = () => {
            raf = 0;
            const hero = document.querySelector('.masq');
            if (!hero) return;
            const inView = hero.getBoundingClientRect().bottom > 0;
            if (inView) html.setAttribute(ATTR, '1');
            else html.removeAttribute(ATTR);
        };
        const schedule = () => {
            if (!raf) raf = requestAnimationFrame(update);
        };

        update();
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);
        return () => {
            window.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);
            if (raf) cancelAnimationFrame(raf);
            html.removeAttribute(ATTR);
        };
    }, []);

    return (
        <>
            <script dangerouslySetInnerHTML={{ __html: GUARD }} />
            <style>{`
                html { --masq-h: var(--site-header-height, 124px); }
                div.flex-col.min-h-screen > header.sticky { transition: transform .35s ease; }
                html[${ATTR}] div.flex-col.min-h-screen > header.sticky {
                    transform: translateY(-110%);
                    pointer-events: none;
                }
                html[${ATTR}] .masq {
                    --site-header-height: 0px;
                    margin-top: calc(-1 * var(--masq-h));
                }
            `}</style>
        </>
    );
}
