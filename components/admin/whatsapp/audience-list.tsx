'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Lock, Plus, RefreshCw, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AudienceBuilder, type AudienceFilter } from './audience-builder';
import { cn } from '@/lib/utils';

type Audience = {
    id: string;
    name: string;
    description: string | null;
    type: string;
    filter: AudienceFilter | null;
    lastCount: number | null;
    lastEvaluatedAt: string | null;
    isSystem: boolean | null;
    eligible: number;
    isRePermission: boolean;
    breakdown: {
        matched: number;
        eligible: number;
        excluded: Record<string, number>;
    } | null;
    error?: string;
};

export function AudienceList() {
    const [audiences, setAudiences] = useState<Audience[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [builderOpen, setBuilderOpen] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/admin/whatsapp/audiences');
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
            setAudiences(body.audiences ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load audiences');
            setAudiences(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    async function remove(audience: Audience) {
        if (!window.confirm(`Delete the audience "${audience.name}"? Campaigns already sent are unaffected.`)) return;
        try {
            const response = await fetch(`/api/admin/whatsapp/audiences/${audience.id}`, { method: 'DELETE' });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
            toast.success('Audience deleted');
            void load();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not delete');
        }
    }

    if (error) {
        return (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-6">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                        <h2 className="font-semibold text-amber-900">Audiences could not be loaded</h2>
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
                    Dynamic audiences are re-evaluated at send time, so anyone who opts out drops out automatically.
                </p>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
                        <RefreshCw className={cn('mr-1.5 h-4 w-4', loading && 'animate-spin')} /> Refresh counts
                    </Button>
                    <Button size="sm" onClick={() => setBuilderOpen(true)}>
                        <Plus className="mr-1.5 h-4 w-4" /> New audience
                    </Button>
                </div>
            </div>

            {loading && !audiences ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} className="h-36 w-full" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {(audiences ?? []).map((audience) => (
                        <AudienceCard key={audience.id} audience={audience} onDelete={() => void remove(audience)} />
                    ))}
                </div>
            )}

            <AudienceBuilder
                open={builderOpen}
                onOpenChange={setBuilderOpen}
                onSaved={() => {
                    setBuilderOpen(false);
                    void load();
                }}
            />
        </div>
    );
}

function AudienceCard({ audience, onDelete }: { audience: Audience; onDelete: () => void }) {
    const excluded = audience.breakdown
        ? audience.breakdown.matched - audience.breakdown.eligible
        : 0;

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{audience.name}</h3>
                        {audience.isSystem && (
                            <span
                                title="Prebuilt — cannot be deleted or re-filtered"
                                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
                            >
                                <Lock className="h-3 w-3" /> Prebuilt
                            </span>
                        )}
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                            {audience.type}
                        </span>
                        {audience.isRePermission && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                                Re-permission only
                            </span>
                        )}
                    </div>
                    {audience.description && (
                        <p className="mt-1 text-sm text-gray-500">{audience.description}</p>
                    )}
                </div>
                {!audience.isSystem && (
                    <button
                        type="button"
                        onClick={onDelete}
                        className="shrink-0 rounded p-1 text-gray-300 hover:text-red-600"
                        aria-label={`Delete ${audience.name}`}
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}
            </div>

            <div className="mt-4 flex items-end gap-4">
                <div>
                    <p className="text-2xl font-semibold text-gray-900">
                        {audience.eligible.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-gray-500">eligible now</p>
                </div>
                {audience.breakdown && excluded > 0 && (
                    <div className="pb-1">
                        <p className="text-sm text-gray-500">
                            {excluded.toLocaleString('en-IN')} of {audience.breakdown.matched.toLocaleString('en-IN')}{' '}
                            matched are excluded
                        </p>
                    </div>
                )}
            </div>

            {audience.error && (
                <p className="mt-3 rounded bg-amber-50 p-2 text-xs text-amber-800">{audience.error}</p>
            )}

            {audience.eligible === 0 && !audience.error && (
                <p className="mt-3 flex items-start gap-2 rounded bg-gray-50 p-2 text-xs text-gray-500">
                    <Users className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Nobody is eligible yet. With no documented opt-ins in the database, only the re-permission
                    audience will have anyone in it.
                </p>
            )}
        </div>
    );
}
