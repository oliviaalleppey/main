'use client';

import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface RoomBookingsListProps {
    bookings: any[];
    title?: string;
}

export function RoomBookingsList({ bookings, title = "Upcoming Bookings" }: RoomBookingsListProps) {
    if (!bookings || bookings.length === 0) {
        return (
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">{title}</h3>
                <p className="text-sm text-gray-500">No bookings found.</p>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <div className="space-y-4">
                {bookings.map((booking) => (
                    <div key={booking.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md border text-sm">
                        <div>
                            <p className="font-medium">{booking.guestName}</p>
                            <p className="text-xs text-gray-500">
                                {format(new Date(booking.checkIn), 'MMM d')} - {format(new Date(booking.checkOut), 'MMM d, yyyy')}
                            </p>
                        </div>
                        <div className="text-right">
                            <Badge variant="outline" className="mb-1">
                                {booking.status}
                            </Badge>
                            <br />
                            <Link href={`/admin/bookings/${booking.id}`} className="text-blue-600 hover:underline text-xs">
                                View
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
