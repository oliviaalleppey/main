'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { submitMembershipApplication } from '@/app/membership/actions';
import { toast } from 'sonner';

const membershipSchema = z.object({
  fullName: z.string().min(1, 'Full Name is required'),
  dateOfBirth: z.string().min(1, 'Date of Birth is required'),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  memberPhotographUrl: z.string().optional(),

  mobileNumber: z.string().min(1, 'Mobile Number is required'),
  emailAddress: z.string().email('Invalid email address'),
  alternateContactNumber: z.string().optional(),

  residentialAddress: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  pinCode: z.string().min(1, 'PIN Code is required'),

  idType: z.string().min(1, 'ID Type is required'),
  idNumber: z.string().min(1, 'ID Number is required'),

  preferredModeOfCommunication: z.string().optional(),

  emergencyName: z.string().min(1, 'Contact Name is required'),
  emergencyRelationship: z.string().min(1, 'Relationship is required'),
  emergencyContactNumber: z.string().min(1, 'Contact Number is required'),

  // Honeypot — must stay empty; bots fill this, humans never see it
  website: z.string().max(0).optional(),

  // Terms acceptance
  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions to proceed',
  }),
});

type FormData = z.infer<typeof membershipSchema>;

interface MembershipEnrollmentFormProps {
  isOpen: boolean;
  onClose: () => void;
}

// Small helper for the red asterisk on required fields
function Req() {
  return <span className="text-red-500 ml-0.5">*</span>;
}

const COUNTRY_CODES = [
  { code: '+91',  flag: '🇮🇳', label: 'IN' },
  { code: '+1',   flag: '🇺🇸', label: 'US/CA' },
  { code: '+44',  flag: '🇬🇧', label: 'UK' },
  { code: '+971', flag: '🇦🇪', label: 'UAE' },
  { code: '+61',  flag: '🇦🇺', label: 'AU' },
  { code: '+65',  flag: '🇸🇬', label: 'SG' },
  { code: '+60',  flag: '🇲🇾', label: 'MY' },
  { code: '+49',  flag: '🇩🇪', label: 'DE' },
  { code: '+33',  flag: '🇫🇷', label: 'FR' },
  { code: '+81',  flag: '🇯🇵', label: 'JP' },
  { code: '+82',  flag: '🇰🇷', label: 'KR' },
  { code: '+86',  flag: '🇨🇳', label: 'CN' },
  { code: '+966', flag: '🇸🇦', label: 'SA' },
  { code: '+27',  flag: '🇿🇦', label: 'ZA' },
];

export function MembershipEnrollmentForm({ isOpen, onClose }: MembershipEnrollmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileCountryCode, setMobileCountryCode] = useState('+91');

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(membershipSchema),
    defaultValues: { termsAccepted: false },
  });

  const photoUrl = watch('memberPhotographUrl');
  const termsAccepted = watch('termsAccepted');

  const onSubmit = async (data: FormData) => {
    // Honeypot check — silently discard bot submissions
    if (data.website) return;

    setIsSubmitting(true);
    try {
      // Prepend country code to mobile number
      const result = await submitMembershipApplication({
        ...data,
        mobileNumber: `${mobileCountryCode} ${data.mobileNumber}`.trim(),
      });
      if (result.success) {
        setIsSuccess(true);
        toast.success("Application submitted successfully!");
      } else {
        toast.error(result.error || "Something went wrong.");
      }
    } catch (error) {
      toast.error("Failed to submit application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div key="membership-modal" className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-4xl bg-white border border-[#E8E0D5] rounded-2xl shadow-2xl shadow-black/20 overflow-hidden my-auto max-h-[90vh] flex flex-col"
          >
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-8 py-6 border-b border-[#E8E0D5] bg-[#FAF6EF]">
            <div>
              <h2 className="text-2xl font-serif text-[#C9A84C] uppercase tracking-widest">
                Membership Enrollment
              </h2>
              <p className="text-[#6B7280] text-sm mt-1 font-light tracking-wide">
                Join the Olivia Lifestyle. Please complete the form below. <span className="text-red-500">*</span> Required
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#6B7280] hover:text-[#0D4A4A] bg-[#0D4A4A]/5 hover:bg-[#0D4A4A]/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar bg-white">
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-[#C9A84C]/10 flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10 text-[#C9A84C]" />
                </div>
                <h3 className="text-3xl font-serif text-[#0D4A4A] mb-4">Application Received</h3>
                <p className="text-[#6B7280] max-w-md mx-auto leading-relaxed">
                  Thank you for applying for the Olivia Lifestyle Membership. Our team is reviewing your application and will be in touch shortly.
                </p>
                <Button
                  onClick={onClose}
                  className="mt-8 bg-[#C9A84C] text-[#0D4A4A] hover:bg-[#A8863A] hover:text-white uppercase tracking-widest text-xs px-8 rounded-full"
                >
                  Close Window
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">

                {/* Honeypot — visually hidden, never shown to real users */}
                <div className="absolute -top-[9999px] -left-[9999px] opacity-0 pointer-events-none" aria-hidden="true" tabIndex={-1}>
                  <label htmlFor="website">Leave this empty</label>
                  <input id="website" type="text" {...register('website')} tabIndex={-1} autoComplete="off" />
                </div>

                {/* 1. Personal Details */}
                <section>
                  <h3 className="text-sm font-bold tracking-[0.2em] text-[#C9A84C] uppercase mb-6 flex items-center gap-4">
                    1. Personal Details
                    <div className="h-px flex-1 bg-[#E8E0D5]"></div>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[#6B7280]">Full Name <Req /></Label>
                      <Input {...register('fullName')} className="bg-white border-[#E8E0D5] text-[#1C1C1C] focus:border-[#C9A84C]" placeholder="John Doe" />
                      {errors.fullName && <span className="text-red-500 text-xs">{errors.fullName.message}</span>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#6B7280]">Date of Birth <Req /></Label>
                      <Input type="date" {...register('dateOfBirth')} className="bg-white border-[#E8E0D5] text-[#1C1C1C] focus:border-[#C9A84C]" />
                      {errors.dateOfBirth && <span className="text-red-500 text-xs">{errors.dateOfBirth.message}</span>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#6B7280]">Gender</Label>
                      <Select onValueChange={(v) => setValue('gender', v)}>
                        <SelectTrigger className="bg-white border-[#E8E0D5] text-[#1C1C1C] focus:border-[#C9A84C]">
                          <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#E8E0D5] text-[#1C1C1C] z-[300]">
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#6B7280]">Nationality</Label>
                      <Select onValueChange={(v) => setValue('nationality', v)}>
                        <SelectTrigger className="bg-white border-[#E8E0D5] text-[#1C1C1C] focus:border-[#C9A84C]">
                          <SelectValue placeholder="Select Country" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#E8E0D5] text-[#1C1C1C] z-[300]">
                          <SelectItem value="Indian">Indian</SelectItem>
                          <SelectItem value="American">American</SelectItem>
                          <SelectItem value="British">British</SelectItem>
                          <SelectItem value="Australian">Australian</SelectItem>
                          <SelectItem value="Canadian">Canadian</SelectItem>
                          <SelectItem value="Chinese">Chinese</SelectItem>
                          <SelectItem value="French">French</SelectItem>
                          <SelectItem value="German">German</SelectItem>
                          <SelectItem value="Japanese">Japanese</SelectItem>
                          <SelectItem value="Russian">Russian</SelectItem>
                          <SelectItem value="Saudi Arabian">Saudi Arabian</SelectItem>
                          <SelectItem value="Singaporean">Singaporean</SelectItem>
                          <SelectItem value="South African">South African</SelectItem>
                          <SelectItem value="South Korean">South Korean</SelectItem>
                          <SelectItem value="UAE">UAE</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2 space-y-2 mt-4">
                      <Label className="text-[#6B7280]">
                        Passport / ID Photograph
                        <span className="ml-2 text-xs text-[#6B7280]/70 font-normal normal-case tracking-normal">
                          (Clear photo of your passport or government-issued ID)
                        </span>
                      </Label>
                      <div className="bg-[#FAF6EF] p-4 rounded-xl border border-[#E8E0D5]">
                        <ImageUpload
                          value={photoUrl ? [photoUrl] : []}
                          onChange={(urls) => setValue('memberPhotographUrl', urls[urls.length - 1] || '')}
                          onRemove={() => setValue('memberPhotographUrl', '')}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. Contact Information */}
                <section>
                  <h3 className="text-sm font-bold tracking-[0.2em] text-[#C9A84C] uppercase mb-6 flex items-center gap-4">
                    2. Contact Information
                    <div className="h-px flex-1 bg-[#E8E0D5]"></div>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[#6B7280]">Mobile Number <Req /></Label>
                      <div className="flex gap-2">
                        <Select value={mobileCountryCode} onValueChange={setMobileCountryCode}>
                          <SelectTrigger className="w-[105px] flex-shrink-0 bg-white border-[#E8E0D5] text-[#1C1C1C] focus:border-[#C9A84C]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-[#E8E0D5] text-[#1C1C1C] z-[300]">
                            {COUNTRY_CODES.map(c => (
                              <SelectItem key={c.code} value={c.code}>
                                {c.flag} {c.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input {...register('mobileNumber')} className="bg-white border-[#E8E0D5] text-[#1C1C1C] focus:border-[#C9A84C]" placeholder="9876543210" />
                      </div>
                      {errors.mobileNumber && <span className="text-red-500 text-xs">{errors.mobileNumber.message}</span>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#6B7280]">Email Address <Req /></Label>
                      <Input type="email" {...register('emailAddress')} className="bg-white border-[#E8E0D5] text-[#1C1C1C] focus:border-[#C9A84C]" placeholder="email@example.com" />
                      {errors.emailAddress && <span className="text-red-500 text-xs">{errors.emailAddress.message}</span>}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-[#6B7280]">Alternate Contact Number</Label>
                      <Input {...register('alternateContactNumber')} className="bg-white border-[#E8E0D5] text-[#1C1C1C] focus:border-[#C9A84C]" />
                    </div>
                  </div>
                </section>

                {/* 3. Address Details */}
                <section>
                  <h3 className="text-sm font-bold tracking-[0.2em] text-[#C9A84C] uppercase mb-6 flex items-center gap-4">
                    3. Address Details
                    <div className="h-px flex-1 bg-[#E8E0D5]"></div>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-[#6B7280]">Residential Address <Req /></Label>
                      <Input {...register('residentialAddress')} className="bg-white border-[#E8E0D5] text-[#1C1C1C] focus:border-[#C9A84C]" />
                      {errors.residentialAddress && <span className="text-red-500 text-xs">{errors.residentialAddress.message}</span>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#6B7280]">City <Req /></Label>
                      <Input {...register('city')} className="bg-white border-[#E8E0D5] text-[#1C1C1C] focus:border-[#C9A84C]" />
                      {errors.city && <span className="text-red-500 text-xs">{errors.city.message}</span>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#6B7280]">State <Req /></Label>
                      <Input {...register('state')} className="bg-white border-[#E8E0D5] text-[#1C1C1C] focus:border-[#C9A84C]" />
                      {errors.state && <span className="text-red-500 text-xs">{errors.state.message}</span>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#6B7280]">Country <Req /></Label>
                      <Input {...register('country')} className="bg-white border-[#E8E0D5] text-[#1C1C1C] focus:border-[#C9A84C]" />
                      {errors.country && <span className="text-red-500 text-xs">{errors.country.message}</span>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#6B7280]">PIN Code <Req /></Label>
                      <Input {...register('pinCode')} className="bg-white border-[#E8E0D5] text-[#1C1C1C] focus:border-[#C9A84C]" />
                      {errors.pinCode && <span className="text-red-500 text-xs">{errors.pinCode.message}</span>}
                    </div>
                  </div>
                </section>

                {/* 4. Identification Details */}
                <section>
                  <h3 className="text-sm font-bold tracking-[0.2em] text-[#C9A84C] uppercase mb-6 flex items-center gap-4">
                    4. Identification Details
                    <div className="h-px flex-1 bg-[#E8E0D5]"></div>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[#6B7280]">ID Type <Req /></Label>
                      <Select onValueChange={(v) => setValue('idType', v)}>
                        <SelectTrigger className="bg-white border-[#E8E0D5] text-[#1C1C1C] focus:border-[#C9A84C]">
                          <SelectValue placeholder="Select ID Type" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#E8E0D5] text-[#1C1C1C] z-[300]">
                          <SelectItem value="Aadhaar">Aadhaar</SelectItem>
                          <SelectItem value="Passport">Passport</SelectItem>
                          <SelectItem value="Driving License">Driving License</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.idType && <span className="text-red-500 text-xs">{errors.idType.message}</span>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#6B7280]">ID Number <Req /></Label>
                      <Input {...register('idNumber')} className="bg-white border-[#E8E0D5] text-[#1C1C1C] focus:border-[#C9A84C]" />
                      {errors.idNumber && <span className="text-red-500 text-xs">{errors.idNumber.message}</span>}
                    </div>
                  </div>
                </section>

                {/* 5. Communication & Emergency */}
                <section>
                  <h3 className="text-sm font-bold tracking-[0.2em] text-[#C9A84C] uppercase mb-6 flex items-center gap-4">
                    5. Communication & Emergency
                    <div className="h-px flex-1 bg-[#E8E0D5]"></div>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-[#6B7280]">Preferred Mode of Communication</Label>
                      <Select onValueChange={(v) => setValue('preferredModeOfCommunication', v)}>
                        <SelectTrigger className="bg-white border-[#E8E0D5] text-[#1C1C1C] focus:border-[#C9A84C]">
                          <SelectValue placeholder="Select Preference" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#E8E0D5] text-[#1C1C1C] z-[300]">
                          <SelectItem value="Phone">Phone</SelectItem>
                          <SelectItem value="Email">Email</SelectItem>
                          <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#6B7280]">Emergency Contact Name <Req /></Label>
                      <Input {...register('emergencyName')} className="bg-white border-[#E8E0D5] text-[#1C1C1C] focus:border-[#C9A84C]" />
                      {errors.emergencyName && <span className="text-red-500 text-xs">{errors.emergencyName.message}</span>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#6B7280]">Relationship <Req /></Label>
                      <Input {...register('emergencyRelationship')} className="bg-white border-[#E8E0D5] text-[#1C1C1C] focus:border-[#C9A84C]" />
                      {errors.emergencyRelationship && <span className="text-red-500 text-xs">{errors.emergencyRelationship.message}</span>}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-[#6B7280]">Emergency Contact Number <Req /></Label>
                      <Input {...register('emergencyContactNumber')} className="bg-white border-[#E8E0D5] text-[#1C1C1C] focus:border-[#C9A84C]" />
                      {errors.emergencyContactNumber && <span className="text-red-500 text-xs">{errors.emergencyContactNumber.message}</span>}
                    </div>
                  </div>
                </section>

                {/* 6. Declaration */}
                <section className="bg-[#FAF6EF] p-6 rounded-xl border border-[#E8E0D5]">
                  <h3 className="text-sm font-bold tracking-[0.2em] text-[#C9A84C] uppercase mb-4">
                    Declaration
                  </h3>
                  <p className="text-[#6B7280] text-sm leading-relaxed mb-5">
                    I hereby declare that the information provided above is true and correct. I agree to abide by the terms and conditions of membership at Olivia Alleppey.
                  </p>

                  {/* Terms & Conditions checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer group mb-6">
                    <div className="relative mt-0.5 flex-shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        {...register('termsAccepted')}
                        onChange={(e) => setValue('termsAccepted', e.target.checked, { shouldValidate: true })}
                      />
                      <div className="w-5 h-5 rounded border-2 border-[#E8E0D5] bg-white peer-checked:bg-[#C9A84C] peer-checked:border-[#C9A84C] transition-colors flex items-center justify-center">
                        {termsAccepted && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-[#6B7280] leading-snug group-hover:text-[#1C1C1C] transition-colors">
                      I have read and agree to the{' '}
                      <a href="/membership#terms" target="_blank" className="text-[#C9A84C] underline underline-offset-2 hover:text-[#A8863A]">
                        Terms & Conditions
                      </a>{' '}
                      of the Olivia Lifestyle Membership. <Req />
                    </span>
                  </label>
                  {errors.termsAccepted && (
                    <p className="text-red-500 text-xs mb-4 -mt-4">{errors.termsAccepted.message}</p>
                  )}

                  <div className="flex justify-end gap-4">
                    <Button
                      type="button"
                      onClick={onClose}
                      variant="outline"
                      className="border-[#E8E0D5] text-[#6B7280] hover:bg-[#FAF6EF] uppercase tracking-widest text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#C9A84C] text-[#0D4A4A] hover:bg-[#A8863A] hover:text-white uppercase tracking-widest text-xs px-8"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Submit Application
                    </Button>
                  </div>
                </section>

              </form>
            )}
          </div>
          </motion.div>
        </div>
      )}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #FAF6EF;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E8E0D5;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #C9A84C;
        }
      `}</style>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
