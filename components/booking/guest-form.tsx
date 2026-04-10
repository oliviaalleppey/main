'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateGuestDetails } from '@/app/book/actions';
import { Loader2, Mail, MapPin, MessageSquare, Phone, User } from 'lucide-react';
import { useFormStatus } from 'react-dom';

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

export function GuestForm({
    initialValues,
    submitLabel = 'Continue to Payment',
}: GuestFormProps) {
    return (
        <form action={updateGuestDetails} className="space-y-3">
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
                                className="h-9 rounded-lg border-gray-300 bg-white pl-9 text-sm"
                            />
                        </div>
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
                                className="h-9 rounded-lg border-gray-300 bg-white pl-9 text-sm"
                            />
                        </div>
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
                                className="h-9 rounded-lg border-gray-300 bg-white pl-9 text-sm"
                            />
                        </div>
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
                                className="h-9 rounded-lg border-gray-300 bg-white pl-9 text-sm"
                            />
                        </div>
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
