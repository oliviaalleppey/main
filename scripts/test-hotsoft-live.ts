import 'dotenv/config';
import { HotsoftCrsProvider } from '../lib/providers/crs/hotsoft-crs-provider';
import { HOTSOFT_CONFIG } from '../lib/config/hotsoft';

async function runHotsoftLiveTest() {
    console.log('--- Starting Hotsoft CRS LIVE Integration Test ---');
    console.log(`Config: HotelID=${HOTSOFT_CONFIG.hotelId}, AppKey=${HOTSOFT_CONFIG.appKey}`);

    const provider = new HotsoftCrsProvider();

    // 1. Availability Check
    console.log('\n--- 1. Checking Availability ---');
    try {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const checkIn = today.toISOString();
        const checkOut = tomorrow.toISOString();

        console.log(`Querying Availability from: ${checkIn} to ${checkOut}`);
        const avail = await provider.checkAvailability({
            checkIn,
            checkOut,
            adults: 2,
            children: 0
        });

        console.log('Parsed Availability Response Object:', JSON.stringify(avail, null, 2));
    } catch (error: any) {
        console.error('Availability Check Failed:', error.message);
    }

    // 2. Reservation Push Check
    console.log('\n--- 2. Pushing Test Reservation ---');
    try {
        const checkIn = "2026-03-10T00:00:00.000Z";
        const checkOut = "2026-03-11T00:00:00.000Z";

        const reservation = await provider.createReservation({
            reservationRef: `TEST-${Date.now()}`,
            checkIn,
            checkOut,
            rooms: [{ roomTypeId: '80012', ratePlanId: 'EP', adults: 2, children: 0, guestName: 'Test Guest' }],
            primaryGuest: {
                title: 'Mr',
                firstName: 'Test',
                lastName: 'Guest',
                email: 'test@oliviaalleppey.com',
                phone: '9999999999',
            },
            payment: {
                method: 'online',
                amount: 15000
            }
        });

        console.log('Parsed Reservation Push Response Object:', JSON.stringify(reservation, null, 2));
    } catch (error: any) {
        console.error('Reservation Push Failed:', error.message);
    }

    console.log('\n--- Test Complete ---');
}

runHotsoftLiveTest().catch(console.error);
