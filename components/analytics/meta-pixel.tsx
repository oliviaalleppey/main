'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import {
    CONSENT_EVENT,
    CONSENT_STORAGE_KEY,
    META_PIXEL_ID,
    type ConsentChoice,
} from '@/lib/analytics';

declare global {
    interface Window {
        fbq?: ((...args: unknown[]) => void) & { queue?: unknown[] };
        _fbq?: unknown;
    }
}

/**
 * Meta's standard base snippet, with two deliberate changes:
 *
 * 1. `fbq('consent', 'revoke')` runs before init, so nothing is sent until the
 *    guest accepts. The banner offers "Essential Only" as a real decline, and
 *    unlike GA's Consent Mode the pixel has no cookieless mode — revoke is the
 *    only way to honour that choice.
 * 2. No `fbq('track', 'PageView')` here. This is a single-page app, so the one
 *    automatic hit would be the only one ever sent; PageViewTracker below fires
 *    every view, the first one included.
 */
const bootstrap = `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('consent', 'revoke');
try {
  if (window.localStorage.getItem('${CONSENT_STORAGE_KEY}') === 'accepted') {
    fbq('consent', 'grant');
  }
} catch (e) {}
fbq('init', '${META_PIXEL_ID}');
`;

/**
 * Sends a PageView on first render and on every client-side navigation.
 *
 * Behind Suspense for the same reason as the GA tracker: useSearchParams()
 * opts the nearest boundary out of static rendering.
 */
function PageViewTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        window.fbq?.('track', 'PageView');
        // searchParams is a dependency so that campaign landings which differ
        // only by query string (?utm_source=…, ?promo=…) count as their own view.
    }, [pathname, searchParams]);

    return null;
}

/** Applies the guest's banner choice to the pixel without a page reload. */
function ConsentBridge() {
    useEffect(() => {
        const handler = (event: Event) => {
            const choice = (event as CustomEvent<ConsentChoice>).detail;
            if (!window.fbq) return;

            window.fbq('consent', choice === 'accepted' ? 'grant' : 'revoke');

            // The PageView for this session was dropped while consent was
            // pending, so replay it rather than losing the landing page.
            if (choice === 'accepted') window.fbq('track', 'PageView');
        };

        window.addEventListener(CONSENT_EVENT, handler);
        return () => window.removeEventListener(CONSENT_EVENT, handler);
    }, []);

    return null;
}

export default function MetaPixel() {
    // Keeps localhost and preview builds out of the production pixel.
    if (process.env.NODE_ENV !== 'production') return null;

    // Meta's snippet ends with a <noscript> tracking image. It is omitted on
    // purpose: it is server-rendered and fires before any consent choice can be
    // read, which would leak a hit from every guest who picked "Essential Only".
    return (
        <>
            <Script id="meta-pixel-bootstrap" strategy="afterInteractive">
                {bootstrap}
            </Script>
            <ConsentBridge />
            <Suspense fallback={null}>
                <PageViewTracker />
            </Suspense>
        </>
    );
}
