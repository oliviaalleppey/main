import { NextResponse } from 'next/server';
import { sendEventInquiryToReservations } from '@/lib/services/email';

type EventInquiryPayload = {
    name?: string;
    company?: string;
    email?: string;
    phone?: string;
    eventType?: string;
    guestCount?: string;
    preferredDate?: string;
    message?: string;
};

function clean(value: unknown, maxLength = 500): string {
    if (typeof value !== 'string') return '';
    return value.trim().slice(0, maxLength);
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export async function POST(request: Request) {
    try {
        const body = await request.json() as EventInquiryPayload;

        const name = clean(body.name, 120);
        const company = clean(body.company, 160);
        const email = clean(body.email, 160);
        const phone = clean(body.phone, 40);
        const eventType = clean(body.eventType, 120);
        const guestCount = clean(body.guestCount, 40);
        const preferredDate = clean(body.preferredDate, 40);
        const message = clean(body.message, 2000);

        if (!name || !phone || !eventType) {
            return NextResponse.json(
                { success: false, message: 'Name, phone, and event type are required.' },
                { status: 400 },
            );
        }

        const result = await sendEventInquiryToReservations({
            name: escapeHtml(name),
            company: escapeHtml(company),
            email: escapeHtml(email),
            phone: escapeHtml(phone),
            eventType: escapeHtml(eventType),
            guestCount: escapeHtml(guestCount),
            preferredDate: escapeHtml(preferredDate),
            message: escapeHtml(message),
        });

        if (result && typeof result === 'object' && 'skipped' in result && result.skipped) {
            return NextResponse.json(
                { success: false, message: 'Email service is not configured on this server.' },
                { status: 503 },
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Event brief sent successfully.',
        });
    } catch (error) {
        console.error('[event-inquiry] failed', error);
        return NextResponse.json(
            { success: false, message: 'Failed to send your event brief. Please try again.' },
            { status: 500 },
        );
    }
}

