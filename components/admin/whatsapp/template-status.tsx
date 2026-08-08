import { cn } from '@/lib/utils';

/**
 * Template status badge and the price-per-category label.
 *
 * The price sits next to the category everywhere a template is shown, because
 * marketing costs six times what utility does. Making that visible at the point
 * of choosing is what stops a utility message being sent as marketing by
 * accident.
 */

export const TEMPLATE_STATUS_META: Record<string, { label: string; className: string; meaning: string }> = {
    draft: {
        label: 'Draft',
        className: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-500/20',
        meaning: 'Not yet sent for internal review',
    },
    internal_review: {
        label: 'Internal review',
        className: 'bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-600/20',
        meaning: 'Waiting for a manager to approve before it goes to Meta',
    },
    pending_meta: {
        label: 'With Meta',
        className: 'bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-600/20',
        meaning: 'Submitted to Meta and awaiting their review',
    },
    approved: {
        label: 'Approved',
        className: 'bg-green-100 text-green-800 ring-1 ring-inset ring-green-600/20',
        meaning: 'Approved by Meta and available to send',
    },
    rejected: {
        label: 'Rejected',
        className: 'bg-red-100 text-red-800 ring-1 ring-inset ring-red-600/20',
        meaning: 'Meta rejected it — see their reason, then edit and resubmit',
    },
    paused: {
        label: 'Paused',
        className: 'bg-orange-100 text-orange-900 ring-1 ring-inset ring-orange-600/20',
        meaning: 'Paused by Meta for low quality — it cannot be sent right now',
    },
    disabled: {
        label: 'Disabled',
        className: 'bg-red-100 text-red-900 ring-1 ring-inset ring-red-700/20',
        meaning: 'Disabled by Meta — permanently unusable',
    },
};

/** Indicative India rates, matching PRICE_PAISE in types.ts. */
export const CATEGORY_PRICE: Record<string, string> = {
    MARKETING: '₹0.78',
    UTILITY: '₹0.13',
    AUTHENTICATION: '₹0.13',
};

export function TemplateStatusBadge({ status, className }: { status: string; className?: string }) {
    const meta = TEMPLATE_STATUS_META[status] ?? TEMPLATE_STATUS_META.draft;

    return (
        <span
            title={meta.meaning}
            className={cn(
                'inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold',
                meta.className,
                className,
            )}
        >
            {meta.label}
        </span>
    );
}
