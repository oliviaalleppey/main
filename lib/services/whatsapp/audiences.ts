import { db } from '@/lib/db';
import { waContacts, waAudiences, guestProfiles } from '@/lib/db/schema';
import { and, eq, sql, type SQL, type AnyColumn } from 'drizzle-orm';
import { getSettings } from './settings';

/**
 * Audience filters.
 *
 * A filter is stored as JSON on wa_audiences and translated to SQL here rather
 * than being frozen into a contact-id list, so a *dynamic* audience automatically
 * excludes anyone who opted out since it was created. That property is the whole
 * reason dynamic is the default: a static list built last week will happily
 * message people who have since asked us to stop.
 *
 * Consent is NOT expressible in a filter. Eligibility is applied separately by
 * `eligibilityClause()` at send time so no filter can ever opt itself out of the
 * consent rules.
 */

export type AudienceFilter = {
    // Contact-level
    consentStatus?: ('pending' | 'opted_in' | 'opted_out' | 'suppressed')[];
    source?: ('booking' | 'guest_profile' | 'inquiry' | 'import' | 'inbound' | 'manual')[];
    tags?: string[];
    tagMatch?: 'any' | 'all';
    hasEmail?: boolean;
    importId?: string;

    // Geography (from the linked guest profile)
    city?: string[];
    state?: string[];
    country?: string[];

    // Guest value
    minStays?: number;
    maxStays?: number;
    minSpent?: number; // paise
    vipLevel?: string[];
    isVIP?: boolean;

    // Recency
    lastStayWithinDays?: number;
    lastStayNotWithinDays?: number;
    neverStayed?: boolean;

    // Calendar
    birthdayMonth?: number;    // 1-12
    anniversaryMonth?: number; // 1-12

    // Engagement
    hasEverRead?: boolean;
    neverMessaged?: boolean;
    notMessagedInDays?: number;
    hadFailure?: boolean;
    hasRepliedEver?: boolean;
};

/**
 * Build an `IN (...)` list.
 *
 * Note: embedding a JS array directly in a `sql` template makes drizzle expand it
 * into a bare parameter list, so `= ANY(${arr})` renders as `= ANY(($1, $2))` —
 * a row constructor, which ANY rejects at runtime. Joining explicit params is the
 * correct idiom, and matches the existing usage in app/admin/layout.tsx.
 */
function inTextList(column: SQL | AnyColumn, values: string[]): SQL {
    return sql`${column}::text IN (${sql.join(values.map((v) => sql`${v}`), sql`, `)})`;
}

/** Postgres text[] literal, for the jsonb containment operators. */
function textArray(values: string[]): SQL {
    return sql`ARRAY[${sql.join(values.map((v) => sql`${v}`), sql`, `)}]::text[]`;
}

/** Translate a filter into a WHERE clause over wa_contacts (left-joined to guest_profiles). */
export function buildFilterClause(filter: AudienceFilter): SQL | undefined {
    const clauses: SQL[] = [];

    if (filter.consentStatus?.length) {
        clauses.push(inTextList(waContacts.consentStatus, filter.consentStatus));
    }
    if (filter.source?.length) {
        clauses.push(inTextList(waContacts.source, filter.source));
    }
    if (filter.importId) {
        clauses.push(sql`${waContacts.importId} = ${filter.importId}`);
    }
    if (filter.hasEmail === true) {
        clauses.push(sql`${waContacts.email} IS NOT NULL AND ${waContacts.email} <> ''`);
    } else if (filter.hasEmail === false) {
        clauses.push(sql`(${waContacts.email} IS NULL OR ${waContacts.email} = '')`);
    }

    if (filter.tags?.length) {
        // tags is a json array of strings; ?| is "any key present", ?& is "all present".
        const operator = filter.tagMatch === 'all' ? sql`?&` : sql`?|`;
        clauses.push(sql`${waContacts.tags}::jsonb ${operator} ${textArray(filter.tags)}`);
    }

    // --- Guest profile dimensions ---
    if (filter.city?.length) clauses.push(inTextList(guestProfiles.city, filter.city));
    if (filter.state?.length) clauses.push(inTextList(guestProfiles.state, filter.state));
    if (filter.country?.length) clauses.push(inTextList(guestProfiles.country, filter.country));

    if (filter.minStays !== undefined) {
        clauses.push(sql`COALESCE(${guestProfiles.totalStays}, 0) >= ${filter.minStays}`);
    }
    if (filter.maxStays !== undefined) {
        clauses.push(sql`COALESCE(${guestProfiles.totalStays}, 0) <= ${filter.maxStays}`);
    }
    if (filter.minSpent !== undefined) {
        clauses.push(sql`COALESCE(${guestProfiles.totalSpent}, 0) >= ${filter.minSpent}`);
    }
    if (filter.vipLevel?.length) {
        clauses.push(inTextList(guestProfiles.vipLevel, filter.vipLevel));
    }
    if (filter.isVIP !== undefined) {
        clauses.push(sql`COALESCE(${guestProfiles.isVIP}, false) = ${filter.isVIP}`);
    }

    if (filter.neverStayed) {
        clauses.push(sql`${guestProfiles.lastStayAt} IS NULL`);
    }
    if (filter.lastStayWithinDays !== undefined) {
        clauses.push(sql`${guestProfiles.lastStayAt} >= now() - make_interval(days => ${filter.lastStayWithinDays})`);
    }
    if (filter.lastStayNotWithinDays !== undefined) {
        // "Lapsed": either stayed longer ago than N days, or never stayed at all.
        clauses.push(sql`(${guestProfiles.lastStayAt} IS NULL OR ${guestProfiles.lastStayAt} < now() - make_interval(days => ${filter.lastStayNotWithinDays}))`);
    }

    if (filter.birthdayMonth !== undefined) {
        clauses.push(sql`EXTRACT(MONTH FROM ${guestProfiles.dateOfBirth}) = ${filter.birthdayMonth}`);
    }
    if (filter.anniversaryMonth !== undefined) {
        clauses.push(sql`EXTRACT(MONTH FROM ${guestProfiles.anniversary}) = ${filter.anniversaryMonth}`);
    }

    // --- Engagement, via EXISTS so joins never multiply rows ---
    if (filter.neverMessaged) {
        clauses.push(sql`NOT EXISTS (SELECT 1 FROM wa_messages m WHERE m.contact_id = ${waContacts.id} AND m.direction = 'outbound')`);
    }
    if (filter.notMessagedInDays !== undefined) {
        clauses.push(sql`(${waContacts.lastOutboundAt} IS NULL OR ${waContacts.lastOutboundAt} < now() - make_interval(days => ${filter.notMessagedInDays}))`);
    }
    if (filter.hasEverRead === true) {
        clauses.push(sql`EXISTS (SELECT 1 FROM wa_messages m WHERE m.contact_id = ${waContacts.id} AND m.read_at IS NOT NULL)`);
    } else if (filter.hasEverRead === false) {
        clauses.push(sql`NOT EXISTS (SELECT 1 FROM wa_messages m WHERE m.contact_id = ${waContacts.id} AND m.read_at IS NOT NULL)`);
    }
    if (filter.hadFailure) {
        clauses.push(sql`COALESCE(${waContacts.failureCount}, 0) > 0`);
    }
    if (filter.hasRepliedEver) {
        clauses.push(sql`${waContacts.lastInboundAt} IS NOT NULL`);
    }

    return clauses.length ? and(...clauses) : undefined;
}

/**
 * The consent rules, as SQL. Mirrors canSend() in consent.ts for the MARKETING
 * case so audience previews and actual sends agree on who is eligible.
 *
 * Kept separate from buildFilterClause so a filter can never bypass it.
 */
export function eligibilityClause(frequencyCap: number, isRePermission = false): SQL {
    const consentOk = isRePermission
        // The re-permission ask may go to pending contacts — that is its purpose.
        ? sql`${waContacts.consentStatus}::text IN ('pending', 'opted_in')`
        : sql`(${waContacts.consentStatus}::text = 'opted_in' AND ${waContacts.consentAt} IS NOT NULL)`;

    return and(
        consentOk,
        sql`${waContacts.phone} ~ '^\\+[1-9][0-9]{6,14}$'`,
        sql`NOT EXISTS (SELECT 1 FROM wa_suppression s WHERE s.phone = ${waContacts.phone})`,
        frequencyCap > 0
            ? sql`COALESCE(${waContacts.marketingSent30d}, 0) < ${frequencyCap}`
            : sql`true`,
    )!;
}

// --------------------------------------------
// Counting & preview
// --------------------------------------------

export type ExclusionBreakdown = {
    matched: number;
    eligible: number;
    excluded: {
        notOptedIn: number;
        optedOut: number;
        suppressed: number;
        frequencyCapped: number;
        invalidPhone: number;
        noConsentRecord: number;
    };
};

/**
 * One aggregate query giving both the eligible count and why everyone else was
 * dropped. This is what the campaign wizard shows so nobody has to ask why
 * 10,000 contacts became 6,200.
 *
 * Reasons are evaluated in priority order and each contact is counted once, so
 * the excluded figures sum exactly to matched - eligible.
 */
export function buildExplainFields(cap: number, isRePermission = false) {
    const validPhone = sql`${waContacts.phone} ~ '^\\+[1-9][0-9]{6,14}$'`;
    const suppressed = sql`EXISTS (SELECT 1 FROM wa_suppression s WHERE s.phone = ${waContacts.phone})`;
    const allowedStatuses = isRePermission
        ? sql`${waContacts.consentStatus}::text IN ('pending', 'opted_in')`
        : sql`${waContacts.consentStatus}::text = 'opted_in'`;

    return {
        matched: sql<number>`count(*)`,
        invalidPhone: sql<number>`count(*) FILTER (WHERE NOT (${validPhone}))`,
        suppressed: sql<number>`count(*) FILTER (WHERE ${validPhone} AND (${suppressed} OR ${waContacts.consentStatus}::text = 'suppressed'))`,
        optedOut: sql<number>`count(*) FILTER (WHERE ${validPhone} AND NOT ${suppressed} AND ${waContacts.consentStatus}::text = 'opted_out')`,
        notOptedIn: sql<number>`count(*) FILTER (WHERE ${validPhone} AND NOT ${suppressed} AND ${waContacts.consentStatus}::text NOT IN ('opted_out', 'suppressed') AND NOT (${allowedStatuses}))`,
        noConsentRecord: sql<number>`count(*) FILTER (WHERE ${validPhone} AND NOT ${suppressed} AND ${waContacts.consentStatus}::text = 'opted_in' AND ${waContacts.consentAt} IS NULL)`,
        frequencyCapped: sql<number>`count(*) FILTER (WHERE ${validPhone} AND NOT ${suppressed} AND ${allowedStatuses} AND (${waContacts.consentStatus}::text <> 'opted_in' OR ${waContacts.consentAt} IS NOT NULL) AND ${cap > 0 ? sql`COALESCE(${waContacts.marketingSent30d}, 0) >= ${cap}` : sql`false`})`,
        eligible: sql<number>`count(*) FILTER (WHERE ${eligibilityClause(cap, isRePermission)})`,
    };
}

export async function explainAudience(
    filter: AudienceFilter,
    options: { isRePermission?: boolean } = {},
): Promise<ExclusionBreakdown> {
    const settings = await getSettings();
    const cap = settings.frequencyCapPer30d ?? 2;

    const [row] = await db
        .select(buildExplainFields(cap, options.isRePermission))
        .from(waContacts)
        .leftJoin(guestProfiles, eq(waContacts.guestProfileId, guestProfiles.id))
        .where(buildFilterClause(filter));

    const n = (v: unknown) => Number(v ?? 0);

    return {
        matched: n(row?.matched),
        eligible: n(row?.eligible),
        excluded: {
            notOptedIn: n(row?.notOptedIn),
            optedOut: n(row?.optedOut),
            suppressed: n(row?.suppressed),
            frequencyCapped: n(row?.frequencyCapped),
            invalidPhone: n(row?.invalidPhone),
            noConsentRecord: n(row?.noConsentRecord),
        },
    };
}

/** Sample contacts for the wizard's preview step. Eligible ones only. */
export async function previewAudience(
    filter: AudienceFilter,
    options: { limit?: number; isRePermission?: boolean } = {},
) {
    const settings = await getSettings();
    const cap = settings.frequencyCapPer30d ?? 2;

    const filterClause = buildFilterClause(filter);
    const where = filterClause
        ? and(filterClause, eligibilityClause(cap, options.isRePermission))
        : eligibilityClause(cap, options.isRePermission);

    return db
        .select({
            id: waContacts.id,
            phone: waContacts.phone,
            name: waContacts.name,
            consentStatus: waContacts.consentStatus,
            marketingSent30d: waContacts.marketingSent30d,
            lastStayAt: guestProfiles.lastStayAt,
            totalStays: guestProfiles.totalStays,
            city: guestProfiles.city,
        })
        .from(waContacts)
        .leftJoin(guestProfiles, eq(waContacts.guestProfileId, guestProfiles.id))
        .where(where)
        .orderBy(sql`${guestProfiles.lastStayAt} DESC NULLS LAST`)
        .limit(options.limit ?? 20);
}

/** Resolve the contact ids a campaign should queue. */
export async function resolveAudienceContactIds(
    filter: AudienceFilter,
    options: { isRePermission?: boolean; limit?: number } = {},
): Promise<string[]> {
    const settings = await getSettings();
    const cap = settings.frequencyCapPer30d ?? 2;

    const filterClause = buildFilterClause(filter);
    const where = filterClause
        ? and(filterClause, eligibilityClause(cap, options.isRePermission))
        : eligibilityClause(cap, options.isRePermission);

    const rows = await db
        .select({ id: waContacts.id })
        .from(waContacts)
        .leftJoin(guestProfiles, eq(waContacts.guestProfileId, guestProfiles.id))
        .where(where)
        .orderBy(sql`${guestProfiles.lastStayAt} DESC NULLS LAST`)
        .limit(options.limit ?? 100_000);

    return rows.map((r) => r.id);
}

// --------------------------------------------
// System audiences
// --------------------------------------------

/**
 * Prebuilt, non-deletable audiences. Deliberately reflects the real state of this
 * database: there is no opted-in population yet, so the list that matters on day
 * one is "pending re-permission", not "opted-in past guests".
 */
export const SYSTEM_AUDIENCES: {
    name: string;
    description: string;
    filter: AudienceFilter;
    isRePermission?: boolean;
}[] = [
        {
            name: 'Opted-in guests',
            description: 'Documented WhatsApp consent. The only audience that may receive marketing offers.',
            filter: { consentStatus: ['opted_in'] },
        },
        {
            name: 'Pending re-permission',
            description: 'Imported without a documented opt-in. May only receive the re-permission template.',
            filter: { consentStatus: ['pending'] },
            isRePermission: true,
        },
        {
            name: 'High-value repeat guests',
            description: 'Opted-in guests with three or more stays, or VIP status.',
            filter: { consentStatus: ['opted_in'], minStays: 3 },
        },
        {
            name: 'Birthday this month',
            description: 'Opted-in guests whose birthday falls in the current month.',
            filter: { consentStatus: ['opted_in'], birthdayMonth: new Date().getMonth() + 1 },
        },
        {
            name: 'Lapsed guests',
            description: 'Opted-in guests with no stay in the last 12 months.',
            filter: { consentStatus: ['opted_in'], lastStayNotWithinDays: 365 },
        },
        {
            name: 'Never messaged',
            description: 'Opted-in contacts who have never received a WhatsApp message from us.',
            filter: { consentStatus: ['opted_in'], neverMessaged: true },
        },
    ];

/** Idempotently create the system audiences. Safe to call on every deploy. */
export async function ensureSystemAudiences(): Promise<number> {
    let created = 0;

    for (const audience of SYSTEM_AUDIENCES) {
        const existing = await db.query.waAudiences.findFirst({
            where: and(eq(waAudiences.name, audience.name), eq(waAudiences.isSystem, true)),
            columns: { id: true },
        });
        if (existing) continue;

        await db.insert(waAudiences).values({
            name: audience.name,
            description: audience.description,
            type: 'dynamic',
            filter: audience.filter as unknown as Record<string, unknown>,
            isSystem: true,
        });
        created += 1;
    }

    return created;
}

/** Refresh the cached counts shown in the audience list. */
export async function refreshAudienceCounts(): Promise<void> {
    const audiences = await db.query.waAudiences.findMany({
        columns: { id: true, filter: true, type: true, contactIds: true },
    });

    for (const audience of audiences) {
        let count: number;

        if (audience.type === 'static') {
            count = ((audience.contactIds as string[] | null) ?? []).length;
        } else {
            const breakdown = await explainAudience((audience.filter ?? {}) as AudienceFilter);
            count = breakdown.eligible;
        }

        await db
            .update(waAudiences)
            .set({ lastCount: count, lastEvaluatedAt: new Date() })
            .where(eq(waAudiences.id, audience.id));
    }
}
