// Non-server file: safe to import from client components.

/** The 31st Night party pop-up, stored in site_settings under PARTY_POPUP_KEY. */
export type PartyPopupSettings = {
    enabled: boolean;
    /** Per couple, in rupees. */
    pricePerCouple: number;
    /** Seconds after the homepage opens before the pop-up appears. */
    delaySeconds: number;
};

export const PARTY_POPUP_KEY = 'party_popup_31st';

export const DEFAULT_PARTY_POPUP: PartyPopupSettings = {
    enabled: false,
    pricePerCouple: 49999,
    delaySeconds: 5,
};

/** 8 pm IST on 31 December 2026. */
export const PARTY_START = '2026-12-31T20:00:00+05:30';
/** The pop-up stops showing once the night is over, whatever the switch says. */
export const PARTY_END = '2027-01-01T00:00:00+05:30';

export const PARTY_PATH = '/31st-night';

export function normalisePartyPopup(raw: unknown): PartyPopupSettings {
    const value = (raw && typeof raw === 'object' ? raw : {}) as Partial<PartyPopupSettings>;
    const price = Number(value.pricePerCouple);
    const delay = Number(value.delaySeconds);
    return {
        enabled: value.enabled === true,
        pricePerCouple: Number.isFinite(price) && price > 0 ? Math.round(price) : DEFAULT_PARTY_POPUP.pricePerCouple,
        delaySeconds: Number.isFinite(delay) && delay >= 0 ? Math.min(60, Math.round(delay)) : DEFAULT_PARTY_POPUP.delaySeconds,
    };
}

export function formatRupees(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
}
