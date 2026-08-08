import { cn } from '@/lib/utils';

/** Campaign lifecycle badge, with the meaning spelled out on hover. */
export const CAMPAIGN_STATUS_META: Record<string, { label: string; className: string; meaning: string }> = {
    draft: {
        label: 'Draft',
        className: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-500/20',
        meaning: 'Not launched — nothing is queued and nothing will send',
    },
    pending_approval: {
        label: 'Needs approval',
        className: 'bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-600/20',
        meaning: 'Above the approval threshold — a second admin must approve it',
    },
    scheduled: {
        label: 'Scheduled',
        className: 'bg-indigo-100 text-indigo-800 ring-1 ring-inset ring-indigo-600/20',
        meaning: 'Queued and waiting for its send time',
    },
    sending: {
        label: 'Sending',
        className: 'bg-green-100 text-green-800 ring-1 ring-inset ring-green-600/20',
        meaning: 'Actively dispatching, subject to caps and quiet hours',
    },
    paused: {
        label: 'Paused',
        className: 'bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-600/20',
        meaning: 'Stopped, but the queue is intact — it can be resumed',
    },
    completed: {
        label: 'Completed',
        className: 'bg-gray-900 text-white',
        meaning: 'Every queued message reached a final state',
    },
    halted: {
        label: 'Halted',
        className: 'bg-red-100 text-red-800 ring-1 ring-inset ring-red-600/20',
        meaning: 'Stopped permanently — the remaining queue was cancelled',
    },
    failed: {
        label: 'Failed',
        className: 'bg-red-100 text-red-900 ring-1 ring-inset ring-red-700/20',
        meaning: 'Could not run',
    },
};

export function CampaignStatusBadge({ status, className }: { status: string; className?: string }) {
    const meta = CAMPAIGN_STATUS_META[status] ?? CAMPAIGN_STATUS_META.draft;

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

/**
 * Meta error codes translated to something an operator can act on.
 * Mirrors META_ERROR_CODES in types.ts, phrased for a non-technical reader.
 */
export const ERROR_PLAIN_ENGLISH: Record<number, string> = {
    131026: 'Not a WhatsApp user',
    131047: 'Outside the 24-hour window — needs a template',
    131049: 'Meta capped marketing messages to this person this period',
    130472: 'Excluded from marketing by Meta experiment',
    132000: 'Wrong number of variables supplied',
    132001: 'Template not available in this language',
    132005: 'The filled-in message was too long',
    132007: 'Template content breaks Meta format policy',
    132012: 'A variable was in the wrong format',
    132015: 'Template paused by Meta for low quality',
    132016: 'Template disabled by Meta',
    131056: 'Too many messages to this number too quickly',
    613: 'Rate limited — will retry',
    80007: 'Rate limited — will retry',
    130429: 'Throughput limit reached — will retry',
    190: 'Access token invalid or expired',
    133010: 'Sender number not registered with the Cloud API',
    368: 'Temporarily blocked by Meta for policy violations',
    131031: 'Account locked by Meta',
    131048: 'Spam rate limit — account reputation at risk',
};

export function describeError(code: number | null | undefined, detail?: string | null): string {
    if (code && ERROR_PLAIN_ENGLISH[code]) return ERROR_PLAIN_ENGLISH[code];
    return detail || (code ? `Meta error ${code}` : 'Unknown error');
}
