import { db } from '@/lib/db';
import { bookings, payments, bookingItems, bookingGuests, bookingConfirmations, bookingLogs, roomTypes } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';

interface PageProps {
    params: Promise<{ id: string }>;
}

function formatCurrency(paise: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100);
}

function formatDate(dateStr: string | Date) {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr: string | Date) {
    return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; tw: string }> = {
    confirmed: { label: 'Confirmed', icon: CheckCircle2, tw: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    completed: { label: 'Completed', icon: CheckCircle2, tw: 'bg-gray-100 text-gray-600 border-gray-200' },
    payment_success: { label: 'Payment Received', icon: Clock, tw: 'bg-amber-50 text-amber-700 border-amber-200' },
    booking_requested: { label: 'Syncing to CRS', icon: Clock, tw: 'bg-amber-50 text-amber-700 border-amber-200' },
    pending_payment: { label: 'Awaiting Payment', icon: Clock, tw: 'bg-blue-50 text-blue-700 border-blue-200' },
    initiated: { label: 'Initiated', icon: Clock, tw: 'bg-gray-50 text-gray-500 border-gray-200' },
    cancelled: { label: 'Cancelled', icon: XCircle, tw: 'bg-red-50 text-red-700 border-red-200' },
    failed: { label: 'Failed', icon: XCircle, tw: 'bg-red-50 text-red-700 border-red-200' },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">{title}</h2>
            </div>
            <div className="px-6 py-5">{children}</div>
        </div>
    );
}

function Field({ label, value, className = '' }: { label: string; value: React.ReactNode; className?: string }) {
    return (
        <div className={className}>
            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-1">{label}</p>
            <p className="text-sm font-semibold text-gray-900">{value}</p>
        </div>
    );
}

export default async function BookingDetailPage({ params }: PageProps) {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') redirect('/signin');

    const { id } = await params;

    const booking = await db.query.bookings.findFirst({ where: eq(bookings.id, id) });
    if (!booking) notFound();

    const [bookingItemRows, , confirmationRows, logRows] = await Promise.all([
        db.query.bookingItems.findMany({ where: eq(bookingItems.bookingId, id) }),
        db.query.bookingGuests.findMany({ where: eq(bookingGuests.bookingId, id) }),
        db.query.bookingConfirmations.findMany({
            where: eq(bookingConfirmations.bookingId, id),
            orderBy: [desc(bookingConfirmations.confirmedAt)],
        }),
        db.query.bookingLogs.findMany({ where: eq(bookingLogs.bookingId, id), orderBy: [desc(bookingLogs.createdAt)], limit: 15 }),
    ]);

    let paymentRows: typeof payments.$inferSelect[] = [];
    try {
        paymentRows = await db.query.payments.findMany({
            where: eq(payments.bookingId, id),
            orderBy: [desc(payments.createdAt)],
        });
    } catch { /* migration pending */ }

    const roomTypeIds = [...new Set(bookingItemRows.map(i => i.roomTypeId).filter(Boolean))] as string[];
    const roomTypeRows = roomTypeIds.length
        ? await db.query.roomTypes.findMany({ where: (t, { inArray }) => inArray(t.id, roomTypeIds) })
        : [];
    const roomTypeMap = new Map(roomTypeRows.map(r => [r.id, r.name]));

    const status = booking.status || 'initiated';
    const sc = STATUS_CONFIG[status] || { label: status, icon: AlertTriangle, tw: 'bg-gray-50 text-gray-500 border-gray-200' };
    const StatusIcon = sc.icon;

    const nights = Math.max(1, Math.ceil(
        (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86400000
    ));

    const crsConfirmation = confirmationRows[0];

    return (
        <div className="max-w-3xl space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <Link href="/admin/bookings" className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div className="flex-1 flex items-center gap-3 flex-wrap">
                    <h1 className="text-lg font-bold text-gray-900 font-mono">{booking.bookingNumber}</h1>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${sc.tw}`}>
                        <StatusIcon className="w-3 h-3" />
                        {sc.label}
                    </span>
                    {crsConfirmation && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 text-white px-2.5 py-0.5 text-xs font-semibold">
                            CRS: {crsConfirmation.confirmationNumber}
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0">{formatDateTime(booking.createdAt!)}</p>
            </div>

            {/* Guest + Stay — 2 col */}
            <div className="grid md:grid-cols-2 gap-4">
                <Section title="Guest">
                    <div className="space-y-3">
                        <Field label="Name" value={booking.guestName} />
                        <Field label="Email" value={
                            <a href={`mailto:${booking.guestEmail}`} className="text-blue-600 hover:underline">{booking.guestEmail}</a>
                        } />
                        <Field label="Phone" value={
                            <a href={`tel:${booking.guestPhone}`} className="text-blue-600 hover:underline">{booking.guestPhone}</a>
                        } />
                        {booking.specialRequests && (
                            <div className="pt-3 border-t border-gray-100">
                                <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-1">Requests</p>
                                <p className="text-sm text-gray-600 italic">"{booking.specialRequests}"</p>
                            </div>
                        )}
                    </div>
                </Section>

                <Section title="Stay">
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Check-in" value={formatDate(booking.checkIn)} />
                        <Field label="Check-out" value={formatDate(booking.checkOut)} />
                        <Field label="Duration" value={`${nights} night${nights !== 1 ? 's' : ''}`} />
                        <Field label="Guests" value={`${booking.adults ?? 0} adult${(booking.adults ?? 0) > 1 ? 's' : ''}${(booking.children ?? 0) > 0 ? `, ${booking.children} child` : ''}`} />
                    </div>
                </Section>
            </div>

            {/* Rooms */}
            <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Rooms</h2>
                    <span className="text-xs text-gray-400">{nights} night{nights !== 1 ? 's' : ''}</span>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="px-6 py-3 text-left text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Room</th>
                            <th className="px-6 py-3 text-center text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Qty</th>
                            <th className="px-6 py-3 text-right text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Rate</th>
                            <th className="px-6 py-3 text-right text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookingItemRows.length > 0 ? bookingItemRows.map(item => (
                            <tr key={item.id} className="border-b border-gray-50">
                                <td className="px-6 py-3.5 font-medium text-gray-900">
                                    {item.roomTypeId ? (roomTypeMap.get(item.roomTypeId) || 'Room') : 'Room'}
                                </td>
                                <td className="px-6 py-3.5 text-center text-gray-500">{item.quantity}</td>
                                <td className="px-6 py-3.5 text-right text-gray-500">{formatCurrency(item.pricePerNight || 0)}<span className="text-gray-400 text-xs">/night</span></td>
                                <td className="px-6 py-3.5 text-right font-semibold text-gray-900">{formatCurrency(item.subtotal || 0)}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-6 text-center text-gray-400">No details</td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="bg-gray-50">
                            <td colSpan={3} className="px-6 py-3.5 text-right text-sm font-semibold text-gray-600">Total Charged</td>
                            <td className="px-6 py-3.5 text-right font-bold text-gray-900">{formatCurrency(booking.totalAmount)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Payment */}
            <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Payment</h2>
                </div>
                {paymentRows.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                        {paymentRows.map(p => (
                            <div key={p.id} className="px-6 py-4 flex items-center gap-6 flex-wrap">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 capitalize">{p.paymentMethod?.replace('_', ' ') || 'Payment'}</p>
                                    {(p.omniwareOrderId || p.omniwareTransactionId) && (
                                        <p className="text-xs font-mono text-gray-400 mt-0.5 truncate">{p.omniwareOrderId || p.omniwareTransactionId}</p>
                                    )}
                                </div>
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                                    p.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>{p.status}</span>
                                <span className="font-bold text-gray-900">{formatCurrency(p.amount)}</span>
                                <span className="text-xs text-gray-400">{formatDateTime(p.createdAt!)}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="px-6 py-6 text-sm text-gray-400">No payment records</p>
                )}
            </div>

            {/* Activity Log */}
            {logRows.length > 0 && (
                <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Activity</h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {logRows.map(log => (
                            <div key={log.id} className="px-6 py-3 flex items-center gap-3">
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${log.level === 'error' ? 'bg-red-400' :
                                    log.level === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'
                                    }`} />
                                <span className="flex-1 text-xs font-mono text-gray-600">{log.action}</span>
                                {log.errorMessage && <span className="text-xs text-red-500">{log.errorMessage}</span>}
                                <span className="text-xs text-gray-400 flex-shrink-0">{formatDateTime(log.createdAt!)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
