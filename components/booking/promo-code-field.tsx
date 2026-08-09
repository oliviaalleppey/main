'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Tag, X, Loader2 } from 'lucide-react';
import { applyPromoCodeAction, removePromoCodeAction } from '@/app/book/actions';

/**
 * Promo code entry on the checkout summary.
 *
 * The field holds no pricing logic at all. It sends a code, the server
 * revalidates and recomputes, and the whole summary re-renders from the
 * authoritative quote — so what is displayed is always what will be charged.
 * A client-side "you save ₹X" computed here would be a fourth place the money
 * is calculated, and the first to disagree with the payment gateway.
 */
export function PromoCodeField({
    appliedCode,
    appliedTitle,
    discount,
}: {
    appliedCode: string | null;
    appliedTitle: string | null;
    discount: number;
}) {
    const router = useRouter();
    const [code, setCode] = useState('');
    const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
    const [pending, startTransition] = useTransition();

    function submit() {
        const entered = code.trim();
        if (!entered || pending) return;

        startTransition(async () => {
            const result = await applyPromoCodeAction(entered);
            setMessage({ text: result.message, ok: result.ok });
            if (result.ok) {
                setCode('');
                router.refresh();
            }
        });
    }

    function remove() {
        startTransition(async () => {
            const result = await removePromoCodeAction();
            setMessage(result.ok ? null : { text: result.message, ok: false });
            router.refresh();
        });
    }

    if (appliedCode) {
        return (
            <div className="pt-3 border-t border-dashed border-gray-200">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                        <Tag className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-600" />
                        <div className="min-w-0">
                            <p className="text-[13px] font-medium text-emerald-700 truncate">{appliedCode}</p>
                            {appliedTitle && (
                                <p className="text-xs text-gray-500 truncate">{appliedTitle}</p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={remove}
                        disabled={pending}
                        className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50"
                        aria-label={`Remove promo code ${appliedCode}`}
                    >
                        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                    </button>
                </div>
                {discount > 0 && (
                    <p className="mt-1 pl-5 text-xs text-gray-500">
                        Applied to your room charges. Tax is charged on the reduced amount.
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="pt-3 border-t border-dashed border-gray-200">
            <label htmlFor="promo-code" className="block text-[13px] text-gray-600">
                Promo code
            </label>
            <div className="mt-1.5 flex gap-2">
                <input
                    id="promo-code"
                    value={code}
                    onChange={(event) => setCode(event.target.value.toUpperCase())}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            submit();
                        }
                    }}
                    placeholder="Enter code"
                    autoComplete="off"
                    spellCheck={false}
                    className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm uppercase tracking-wide placeholder:normal-case placeholder:tracking-normal focus:border-gray-900 focus:outline-none"
                />
                <button
                    type="button"
                    onClick={submit}
                    disabled={pending || !code.trim()}
                    className="shrink-0 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-40"
                >
                    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                </button>
            </div>
            {message && (
                <p className={`mt-1.5 text-xs ${message.ok ? 'text-emerald-700' : 'text-red-600'}`}>
                    {message.text}
                </p>
            )}
        </div>
    );
}
