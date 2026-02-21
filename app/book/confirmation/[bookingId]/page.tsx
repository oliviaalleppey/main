import { db } from '@/lib/db';
import { bookings, bookingConfirmations, roomTypes, bookingItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2, Copy } from 'lucide-react';
import { ensureRoomTypeMinOccupancyColumn } from '@/lib/db/schema-guard';

// Format helper
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount / 100);
};

export default async function ConfirmationPage({ params }: { params: Promise<{ bookingId: string }> }) {
    await ensureRoomTypeMinOccupancyColumn();

    const { bookingId } = await params;
    const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
    });

    if (!booking) return <div>Booking not found</div>;

    const confirmation = await db.query.bookingConfirmations.findFirst({
        where: eq(bookingConfirmations.bookingId, booking.id)
    });

    // Fetch Booking Items and Room Type
    const bookingItemsData = await db.query.bookingItems.findMany({
        where: eq(bookingItems.bookingId, booking.id)
    });

    let roomName = 'Luxury Room';
    let totalRooms = 1;
    if (bookingItemsData.length > 0) {
        const itemSummaries = await Promise.all(bookingItemsData.map(async (item) => {
            const roomType = await db.query.roomTypes.findFirst({
                where: eq(roomTypes.id, item.roomTypeId)
            });

            const quantity = Math.max(1, item.quantity || 1);
            return {
                name: roomType?.name || 'Room',
                quantity,
            };
        }));

        totalRooms = itemSummaries.reduce((sum, item) => sum + item.quantity, 0);
        roomName = itemSummaries
            .map((item) => `${item.name}${item.quantity > 1 ? ` x ${item.quantity}` : ''}`)
            .join(', ');
    }

    // Determine Status Message & Icon
    let statusTitle = "Booking Confirmed!";
    let statusMsg = "Thank you for choosing Olivia International.";
    let icon = <CheckCircle2 className="w-10 h-10 text-green-600" />;
    let iconBg = "bg-green-100";

    if (booking.status === 'pending_payment' || booking.paymentStatus === 'pending') {
        statusTitle = "Payment Pending";
        statusMsg = "We are waiting for your payment to be confirmed.";
        icon = <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />;
        iconBg = "bg-yellow-50";
    } else if (booking.status === 'payment_success' || booking.status === 'booking_requested') {
        statusTitle = "Payment Received, Confirmation Pending";
        statusMsg = "Your payment is successful. We are finalizing reservation confirmation with the hotel system. You will receive confirmation shortly.";
        icon = <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />;
        iconBg = "bg-blue-50";
    } else if (booking.status === 'failed') {
        statusTitle = "Booking Failed";
        statusMsg = "There was an issue completing your reservation. Please contact support.";
        icon = <div className="text-red-600 text-4xl">!</div>; // Icon placeholder
        iconBg = "bg-red-100";
    }

    return (
        <div className="min-h-screen bg-[#FBFBF9] py-20 px-6 flex items-center justify-center">
            <div className="bg-white max-w-2xl w-full p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
                <div className="flex justify-center mb-6">
                    <div className={`w-20 h-20 ${iconBg} rounded-full flex items-center justify-center`}>
                        {icon}
                    </div>
                </div>

                <h1 className="text-3xl font-serif mb-2">{statusTitle}</h1>
                <p className="text-gray-500 mb-8">{statusMsg}</p>

                {(booking.status === 'payment_success' || booking.status === 'booking_requested') && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-900 text-sm rounded-lg p-4 mb-8 max-w-lg mx-auto">
                        If confirmation is delayed, please contact reservations and share your booking reference.
                    </div>
                )}

                {(booking.status === 'confirmed') && (
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8 max-w-md mx-auto relative">
                        <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Confirmation Number</p>
                        <p className="text-2xl font-mono font-bold text-[#1C1C1C] flex items-center justify-center gap-2">
                            {confirmation?.confirmationNumber || booking.bookingNumber}
                            <Copy className="w-4 h-4 text-gray-400 cursor-pointer" />
                        </p>
                    </div>
                )}

                <div className="space-y-4 text-left max-w-md mx-auto mb-10 text-sm">
                    <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                        <span className="text-gray-500">Guest Name</span>
                        <span className="font-medium text-right">{booking.guestName}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                        <span className="text-gray-500">Room Type</span>
                        <span className="font-medium text-right">{roomName}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                        <span className="text-gray-500">Rooms</span>
                        <span className="font-medium text-right">{totalRooms}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                        <span className="text-gray-500">Dates</span>
                        <span className="font-medium text-right">
                            {new Date(booking.checkIn).toLocaleDateString()} - <br />
                            {new Date(booking.checkOut).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <span className="text-gray-500">Total Paid</span>
                        <span className="font-medium text-right font-serif text-lg">{formatCurrency(booking.totalAmount)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <span className="text-gray-500">Status</span>
                        <span className="font-medium text-right capitalize">{(booking.status || 'unknown').replace('_', ' ')}</span>
                    </div>
                </div>

                <div className="flex gap-4 justify-center">
                    <Link href="/">
                        <Button variant="outline" className="px-8 py-6 rounded-none">Return Home</Button>
                    </Link>
                    {booking.status === 'confirmed' && (
                        <Button className="bg-[#1C1C1C] text-white px-8 py-6 rounded-none hover:bg-[#E95D20] transition-colors">
                            Download Voucher
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
