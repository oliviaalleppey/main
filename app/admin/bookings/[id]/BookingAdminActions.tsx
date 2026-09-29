'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ban, RotateCcw } from 'lucide-react';
import { cancelBookingAction, markRefundedAction } from '../actions';

/**
 * Cancel / mark-refunded controls for an administrator. The server decides
 * again whether each is allowed; these flags only decide what is shown.
 */
export function BookingAdminActions({
    bookingId,
    bookingNumber,
    canCancel,
    canMarkRefunded,
}: {
    bookingId: string;
    bookingNumber: string;
    canCancel: boolean;
    canMarkRefunded: boolean;
}) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);

    if (!canCancel && !canMarkRefunded) return null;

    const run = async (work: () => Promise<{ success: boolean; error?: string }>) => {
        setBusy(true);
        try {
            const result = await work();
            if (result.success) router.refresh();
            else alert(result.error || 'That did not work.');
        } catch (error) {
            console.error(error);
            alert('Something went wrong. Nothing was changed.');
        } finally {
            setBusy(false);
        }
    };

    const handleCancel = () => {
        const reason = prompt(
            `Cancel ${bookingNumber}?\n\n` +
            'This keeps the booking, its payment and its invoice, and stops it being sent to Hotsoft.\n' +
            'It does NOT cancel the room in Hotsoft or refund the guest — do both by hand.\n\n' +
            'Reason for cancelling:',
        );
        if (reason === null) return;
        if (reason.trim().length < 3) {
            alert('Please give a reason. The booking was NOT cancelled.');
            return;
        }
        void run(() => cancelBookingAction(bookingId, reason));
    };

    const handleRefunded = () => {
        const note = prompt(
            `Mark ${bookingNumber} as refunded?\n\n` +
            'Only do this after the refund has been made in Easebuzz.\n\n' +
            'Refund reference or note (optional):',
        );
        if (note === null) return;
        void run(() => markRefundedAction(bookingId, note));
    };

    return (
        <div className="flex items-center gap-2 flex-shrink-0">
            {canCancel && (
                <button
                    type="button"
                    onClick={handleCancel}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                    <Ban className="w-3.5 h-3.5" /> Cancel booking
                </button>
            )}
            {canMarkRefunded && (
                <button
                    type="button"
                    onClick={handleRefunded}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    <RotateCcw className="w-3.5 h-3.5" /> Mark refunded
                </button>
            )}
        </div>
    );
}
