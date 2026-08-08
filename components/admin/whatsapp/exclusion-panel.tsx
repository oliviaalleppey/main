'use client';

import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ConsentBadge } from './consent-badge';

/**
 * Live count plus the exclusion breakdown.
 *
 * Shared by the audience builder and the campaign wizard's audience step, because
 * both have to answer the same question before anyone spends money: of everyone
 * who matched, who will actually receive this, and why not the rest.
 */

export type Breakdown = {
    matched: number;
    eligible: number;
    excluded: {
        notOptedIn: number;
        optedOut: number;
        suppressed: number;
        frequencyCapped: number;
        invalidPhone: number;
        noConsentRecord: number;
    };
};

export type SampleContact = {
    id: string;
    phone: string;
    name: string | null;
    consentStatus: string;
    marketingSent30d: number | null;
    totalStays: number | null;
    city: string | null;
};

function exclusionRows(breakdown: Breakdown, frequencyCap: number) {
    return [
        {
            key: 'notOptedIn',
            count: breakdown.excluded.notOptedIn,
            label: 'No documented opt-in',
            detail: 'Only the re-permission template may go to these contacts',
        },
        {
            key: 'optedOut',
            count: breakdown.excluded.optedOut,
            label: 'Opted out',
            detail: 'Withdrew consent',
        },
        {
            key: 'suppressed',
            count: breakdown.excluded.suppressed,
            label: 'Suppressed',
            detail: 'Permanent do-not-contact list',
        },
        {
            key: 'frequencyCapped',
            count: breakdown.excluded.frequencyCapped,
            label: 'Frequency capped',
            detail: `Already had ${frequencyCap} marketing message${frequencyCap === 1 ? '' : 's'} in 30 days`,
        },
        {
            key: 'invalidPhone',
            count: breakdown.excluded.invalidPhone,
            label: 'Invalid number',
            detail: 'Not a valid E.164 number',
        },
        {
            key: 'noConsentRecord',
            count: breakdown.excluded.noConsentRecord,
            label: 'No consent timestamp',
            detail: 'Marked opted in but the ledger has no date — treated as unsendable',
        },
    ].filter((row) => row.count > 0);
}

export function ExclusionPanel({
    breakdown,
    samples,
    loading,
    error,
    frequencyCap,
}: {
    breakdown: Breakdown | null;
    samples: SampleContact[];
    loading: boolean;
    error: string | null;
    frequencyCap: number;
}) {
    if (error) {
        return (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-medium">Could not evaluate this audience</p>
                <p className="mt-1 text-xs">{error}</p>
            </div>
        );
    }

    if (!breakdown) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        );
    }

    const rows = exclusionRows(breakdown, frequencyCap);
    const totalExcluded = breakdown.matched - breakdown.eligible;

    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-semibold text-gray-900">
                        {breakdown.eligible.toLocaleString('en-IN')}
                    </span>
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                    will receive this, of {breakdown.matched.toLocaleString('en-IN')} matched
                </p>
            </div>

            {totalExcluded > 0 ? (
                <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Excluded ({totalExcluded.toLocaleString('en-IN')})
                    </h4>
                    <ul className="mt-2 space-y-2">
                        {rows.map((row) => (
                            <li key={row.key} className="border-b border-gray-100 pb-2">
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="text-sm text-gray-700">{row.label}</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {row.count.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500">{row.detail}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                breakdown.matched > 0 && (
                    <p className="text-xs text-gray-500">Everyone matched is eligible.</p>
                )
            )}

            {breakdown.matched === 0 && (
                <p className="text-sm text-gray-500">
                    Nothing matches this filter yet. With no contacts imported, every audience will read zero.
                </p>
            )}

            {samples.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Sample recipients
                    </h4>
                    <ul className="mt-2 space-y-1.5">
                        {samples.slice(0, 8).map((sample) => (
                            <li key={sample.id} className="flex items-center justify-between gap-2 text-xs">
                                <span className="min-w-0">
                                    <span className="block truncate text-gray-900">{sample.name || 'Unnamed'}</span>
                                    <span className="block truncate font-mono text-gray-400">{sample.phone}</span>
                                </span>
                                <ConsentBadge status={sample.consentStatus} />
                            </li>
                        ))}
                    </ul>
                    {samples.length > 8 && (
                        <p className="mt-1.5 text-xs text-gray-400">+{samples.length - 8} more in the sample</p>
                    )}
                </div>
            )}
        </div>
    );
}
