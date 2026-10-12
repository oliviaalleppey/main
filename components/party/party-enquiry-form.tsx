'use client';

import { FormEvent, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

type FormState = { name: string; phone: string; email: string; honeypot: string };

const INITIAL: FormState = { name: '', phone: '', email: '', honeypot: '' };

const FIELD =
    'h-12 w-full border border-[#d4b06a]/40 bg-[#1a0709] px-3.5 text-sm text-[#f6efe0] placeholder:text-[#c9b89a]/60 outline-none focus:border-[#d4b06a]';

export default function PartyEnquiryForm({ couples, onSent }: { couples: number; onSent?: () => void }) {
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
                    eventType: '31st Night celebrity masquerade',
                    preferredDate: '31 December 2026',
                    guestCount: `${couples} couple(s)`,
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
            <div className="flex items-start gap-3 border border-[#d4b06a]/40 p-6 text-left">
                <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0 text-[#d4b06a]" />
                <div>
                    <p className="font-serif text-2xl text-[#f6efe0]">Enquiry received</p>
                    <p className="mt-1 text-sm text-[#c9b89a]">Our team will call you shortly about your passes.</p>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
            <label className="sr-only" htmlFor="pe-name">Name</label>
            <input id="pe-name" required value={form.name} onChange={set('name')} placeholder="Name" className={FIELD} autoComplete="name" />
            <label className="sr-only" htmlFor="pe-phone">Phone</label>
            <input id="pe-phone" required type="tel" value={form.phone} onChange={set('phone')} placeholder="Phone" className={FIELD} autoComplete="tel" />
            <label className="sr-only" htmlFor="pe-email">Email</label>
            <input id="pe-email" type="email" value={form.email} onChange={set('email')} placeholder="Email (optional)" className={`${FIELD} sm:col-span-2`} autoComplete="email" />
            <input type="text" name="website" value={form.honeypot} onChange={set('honeypot')} className="absolute left-[-9999px] opacity-0" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            {error && <p className="border border-red-400/40 bg-red-950/40 px-3 py-2 text-sm text-red-200 sm:col-span-2">{error}</p>}
            <button
                type="submit"
                disabled={sending}
                className="inline-flex h-12 items-center justify-center gap-2 border border-[#d4b06a] bg-[#d4b06a] text-[12px] uppercase tracking-[0.26em] text-[#1a0709] transition-colors hover:bg-[#f1dba0] disabled:opacity-70 sm:col-span-2"
                style={{ fontFamily: 'var(--font-cinzel), Georgia, serif' }}
            >
                {sending ? (<><Loader2 className="h-4 w-4 animate-spin" />Sending</>) : 'Send enquiry'}
            </button>
        </form>
    );
}
