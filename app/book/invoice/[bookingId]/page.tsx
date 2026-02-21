
import { db } from '@/lib/db';
import { bookings, bookingConfirmations, bookingItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { PrintButton } from '@/components/invoice/print-button';

// Hotel Details
const HOTEL_DETAILS = {
    name: 'Olivia International',
    address: 'Finishing Point, Punnamada, Alappuzha - 13',
    phone: '+914772250888, +914772250800',
    email: 'mail@oliviaalleppey.com',
    gstin: '32AABCO1416E1Z6'
};

export default async function InvoicePage({ params }: { params: Promise<{ bookingId: string }> }) {
    const { bookingId } = await params;

    const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
    });

    if (!booking) return notFound();

    const confirmation = await db.query.bookingConfirmations.findFirst({
        where: eq(bookingConfirmations.bookingId, booking.id)
    });

    const items = await db.query.bookingItems.findMany({
        where: eq(bookingItems.bookingId, booking.id),
        with: {
            roomType: true
        }
    });

    const primaryItem = items[0];
    const totalRoomCount = items.reduce((sum, item) => sum + Math.max(1, item.quantity || 1), 0);
    const totalNights = Math.max(...items.map((item) => Math.max(1, item.nights || 1)), 1);
    const roomTypeLabel = items.length > 1
        ? 'Multiple Room Types'
        : (primaryItem?.roomType?.name || 'Room');

    // Helper: Calculate Tax
    const pricePerNight = primaryItem?.pricePerNight || 0;
    const priceInRupees = pricePerNight / 100;

    // Tax Logic: < 7500 -> 12%, >= 7500 -> 18%
    const taxRate = priceInRupees >= 7500 ? 0.18 : 0.12;

    // Reverse Calc Assuming Total Amount is Inclusive
    const grandTotal = booking.totalAmount / 100;
    const taxableValue = grandTotal / (1 + taxRate);
    const totalTax = grandTotal - taxableValue;
    const cgst = totalTax / 2;
    const sgst = totalTax / 2;

    const invoiceDate = booking.confirmedAt ? new Date(booking.confirmedAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
    const checkIn = new Date(booking.checkIn).toLocaleString('en-IN');
    const checkOut = new Date(booking.checkOut).toLocaleString('en-IN');
    const invoiceNo = confirmation?.confirmationNumber || `INV-${booking.bookingNumber?.slice(0, 8)}`;

    return (
        <div className="min-h-screen bg-white text-black p-8 font-sans text-sm print:p-0">
            <div className="max-w-[210mm] mx-auto border border-gray-400 p-0 print:border-0 bg-white">
                {/* Header */}
                <div className="flex justify-between p-4 border-b border-gray-400">
                    <div>
                        <h1 className="text-2xl font-bold text-[#4A235A] uppercase">{HOTEL_DETAILS.name}</h1>
                        <p className="whitespace-pre-line text-xs leading-relaxed">
                            {HOTEL_DETAILS.address}<br />
                            PH: {HOTEL_DETAILS.phone}<br />
                            {HOTEL_DETAILS.email}<br />
                            <strong>GSTNO: {HOTEL_DETAILS.gstin}</strong>
                        </p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold underline mb-1">TAX INVOICE</h2>
                        <p className="text-xs uppercase">ORIGINAL FOR RECIPIENT</p>
                    </div>
                </div>

                {/* Guest & Billing Address */}
                <div className="grid grid-cols-2 text-xs border-b border-gray-400 divide-x divide-gray-400 bg-gray-100 print:bg-transparent">
                    <div className="p-2">
                        <strong className="block text-blue-900 mb-1">Guest Name & Address</strong>
                        <div className="font-bold uppercase">{booking.guestName}</div>
                        <div>(Address details not captured)</div>
                    </div>
                    <div className="p-2">
                        <strong className="block text-blue-900 mb-1">Billing Address</strong>
                        <div className="font-bold uppercase">{booking.guestName}</div>
                        <div>Same as Guest</div>
                    </div>
                </div>

                {/* Invoice Meta */}
                <div className="grid grid-cols-4 text-xs border-b border-gray-400 divide-x divide-gray-400">
                    <div className="p-1"><span className="text-blue-900 font-bold">Room No :</span> -</div>
                    <div className="p-1"><span className="text-blue-900 font-bold">Plan :</span> CP</div>
                    <div className="p-1"><span className="text-blue-900 font-bold">PAX :</span> {booking.adults}/{booking.children}</div>
                    <div className="p-1"><span className="text-blue-900 font-bold">Invoice No :</span> {invoiceNo}</div>
                </div>
                <div className="grid grid-cols-4 text-xs border-b border-gray-400 divide-x divide-gray-400">
                    <div className="p-1"><span className="text-blue-900 font-bold">Room Type :</span> {roomTypeLabel}</div>
                    <div className="p-1"><span className="text-blue-900 font-bold">Resv No :</span> {booking.bookingNumber?.slice(0, 8)}</div>
                    <div className="p-1 col-span-1"></div>
                    <div className="p-1"><span className="text-blue-900 font-bold">Invoice Date :</span> {invoiceDate}</div>
                </div>
                <div className="grid grid-cols-4 text-xs border-b border-gray-400 divide-x divide-gray-400">
                    <div className="p-1"><span className="text-blue-900 font-bold">Check-In :</span> {checkIn}</div>
                    <div className="p-1"><span className="text-blue-900 font-bold">Tariff :</span> {priceInRupees.toFixed(2)}</div>
                    <div className="p-1 col-span-1"></div>
                    <div className="p-1"><span className="text-blue-900 font-bold">GRC No :</span> -</div>
                </div>
                <div className="grid grid-cols-4 text-xs border-b border-gray-400 divide-x divide-gray-400">
                    <div className="p-1"><span className="text-blue-900 font-bold">Check-Out :</span> {checkOut}</div>
                    <div className="p-1"><span className="text-blue-900 font-bold">Nights :</span> {totalNights}</div>
                    <div className="p-1 col-span-1"></div>
                    <div className="p-1"><span className="text-blue-900 font-bold">Page# :</span> 1 of 1</div>
                </div>

                {/* Main Table */}
                <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-gray-300 print:bg-gray-200 font-bold text-blue-900 border-b border-gray-400">
                        <tr>
                            <th className="p-2 border-r border-gray-400 w-32">DATE</th>
                            <th className="p-2 border-r border-gray-400">DESCRIPTION</th>
                            <th className="p-2 border-r border-gray-400 text-center w-24">SAC</th>
                            <th className="p-2 text-right w-32">AMOUNT</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        <tr>
                            <td className="p-2 border-r border-gray-400 align-top">{invoiceDate}</td>
                            <td className="p-2 border-r border-gray-400">
                                <div className="font-bold">
                                    Room Tariff [{roomTypeLabel}] x {totalRoomCount} room{totalRoomCount > 1 ? 's' : ''}
                                </div>
                                <div className="text-gray-500 mt-1">CGST @ {(taxRate * 100 / 2)}%</div>
                                <div className="text-gray-500">SGST @ {(taxRate * 100 / 2)}%</div>
                            </td>
                            <td className="p-2 border-r border-gray-400 text-center align-top">996311</td>
                            <td className="p-2 text-right align-top">
                                <div className="font-bold">{taxableValue.toFixed(2)}</div>
                                <div className="mt-1">{cgst.toFixed(2)}</div>
                                <div>{sgst.toFixed(2)}</div>
                            </td>
                        </tr>
                    </tbody>
                    <tfoot className="border-t border-gray-400 font-bold bg-gray-50 print:bg-transparent">
                        <tr>
                            <td colSpan={3} className="p-2 text-right text-blue-900 border-r border-gray-400">Total Taxable Value:</td>
                            <td className="p-2 text-right">{taxableValue.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colSpan={3} className="p-2 text-right text-blue-900 border-r border-gray-400">Total Tax (CGST+SGST):</td>
                            <td className="p-2 text-right">{totalTax.toFixed(2)}</td>
                        </tr>
                        <tr className="border-t-2 border-black text-sm">
                            <td colSpan={3} className="p-2 text-right text-blue-900 border-r border-gray-400">Grand Total:</td>
                            <td className="p-2 text-right">{grandTotal.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>

                {/* Amount in words */}
                <div className="p-2 text-xs border-t border-b border-gray-400 font-bold text-blue-900 bg-gray-100 print:bg-transparent">
                    Amount in Words: Rupees {formatCurrency((grandTotal))} Only
                </div>

                {/* Settlement Info */}
                <div className="grid grid-cols-2 text-xs border-b border-gray-400">
                    <div className="p-2 border-r border-gray-400">
                        <span className="font-bold text-blue-900">Settlement:</span>
                        <div className="mt-1">Rayzorpay / Online Transfer</div>
                    </div>
                    <div className="p-2 text-right">
                        <span className="font-bold text-blue-900">Company:</span>
                        <span className="ml-2">{grandTotal.toFixed(2)}</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 text-xs border-b border-gray-400 bg-blue-50 print:bg-transparent font-bold">
                    <div className="p-2 border-r border-gray-400">
                        SGST : {sgst.toFixed(2)}
                    </div>
                    <div className="p-2">
                        CGST : {cgst.toFixed(2)}
                    </div>
                </div>


                {/* Footer / Signatures */}
                <div className="grid grid-cols-2 text-xs p-8 mt-12">
                    <div className="text-left font-bold text-blue-900">
                        Prepared By: SYSTEM<br />
                        <span className="font-normal text-black font-sans">System Generated Invoice</span>
                    </div>
                    <div className="text-right font-bold text-blue-900">
                        Manager<br /><br /><br />
                        <span className="font-normal text-black font-sans">Authorized Signatory</span>
                    </div>
                </div>

                {/* Terms */}
                <div className="p-2 text-[10px] text-center text-gray-500 border-t border-gray-400 mt-auto">
                    Certified that the particulars given above are true and correct. Regardless of charge instruction, I agree to be held responsible for payment of the total amount of this bill.
                </div>
            </div>

            <PrintButton />
        </div>
    );
}

// Simple Currency Formatter
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount).replace('₹', '');
}
