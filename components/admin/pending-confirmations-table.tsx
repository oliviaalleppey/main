'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export type PendingConfirmationItem = {
    id: string;
    bookingNumber: string;
    guestName: string;
    guestEmail: string;
    checkIn: string;
    checkOut: string;
    status: string;
    retryCount: number;
    updatedAt: string | null;
    totalAmount: number;
};

type PendingConfirmationsTableProps = {
    items: PendingConfirmationItem[];
    maxRetries: number;
};

function formatCurrency(amountInPaise: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amountInPaise / 100);
}

function formatShortDate(value: string): string {
    return new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
    });
}

function formatDateTime(value: string | null): string {
    if (!value) return '-';
    return new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function PendingConfirmationsTable({ items, maxRetries }: PendingConfirmationsTableProps) {
    const router = useRouter();
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Record<string, string>>({});

    const retryBooking = async (bookingId: string) => {
        setLoadingId(bookingId);

        try {
            const response = await fetch(`/api/admin/bookings/${bookingId}/retry-confirmation`, {
                method: 'POST',
            });

            const data = await response.json() as {
                success?: boolean;
                message?: string;
                error?: string;
                result?: {
                    status?: string;
                    success?: boolean;
                    message?: string;
                };
            };

            if (!response.ok) {
                const errorMessage = data.error || 'Retry failed';
                setMessages((prev) => ({ ...prev, [bookingId]: errorMessage }));
                return;
            }

            const status =
                data.result?.status ||
                (data.result?.success ? 'confirmed' : 'pending_retry');

            setMessages((prev) => ({
                ...prev,
                [bookingId]: data.message || `Retry executed (${status})`,
            }));
            router.refresh();
        } catch {
            setMessages((prev) => ({
                ...prev,
                [bookingId]: 'Network error while retrying. Try again.',
            }));
        } finally {
            setLoadingId(null);
        }
    };

    if (items.length === 0) {
        return (
            <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
                No pending confirmations right now.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                    <tr>
                        <th className="px-4 py-3 text-left font-medium">Booking</th>
                        <th className="px-4 py-3 text-left font-medium">Guest</th>
                        <th className="px-4 py-3 text-left font-medium">Stay</th>
                        <th className="px-4 py-3 text-left font-medium">Amount</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-left font-medium">Retries</th>
                        <th className="px-4 py-3 text-left font-medium">Updated</th>
                        <th className="px-4 py-3 text-left font-medium">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => {
                        const atRetryLimit = item.retryCount >= maxRetries;
                        const message = messages[item.id];

                        return (
                            <tr key={item.id} className="border-t align-top">
                                <td className="px-4 py-3">
                                    <p className="font-medium text-gray-900">{item.bookingNumber}</p>
                                    <p className="text-xs text-gray-500">{item.id.slice(0, 8)}...</p>
                                </td>
                                <td className="px-4 py-3">
                                    <p className="font-medium text-gray-900">{item.guestName}</p>
                                    <p className="text-xs text-gray-500">{item.guestEmail}</p>
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                    {formatShortDate(item.checkIn)} - {formatShortDate(item.checkOut)}
                                </td>
                                <td className="px-4 py-3 font-medium text-gray-900">
                                    {formatCurrency(item.totalAmount)}
                                </td>
                                <td className="px-4 py-3">
                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                        {item.status.replace('_', ' ')}
                                    </span>
                                    {message && (
                                        <p className="mt-2 max-w-[230px] text-xs text-gray-600">{message}</p>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                    {item.retryCount}/{maxRetries}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {formatDateTime(item.updatedAt)}
                                </td>
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => retryBooking(item.id)}
                                        disabled={loadingId === item.id || atRetryLimit}
                                        className="rounded-md bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                                    >
                                        {loadingId === item.id ? 'Retrying...' : atRetryLimit ? 'Limit Reached' : 'Retry Now'}
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
