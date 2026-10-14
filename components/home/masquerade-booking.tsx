'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    EXTRAS,
    GST_RATE,
    MAX_EXTRA_QTY,
    MAX_ROOMS,
    PACKAGE_PRICE_PAISE,
    ROOM_ADDONS,
    emptyRoom,
    formatINR,
    quoteMasquerade,
    roomGuestsText,
    roomProblem,
    validateGuest,
    type ExtraId,
    type ExtrasSelection,
    type RoomAddonId,
    type RoomConfig,
} from '@/lib/masquerade-offer';

/** Anything on the page can open the booking curtains with `window.dispatchEvent(new Event(MASQUERADE_BOOK_EVENT))`. */
export const MASQUERADE_BOOK_EVENT = 'masq:book';

type Phase = 'closed' | 'closing' | 'open' | 'opening';
type Step = 1 | 2 | 3;
type Status = { paymentsEnabled: boolean; available: number | null; soldOut: boolean };

// Heavy velvet: it drops fast, overshoots the seam, settles, then the cloth sways.
const CLOSE_SPRING = { type: 'spring' as const, stiffness: 55, damping: 8.5, mass: 1.7 };
const SWAY = { duration: 2.2, times: [0, 0.3, 0.55, 0.78, 1], ease: 'easeOut' as const };
const OPEN_EASE = { duration: 1.5, ease: [0.7, 0, 0.2, 1] as [number, number, number, number] };

const FIELD =
    'w-full bg-black/55 border border-[#d9b668]/55 px-4 py-3.5 text-base text-[#fff8e6] placeholder:text-[#bfae82] outline-none transition-colors focus:border-[#f6dc9a] focus:bg-black/70';
const LABEL = 'mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-[#f0d58c]';

export default function MasqueradeBooking() {
    const [phase, setPhase] = useState<Phase>('closed');
    const [formShown, setFormShown] = useState(false);
    const [step, setStep] = useState<Step>(1);
    const [status, setStatus] = useState<Status | null>(null);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [rooms, setRooms] = useState<RoomConfig[]>([emptyRoom()]);
    const [extras, setExtras] = useState<ExtrasSelection>({});
    const [notes, setNotes] = useState('');
    const [terms, setTerms] = useState(false);

    const [sending, setSending] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [sentTotal, setSentTotal] = useState<number | null>(null);

    const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
    const firstField = useRef<HTMLInputElement>(null);

    const later = (fn: () => void, ms: number) => {
        timers.current.push(setTimeout(fn, ms));
    };

    const loadStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/masquerade/status', { cache: 'no-store' });
            if (res.ok) setStatus((await res.json()) as Status);
        } catch {
            /* the form still works as a request form if this fails */
        }
    }, []);

    const openCurtains = useCallback(() => {
        setPhase((p) => {
            if (p !== 'closed') return p;
            timers.current.push(
                setTimeout(() => {
                    setPhase('open');
                    setFormShown(true);
                }, 1500),
            );
            return 'closing';
        });
        void loadStatus();
    }, [loadStatus]);

    const closeCurtains = useCallback(() => {
        setFormShown(false);
        setPhase('opening');
        timers.current.push(
            setTimeout(() => {
                setPhase('closed');
                setStep((s) => (s === 3 ? 1 : s));
            }, 1700),
        );
    }, []);

    useEffect(() => {
        const handler = () => openCurtains();
        window.addEventListener(MASQUERADE_BOOK_EVENT, handler);
        const pending = timers.current;
        return () => {
            window.removeEventListener(MASQUERADE_BOOK_EVENT, handler);
            pending.forEach(clearTimeout);
        };
    }, [openCurtains]);

    // No page scroll behind the curtains, and Escape closes them.
    useEffect(() => {
        if (phase === 'closed') return;
        const html = document.documentElement;
        const prev = html.style.overflow;
        html.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && phase === 'open' && !sending) closeCurtains();
        };
        window.addEventListener('keydown', onKey);
        return () => {
            html.style.overflow = prev;
            window.removeEventListener('keydown', onKey);
        };
    }, [phase, sending, closeCurtains]);

    useEffect(() => {
        if (formShown && step === 1) later(() => firstField.current?.focus(), 450);
    }, [formShown, step]);

    const quote = quoteMasquerade(rooms, extras);
    const payOnline = status?.paymentsEnabled === true;
    const soldOut = status?.soldOut === true;
    const roomCap = Math.min(MAX_ROOMS, status?.available != null && status.available > 0 ? status.available : MAX_ROOMS);

    const setPackages = (count: number) => {
        const n = Math.min(Math.max(count, 1), roomCap);
        setRooms((prev) => (n > prev.length ? [...prev, ...Array.from({ length: n - prev.length }, emptyRoom)] : prev.slice(0, n)));
    };

    const removeRoom = (index: number) => setRooms((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

    const setRoomQty = (index: number, id: RoomAddonId, qty: number) =>
        setRooms((prev) => prev.map((room, i) => (i === index ? { ...room, [id]: qty } : room)));

    const setExtraQty = (id: ExtraId, qty: number) =>
        setExtras((prev) => {
            const next = { ...prev };
            const q = Math.min(Math.max(qty, 0), MAX_EXTRA_QTY);
            if (q === 0) delete next[id];
            else next[id] = q;
            return next;
        });

    /** Whether one more of an add-on would still fit the room. */
    const roomCanTake = (room: RoomConfig, id: RoomAddonId) => {
        const item = ROOM_ADDONS.find((a) => a.id === id)!;
        if (room[id] >= item.max) return false;
        return roomProblem({ ...room, [id]: room[id] + 1 }) === null;
    };

    const goNext = (e: React.FormEvent) => {
        e.preventDefault();
        if (soldOut) return;
        const found = validateGuest({ name, email, phone });
        setErrors(found);
        if (Object.keys(found).length === 0) setStep(2);
    };

    const submit = async () => {
        if (quote.problem) {
            setServerError(quote.problem);
            return;
        }
        if (payOnline && !terms) {
            setServerError('Please accept the terms to continue.');
            return;
        }
        setSending(true);
        setServerError(null);
        try {
            const res = await fetch(payOnline ? '/api/masquerade/checkout' : '/api/inquiries/masquerade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone, rooms, extras, notes, acceptedTerms: terms }),
            });
            const data = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string; total?: number; payUrl?: string; code?: string };
            if (!res.ok || !data.success) {
                setServerError(data.message || 'We could not complete your request. Please try again.');
                if (data.code === 'sold_out') void loadStatus();
                return;
            }
            if (payOnline && data.payUrl) {
                // Keep the button locked while the browser moves to the secure payment page.
                window.location.href = data.payUrl;
                return;
            }
            setSentTotal(data.total ?? quote.totalPaise);
            setStep(3);
        } catch {
            setServerError('We could not reach the server. Please check your connection and try again.');
        } finally {
            if (!(payOnline && step === 2)) setSending(false);
            else later(() => setSending(false), 8000);
        }
    };

    if (phase === 'closed') return null;

    const parting = phase === 'opening';
    const sway = { skewX: [0, -1.6, 1.1, -0.5, 0] };

    return (
        <div className="fixed inset-0 z-[110] overflow-hidden" role="dialog" aria-modal="true" aria-label="Reserve The Grand Masquerade, 31st Night">
            <style>{`
                .masq-bk-curtain {
                    background:
                        repeating-linear-gradient(90deg, rgba(0,0,0,.42) 0 3px, transparent 3px 30px, rgba(255,130,130,.12) 30px 36px, transparent 36px 66px),
                        linear-gradient(180deg, #61101c 0%, #420812 55%, #240409 100%);
                    box-shadow: 0 0 60px rgba(0,0,0,.7);
                }
                .masq-bk-curtain::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(180deg, rgba(0,0,0,.55) 0%, transparent 22%, transparent 70%, rgba(0,0,0,.6) 100%);
                    pointer-events: none;
                }
                .masq-bk-fringe {
                    background: linear-gradient(180deg, #fff1c4, #d9b668 45%, #8f6a2c);
                    box-shadow: 0 0 18px rgba(240,205,120,.6);
                }
            `}</style>

            {/* Curtains swing shut with weight, then sway */}
            <motion.div
                className="masq-bk-curtain absolute inset-y-0 left-0 w-[51%]"
                style={{ transformOrigin: 'top center' }}
                initial={{ x: '-104%' }}
                animate={parting ? { x: '-104%', skewX: 0 } : { x: 0, ...sway }}
                transition={parting ? OPEN_EASE : { x: CLOSE_SPRING, skewX: SWAY }}
            >
                <span className="masq-bk-fringe absolute inset-y-0 right-0 w-[3px]" />
            </motion.div>
            <motion.div
                className="masq-bk-curtain absolute inset-y-0 right-0 w-[51%]"
                style={{ transformOrigin: 'top center' }}
                initial={{ x: '104%' }}
                animate={parting ? { x: '104%', skewX: 0 } : { x: 0, skewX: [0, 1.6, -1.1, 0.5, 0] }}
                transition={parting ? OPEN_EASE : { x: { ...CLOSE_SPRING, delay: 0.07 }, skewX: { ...SWAY, delay: 0.07 } }}
            >
                <span className="masq-bk-fringe absolute inset-y-0 left-0 w-[3px]" />
            </motion.div>

            {/* The form, written on the velvet */}
            <AnimatePresence>
                {formShown && (
                    <motion.div
                        key="form-layer"
                        className="absolute inset-0 z-10 overflow-y-auto"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.3 } }}
                        transition={{ duration: 0.7 }}
                    >
                        <div className="flex min-h-full items-center justify-center px-4 py-14 md:py-10">
                            <div
                                className={`relative w-full border border-[#d9b668]/40 bg-black/55 backdrop-blur-[3px] px-5 py-8 md:px-10 md:py-10 ${
                                    step === 2 ? 'max-w-7xl' : 'max-w-md'
                                } transition-[max-width] duration-500`}
                            >
                                <button
                                    type="button"
                                    onClick={closeCurtains}
                                    disabled={sending}
                                    aria-label="Close"
                                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center text-[#d9b668] hover:text-[#fff1c4] disabled:opacity-40"
                                >
                                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                                        <path d="M6 6l12 12M18 6L6 18" />
                                    </svg>
                                </button>

                                <header className="mb-7 text-center">
                                    <p className="text-xs md:text-sm font-medium uppercase tracking-[0.2em] text-[#f0d58c]">The Grand Masquerade · 31 December</p>
                                    <h2 className="mt-2 font-sans text-2xl md:text-3xl font-semibold uppercase tracking-[0.08em] text-[#f6dc9a]">
                                        {step === 3 ? 'Request Received' : step === 1 ? 'Reserve Your Evening' : 'Make It Yours'}
                                    </h2>
                                    {step !== 3 && (
                                        <div className="mt-4 flex items-center justify-center gap-2" aria-label={`Step ${step} of 2`}>
                                            <span className="h-1.5 w-8 bg-[#f0cf7a]" />
                                            <span className={`h-1.5 w-8 transition-colors ${step === 2 ? 'bg-[#f0cf7a]' : 'bg-[#d9b668]/25'}`} />
                                        </div>
                                    )}
                                </header>

                                <AnimatePresence mode="wait" initial={false}>
                                    {step === 1 && (
                                        <motion.form
                                            key="s1"
                                            onSubmit={goNext}
                                            noValidate
                                            initial={{ opacity: 0, x: -24 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -24 }}
                                            transition={{ duration: 0.3 }}
                                            className="space-y-5"
                                        >
                                            {soldOut && (
                                                <p role="alert" className="border border-[#f0d58c]/60 bg-black/40 px-4 py-3 text-sm text-[#fff1c4]">
                                                    The 31st Night is sold out. For a waiting list or other dates, please call +91 8075 416 514.
                                                </p>
                                            )}
                                            <div>
                                                <label className={LABEL} htmlFor="bk-name">Name</label>
                                                <input
                                                    id="bk-name"
                                                    ref={firstField}
                                                    className={FIELD}
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    autoComplete="name"
                                                    placeholder="Your full name"
                                                    aria-invalid={!!errors.name}
                                                />
                                                {errors.name && <p role="alert" className="mt-1.5 text-sm text-[#ffb3b3]">{errors.name}</p>}
                                            </div>
                                            <div>
                                                <label className={LABEL} htmlFor="bk-email">Email</label>
                                                <input
                                                    id="bk-email"
                                                    type="email"
                                                    className={FIELD}
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    autoComplete="email"
                                                    placeholder="you@example.com"
                                                    aria-invalid={!!errors.email}
                                                />
                                                {errors.email && <p role="alert" className="mt-1.5 text-sm text-[#ffb3b3]">{errors.email}</p>}
                                            </div>
                                            <div>
                                                <label className={LABEL} htmlFor="bk-phone">Phone</label>
                                                <input
                                                    id="bk-phone"
                                                    type="tel"
                                                    inputMode="tel"
                                                    className={FIELD}
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    autoComplete="tel"
                                                    placeholder="+91 98765 43210"
                                                    aria-invalid={!!errors.phone}
                                                />
                                                {errors.phone && <p role="alert" className="mt-1.5 text-sm text-[#ffb3b3]">{errors.phone}</p>}
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={soldOut}
                                                className="masq-btn mt-2 w-full py-4 text-sm uppercase tracking-[0.18em] font-semibold text-[#1a0d06] disabled:opacity-50"
                                            >
                                                Next
                                            </button>
                                        </motion.form>
                                    )}

                                    {step === 2 && (
                                        <motion.div
                                            key="s2"
                                            initial={{ opacity: 0, x: 24 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 24 }}
                                            transition={{ duration: 0.3 }}
                                            className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_350px] lg:items-start"
                                        >
                                            {/* Left: choosing */}
                                            <div className="min-w-0">
                                                {/* 1. The main choice: how many packages (one package, one room) */}
                                                <div className="mb-8 flex flex-col items-center justify-between gap-4 border-2 border-[#f0d58c]/70 bg-gradient-to-r from-[#d9b668]/20 via-[#d9b668]/8 to-transparent px-5 py-5 shadow-[0_0_34px_rgba(240,205,120,.18)] sm:flex-row">
                                                    <div className="flex items-center gap-4 text-center sm:text-left">
                                                        <StepNumber n={1} />
                                                        <div>
                                                            <p className="text-xl font-semibold text-[#fff8e6]">The 31st Night package</p>
                                                            <p className="mt-0.5 text-base text-[#f0e2b8]">{formatINR(PACKAGE_PRICE_PAISE)} + GST per room, room included</p>
                                                        </div>
                                                    </div>
                                                    <Stepper value={rooms.length} min={1} max={roomCap} onChange={setPackages} label="packages" large />
                                                </div>

                                                {/* 2. Who is staying: one card per room, each with its own choices */}
                                                <section className="mb-8">
                                                    <h3 className="mb-2 flex items-center gap-3 font-sans text-base font-semibold uppercase tracking-[0.12em] text-[#f6dc9a]">
                                                        <StepNumber n={2} />
                                                        {rooms.length > 1 ? 'Who is staying in each room?' : 'Who is staying in your room?'}
                                                    </h3>
                                                    <p className="mb-4 text-sm text-[#e8dab0]">
                                                        Each room has a couple. Add one extra adult, or up to two more people (children and nanny). Need more adults? Add another package.
                                                    </p>

                                                    <div className="space-y-5">
                                                        {rooms.map((room, roomIndex) => (
                                                            <div
                                                                key={roomIndex}
                                                                className="border border-[#d9b668]/55 bg-gradient-to-b from-[#d9b668]/10 to-transparent px-4 py-5 md:px-5"
                                                            >
                                                                <div className="mb-4 flex items-center justify-between gap-3">
                                                                    <div>
                                                                        <p className="text-lg font-semibold text-[#fff8e6]">{rooms.length > 1 ? `Room ${roomIndex + 1}` : 'Your room'}</p>
                                                                        <p className="text-sm text-[#e0d0a6]">{roomGuestsText(room)}</p>
                                                                    </div>
                                                                    {rooms.length > 1 && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeRoom(roomIndex)}
                                                                            className="shrink-0 text-sm font-medium text-[#e0d0a6] underline underline-offset-4 hover:text-[#fff1c4]"
                                                                        >
                                                                            Remove room
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                                                                    {ROOM_ADDONS.map((item) => {
                                                                        const qty = room[item.id];
                                                                        const on = qty > 0;
                                                                        const canAdd = roomCanTake(room, item.id);
                                                                        return (
                                                                            <div
                                                                                key={item.id}
                                                                                onClick={() => !on && canAdd && setRoomQty(roomIndex, item.id, 1)}
                                                                                className={`relative flex min-h-[10.5rem] flex-col justify-between gap-4 border-2 px-4 py-4 transition-all ${
                                                                                    on
                                                                                        ? 'cursor-default border-[#f6dc9a] bg-gradient-to-b from-[#d9b668]/35 to-[#d9b668]/12 shadow-[0_0_30px_rgba(240,205,120,.4)]'
                                                                                        : canAdd
                                                                                            ? 'cursor-pointer border-[#d9b668]/60 bg-black/50 hover:border-[#f0d58c] hover:bg-[#d9b668]/10'
                                                                                            : 'cursor-not-allowed border-[#d9b668]/15 bg-black/25 opacity-45'
                                                                                }`}
                                                                            >
                                                                                {on && (
                                                                                    <span aria-hidden className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#f6dc9a] text-[#1a0d06]">
                                                                                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                                                                                    </span>
                                                                                )}
                                                                                <div className="pr-6">
                                                                                    <p className="text-lg font-semibold leading-snug text-[#fff8e6]">{item.name}</p>
                                                                                    <p className="mt-1.5 text-sm leading-snug text-[#e8dab0]">{item.note}</p>
                                                                                </div>
                                                                                <div className="flex flex-wrap items-end justify-between gap-x-2 gap-y-2">
                                                                                    <span className="text-2xl font-semibold tabular-nums text-[#f6dc9a]">{formatINR(item.pricePaise)}</span>
                                                                                    {on ? (
                                                                                        <Stepper
                                                                                            value={qty}
                                                                                            min={0}
                                                                                            max={roomCanTake(room, item.id) ? item.max : qty}
                                                                                            onChange={(q) => setRoomQty(roomIndex, item.id, q)}
                                                                                            label={`${item.name}, ${rooms.length > 1 ? `room ${roomIndex + 1}` : 'your room'}`}
                                                                                        />
                                                                                    ) : (
                                                                                        <span className="text-sm font-semibold uppercase tracking-[0.1em] text-[#f6dc9a]">{canAdd ? 'Add +' : 'Not available'}</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {rooms.length < roomCap && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setPackages(rooms.length + 1)}
                                                            className="mt-4 text-sm font-medium text-[#f6dc9a] underline underline-offset-4 hover:text-[#fff1c4]"
                                                        >
                                                            + Add another package (another room)
                                                        </button>
                                                    )}
                                                </section>

                                                {/* 3. Optional: people who join the evening from outside the hotel. Deliberately quiet. */}
                                                <section className="mb-5">
                                                    <h3 className="mb-1 flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-[#d9c585]">
                                                        <span className="text-[#bfae82]">3 ·</span> Joining the evening from outside the hotel (optional)
                                                    </h3>
                                                    <p className="mb-2.5 text-xs text-[#bfae82]">Visiting guests and drivers. Not tied to a room.</p>
                                                    <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
                                                        {EXTRAS.map((item) => {
                                                            const qty = extras[item.id] ?? 0;
                                                            const on = qty > 0;
                                                            return (
                                                                <div
                                                                    key={item.id}
                                                                    onClick={() => !on && setExtraQty(item.id, 1)}
                                                                    className={`flex cursor-pointer flex-col justify-between gap-2 border px-3 py-2.5 transition-colors ${
                                                                        on
                                                                            ? 'border-[#d9b668]/70 bg-[#d9b668]/10'
                                                                            : 'border-[#d9b668]/20 bg-black/20 hover:border-[#d9b668]/45'
                                                                    }`}
                                                                >
                                                                    <div>
                                                                        <p className="text-sm font-medium leading-snug text-[#efe3c0]">{item.name}</p>
                                                                        <p className="mt-0.5 text-xs leading-snug text-[#bfae82]">{item.note}</p>
                                                                    </div>
                                                                    <div className="flex items-end justify-between gap-2">
                                                                        <span className="text-base font-medium tabular-nums text-[#e6cf8e]">{formatINR(item.pricePaise)}</span>
                                                                        {on ? (
                                                                            <Stepper value={qty} min={0} max={MAX_EXTRA_QTY} onChange={(q) => setExtraQty(item.id, q)} label={item.name} compact />
                                                                        ) : (
                                                                            <span className="text-xs font-medium uppercase tracking-[0.1em] text-[#bfae82]">Add +</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </section>

                                                <div>
                                                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-[#bfae82]" htmlFor="bk-notes">Special requests (optional)</label>
                                                    <textarea
                                                        id="bk-notes"
                                                        rows={2}
                                                        maxLength={1000}
                                                        className="w-full bg-black/25 border border-[#d9b668]/25 px-3 py-2.5 text-sm text-[#efe3c0] placeholder:text-[#a69870] outline-none transition-colors focus:border-[#d9b668]/70"
                                                        value={notes}
                                                        onChange={(e) => setNotes(e.target.value)}
                                                        placeholder="Dietary needs, celebrations, anything we should know"
                                                    />
                                                </div>
                                            </div>

                                            {/* Right: checking */}
                                            <aside aria-label="Booking summary" className="border border-[#d9b668]/50 bg-black/60 px-5 py-6 lg:sticky lg:top-4">
                                                <h3 className="font-sans text-sm font-semibold uppercase tracking-[0.14em] text-[#f0d58c]">Booking summary</h3>

                                                <ul className="mt-4 space-y-3 border-b border-[#d9b668]/30 pb-4">
                                                    {rooms.map((room, i) => (
                                                        <li key={i} className="text-sm">
                                                            <p className="font-semibold text-[#fff8e6]">{rooms.length > 1 ? `Room ${i + 1}` : 'Your room'}</p>
                                                            <p className="text-[#e0d0a6]">{roomGuestsText(room)}</p>
                                                            {roomProblem(room) && <p className="mt-1 text-[#ffb3b3]">{roomProblem(room)}</p>}
                                                        </li>
                                                    ))}
                                                </ul>

                                                <dl className="mt-4 space-y-2 text-sm text-[#f3e7c6]">
                                                    <div className="flex justify-between gap-3">
                                                        <dt>
                                                            {rooms.length > 1 ? `${rooms.length} packages` : 'Package'}
                                                            <span className="block text-xs text-[#d9c9a0]">room included</span>
                                                        </dt>
                                                        <dd className="tabular-nums">{formatINR(quote.roomSubtotalPaise)}</dd>
                                                    </div>
                                                    {quote.addOnTotals.map((t) => (
                                                        <div key={t.id} className="flex justify-between gap-3 text-[#e8dab0]">
                                                            <dt>
                                                                {t.name}
                                                                {t.qty > 1 ? ` × ${t.qty}` : ''}
                                                            </dt>
                                                            <dd className="tabular-nums">{formatINR(t.subtotalPaise)}</dd>
                                                        </div>
                                                    ))}
                                                    <div className="flex justify-between gap-3 border-t border-[#d9b668]/25 pt-2">
                                                        <dt>Subtotal</dt>
                                                        <dd className="tabular-nums">{formatINR(quote.subtotalPaise)}</dd>
                                                    </div>
                                                    <div className="flex justify-between gap-3">
                                                        <dt>GST ({GST_RATE}%)</dt>
                                                        <dd className="tabular-nums">{formatINR(quote.gstPaise)}</dd>
                                                    </div>
                                                </dl>

                                                <div className="mt-4 border-t border-[#d9b668]/40 pt-4">
                                                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#f0d58c]">Total payable</p>
                                                    <p className="text-3xl font-semibold tabular-nums text-[#f6dc9a]">{formatINR(quote.totalPaise)}</p>
                                                </div>

                                                <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm text-[#e8dab0]">
                                                    <input
                                                        type="checkbox"
                                                        checked={terms}
                                                        onChange={(e) => setTerms(e.target.checked)}
                                                        className="mt-0.5 h-5 w-5 shrink-0 accent-[#d9b668]"
                                                    />
                                                    <span>I agree to the terms and cancellation policy for The Grand Masquerade, 31st Night.</span>
                                                </label>

                                                {(serverError || quote.problem) && (
                                                    <p role="alert" className="mt-4 border border-[#f5a3a3]/50 bg-[#4a0f14]/60 px-4 py-3 text-sm text-[#f5c4c4]">
                                                        {serverError || quote.problem}
                                                    </p>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={submit}
                                                    disabled={sending || !!quote.problem || soldOut}
                                                    className="masq-btn mt-5 w-full px-6 py-4 text-sm uppercase tracking-[0.16em] font-semibold text-[#1a0d06] disabled:opacity-60"
                                                >
                                                    {sending ? (payOnline ? 'Opening payment…' : 'Sending…') : payOnline ? 'Book Now' : 'Send Booking Request'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setStep(1)}
                                                    disabled={sending}
                                                    className="mt-3 w-full border border-[#d9b668]/60 px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#f6dc9a] transition-colors hover:bg-[#d9b668]/15 disabled:opacity-40"
                                                >
                                                    Back
                                                </button>
                                                {payOnline && <p className="mt-3 text-center text-xs text-[#d9c9a0]">You will be taken to our secure payment page. Your room is held for 10 minutes.</p>}
                                            </aside>
                                        </motion.div>
                                    )}

                                    {step === 3 && (
                                        <motion.div key="s3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
                                            <p className="text-base md:text-lg text-[#fff8e6] leading-relaxed">
                                                Thank you, {name.trim().split(' ')[0]}. Our reservations team will contact you shortly to confirm your booking and arrange payment. A copy of
                                                your request is on its way to {email}.
                                            </p>
                                            <p className="mt-5 text-xs font-medium uppercase tracking-[0.14em] text-[#f0d58c]">Your total, including GST</p>
                                            <p className="text-4xl font-semibold tabular-nums text-[#f6dc9a]">{formatINR(sentTotal ?? quote.totalPaise)}</p>
                                            <p className="mt-4 text-sm text-[#e0d0a6]">Your booking is confirmed only once our team contacts you.</p>
                                            <button
                                                type="button"
                                                onClick={closeCurtains}
                                                className="masq-btn mt-7 px-10 py-3.5 text-sm uppercase tracking-[0.16em] font-semibold text-[#1a0d06]"
                                            >
                                                Close
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Stepper({
    value,
    min,
    max,
    onChange,
    label,
    compact = false,
    large = false,
}: {
    value: number;
    min: number;
    max: number;
    onChange: (v: number) => void;
    label: string;
    compact?: boolean;
    large?: boolean;
}) {
    const size = compact ? 'h-7 w-7' : large ? 'h-11 w-11 text-lg' : 'h-9 w-9';
    const btn = `${size} flex items-center justify-center border border-[#d9b668]/60 text-[#f3dc9c] transition-colors hover:bg-[#d9b668]/25 disabled:opacity-30 disabled:hover:bg-transparent`;
    return (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Decrease ${label}`}>
                &minus;
            </button>
            <span className={`${compact ? 'w-5 text-sm' : large ? 'w-9 text-xl font-semibold' : 'w-7 text-base'} text-center tabular-nums text-[#f6e9c4]`} aria-live="polite">
                {value}
            </span>
            <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`Increase ${label}`}>
                +
            </button>
        </div>
    );
}

function StepNumber({ n }: { n: number }) {
    return (
        <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#f0d58c] bg-[#d9b668]/20 text-base font-semibold text-[#fff1c4]">
            {n}
        </span>
    );
}
