import { db } from '@/lib/db';
import { bookings, payments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AlertCircle, PhoneCall, Mail, RotateCcw } from 'lucide-react';

export const dynamic = 'force-dynamic';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount / 100);

/**
 * Where a guest lands when a payment does not go through.
 *
 * Keyed on the booking id and reading straight from the database on purpose:
 * the booking session cookie is deleted the moment we hand the guest to
 * Easebuzz, so anything that needs that cookie — /book/checkout did — bounces
 * the guest to /book/search with no explanation. That is what made guests
 * rebuild the entire booking and re-enter their card several times instead of
 * seeing "your bank declined this" once.
 */
export default async function PaymentFailedPage({
    params,
}: {
    params: Promise<{ bookingId: string }>;
}) {
    const { bookingId } = await params;

    const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
    });

    const payment = booking
        ? await db.query.payments.findFirst({ where: eq(payments.bookingId, booking.id) })
        : undefined;

    // If reconciliation has since found the money, this is the wrong page to be on.
    if (booking && (payment?.status === 'success' || booking.status === 'confirmed')) {
        redirect(`/book/confirmation/${booking.id}`);
    }

    const metadata = (payment?.metadata as Record<string, unknown> | null) || null;
    const gatewayReason = typeof metadata?.error === 'string' ? metadata.error : '';
    // "NA" is Easebuzz's filler for "no reason supplied", which is worse than
    // saying nothing at all.
    const reason = gatewayReason && gatewayReason.toUpperCase() !== 'NA' ? gatewayReason : '';

    const mode = typeof metadata?.mode === 'string' && metadata.mode !== 'NA' ? metadata.mode : '';
    const easepayid = typeof metadata?.easepayid === 'string' ? metadata.easepayid : '';

    const hotelPhone = process.env.HOTEL_PHONE || '';
    const reservationEmail = process.env.HOTEL_RESERVATION_EMAIL || '';

    return (
        <div className="min-h-screen bg-[var(--surface-cream)] py-20 px-6 flex items-center justify-center">
            <div className="bg-white max-w-2xl w-full p-8 sm:p-12 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-10 h-10 text-red-600" />
                    </div>
                </div>

                <h1 className="text-3xl font-serif mb-2 text-center">Payment not completed</h1>
                <p className="text-gray-500 mb-8 text-center">
                    Your card has not been charged and no room has been held.
                </p>

                {reason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
                        <p className="text-xs uppercase tracking-widest text-red-400 mb-1">
                            Reason from the payment gateway
                        </p>
                        <p className="text-sm text-red-900">{reason}</p>
                    </div>
                )}

                <div className="bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-lg p-4 mb-8">
                    <p className="font-medium mb-1">If you see a debit on your account</p>
                    <p>
                        Failed attempts are sometimes held by the bank and released automatically within
                        3&ndash;5 working days. Quote the reference below to reservations and we will check it
                        for you.
                    </p>
                </div>

                {booking && (
                    <div className="space-y-4 text-left mb-10 text-sm">
                        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                            <span className="text-gray-500">Reference</span>
                            <span className="font-mono font-medium text-right">{booking.bookingNumber}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                            <span className="text-gray-500">Guest</span>
                            <span className="font-medium text-right">{booking.guestName}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                            <span className="text-gray-500">Dates</span>
                            <span className="font-medium text-right">
                                {new Date(booking.checkIn).toLocaleDateString('en-IN')} &ndash;{' '}
                                {new Date(booking.checkOut).toLocaleDateString('en-IN')}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                            <span className="text-gray-500">Amount</span>
                            <span className="font-medium text-right font-serif text-lg">
                                {formatCurrency(booking.totalAmount)}
                            </span>
                        </div>
                        {(mode || easepayid) && (
                            <div className="grid grid-cols-2 gap-4">
                                <span className="text-gray-500">Attempt</span>
                                <span className="font-mono text-xs text-right text-gray-600">
                                    {[mode, easepayid].filter(Boolean).join(' · ')}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                        href="/book/search"
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-[var(--text-dark)] text-white px-6 py-3 rounded-lg text-sm font-medium hover:opacity-90 transition"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Try booking again
                    </Link>
                    {hotelPhone && (
                        <a
                            href={`tel:${hotelPhone.replace(/\s/g, '')}`}
                            className="flex-1 inline-flex items-center justify-center gap-2 border border-gray-300 px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                        >
                            <PhoneCall className="w-4 h-4" />
                            Book by phone
                        </a>
                    )}
                </div>

                {reservationEmail && (
                    <p className="text-center text-xs text-gray-500 mt-6 flex items-center justify-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        <a href={`mailto:${reservationEmail}`} className="underline hover:text-gray-700">
                            {reservationEmail}
                        </a>
                    </p>
                )}
            </div>
        </div>
    );
}
