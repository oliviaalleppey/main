'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
    DEFAULT_PARTY_BACKGROUND,
    DEFAULT_PARTY_MASK,
    NOIR_BACKDROP,
    PARTY_END,
    PARTY_START,
    formatRupees,
    type PartyPopupSettings,
} from '@/lib/config/party-popup';
import { THEME_FONTS } from '@/components/party/theme-fonts';
import './new-year-popup.css';

const DISMISSED_KEY = 'olivia_31st_night_dismissed';
const HIDE_FOR_MS = 3 * 24 * 60 * 60 * 1000;

function recentlyDismissed(): boolean {
    try {
        const at = Number(window.localStorage.getItem(DISMISSED_KEY));
        return Number.isFinite(at) && at > 0 && Date.now() - at < HIDE_FOR_MS;
    } catch {
        return false;
    }
}

function remember() {
    try {
        window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
        // Private mode: the pop-up simply shows again next visit.
    }
}

function Countdown() {
    const [now, setNow] = useState<number | null>(null);

    useEffect(() => {
        setNow(Date.now());
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    if (now === null) return <div className="ny-count" />;

    const left = Math.max(0, new Date(PARTY_START).getTime() - now);
    const days = Math.floor(left / 864e5);
    const hours = Math.floor((left % 864e5) / 36e5);
    const mins = Math.floor((left % 36e5) / 6e4);
    const secs = Math.floor((left % 6e4) / 1e3);
    const pad = (n: number) => String(n).padStart(2, '0');

    return (
        <div className="ny-count" aria-label="Time until the party">
            <div><b>{days}</b><span>DAYS</span></div>
            <div><b>{pad(hours)}</b><span>HOURS</span></div>
            <div><b>{pad(mins)}</b><span>MINS</span></div>
            <div><b>{pad(secs)}</b><span>SECS</span></div>
        </div>
    );
}

export default function NewYearPopup({ content }: { content: PartyPopupSettings }) {
    const { delaySeconds } = content;
    const [open, setOpen] = useState(false);
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        if (Date.now() >= new Date(PARTY_END).getTime() || recentlyDismissed()) return;
        const timer = window.setTimeout(() => setOpen(true), delaySeconds * 1000);
        return () => window.clearTimeout(timer);
    }, [delaySeconds]);

    const close = useCallback(() => {
        remember();
        setLeaving(true);
        window.setTimeout(() => setOpen(false), 350);
    }, []);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
        };
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = previous;
            document.removeEventListener('keydown', onKey);
        };
    }, [open, close]);

    if (!open) return null;
    const theme = content.pageTheme;

    return (
        <div
            className={`ny-veil ny-${theme} ${THEME_FONTS[theme]}${leaving ? ' ny-out' : ''}`}
            onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
            <div className="ny-modal" role="dialog" aria-modal="true" aria-labelledby="ny-title">
                <div className="ny-frame">
                    <i className="ny-corner ny-c1" /><i className="ny-corner ny-c2" />
                    <i className="ny-corner ny-c3" /><i className="ny-corner ny-c4" />
                    <button type="button" className="ny-x" onClick={close} aria-label="Close">&#10005;</button>

                    {theme === 'gatsby' ? (
                        // The Gatsby look draws its own sky: a Deco sun rising over the water.
                        <div className="ny-photo ny-deco"><span className="ny-tag">{content.presenter}</span></div>
                    ) : theme === 'noir' ? (
                        <div className="ny-photo ny-noir-photo" style={{ backgroundImage: `url("${NOIR_BACKDROP}")` }}><span className="ny-tag">{content.presenter}</span></div>
                    ) : (
                        <div className={`ny-photo${content.backgroundImage ? '' : ' ny-photo-default'}`} style={{ backgroundImage: `url("${content.backgroundImage || DEFAULT_PARTY_BACKGROUND}")` }}><span className="ny-tag">{content.presenter}</span></div>
                    )}

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="ny-mask" src={content.maskImage || DEFAULT_PARTY_MASK} alt="Masquerade mask" width={709} height={502} />

                    <div className="ny-body">
                        <p className="ny-pre">{content.eyebrow}</p>
                        <h2 className="ny-h1" id="ny-title">{content.titleMain} <em>{content.titleAccent}</em></h2>
                        <p className="ny-theme">{content.theme}</p>
                        <div className="ny-orn"><i /><b /><i /></div>
                        <ul className="ny-hl">
                            {content.highlights.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                        <div className="ny-when">
                            <div><small>DATE</small><p>{content.dateValue}</p></div>
                            <div><small>TIME</small><p>{content.timeValue}</p></div>
                            <div><small>DRESS</small><p>{content.dressValue}</p></div>
                        </div>
                        <Countdown />
                        <div className="ny-price">{content.priceLabel}<b>{formatRupees(content.pricePerCouple)}</b></div>
                        <div className="ny-cta">
                            <Link href={content.reserveLink} className="ny-btn ny-main" onClick={remember}>{content.reserveLabel}</Link>
                            <Link href={content.enquireLink} className="ny-btn ny-ghost" onClick={remember}>{content.enquireLabel}</Link>
                        </div>
                        <p className="ny-fine">{content.finePrint}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
