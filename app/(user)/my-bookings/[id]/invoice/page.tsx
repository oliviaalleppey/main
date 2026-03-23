import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getGuestBookingById } from "@/lib/services/guest-bookings";
import { format } from "date-fns";
import Image from "next/image";
import { AutoPrint, PrintButton } from "@/components/booking/invoice-actions";

export const metadata = {
    title: "Reservation Confirmation | Olivia International Hotel",
    description: "Your booking confirmation invoice.",
};

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    
    // In a real production app, if you want admins to also download invoices, 
    // you might allow checking by booking ID without session user matching, 
    // but for now we enforce the current logged-in guest.
    const session = await auth();

    if (!session || !session.user?.email) {
        redirect("/api/auth/signin?callbackUrl=/my-bookings");
    }

    const booking = await getGuestBookingById(session.user.email, resolvedParams.id);

    if (!booking) {
        return (
            <div className="p-10 text-center font-sans">
                <h1>Booking Not Found</h1>
                <p>This reservation could not be loaded for invoicing.</p>
            </div>
        );
    }

    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const createdDate = new Date(booking.createdAt || new Date());

    // Calculate split taxes (assuming equal CGST / SGST split for the display)
    const totalTax = (booking.taxAmount || 0) / 100;
    const splitTax = totalTax / 2;

    return (
        <main className="min-h-screen bg-white text-black font-sans text-[12px] leading-relaxed p-8 max-w-[1000px] mx-auto print:p-0">
            {/* Auto Print Script */}
            <AutoPrint />

            {/* Print Button (Hidden when printing) */}
            <div className="mb-8 print:hidden flex justify-end">
                <PrintButton />
            </div>

            {/* Header */}
            <div className="text-center mb-6">
                <div className="flex justify-center mb-2">
                    {/* Using an img tag for PDF/Print safety in some browsers */}
                    <img src="/images/olivia-logo.svg" alt="Olivia ALleppey" className="h-[70px] w-auto object-contain" />
                </div>
                <h1 className="font-bold text-[15px]">Olivia International, Finishing Point, Punnamada, Alappuzha - 13</h1>
                <p className="text-[11px] font-medium">GST No.: 32AABCO1416E1Z6</p>
                
                <h2 className="font-bold text-[14px] mt-4 text-left">Reservation Confirmation</h2>
            </div>

            {/* Greeting */}
            <div className="mb-6">
                <p className="font-bold mb-1">Dear {booking.guestName},</p>
                <p className="mb-2">Namaskaram!</p>
                <p className="font-bold mb-2">Warm greetings from Olivia International, Alleppey!</p>
                <p className="mb-4">At the outset, we thank you for choosing Olivia International, Alleppey as your preferred choice. We are delighted to host you and look forward to providing you with a memorable stay.</p>
                <p>Please find your booking details below:</p>
            </div>

            {/* Primary Details Block */}
            <table className="w-full border-collapse border border-black mb-6 text-[11px]">
                <tbody>
                    <tr>
                        <td className="border border-black p-1.5 font-medium w-32">Reservation No.</td>
                        <td className="border border-black p-1.5 font-bold">{booking.bookingNumber}</td>
                        <td className="border border-black p-1.5 font-medium w-32">Status</td>
                        <td className="border border-black p-1.5 font-bold text-red-600">{booking.status === 'confirmed' ? 'Confirm' : (booking.status || 'pending').toUpperCase()}</td>
                    </tr>
                    <tr>
                        <td className="border border-black p-1.5 font-medium">Guest Name</td>
                        <td className="border border-black p-1.5 font-bold uppercase">{booking.guestName}</td>
                        <td className="border border-black p-1.5 font-medium">Reservation Date</td>
                        <td className="border border-black p-1.5 font-bold">{format(createdDate, 'dd/MM/yyyy')}</td>
                    </tr>
                    <tr>
                        <td className="border border-black p-1.5 font-medium">Agent Name</td>
                        <td className="border border-black p-1.5">WEBSITE INTEGRATION</td>
                        <td className="border border-black p-1.5 font-medium">Phone No</td>
                        <td className="border border-black p-1.5">{booking.guestPhone}</td>
                    </tr>
                    <tr>
                        <td className="border border-black p-1.5 font-medium">Country</td>
                        <td className="border border-black p-1.5">INDIA</td>
                        <td className="border border-black p-1.5 font-medium">Payment Mode</td>
                        <td className="border border-black p-1.5">Company</td>
                    </tr>
                    <tr>
                        <td className="border border-black p-1.5 font-medium">Arrival Time</td>
                        <td className="border border-black p-1.5">2:00 PM</td>
                        <td className="border border-black p-1.5 font-medium">Departure Time</td>
                        <td className="border border-black p-1.5">12:00 PM</td>
                    </tr>
                </tbody>
            </table>

            {/* Room Breakdown Grid */}
            <table className="w-full border-collapse border border-black mb-2 text-[10px] text-center">
                <thead>
                    <tr className="bg-gray-50 border-b border-black">
                        <th className="border-r border-black p-2 font-bold w-24 align-top">Room<br/>Category</th>
                        <th className="border-r border-black p-2 font-bold align-top">Checkin</th>
                        <th className="border-r border-black p-2 font-bold align-top">Checkout</th>
                        <th className="border-r border-black p-2 font-bold align-top">Rooms</th>
                        <th className="border-r border-black p-2 font-bold align-top">Night</th>
                        <th className="border-r border-black p-2 font-bold align-top">Meal</th>
                        <th className="border-r border-black p-2 font-bold align-top">Adult</th>
                        <th className="border-r border-black p-2 font-bold align-top">Extra<br/>Adult</th>
                        <th className="border-r border-black p-2 font-bold align-top">Child<br/>W/O<br/>bed</th>
                        <th className="border-r border-black p-2 font-bold align-top">Infant</th>
                        <th className="border-r border-black p-2 font-bold align-top">Rate/Night</th>
                        <th className="border-r border-black p-2 font-bold align-top">Plan/Night</th>
                        <th className="border-r border-black p-2 font-bold align-top">CGST</th>
                        <th className="border-r border-black p-2 font-bold align-top">SGST</th>
                        <th className="border-r border-black p-2 font-bold align-top">Total</th>
                        <th className="p-2 font-bold align-top">Type</th>
                    </tr>
                </thead>
                <tbody>
                    {booking.items?.map((item: any, idx: number) => {
                        const ratePerNight = (item.pricePerNight / 100).toFixed(2);
                        const cgst = splitTax.toFixed(2);
                        const sgst = splitTax.toFixed(2);
                        const totalLineItem = ((item.subtotal + (booking.taxAmount || 0)) / 100).toFixed(2);

                        return (
                            <tr key={item.id} className="border-b border-black">
                                <td className="border-r border-black p-2 text-left uppercase">{item.roomTypeName}</td>
                                <td className="border-r border-black p-2 whitespace-nowrap">{format(checkInDate, 'dd/MM/yyyy')}</td>
                                <td className="border-r border-black p-2 whitespace-nowrap">{format(checkOutDate, 'dd/MM/yyyy')}</td>
                                <td className="border-r border-black p-2">{item.quantity}</td>
                                <td className="border-r border-black p-2">{item.nights}</td>
                                <td className="border-r border-black p-2">EP</td>
                                <td className="border-r border-black p-2">{booking.adults}</td>
                                <td className="border-r border-black p-2">0</td>
                                <td className="border-r border-black p-2">{booking.children}</td>
                                <td className="border-r border-black p-2">0</td>
                                <td className="border-r border-black p-2">{ratePerNight}</td>
                                <td className="border-r border-black p-2">0.00</td>
                                <td className="border-r border-black p-2">{idx === 0 ? cgst : '0.00'}</td>
                                <td className="border-r border-black p-2">{idx === 0 ? sgst : '0.00'}</td>
                                <td className="border-r border-black p-2 font-medium">{idx === 0 ? totalLineItem : ((item.subtotal)/100).toFixed(2)}</td>
                                <td className="p-2"></td>
                            </tr>
                        );
                    })}
                    {/* Add-ons inside the table if they exist, to act as extra lines */}
                    {booking.addOns?.map((addon: any) => (
                        <tr key={addon.id} className="border-b border-black">
                            <td className="border-r border-black p-2 text-left uppercase">{addon.name}</td>
                            <td className="border-r border-black p-2 whitespace-nowrap">-</td>
                            <td className="border-r border-black p-2 whitespace-nowrap">-</td>
                            <td className="border-r border-black p-2">{addon.quantity}</td>
                            <td className="border-r border-black p-2">-</td>
                            <td className="border-r border-black p-2">-</td>
                            <td className="border-r border-black p-2">-</td>
                            <td className="border-r border-black p-2">-</td>
                            <td className="border-r border-black p-2">-</td>
                            <td className="border-r border-black p-2">-</td>
                            <td className="border-r border-black p-2">{(addon.price / 100).toFixed(2)}</td>
                            <td className="border-r border-black p-2">0.00</td>
                            <td className="border-r border-black p-2">-</td>
                            <td className="border-r border-black p-2">-</td>
                            <td className="border-r border-black p-2 font-medium">{(addon.subtotal / 100).toFixed(2)}</td>
                            <td className="p-2">ADDON</td>
                        </tr>
                    ))}
                    
                    {/* Totals Row */}
                    <tr>
                        <td colSpan={3} className="border-r border-black p-2 text-left font-bold">Total</td>
                        <td className="border-r border-black p-2 font-bold">{booking.items?.reduce((a: number, b: any) => a + b.quantity, 0)}</td>
                        <td className="border-r border-black p-2 font-bold">{nights}</td>
                        <td colSpan={1} className="border-r border-black p-2"></td>
                        <td className="border-r border-black p-2 font-bold">{booking.adults}</td>
                        <td colSpan={1} className="border-r border-black p-2"></td>
                        <td className="border-r border-black p-2 font-bold">{booking.children}</td>
                        <td colSpan={5} className="border-r border-black p-2"></td>
                        <td className="border-r border-black p-2 font-bold">{(booking.totalAmount / 100).toFixed(2)}</td>
                        <td className="p-2"></td>
                    </tr>
                </tbody>
            </table>

            <table className="w-full border-collapse border border-black mb-6 text-[11px] mt-4">
                <tbody>
                    <tr>
                        <td className="border border-black p-1.5 font-bold w-1/2">Total Stay Value</td>
                        <td className="border border-black p-1.5 font-bold text-center w-1/2">{(booking.totalAmount / 100).toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            {/* Trailing Instructions */}
            <div className="space-y-4 text-[10px]">
                <div>
                    <h3 className="font-bold mb-1 m-0 text-[11px] font-sans">Billing Instructions</h3>
                    <p>Website</p>
                </div>

                <div>
                    <h3 className="font-bold mb-1 uppercase m-0 text-[11px] font-sans">Cancellation Policy: -</h3>
                    <ul className="list-disc pl-5 space-y-0.5">
                        <li>Full Refund: Notify at least 7 days prior to scheduled arrival.</li>
                    </ul>
                </div>

                <div>
                    <h3 className="font-bold mb-1 uppercase m-0 text-[11px] font-sans">Cancellation Fee: -</h3>
                    <ul className="list-disc pl-5 space-y-0.5">
                        <li>Before 72 hours of arrival: 20% deduction</li>
                        <li>Between 24-72 hours before arrival: 50% deduction</li>
                        <li>Within 24 hours of arrival: 100% deduction</li>
                        <li>Refunds: Will be processed within 7 working days after providing necessary bank details</li>
                        <li>No-Show: Failure to arrive without prior notice will result in a charge for the full reservation amount</li>
                        <li>Early Departure: Guests departing earlier than the reserved date will be charged for the full stay</li>
                        <li>Postponement: Last-minute postponements are not accepted. Once a booking is postponed, no refund will be issued regardless of the new arrival date.</li>
                        <li>Exceptions: In cases of unforeseen circumstances like natural disasters, cancellation policies may be waived or adjusted at the discretion of the hotel.</li>
                    </ul>
                </div>

                <div>
                    <h3 className="font-bold mb-1 uppercase m-0 text-[11px] font-sans">Terms Conditions: -</h3>
                    <ul className="list-disc pl-5 space-y-0.5">
                        <li>Check-In Time: 02:00 PM</li>
                        <li>Check-Out Time: 12:00 PM</li>
                        <li>Early check-in and late check-out are subject to availability and may incur extra charges</li>
                        <li>Child Policy: Children aged 7 years and above will be considered as adults. Additional charges will apply</li>
                        <li>All guests must present a valid photo ID at the time of check-in (Driving License, Aadhaar Card, Voter ID, or Passport). Foreign nationals must carry a hard copy of their passport along with a valid Visa or OCI card.</li>
                        <li>Wearing proper nylon swimwear is mandatory for all guests using the swimming pool</li>
                        <li>All rooms are non-smoking</li>
                    </ul>
                </div>

                <div>
                    <h3 className="font-bold border-b border-black pb-1 mb-1 m-0 text-[11px] font-sans">Payment Details:-</h3>
                    <p>Status: {booking.paymentStatus === 'success' ? 'PAID' : 'PENDING'}</p>
                </div>
            </div>
            
        </main>
    );
}
