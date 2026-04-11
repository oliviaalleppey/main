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
        className={`inline-flex items-center justify-center gap-2 transition-all group ${className}`}
      >
        Enroll Now
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </button>

      <MembershipEnrollmentForm 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}
