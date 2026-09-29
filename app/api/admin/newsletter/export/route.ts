import { NextResponse } from 'next/server';
import { asc, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { newsletterSubscribers } from '@/lib/db/schema';
import { denyUnlessAdmin } from '@/lib/admin/guard';

export const dynamic = 'force-dynamic';

/** A CSV cell, quoted, with formula characters neutralised for spreadsheet safety. */
function cell(value: string): string {
    const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
    return `"${safe.replace(/"/g, '""')}"`;
}

/**
 * GET — the mailing list as CSV, for administrators. Active subscribers only;
 * the dashboard links here with the current count.
 */
export async function GET() {
    const denied = await denyUnlessAdmin();
    if (denied) return denied;

    const rows = await db
        .select({ email: newsletterSubscribers.email, source: newsletterSubscribers.source, createdAt: newsletterSubscribers.createdAt })
        .from(newsletterSubscribers)
        .where(isNull(newsletterSubscribers.unsubscribedAt))
        .orderBy(asc(newsletterSubscribers.createdAt));

    const lines = [
        'email,source,subscribed_at_utc',
        ...rows.map((row) => [cell(row.email), cell(row.source), cell(row.createdAt.toISOString())].join(',')),
    ];

    return new NextResponse(`${lines.join('\n')}\n`, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="newsletter-subscribers.csv"`,
            'Cache-Control': 'no-store',
        },
    });
}
