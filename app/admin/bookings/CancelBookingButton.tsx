'use client';

import { useState } from 'react';
import { cancelBookingAction } from './actions';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CancelBookingButton({ bookingId, bookingNumber, status }: { bookingId: string; bookingNumber: string; status: string }) {
    const [isPending, setIsPending] = useState(false);
    const router = useRouter();

    if (status === 'cancelled' || status === 'completed') return null;

    const handleCancel = async () => {
        const confirmed = window.confirm(`Cancel booking ${bookingNumber}?\n\nThis will free up the dates and rooms. The booking record will remain for reference.`);
        if (!confirmed) return;

        setIsPending(true);
        try {
            const res = await cancelBookingAction(bookingId);
            if (res.success) {
                router.refresh();
            } else {
                alert('Failed to cancel: ' + res.error);
            }
        } catch {
            alert('An error occurred while cancelling the booking.');
        } finally {
            setIsPending(false);
        }
    };

    return (
        <button
            onClick={handleCancel}
            disabled={isPending}
            className={`p-1.5 rounded-md text-amber-500 hover:bg-amber-50 hover:text-amber-700 transition-colors ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Cancel Booking"
        >
            <X className="w-4 h-4" />
        </button>
    );
}
