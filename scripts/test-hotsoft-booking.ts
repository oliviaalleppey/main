import { XMLBuilder, XMLParser } from 'fast-xml-parser';

async function testBookingPush() {
    const xmlBuilder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        format: true,
    });

    const xmlParser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
    });

    const checkInStr = new Date().toLocaleDateString('en-GB');
    const checkOutStr = new Date(Date.now() + 86400000).toLocaleDateString('en-GB');

    const xmlPayload = xmlBuilder.build({
        BookingRequest: {
            '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            '@_xmlns:xsd': 'http://www.w3.org/2001/XMLSchema',
            '@_accessKey': 'DM20022026OLIVIAUAT8001WI',
            GuestDetails: {
                '@_Title': 'Mr',
                '@_GuestName': 'Test Guest',
                '@_EmailId': 'test@example.com',
                '@_MobileNo': '9999999999',
            },
            CheckinDetails: {
                '@_CheckInDateTime': `${checkInStr} 14:00`,
                '@_CheckOutDateTime': `${checkOutStr} 11:00`,
                '@_TotalPax': '2',
                '@_Children': '0',
                '@_Amount': '4.24',
                '@_Taxes': '0.76',
                '@_TotalAmount': '5.00',
            },
            BookingDetails: {
                '@_HotelID': '8001',
                '@_BookingNo': `OL-TEST-${Math.floor(Math.random() * 10000)}`,
                '@_BookingDate': checkInStr,
                '@_BookedBy': 'Test Guest',
                '@_OTA': 'Website',
                '@_BookingStatus': 'Confirmed',
                '@_AllInclusiveRates': 'Yes',
                '@_Instructions': 'Test booking',
            },
            Rates: {
                RoomType: [
                    {
                        '@_ID': '80016',
                        '@_Date': checkInStr,
                        '@_NoOfRooms': '1',
                        '@_NoOfPax': '2',
                        '@_RatePlanId': 'EP',
                        '@_ChildPax': '0',
                    }
                ]
            }
        }
    });

    const fullXml = `<?xml version="1.0" encoding="utf-16"?>\n${xmlPayload}`;
    console.log("Sending XML:\n", fullXml);

    try {
        const response = await fetch('https://purplekeys.co.in/OliviaUAT/OTAbookingsUpdate.aspx', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml',
                'Accept': 'text/xml, application/xml',
            },
            body: fullXml
        });

        const responseText = await response.text();
        console.log("Raw Response:\n", responseText);

        try {
            const parsed = xmlParser.parse(responseText);
            console.log("Parsed JSON:\n", JSON.stringify(parsed, null, 2));
        } catch (e) {
            console.error("Parse error:", e);
        }
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

testBookingPush();
