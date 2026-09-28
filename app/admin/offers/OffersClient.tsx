'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { Tag, Plus, Loader2, Check, X, Trash2, Pencil } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

/**
 * Promo code management.
 *
 * The money fields are entered in rupees and converted to paise at the API
 * boundary, once. `discountValue` deliberately means two different things
 * depending on `discountType` — a percentage or an amount in rupees — so the
 * label and suffix change with it rather than leaving the operator to guess.
 */

type Offer = {
    id: string;
    title: string;
    description: string | null;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minBookingAmount: number | null;
    maxDiscount: number | null;
    validFrom: string;
    validTo: string;
    usageLimit: number | null;
    usageCount: number | null;
    isActive: boolean;
};

type FormState = {
    title: string;
    description: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: string;
    minBookingAmountRupees: string;
    maxDiscountRupees: string;
    validFrom: string;
    validTo: string;
    usageLimit: string;
    isActive: boolean;
};

function today(): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
}

function inOneYear(): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(d);
}

const EMPTY: FormState = {
    title: '', description: '', code: '',
    discountType: 'percentage', discountValue: '',
    minBookingAmountRupees: '0', maxDiscountRupees: '',
    validFrom: today(), validTo: inOneYear(),
    usageLimit: '', isActive: true,
};

export default function OffersPage() {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY);
    const [pending, startTransition] = useTransition();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/offers');
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error ?? 'Could not load offers');
            setOffers(payload.offers);
            setError(null);
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'Could not load offers');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    function startCreate() {
        setForm(EMPTY);
        setEditingId(null);
        setShowForm(true);
        setError(null);
    }

    function startEdit(offer: Offer) {
        setForm({
            title: offer.title,
            description: offer.description ?? '',
            code: offer.code,
            discountType: offer.discountType,
            discountValue: offer.discountType === 'fixed'
                ? String((offer.discountValue ?? 0) / 100)
                : String(offer.discountValue ?? ''),
            minBookingAmountRupees: String((offer.minBookingAmount ?? 0) / 100),
            maxDiscountRupees: offer.maxDiscount ? String(offer.maxDiscount / 100) : '',
            validFrom: offer.validFrom,
            validTo: offer.validTo,
            usageLimit: offer.usageLimit ? String(offer.usageLimit) : '',
            isActive: offer.isActive,
        });
        setEditingId(offer.id);
        setShowForm(true);
        setError(null);
    }

    function save() {
        startTransition(async () => {
            const payload = {
                title: form.title.trim(),
                description: form.description.trim() || null,
                discountType: form.discountType,
                discountValue: Number(form.discountValue),
                minBookingAmountRupees: Number(form.minBookingAmountRupees || 0),
                maxDiscountRupees: form.maxDiscountRupees ? Number(form.maxDiscountRupees) : null,
                validFrom: form.validFrom,
                validTo: form.validTo,
                usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
                isActive: form.isActive,
                // The code is set once, at creation, and never edited: it has been
                // sent to guests and recorded on their bookings.
                ...(editingId ? {} : { code: form.code.trim().toUpperCase() }),
            };

            const response = await fetch(
                editingId ? `/api/admin/offers/${editingId}` : '/api/admin/offers',
                {
                    method: editingId ? 'PATCH' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                },
            );
            const result = await response.json();
            if (!response.ok) { setError(result.error ?? 'Could not save the offer'); return; }

            setShowForm(false);
            setEditingId(null);
            setError(null);
            await load();
        });
    }

    function toggleActive(offer: Offer) {
        startTransition(async () => {
            const response = await fetch(`/api/admin/offers/${offer.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !offer.isActive }),
            });
            if (!response.ok) {
                const result = await response.json();
                setError(result.error ?? 'Could not update the offer');
                return;
            }
            await load();
        });
    }

    function remove(offer: Offer) {
        startTransition(async () => {
            const response = await fetch(`/api/admin/offers/${offer.id}`, { method: 'DELETE' });
            if (!response.ok) {
                const result = await response.json();
                setError(result.error ?? 'Could not delete the offer');
                return;
            }
            setError(null);
            await load();
        });
    }

    function describe(offer: Offer): string {
        const value = offer.discountType === 'percentage'
            ? `${offer.discountValue}% off`
            : `${formatCurrency(offer.discountValue)} off`;
        const cap = offer.maxDiscount ? `, up to ${formatCurrency(offer.maxDiscount)}` : '';
        const min = offer.minBookingAmount
            ? ` on bookings over ${formatCurrency(offer.minBookingAmount)}`
            : '';
        return `${value}${cap}${min}`;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Tag className="h-5 w-5" /> Promo codes
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Discounts apply to room charges only. Tax is recalculated on the reduced
                        amount, and codes never combine — a guest gets the better of two.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={startCreate}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                    <Plus className="h-4 w-4" /> New code
                </button>
            </div>

            {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                </div>
            )}

            {showForm && (
                <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
                    <h2 className="text-sm font-semibold text-gray-900">
                        {editingId ? `Edit ${form.code}` : 'New promo code'}
                    </h2>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Internal title" hint="Shown to the guest when the code is applied">
                            <input
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder="Monsoon Escape 20%"
                                className={inputClass}
                            />
                        </Field>

                        <Field
                            label="Code"
                            hint={editingId
                                ? 'Codes cannot be changed — they have been sent to guests and recorded on bookings'
                                : 'What the guest types. Letters, numbers, dashes.'}
                        >
                            <input
                                value={form.code}
                                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                disabled={!!editingId}
                                placeholder="MONSOON20"
                                className={`${inputClass} uppercase disabled:bg-gray-100 disabled:text-gray-500`}
                            />
                        </Field>

                        <Field label="Discount type">
                            <select
                                value={form.discountType}
                                onChange={(e) => setForm({ ...form, discountType: e.target.value as 'percentage' | 'fixed' })}
                                className={inputClass}
                            >
                                <option value="percentage">Percentage</option>
                                <option value="fixed">Fixed amount</option>
                            </select>
                        </Field>

                        <Field
                            label={form.discountType === 'percentage' ? 'Percentage off' : 'Amount off (₹)'}
                            hint="Applied to room charges only, never to add-ons"
                        >
                            <input
                                type="number"
                                min={0}
                                max={form.discountType === 'percentage' ? 100 : undefined}
                                value={form.discountValue}
                                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                                placeholder={form.discountType === 'percentage' ? '20' : '2000'}
                                className={inputClass}
                            />
                        </Field>

                        {form.discountType === 'percentage' && (
                            <Field label="Maximum discount (₹)" hint="Optional. Turns 20% off into 20% off, up to ₹X.">
                                <input
                                    type="number"
                                    min={0}
                                    value={form.maxDiscountRupees}
                                    onChange={(e) => setForm({ ...form, maxDiscountRupees: e.target.value })}
                                    placeholder="No cap"
                                    className={inputClass}
                                />
                            </Field>
                        )}

                        <Field label="Minimum booking (₹)" hint="Measured on the total before discount. 0 for no minimum.">
                            <input
                                type="number"
                                min={0}
                                value={form.minBookingAmountRupees}
                                onChange={(e) => setForm({ ...form, minBookingAmountRupees: e.target.value })}
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Valid from">
                            <input
                                type="date"
                                value={form.validFrom}
                                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Valid to" hint="Inclusive. Judged on the date in Kerala, not UTC.">
                            <input
                                type="date"
                                value={form.validTo}
                                onChange={(e) => setForm({ ...form, validTo: e.target.value })}
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Usage limit" hint="Optional. Total redemptions across all guests.">
                            <input
                                type="number"
                                min={1}
                                value={form.usageLimit}
                                onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                                placeholder="Unlimited"
                                className={inputClass}
                            />
                        </Field>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                            className="h-4 w-4"
                        />
                        Active — guests can use this code now
                    </label>

                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={save}
                            disabled={pending || !form.title.trim() || !form.discountValue || (!editingId && !form.code.trim())}
                            className="inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
                        >
                            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            {editingId ? 'Save changes' : 'Create code'}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setShowForm(false); setEditingId(null); setError(null); }}
                            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <p className="text-sm text-gray-500">Loading…</p>
            ) : offers.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
                    <Tag className="mx-auto h-8 w-8 text-gray-300" />
                    <p className="mt-3 text-sm font-medium text-gray-900">No promo codes yet</p>
                    <p className="mt-1 text-xs text-gray-500">
                        A code created here can be advertised in a WhatsApp campaign and applied
                        automatically for guests who follow its link.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                    <table className="w-full text-sm">
                        <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-4 py-2 font-medium">Code</th>
                                <th className="px-4 py-2 font-medium">Discount</th>
                                <th className="px-4 py-2 font-medium">Valid</th>
                                <th className="px-4 py-2 font-medium">Used</th>
                                <th className="px-4 py-2 font-medium">Status</th>
                                <th className="px-4 py-2" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {offers.map((offer) => (
                                <tr key={offer.id} className="align-top">
                                    <td className="px-4 py-3">
                                        <p className="font-mono font-medium text-gray-900">{offer.code}</p>
                                        <p className="text-xs text-gray-500">{offer.title}</p>
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">{describe(offer)}</td>
                                    <td className="px-4 py-3 text-xs text-gray-600">
                                        {offer.validFrom} → {offer.validTo}
                                    </td>
                                    <td className="px-4 py-3 tabular-nums text-gray-700">
                                        {offer.usageCount ?? 0}
                                        {offer.usageLimit ? ` / ${offer.usageLimit}` : ''}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                            offer.isActive
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {offer.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                type="button"
                                                onClick={() => startEdit(offer)}
                                                disabled={pending}
                                                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
                                                aria-label={`Edit ${offer.code}`}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => toggleActive(offer)}
                                                disabled={pending}
                                                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
                                                aria-label={offer.isActive ? `Deactivate ${offer.code}` : `Activate ${offer.code}`}
                                            >
                                                {offer.isActive ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => remove(offer)}
                                                disabled={pending || (offer.usageCount ?? 0) > 0}
                                                title={(offer.usageCount ?? 0) > 0
                                                    ? 'Used codes cannot be deleted — deactivate instead'
                                                    : 'Delete'}
                                                className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-25"
                                                aria-label={`Delete ${offer.code}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700">{label}</label>
            {children}
            {hint && <p className="text-xs text-gray-500">{hint}</p>}
        </div>
    );
}
