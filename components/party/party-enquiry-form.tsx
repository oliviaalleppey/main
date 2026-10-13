'use client';

import { FormEvent, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

type FormState = { name: string; phone: string; email: string; honeypot: string };

const INITIAL: FormState = { name: '', phone: '', email: '', honeypot: '' };

const FIELD =
    'h-14 w-full border border-[#d4b06a]/55 bg-[#1a0709] px-4 text-[17px] text-[#fbf4e6] placeholder:text-[#c9b89a]/70 outline-none focus:border-[#f1dba0] focus:ring-2 focus:ring-[#d4b06a]/40';
const LABEL = 'block text-[15px] font-medium text-[#f1dba0] mb-1.5';

export default function PartyEnquiryForm({
    eventType,
    guestCount,
    message,
    onSent,
}: {
    eventType: string;
    guestCount: string;
    /** The guest's plan, line by line, for the reservations team. */
    message: string;
    onSent?: () => void;
}) {
    const [form, setForm] = useState<FormState>(INITIAL);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({ ...prev, [key]: e.target.value }));

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (form.honeypot) {
            setSent(true);
            return;
        }
        setError(null);
        setSending(true);
        try {
            const response = await fetch('/api/inquiries/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    phone: form.phone,
                    email: form.email,
                    eventType,
                    preferredDate: '31 December 2026',
                    guestCount,
                    message,
                }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload?.message || 'Could not send your enquiry.');
            setForm(INITIAL);
            setSent(true);
            onSent?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not send your enquiry.');
        } finally {
            setSending(false);
        }
    }

    if (sent) {
        return (
            <div className="flex items-start gap-3 border border-[#d4b06a]/50 bg-[#1a0709]/70 p-6 text-left" role="status">
                <CheckCircle2 className="mt-1 h-8 w-8 shrink-0 text-[#f1dba0]" />
                <div>
                    <p className="font-serif text-3xl text-[#fbf4e6]">Thank you, we have your plan</p>
                    <p className="mt-2 text-[17px] leading-relaxed text-[#eadcc2]">Our team will call you shortly to confirm your passes.</p>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
            <div>
                <label className={LABEL} htmlFor="pe-name">Your name</label>
                <input id="pe-name" required value={form.name} onChange={set('name')} className={FIELD} autoComplete="name" />
            </div>
            <div>
                <label className={LABEL} htmlFor="pe-phone">Phone number</label>
                <input id="pe-phone" required type="tel" value={form.phone} onChange={set('phone')} className={FIELD} autoComplete="tel" inputMode="tel" />
            </div>
            <div className="sm:col-span-2">
                <label className={LABEL} htmlFor="pe-email">Email <span className="font-normal text-[#c9b89a]">(optional)</span></label>
                <input id="pe-email" type="email" value={form.email} onChange={set('email')} className={FIELD} autoComplete="email" />
            </div>
            <input type="text" name="website" value={form.honeypot} onChange={set('honeypot')} className="absolute left-[-9999px] opacity-0" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            {error && <p className="border border-red-400/50 bg-red-950/60 px-4 py-3 text-[16px] text-red-100 sm:col-span-2" role="alert">{error}</p>}
            <button
                type="submit"
                disabled={sending}
                className="mt-1 inline-flex h-14 items-center justify-center gap-2 border border-[#d4b06a] bg-[#d4b06a] text-[15px] font-semibold uppercase tracking-[0.14em] text-[#1a0709] transition-colors hover:bg-[#f1dba0] disabled:opacity-70 sm:col-span-2"
                style={{ fontFamily: 'var(--font-cinzel), Georgia, serif' }}
            >
                {sending ? (<><Loader2 className="h-5 w-5 animate-spin" />Sending</>) : 'Send my plan'}
            </button>
        </form>
    );
}
