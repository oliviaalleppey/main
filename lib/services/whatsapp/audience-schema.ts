import { z } from 'zod';
import type { AudienceFilter } from './audiences';

/**
 * Validation for saved audience filters.
 *
 * Lives here rather than in the route file because Next.js route modules may only
 * export HTTP handlers and config — and because the campaign wizard needs the
 * same schema when it builds an audience inline.
 *
 * `.strict()` is deliberate: an unknown key is rejected rather than ignored. A
 * typo'd filter key that silently does nothing would widen an audience without
 * anyone noticing, which is the kind of mistake that gets found only after the
 * messages have gone out.
 *
 * Consent is absent by design. Eligibility is applied separately by
 * eligibilityClause() at count and send time, so no stored filter can opt itself
 * out of the consent rules.
 */
export const filterSchema = z
    .object({
        consentStatus: z.array(z.enum(['pending', 'opted_in', 'opted_out', 'suppressed'])).optional(),
        source: z.array(z.enum(['booking', 'guest_profile', 'inquiry', 'import', 'inbound', 'manual'])).optional(),
        tags: z.array(z.string()).optional(),
        tagMatch: z.enum(['any', 'all']).optional(),
        hasEmail: z.boolean().optional(),
        importId: z.string().uuid().optional(),

        city: z.array(z.string()).optional(),
        state: z.array(z.string()).optional(),
        country: z.array(z.string()).optional(),

        minStays: z.number().int().min(0).optional(),
        maxStays: z.number().int().min(0).optional(),
        minSpent: z.number().int().min(0).optional(),
        vipLevel: z.array(z.string()).optional(),
        isVIP: z.boolean().optional(),

        lastStayWithinDays: z.number().int().min(1).optional(),
        lastStayNotWithinDays: z.number().int().min(1).optional(),
        neverStayed: z.boolean().optional(),

        birthdayMonth: z.number().int().min(1).max(12).optional(),
        anniversaryMonth: z.number().int().min(1).max(12).optional(),

        hasEverRead: z.boolean().optional(),
        neverMessaged: z.boolean().optional(),
        notMessagedInDays: z.number().int().min(1).optional(),
        hadFailure: z.boolean().optional(),
        hasRepliedEver: z.boolean().optional(),
    })
    .strict();

/**
 * A pending-only audience exists in order to ask for permission, so it must be
 * counted under the re-permission rules. Counting it the normal way would always
 * report zero eligible and make the one audience that matters on day one look
 * broken.
 */
export function isRePermissionAudience(filter: AudienceFilter | null | undefined): boolean {
    const statuses = filter?.consentStatus;
    return !!statuses?.length && statuses.every((s) => s === 'pending');
}
