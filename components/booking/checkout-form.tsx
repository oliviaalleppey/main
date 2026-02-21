'use client';

import { Button } from '@/components/ui/button';
import { finalizeBookingAction } from '@/app/book/actions';
import { useMemo, useState, useTransition } from 'react';
import { Loader2, CreditCard, Lock, ShieldCheck, CircleCheck, Smartphone, BadgeCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/services/payment';

export function CheckoutForm({ amount }: { amount: number }) {
    const [isPending, startTransition] = useTransition();
    const [selectedMethod, setSelectedMethod] = useState<'card' | 'upi'>('card');
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const payLabel = useMemo(() => formatCurrency(amount), [amount]);

    const handlePayment = () => {
        if (!acceptedTerms) return;

        startTransition(async () => {
            // Simulate Payment Details
            const paymentDetails = {
                method: selectedMethod === 'card' ? 'razorpay_card_mock' : 'razorpay_upi_mock',
                transactionId: 'pay_mock_' + Math.random().toString(36).substring(7),
                amount: amount
            };

            await finalizeBookingAction(paymentDetails);
        });
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 md:p-4">
                <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-emerald-900">Payment secured by SSL encryption</p>
                        <p className="text-xs text-emerald-800/80">Your booking is confirmed only after verified payment status.</p>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 md:p-6 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between gap-3 mb-3 md:mb-4">
                    <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-[#1C1C1C]" />
                        <span className="text-sm md:text-base font-medium">Choose Payment Method</span>
                    </div>
                    <span className="rounded-full bg-white border border-gray-200 px-2.5 py-1 text-[11px] uppercase tracking-wider text-gray-600">
                        INR
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-3">
                    <button
                        type="button"
                        onClick={() => setSelectedMethod('card')}
                        className={`rounded-xl border p-3 md:p-4 text-left transition-colors ${selectedMethod === 'card'
                            ? 'border-[#0A332B] bg-white shadow-sm'
                            : 'border-gray-200 bg-white/70 hover:bg-white'
                            }`}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-xs md:text-sm font-semibold text-gray-900">Credit / Debit Card</p>
                                <p className="text-xs text-gray-500 mt-1">Visa, Mastercard, RuPay</p>
                            </div>
                            {selectedMethod === 'card' && (
                                <BadgeCheck className="w-4 h-4 text-[#0A332B]" />
                            )}
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSelectedMethod('upi')}
                        className={`rounded-xl border p-3 md:p-4 text-left transition-colors ${selectedMethod === 'upi'
                            ? 'border-[#0A332B] bg-white shadow-sm'
                            : 'border-gray-200 bg-white/70 hover:bg-white'
                            }`}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-xs md:text-sm font-semibold text-gray-900 inline-flex items-center gap-1.5">
                                    <Smartphone className="w-4 h-4 text-gray-600" />
                                    UPI
                                </p>
                                <p className="text-xs text-gray-500 mt-1">GPay, PhonePe, BHIM</p>
                            </div>
                            {selectedMethod === 'upi' && (
                                <BadgeCheck className="w-4 h-4 text-[#0A332B]" />
                            )}
                        </div>
                    </button>
                </div>

                <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Secure payment session
                </p>
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 md:p-4">
                <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-[#1C1C1C] focus:ring-[#1C1C1C]"
                />
                <span className="text-sm text-gray-600">
                    I agree to the booking terms and cancellation policy.
                </span>
            </label>

            <Button
                onClick={handlePayment}
                disabled={isPending || !acceptedTerms}
                className="w-full rounded-xl bg-[#0A332B] text-white py-4 md:py-6 text-base md:text-lg font-semibold hover:bg-[#15443B] transition-colors shadow-lg shadow-[#0A332B]/20"
            >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {!isPending ? `Pay ${payLabel} & Confirm` : 'Processing Payment...'}
            </Button>

            <div className="rounded-xl border border-gray-200 bg-white p-3 md:p-4">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">What happens next</p>
                <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                        <CircleCheck className="w-4 h-4 mt-0.5 text-emerald-600" />
                        Payment is verified server-side.
                    </li>
                    <li className="flex items-start gap-2">
                        <CircleCheck className="w-4 h-4 mt-0.5 text-emerald-600" />
                        Reservation is sent to CRS; confirmation number may take a short time.
                    </li>
                </ul>
            </div>
        </div>
    );
}
