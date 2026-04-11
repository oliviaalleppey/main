import crypto from 'crypto';

const EASEBUZZ_API_KEY = process.env.EASEBUZZ_API_KEY || '';
const EASEBUZZ_SALT = process.env.EASEBUZZ_SALT || '';
const EASEBUZZ_ENV = process.env.EASEBUZZ_ENV || 'test';

export class EasebuzzService {
    static get isConfigured() {
        return !!EASEBUZZ_API_KEY && !!EASEBUZZ_SALT;
    }

    static get baseUrl() {
        return EASEBUZZ_ENV === 'production'
            ? 'https://pay.easebuzz.in/payment/initiatePayment'
            : 'https://testpay.easebuzz.in/payment/initiatePayment';
    }

    /**
     * Generate request hash for initiating payment.
     * Easebuzz requires this EXACT field order:
     * key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
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
            '', '', '', '', '', // udf6-udf10 empty
            EASEBUZZ_SALT,
        ].join('|');

        return crypto.createHash('sha512').update(hashString).digest('hex');
    }

    /**
     * Verify response hash from Easebuzz webhook/redirect.
     * Response hash order is REVERSED:
     * SALT|status||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
     */
    static verifyResponseHash(responseParams: Record<string, string>): boolean {
        if (!responseParams.hash) return false;

        const receivedHash = responseParams.hash;

        const hashString = [
            EASEBUZZ_SALT,
            responseParams.status || '',
            '',
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

        const calculatedHash = crypto.createHash('sha512').update(hashString).digest('hex');
        return receivedHash === calculatedHash;
    }

    static buildPaymentPayload(params: {
        orderId: string;
        amount: number; // in paise
        name: string;
        email: string;
        phone: string;
        returnUrl: string;
    }) {
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

        return {
            url: this.baseUrl,
            params: {
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
                hash,
            },
        };
    }
}
