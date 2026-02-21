import { db } from '@/lib/db';
import { idempotencyKeys } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export class IdempotencyService {
    static generateKey(data: any): string {
        return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    }

    static async check(key: string): Promise<{ exists: boolean; response?: any }> {
        const record = await db.query.idempotencyKeys.findFirst({
            where: eq(idempotencyKeys.key, key)
        });

        if (record) {
            return { exists: true, response: record.responseData };
        }

        return { exists: false };
    }

    static async lock(key: string, method: string, path: string, paramsHash?: string) {
        await db.insert(idempotencyKeys).values({
            key,
            method,
            path,
            paramsHash,
            lockedAt: new Date() // Locked but not completed
        });
    }

    static async complete(key: string, responseData: any, statusCode: number) {
        await db.update(idempotencyKeys)
            .set({ responseData, statusCode })
            .where(eq(idempotencyKeys.key, key));
    }
}
