'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TemplateStatusBadge, CATEGORY_PRICE } from './template-status';
import { cn } from '@/lib/utils';

type Template = {
    id: string;
    name: string;
    language: string;
    category: string;
    status: string;
    bodyText: string | null;
    variableCount: number | null;
    rejectionReason: string | null;
    qualityScore: string | null;
    sentCount: number | null;
    syncedAt: string | null;
    updatedAt: string | null;
};

export function TemplateList() {
    const [templates, setTemplates] = useState<Template[] | null>(null);
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('');

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/admin/whatsapp/templates');
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
            setTemplates(body.templates ?? []);
            setStatusCounts(body.statusCounts ?? {});
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load templates');
            setTemplates(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    async function sync() {
        setSyncing(true);
        try {
            const response = await fetch('/api/admin/whatsapp/templates/sync', { method: 'POST' });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.error || `Sync failed (${response.status})`);
            toast.success(
                `Synced ${body.total} template${body.total === 1 ? '' : 's'} — ${body.created} new, ${body.updated} updated`,
            );
            void load();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Sync failed');
        } finally {
            setSyncing(false);
        }
    }

    if (error) {
        return (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-6">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                        <h2 className="font-semibold text-amber-900">Templates could not be loaded</h2>
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

    const visible = (templates ?? []).filter((t) => !filter || t.status === filter);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <FilterChip label="All" count={templates?.length ?? 0} active={!filter} onClick={() => setFilter('')} />
                    {['approved', 'internal_review', 'pending_meta', 'rejected', 'paused', 'disabled'].map((status) =>
                        statusCounts[status] ? (
                            <FilterChip
                                key={status}
                                label={status.replace('_', ' ')}
                                count={statusCounts[status]}
                                active={filter === status}
                                onClick={() => setFilter(filter === status ? '' : status)}
                            />
                        ) : null,
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => void sync()} disabled={syncing}>
                        <RefreshCw className={cn('mr-1.5 h-4 w-4', syncing && 'animate-spin')} /> Sync from Meta
                    </Button>
                    <Button size="sm" asChild>
                        <Link href="/admin/whatsapp/templates/new">
                            <Plus className="mr-1.5 h-4 w-4" /> Request a template
                        </Link>
                    </Button>
                </div>
            </div>

            {loading && !templates ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} className="h-40 w-full" />
                    ))}
                </div>
            ) : visible.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white px-6 py-16 text-center">
                    <h3 className="text-sm font-semibold text-gray-900">No templates yet</h3>
                    <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
                        Sync to pull anything already approved on the Meta account, or draft a new one. Every
                        marketing message must use an approved template.
                    </p>
                    <div className="mt-4 flex justify-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => void sync()} disabled={syncing}>
                            Sync from Meta
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/admin/whatsapp/templates/new">Request a template</Link>
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {visible.map((template) => (
                        <Link
                            key={template.id}
                            href={`/admin/whatsapp/templates/${template.id}`}
                            className="block rounded-lg border border-gray-200 bg-white p-5 transition-colors hover:border-gray-400"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h3 className="truncate font-mono text-sm font-semibold text-gray-900">
                                        {template.name}
                                    </h3>
                                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                        <TemplateStatusBadge status={template.status} />
                                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                                            {template.category} · {CATEGORY_PRICE[template.category] ?? '—'}
                                        </span>
                                        <span className="text-xs text-gray-400">{template.language}</span>
                                    </div>
                                </div>
                            </div>

                            <p className="mt-3 line-clamp-3 text-sm text-gray-600">
                                {template.bodyText || 'No body text'}
                            </p>

                            {template.status === 'rejected' && template.rejectionReason && (
                                <p className="mt-3 rounded bg-red-50 p-2 text-xs text-red-800">
                                    Meta&apos;s reason: {template.rejectionReason}
                                </p>
                            )}

                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                                <span>{template.variableCount ?? 0} variable(s)</span>
                                <span>{template.sentCount ?? 0} sent</span>
                                {template.qualityScore && <span>Quality: {template.qualityScore}</span>}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

function FilterChip({
    label,
    count,
    active,
    onClick,
}: {
    label: string;
    count: number;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors',
                active
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400',
            )}
        >
            {label}
            <span className={cn('ml-1.5', active ? 'text-gray-300' : 'text-gray-400')}>{count}</span>
        </button>
    );
}
