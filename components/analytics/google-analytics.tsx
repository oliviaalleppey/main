'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import {
    CONSENT_EVENT,
    CONSENT_STORAGE_KEY,
    GA_MEASUREMENT_ID,
    type ConsentChoice,
} from '@/lib/analytics';

declare global {
    interface Window {
        dataLayer: unknown[];
        gtag?: (...args: unknown[]) => void;
    }
}

/**
 * Bootstrap script. Runs before the gtag library finishes loading — dataLayer is
 * just a queue, so commands pushed here are replayed once the library arrives.
 *
 * Consent Mode v2 defaults to denied. Under "Essential Only" GA still sends
 * cookieless pings, which gives Google modelled traffic data without storing
 * anything on the guest's device, so the privacy policy's consent promise holds.
 */
const bootstrap = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted'
});
try {
  if (window.localStorage.getItem('${CONSENT_STORAGE_KEY}') === 'accepted') {
    gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted'
    });
  }
} catch (e) {}
gtag('js', new Date());
// send_page_view is disabled because this is a single-page app: the initial
// automatic hit would be the only one, and client-side navigations would never
// be counted. PageViewTracker below sends every view, including the first.
gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
`;

/**
 * Sends a page_view on first render and on every client-side navigation.
 *
 * Kept in its own component behind Suspense: useSearchParams() opts the nearest
 * boundary out of static rendering, and without Suspense that would cascade to
 * the whole page.
 */
function PageViewTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!window.gtag) return;

        const query = searchParams.toString();
        window.gtag('event', 'page_view', {
            page_path: query ? `${pathname}?${query}` : pathname,
            page_location: window.location.href,
            page_title: document.title,
        });
    }, [pathname, searchParams]);

    return null;
}

/** Applies the guest's banner choice to Consent Mode without a page reload. */
function ConsentBridge() {
    useEffect(() => {
        const handler = (event: Event) => {
            const choice = (event as CustomEvent<ConsentChoice>).detail;
            if (!window.gtag) return;

            const granted = choice === 'accepted' ? 'granted' : 'denied';
            window.gtag('consent', 'update', {
                ad_storage: granted,
                ad_user_data: granted,
                ad_personalization: granted,
                analytics_storage: granted,
            });
        };

        window.addEventListener(CONSENT_EVENT, handler);
        return () => window.removeEventListener(CONSENT_EVENT, handler);
    }, []);

    return null;
}

export default function GoogleAnalytics() {
    // Keeps localhost and preview builds out of the production property.
    if (process.env.NODE_ENV !== 'production') return null;

    return (
        <>
            <Script id="ga-bootstrap" strategy="afterInteractive">
                {bootstrap}
            </Script>
            <Script
                id="ga-lib"
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <ConsentBridge />
            <Suspense fallback={null}>
                <PageViewTracker />
            </Suspense>
        </>
    );
}
