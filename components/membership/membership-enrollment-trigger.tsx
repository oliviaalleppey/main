'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { MembershipEnrollmentForm } from './membership-enrollment-form';

interface MembershipEnrollmentTriggerProps {
  className?: string;
}

export function MembershipEnrollmentTrigger({ className }: MembershipEnrollmentTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center justify-center gap-1.5 rounded-full font-bold uppercase tracking-widest text-[13px] transition-all group scale-100 hover:scale-105 active:scale-95 shadow-xl ${className}`}
      >
        Enroll Now
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>

      <MembershipEnrollmentForm 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}
