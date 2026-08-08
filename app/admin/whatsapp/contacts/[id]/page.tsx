import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, MessageSquare, ShieldCheck } from 'lucide-react';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
    waContacts, waConsentEvents, waMessages, waTemplates, guestProfiles, bookings,
} from '@/lib/db/schema';
import { desc, eq, or, sql } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';
import { ConsentBadge, CONSENT_META, type ConsentStatus } from '@/components/admin/whatsapp/consent-badge';
import { ContactActions } from '@/components/admin/whatsapp/contact-actions';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SOURCE_LABELS: Record<string, string> = {
    booking: 'Booking',
    guest_profile: 'Guest profile',
    inquiry: 'Inquiry',
    import: 'Import',
    inbound: 'Inbound message',
    manual: 'Added by hand',
};

const MESSAGE_STATUS_STYLES: Record<string, string> = {
    queued: 'bg-gray-100 text-gray-600',
    sending: 'bg-blue-100 text-blue-800',
    sent: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
    read: 'bg-green-600 text-white',
    failed: 'bg-red-100 text-red-800',
    skipped: 'bg-amber-100 text-amber-900',
    cancelled: 'bg-gray-200 text-gray-600',
};

function formatDateTime(value: Date | string | null | undefined): string {
    if (!value) return '—';
    return new Date(value).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}

function formatDate(value: Date | string | null | undefined): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default async function WhatsAppContactDetailPage({ params }: PageProps) {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') redirect('/signin');

    const { id } = await params;
    if (!UUID.test(id)) notFound();

    const [row] = await db
        .select({
            contact: waContacts,
            guest: {
                id: guestProfiles.id,
                firstName: guestProfiles.firstName,
                lastName: guestProfiles.lastName,
                email: guestProfiles.email,
                totalStays: guestProfiles.totalStays,
                totalSpent: guestProfiles.totalSpent,
                lastStayAt: guestProfiles.lastStayAt,
                vipLevel: guestProfiles.vipLevel,
                city: guestProfiles.city,
                dateOfBirth: guestProfiles.dateOfBirth,
                anniversary: guestProfiles.anniversary,
            },
        })
        .from(waContacts)
        .leftJoin(guestProfiles, eq(waContacts.guestProfileId, guestProfiles.id))
        .where(eq(waContacts.id, id))
        .limit(1);

    if (!row) notFound();

    const { contact, guest } = row;

    // Bookings are matched on the guest profile when one is linked, and otherwise
    // on the last 10 digits of the number — booking rows store whatever the guest
    // typed, so an exact match on the E.164 form would find almost nothing.
    const phoneSuffix = contact.phone.replace(/\D/g, '').slice(-10);
    const bookingHistory = await db
        .select({
            id: bookings.id,
            bookingNumber: bookings.bookingNumber,
            checkIn: bookings.checkIn,
            checkOut: bookings.checkOut,
            status: bookings.status,
            totalAmount: bookings.totalAmount,
        })
        .from(bookings)
        .where(
            or(
                contact.guestProfileId ? eq(bookings.guestProfileId, contact.guestProfileId) : undefined,
                phoneSuffix.length === 10
                    ? sql`regexp_replace(${bookings.guestPhone}, '\\D', '', 'g') LIKE ${`%${phoneSuffix}`}`
                    : undefined,
            ),
        )
        .orderBy(desc(bookings.checkIn))
        .limit(25);

    const [messages, consentHistory] = await Promise.all([
        db
            .select({
                id: waMessages.id,
                status: waMessages.status,
                direction: waMessages.direction,
                renderedBody: waMessages.renderedBody,
                errorDetail: waMessages.errorDetail,
                skipReason: waMessages.skipReason,
                cost: waMessages.cost,
                queuedAt: waMessages.queuedAt,
                sentAt: waMessages.sentAt,
                deliveredAt: waMessages.deliveredAt,
                readAt: waMessages.readAt,
                failedAt: waMessages.failedAt,
                templateName: waTemplates.name,
                templateCategory: waTemplates.category,
            })
            .from(waMessages)
            .leftJoin(waTemplates, eq(waMessages.templateId, waTemplates.id))
            .where(eq(waMessages.contactId, id))
            .orderBy(desc(waMessages.queuedAt))
            .limit(100),
        db
            .select()
            .from(waConsentEvents)
            .where(eq(waConsentEvents.contactId, id))
            .orderBy(desc(waConsentEvents.createdAt)),
    ]);

    const tags = (contact.tags as string[] | null) ?? [];
    const consentMeta = CONSENT_META[contact.consentStatus as ConsentStatus] ?? CONSENT_META.pending;

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href="/admin/whatsapp/contacts"
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to contacts
                </Link>
            </div>

            {/* Identity + consent */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">{contact.name || 'Unnamed contact'}</h2>
                        <p className="mt-0.5 font-mono text-sm text-gray-600">{contact.phone}</p>
                        {contact.email && <p className="text-sm text-gray-500">{contact.email}</p>}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <ConsentBadge status={contact.consentStatus} />
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                {SOURCE_LABELS[contact.source] ?? contact.source}
                            </span>
                            {tags.map((tag) => (
                                <span key={tag} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                    <ContactActions
                        contactId={contact.id}
                        phone={contact.phone}
                        consentStatus={contact.consentStatus as ConsentStatus}
                        name={contact.name}
                        email={contact.email}
                        tags={tags}
                        notes={contact.notes}
                    />
                </div>

                <p className="mt-4 rounded-md bg-gray-50 p-3 text-sm text-gray-600">{consentMeta.meaning}</p>

                <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Consent source" value={contact.consentSource ?? '—'} />
                    <Field label="Consent recorded" value={formatDate(contact.consentAt)} />
                    <Field label="Opted out" value={formatDate(contact.optedOutAt)} />
                    <Field label="Marketing sent (30d)" value={String(contact.marketingSent30d ?? 0)} />
                    <Field label="Last message sent" value={formatDateTime(contact.lastOutboundAt)} />
                    <Field label="Last reply" value={formatDateTime(contact.lastInboundAt)} />
                    <Field label="Added" value={formatDate(contact.createdAt)} />
                    <Field label="Failures" value={String(contact.failureCount ?? 0)} />
                </dl>

                {contact.provenanceNote && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Provenance</p>
                        <p className="mt-1 text-sm text-gray-700">{contact.provenanceNote}</p>
                    </div>
                )}

                {contact.notes && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Internal notes</p>
                        <p className="mt-1 text-sm text-gray-700">{contact.notes}</p>
                    </div>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Guest record */}
                <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <h3 className="text-sm font-semibold text-gray-900">Guest record</h3>
                    {guest?.id ? (
                        <>
                            <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                                <Field label="Name" value={`${guest.firstName ?? ''} ${guest.lastName ?? ''}`.trim() || '—'} />
                                <Field label="Email" value={guest.email ?? '—'} />
                                <Field label="City" value={guest.city ?? '—'} />
                                <Field label="VIP level" value={guest.vipLevel ?? '—'} />
                                <Field label="Total stays" value={String(guest.totalStays ?? 0)} />
                                <Field label="Total spent" value={formatCurrency(guest.totalSpent ?? 0)} />
                                <Field label="Last stay" value={formatDate(guest.lastStayAt)} />
                                <Field label="Birthday" value={formatDate(guest.dateOfBirth)} />
                            </dl>
                        </>
                    ) : (
                        <p className="mt-2 text-sm text-gray-500">
                            Not linked to a guest profile. Linking happens automatically when a booking is made with
                            this number.
                        </p>
                    )}

                    <h4 className="mt-5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Bookings ({bookingHistory.length})
                    </h4>
                    {bookingHistory.length ? (
                        <ul className="mt-2 divide-y divide-gray-100 text-sm">
                            {bookingHistory.map((booking) => (
                                <li key={booking.id} className="flex items-center justify-between gap-3 py-2">
                                    <div>
                                        <Link
                                            href={`/admin/bookings?bookingNum=${booking.bookingNumber}`}
                                            className="font-medium text-gray-900 hover:underline"
                                        >
                                            {booking.bookingNumber}
                                        </Link>
                                        <p className="text-xs text-gray-500">
                                            {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)} · {booking.status}
                                        </p>
                                    </div>
                                    <span className="text-sm text-gray-700">{formatCurrency(booking.totalAmount)}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-2 text-sm text-gray-500">No bookings found for this number.</p>
                    )}
                </div>

                {/* Consent ledger */}
                <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-gray-400" />
                        <h3 className="text-sm font-semibold text-gray-900">Consent history</h3>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        Append-only. This is the proof of what was agreed, by whom and when.
                    </p>

                    {consentHistory.length ? (
                        <ol className="mt-4 space-y-3">
                            {consentHistory.map((event) => (
                                <li key={event.id} className="border-l-2 border-gray-200 pl-3">
                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                        {event.fromStatus && (
                                            <>
                                                <ConsentBadge status={event.fromStatus} />
                                                <span className="text-gray-400">→</span>
                                            </>
                                        )}
                                        <ConsentBadge status={event.toStatus} />
                                        <span className="text-xs text-gray-400">{formatDateTime(event.createdAt)}</span>
                                    </div>
                                    {event.reason && <p className="mt-1 text-sm text-gray-700">{event.reason}</p>}
                                    <p className="mt-0.5 text-xs text-gray-500">
                                        {event.source ?? 'unknown source'}
                                        {event.actorEmail ? ` · ${event.actorEmail}` : ' · system'}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p className="mt-4 text-sm text-gray-500">
                            No consent events recorded. This contact has never moved from the state it was created in.
                        </p>
                    )}
                </div>
            </div>

            {/* Message timeline */}
            <div className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-900">Message history</h3>
                </div>

                {messages.length ? (
                    <ol className="mt-4 space-y-3">
                        {messages.map((message) => (
                            <li key={message.id} className="rounded-md border border-gray-100 p-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${MESSAGE_STATUS_STYLES[message.status] ?? 'bg-gray-100 text-gray-600'}`}
                                    >
                                        {message.status}
                                    </span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {message.templateName ?? (message.direction === 'inbound' ? 'Inbound reply' : 'Message')}
                                    </span>
                                    {message.templateCategory && (
                                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                                            {message.templateCategory}
                                        </span>
                                    )}
                                    <span className="ml-auto text-xs text-gray-400">
                                        {formatDateTime(message.sentAt ?? message.queuedAt)}
                                    </span>
                                </div>
                                {message.renderedBody && (
                                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{message.renderedBody}</p>
                                )}
                                {(message.errorDetail || message.skipReason) && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {message.errorDetail ?? `Skipped: ${message.skipReason}`}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-gray-400">
                                    {[
                                        message.sentAt && `sent ${formatDateTime(message.sentAt)}`,
                                        message.deliveredAt && `delivered ${formatDateTime(message.deliveredAt)}`,
                                        message.readAt && `read ${formatDateTime(message.readAt)}`,
                                        message.failedAt && `failed ${formatDateTime(message.failedAt)}`,
                                    ]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </p>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p className="mt-3 text-sm text-gray-500">
                        Nothing sent yet. Message history appears here once the dispatcher goes live.
                    </p>
                )}
            </div>
        </div>
    );
}

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
            <dd className="mt-0.5 text-gray-900">{value}</dd>
        </div>
    );
}
