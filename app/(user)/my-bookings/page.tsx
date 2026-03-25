import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getGuestBookings } from "@/lib/services/guest-bookings";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, ChevronRight, MapPin, ReceiptText } from "lucide-react";
import Image from "next/image";

export const metadata = {
    title: "My Bookings | Olivia International Hotel",
    description: "View and manage your reservations.",
};

export default async function MyBookingsPage() {
    const session = await auth();

    if (!session || !session.user?.email) {
        redirect("/api/auth/signin?callbackUrl=/my-bookings");
    }

    const bookings = await getGuestBookings(session.user.email);
    
    // Sort and categorize
    const now = new Date();
    const upcomingBookings = bookings.filter(b => new Date(b.checkIn) >= now && b.status !== 'cancelled');
    const pastBookings = bookings.filter(b => new Date(b.checkIn) < now && b.status !== 'cancelled');
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

    const renderBookingCard = (booking: any) => {
        const checkIn = new Date(booking.checkIn);
        const checkOut = new Date(booking.checkOut);
        
        return (
            <div key={booking.id} className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 transition-all hover:shadow-md">
                <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-700">
                            <span className="opacity-60">ID:</span> {booking.bookingNumber}
                        </div>
                        {booking.status === 'cancelled' ? (
                            <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-md uppercase tracking-wide">Cancelled</span>
                        ) : booking.status === 'confirmed' ? (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md uppercase tracking-wide">Confirmed</span>
                        ) : (
                            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md uppercase tracking-wide">Pending</span>
                        )}
                    </div>
                    
                    <div>
                        <h3 className="font-serif text-2xl text-[var(--text-dark)]">
                            {booking.items?.[0]?.roomTypeName || 'Deluxe Room'}
                            {booking.items?.length > 1 && ` + ${booking.items.length - 1} more`}
                        </h3>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span>{format(checkIn, 'MMM dd')} - {format(checkOut, 'MMM dd, yyyy')}</span>
                            </div>
                            <span className="text-gray-300">|</span>
                            <span>{booking.adults} Adult{booking.adults > 1 ? 's' : ''}{booking.children > 0 ? `, ${booking.children} Children` : ''}</span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Total Amount</p>
                            <p className="font-medium text-[var(--text-dark)]">₹ {(booking.totalAmount / 100).toLocaleString('en-IN')}</p>
                        </div>
                        
                        <Link 
                            href={`/my-bookings/${booking.id}`} 
                            className="inline-flex items-center justify-center gap-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                        >
                            View Details
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <main className="min-h-screen bg-[var(--surface-cream)] pt-28 pb-20 px-4 md:px-8">
            <div className="max-w-4xl mx-auto space-y-12">
                
                {/* Header */}
                <div>
                    <h1 className="text-4xl md:text-5xl font-serif text-[var(--text-dark)] mb-3">My Bookings</h1>
                    <p className="text-gray-600 font-medium">Manage your stays and view your booking history.</p>
                </div>

                {bookings.length === 0 ? (
                    <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ReceiptText className="w-8 h-8 text-gray-300" />
                        </div>
                        <h2 className="text-xl font-serif text-[var(--text-dark)] mb-2">No Bookings Found</h2>
                        <p className="text-gray-500 mb-6">Looks like you haven't made any reservations yet.</p>
                        <Link 
                            href="/book/search" 
                            className="inline-flex items-center justify-center bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white px-8 py-3 rounded-xl text-sm font-semibold tracking-wide uppercase transition-colors"
                        >
                            Explore Rooms
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {upcomingBookings.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold uppercase tracking-[0.15em] text-[var(--brand-primary)] mb-6 flex items-center gap-3">
                                    Upcoming Stays
                                    <span className="flex-1 h-px bg-[var(--brand-primary)]/20"></span>
                                </h2>
                                <div className="space-y-4">
                                    {upcomingBookings.map(renderBookingCard)}
                                </div>
                            </section>
                        )}
                        
                        {pastBookings.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold uppercase tracking-[0.15em] text-gray-500 mb-6 flex items-center gap-3">
                                    Past Stays
                                    <span className="flex-1 h-px bg-gray-200"></span>
                                </h2>
                                <div className="space-y-4">
                                    {pastBookings.map(renderBookingCard)}
                                </div>
                            </section>
                        )}

                        {cancelledBookings.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold uppercase tracking-[0.15em] text-gray-500 mb-6 flex items-center gap-3">
                                    Cancelled Bookings
                                    <span className="flex-1 h-px bg-gray-200"></span>
                                </h2>
                                <div className="space-y-4 opacity-75">
                                    {cancelledBookings.map(renderBookingCard)}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
