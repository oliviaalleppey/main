'use client';

import { Button } from '@/components/ui/button';
import { initiateOmniwarePaymentAction } from '@/app/book/actions';
import { useState, useTransition } from 'react';
import { Loader2, CreditCard, Lock, ShieldCheck, CircleCheck, BadgeCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/services/payment';

export function CheckoutForm({ amount }: { amount: number }) {
    const [isPending, startTransition] = useTransition();
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const payLabel = formatCurrency(amount);

    const handlePayment = () => {
        if (!acceptedTerms) return;
        setError(null);

        startTransition(async () => {
            const result = await initiateOmniwarePaymentAction();

            if (!result.success || !result.omniwarePayload) {
                setError(result.error || 'Failed to initiate payment. Please try again.');
                return;
            }

            // Build and auto-submit the Omniware form
            const payload = result.omniwarePayload;
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = payload.url;

            // Add all Omniware fields as hidden inputs
            const fields = Object.entries(payload.params);
            for (const [key, value] of fields) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = value as string;
                form.appendChild(input);
            }

            document.body.appendChild(form);
            form.submit();
        });
    };

    return (
        <div className="space-y-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2 md:p-3">
                <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-emerald-900">Payment secured by SSL encryption</p>
                        <p className="text-xs text-emerald-800/80">Your booking is confirmed only after verified payment status.</p>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-3 md:p-4 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between gap-3 mb-2 md:mb-3">
                    <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-[var(--text-dark)]" />
                        <span className="text-sm md:text-base font-medium">Secure Payment via Omniware</span>
                    </div>
                    <span className="rounded-full bg-white border border-gray-200 px-2.5 py-1 text-[11px] uppercase tracking-wider text-gray-600">
                        INR
                    </span>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-2 md:p-3">
                    <div className="flex items-center gap-2">
                        <BadgeCheck className="w-4 h-4 text-blue-600" />
                        <div>
                            <p className="text-xs md:text-sm font-semibold text-gray-900">Credit / Debit Card, UPI, Net Banking</p>
                            <p className="text-xs text-gray-500 mt-0.5">You will be securely redirected to Omniware to complete payment</p>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Secure payment session
                </p>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">
                    {error}
                </div>
            )}

            <label className="flex items-start gap-2.5 rounded-xl border border-gray-200 bg-white p-2.5 md:p-3">
                <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-[var(--text-dark)] focus:ring-[var(--text-dark)]"
                />
                <span className="text-sm text-gray-600">
                    I agree to the booking terms and cancellation policy.
                </span>
            </label>

            <Button
                onClick={handlePayment}
                disabled={isPending || !acceptedTerms}
                className="w-full rounded-xl bg-[var(--brand-primary)] text-white py-3 md:py-4 text-sm font-semibold hover:bg-[var(--brand-primary-dark)] transition-colors shadow-lg shadow-[var(--brand-primary)]/20"
            >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {!isPending ? `Pay ${payLabel} via Omniware` : 'Redirecting to Payment...'}
            </Button>

            <div className="rounded-xl border border-gray-200 bg-white p-2.5 md:p-3">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">What happens next</p>
                <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                        <CircleCheck className="w-4 h-4 mt-0.5 text-emerald-600" />
                        You&apos;ll be redirected to Omniware to complete payment securely.
                    </li>
                    <li className="flex items-start gap-2">
                        <CircleCheck className="w-4 h-4 mt-0.5 text-emerald-600" />
                        After payment, we&apos;ll confirm your reservation with the hotel CRS.
                    </li>
                </ul>
            </div>
        </div>
    );
}
