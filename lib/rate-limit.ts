import { db } from '@/lib/db';
import { rateLimits } from '@/lib/db/schema';
import { eq, and, gt, lt } from 'drizzle-orm';

export class RateLimiter {
    private static LIMIT = 5;
    private static WINDOW_MS = 60 * 1000; // 1 minute

    static async check(ip: string, endpoint: string): Promise<{ allowed: boolean; remaining: number }> {
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
            if (record.hits! >= this.LIMIT) {
                return { allowed: false, remaining: 0 };
            }

            // Increment
            await db.update(rateLimits)
                .set({ hits: record.hits! + 1 })
                .where(eq(rateLimits.id, record.id));

            return { allowed: true, remaining: this.LIMIT - (record.hits! + 1) };
        }

        // 3. New Record
        await db.insert(rateLimits).values({
            ip,
            endpoint,
            hits: 1,
            expiresAt: new Date(Date.now() + this.WINDOW_MS)
        });

        return { allowed: true, remaining: this.LIMIT - 1 };
    }
}
