'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateGuestDetails } from '@/app/book/actions';
import { Loader2, Mail, MessageSquare, Phone, User } from 'lucide-react';
import { useFormStatus } from 'react-dom';

type GuestFormValues = {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
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
            className="w-full rounded-xl bg-[#0A332B] text-white py-4 md:py-6 text-sm md:text-base font-semibold shadow-lg shadow-[#0A332B]/20 hover:bg-[#15443B] transition-colors"
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
        <form action={updateGuestDetails} className="space-y-4 md:space-y-7">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 md:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 mb-3 md:mb-4">Primary Guest</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <div className="relative">
                            <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                                id="firstName"
                                name="firstName"
                                required
                                placeholder="John"
                                defaultValue={initialValues?.firstName || ''}
                                className="h-10 md:h-12 rounded-xl border-gray-300 bg-white pl-10"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <div className="relative">
                            <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                                id="lastName"
                                name="lastName"
                                required
                                placeholder="Doe"
                                defaultValue={initialValues?.lastName || ''}
                                className="h-10 md:h-12 rounded-xl border-gray-300 bg-white pl-10"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 md:p-5">
                <div className="flex items-center justify-between gap-3 mb-3 md:mb-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Contact Details</p>
                    <span className="text-[11px] text-gray-500">Used for confirmation and invoice</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                            <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                required
                                placeholder="john@example.com"
                                defaultValue={initialValues?.email || ''}
                                className="h-10 md:h-12 rounded-xl border-gray-300 bg-white pl-10"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="relative">
                            <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                required
                                placeholder="+91 98765 43210"
                                defaultValue={initialValues?.phone || ''}
                                className="h-10 md:h-12 rounded-xl border-gray-300 bg-white pl-10"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 md:p-5">
                <Label htmlFor="requests" className="inline-flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    Special Requests (Optional)
                </Label>
                <Textarea
                    id="requests"
                    name="requests"
                    placeholder="Any check-in preferences, celebration setup, or dietary requirements?"
                    defaultValue={initialValues?.requests || ''}
                    className="mt-2 min-h-[92px] md:min-h-[120px] rounded-xl border-gray-300 bg-white"
                />
                <p className="text-[11px] text-gray-500 mt-2">
                    Requests are subject to availability and confirmed at check-in.
                </p>
            </div>

            <SubmitButton submitLabel={submitLabel} />
        </form>
    );
}
