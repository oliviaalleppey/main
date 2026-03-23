import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getGuestBookingById } from "@/lib/services/guest-bookings";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Download, PhoneCall, Mail, AlertCircle, Info } from "lucide-react";

export const metadata = {
    title: "Booking Details | Olivia International Hotel",
    description: "View the details of your reservation.",
};

export default async function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    
    const session = await auth();

    if (!session || !session.user?.email) {
        redirect("/api/auth/signin?callbackUrl=/my-bookings");
    }

    const booking = await getGuestBookingById(session.user.email, resolvedParams.id);

    if (!booking) {
        return (
            <main className="min-h-screen bg-[#F6F1E8] pt-32 pb-20 px-4 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-serif mb-2">Booking Not Found</h1>
                    <p className="text-gray-600 mb-6">We couldn't find this reservation in your account.</p>
                    <Link href="/my-bookings" className="text-[#0A332B] font-bold underline underline-offset-4">Return to My Bookings</Link>
                </div>
            </main>
        );
    }

    const checkInDate = new Date(booking.checkIn || new Date());
    const checkOutDate = new Date(booking.checkOut || new Date());
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const now = new Date();
    const isPast = checkInDate < now;
    const isCancelled = booking.status === 'cancelled';

    return (
        <main className="min-h-screen bg-[#F6F1E8] pt-28 pb-20 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/my-bookings" className="inline-flex items-center gap-2 text-sm font-bold text-[#0A332B] hover:opacity-70 transition-opacity mb-8 uppercase tracking-widest">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Bookings
                </Link>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-sm font-bold text-gray-400 tracking-widest uppercase">Booking Reference</span>
                            <span className="bg-white border border-gray-200 px-3 py-1 rounded-sm text-sm font-bold text-[#1C1C1C] shadow-sm tracking-wider">{booking.bookingNumber}</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif text-[#1C1C1C]">Your Reservation</h1>
                        <p className="text-gray-600 mt-2">Placed on {format(new Date(booking.createdAt || new Date()), 'MMMM dd, yyyy')}</p>
                    </div>

                    <div className="flex gap-3">
                        {!isCancelled && (
                            <Link href={`/my-bookings/${booking.id}/invoice`} target="_blank" className="flex items-center gap-2 bg-[#0A332B] hover:bg-[#15443B] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
                                <Download className="w-4 h-4" />
                                Print / Download Confirmation
                            </Link>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Status Banner */}
                        {isCancelled ? (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-red-800">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold">Booking Cancelled</h4>
                                    <p className="text-sm mt-0.5">This reservation has been cancelled. If a refund was applicable, it has been processed to your original payment method.</p>
                                </div>
                            </div>
                        ) : booking.status === 'confirmed' ? (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 text-emerald-800">
                                <Info className="w-5 h-5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold">Booking Confirmed</h4>
                                    <p className="text-sm mt-0.5">Your reservation is confirmed. We look forward to welcoming you.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800">
                                <Info className="w-5 h-5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold">Pending Confirmation</h4>
                                    <p className="text-sm mt-0.5">Your reservation is currently being processed by our staff.</p>
                                </div>
                            </div>
                        )}

                        {/* Stay Information */}
                        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <h2 className="bg-[#1C1C1C] text-white px-6 py-4 text-lg font-serif">Stay Information</h2>
                            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="col-span-2 md:col-span-1 border-r border-gray-100 last:border-0 md:pr-4">
                                    <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Check-in</p>
                                    <p className="font-bold text-[#1C1C1C] whitespace-nowrap">{format(checkInDate, 'MMM dd, yyyy')}</p>
                                    <p className="text-sm text-gray-500 mt-1">From 2:00 PM</p>
                                </div>
                                <div className="col-span-2 md:col-span-1 border-r border-gray-100 last:border-0 md:pr-4">
                                    <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Check-out</p>
                                    <p className="font-bold text-[#1C1C1C] whitespace-nowrap">{format(checkOutDate, 'MMM dd, yyyy')}</p>
                                    <p className="text-sm text-gray-500 mt-1">Until 12:00 PM</p>
                                </div>
                                <div className="col-span-2 md:col-span-1 border-r border-gray-100 last:border-0 md:pr-4">
                                    <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Duration</p>
                                    <p className="font-bold text-[#1C1C1C]">{nights} Night{nights > 1 ? 's' : ''}</p>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Guests</p>
                                    <p className="font-bold text-[#1C1C1C]">{booking.adults} Adult{booking.adults > 1 ? 's' : ''}</p>
                                    {(booking.children || 0) > 0 && <p className="text-sm text-gray-500 mt-1">{booking.children} Child{(booking.children || 0) > 1 ? 'ren' : ''}</p>}
                                </div>
                            </div>
                        </section>

                        {/* Room & Guest Details */}
                        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-50">
                                <h3 className="text-lg font-serif mb-4">Reserved Rooms</h3>
                                <div className="space-y-4">
                                    {booking.items?.map((item: any) => (
                                        <div key={item.id} className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 last:border-0">
                                            <div>
                                                <p className="font-semibold text-[#1C1C1C]">{item.roomTypeName}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{item.quantity} Room{item.quantity > 1 ? 's' : ''}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Guest Contact Info</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500 mb-0.5">Name</p>
                                        <p className="font-medium text-[#1C1C1C]">{booking.guestName}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 mb-0.5">Email</p>
                                        <p className="font-medium text-[#1C1C1C]">{booking.guestEmail}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 mb-0.5">Phone</p>
                                        <p className="font-medium text-[#1C1C1C]">{booking.guestPhone}</p>
                                    </div>
                                    {booking.specialRequests && (
                                        <div className="md:col-span-2 mt-2">
                                            <p className="text-gray-500 mb-0.5">Special Requests</p>
                                            <p className="font-medium text-[#1C1C1C] italic">"{booking.specialRequests}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Cancellation Policy / Help */}
                        <section id="cancellation" className="bg-[#1C1C1C] rounded-2xl p-6 text-white shadow-xl">
                            <h3 className="text-xl font-serif mb-3">Modifications & Cancellations</h3>
                            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                                To ensure the highest level of service, all modifications and cancellations to your reservation are handled personally by our hospitality team. Please review our standard cancellation policy:
                            </p>
                            <ul className="text-sm text-gray-300 space-y-2 mb-6 list-disc list-inside opacity-90">
                                <li>Free cancellation up to 48 hours prior to check-in.</li>
                                <li>Cancellations within 48 hours will incur a one-night room charge.</li>
                                <li>No-shows are charged the full booking amount.</li>
                            </ul>
                            
                            <div className="bg-[#2A2A2A] rounded-xl p-5 border border-white/10">
                                <p className="text-sm font-bold uppercase tracking-widest text-white/70 mb-4">Contact us to cancel or modify</p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <a href="tel:+918075416514" className="flex items-center justify-center gap-2 bg-white text-[#1C1C1C] hover:bg-gray-100 px-5 py-3 rounded-lg text-sm font-bold transition-colors w-full sm:w-auto">
                                        <PhoneCall className="w-4 h-4" />
                                        +91 80754 16514
                                    </a>
                                    <a href="mailto:reservations@oliviaalleppey.com" className="flex items-center justify-center gap-2 bg-transparent text-white border border-white/30 hover:bg-white/5 px-5 py-3 rounded-lg text-sm font-bold transition-colors w-full sm:w-auto">
                                        <Mail className="w-4 h-4" />
                                        Email Reservations
                                    </a>
                                </div>
                            </div>
                        </section>
                        
                        {!isPast && !isCancelled && (
                            <div className="flex justify-end mt-4">
                                <a href="#cancellation" className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-6 py-3 rounded-lg text-sm font-bold transition-colors">
                                    Cancel Booking Request
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Order Summary */}
                    <div className="lg:col-span-1">
                        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 sticky top-32 overflow-hidden">
                            <div className="bg-[#0A332B] px-6 py-4">
                                <h2 className="text-white text-lg font-serif">Payment Summary</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Payment Status</span>
                                    {booking.paymentStatus === 'success' ? (
                                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase text-[10px] tracking-wider border border-emerald-200">Paid in Full</span>
                                    ) : (
                                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded uppercase text-[10px] tracking-wider border border-amber-200">Pending</span>
                                    )}
                                </div>
                                <div className="h-px bg-gray-100 w-full" />
                                
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Room Charges</span>
                                    <span className="font-medium text-[#1C1C1C]">₹ {(booking.subtotal / 100).toLocaleString('en-IN')}</span>
                                </div>

                                {booking.addOns && booking.addOns.length > 0 && (
                                    <>
                                        <div className="pt-2">
                                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Included Add-ons</p>
                                            <div className="space-y-2">
                                                {booking.addOns.map((addon: any) => (
                                                    <div key={addon.id} className="flex justify-between text-xs">
                                                        <span className="text-gray-600">{addon.name} x {addon.quantity}</span>
                                                        <span className="font-medium text-[#1C1C1C]">₹ {(addon.subtotal / 100).toLocaleString('en-IN')}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="flex justify-between text-sm pt-2">
                                    <span className="text-gray-600">Taxes & Fees</span>
                                    <span className="font-medium text-[#1C1C1C]">₹ {((booking.taxAmount || 0) / 100).toLocaleString('en-IN')}</span>
                                </div>

                                <div className="h-px bg-gray-100 w-full" />

                                <div className="flex justify-between items-end pt-2">
                                    <span className="text-[#1C1C1C] font-serif text-lg">Total</span>
                                    <span className="font-bold text-[#1C1C1C] text-xl">₹ {(booking.totalAmount / 100).toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </main>
    );
}
