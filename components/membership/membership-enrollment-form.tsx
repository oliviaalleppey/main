'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { submitMembershipApplication } from '@/app/membership/actions';

interface MembershipEnrollmentFormProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MembershipEnrollmentForm({ isOpen, onClose }: MembershipEnrollmentFormProps) {
    const [mounted, setMounted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const [fullName, setFullName] = useState('');
    const [emailAddress, setEmailAddress] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [city, setCity] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFullName('');
            setEmailAddress('');
            setMobileNumber('');
            setCity('');
            setDateOfBirth('');
            setTermsAccepted(false);
            setError('');
            setIsSuccess(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate
        if (!fullName.trim()) { setError('Please enter your full name.'); return; }
        if (!emailAddress.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailAddress)) { setError('Please enter a valid email address.'); return; }
        if (!mobileNumber.trim() || mobileNumber.trim().length < 6) { setError('Please enter a valid mobile number.'); return; }
        if (!termsAccepted) { setError('Please accept the Terms & Conditions to proceed.'); return; }

        setIsSubmitting(true);
        try {
            const result = await submitMembershipApplication({
                fullName: fullName.trim(),
                emailAddress: emailAddress.trim(),
                mobileNumber: mobileNumber.trim(),
                city: city.trim() || undefined,
                dateOfBirth: dateOfBirth || undefined,
            });

            if (result.success) {
                setIsSuccess(true);
            } else {
                setError(result.error || 'Something went wrong. Please try again.');
            }
        } catch {
            setError('Failed to submit. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!mounted) return null;

    const content = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-[#1C2822]/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: 16 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="relative w-full max-w-lg bg-[#FDFAF5] border border-[#E8DDCC] shadow-2xl shadow-[#BCA06F]/10"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between px-8 pt-8 pb-6 border-b border-[#EEE5D6]">
                            <div>
                                <span className="text-[#BCA06F] text-[10px] tracking-[0.35em] uppercase block mb-2">Olivia International</span>
                                <h2 className="font-serif text-2xl text-[#1C3A2A]">Lifestyle Membership</h2>
                                <p className="text-[#7A6F5E] text-sm mt-1 font-light">A few details and you're in.</p>
                            </div>
                            <button onClick={onClose} className="p-1.5 text-[#9A8F80] hover:text-[#1C3A2A] transition-colors mt-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="px-8 py-7">
                            {isSuccess ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center py-10">
                                    <div className="w-16 h-16 rounded-full bg-[#BCA06F]/10 flex items-center justify-center mb-5">
                                        <CheckCircle2 className="w-8 h-8 text-[#BCA06F]" />
                                    </div>
                                    <h3 className="font-serif text-2xl text-[#1C3A2A] mb-3">Application Received</h3>
                                    <p className="text-[#7A6F5E] text-sm leading-relaxed max-w-xs">
                                        Thank you for applying. Our team will review your application and be in touch shortly. A confirmation has been sent to your email.
                                    </p>
                                    <button onClick={onClose} className="mt-8 border border-[#BCA06F] text-[#BCA06F] px-8 py-2.5 text-xs tracking-[0.2em] uppercase hover:bg-[#BCA06F] hover:text-white transition-colors">
                                        Close
                                    </button>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                                    <div className="space-y-1.5">
                                        <label className="text-[#5D5450] text-xs tracking-[0.1em] uppercase block">
                                            Full Name <span className="text-[#BCA06F]">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Your full name"
                                            className="w-full h-11 px-3 bg-white border border-[#E4D9C8] text-[#1C1C1C] text-sm focus:outline-none focus:border-[#BCA06F] transition-colors"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[#5D5450] text-xs tracking-[0.1em] uppercase block">
                                            Email Address <span className="text-[#BCA06F]">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={emailAddress}
                                            onChange={(e) => setEmailAddress(e.target.value)}
                                            placeholder="your@email.com"
                                            className="w-full h-11 px-3 bg-white border border-[#E4D9C8] text-[#1C1C1C] text-sm focus:outline-none focus:border-[#BCA06F] transition-colors"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[#5D5450] text-xs tracking-[0.1em] uppercase block">
                                            Mobile Number <span className="text-[#BCA06F]">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            value={mobileNumber}
                                            onChange={(e) => setMobileNumber(e.target.value)}
                                            placeholder="+91 98765 43210"
                                            className="w-full h-11 px-3 bg-white border border-[#E4D9C8] text-[#1C1C1C] text-sm focus:outline-none focus:border-[#BCA06F] transition-colors"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[#5D5450] text-xs tracking-[0.1em] uppercase block">City</label>
                                            <input
                                                type="text"
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                placeholder="Your city"
                                                className="w-full h-11 px-3 bg-white border border-[#E4D9C8] text-[#1C1C1C] text-sm focus:outline-none focus:border-[#BCA06F] transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[#5D5450] text-xs tracking-[0.1em] uppercase block">Date of Birth</label>
                                            <input
                                                type="date"
                                                value={dateOfBirth}
                                                onChange={(e) => setDateOfBirth(e.target.value)}
                                                className="w-full h-11 px-3 bg-white border border-[#E4D9C8] text-[#1C1C1C] text-sm focus:outline-none focus:border-[#BCA06F] transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-1">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={termsAccepted}
                                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                                className="mt-0.5 w-4 h-4 accent-[#BCA06F] flex-shrink-0 cursor-pointer"
                                            />
                                            <span className="text-xs text-[#7A6F5E] leading-relaxed">
                                                I agree to the{' '}
                                                <a href="#terms" target="_blank" className="text-[#BCA06F] underline underline-offset-2 hover:text-[#A8893A]">
                                                    Terms &amp; Conditions
                                                </a>{' '}
                                                of the Olivia Lifestyle Membership.
                                            </span>
                                        </label>
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3">
                                            {error}
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-1">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="flex-1 border border-[#E4D9C8] text-[#7A6F5E] py-3 text-xs tracking-[0.15em] uppercase hover:bg-[#F5EDE0] transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-1 bg-[#BCA06F] text-white py-3 text-xs tracking-[0.15em] uppercase hover:bg-[#A8893A] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                                        >
                                            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                            Submit Application
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(content, document.body);
}
