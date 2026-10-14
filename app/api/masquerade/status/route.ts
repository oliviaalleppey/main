import { NextResponse } from 'next/server';
import { getMasqueradeStatus } from '@/lib/services/masquerade-booking';

export const dynamic = 'force-dynamic';

/** Tells the booking form whether online payment is open and whether any rooms are left. */
export async function GET() {
    const status = await getMasqueradeStatus();
    return NextResponse.json(status, { headers: { 'Cache-Control': 'no-store' } });
}
