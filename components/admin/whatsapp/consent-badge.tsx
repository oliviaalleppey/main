import { cn } from '@/lib/utils';

/**
 * The consent badge.
 *
 * Deliberately loud. Consent state decides what may lawfully be sent to a person,
 * so it is the one column on the contacts screen that must never be mistaken at a
 * glance — hence colour plus text, not colour alone.
 */

export type ConsentStatus = 'pending' | 'opted_in' | 'opted_out' | 'suppressed';

export const CONSENT_META: Record<ConsentStatus, { label: string; className: string; meaning: string }> = {
    opted_in: {
        label: 'Opted in',
        className: 'bg-green-100 text-green-800 ring-1 ring-inset ring-green-600/20',
        meaning: 'Documented WhatsApp opt-in — may receive marketing',
    },
    pending: {
        label: 'Pending',
        className: 'bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-600/20',
        meaning: 'No documented opt-in — may only receive the re-permission template',
    },
    opted_out: {
        label: 'Opted out',
        className: 'bg-gray-200 text-gray-700 ring-1 ring-inset ring-gray-500/20',
        meaning: 'Withdrew consent — utility messages only',
    },
    suppressed: {
        label: 'Suppressed',
        className: 'bg-red-100 text-red-800 ring-1 ring-inset ring-red-600/20',
        meaning: 'Permanent do-not-contact — nothing may be sent',
    },
};

export function ConsentBadge({
    status,
    className,
}: {
    status: ConsentStatus | string | null | undefined;
    className?: string;
}) {
    const meta = CONSENT_META[(status ?? 'pending') as ConsentStatus] ?? CONSENT_META.pending;

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
