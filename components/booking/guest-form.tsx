'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateGuestDetails } from '@/app/book/actions';
import { Loader2, Mail, MapPin, MessageSquare, Phone, User } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { useRef, useState } from 'react';

type GuestFormValues = {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    requests?: string;
};

interface GuestFormProps {
    initialValues?: GuestFormValues;
    submitLabel?: string;
}

function SubmitButton({ submitLabel }: { submitLabel: string }) {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-[var(--brand-primary)] text-white py-3 md:py-4 text-sm font-semibold shadow-lg shadow-[var(--brand-primary)]/20 hover:bg-[var(--brand-primary-dark)] transition-colors"
        >
            {pending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            {submitLabel}
        </Button>
    );
}

function normalizePhone(value: string): string {
    // Strip spaces, dashes, dots, parentheses
    let digits = value.replace(/[\s\-().]/g, '');
    // Remove leading +91 or 0
    if (digits.startsWith('+91')) digits = digits.slice(3);
    else if (digits.startsWith('91') && digits.length === 12) digits = digits.slice(2);
    else if (digits.startsWith('0')) digits = digits.slice(1);
    return digits;
}

function validateForm(data: FormData): Record<string, string> {
    const errors: Record<string, string> = {};

    const firstName = (data.get('firstName') as string || '').trim();
    const lastName = (data.get('lastName') as string || '').trim();
    const email = (data.get('email') as string || '').trim();
    const phone = (data.get('phone') as string || '').trim();

    if (!firstName) errors.firstName = 'First name is required';
    if (!lastName) errors.lastName = 'Last name is required';

    if (!email) {
        errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        errors.email = 'Enter a valid email address';
    }

    if (!phone) {
        errors.phone = 'Phone number is required';
    } else {
        const digits = normalizePhone(phone);
        if (!/^[6-9]\d{9}$/.test(digits)) {
            errors.phone = 'Enter a valid 10-digit Indian mobile number';
        }
    }

    return errors;
}

export function GuestForm({
    initialValues,
    submitLabel = 'Continue to Payment',
}: GuestFormProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [phoneHint, setPhoneHint] = useState(false);

    async function handleSubmit(formData: FormData) {
        const validationErrors = validateForm(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setErrors({});
        await updateGuestDetails(formData);
    }

    return (
        <form ref={formRef} action={handleSubmit} className="space-y-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-2 md:p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 mb-2 md:mb-3">Primary Guest</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="firstName">First Name</Label>
                        <div className="relative">
                            <User className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <Input
                                id="firstName"
                                name="firstName"
                                required
                                placeholder="John"
                                defaultValue={initialValues?.firstName || ''}
                                className={`h-9 rounded-lg bg-white pl-9 text-sm ${errors.firstName ? 'border-red-400 focus-visible:ring-red-400' : 'border-gray-300'}`}
                            />
                        </div>
                        {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="lastName">Last Name</Label>
                        <div className="relative">
                            <User className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <Input
                                id="lastName"
                                name="lastName"
                                required
                                placeholder="Doe"
                                defaultValue={initialValues?.lastName || ''}
                                className={`h-9 rounded-lg bg-white pl-9 text-sm ${errors.lastName ? 'border-red-400 focus-visible:ring-red-400' : 'border-gray-300'}`}
                            />
                        </div>
                        {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-2 md:p-3">
                <div className="flex items-center justify-between gap-3 mb-2 md:mb-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Contact Details</p>
                    <span className="text-[11px] text-gray-500">Used for confirmation and invoice</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                            <Mail className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                required
                                placeholder="john@example.com"
                                defaultValue={initialValues?.email || ''}
                                className={`h-9 rounded-lg bg-white pl-9 text-sm ${errors.email ? 'border-red-400 focus-visible:ring-red-400' : 'border-gray-300'}`}
                            />
                        </div>
                        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="relative">
                            <Phone className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                required
                                placeholder="+91 98765 43210"
                                defaultValue={initialValues?.phone || ''}
                                className={`h-9 rounded-lg bg-white pl-9 text-sm ${errors.phone ? 'border-red-400 focus-visible:ring-red-400' : 'border-gray-300'}`}
                                onKeyDown={(e) => {
                                    const allowed = /^[0-9+\-\s]$/;
                                    const isNavKey = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key);
                                    if (!allowed.test(e.key) && !isNavKey) {
                                        e.preventDefault();
                                        setPhoneHint(true);
                                        setTimeout(() => setPhoneHint(false), 2000);
                                    }
                                }}
                            />
                        </div>
                        {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                        {phoneHint && !errors.phone && <p className="text-xs text-amber-600">Only numbers, +, and - are allowed</p>}
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-2 md:p-3">
                <Label htmlFor="address" className="inline-flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    Address <span className="text-gray-400 font-normal">(for invoice)</span>
                </Label>
                <Textarea
                    id="address"
                    name="address"
                    placeholder="House / Flat No., Street, City, State, PIN"
                    defaultValue={initialValues?.address || ''}
                    className="mt-1.5 min-h-[60px] rounded-lg border-gray-300 bg-white text-sm"
                />
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-2 md:p-3">
                <Label htmlFor="requests" className="inline-flex items-center gap-2 text-sm">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    Special Requests (Optional)
                </Label>
                <Textarea
                    id="requests"
                    name="requests"
                    placeholder="Any check-in preferences, celebration setup, or dietary requirements?"
                    defaultValue={initialValues?.requests || ''}
                    className="mt-1.5 min-h-[70px] rounded-lg border-gray-300 bg-white text-sm"
                />
                <p className="text-[11px] text-gray-500 mt-1.5">
                    Requests are subject to availability and confirmed at check-in.
                </p>
            </div>

            <SubmitButton submitLabel={submitLabel} />
        </form>
    );
}
