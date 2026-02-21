import 'dotenv/config';
import { AxisRoomsConnector } from '../lib/services/axisrooms/connector';
import { AXISROOMS_CONFIG } from '../lib/config/axisrooms';

// Ensure USE_MOCK is false for this test
process.env.USE_MOCK = 'false';
import { USE_MOCK } from '../lib/config/axisrooms';

async function runLiveTest() {
    console.log('--- Starting AxisRooms LIVE Integration Test ---');
    console.log(`USE_MOCK: ${USE_MOCK}`);
    console.log(`Config: BaseURL=${AXISROOMS_CONFIG.baseUrl}, HotelID=${AXISROOMS_CONFIG.hotelId}`);

    if (USE_MOCK) {
        console.error('ERROR: USE_MOCK is true. Check .env or config.');
        // process.exit(1); 
        // Force mock off in connector if possible, but connector reads config on instantiation.
        // We set process.env above, but if module was already loaded it might stick.
        // But we import USE_MOCK after setting env, so it should be false if logic works.
    }

    const connector = new AxisRoomsConnector(AXISROOMS_CONFIG, false); // Force mock=false

    // 1. Availability Check
    console.log('\n--- 1. Checking Availability ---');
    try {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const checkIn = today.toISOString().split('T')[0];
        const checkOut = tomorrow.toISOString().split('T')[0];

        console.log(`Querying: ${checkIn} to ${checkOut}`);
        const avail = await connector.checkAvailability({
            checkIn,
            checkOut,
            adults: 2,
            children: 0
        });
        console.log('Availability Response:', JSON.stringify(avail, null, 2));
    } catch (error: any) {
        console.error('Availability Check Failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }

    // 2. Pricing Check (if we had a room ID from step 1, but likely step 1 failed or we don't know IDs)
    // We can try with a dummy ID if we want to confirm 404/Bad Request from API.
    console.log('\n--- 2. Checking Pricing (Dummy Room) ---');
    try {
        const pricing = await connector.getPricing({
            roomId: 'dummy_room_id',
            ratePlanId: 'dummy_rate_plan',
            checkIn: '2026-03-01',
            checkOut: '2026-03-02',
            adults: 2,
            children: 0,
            rooms: 1
        });
        console.log('Pricing Response:', JSON.stringify(pricing, null, 2));
    } catch (error: any) {
        console.error('Pricing Check Failed (Expected if invalid ID):', error.message);
    }

    console.log('\n--- Test Complete ---');
}

runLiveTest().catch(console.error);
