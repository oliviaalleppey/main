import { HotsoftCrsProvider } from './lib/providers/crs/hotsoft-crs-provider';
import { HOTSOFT_CONFIG } from './lib/config/hotsoft';

async function testHotsoft() {
    console.log("Config: ", HOTSOFT_CONFIG);
    const provider = new HotsoftCrsProvider();

    console.log("Testing Availability...");
    const avail = await provider.checkAvailability({
        checkIn: new Date().toISOString(),
        checkOut: new Date(Date.now() + 86400000).toISOString(),
        adults: 2,
        children: 0
    });
    console.log("Availability Result: ", JSON.stringify(avail, null, 2));

    console.log("Testing Booking Push...");
    const booking = await provider.createReservation({
        reservationRef: 'TEST-' + Math.floor(Math.random() * 10000),
        checkIn: new Date().toISOString(),
        checkOut: new Date(Date.now() + 86400000).toISOString(),
        primaryGuest: {
            title: 'Mr',
            firstName: 'AMAL',
            lastName: 'LAL',
            email: 'amal.lal@example.com',
            phone: '9999999999'
        },
        rooms: [{
            roomTypeId: 'boat-race-finish-line-suite',
            ratePlanId: 'EP',
            adults: 2,
            children: 0,
            guestName: 'AMAL LAL'
        }],
        payment: {
            method: 'Easebuzz',
            amount: 5000,
            transactionId: 'TXN12345'
        }
    });
    console.log("Booking Result: ", JSON.stringify(booking, null, 2));
}

testHotsoft().catch(console.error);
