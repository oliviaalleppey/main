import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { newsletterSubscribers } from '@/lib/db/schema';
import { RateLimiter } from '@/lib/rate-limit';
import { normaliseSubscriberEmail } from '@/lib/validations/newsletter';

/**
 * The footer's "Join our mailing list" form.
 *
 * This used to log the address and answer success without storing anything, so
 * every subscriber was told they had signed up and then lost. Addresses now go
 * to newsletter_subscribers, lower-cased; signing up twice is harmless, and a
 * previously unsubscribed address that signs up again is subscribed again.
 */
export async function POST(request: Request) {
    try {
        const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
        const limit = await RateLimiter.check(ip, 'newsletter', { limit: 5, windowMs: 60 * 60 * 1000 });
        if (!limit.allowed) {
            return NextResponse.json(
                { success: false, message: 'Too many attempts. Please try again later.' },
                { status: 429 },
            );
        }

        const body = await request.json().catch(() => ({}));
        const email = normaliseSubscriberEmail((body as { email?: unknown }).email);
        if (!email) {
            return NextResponse.json(
                { success: false, message: 'A valid email is required.' },
                { status: 400 },
            );
        }

        await db.insert(newsletterSubscribers)
            .values({ email, source: 'website_footer' })
            .onConflictDoUpdate({
                target: newsletterSubscribers.email,
                set: { unsubscribedAt: sql`NULL` },
            });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[newsletter] failed', error);
        return NextResponse.json(
            { success: false, message: 'Subscription failed. Please try again.' },
            { status: 500 },
        );
    }
}
