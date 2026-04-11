import { EasebuzzService } from './easebuzz';

export const easebuzzEnabled = EasebuzzService.isConfigured;

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
