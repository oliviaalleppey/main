export const AXISROOMS_CONFIG = {
    apiKey: process.env.AXISROOMS_API_KEY || 'mock_key',
    hotelId: process.env.AXISROOMS_HOTEL_ID || 'mock_hotel',
    baseUrl: process.env.AXISROOMS_BASE_URL || 'https://api.axisrooms.com',
    channelId: process.env.AXISROOMS_CHANNEL_ID || 'internal_website',
    accessKey: process.env.AXISROOMS_ACCESS_KEY || 'mock_access'
};

export const USE_MOCK = process.env.USE_MOCK === 'false' ? false : true;
