import crypto from 'crypto';

const OMNIWARE_API_KEY = process.env.OMNIWARE_API_KEY || '';
const OMNIWARE_SALT = process.env.OMNIWARE_SALT || '';
const OMNIWARE_ENV = process.env.OMNIWARE_ENV || 'test';
const OMNIWARE_BASE_URL = process.env.OMNIWARE_BASE_URL || 'https://pgbiz.omniware.in';

export class OmniwareService {
    static get isConfigured() {
        return !!OMNIWARE_API_KEY && !!OMNIWARE_SALT;
    }

    static get baseUrl() {
        return `${OMNIWARE_BASE_URL}/v2/paymentrequest`;
    }

    static generateHash(parameters: Record<string, string>): string {
        const keys = Object.keys(parameters).sort();
        let hashData = OMNIWARE_SALT;

        for (const key of keys) {
            if (key === 'hash') continue;
            const value = parameters[key];
            if (value !== undefined && value !== null && value.length > 0) {
                hashData += '|' + value.trim();
            }
        }

        return crypto.createHash('sha512').update(hashData).digest('hex').toUpperCase();
    }

    static verifyResponseHash(responseParams: Record<string, string>): boolean {
        if (!responseParams.hash) return true; // If no hash was returned, maybe verification isn't possible (e.g. failure edge cases), but we'll return false to be safe unless defined otherwise. Wait, docs say: "If hash field is null no need to check hash for such response". So return true is fine if null. But let's check correctly.

        const responseHash = responseParams.hash.toUpperCase();

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
        // Convert paise to rupee string for Omniware
        const amountInRupees = (params.amount / 100).toFixed(2);

        const payload: Record<string, string> = {
            api_key: OMNIWARE_API_KEY,
            order_id: params.orderId,
            mode: OMNIWARE_ENV === 'test' ? 'TEST' : 'LIVE',
            amount: amountInRupees,
            currency: 'INR',
            description: `Payment for Order ${params.orderId}`,
            name: params.name,
            email: params.email,
            phone: params.phone,
            city: 'Alappuzha', // Defaulting as mandatory field
            country: 'IND', // mandatory
            zip_code: '688001', // mandatory default
            return_url: params.returnUrl,
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
