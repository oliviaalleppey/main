import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { getBookingProvider } from '@/lib/providers/crs/factory';

export const dynamic = 'force-dynamic';

export async function GET() {
    const health = {
        status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'unknown',
        provider: {
            source: 'unknown',
            status: 'unknown' as 'unknown' | 'healthy' | 'degraded',
            latencyMs: 0,
            message: '',
        },
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    };

    try {
        // Check DB
        await db.execute(sql`SELECT 1`);
        health.database = 'connected';
    } catch {
        health.database = 'disconnected';
        health.status = 'unhealthy';
    }

    try {
        const provider = getBookingProvider();
        health.provider.source = provider.source;

        const checkIn = new Date();
        checkIn.setDate(checkIn.getDate() + 1);
        const checkOut = new Date();
        checkOut.setDate(checkOut.getDate() + 2);

        const toDateString = (value: Date) => value.toISOString().split('T')[0];

        const startedAt = Date.now();
        const response = await provider.checkAvailability({
            checkIn: toDateString(checkIn),
            checkOut: toDateString(checkOut),
            adults: 1,
            children: 0,
        });
        health.provider.latencyMs = Date.now() - startedAt;

        if (response.status === 'success') {
            health.provider.status = 'healthy';
            health.provider.message = 'Provider check succeeded';
        } else {
            health.provider.status = 'degraded';
            health.provider.message = response.message || 'Provider returned non-success status';
            if (health.status === 'healthy') {
                health.status = 'degraded';
            }
        }
    } catch (error: unknown) {
        health.provider.status = 'degraded';
        health.provider.message = error instanceof Error ? error.message : 'Provider health check failed';
        if (health.status === 'healthy') {
            health.status = 'degraded';
        }
    }

    return NextResponse.json(health, {
        status: health.status === 'unhealthy' ? 503 : 200
    });
}
