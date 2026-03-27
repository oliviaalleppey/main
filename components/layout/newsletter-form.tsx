'use client';

import { FormEvent, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function NewsletterForm() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setStatus('loading');
        try {
            const res = await fetch('/api/newsletter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            });
            if (!res.ok) throw new Error();
            setStatus('success');
            setEmail('');
        } catch {
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <p className="text-[var(--brand-primary)] text-base font-medium">
                Thank you for subscribing!
            </p>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-3 rounded-2xl border border-[#BEB4A8] bg-white px-4 py-3">
            <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full bg-transparent outline-none text-[var(--text-dark)] placeholder-[#726B64] text-base tracking-wide"
            />
            <button
                type="submit"
                disabled={status === 'loading'}
                className="rounded-xl bg-[var(--btn-dark)] px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-white hover:bg-[var(--text-dark)] transition-colors font-medium whitespace-nowrap disabled:opacity-70"
            >
                {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Subscribe'}
            </button>
            {status === 'error' && (
                <span className="text-red-500 text-xs ml-2">Failed. Try again.</span>
            )}
        </form>
    );
}
