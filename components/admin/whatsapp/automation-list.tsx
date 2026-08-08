'use client';

import { useCallback, useEffect, useState } from 'react';
import {
    AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Clock, Loader2, Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type Template = { id: string; name: string; category: string; status: string };

type Automation = {
    key: string;
    label: string;
    description: string | null;
    enabled: boolean | null;
    templateId: string | null;
    offsetHours: number | null;
    lastFiredAt: string | null;
    fireCount: number | null;
    ready: boolean;
    template: { id: string; name: string; status: string; category: string } | null;
};

type Fire = {
    id: string;
    status: string;
    skipReason: string | null;
    errorDetail: string | null;
    queuedAt: string | null;
    sentAt: string | null;
    phone: string;
    name: string | null;
};

/** Which automations are date-driven and therefore have a meaningful offset. */
const SCHEDULED = new Set(['prearrival', 'checkout_review', 'birthday_greeting']);

function formatDate(value: string | null): string {
    if (!value) return 'never';
    return new Date(value).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
}

function describeOffset(hours: number | null): string {
    const value = hours ?? 0;
    if (value === 0) return 'immediately';
    if (value < 0) return `${Math.abs(value)}h before`;
    return `${value}h after`;
}

export function AutomationList() {
    const [automations, setAutomations] = useState<Automation[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [fires, setFires] = useState<Record<string, Fire[]>>({});

    const load = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/whatsapp/automations');
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error ?? 'Could not load automations');

            setAutomations(payload.automations ?? []);
            setTemplates(payload.templates ?? []);
            setError(null);
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'Could not load automations');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const patch = useCallback(
        async (key: string, body: Record<string, unknown>) => {
            setSaving(key);
            try {
                const response = await fetch(`/api/admin/whatsapp/automations/${key}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error ?? 'Could not update');

                await load();
            } catch (caught) {
                toast.error(caught instanceof Error ? caught.message : 'Could not update');
            } finally {
                setSaving(null);
            }
        },
        [load],
    );

    const toggleExpanded = useCallback(async (key: string) => {
        if (expanded === key) { setExpanded(null); return; }
        setExpanded(key);

        if (!fires[key]) {
            try {
                const response = await fetch(`/api/admin/whatsapp/automations/${key}`);
                const payload = await response.json();
                if (response.ok) setFires((current) => ({ ...current, [key]: payload.fires ?? [] }));
            } catch {
                // A missing log is not worth an error toast; the panel just stays empty.
            }
        }
    }, [expanded, fires]);

    if (loading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-20 w-full" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-6">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                    <p className="font-medium text-amber-900">Could not load automations</p>
                    <p className="mt-1 text-sm text-amber-800">{error}</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={load}>Try again</Button>
                </div>
            </div>
        );
    }

    const utilityTemplates = templates.filter((template) => template.category !== 'MARKETING');

    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-700">
                    Automations send an approved <strong>utility</strong> template when something
                    happens — a booking is confirmed, a payment fails, a guest checks out. They are
                    roughly six times cheaper than marketing, need no marketing consent because the
                    guest transacted with us, and they build the number&apos;s quality rating.
                </p>
                <p className="mt-2 text-xs text-gray-500">
                    Messages are queued, not sent instantly: the dispatcher picks them up within
                    five minutes and re-checks consent before each send.
                </p>
            </div>

            {automations.map((automation) => {
                const isOpen = expanded === automation.key;
                const armed = Boolean(automation.enabled);

                return (
                    <div key={automation.key} className="rounded-lg border border-gray-200 bg-white">
                        <div className="flex flex-wrap items-start justify-between gap-4 p-4">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-semibold text-gray-900">{automation.label}</h3>

                                    {armed && automation.ready && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                                            <CheckCircle2 className="h-3 w-3" /> Live
                                        </span>
                                    )}
                                    {armed && !automation.ready && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                                            <AlertTriangle className="h-3 w-3" /> On, but inert
                                        </span>
                                    )}
                                </div>

                                <p className="mt-1 text-xs text-gray-500">{automation.description}</p>

                                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                    <span className="inline-flex items-center gap-1">
                                        <Zap className="h-3 w-3" />
                                        fired {automation.fireCount ?? 0}×
                                    </span>
                                    <span>last: {formatDate(automation.lastFiredAt)}</span>
                                    {SCHEDULED.has(automation.key) && (
                                        <span className="inline-flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {describeOffset(automation.offsetHours)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <select
                                    value={automation.templateId ?? ''}
                                    onChange={(event) =>
                                        patch(automation.key, { templateId: event.target.value || null })
                                    }
                                    disabled={saving === automation.key}
                                    className="rounded-md border border-gray-300 px-2 py-1.5 text-xs"
                                >
                                    <option value="">No template</option>
                                    {(automation.key === 'birthday_greeting' ? templates : utilityTemplates).map((template) => (
                                        <option key={template.id} value={template.id}>{template.name}</option>
                                    ))}
                                </select>

                                {saving === automation.key ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                ) : (
                                    <Switch
                                        checked={armed}
                                        onCheckedChange={(checked) => patch(automation.key, { enabled: checked })}
                                        aria-label={`Turn ${automation.label} ${armed ? 'off' : 'on'}`}
                                    />
                                )}
                            </div>
                        </div>

                        {armed && !automation.ready && (
                            <p className="border-t border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-900">
                                {!automation.template
                                    ? 'No template chosen, so nothing will be sent.'
                                    : `The chosen template is ${automation.template.status}, not approved, so nothing will be sent.`}
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={() => toggleExpanded(automation.key)}
                            className="flex w-full items-center gap-1 border-t border-gray-100 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                            {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                            Recent fires
                        </button>

                        {isOpen && (
                            <div className="border-t border-gray-100 px-4 py-3">
                                {!fires[automation.key]?.length ? (
                                    <p className="text-xs text-gray-500">Nothing yet.</p>
                                ) : (
                                    <ul className="space-y-1.5">
                                        {fires[automation.key].map((fire) => (
                                            <li key={fire.id} className="flex items-center justify-between gap-3 text-xs">
                                                <span className="truncate text-gray-700">
                                                    {fire.name || fire.phone}
                                                </span>
                                                <span className="flex items-center gap-2">
                                                    <span className="text-gray-400">{formatDate(fire.sentAt ?? fire.queuedAt)}</span>
                                                    <span
                                                        className={cn(
                                                            'rounded px-1.5 py-0.5 font-medium',
                                                            fire.status === 'skipped' && 'bg-gray-100 text-gray-600',
                                                            fire.status === 'failed' && 'bg-red-100 text-red-700',
                                                            ['sent', 'delivered', 'read'].includes(fire.status) && 'bg-emerald-100 text-emerald-800',
                                                            fire.status === 'queued' && 'bg-sky-100 text-sky-800',
                                                        )}
                                                        title={fire.errorDetail ?? fire.skipReason ?? undefined}
                                                    >
                                                        {fire.status === 'skipped' ? (fire.skipReason ?? 'skipped') : fire.status}
                                                    </span>
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
