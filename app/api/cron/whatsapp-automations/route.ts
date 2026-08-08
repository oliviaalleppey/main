import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { fireAutomation, dueForSchedule } from '@/lib/services/whatsapp/automations';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Date-driven automations: the pre-arrival reminder and the check-out thank-you.
 *
 * Unlike the booking hooks, nothing in our own code "happens" to trigger these —
 * a date simply arrives — so they need a sweep. Running hourly is deliberate:
 * `fireAutomation` is idempotent per (automation, contact, booking), so a guest
 * gets exactly one pre-arrival message however many times this runs that day.
 *
 * Answers 200 with a report even when parts fail. A 500 from a cron is invisible;
 * a 200 carrying `{ errors: [...] }` shows up in the response body.
 */
export async function GET(request: Request) {
    // Same gate as booking-watchdog and whatsapp-dispatch: a CRON_SECRET bearer
    // token, or an admin session so it can be triggered by hand from the panel.
    const authHeader = request.headers.get('authorization');
    const cronAuthorized = !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const session = await auth();
    const adminAuthorized = !!session && session.user?.role === 'admin';

    if (!cronAuthorized && !adminAuthorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const report: Record<string, { queued: number; skipped: number; errors: string[] }> = {};

    for (const key of ['prearrival', 'checkout_review'] as const) {
        const summary = { queued: 0, skipped: 0, errors: [] as string[] };

        try {
            const due = await dueForSchedule(key);

            for (const booking of due) {
                const outcome = await fireAutomation(key, {
                    phone: booking.guest_phone,
                    name: booking.guest_name,
                    dedupe: booking.id,
                    variables: {
                        '1': booking.guest_name,
                        '2': booking.booking_number,
                        '3': String(booking.check_in),
                        '4': String(booking.check_out),
                    },
                });

                if (outcome.queued) summary.queued += 1;
                else summary.skipped += 1;
            }
        } catch (error) {
            summary.errors.push(error instanceof Error ? error.message : 'Sweep failed');
            console.error(`[whatsapp/automations-cron] ${key} failed`, error);
        }

        report[key] = summary;
    }

    return NextResponse.json({ ok: true, ran: new Date().toISOString(), report });
}
