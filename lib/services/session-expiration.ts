import { db } from '@/lib/db';
import { bookingSessions } from '@/lib/db/schema';
import { eq, lt } from 'drizzle-orm';

const SESSION_TIMEOUT_MINUTES = 10;

export class SessionExpiration {
    static async check(sessionId: string): Promise<{ isValid: boolean; message?: string }> {
        const session = await db.query.bookingSessions.findFirst({
            where: eq(bookingSessions.id, sessionId)
        });

        if (!session) {
            return { isValid: false, message: 'Session not found. Please restart booking.' };
        }

        if (new Date() > session.expiresAt) {
            return { isValid: false, message: 'Session expired due to inactivity. Please restart booking.' };
        }

        // Extend session on activity
        await this.extend(sessionId);

        return { isValid: true };
    }

    static async extend(sessionId: string) {
        const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MINUTES * 60 * 1000);
        await db.update(bookingSessions)
            .set({ expiresAt })
            .where(eq(bookingSessions.id, sessionId));
    }
}
