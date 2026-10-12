// Non-server file: safe to import from client components.

/** The 31st Night party pop-up and its page, stored in site_settings under PARTY_POPUP_KEY. */
export type PartyPopupSettings = {
    enabled: boolean;
    /** Per couple, in rupees. */
    pricePerCouple: number;
    /** Seconds after the homepage opens before the pop-up appears. */
    delaySeconds: number;

    /** Empty means the built-in image. */
    backgroundImage: string;
    maskImage: string;
    /** Full-screen photo behind the /31st-night page. */
    pageImage: string;
    /** Uploaded track for the event page. Empty means the built-in synthesised loop. */
    musicUrl: string;

    presenter: string;
    eyebrow: string;
    titleMain: string;
    titleAccent: string;
    theme: string;
    /** Used on the /31st-night page only. */
    intro: string;
    highlights: string[];
    dateValue: string;
    timeValue: string;
    dressValue: string;
    priceLabel: string;
    finePrint: string;

    reserveLabel: string;
    reserveLink: string;
    enquireLabel: string;
    enquireLink: string;
};

export const PARTY_POPUP_KEY = 'party_popup_31st';

export const DEFAULT_PARTY_BACKGROUND = '/party/31st-night-ballroom.webp';
export const DEFAULT_PARTY_MASK = '/party/31st-night-mask.webp';
export const DEFAULT_PARTY_PAGE_IMAGE = '/party/31st-night-party.webp';

export const DEFAULT_PARTY_POPUP: PartyPopupSettings = {
    enabled: false,
    pricePerCouple: 49999,
    delaySeconds: 5,

    backgroundImage: '',
    maskImage: '',
    pageImage: '',
    musicUrl: '',

    presenter: 'Olivia Alleppey presents',
    eyebrow: "The grand New Year's Eve",
    titleMain: '31st',
    titleAccent: 'Night',
    theme: 'A celebrity masquerade',
    intro: 'Ring in the new year in the Grand Ballroom. Dress as a celebrity, keep the mask on, and dance until midnight.',
    highlights: ['Live DJ', 'Open bar', 'Gala dinner', "Kids' care", 'Stay included'],
    dateValue: '31 December',
    timeValue: '8 pm to 11:30',
    dressValue: 'Mask on, glamour up',
    priceLabel: 'Per couple · Room included',
    finePrint: 'Only 300 passes · 23 and above for the bar',

    reserveLabel: 'Reserve your pass',
    reserveLink: '/31st-night#reserve',
    enquireLabel: 'Enquire',
    enquireLink: '/31st-night#enquire',
};

/** 8 pm IST on 31 December 2026. */
export const PARTY_START = '2026-12-31T20:00:00+05:30';
/** The pop-up stops showing once the night is over, whatever the switch says. */
export const PARTY_END = '2027-01-01T00:00:00+05:30';

export const PARTY_PATH = '/31st-night';

const MAX_HIGHLIGHTS = 6;

function text(value: unknown, fallback: string, max: number): string {
    if (typeof value !== 'string') return fallback;
    const trimmed = value.trim().slice(0, max);
    return trimmed || fallback;
}

/** Images may only come from our own folder or the public blob store. */
function image(value: unknown): string {
    if (typeof value !== 'string') return '';
    const url = value.trim().slice(0, 600);
    if (/^\/party\/[\w.\-]+$/.test(url)) return url;
    if (/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/[^\s"'()<>\\]+$/i.test(url)) return url;
    return '';
}

/** Site-relative paths or https links; nothing that can run script. */
function link(value: unknown, fallback: string): string {
    if (typeof value !== 'string') return fallback;
    const url = value.trim().slice(0, 300);
    if (/^\/(?!\/)[^\s"'<>\\]*$/.test(url) || /^https:\/\/[^\s"'<>\\]+$/i.test(url)) return url;
    return fallback;
}

export function normalisePartyPopup(raw: unknown): PartyPopupSettings {
    const value = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof PartyPopupSettings, unknown>>;
    const d = DEFAULT_PARTY_POPUP;
    const price = Number(value.pricePerCouple);
    const delay = Number(value.delaySeconds);

    const highlights = Array.isArray(value.highlights)
        ? value.highlights
              .filter((item): item is string => typeof item === 'string')
              .map((item) => item.trim().slice(0, 40))
              .filter(Boolean)
              .slice(0, MAX_HIGHLIGHTS)
        : [];

    return {
        enabled: value.enabled === true,
        pricePerCouple: Number.isFinite(price) && price > 0 ? Math.round(price) : d.pricePerCouple,
        delaySeconds: Number.isFinite(delay) && delay >= 0 ? Math.min(60, Math.round(delay)) : d.delaySeconds,

        backgroundImage: image(value.backgroundImage),
        maskImage: image(value.maskImage),
        pageImage: image(value.pageImage),
        musicUrl: image(value.musicUrl),

        presenter: text(value.presenter, d.presenter, 60),
        eyebrow: text(value.eyebrow, d.eyebrow, 60),
        titleMain: text(value.titleMain, d.titleMain, 30),
        titleAccent: text(value.titleAccent, d.titleAccent, 30),
        theme: text(value.theme, d.theme, 80),
        intro: text(value.intro, d.intro, 400),
        highlights: highlights.length ? highlights : d.highlights,
        dateValue: text(value.dateValue, d.dateValue, 30),
        timeValue: text(value.timeValue, d.timeValue, 30),
        dressValue: text(value.dressValue, d.dressValue, 40),
        priceLabel: text(value.priceLabel, d.priceLabel, 60),
        finePrint: text(value.finePrint, d.finePrint, 120),

        reserveLabel: text(value.reserveLabel, d.reserveLabel, 30),
        reserveLink: link(value.reserveLink, d.reserveLink),
        enquireLabel: text(value.enquireLabel, d.enquireLabel, 30),
        enquireLink: link(value.enquireLink, d.enquireLink),
    };
}

export function formatRupees(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
}
