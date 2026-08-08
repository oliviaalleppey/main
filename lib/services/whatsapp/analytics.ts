import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { getSettings, budgetState } from './settings';

/**
 * Analytics over the send log.
 *
 * Everything here reads `wa_messages`, which is the only place that records what
 * was actually sent. Two things are worth knowing before reading the queries:
 *
 * - **Money is in paise** throughout, matching `formatCurrency()` in lib/utils.ts.
 *   Nothing here divides; the UI does.
 * - **Rates are computed in SQL over the same row set as the counts**, rather than
 *   dividing two separately-fetched numbers in JS. A read rate assembled from two
 *   queries run seconds apart is subtly wrong whenever a webhook lands between
 *   them, and that is exactly when someone is watching a campaign go out.
 *
 * `delivered`, `read` and the rest are cumulative states, so a message that was
 * read is also counted as delivered and sent. The funnel is therefore monotonic
 * by construction and does not need the columns to agree.
 */

export type DateRange = { from: Date; to: Date };

export function defaultRange(days = 30): DateRange {
    const to = new Date();
    const from = new Date(to.getTime() - days * 86_400_000);
    return { from, to };
}

export type Funnel = {
    queued: number;
    sent: number;
    delivered: number;
    read: number;
    replied: number;
    failed: number;
    skipped: number;
    optedOut: number;
    deliveryRate: number;
    readRate: number;
    optOutRate: number;
};

/**
 * The funnel, over messages queued in the range.
 *
 * Counted by timestamp presence rather than by current status: a message that has
 * been read has a read_at and also a sent_at, so it counts in both. Using
 * `status = 'read'` instead would make every stage mutually exclusive and the
 * funnel would read as though nothing progressed.
 */
export async function funnel(range: DateRange): Promise<Funnel> {
    const result = await db.execute<{
        queued: number; sent: number; delivered: number; read: number;
        failed: number; skipped: number;
    }>(sql`
        SELECT
            COUNT(*)::int                                        AS "queued",
            COUNT(*) FILTER (WHERE sent_at IS NOT NULL)::int      AS "sent",
            COUNT(*) FILTER (WHERE delivered_at IS NOT NULL)::int AS "delivered",
            COUNT(*) FILTER (WHERE read_at IS NOT NULL)::int      AS "read",
            COUNT(*) FILTER (WHERE status = 'failed')::int        AS "failed",
            COUNT(*) FILTER (WHERE status = 'skipped')::int       AS "skipped"
        FROM wa_messages
        WHERE queued_at >= ${range.from} AND queued_at <= ${range.to}
          AND direction = 'outbound'
    `);

    const counts = result.rows[0] ?? {
        queued: 0, sent: 0, delivered: 0, read: 0, failed: 0, skipped: 0,
    };

    // A reply is a guest writing back in the window — measured from the inbox,
    // because a reply is an inbound message, not a state of an outbound one.
    const repliedResult = await db.execute<{ replied: number }>(sql`
        SELECT COUNT(DISTINCT thread_id)::int AS "replied"
        FROM wa_inbox_messages
        WHERE direction = 'inbound'
          AND created_at >= ${range.from} AND created_at <= ${range.to}
    `);

    const optedOutResult = await db.execute<{ opted_out: number }>(sql`
        SELECT COUNT(*)::int AS "opted_out"
        FROM wa_consent_events
        WHERE to_status = 'opted_out'
          AND created_at >= ${range.from} AND created_at <= ${range.to}
    `);

    const sent = Number(counts.sent) || 0;
    const delivered = Number(counts.delivered) || 0;
    const read = Number(counts.read) || 0;
    const optedOut = Number(optedOutResult.rows[0]?.opted_out) || 0;

    return {
        queued: Number(counts.queued) || 0,
        sent,
        delivered,
        read,
        replied: Number(repliedResult.rows[0]?.replied) || 0,
        failed: Number(counts.failed) || 0,
        skipped: Number(counts.skipped) || 0,
        optedOut,
        // Guarded against divide-by-zero: an empty range reports 0, not NaN, which
        // would render as "NaN%" on the dashboard.
        deliveryRate: sent ? delivered / sent : 0,
        readRate: delivered ? read / delivered : 0,
        optOutRate: delivered ? optedOut / delivered : 0,
    };
}

export type DailyPoint = {
    day: string;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    costPaise: number;
};

/** Daily volume and cost. Gap-filled so the chart has no missing days. */
export async function dailyTrends(range: DateRange): Promise<DailyPoint[]> {
    const result = await db.execute<DailyPoint>(sql`
        WITH days AS (
            SELECT generate_series(
                date_trunc('day', ${range.from}::timestamp),
                date_trunc('day', ${range.to}::timestamp),
                '1 day'
            )::date AS day
        )
        SELECT
            to_char(d.day, 'YYYY-MM-DD')                                    AS "day",
            COALESCE(COUNT(m.id) FILTER (WHERE m.sent_at IS NOT NULL), 0)::int      AS "sent",
            COALESCE(COUNT(m.id) FILTER (WHERE m.delivered_at IS NOT NULL), 0)::int AS "delivered",
            COALESCE(COUNT(m.id) FILTER (WHERE m.read_at IS NOT NULL), 0)::int      AS "read",
            COALESCE(COUNT(m.id) FILTER (WHERE m.status = 'failed'), 0)::int        AS "failed",
            COALESCE(SUM(m.cost) FILTER (WHERE m.sent_at IS NOT NULL), 0)::int      AS "costPaise"
        FROM days d
        LEFT JOIN wa_messages m
               ON date_trunc('day', m.sent_at)::date = d.day
              AND m.direction = 'outbound'
        GROUP BY d.day
        ORDER BY d.day
    `);

    return result.rows.map((row) => ({
        day: row.day,
        sent: Number(row.sent) || 0,
        delivered: Number(row.delivered) || 0,
        read: Number(row.read) || 0,
        failed: Number(row.failed) || 0,
        costPaise: Number(row.costPaise) || 0,
    }));
}

export type CostSummary = {
    totalPaise: number;
    marketingPaise: number;
    utilityPaise: number;
    costPerDeliveredPaise: number;
    costPerReadPaise: number;
    monthToDatePaise: number;
    budgetPaise: number;
    percentOfBudget: number;
    state: 'ok' | 'warn' | 'over';
};

/** Spend, split by category, against the monthly budget. */
export async function costSummary(range: DateRange): Promise<CostSummary> {
    const result = await db.execute<{
        total: number; marketing: number; utility: number; delivered: number; read: number;
    }>(sql`
        SELECT
            COALESCE(SUM(m.cost), 0)::int                                                AS "total",
            COALESCE(SUM(m.cost) FILTER (WHERE t.category = 'MARKETING'), 0)::int        AS "marketing",
            COALESCE(SUM(m.cost) FILTER (WHERE t.category <> 'MARKETING'), 0)::int       AS "utility",
            COUNT(*) FILTER (WHERE m.delivered_at IS NOT NULL)::int                      AS "delivered",
            COUNT(*) FILTER (WHERE m.read_at IS NOT NULL)::int                           AS "read"
        FROM wa_messages m
        LEFT JOIN wa_templates t ON t.id = m.template_id
        WHERE m.sent_at >= ${range.from} AND m.sent_at <= ${range.to}
          AND m.direction = 'outbound'
    `);

    const row = result.rows[0] ?? { total: 0, marketing: 0, utility: 0, delivered: 0, read: 0 };

    // The budget is a calendar-month ceiling, so it is measured month-to-date
    // regardless of what range the operator is looking at.
    const monthResult = await db.execute<{ spent: number }>(sql`
        SELECT COALESCE(SUM(cost), 0)::int AS "spent"
        FROM wa_messages
        WHERE sent_at >= date_trunc('month', now())
          AND direction = 'outbound'
    `);

    const settings = await getSettings();
    const monthToDatePaise = Number(monthResult.rows[0]?.spent) || 0;
    const budget = budgetState(settings, monthToDatePaise);

    const delivered = Number(row.delivered) || 0;
    const read = Number(row.read) || 0;
    const totalPaise = Number(row.total) || 0;

    return {
        totalPaise,
        marketingPaise: Number(row.marketing) || 0,
        utilityPaise: Number(row.utility) || 0,
        costPerDeliveredPaise: delivered ? Math.round(totalPaise / delivered) : 0,
        costPerReadPaise: read ? Math.round(totalPaise / read) : 0,
        monthToDatePaise,
        budgetPaise: budget.budget,
        percentOfBudget: budget.percentUsed,
        state: budget.exhausted ? 'over' : budget.shouldWarn ? 'warn' : 'ok',
    };
}

export type TemplateStat = {
    templateId: string;
    name: string;
    category: string;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    readRate: number;
    optOuts: number;
    optOutRate: number;
};

/**
 * Per-template performance, worst opt-out rate first.
 *
 * The opt-out count is attributed to a template by looking for a consent
 * withdrawal that happened *after* that template reached the contact, within a
 * day. It is a heuristic — Meta does not tell us which message a STOP replies to
 * — but a template that reliably precedes opt-outs is exactly what we need to see.
 */
export async function templateLeaderboard(range: DateRange): Promise<TemplateStat[]> {
    const result = await db.execute<TemplateStat>(sql`
        SELECT
            t.id::text                                                   AS "templateId",
            t.name                                                       AS "name",
            t.category::text                                             AS "category",
            COUNT(*) FILTER (WHERE m.sent_at IS NOT NULL)::int           AS "sent",
            COUNT(*) FILTER (WHERE m.delivered_at IS NOT NULL)::int      AS "delivered",
            COUNT(*) FILTER (WHERE m.read_at IS NOT NULL)::int           AS "read",
            COUNT(*) FILTER (WHERE m.status = 'failed')::int             AS "failed",
            COUNT(DISTINCT ce.id)::int                                   AS "optOuts"
        FROM wa_messages m
        JOIN wa_templates t ON t.id = m.template_id
        LEFT JOIN wa_consent_events ce
               ON ce.contact_id = m.contact_id
              AND ce.to_status = 'opted_out'
              AND m.sent_at IS NOT NULL
              AND ce.created_at >= m.sent_at
              AND ce.created_at <= m.sent_at + interval '1 day'
        WHERE m.sent_at >= ${range.from} AND m.sent_at <= ${range.to}
          AND m.direction = 'outbound'
        GROUP BY t.id, t.name, t.category
        ORDER BY COUNT(*) FILTER (WHERE m.sent_at IS NOT NULL) DESC
    `);

    return result.rows.map((row) => {
        const delivered = Number(row.delivered) || 0;
        const read = Number(row.read) || 0;
        const optOuts = Number(row.optOuts) || 0;

        return {
            templateId: row.templateId,
            name: row.name,
            category: row.category,
            sent: Number(row.sent) || 0,
            delivered,
            read,
            failed: Number(row.failed) || 0,
            optOuts,
            readRate: delivered ? read / delivered : 0,
            optOutRate: delivered ? optOuts / delivered : 0,
        };
    });
}

export type HourStat = { hour: number; sent: number; read: number; readRate: number };

/**
 * Read rate by hour of day, in the hotel's own timezone.
 *
 * Timestamps are stored without a zone, so the hour is extracted after shifting
 * into the configured timezone — otherwise "best time to send" would be advice
 * about UTC, which is 5.5 hours out for a hotel in Kerala.
 */
export async function bestTimeToSend(range: DateRange): Promise<HourStat[]> {
    const settings = await getSettings();
    const timezone = settings.timezone ?? 'Asia/Kolkata';

    const result = await db.execute<{ hour: number; sent: number; read: number }>(sql`
        SELECT
            EXTRACT(HOUR FROM (sent_at AT TIME ZONE 'UTC' AT TIME ZONE ${timezone}))::int AS "hour",
            COUNT(*)::int                                       AS "sent",
            COUNT(*) FILTER (WHERE read_at IS NOT NULL)::int    AS "read"
        FROM wa_messages
        WHERE sent_at IS NOT NULL
          AND sent_at >= ${range.from} AND sent_at <= ${range.to}
          AND direction = 'outbound'
        GROUP BY 1
        ORDER BY 1
    `);

    const byHour = new Map(result.rows.map((row) => [Number(row.hour), row]));

    // Every hour is present so the chart has a stable 24-slot x-axis.
    return Array.from({ length: 24 }, (_, hour) => {
        const row = byHour.get(hour);
        const sent = Number(row?.sent) || 0;
        const read = Number(row?.read) || 0;
        return { hour, sent, read, readRate: sent ? read / sent : 0 };
    });
}

export type ConsentSnapshot = {
    total: number;
    optedIn: number;
    pending: number;
    optedOut: number;
    suppressed: number;
    withProof: number;
    proofPercent: number;
};

/**
 * Contacts by consent state, and the number that matters for DPDP: the share of
 * opted-in contacts that actually have a recorded consent timestamp. It should
 * trend to 100%, and anything less is a contact we could not defend if asked.
 */
export async function consentSnapshot(): Promise<ConsentSnapshot> {
    const result = await db.execute<{
        total: number; opted_in: number; pending: number; opted_out: number;
        suppressed: number; with_proof: number;
    }>(sql`
        SELECT
            COUNT(*)::int                                                          AS "total",
            COUNT(*) FILTER (WHERE consent_status = 'opted_in')::int               AS "opted_in",
            COUNT(*) FILTER (WHERE consent_status = 'pending')::int                AS "pending",
            COUNT(*) FILTER (WHERE consent_status = 'opted_out')::int              AS "opted_out",
            COUNT(*) FILTER (WHERE consent_status = 'suppressed')::int             AS "suppressed",
            COUNT(*) FILTER (WHERE consent_status = 'opted_in'
                               AND consent_at IS NOT NULL)::int                    AS "with_proof"
        FROM wa_contacts
    `);

    const row = result.rows[0] ?? {
        total: 0, opted_in: 0, pending: 0, opted_out: 0, suppressed: 0, with_proof: 0,
    };

    const optedIn = Number(row.opted_in) || 0;
    const withProof = Number(row.with_proof) || 0;

    return {
        total: Number(row.total) || 0,
        optedIn,
        pending: Number(row.pending) || 0,
        optedOut: Number(row.opted_out) || 0,
        suppressed: Number(row.suppressed) || 0,
        withProof,
        proofPercent: optedIn ? Math.round((withProof / optedIn) * 100) : 100,
    };
}

/** Everything the analytics screen needs, in one round of queries. */
export async function analyticsOverview(range: DateRange) {
    const [funnelData, trends, cost, templates, hours, consent] = await Promise.all([
        funnel(range),
        dailyTrends(range),
        costSummary(range),
        templateLeaderboard(range),
        bestTimeToSend(range),
        consentSnapshot(),
    ]);

    return { range, funnel: funnelData, trends, cost, templates, hours, consent };
}

export type AnalyticsOverview = Awaited<ReturnType<typeof analyticsOverview>>;
