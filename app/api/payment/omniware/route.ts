import { NextRequest, NextResponse } from 'next/server';

/**
 * DEPRECATED: Omniware payment gateway has been replaced with Easebuzz
 * This endpoint is kept for backwards compatibility only
 * New payments use /api/payment/easebuzz
 */

export async function POST(req: NextRequest) {
    return new NextResponse(JSON.stringify({ 
        error: 'Omniware payment gateway has been deprecated. Please use Easebuzz.' 
    }), { 
        status: 410,
        headers: { 'Content-Type': 'application/json' }
    });
}
