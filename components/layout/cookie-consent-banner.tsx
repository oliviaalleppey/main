'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const CONSENT_STORAGE_KEY = 'olivia_cookie_consent';
const CONSENT_COOKIE_NAME = 'olivia_cookie_consent';
const CONSENT_MAX_AGE = 60 * 60 * 24 * 180;

type ConsentChoice = 'accepted' | 'essential';

function readConsentCookie() {
    if (typeof document === 'undefined') return null;

    const match = document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${CONSENT_COOKIE_NAME}=`));

    return match ? decodeURIComponent(match.split('=')[1]) : null;
}

export default function CookieConsentBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const storedChoice = window.localStorage.getItem(CONSENT_STORAGE_KEY);
        const cookieChoice = readConsentCookie();

        if (storedChoice || cookieChoice) return;

        const frameId = window.requestAnimationFrame(() => {
            setIsVisible(true);
        });

        return () => {
            window.cancelAnimationFrame(frameId);
        };
    }, []);

    const saveChoice = (choice: ConsentChoice) => {
        window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
        document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(choice)}; path=/; max-age=${CONSENT_MAX_AGE}; SameSite=Lax`;
        window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: choice }));
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-5 left-5 z-[90] w-[calc(100vw-40px)] max-w-[320px] pointer-events-auto">
            <div className="rounded-2xl border border-[#DED6CB] bg-[#FBF8F3] shadow-[0_16px_48px_-16px_rgba(0,0,0,0.28)] p-5">

                {/* Label */}
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#7A5E28] mb-3">
                    Cookie Notice
                </p>

                {/* Text */}
                <p className="text-[13px] leading-[1.7] text-[#4D4640]">
                    We use essential cookies for secure sign-in and booking sessions.{' '}
                    <Link
                        href="/privacy#cookies"
                        className="font-medium text-[var(--text-dark)] underline underline-offset-3 decoration-[#B68845]"
                    >
                        Cookie Policy
                    </Link>
                </p>

                {/* Buttons */}
                <div className="mt-4 flex gap-2">
                    <button
                        type="button"
                        onClick={() => saveChoice('essential')}
                        className="flex-1 rounded-full border border-[#CFC3B0] bg-white px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[#2D2924] transition-colors hover:bg-[#F8F3EB]"
                    >
                        Essential Only
                    </button>
                    <button
                        type="button"
                        onClick={() => saveChoice('accepted')}
                        className="flex-1 rounded-full bg-[var(--btn-dark)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[var(--text-dark)]"
                    >
                        Accept All
                    </button>
                </div>
            </div>
        </div>
    );
}
