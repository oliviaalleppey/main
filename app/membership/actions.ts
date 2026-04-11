'use server';

import { db } from '@/lib/db';
import { membershipApplications } from '@/lib/db/schema';
import { sendMembershipApplicationAcknowledgment, sendMembershipApplicationToAdmins } from '@/lib/services/email';
import { z } from 'zod';
import { format } from 'date-fns';

const membershipSchema = z.object({
  fullName: z.string().min(1, 'Full Name is required'),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  memberPhotographUrl: z.string().optional(),

  mobileNumber: z.string().min(1, 'Mobile Number is required'),
  emailAddress: z.string().email('Invalid email address'),
  alternateContactNumber: z.string().optional(),

  residentialAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pinCode: z.string().optional(),

  idType: z.string().optional(),
  idNumber: z.string().optional(),

  preferredModeOfCommunication: z.string().optional(),

  emergencyName: z.string().optional(),
  emergencyRelationship: z.string().optional(),
  emergencyContactNumber: z.string().optional(),
});

export type MembershipFormData = z.infer<typeof membershipSchema>;

export async function submitMembershipApplication(data: MembershipFormData) {
  try {
    const validatedData = membershipSchema.parse(data);

    // Save to database
    // Fields marked notNull in schema receive empty string defaults when not collected by the simplified form
    await db.insert(membershipApplications).values({
      fullName: validatedData.fullName,
      dateOfBirth: validatedData.dateOfBirth || '1900-01-01',
      gender: validatedData.gender,
      nationality: validatedData.nationality,
      memberPhotographUrl: validatedData.memberPhotographUrl,

      mobileNumber: validatedData.mobileNumber,
      emailAddress: validatedData.emailAddress,
      alternateContactNumber: validatedData.alternateContactNumber,

      residentialAddress: validatedData.residentialAddress || '',
      city: validatedData.city || '',
      state: validatedData.state || '',
      country: validatedData.country || '',
      pinCode: validatedData.pinCode || '',

      idType: validatedData.idType || '',
      idNumber: validatedData.idNumber || '',

      preferredModeOfCommunication: validatedData.preferredModeOfCommunication,

      emergencyName: validatedData.emergencyName || '',
      emergencyRelationship: validatedData.emergencyRelationship || '',
      emergencyContactNumber: validatedData.emergencyContactNumber || '',
    });

    // Send emails
    const dobFormatted = validatedData.dateOfBirth ? format(new Date(validatedData.dateOfBirth), 'dd MMM yyyy') : '';

    await Promise.allSettled([
      sendMembershipApplicationAcknowledgment({
        to: validatedData.emailAddress,
        name: validatedData.fullName,
      }),
      sendMembershipApplicationToAdmins({
        name: validatedData.fullName,
        email: validatedData.emailAddress,
        phone: validatedData.mobileNumber,
        dob: dobFormatted,
        city: validatedData.city || '',
      })
    ]);

    return { success: true };
  } catch (error) {
    console.error('Membership submission error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation failed', details: error.issues };
    }
    return { success: false, error: 'Failed to submit application. Please try again.' };
  }
}
