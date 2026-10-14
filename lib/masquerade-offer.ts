// The Grand Masquerade, 31st Night: package, add-ons, room rules and GST, shared by the booking form and the server.
// The server recomputes every total from this file, so a tampered browser request can't change a price.
//
// Money is in paise (integers) throughout; formatINR turns it into rupees for display.

export const STAY_CHECK_IN = '2026-12-31';
export const STAY_CHECK_OUT = '2027-01-01';

/** One package = one room for the night, room price included. Excludes GST. */
export const PACKAGE_PRICE_PAISE = 49_999 * 100;
/** GST on the package and on every add-on. */
export const GST_RATE = 18;

export const MAX_ROOMS = 6;
export const MAX_EXTRA_QTY = 9;

export type RoomAddonId = 'extra-adult' | 'junior-guest' | 'little-ones' | 'nanny';
export type ExtraId = 'gala-for-two' | 'gala-single' | 'young-gala' | 'chauffeur';

export interface OfferItem<Id extends string> {
    id: Id;
    name: string;
    note: string;
    pricePaise: number;
    /** Most of this item one room (or the whole booking, for extras) can take. */
    max: number;
}

/** Per room. These count towards the room's people. */
export const ROOM_ADDONS: OfferItem<RoomAddonId>[] = [
    { id: 'extra-adult', name: 'Additional Guest', note: 'Third adult, with extra bed', pricePaise: 19_999 * 100, max: 1 },
    { id: 'junior-guest', name: 'Junior Guest', note: 'Ages 6–11, sharing with parents', pricePaise: 7_999 * 100, max: 2 },
    { id: 'little-ones', name: "Little Ones' Care", note: 'Under 6, with meals', pricePaise: 2_999 * 100, max: 2 },
    { id: 'nanny', name: "Nanny's Stay", note: 'Accommodation and meals', pricePaise: 5_999 * 100, max: 1 },
];

/** For the whole booking. Not tied to a room, and not in the hotel (visiting guests and drivers). */
export const EXTRAS: OfferItem<ExtraId>[] = [
    { id: 'gala-for-two', name: 'Gala Evening for Two', note: 'Visiting couple', pricePaise: 19_999 * 100, max: MAX_EXTRA_QTY },
    { id: 'gala-single', name: 'Gala Evening, Single Guest', note: 'Visiting guest', pricePaise: 11_999 * 100, max: MAX_EXTRA_QTY },
    { id: 'young-gala', name: 'Young Guest Gala Pass', note: 'Ages 6–11, visiting', pricePaise: 2_999 * 100, max: MAX_EXTRA_QTY },
    { id: 'chauffeur', name: "Chauffeur's Stay & Dining", note: 'Outside the hotel, meals in the cafeteria', pricePaise: 1_499 * 100, max: MAX_EXTRA_QTY },
];

export type RoomConfig = Record<RoomAddonId, number>;
export type ExtrasSelection = Partial<Record<ExtraId, number>>;

export const emptyRoom = (): RoomConfig => ({ 'extra-adult': 0, 'junior-guest': 0, 'little-ones': 0, nanny: 0 });

const toInt = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.trunc(v) : 0);

/** Clamp a room's quantities into range (does not apply the people rule; see roomProblem). */
export function normalizeRoom(room: Partial<Record<RoomAddonId, unknown>> | undefined): RoomConfig {
    const out = emptyRoom();
    for (const item of ROOM_ADDONS) {
        out[item.id] = Math.min(Math.max(toInt(room?.[item.id]), 0), item.max);
    }
    return out;
}

/**
 * The people rule for one room. A couple is included. Then either one extra adult and nobody else,
 * or up to two more people from: children under 12 (junior guests and little ones) and a nanny.
 * Returns an explanation if the room breaks the rule, otherwise null.
 */
export function roomProblem(room: RoomConfig): string | null {
    const others = room['junior-guest'] + room['little-ones'] + room.nanny;
    if (room['extra-adult'] > 0 && others > 0) {
        return 'A room with three adults has no space for children or a nanny. Add another package for more guests.';
    }
    if (others > 2) {
        return 'A room takes a couple plus two more people at most (children and nanny together).';
    }
    return null;
}

/** People in a room, for the booking record: adults, children (under 12), and the nanny counted with the children. */
export function roomHeadcount(room: RoomConfig): { adults: number; children: number } {
    return { adults: 2 + room['extra-adult'], children: room['junior-guest'] + room['little-ones'] + room.nanny };
}

export interface PricedLine {
    key: string;
    label: string;
    qty: number;
    unitPaise: number;
    amountPaise: number;
}

export interface MasqueradeQuote {
    rooms: number;
    lines: PricedLine[];
    /** The add-ons rolled up by id (the form is per room, the booking record is not). */
    addOnTotals: { id: RoomAddonId | ExtraId; name: string; qty: number; unitPaise: number; subtotalPaise: number }[];
    roomSubtotalPaise: number;
    roomTaxPaise: number;
    addOnSubtotalPaise: number;
    addOnTaxPaise: number;
    subtotalPaise: number;
    gstPaise: number;
    totalPaise: number;
    /** Set when the selection breaks a rule; the booking must not go ahead. */
    problem: string | null;
}

/**
 * Prices a booking. The rounding mirrors the booking engine exactly: room GST is rounded per room-night and
 * multiplied by the rooms; add-on GST is rounded per add-on line. That keeps this total equal to the amount
 * the engine stores and the gateway is asked for.
 */
export function quoteMasquerade(roomsInput: Partial<Record<RoomAddonId, unknown>>[], extrasInput: Record<string, unknown> = {}): MasqueradeQuote {
    const rooms = roomsInput.slice(0, MAX_ROOMS).map(normalizeRoom);
    const count = Math.max(rooms.length, 1);
    if (rooms.length === 0) rooms.push(emptyRoom());

    let problem: string | null = null;
    rooms.forEach((room, i) => {
        const p = roomProblem(room);
        if (p && !problem) problem = rooms.length > 1 ? `Room ${i + 1}: ${p}` : p;
    });

    const lines: PricedLine[] = [
        {
            key: 'package',
            label: 'The 31st Night package (room included)',
            qty: count,
            unitPaise: PACKAGE_PRICE_PAISE,
            amountPaise: PACKAGE_PRICE_PAISE * count,
        },
    ];

    const totals = new Map<string, { id: RoomAddonId | ExtraId; name: string; qty: number; unitPaise: number }>();
    const bump = (id: RoomAddonId | ExtraId, name: string, unitPaise: number, qty: number) => {
        if (qty <= 0) return;
        const cur = totals.get(id);
        if (cur) cur.qty += qty;
        else totals.set(id, { id, name, qty, unitPaise });
    };

    rooms.forEach((room) => {
        for (const item of ROOM_ADDONS) bump(item.id, item.name, item.pricePaise, room[item.id]);
    });
    for (const item of EXTRAS) {
        const qty = Math.min(Math.max(toInt(extrasInput[item.id]), 0), item.max);
        bump(item.id, item.name, item.pricePaise, qty);
    }

    const addOnTotals = [...totals.values()].map((t) => ({
        ...t,
        subtotalPaise: t.unitPaise * t.qty,
    }));
    for (const t of addOnTotals) {
        lines.push({ key: t.id, label: t.name, qty: t.qty, unitPaise: t.unitPaise, amountPaise: t.subtotalPaise });
    }

    const roomSubtotalPaise = PACKAGE_PRICE_PAISE * count;
    const roomTaxPaise = Math.round(PACKAGE_PRICE_PAISE * (GST_RATE / 100)) * count;
    const addOnSubtotalPaise = addOnTotals.reduce((s, t) => s + t.subtotalPaise, 0);
    const addOnTaxPaise = addOnTotals.reduce((s, t) => s + Math.round(t.subtotalPaise * (GST_RATE / 100)), 0);
    const subtotalPaise = roomSubtotalPaise + addOnSubtotalPaise;
    const gstPaise = roomTaxPaise + addOnTaxPaise;

    return {
        rooms: count,
        lines,
        addOnTotals,
        roomSubtotalPaise,
        roomTaxPaise,
        addOnSubtotalPaise,
        addOnTaxPaise,
        subtotalPaise,
        gstPaise,
        totalPaise: subtotalPaise + gstPaise,
        problem,
    };
}

/** Paise to a rupee string with Indian digit grouping, e.g. 4999900 -> ₹49,999 and 589988 -> ₹5,899.88. */
export function formatINR(paise: number): string {
    const rupees = paise / 100;
    const whole = Number.isInteger(rupees);
    return '₹' + rupees.toLocaleString('en-IN', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Returns an error message per invalid field, or an empty object when the details are fine. */
export function validateGuest(input: { name: string; email: string; phone: string }): Record<string, string> {
    const errors: Record<string, string> = {};
    if (input.name.trim().length < 2) errors.name = 'Please enter your full name';
    if (!EMAIL_RE.test(input.email.trim())) errors.email = 'Please enter a valid email address';
    const digits = input.phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) errors.phone = 'Please enter a valid phone number';
    return errors;
}
