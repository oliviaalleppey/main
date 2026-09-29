import { db } from '@/lib/db';
import { rateLimits } from '@/lib/db/schema';
import { eq, and, gt, lt } from 'drizzle-orm';

export class RateLimiter {
    private static LIMIT = 5;
    private static WINDOW_MS = 60 * 1000; // 1 minute

    /**
     * `options` overrides the default of 5 per minute for one endpoint — an
     * endpoint that sends email to an address the caller types needs a far
     * tighter limit than one that only reads.
     */
    static async check(
        ip: string,
        endpoint: string,
        options: { limit?: number; windowMs?: number } = {},
    ): Promise<{ allowed: boolean; remaining: number }> {
        const limit = options.limit ?? this.LIMIT;
        const windowMs = options.windowMs ?? this.WINDOW_MS;
        const now = new Date();

        // 1. Lazy cleanup of expired
        await db.delete(rateLimits).where(lt(rateLimits.expiresAt, now));

        // 2. Check existing
        const record = await db.query.rateLimits.findFirst({
            where: and(
                eq(rateLimits.ip, ip),
                eq(rateLimits.endpoint, endpoint),
                gt(rateLimits.expiresAt, now)
            )
        });

        if (record) {
            if (record.hits! >= limit) {
                return { allowed: false, remaining: 0 };
            }

            // Increment
            await db.update(rateLimits)
                .set({ hits: record.hits! + 1 })
                .where(eq(rateLimits.id, record.id));

            return { allowed: true, remaining: limit - (record.hits! + 1) };
        }

        // 3. New Record
        await db.insert(rateLimits).values({
            ip,
            endpoint,
            hits: 1,
            expiresAt: new Date(Date.now() + windowMs)
        });

        return { allowed: true, remaining: limit - 1 };
    }
}
