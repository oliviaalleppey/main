import { XMLBuilder, XMLParser } from 'fast-xml-parser';

async function testAvailability() {
    const xmlBuilder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        format: true,
    });

    const xmlParser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
    });

    const hotelDet = {
        HotelId: '8001',
        RoomType: '80016', // Lake View Twin Room mapped ID
        DtFrom: new Date().toLocaleDateString('en-GB'),
        DtTo: new Date(Date.now() + 86400000).toLocaleDateString('en-GB'),
        AvailType: '1',
    };

    const xmlPayload = xmlBuilder.build({
        Hotsoft: {
            Login: { AppKey: 'DM20022026OLIVIAUAT8001WI' },
            HOTEL_DET: hotelDet
        }
    });

    const fullXml = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlPayload}`;
    console.log("Sending XML:\n", fullXml);

    try {
        const response = await fetch('https://purplekeys.co.in/OliviaUAT/GetLiveAvailability.aspx', {
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

testAvailability();
