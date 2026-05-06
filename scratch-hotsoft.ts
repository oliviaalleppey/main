const xmlBuilder = new (require('fast-xml-parser')).XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    format: true,
});

const xmlPayload = xmlBuilder.build({
    Hotsoft: {
        Login: { AppKey: 'DM16032026OLIVIA9137WI' },
        HOTEL_DET: {
            HotelId: '9137',
            RoomType: '91372', // Canal View King
            DtFrom: '05/05/2026',
            DtTo: '06/05/2026',
            AvailType: '1'
        }
    }
});

const fullXml = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlPayload}`;

async function run() {
    try {
        const response = await fetch('https://purplekeys.co.in/olivia/GetLiveAvailability.aspx', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
            },
            body: fullXml,
        });
        
        const text = await response.text();
        console.log("\nResponse XML:\n", text);
    } catch (e) {
        console.error(e);
    }
}
run();
