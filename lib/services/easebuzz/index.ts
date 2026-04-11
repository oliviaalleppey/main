import crypto from 'crypto';

const EASEBUZZ_API_KEY = process.env.EASEBUZZ_API_KEY || '';
const EASEBUZZ_SALT = process.env.EASEBUZZ_SALT || '';
const EASEBUZZ_ENV = process.env.EASEBUZZ_ENV || 'test';

const INITIATE_URL = EASEBUZZ_ENV === 'production'
    ? 'https://pay.easebuzz.in/payment/initiateLink'
    : 'https://testpay.easebuzz.in/payment/initiateLink';

const PAY_BASE_URL = EASEBUZZ_ENV === 'production'
    ? 'https://pay.easebuzz.in/pay'
    : 'https://testpay.easebuzz.in/pay';

export class EasebuzzService {
    static get isConfigured() {
        return !!EASEBUZZ_API_KEY && !!EASEBUZZ_SALT;
    }

    /**
     * Request hash sequence (from docs):
     * key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10|salt
     * Note: udf8, udf9, udf10 must always be empty per Easebuzz rules.
     */
    static generateRequestHash(params: {
        txnid: string;
        amount: string;
        productinfo: string;
        firstname: string;
        email: string;
        udf1?: string;
        udf2?: string;
        udf3?: string;
        udf4?: string;
        udf5?: string;
        udf6?: string;
        udf7?: string;
    }): string {
        const hashString = [
            EASEBUZZ_API_KEY,
            params.txnid,
            params.amount,
            params.productinfo,
            params.firstname,
            params.email,
            params.udf1 || '',
            params.udf2 || '',
            params.udf3 || '',
            params.udf4 || '',
            params.udf5 || '',
            params.udf6 || '',
            params.udf7 || '',
            '', // udf8 — always empty
            '', // udf9 — always empty
            '', // udf10 — always empty
            EASEBUZZ_SALT,
        ].join('|');

        return crypto.createHash('sha512').update(hashString).digest('hex');
    }

    /**
     * Reverse hash sequence for verifying webhook/redirect response:
     * salt|udf10|udf9|udf8|udf7|udf6|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
     */
    static verifyResponseHash(responseParams: Record<string, string>): boolean {
        if (!responseParams.hash) return false;

        const hashString = [
            EASEBUZZ_SALT,
            responseParams.status || '',
            '', // udf10
            '', // udf9
            '', // udf8
            responseParams.udf7 || '',
            responseParams.udf6 || '',
            responseParams.udf5 || '',
            responseParams.udf4 || '',
            responseParams.udf3 || '',
            responseParams.udf2 || '',
            responseParams.udf1 || '',
            responseParams.email || '',
            responseParams.firstname || '',
            responseParams.productinfo || '',
            responseParams.amount || '',
            responseParams.txnid || '',
            EASEBUZZ_API_KEY,
        ].join('|');

        const calculated = crypto.createHash('sha512').update(hashString).digest('hex');
        return responseParams.hash === calculated;
    }

    /**
     * Server-side call to Easebuzz initiateLink API.
     * Returns the hosted checkout URL to redirect the user to.
     */
    static async initiatePayment(params: {
        orderId: string;
        amount: number; // in paise
        name: string;
        email: string;
        phone: string;
        returnUrl: string;
    }): Promise<{ accessKey: string; payUrl: string }> {
        const amountInRupees = (params.amount / 100).toFixed(2);
        const firstname = params.name.split(' ')[0] || params.name;
        const productinfo = `Booking-${params.orderId}`;
        const udf1 = 'olivia_hotel';
        const udf2 = 'room_booking';
        const udf3 = 'direct_booking';

        const hash = this.generateRequestHash({
            txnid: params.orderId,
            amount: amountInRupees,
            productinfo,
            firstname,
            email: params.email,
            udf1,
            udf2,
            udf3,
        });

        const body = new URLSearchParams({
            key: EASEBUZZ_API_KEY,
            txnid: params.orderId,
            amount: amountInRupees,
            productinfo,
            firstname,
            email: params.email,
            phone: params.phone,
            surl: params.returnUrl,
            furl: params.returnUrl,
            udf1,
            udf2,
            udf3,
            udf4: '',
            udf5: '',
            udf6: '',
            udf7: '',
            hash,
        });

        console.log('[Easebuzz] Initiating payment to:', INITIATE_URL);
        console.log('[Easebuzz] key:', EASEBUZZ_API_KEY, '| txnid:', params.orderId, '| amount:', amountInRupees);
        console.log('[Easebuzz] hash:', hash);

        const response = await fetch(INITIATE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        });

        const text = await response.text();
        console.log('[Easebuzz] raw response:', text.slice(0, 500));

        let json: any;
        try {
            json = JSON.parse(text);
        } catch {
            throw new Error(`Easebuzz returned non-JSON: ${text.slice(0, 300)}`);
        }

        // Easebuzz returns { status: 1, data: "ACCESS_KEY" } on success
        if (json.status !== 1 || !json.data) {
            throw new Error(`Easebuzz error: ${json.error_desc || json.data || JSON.stringify(json)}`);
        }

        return {
            accessKey: json.data,
            payUrl: `${PAY_BASE_URL}/${json.data}`,
        };
    }
}
