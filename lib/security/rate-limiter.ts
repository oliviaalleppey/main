import { NextResponse } from 'next/server';

// Simple in-memory rate limiter for demo/mock environment.
// In production, user likely wants Redis.
// Phase 5 requirement: "Implement fraud protection rate limiter".
// "max 5 booking attempts per minute per IP"

const ATTEMPTS = new Map<string, number[]>();

export class RateLimiter {

    static async check(ip: string, limit: number = 5, windowMs: number = 60000): Promise<boolean> {
        const now = Date.now();
        const userAttempts = ATTEMPTS.get(ip) || [];

        // Filter out old attempts
        const recentAttempts = userAttempts.filter(time => time > now - windowMs);

        if (recentAttempts.length >= limit) {
            return false;
        }

        recentAttempts.push(now);
        ATTEMPTS.set(ip, recentAttempts);
        return true;
    }

    static async middleware(request: Request) {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';

        if (!(await RateLimiter.check(ip))) {
            return new NextResponse('Too Many Requests', { status: 429 });
        }
    }
}
