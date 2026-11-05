import crypto from 'crypto';
import { EasebuzzService } from '@/lib/services/easebuzz';
import { normaliseGatewayStatus, type GatewayOutcome } from '@/lib/services/easebuzz/apply-outcome';
import { HdfcService, normaliseHdfcStatus } from '@/lib/services/hdfc';

/**
 * Which payment gateway new bookings go through. Easebuzz stays the default so
 * deploying this changes nothing until PAYMENT_GATEWAY=hdfc is set.
 *
 * Existing pending payments keep settling with the gateway they were created
 * on: the payment row's `paymentMethod` says which (see lookupGatewayStatus).
 */
export type GatewayName = 'easebuzz' | 'hdfc';

export function activeGateway(): GatewayName {
    return (process.env.PAYMENT_GATEWAY || '').trim().toLowerCase() === 'hdfc' ? 'hdfc' : 'easebuzz';
}

export function isGatewayConfigured(gateway: GatewayName = activeGateway()): boolean {
    return gateway === 'hdfc' ? HdfcService.isConfigured : EasebuzzService.isConfigured;
}

/** The path the gateway sends the guest back to. */
export function returnPath(gateway: GatewayName = activeGateway()): string {
    return gateway === 'hdfc' ? '/api/payment/hdfc' : '/api/payment/easebuzz';
}

/**
 * Our order id. HDFC wants it alphanumeric, under 21 characters and not
 * sequential, so it gets no hyphens and a random tail; Easebuzz keeps the
 * original `OL-<ms>` shape so nothing downstream that parses it breaks.
 */
export function newOrderId(gateway: GatewayName = activeGateway()): string {
    if (gateway === 'hdfc') {
        return `OL${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`.toUpperCase();
    }
    return `OL-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

export async function initiateGatewayPayment(params: {
    orderId: string;
    amount: number; // paise
    name: string;
    email: string;
    phone: string;
    baseUrl: string;
}): Promise<{ payUrl: string }> {
    const gateway = activeGateway();
    const returnUrl = `${params.baseUrl}${returnPath(gateway)}`;
    // Both gateways want ten digits, no country code.
    const phone = params.phone.replace(/\D/g, '').slice(-10);

    if (gateway === 'hdfc') {
        const { payUrl } = await HdfcService.createSession({ ...params, phone, returnUrl });
        return { payUrl };
    }
    const { payUrl } = await EasebuzzService.initiatePayment({ ...params, phone, returnUrl });
    return { payUrl };
}

/** Asks the gateway a payment was created on what became of it. */
export async function lookupGatewayStatus(paymentMethod: string | null, txnid: string): Promise<{
    found: boolean;
    status: string | null;
    outcome: GatewayOutcome;
    fields: Record<string, string>;
}> {
    if (paymentMethod === 'hdfc') {
        if (!HdfcService.isConfigured) throw new Error('HDFC is not configured');
        const r = await HdfcService.fetchOrderStatus(txnid);
        return { ...r, outcome: normaliseHdfcStatus(r.status) };
    }
    if (!EasebuzzService.isConfigured) throw new Error('Easebuzz is not configured');
    const r = await EasebuzzService.fetchTransactionStatus(txnid);
    return { ...r, outcome: normaliseGatewayStatus(r.status) };
}
