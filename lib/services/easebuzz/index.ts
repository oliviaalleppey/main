import crypto from 'crypto';

const EASEBUZZ_API_KEY = process.env.EASEBUZZ_API_KEY || '';
const EASEBUZZ_SALT = process.env.EASEBUZZ_SALT || '';
const EASEBUZZ_ENV = process.env.EASEBUZZ_ENV || 'test';

/**
 * Easebuzz's own SDK keys this off the string 'prod', our README documents
 * 'live', and the code used to test for 'production'. Any of the three now
 * means production, because the failure mode of getting this wrong is silent:
 * real cards get sent to testpay, which accepts nothing.
 */
const IS_PRODUCTION = ['production', 'prod', 'live'].includes(EASEBUZZ_ENV.trim().toLowerCase());

const INITIATE_URL = IS_PRODUCTION
    ? 'https://pay.easebuzz.in/payment/initiateLink'
    : 'https://testpay.easebuzz.in/payment/initiateLink';

const PAY_BASE_URL = IS_PRODUCTION
    ? 'https://pay.easebuzz.in/pay'
    : 'https://testpay.easebuzz.in/pay';

// Transaction API v2 lives on the dashboard host, not the pay host.
const DASHBOARD_URL = IS_PRODUCTION
    ? 'https://dashboard.easebuzz.in'
    : 'https://testdashboard.easebuzz.in';

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

    /**
     * Transaction API v2 — the authoritative status of a txnid, straight from
     * Easebuzz. This is the only way to find out what happened to a payment
     * whose browser never came back to us (guest closed the tab, lost signal,
     * killed the app mid-3DS), which is otherwise invisible: no webhook is
     * ever sent for those, so the payment row sits `pending` forever.
     *
     * Reference: easebuzz/paywitheasebuzz-php-lib -> easebuzz-lib/transaction.php
     *   ENDPOINT:      POST {dashboardBaseUrl}/transaction/v2/retrieve
     *   HASH SEQUENCE: key|txnid|SALT
     *
     * Returns the gateway's transaction record, or null when Easebuzz has no
     * record of the txnid at all (guest never reached the hosted page).
     */
    static async fetchTransactionStatus(txnid: string): Promise<{
        found: boolean;
        status: string | null;
        fields: Record<string, string>;
        raw: unknown;
    }> {
        const hash = crypto
            .createHash('sha512')
            .update(`${EASEBUZZ_API_KEY}|${txnid}|${EASEBUZZ_SALT}`)
            .digest('hex');

        const response = await fetch(`${DASHBOARD_URL}/transaction/v2/retrieve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ key: EASEBUZZ_API_KEY, txnid, hash }).toString(),
        });

        const text = await response.text();

        let json: any;
        try {
            json = JSON.parse(text);
        } catch {
            throw new Error(`Easebuzz transaction API returned non-JSON: ${text.slice(0, 300)}`);
        }

        // Easebuzz is inconsistent about the envelope across its APIs and
        // versions — `msg` on some, `data` on others, and `msg` is sometimes a
        // bare string carrying an error instead of the transaction. Rather than
        // bet on one shape, accept any of them and treat anything unrecognised
        // as "no record", so a shape change degrades to leaving the payment
        // pending rather than silently marking a paid booking failed.
        const envelope = json?.msg ?? json?.data ?? null;
        const record = Array.isArray(envelope) ? envelope[0] : envelope;

        if (!record || typeof record !== 'object' || typeof record.status === 'undefined') {
            return { found: false, status: null, fields: {}, raw: json };
        }

        const fields: Record<string, string> = {};
        for (const [key, value] of Object.entries(record)) {
            if (value !== null && value !== undefined && typeof value !== 'object') {
                fields[key] = String(value);
            }
        }

        return {
            found: true,
            status: String(record.status),
            fields,
            raw: json,
        };
    }
}
