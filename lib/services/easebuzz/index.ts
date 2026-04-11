import crypto from 'crypto';

const EASEBUZZ_API_KEY = process.env.EASEBUZZ_API_KEY || '';
const EASEBUZZ_SALT = process.env.EASEBUZZ_SALT || '';
const EASEBUZZ_ENV = process.env.EASEBUZZ_ENV || 'test';
const EASEBUZZ_BASE_URL = process.env.EASEBUZZ_BASE_URL || 'https://testpay.easebuzz.in/payment/initiatePayment';

export class EasebuzzService {
    static get isConfigured() {
        return !!EASEBUZZ_API_KEY && !!EASEBUZZ_SALT;
    }

    static get baseUrl() {
        // Test: https://testpay.easebuzz.in/payment/initiatePayment
        // Live: https://pay.easebuzz.in/payment/initiatePayment
        return EASEBUZZ_BASE_URL;
    }

    static generateHash(parameters: Record<string, string>): string {
        // Easebuzz uses SHA512 hash with salt prepended and appended
        const keys = Object.keys(parameters).sort();
        let hashData = EASEBUZZ_SALT;

        for (const key of keys) {
            if (key === 'hash') continue;
            const value = parameters[key];
            if (value !== undefined && value !== null && value.length > 0) {
                hashData += '|' + value.trim();
            }
        }

        hashData += '|' + EASEBUZZ_SALT;

        return crypto.createHash('sha512').update(hashData).digest('hex');
    }

    static verifyResponseHash(responseParams: Record<string, string>): boolean {
        if (!responseParams.hash) return false;

        const responseHash = responseParams.hash;

        // Exclude hash from calculation
        const localParams: Record<string, string> = {};
        for (const k in responseParams) {
            if (k !== 'hash') {
                localParams[k] = responseParams[k];
            }
        }

        const calculatedHash = this.generateHash(localParams);
        return responseHash === calculatedHash;
    }

    static buildPaymentPayload(params: {
        orderId: string;
        amount: number; // in paise
        name: string;
        email: string;
        phone: string;
        returnUrl: string;
    }) {
        // Convert paise to rupee string for Easebuzz
        const amountInRupees = (params.amount / 100).toFixed(2);

        const payload: Record<string, string> = {
            key: EASEBUZZ_API_KEY,
            txnid: params.orderId,
            amount: amountInRupees,
            product_name: `Booking ${params.orderId}`,
            firstname: params.name,
            email: params.email,
            phone: params.phone,
            surl: params.returnUrl,
            furl: params.returnUrl,
            udf1: 'olivia_hotel',
            udf2: 'room_booking',
            udf3: 'direct_booking',
        };

        const hash = this.generateHash(payload);
        return {
            url: this.baseUrl,
            params: {
                ...payload,
                hash
            }
        };
    }
}
