// Non-server file: safe to import from client components.

/** R stays the night at Olivia (residential); NR comes for the party only (non-residential). */
export type PartyStay = 'R' | 'NR' | 'both';

/** The look of the /31st-night page and the homepage pop-up, picked in Site Appearance. */
export const PARTY_PAGE_THEMES = ['masquerade', 'gatsby', 'gotham'] as const;
export type PartyPageTheme = (typeof PARTY_PAGE_THEMES)[number];

/** One line of the guest price list, e.g. a kid aged 6 to 11 for residential guests. */
export type PartyGuestPrice = {
    label: string;
    /** Ages or what the price covers. */
    note: string;
    /** Per person, in rupees. */
    price: number;
    stay: PartyStay;
};

/** The 31st Night party pop-up and its page, stored in site_settings under PARTY_POPUP_KEY. */
export type PartyPopupSettings = {
    enabled: boolean;
    pageTheme: PartyPageTheme;
    /** Per couple with a room (residential), in rupees. */
    pricePerCouple: number;
    /** Per couple without a room (non-residential). 0 means the page says "price on request". */
    pricePerCoupleNonResidential: number;
    /** Extra guests, kids and nannies. */
    guestPrices: PartyGuestPrice[];
    /** Seconds after the homepage opens before the pop-up appears. */
    delaySeconds: number;

    /** Empty means the built-in image. */
    backgroundImage: string;
    maskImage: string;
    /** The photo at the top of the /31st-night page. */
    pageImage: string;
    /** Photos further down the page: the crowd in the haze, and the ballroom lights. */
    crowdImage: string;
    lightsImage: string;
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
export const DEFAULT_PARTY_PAGE_IMAGE = '/party/31st-night-hands.webp';
export const DEFAULT_PARTY_CROWD_IMAGE = '/party/31st-night-crowd.webp';
export const DEFAULT_PARTY_LIGHTS_IMAGE = '/party/31st-night-lights.webp';
/** Shown when the page is shared on WhatsApp and in search results. */
export const DEFAULT_PARTY_SHARE_IMAGE = '/party/31st-night-party.webp';
/** The Gatsby and Gotham pages draw their own backgrounds; these are stills of their openings, for sharing. */
export const GATSBY_SHARE_IMAGE = '/party/31st-night-gatsby.webp';
export const GOTHAM_SHARE_IMAGE = '/party/31st-night-gotham.webp';

/** The words that belong to a theme. Switching themes swaps them, unless someone has rewritten them. */
type PartyThemeCopy = Pick<PartyPopupSettings, 'theme' | 'intro' | 'dressValue'>;

export const PARTY_THEMES: Record<PartyPageTheme, { name: string; about: string; copy: PartyThemeCopy }> = {
    masquerade: {
        name: 'The Grand Masquerade',
        about: 'Masks and club lights, over the photos below.',
        copy: {
            theme: 'The Grand Masquerade',
            intro: 'Ring in the new year in the Grand Ballroom. Dress in your finest, wear a mask, and dance until midnight.',
            dressValue: 'Mask on, glamour up',
        },
    },
    gatsby: {
        name: 'The Gatsby Masquerade',
        about: 'The mask over a 1920s black and gold Art Deco night, with fireworks over the water. Draws its own backgrounds; only the mask below is used.',
        copy: {
            theme: 'The Gatsby Masquerade',
            intro: 'Ring in the new year the Gatsby way in the Grand Ballroom. Masks, sequins, pearls and sharp suits, gold everywhere, and dancing until midnight.',
            dressValue: 'Masks and ’20s glamour',
        },
    },
    gotham: {
        name: 'The Gotham Masquerade',
        about: 'New York after dark for Kerala’s high society: black, gold, a touch of purple and red. Draws its own skyline; only the mask below is used.',
        copy: {
            theme: 'The Gotham Masquerade',
            intro: 'A black-tie masquerade for Kerala’s finest. The Grand Ballroom becomes a Manhattan penthouse after dark: low gold light, deep velvet, and the whole city at your feet until midnight.',
            dressValue: 'Black tie and masks',
        },
    },
};

export const DEFAULT_PARTY_POPUP: PartyPopupSettings = {
    enabled: false,
    pageTheme: 'masquerade',
    pricePerCouple: 49999,
    pricePerCoupleNonResidential: 0,
    guestPrices: [
        { label: 'Extra adult', note: 'Above 11 years', price: 9999, stay: 'R' },
        { label: 'Kid', note: '6 to 11 years', price: 4999, stay: 'R' },
        { label: 'Child or infant', note: 'Below 5 years', price: 2999, stay: 'both' },
        { label: 'Nanny', note: 'Kids area and dinner', price: 2999, stay: 'NR' },
        { label: 'Nanny with extra bed', note: 'Extra bed, kids area and dinner', price: 5999, stay: 'R' },
    ],
    delaySeconds: 5,

    backgroundImage: '',
    maskImage: '',
    pageImage: '',
    crowdImage: '',
    lightsImage: '',
    musicUrl: '',

    presenter: 'Olivia Alleppey presents',
    eyebrow: "The grand New Year's Eve",
    titleMain: '31st',
    titleAccent: 'Night',
    ...PARTY_THEMES.masquerade.copy,
    highlights: ['Live DJ', 'Spirits', 'Gala dinner', "Kids' care", 'Stay included'],
    dateValue: '31 December',
    timeValue: '8 pm to 11:30',
    priceLabel: 'Per couple · Room included',
    finePrint: 'Only 300 passes · Spirits for guests 23 and above',

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
/** Search for a room on the night of the party. */
export const PARTY_BOOK_HREF = '/book/search?checkIn=2026-12-31&checkOut=2027-01-01&adults=2';

/** Moves to another theme, bringing its words along wherever the old theme's words are still unchanged. */
export function switchPartyTheme(settings: PartyPopupSettings, next: PartyPageTheme): PartyPopupSettings {
    const result = { ...settings, pageTheme: next };
    for (const key of Object.keys(PARTY_THEMES[next].copy) as (keyof PartyThemeCopy)[]) {
        const untouched = PARTY_PAGE_THEMES.some((theme) => PARTY_THEMES[theme].copy[key] === settings[key]);
        if (untouched) result[key] = PARTY_THEMES[next].copy[key];
    }
    return result;
}

/** The picture used when the page is shared. */
export function partyShareImage(settings: PartyPopupSettings): string {
    if (settings.pageTheme === 'gatsby') return GATSBY_SHARE_IMAGE;
    if (settings.pageTheme === 'gotham') return GOTHAM_SHARE_IMAGE;
    return settings.pageImage || DEFAULT_PARTY_SHARE_IMAGE;
}

const MAX_HIGHLIGHTS = 6;
export const MAX_GUEST_PRICES = 8;

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

function rupees(value: unknown): number {
    const amount = Number(value);
    return Number.isFinite(amount) && amount > 0 ? Math.min(10_000_000, Math.round(amount)) : 0;
}

/** Drops rows without a name or a price. A missing list means the built-in one. */
function guestPrices(value: unknown): PartyGuestPrice[] {
    if (!Array.isArray(value)) return DEFAULT_PARTY_POPUP.guestPrices;
    return value
        .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
        .map((row) => ({
            label: text(row.label, '', 40),
            note: text(row.note, '', 60),
            price: rupees(row.price),
            stay: (row.stay === 'R' || row.stay === 'NR' ? row.stay : 'both') as PartyStay,
        }))
        .filter((row) => row.label && row.price)
        .slice(0, MAX_GUEST_PRICES);
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
        pageTheme: PARTY_PAGE_THEMES.find((theme) => theme === value.pageTheme) ?? d.pageTheme,
        pricePerCouple: Number.isFinite(price) && price > 0 ? Math.round(price) : d.pricePerCouple,
        pricePerCoupleNonResidential: rupees(value.pricePerCoupleNonResidential),
        guestPrices: guestPrices(value.guestPrices),
        delaySeconds: Number.isFinite(delay) && delay >= 0 ? Math.min(60, Math.round(delay)) : d.delaySeconds,

        backgroundImage: image(value.backgroundImage),
        maskImage: image(value.maskImage),
        pageImage: image(value.pageImage),
        crowdImage: image(value.crowdImage),
        lightsImage: image(value.lightsImage),
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
