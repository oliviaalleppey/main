'use server';

import { db } from '@/lib/db';
import { membershipApplications } from '@/lib/db/schema';
import { sendMembershipApplicationAcknowledgment, sendMembershipApplicationToAdmins } from '@/lib/services/email';
import { z } from 'zod';
import { membershipSchema, type MembershipFormData } from '@/lib/validations/membership';
import { format } from 'date-fns';
import { headers } from 'next/headers';
import { RateLimiter } from '@/lib/rate-limit';

/**
 * Each submission emails an acknowledgement to whatever address was typed, from
 * the hotel's own domain. Unlimited, the form was a way to send hotel-branded
 * mail to anyone, which is also how a domain's deliverability gets ruined.
 */
const SUBMISSIONS_PER_HOUR = 3;


export async function submitMembershipApplication(data: MembershipFormData) {
  try {
    const ip = ((await headers()).get('x-forwarded-for') || 'unknown').split(',')[0].trim();
    const limit = await RateLimiter.check(ip, 'submitMembershipApplication', {
      limit: SUBMISSIONS_PER_HOUR,
      windowMs: 60 * 60 * 1000,
    });
    if (!limit.allowed) {
      return { success: false, error: 'Too many applications from this connection. Please try again in an hour, or contact us directly.' };
    }

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
