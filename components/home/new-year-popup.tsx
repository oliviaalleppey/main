'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { PARTY_END, PARTY_PATH, PARTY_START, formatRupees } from '@/lib/config/party-popup';
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

export default function NewYearPopup({
    pricePerCouple,
    delaySeconds,
}: {
    pricePerCouple: number;
    delaySeconds: number;
}) {
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

    return (
        <div
            className={`ny-veil${leaving ? ' ny-out' : ''}`}
            onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
            <div className="ny-modal" role="dialog" aria-modal="true" aria-labelledby="ny-title">
                <div className="ny-frame">
                    <i className="ny-corner ny-c1" /><i className="ny-corner ny-c2" />
                    <i className="ny-corner ny-c3" /><i className="ny-corner ny-c4" />
                    <button type="button" className="ny-x" onClick={close} aria-label="Close">&#10005;</button>

                    <div className="ny-photo"><span className="ny-tag">OLIVIA ALLEPPEY PRESENTS</span></div>

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="ny-mask" src="/party/31st-night-mask.webp" alt="Golden masquerade mask with feathers" width={709} height={502} />

                    <div className="ny-body">
                        <p className="ny-pre">THE GRAND NEW YEAR&apos;S EVE</p>
                        <h2 className="ny-h1" id="ny-title">31st <em>Night</em></h2>
                        <p className="ny-theme">A celebrity masquerade</p>
                        <div className="ny-orn"><i /><b /><i /></div>
                        <ul className="ny-hl">
                            <li>Live DJ</li><li>Open bar</li><li>Gala dinner</li><li>Kids&apos; care</li><li>Stay included</li>
                        </ul>
                        <div className="ny-when">
                            <div><small>DATE</small><p>31 December</p></div>
                            <div><small>TIME</small><p>8 pm to 11:30</p></div>
                            <div><small>DRESS</small><p>Mask on, glamour up</p></div>
                        </div>
                        <Countdown />
                        <div className="ny-price">PER COUPLE &middot; ROOM INCLUDED<b>{formatRupees(pricePerCouple)}</b></div>
                        <div className="ny-cta">
                            <Link href={`${PARTY_PATH}#reserve`} className="ny-btn ny-main" onClick={remember}>Reserve your pass</Link>
                            <Link href={`${PARTY_PATH}#enquire`} className="ny-btn ny-ghost" onClick={remember}>Enquire</Link>
                        </div>
                        <p className="ny-fine">Only 300 passes<i>&#9670;</i>23 and above for the bar</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
