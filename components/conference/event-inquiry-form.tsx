'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2, X } from 'lucide-react';

type InquiryFormState = {
    name: string;
    company: string;
    eventType: string;
    guestCount: string;
    preferredDate: string;
    phone: string;
    message: string;
    honeypot: string; // Spam protection - hidden field
};

const INITIAL_STATE: InquiryFormState = {
    name: '',
    company: '',
    eventType: '',
    guestCount: '',
    preferredDate: '',
    phone: '',
    message: '',
    honeypot: '',
};

export default function EventInquiryForm() {
    const [form, setForm] = useState<InquiryFormState>(INITIAL_STATE);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successOpen, setSuccessOpen] = useState(false);

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // Honeypot spam protection - if filled, silently reject
        if (form.honeypot) {
            setSuccessOpen(true);
            return;
        }

        setError(null);
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/inquiries/event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(form),
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(payload?.message || 'Failed to send your event brief.');
            }

            setForm(INITIAL_STATE);
            setSuccessOpen(true);
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Failed to send your event brief.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <form onSubmit={onSubmit} className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <input
                    name="name"
                    required
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Name"
                    className="h-12 border border-[#DCD3C4] bg-[#FCFBF7] px-3.5 text-sm outline-none focus:border-[#B68A4A]"
                />
                <input
                    name="company"
                    value={form.company}
                    onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
                    placeholder="Company"
                    className="h-12 border border-[#DCD3C4] bg-[#FCFBF7] px-3.5 text-sm outline-none focus:border-[#B68A4A]"
                />
                <select
                    name="eventType"
                    required
                    value={form.eventType}
                    onChange={(e) => setForm((prev) => ({ ...prev, eventType: e.target.value }))}
                    className="h-12 border border-[#DCD3C4] bg-[#FCFBF7] px-3.5 text-sm outline-none focus:border-[#B68A4A]"
                >
                    <option value="">Event Type</option>
                    <option value="Corporate Conference">Corporate Conference</option>
                    <option value="Seminar / Workshop">Seminar / Workshop</option>
                    <option value="Wedding Celebration">Wedding Celebration</option>
                    <option value="Private Celebration">Private Celebration</option>
                    <option value="Product Launch">Product Launch</option>
                </select>
                <input
                    name="guestCount"
                    value={form.guestCount}
                    onChange={(e) => setForm((prev) => ({ ...prev, guestCount: e.target.value }))}
                    placeholder="Number of Guests"
                    className="h-12 border border-[#DCD3C4] bg-[#FCFBF7] px-3.5 text-sm outline-none focus:border-[#B68A4A]"
                />
                <input
                    name="preferredDate"
                    type="date"
                    value={form.preferredDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, preferredDate: e.target.value }))}
                    className="h-12 border border-[#DCD3C4] bg-[#FCFBF7] px-3.5 text-sm outline-none focus:border-[#B68A4A]"
                />
                <input
                    name="phone"
                    required
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="Phone"
                    className="h-12 border border-[#DCD3C4] bg-[#FCFBF7] px-3.5 text-sm outline-none focus:border-[#B68A4A]"
                />
                <textarea
                    name="message"
                    value={form.message}
                    onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                    placeholder="Message"
                    rows={4}
                    className="md:col-span-2 border border-[#DCD3C4] bg-[#FCFBF7] px-3.5 py-3 text-sm outline-none focus:border-[#B68A4A]"
                />

                {error && (
                    <p className="md:col-span-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {error}
                    </p>
                )}

                {/* Honeypot field - hidden from humans, visible to bots */}
                <input
                    type="text"
                    name="website"
                    value={form.honeypot}
                    onChange={(e) => setForm((prev) => ({ ...prev, honeypot: e.target.value }))}
                    className="absolute left-[-9999px] opacity-0"
                    tabIndex={-1}
                    autoComplete="off"
                />

                <div className="md:col-span-2 flex justify-center">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 bg-[#0A332B] text-white px-8 py-3 text-[11px] tracking-[0.2em] uppercase hover:bg-[#15443B] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                Plan My Event
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </form>

            {successOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <button
                        type="button"
                        aria-label="Close confirmation"
                        className="absolute inset-0 bg-black/35"
                        onClick={() => setSuccessOpen(false)}
                    />
                    <div className="relative w-full max-w-md rounded-2xl border border-[#E9DCC7] bg-white p-6 shadow-2xl">
                        <button
                            type="button"
                            aria-label="Close"
                            className="absolute right-3 top-3 p-1 text-[#7B6E5A] hover:text-[#5D5346]"
                            onClick={() => setSuccessOpen(false)}
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-8 h-8 text-[#0A332B] mt-0.5" />
                            <div>
                                <h3 className="font-serif text-2xl text-[#1D1D1D]">Plan Sent Successfully</h3>
                                <p className="mt-2 text-sm text-[#5A564E] leading-relaxed">
                                    Your event plan has been shared with our reservations team. They will contact you shortly.
                                </p>
                            </div>
                        </div>
                        <div className="mt-5 flex justify-end">
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 bg-[#0A332B] text-white px-5 py-2.5 text-[11px] tracking-[0.2em] uppercase hover:bg-[#15443B] transition-colors"
                                onClick={() => setSuccessOpen(false)}
                            >
                                Done
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

