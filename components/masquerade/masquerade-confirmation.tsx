import Link from 'next/link';
import { CONTACT } from '@/lib/seo';
import { formatINR } from '@/lib/masquerade-offer';
import type { MasqueradeNotes } from '@/lib/masquerade-notes';
import { CHECK_IN_TIME, CHECK_OUT_TIME } from '@/lib/stay-times';

export type ConfirmationTone = 'confirmed' | 'received' | 'pending' | 'failed';

export interface MasqueradeConfirmationProps {
    tone: ConfirmationTone;
    title: string;
    message: string;
    guestName: string;
    bookingNumber: string;
    confirmationNumber: string | null;
    bookingId: string;
    checkIn: string;
    checkOut: string;
    notes: MasqueradeNotes;
    /** Rooms as booked: room type and how many, used when the notes don't name them. */
    roomSummary: string;
    addOns: { name: string; quantity: number; subtotalPaise: number }[];
    subtotalPaise: number;
    gstPaise: number;
    totalPaise: number;
    paid: boolean;
}

const dateLong = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

const GOLD_TEXT = 'bg-gradient-to-b from-[#fff6d8] via-[#f0cf7a] to-[#b8883f] bg-clip-text text-transparent';

const MARK: Record<ConfirmationTone, string> = {
    confirmed: 'M5 13l4 4L19 7',
    received: 'M12 6v6l4 2',
    pending: 'M12 6v6l4 2',
    failed: 'M12 7v6M12 17h.01',
};

export default function MasqueradeConfirmation(p: MasqueradeConfirmationProps) {
    const displayAddOns = p.addOns.map((a) => ({ ...a, name: a.name.replace(/^31st Night:\s*/, '') }));
    const accent = p.tone === 'failed' ? 'border-[#f5a3a3] text-[#ffb3b3]' : 'border-[#f0cf7a] text-[#f6dc9a]';

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#0a0608] px-4 py-14 md:py-20">
            {/* The hall, deep behind the page */}
            <div
                aria-hidden
                className="absolute inset-0 bg-cover bg-center opacity-30 blur-md scale-110"
                style={{ backgroundImage: "url('/images/masquerade/ballroom.webp')" }}
            />
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(10,6,8,.35),rgba(5,2,3,.95))]" />
            <div aria-hidden className="absolute inset-y-0 left-0 w-16 md:w-28 bg-gradient-to-r from-[#3a0a14] to-transparent" />
            <div aria-hidden className="absolute inset-y-0 right-0 w-16 md:w-28 bg-gradient-to-l from-[#3a0a14] to-transparent" />

            <div className="relative mx-auto w-full max-w-3xl border border-[#d9b668]/45 bg-black/60 backdrop-blur-sm px-5 py-10 md:px-12 md:py-14">
                <div className="pointer-events-none absolute inset-2 border border-[#d9b668]/15" />

                <div className="relative text-center">
                    <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 ${accent}`}>
                        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d={MARK[p.tone]} />
                        </svg>
                    </div>

                    <p className="mt-6 text-xs md:text-sm font-medium uppercase tracking-[0.25em] text-[#f0d58c]">The Grand Masquerade · New Year&rsquo;s Eve</p>
                    <h1
                        className={`mt-3 text-3xl md:text-5xl font-bold uppercase leading-tight tracking-[0.06em] ${GOLD_TEXT}`}
                        style={{ fontFamily: 'var(--font-cinzel), serif' }}
                    >
                        {p.title}
                    </h1>
                    <p className="mx-auto mt-4 max-w-xl text-base md:text-lg leading-relaxed text-[#f3e7c6]">{p.message}</p>

                    {p.notes.isTest && (
                        <p className="mx-auto mt-5 inline-block border border-[#f5a3a3]/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#ffb3b3]">
                            Test booking
                        </p>
                    )}
                </div>

                {p.confirmationNumber && (
                    <div className="relative mx-auto mt-9 max-w-sm border border-[#d9b668]/50 bg-black/40 px-6 py-5 text-center">
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#f0d58c]">Confirmation number</p>
                        <p className="mt-1 text-4xl font-semibold tabular-nums tracking-wider text-[#fff1c4]">{p.confirmationNumber}</p>
                        <p className="mt-1 text-sm text-[#d9c9a0]">Booking reference {p.bookingNumber}</p>
                    </div>
                )}

                {/* When and who */}
                <dl className="relative mt-9 grid gap-x-8 gap-y-5 border-t border-[#d9b668]/30 pt-8 text-left sm:grid-cols-2">
                    <div>
                        <dt className="text-xs font-medium uppercase tracking-[0.18em] text-[#f0d58c]">Guest</dt>
                        <dd className="mt-1 text-lg text-[#fff8e6]">{p.guestName}</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium uppercase tracking-[0.18em] text-[#f0d58c]">Check-in</dt>
                        <dd className="mt-1 text-lg text-[#fff8e6]">{dateLong(p.checkIn)}, {CHECK_IN_TIME}</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium uppercase tracking-[0.18em] text-[#f0d58c]">Check-out</dt>
                        <dd className="mt-1 text-lg text-[#fff8e6]">{dateLong(p.checkOut)}, {CHECK_OUT_TIME}</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium uppercase tracking-[0.18em] text-[#f0d58c]">Evening</dt>
                        <dd className="mt-1 text-lg text-[#fff8e6]">The Grand Masquerade, 31 December</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium uppercase tracking-[0.18em] text-[#f0d58c]">Meal plan</dt>
                        <dd className="mt-1 text-lg text-[#fff8e6]">MAP</dd>
                    </div>
                </dl>

                {/* The rooms */}
                <section className="relative mt-9 border-t border-[#d9b668]/30 pt-8 text-left">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#f0d58c]">
                        {p.notes.rooms.length > 1 ? 'Your rooms' : 'Your room'}
                    </h2>
                    {p.notes.rooms.length > 0 ? (
                        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                            {p.notes.rooms.map((room) => (
                                <li key={room.number} className="border border-[#d9b668]/35 bg-black/35 px-4 py-4">
                                    {p.notes.rooms.length > 1 && <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#d9c9a0]">Room {room.number}</p>}
                                    <p className="mt-0.5 text-lg font-semibold text-[#fff8e6]">{room.roomType}</p>
                                    <p className="mt-1 text-sm text-[#e8dab0]">{room.guests}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-3 text-lg text-[#fff8e6]">{p.roomSummary}</p>
                    )}
                    {p.notes.outside.length > 0 && (
                        <div className="mt-5">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#f0d58c]">Joining the evening</h3>
                            <ul className="mt-2 space-y-1 text-[#e8dab0]">
                                {p.notes.outside.map((o) => (
                                    <li key={o}>{o}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {p.notes.guestNote && (
                        <p className="mt-5 text-sm text-[#e8dab0]">
                            <span className="font-semibold text-[#f0d58c]">Your request: </span>
                            {p.notes.guestNote}
                        </p>
                    )}
                </section>

                {/* The payment */}
                <section className="relative mt-9 border-t border-[#d9b668]/30 pt-8 text-left">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#f0d58c]">{p.paid ? 'Payment' : 'Amount due'}</h2>
                    <dl className="mt-4 space-y-2 text-[#f3e7c6]">
                        <div className="flex justify-between gap-4">
                            <dt>The 31st Night package, room included</dt>
                            <dd className="tabular-nums">{formatINR(p.subtotalPaise - displayAddOns.reduce((s, a) => s + a.subtotalPaise, 0))}</dd>
                        </div>
                        {displayAddOns.map((a) => (
                            <div key={a.name} className="flex justify-between gap-4 text-[#e8dab0]">
                                <dt>
                                    {a.name}
                                    {a.quantity > 1 ? ` × ${a.quantity}` : ''}
                                </dt>
                                <dd className="tabular-nums">{formatINR(a.subtotalPaise)}</dd>
                            </div>
                        ))}
                        <div className="flex justify-between gap-4">
                            <dt>GST (18%)</dt>
                            <dd className="tabular-nums">{formatINR(p.gstPaise)}</dd>
                        </div>
                        <div className="flex justify-between gap-4 border-t border-[#d9b668]/30 pt-3 text-xl font-semibold text-[#f6dc9a]">
                            <dt>{p.paid ? 'Total paid' : 'Total'}</dt>
                            <dd className="tabular-nums">{formatINR(p.totalPaise)}</dd>
                        </div>
                    </dl>
                </section>

                <div className="relative mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
                    <Link
                        href="/"
                        className="border border-[#d9b668]/60 px-8 py-3.5 text-center text-sm font-semibold uppercase tracking-[0.16em] text-[#f6dc9a] transition-colors hover:bg-[#d9b668]/15"
                    >
                        Return Home
                    </Link>
                    {p.tone === 'confirmed' && (
                        <Link
                            href={`/book/invoice/${p.bookingId}`}
                            target="_blank"
                            className="bg-gradient-to-br from-[#f3dc9c] via-[#d9b668] to-[#b68845] px-8 py-3.5 text-center text-sm font-semibold uppercase tracking-[0.16em] text-[#1a0d06] transition-[filter] hover:brightness-110"
                        >
                            Download Voucher
                        </Link>
                    )}
                </div>

                <p className="relative mt-8 text-center text-sm text-[#d9c9a0]">
                    Questions? Call{' '}
                    <a href={`tel:${CONTACT.phone}`} className="text-[#f6dc9a] underline underline-offset-4">
                        {CONTACT.phoneDisplay}
                    </a>{' '}
                    or write to{' '}
                    <a href={`mailto:${CONTACT.reservationsEmail}`} className="text-[#f6dc9a] underline underline-offset-4">
                        {CONTACT.reservationsEmail}
                    </a>
                    .
                </p>
            </div>
        </div>
    );
}
