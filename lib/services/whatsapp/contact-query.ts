import { waContacts, guestProfiles } from '@/lib/db/schema';
import { and, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import { normalizePhone } from './phone';

/**
 * Contact list filtering, shared by the table and the CSV export.
 *
 * Both endpoints must apply *identical* filters: an export that quietly returns a
 * different set from the one on screen is how the wrong people end up in a
 * campaign. Keeping the predicate in one place makes that impossible by
 * construction.
 */

export const CONSENT_STATUSES = ['pending', 'opted_in', 'opted_out', 'suppressed'] as const;
export const CONTACT_SOURCES = ['booking', 'guest_profile', 'inquiry', 'import', 'inbound', 'manual'] as const;

/**
 * Engagement filters are limited to what the contact row itself records.
 * "Delivered but never read" and "previously failed" need wa_messages, which the
 * dispatcher does not populate until Sprint 3 — offering them now would show an
 * empty result and look broken.
 */
export const ENGAGEMENT_FILTERS = ['never_messaged', 'messaged', 'replied', 'never_replied'] as const;

export type EngagementFilter = (typeof ENGAGEMENT_FILTERS)[number];

export type ContactFilters = {
    search?: string;
    consentStatus: string[];
    source: string[];
    tag?: string;
    city?: string;
    hasBooked?: boolean;
    engagement?: EngagementFilter;
};

function pickAll(params: URLSearchParams, key: string, allowed: readonly string[]): string[] {
    // Accepts both repeated params and a comma-separated list, because the table
    // builds one and hand-written links tend to use the other.
    const raw = params.getAll(key).flatMap((v) => v.split(','));
    return [...new Set(raw.map((v) => v.trim()).filter((v) => allowed.includes(v)))];
}

export function readContactFilters(params: URLSearchParams): ContactFilters {
    const hasBooked = params.get('hasBooked');
    const engagement = params.get('engagement');

    return {
        search: params.get('search')?.trim() || undefined,
        consentStatus: pickAll(params, 'consentStatus', CONSENT_STATUSES),
        source: pickAll(params, 'source', CONTACT_SOURCES),
        tag: params.get('tag')?.trim() || undefined,
        city: params.get('city')?.trim() || undefined,
        hasBooked: hasBooked === 'true' ? true : hasBooked === 'false' ? false : undefined,
        engagement: ENGAGEMENT_FILTERS.includes(engagement as EngagementFilter)
            ? (engagement as EngagementFilter)
            : undefined,
    };
}

/**
 * Build the WHERE clause. Assumes wa_contacts is left-joined to guest_profiles —
 * the city and has-booked filters read from that join.
 */
export function contactWhere(filters: ContactFilters): SQL | undefined {
    const clauses: SQL[] = [];

    if (filters.search) {
        // Search the raw input and its normalised form, so pasting "9847123456"
        // finds the contact stored as "+919847123456".
        const normalized = normalizePhone(filters.search);
        const pattern = `%${filters.search}%`;
        clauses.push(
            or(
                ilike(waContacts.phone, pattern),
                ilike(waContacts.name, pattern),
                ilike(waContacts.email, pattern),
                ...(normalized.ok ? [eq(waContacts.phone, normalized.e164)] : []),
            )!,
        );
    }

    // Enum columns are compared as text so a value list can be parameterised.
    // sql.join is mandatory here — a bare JS array renders as a row constructor
    // and fails at runtime while passing typecheck.
    if (filters.consentStatus.length) {
        clauses.push(
            sql`${waContacts.consentStatus}::text IN (${sql.join(filters.consentStatus.map((s) => sql`${s}`), sql`, `)})`,
        );
    }
    if (filters.source.length) {
        clauses.push(
            sql`${waContacts.source}::text IN (${sql.join(filters.source.map((s) => sql`${s}`), sql`, `)})`,
        );
    }
    if (filters.tag) {
        clauses.push(sql`${waContacts.tags}::jsonb ? ${filters.tag}`);
    }
    if (filters.city) {
        clauses.push(ilike(guestProfiles.city, `%${filters.city}%`));
    }
    if (filters.hasBooked === true) {
        clauses.push(sql`${waContacts.guestProfileId} IS NOT NULL`);
    }
    if (filters.hasBooked === false) {
        clauses.push(sql`${waContacts.guestProfileId} IS NULL`);
    }

    switch (filters.engagement) {
        case 'never_messaged':
            clauses.push(sql`${waContacts.lastOutboundAt} IS NULL`);
            break;
        case 'messaged':
            clauses.push(sql`${waContacts.lastOutboundAt} IS NOT NULL`);
            break;
        case 'replied':
            clauses.push(sql`${waContacts.lastInboundAt} IS NOT NULL`);
            break;
        case 'never_replied':
            clauses.push(sql`${waContacts.lastInboundAt} IS NULL`);
            break;
        default:
            break;
    }

    return clauses.length ? and(...clauses) : undefined;
}

/** Serialise filters back to a query string, for the export link and pagination. */
export function contactFiltersToQuery(filters: ContactFilters): URLSearchParams {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    for (const s of filters.consentStatus) params.append('consentStatus', s);
    for (const s of filters.source) params.append('source', s);
    if (filters.tag) params.set('tag', filters.tag);
    if (filters.city) params.set('city', filters.city);
    if (filters.hasBooked !== undefined) params.set('hasBooked', String(filters.hasBooked));
    if (filters.engagement) params.set('engagement', filters.engagement);
    return params;
}
