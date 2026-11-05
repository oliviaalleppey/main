import crypto from 'crypto';

/**
 * HDFC SmartGateway (Hypercheckout, Basic Auth API).
 *
 * Docs: https://smartgateway.hdfc.bank.in/docs/smartgateway-api-ref-basicauth/
 *
 * Flow: POST /session -> redirect the guest to payment_links.web -> the bank
 * sends the guest back to return_url with a signed set of params -> we ask
 * GET /orders/{order_id} what really happened. The order status call is the
 * source of truth; the return params only tell us which order to look up.
 *
 * Config is read on every call rather than at import, so the keys can be
 * swapped without a rebuild and tests can set them.
 */

function config() {
    const env = (process.env.HDFC_ENV || 'uat').trim().toLowerCase();
    const isProduction = ['production', 'prod', 'live'].includes(env);
    const merchantId = process.env.HDFC_MERCHANT_ID || '';

    return {
        isProduction,
        apiKey: process.env.HDFC_API_KEY || '',
        responseKey: process.env.HDFC_RESPONSE_KEY || '',
        merchantId,
        resellerId: process.env.HDFC_RESELLER_ID || 'hdfc_reseller',
        // UAT uses the shared `hdfcmaster` page client; production uses the merchant id.
        pageClientId: process.env.HDFC_PAYMENT_PAGE_CLIENT_ID || (isProduction ? merchantId : 'hdfcmaster'),
        baseUrl: isProduction ? 'https://smartgateway.hdfc.bank.in' : 'https://smartgateway.hdfcuat.bank.in',
    };
}

/** HDFC's `Authorization: Basic <base64 of the API key>`, exactly as their docs show it. */
function authHeader(apiKey: string) {
    return `Basic ${Buffer.from(apiKey).toString('base64')}`;
}

function headers(customerId: string) {
    const c = config();
    return {
        Authorization: authHeader(c.apiKey),
        'x-merchantid': c.merchantId,
        'x-customerid': customerId,
        'x-resellerid': c.resellerId,
        'Content-Type': 'application/json',
    };
}

/** What HDFC says happened, normalised to the three cases we can act on. */
export type HdfcOutcome = 'success' | 'failed' | 'unresolved';

/**
 * Order statuses: CHARGED is the only paid one. The *_FAILED / DECLINED ones
 * are final. NEW, STARTED, PENDING_VBV, AUTHORIZING and anything we have not
 * seen are deliberately `unresolved`, so they are left pending for the
 * reconciler rather than guessed at.
 */
export function normaliseHdfcStatus(status: string | null | undefined): HdfcOutcome {
    const s = String(status || '').trim().toUpperCase();
    if (s === 'CHARGED') return 'success';
    if (['AUTHENTICATION_FAILED', 'AUTHORIZATION_FAILED', 'JUSPAY_DECLINED'].includes(s)) return 'failed';
    return 'unresolved';
}

export type HdfcOrder = {
    found: boolean;
    status: string | null;
    /** Keyed the way applyGatewayOutcome reads gateway fields. */
    fields: Record<string, string>;
    raw: unknown;
};

/**
 * Maps an HDFC order-status response onto the field names the shared outcome
 * code already understands, so one code path settles payments for both gateways.
 */
export function orderToGatewayFields(order: Record<string, any>): Record<string, string> {
    const txn = (order.txn_detail ?? {}) as Record<string, any>;
    const resp = (order.payment_gateway_response ?? {}) as Record<string, any>;
    const methodType = order.payment_method_type ? String(order.payment_method_type) : '';
    const fields: Record<string, string> = {
        amount: order.amount != null ? String(order.amount) : '',
        easepayid: order.txn_id ? String(order.txn_id) : '',
        bank_ref_num: resp.rrn ? String(resp.rrn) : '',
        payment_source: methodType ? `hdfc_${methodType.toLowerCase()}` : 'hdfc',
        mode: methodType,
        bank_name: order.payment_method ? String(order.payment_method) : '',
        PG_TYPE: 'hdfc',
        unmappedstatus: order.status ? String(order.status) : '',
        error_Message: String(txn.error_message || resp.resp_message || ''),
    };
    return Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== ''));
}

export class HdfcService {
    static get isConfigured() {
        const c = config();
        return !!c.apiKey && !!c.merchantId && !!c.responseKey;
    }

    /**
     * Creates the order at HDFC and returns the hosted payment page URL.
     * `orderId` must be alphanumeric and under 21 characters (see newOrderId).
     */
    static async createSession(params: {
        orderId: string;
        amount: number; // paise
        name: string;
        email: string;
        phone: string;
        returnUrl: string;
        description?: string;
    }): Promise<{ payUrl: string; hdfcOrderId: string }> {
        const c = config();
        const [firstName, ...rest] = params.name.trim().split(/\s+/);
        // Allowed in names: alphanumerics and ().-_ — strip anything else.
        const clean = (v: string) => v.replace(/[^A-Za-z0-9().\-_ ]/g, '').trim();

        // The customer id is the order id on purpose. A stable per-guest id
        // would make HDFC offer that guest's saved cards to anyone who types
        // their email on a no-login checkout.
        const customerId = params.orderId;

        const body = {
            order_id: params.orderId,
            amount: (params.amount / 100).toFixed(2),
            customer_id: customerId,
            customer_email: params.email,
            customer_phone: params.phone,
            payment_page_client_id: c.pageClientId,
            action: 'paymentPage',
            return_url: params.returnUrl,
            first_name: clean(firstName || ''),
            last_name: clean(rest.join(' ')),
            description: params.description || `Booking ${params.orderId}`,
        };

        const response = await fetch(`${c.baseUrl}/session`, {
            method: 'POST',
            headers: headers(customerId),
            body: JSON.stringify(body),
        });

        const text = await response.text();
        let json: any;
        try {
            json = JSON.parse(text);
        } catch {
            throw new Error(`HDFC returned non-JSON (${response.status}): ${text.slice(0, 300)}`);
        }

        const payUrl = json?.payment_links?.web;
        if (!response.ok || !payUrl) {
            throw new Error(`HDFC session error (${response.status}): ${json?.error_message || json?.error_code || JSON.stringify(json).slice(0, 300)}`);
        }

        return { payUrl, hdfcOrderId: String(json.id || '') };
    }

    /**
     * The authoritative status of an order. `found: false` means HDFC has no
     * such order (404), which is a different thing from "pending".
     */
    static async fetchOrderStatus(orderId: string): Promise<HdfcOrder> {
        const c = config();
        const response = await fetch(`${c.baseUrl}/orders/${encodeURIComponent(orderId)}`, {
            method: 'GET',
            headers: headers(orderId),
        });

        const text = await response.text();
        let json: any;
        try {
            json = JSON.parse(text);
        } catch {
            throw new Error(`HDFC order status returned non-JSON (${response.status}): ${text.slice(0, 300)}`);
        }

        if (response.status === 404) return { found: false, status: null, fields: {}, raw: json };
        if (!response.ok || typeof json?.status === 'undefined') {
            throw new Error(`HDFC order status error (${response.status}): ${json?.error_message || json?.error_code || JSON.stringify(json).slice(0, 300)}`);
        }

        return { found: true, status: String(json.status), fields: orderToGatewayFields(json), raw: json };
    }

    /**
     * Return-URL signature check (HMAC-SHA256 with the Response Key).
     *
     * HDFC's page is vague about whether the digest is hex or base64 and which
     * side is percent-encoded, so every reasonable form is accepted. This is a
     * hint only: payments are always settled from fetchOrderStatus, so a wrong
     * guess here cannot let a forged return mark a booking paid.
     */
    static verifyReturnSignature(params: Record<string, string>): boolean {
        const received = params.signature;
        const key = config().responseKey;
        if (!received || !key) return false;

        const enc = encodeURIComponent;
        const joined = Object.keys(params)
            .filter((k) => k !== 'signature' && k !== 'signature_algorithm')
            .sort()
            .map((k) => `${enc(k)}=${enc(params[k])}`)
            .join('&');

        const hmac = crypto.createHmac('sha256', key).update(enc(joined)).digest();
        const candidates = [hmac.toString('hex'), hmac.toString('base64'), enc(hmac.toString('base64'))];

        let decodedReceived = received;
        try { decodedReceived = decodeURIComponent(received); } catch { /* keep raw */ }

        return candidates.some((cand) =>
            [received, decodedReceived].some((r) => {
                const a = Buffer.from(cand);
                const b = Buffer.from(r);
                return a.length === b.length && crypto.timingSafeEqual(a, b);
            }),
        );
    }
}
