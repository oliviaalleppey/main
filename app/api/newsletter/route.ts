import { NextResponse } from 'next/server';

function clean(value: unknown): string {
    if (typeof value !== 'string') return '';
    return value.trim().slice(0, 200);
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const email = clean(body.email);

        if (!email || !isValidEmail(email)) {
            return NextResponse.json(
                { success: false, message: 'A valid email is required.' },
                { status: 400 },
            );
        }

        console.log(`[newsletter] New subscriber: ${email}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[newsletter] failed', error);
        return NextResponse.json(
            { success: false, message: 'Subscription failed.' },
            { status: 500 },
        );
    }
}
