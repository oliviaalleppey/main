'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateGuestDetails } from '@/app/book/actions';
import { ChevronDown, Loader2, Mail, MapPin, MessageSquare, User } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { useRef, useState, useEffect } from 'react';

// ─── Country list ────────────────────────────────────────────────────────────
// Top countries for a Kerala resort listed first, then alphabetical rest
const COUNTRIES = [
    { code: 'IN', dial: '+91',  flag: '🇮🇳', name: 'India' },
    { code: 'DE', dial: '+49',  flag: '🇩🇪', name: 'Germany' },
    { code: 'GB', dial: '+44',  flag: '🇬🇧', name: 'United Kingdom' },
    { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE' },
    { code: 'US', dial: '+1',   flag: '🇺🇸', name: 'United States' },
    { code: 'AU', dial: '+61',  flag: '🇦🇺', name: 'Australia' },
    { code: 'FR', dial: '+33',  flag: '🇫🇷', name: 'France' },
    { code: 'IT', dial: '+39',  flag: '🇮🇹', name: 'Italy' },
    { code: 'CA', dial: '+1',   flag: '🇨🇦', name: 'Canada' },
    { code: 'SG', dial: '+65',  flag: '🇸🇬', name: 'Singapore' },
    { code: 'MY', dial: '+60',  flag: '🇲🇾', name: 'Malaysia' },
    { code: 'JP', dial: '+81',  flag: '🇯🇵', name: 'Japan' },
    { code: 'NL', dial: '+31',  flag: '🇳🇱', name: 'Netherlands' },
    { code: 'CH', dial: '+41',  flag: '🇨🇭', name: 'Switzerland' },
    { code: 'SE', dial: '+46',  flag: '🇸🇪', name: 'Sweden' },
    { code: 'NO', dial: '+47',  flag: '🇳🇴', name: 'Norway' },
    { code: 'DK', dial: '+45',  flag: '🇩🇰', name: 'Denmark' },
    { code: 'BE', dial: '+32',  flag: '🇧🇪', name: 'Belgium' },
    { code: 'ES', dial: '+34',  flag: '🇪🇸', name: 'Spain' },
    { code: 'PT', dial: '+351', flag: '🇵🇹', name: 'Portugal' },
    { code: 'AT', dial: '+43',  flag: '🇦🇹', name: 'Austria' },
    { code: 'NZ', dial: '+64',  flag: '🇳🇿', name: 'New Zealand' },
    { code: 'ZA', dial: '+27',  flag: '🇿🇦', name: 'South Africa' },
    { code: 'RU', dial: '+7',   flag: '🇷🇺', name: 'Russia' },
    { code: 'CN', dial: '+86',  flag: '🇨🇳', name: 'China' },
    { code: 'KR', dial: '+82',  flag: '🇰🇷', name: 'South Korea' },
    { code: 'BD', dial: '+880', flag: '🇧🇩', name: 'Bangladesh' },
    { code: 'LK', dial: '+94',  flag: '🇱🇰', name: 'Sri Lanka' },
    { code: 'NP', dial: '+977', flag: '🇳🇵', name: 'Nepal' },
    { code: 'PK', dial: '+92',  flag: '🇵🇰', name: 'Pakistan' },
    { code: 'MV', dial: '+960', flag: '🇲🇻', name: 'Maldives' },
    { code: 'BH', dial: '+973', flag: '🇧🇭', name: 'Bahrain' },
    { code: 'KW', dial: '+965', flag: '🇰🇼', name: 'Kuwait' },
    { code: 'QA', dial: '+974', flag: '🇶🇦', name: 'Qatar' },
    { code: 'SA', dial: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
    { code: 'OM', dial: '+968', flag: '🇴🇲', name: 'Oman' },
    { code: 'IL', dial: '+972', flag: '🇮🇱', name: 'Israel' },
    { code: 'TR', dial: '+90',  flag: '🇹🇷', name: 'Turkey' },
    { code: 'EG', dial: '+20',  flag: '🇪🇬', name: 'Egypt' },
    { code: 'NG', dial: '+234', flag: '🇳🇬', name: 'Nigeria' },
    { code: 'GH', dial: '+233', flag: '🇬🇭', name: 'Ghana' },
    { code: 'KE', dial: '+254', flag: '🇰🇪', name: 'Kenya' },
    { code: 'MX', dial: '+52',  flag: '🇲🇽', name: 'Mexico' },
    { code: 'BR', dial: '+55',  flag: '🇧🇷', name: 'Brazil' },
    { code: 'AR', dial: '+54',  flag: '🇦🇷', name: 'Argentina' },
    { code: 'PH', dial: '+63',  flag: '🇵🇭', name: 'Philippines' },
    { code: 'ID', dial: '+62',  flag: '🇮🇩', name: 'Indonesia' },
    { code: 'TH', dial: '+66',  flag: '🇹🇭', name: 'Thailand' },
    { code: 'VN', dial: '+84',  flag: '🇻🇳', name: 'Vietnam' },
];

// ─── Types ───────────────────────────────────────────────────────────────────
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

// ─── Submit button ───────────────────────────────────────────────────────────
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

// ─── Validation ──────────────────────────────────────────────────────────────
function validateForm(data: FormData): Record<string, string> {
    const errors: Record<string, string> = {};

    const firstName = (data.get('firstName') as string || '').trim();
    const lastName  = (data.get('lastName')  as string || '').trim();
    const email     = (data.get('email')     as string || '').trim();
    const phone     = (data.get('phone')     as string || '').trim();

    if (!firstName) errors.firstName = 'First name is required';
    if (!lastName)  errors.lastName  = 'Last name is required';

    if (!email) {
        errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        errors.email = 'Enter a valid email address';
    }

    if (!phone) {
        errors.phone = 'Phone number is required';
    } else {
        // phone field will hold the full number e.g. "+49 151 23456789"
        // strip everything except digits and leading +
        const clean = phone.replace(/[\s\-().]/g, '');
        if (!/^\+\d{7,15}$/.test(clean)) {
            errors.phone = 'Enter a valid phone number';
        }
    }

    return errors;
}

// ─── Parse existing phone into dial + local ───────────────────────────────────
function parseInitialPhone(raw?: string): { dial: string; local: string } {
    if (!raw) return { dial: '+91', local: '' };
    const clean = raw.trim();
    // Try to match a known dial code
    for (const c of COUNTRIES) {
        if (clean.startsWith(c.dial)) {
            return { dial: c.dial, local: clean.slice(c.dial.length).replace(/^\s+/, '') };
        }
    }
    return { dial: '+91', local: clean };
}

// ─── Main component ───────────────────────────────────────────────────────────
export function GuestForm({
    initialValues,
    submitLabel = 'Save & Continue',
}: GuestFormProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const parsed = parseInitialPhone(initialValues?.phone);
    const [dialCode, setDialCode] = useState(parsed.dial);
    const [localNumber, setLocalNumber] = useState(parsed.local);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const filteredCountries = COUNTRIES.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.dial.includes(searchQuery)
    );

    // Hidden field value — full combined number
    const fullPhone = `${dialCode} ${localNumber}`.trim();

    async function handleSubmit(formData: FormData) {
        // Inject the combined phone so validateForm sees it
        formData.set('phone', fullPhone);
        const validationErrors = validateForm(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setErrors({});
        await updateGuestDetails(formData);
    }

    const selectedCountry = COUNTRIES.find(c => c.dial === dialCode) ?? COUNTRIES[0];

    return (
        <form ref={formRef} action={handleSubmit} className="space-y-3">
            {/* ── Primary Guest ── */}
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

            {/* ── Contact Details ── */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-2 md:p-3">
                <div className="flex items-center justify-between gap-3 mb-2 md:mb-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Contact Details</p>
                    <span className="text-[11px] text-gray-500">Used for confirmation and invoice</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                    {/* Email */}
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

                    {/* Phone with country code selector */}
                    <div className="space-y-1.5">
                        <Label htmlFor="phoneLocal">Phone Number</Label>
                        {/* Hidden field carries the full combined value */}
                        <input type="hidden" name="phone" value={fullPhone} />
                        <div className={`flex h-9 rounded-lg bg-white border ${errors.phone ? 'border-red-400' : 'border-gray-300'}`}>
                            {/* Custom Country Code Selector */}
                            <div className="relative flex-shrink-0" ref={dropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsDropdownOpen(!isDropdownOpen);
                                        setSearchQuery(''); // Reset search when opening
                                    }}
                                    className="flex items-center h-full bg-gray-50 border-r border-gray-300 pl-3 pr-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors rounded-l-lg"
                                >
                                    <span>{selectedCountry.flag} {selectedCountry.dial}</span>
                                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1.5" />
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-1 w-[280px] bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                                        <div className="p-2 border-b border-gray-100 bg-gray-50">
                                            <input
                                                type="text"
                                                autoFocus
                                                placeholder="Search country or code..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full h-8 px-3 text-sm rounded-md border border-gray-300 focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]"
                                            />
                                        </div>
                                        <div className="max-h-64 overflow-y-auto">
                                            {filteredCountries.length > 0 ? (
                                                filteredCountries.map(c => (
                                                    <button
                                                        key={c.code}
                                                        type="button"
                                                        onClick={() => {
                                                            setDialCode(c.dial);
                                                            setIsDropdownOpen(false);
                                                        }}
                                                        className={`w-full flex items-center px-3 py-2.5 text-left hover:bg-gray-50 transition-colors ${dialCode === c.dial ? 'bg-gray-50 font-medium' : ''}`}
                                                    >
                                                        <span className="mr-3 text-lg">{c.flag}</span>
                                                        <span className="flex-1 text-sm text-gray-700">{c.name}</span>
                                                        <span className="text-sm text-gray-400">{c.dial}</span>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center text-sm text-gray-500">
                                                    No countries found
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Local number input */}
                            <input
                                id="phoneLocal"
                                type="tel"
                                inputMode="numeric"
                                placeholder={selectedCountry.code === 'IN' ? '98765 43210' : '151 23456789'}
                                value={localNumber}
                                onChange={e => setLocalNumber(e.target.value.replace(/[^\d\s\-]/g, ''))}
                                className="flex-1 min-w-0 px-2.5 text-sm bg-white focus:outline-none focus:ring-0 rounded-r-lg"
                            />
                        </div>
                        {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                    </div>
                </div>
            </div>

            {/* ── Address ── */}
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

            {/* ── Special Requests ── */}
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
