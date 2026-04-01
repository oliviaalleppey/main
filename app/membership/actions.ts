'use server';

import { db } from '@/lib/db';
import { membershipApplications } from '@/lib/db/schema';
import { sendMembershipApplicationAcknowledgment, sendMembershipApplicationToAdmins } from '@/lib/services/email';
import { z } from 'zod';
import { format } from 'date-fns';

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

  emergencyName: z.string().min(1, 'Emergency Contact Name is required'),
  emergencyRelationship: z.string().min(1, 'Relationship is required'),
  emergencyContactNumber: z.string().min(1, 'Emergency Contact Number is required'),
});

export type MembershipFormData = z.infer<typeof membershipSchema>;

export async function submitMembershipApplication(data: MembershipFormData) {
  try {
    const validatedData = membershipSchema.parse(data);

    // Save to database
    await db.insert(membershipApplications).values({
      fullName: validatedData.fullName,
      dateOfBirth: validatedData.dateOfBirth,
      gender: validatedData.gender,
      nationality: validatedData.nationality,
      memberPhotographUrl: validatedData.memberPhotographUrl,
      
      mobileNumber: validatedData.mobileNumber,
      emailAddress: validatedData.emailAddress,
      alternateContactNumber: validatedData.alternateContactNumber,
      
      residentialAddress: validatedData.residentialAddress,
      city: validatedData.city,
      state: validatedData.state,
      country: validatedData.country,
      pinCode: validatedData.pinCode,
      
      idType: validatedData.idType,
      idNumber: validatedData.idNumber,
      
      preferredModeOfCommunication: validatedData.preferredModeOfCommunication,
      
      emergencyName: validatedData.emergencyName,
      emergencyRelationship: validatedData.emergencyRelationship,
      emergencyContactNumber: validatedData.emergencyContactNumber,
    });

    // Send emails
    const dobFormatted = format(new Date(validatedData.dateOfBirth), 'dd MMM yyyy');

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
        city: validatedData.city,
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
