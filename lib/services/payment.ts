import Razorpay from 'razorpay';
import crypto from 'crypto';

// Make Razorpay optional for UI development
const RAZORPAY_CONFIGURED = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

export const razorpay = RAZORPAY_CONFIGURED ? new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
}) : null;

/**
 * Create Razorpay order
 * Amount must be in paise (smallest currency unit)
 */
export async function createRazorpayOrder(params: {
    amount: number; // in paise
    currency?: string;
    receipt: string;
    notes?: Record<string, string>;
}) {
    if (!razorpay) {
        throw new Error('Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
    }

    try {
        const order = await razorpay.orders.create({
            amount: params.amount,
            currency: params.currency || 'INR',
            receipt: params.receipt,
            notes: params.notes,
        });

        return order;
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        throw new Error('Failed to create payment order');
    }
}

/**
 * Verify Razorpay payment signature
 * This ensures the payment callback is genuine
 */
export function verifyRazorpaySignature(params: {
    orderId: string;
    paymentId: string;
    signature: string;
}): boolean {
    try {
        const { orderId, paymentId, signature } = params;

        const text = `${orderId}|${paymentId}`;
        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(text)
            .digest('hex');

        return generated_signature === signature;
    } catch (error) {
        console.error('Error verifying signature:', error);
        return false;
    }
}

/**
 * Initiate refund
 */
export async function initiateRefund(params: {
    paymentId: string;
    amount: number; // in paise
    notes?: Record<string, string>;
}) {
    if (!razorpay) {
        throw new Error('Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
    }

    try {
        const refund = await razorpay.payments.refund(params.paymentId, {
            amount: params.amount,
            notes: params.notes,
        });

        return refund;
    } catch (error) {
        console.error('Error initiating refund:', error);
        throw new Error('Failed to initiate refund');
    }
}

/**
 * Format amount for display (paise to rupees)
 */
export function formatCurrency(amountInPaise: number): string {
    const rupees = amountInPaise / 100;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(rupees);
}

/**
 * Convert rupees to paise
 */
export function rupeesToPaise(rupees: number): number {
    return Math.round(rupees * 100);
}

/**
 * Convert paise to rupees
 */
export function paiseToRupees(paise: number): number {
    return paise / 100;
}
