'use client';

import { useState } from 'react';
import { deleteBookingAction } from './actions';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function DeleteBookingButton({ bookingId }: { bookingId: string }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        const confirmText = prompt("Type 'delete' to confirm you want to remove this booking completely:");
        if (confirmText !== 'delete') {
            if (confirmText !== null) {
                alert('Confirmation text did not match. Booking was NOT deleted.');
            }
            return;
        }

        setIsDeleting(true);
        try {
            const res = await deleteBookingAction(bookingId);
            if (res.success) {
                router.refresh();
            } else {
                alert('Failed to delete booking: ' + res.error);
            }
        } catch (error) {
            console.error('Delete error', error);
            alert('An error occurred while deleting the booking.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`p-1.5 rounded-md text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Delete Booking"
        >
            <Trash2 className="w-4 h-4" />
        </button>
    );
}
