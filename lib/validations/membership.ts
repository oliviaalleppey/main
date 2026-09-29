import { z } from 'zod';

// Every field is capped. The form is public, and uncapped strings meant anyone
// could store arbitrarily large text in the database with one request.
const short = (max: number) => z.string().trim().max(max, `Must be ${max} characters or fewer`);

export const membershipSchema = z.object({
  fullName: short(120).min(1, 'Full Name is required'),
  dateOfBirth: short(10).optional(),
  gender: short(30).optional(),
  nationality: short(60).optional(),
  // Only a web link; anything else (javascript:, data:) is refused.
  memberPhotographUrl: short(500).regex(/^https?:\/\//i, 'Photo must be a web link').optional().or(z.literal('')),

  mobileNumber: short(30).min(1, 'Mobile Number is required'),
  emailAddress: short(254).email('Invalid email address'),
  alternateContactNumber: short(30).optional(),

  residentialAddress: short(500).optional(),
  city: short(80).optional(),
  state: short(80).optional(),
  country: short(80).optional(),
  pinCode: short(12).optional(),

  idType: short(40).optional(),
  idNumber: short(40).optional(),

  preferredModeOfCommunication: short(40).optional(),

  emergencyName: short(120).optional(),
  emergencyRelationship: short(60).optional(),
  emergencyContactNumber: short(30).optional(),
});

export type MembershipFormData = z.infer<typeof membershipSchema>;
