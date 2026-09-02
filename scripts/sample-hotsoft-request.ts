/**
 * Prints the BookingRequest XML we would send Hotsoft for a real booking.
 *
 * Read-only, and it never posts anything — it builds the payload through the
 * same buildBookingRequestXml() the live push uses, so what it prints is what
 * Hotsoft would actually receive. Useful for sending Datamate a sample to check
 * against, and for eyeballing a booking after a pricing change.
 *
 * Run: npx tsx scripts/sample-hotsoft-request.ts OL-3008-VBZA
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { buildBookingRequestXml } from '../lib/providers/crs/hotsoft-crs-provider';
import { splitStayIntoNightlyCharges } from '../lib/services/tax';
import { mapInternalRatePlanToCrs, mapInternalRoomTypeToCrs } from '../lib/config/crs';
import type { CRSCreateReservationRequest } from '../lib/providers/crs/types';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
    const bookingNumber = process.argv[2];
    if (!bookingNumber) {
        console.error('Usage: npx tsx scripts/sample-hotsoft-request.ts <BOOKING_NUMBER>');
        process.exit(1);
    }

    const [booking] = (await sql.query(
        `select id, booking_number, guest_name, guest_email, guest_phone,
                check_in::text as check_in, check_out::text as check_out,
                adults, children, subtotal, tax_amount, total_amount,
                special_requests
         from bookings where booking_number = $1`,
        [bookingNumber]
    )) as any[];

    if (!booking) {
        console.error(`No booking found with number ${bookingNumber}`);
        process.exit(1);
    }

    const items = (await sql.query(
        `select bi.quantity, bi.price_per_night, bi.nights, bi.subtotal,
                rt.slug as room_slug, rt.id as room_type_id,
                rp.code as rate_plan_code, rp.id as rate_plan_id
         from booking_items bi
         join room_types rt on rt.id = bi.room_type_id
         left join rate_plans rp on rp.id = bi.rate_plan_id
         where bi.booking_id = $1`,
        [booking.id]
    )) as any[];

    if (!items.length) {
        console.error(`Booking ${bookingNumber} has no room items`);
        process.exit(1);
    }

    const addOnRows = (await sql.query(
        `select coalesce(sum(subtotal), 0) as total from booking_add_ons where booking_id = $1`,
        [booking.id]
    )) as any[];
    const addOnSubtotal = Number(addOnRows[0]?.total ?? 0);

    const nights = Math.max(
        1,
        Math.ceil(
            (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime())
            / (1000 * 60 * 60 * 24)
        )
    );

    // Same split the live push uses: add-on tax comes out first, the rest is
    // spread over the room-nights and reconciled to what the booking carries.
    const charges = splitStayIntoNightlyCharges({
        items: items.map((i) => ({
            pricePerNight: Number(i.price_per_night),
            subtotal: Number(i.subtotal),
            rooms: Math.max(1, Number(i.quantity) || 1),
        })),
        nights,
        roomTaxTotal: Math.max(0, Number(booking.tax_amount) - Math.round(addOnSubtotal * 0.18)),
    });

    let cursor = 0;
    const rooms: CRSCreateReservationRequest['rooms'] = [];
    for (const item of items) {
        const count = Math.max(1, Number(item.quantity) || 1);
        for (let i = 0; i < count; i += 1) {
            rooms.push({
                roomTypeId: mapInternalRoomTypeToCrs({
                    roomTypeId: item.room_type_id,
                    roomTypeSlug: item.room_slug,
                }),
                ratePlanId: item.rate_plan_id
                    ? mapInternalRatePlanToCrs({
                        ratePlanId: item.rate_plan_id,
                        ratePlanCode: item.rate_plan_code,
                    })
                    : '',
                adults: Number(booking.adults) || 1,
                children: Number(booking.children) || 0,
                guestName: booking.guest_name,
                nightlyRates: charges[cursor]?.nightlyRates,
                nightlyTaxes: charges[cursor]?.nightlyTaxes,
            });
            cursor += 1;
        }
    }

    const [firstName, ...rest] = String(booking.guest_name).split(' ');

    console.log(buildBookingRequestXml({
        reservationRef: booking.booking_number,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        rooms,
        primaryGuest: {
            title: 'Mr',
            firstName,
            lastName: rest.join(' '),
            email: booking.guest_email,
            phone: booking.guest_phone,
        },
        payment: {
            method: 'online',
            subtotal: Number(booking.subtotal),
            taxAmount: Number(booking.tax_amount),
            amount: Number(booking.total_amount),
        },
        comments: booking.special_requests || undefined,
    }));
}

main();
