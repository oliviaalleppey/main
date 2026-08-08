'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CampaignStatusBadge } from './campaign-status';
import { formatCurrency } from '@/lib/utils';

type Row = {
    campaign: {
        id: string;
        name: string;
        status: string;
        totalCount: number | null;
        sentCount: number | null;
        deliveredCount: number | null;
        readCount: number | null;
        failedCount: number | null;
        estimatedCost: number | null;
        actualCost: number | null;
        scheduledAt: string | null;
        startedAt: string | null;
        createdAt: string | null;
    };
    templateName: string | null;
    templateCategory: string | null;
    audienceName: string | null;
};

export function CampaignList() {
    const [rows, setRows] = useState<Row[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/admin/whatsapp/campaigns');
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
            setRows(body.campaigns ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load campaigns');
            setRows(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    if (error) {
        return (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-6">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                        <h2 className="font-semibold text-amber-900">Campaigns could not be loaded</h2>
                        <p className="mt-1 text-sm text-amber-800">{error}</p>
                        <p className="mt-2 text-xs text-amber-700">
                            If the WhatsApp tables have not been created yet, apply{' '}
                            <code>drizzle/0006_whatsapp_module.sql</code> first.
                        </p>
                        <Button variant="outline" size="sm" className="mt-3" onClick={() => void load()}>
                            Try again
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-500">
                    Every campaign records what was sent, to whom, and what it cost.
                </p>
                <Button size="sm" asChild>
                    <Link href="/admin/whatsapp/campaigns/new">
                        <Plus className="mr-1.5 h-4 w-4" /> New campaign
                    </Link>
                </Button>
            </div>

            {loading && !rows ? (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-28 w-full" />
                    ))}
                </div>
            ) : (rows ?? []).length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white px-6 py-16 text-center">
                    <h3 className="text-sm font-semibold text-gray-900">No campaigns yet</h3>
                    <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
                        A campaign needs an approved template and an audience. Nothing sends until you type the
                        campaign name to confirm.
                    </p>
                    <Button size="sm" className="mt-4" asChild>
                        <Link href="/admin/whatsapp/campaigns/new">Create one</Link>
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {(rows ?? []).map(({ campaign, templateName, audienceName }) => {
                        const total = campaign.totalCount ?? 0;
                        const sent = campaign.sentCount ?? 0;
                        const percent = total > 0 ? Math.round((sent / total) * 100) : 0;

                        return (
                            <Link
                                key={campaign.id}
                                href={`/admin/whatsapp/campaigns/${campaign.id}`}
                                className="block rounded-lg border border-gray-200 bg-white p-5 transition-colors hover:border-gray-400"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                                            <CampaignStatusBadge status={campaign.status} />
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            <span className="font-mono">{templateName ?? 'no template'}</span>
                                            {audienceName && ` → ${audienceName}`}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-gray-900">
                                            {formatCurrency(campaign.actualCost || campaign.estimatedCost || 0)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {campaign.actualCost ? 'spent' : 'estimated'}
                                        </p>
                                    </div>
                                </div>

                                {total > 0 && (
                                    <>
                                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200">
                                            <div className="h-full bg-gray-900 transition-all" style={{ width: `${percent}%` }} />
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                            <span>{sent.toLocaleString('en-IN')} of {total.toLocaleString('en-IN')} sent</span>
                                            <span>{(campaign.deliveredCount ?? 0).toLocaleString('en-IN')} delivered</span>
                                            <span>{(campaign.readCount ?? 0).toLocaleString('en-IN')} read</span>
                                            {(campaign.failedCount ?? 0) > 0 && (
                                                <span className="text-red-600">
                                                    {(campaign.failedCount ?? 0).toLocaleString('en-IN')} failed
                                                </span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
