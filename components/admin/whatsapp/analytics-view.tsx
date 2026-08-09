'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Download, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

type Funnel = {
    queued: number; sent: number; delivered: number; read: number; clicked: number;
    replied: number; failed: number; skipped: number; optedOut: number;
    deliveryRate: number; readRate: number; clickRate: number; optOutRate: number;
};

type DailyPoint = { day: string; sent: number; delivered: number; read: number; failed: number; costPaise: number };
type Cost = {
    totalPaise: number; marketingPaise: number; utilityPaise: number;
    costPerDeliveredPaise: number; costPerReadPaise: number;
    monthToDatePaise: number; budgetPaise: number; percentOfBudget: number;
    state: 'ok' | 'warn' | 'over';
};
type TemplateStat = {
    templateId: string; name: string; category: string; sent: number; delivered: number;
    read: number; failed: number; readRate: number; optOuts: number; optOutRate: number;
};
type HourStat = { hour: number; sent: number; read: number; readRate: number };
type Consent = {
    total: number; optedIn: number; pending: number; optedOut: number;
    suppressed: number; withProof: number; proofPercent: number;
};

type Attribution = {
    clickBookings: number; clickRevenue: number;
    phoneBookings: number; phoneRevenue: number;
    confirmedBookings: number; confirmedRevenue: number;
    medianHoursToBook: number | null;
};

type Overview = {
    funnel: Funnel; trends: DailyPoint[]; cost: Cost;
    templates: TemplateStat[]; hours: HourStat[]; consent: Consent;
    attribution: Attribution;
};

const RANGES = [7, 30, 90];

function percent(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
}

export function AnalyticsView() {
    const [days, setDays] = useState(30);
    const [data, setData] = useState<Overview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/whatsapp/analytics?days=${days}`);
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error ?? 'Could not load analytics');

            setData(payload);
            setError(null);
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'Could not load analytics');
        } finally {
            setLoading(false);
        }
    }, [days]);

    useEffect(() => { load(); }, [load]);

    if (error) {
        return (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-6">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                    <p className="font-medium text-amber-900">Could not load analytics</p>
                    <p className="mt-1 text-sm text-amber-800">{error}</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={load}>Try again</Button>
                </div>
            </div>
        );
    }

    if (loading && !data) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!data) return null;

    const { funnel, trends, cost, templates, hours, consent, attribution } = data;
    const peakSent = Math.max(1, ...trends.map((point) => point.sent));

    const stages = [
        { label: 'Queued', value: funnel.queued },
        { label: 'Sent', value: funnel.sent },
        { label: 'Delivered', value: funnel.delivered },
        { label: 'Read', value: funnel.read },
        { label: 'Clicked', value: funnel.clicked },
        { label: 'Replied', value: funnel.replied },
    ];
    const widest = Math.max(1, ...stages.map((stage) => stage.value));

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-1">
                    {RANGES.map((range) => (
                        <button
                            key={range}
                            type="button"
                            onClick={() => setDays(range)}
                            className={cn(
                                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                                days === range ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100',
                            )}
                        >
                            {range} days
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    {loading && <span className="text-xs text-gray-400">Refreshing…</span>}
                    <Button
                        variant="outline"
                        size="sm"
                        // A plain navigation, not fetch(): the response is an
                        // attachment, so the browser's own download handling is
                        // what we want. The range follows whatever is on screen.
                        onClick={() => {
                            window.location.href = `/api/admin/whatsapp/analytics/export?days=${days}`;
                        }}
                    >
                        <Download className="mr-1.5 h-4 w-4" /> Export XLSX
                    </Button>
                </div>
            </div>

            {funnel.queued === 0 && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
                    <TrendingUp className="mx-auto h-8 w-8 text-gray-300" />
                    <p className="mt-3 text-sm font-medium text-gray-900">Nothing sent in this period</p>
                    <p className="mt-1 text-xs text-gray-500">
                        Numbers appear here once campaigns or automations start sending.
                    </p>
                </div>
            )}

            <section className="rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-gray-900">Funnel</h2>
                <div className="mt-3 space-y-2">
                    {stages.map((stage) => (
                        <div key={stage.label} className="flex items-center gap-3">
                            <span className="w-20 shrink-0 text-xs text-gray-500">{stage.label}</span>
                            <div className="h-6 flex-1 overflow-hidden rounded bg-gray-100">
                                <div
                                    className="h-full rounded bg-emerald-500 transition-all"
                                    style={{ width: `${(stage.value / widest) * 100}%` }}
                                />
                            </div>
                            <span className="w-16 shrink-0 text-right text-xs font-medium tabular-nums text-gray-900">
                                {stage.value.toLocaleString('en-IN')}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 sm:grid-cols-5">
                    <Stat label="Delivery rate" value={percent(funnel.deliveryRate)} />
                    <Stat label="Read rate" value={percent(funnel.readRate)} />
                    <Stat label="Click rate" value={percent(funnel.clickRate)} />
                    <Stat
                        label="Opt-out rate"
                        value={percent(funnel.optOutRate)}
                        warn={funnel.optOutRate > 0.03}
                    />
                    <Stat label="Failed" value={funnel.failed.toLocaleString('en-IN')} warn={funnel.failed > 0} />
                </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-gray-900">Bookings from WhatsApp</h2>

                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Stat label="Attributed bookings" value={attribution.confirmedBookings.toLocaleString('en-IN')} />
                    <Stat label="Attributed revenue" value={formatCurrency(attribution.confirmedRevenue)} />
                    <Stat
                        label="Median time to book"
                        value={attribution.medianHoursToBook === null ? '—' : `${attribution.medianHoursToBook}h`}
                    />
                    <Stat
                        label="Cost per booking"
                        value={
                            attribution.confirmedBookings
                                ? formatCurrency(Math.round(cost.totalPaise / attribution.confirmedBookings))
                                : '—'
                        }
                    />
                </div>

                {/*
                  The assisted tier is shown below a divider and labelled, never
                  folded into the headline figures above. It is a real signal —
                  it catches the guest who read on their phone and booked on a
                  laptop — but it is an inference, and a hotel setting a budget
                  should be able to see which half of the number is which.
                */}
                <div className="mt-4 border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-500">
                        <span className="font-medium text-gray-700">
                            Plus {attribution.phoneBookings.toLocaleString('en-IN')} assisted
                            {' '}({formatCurrency(attribution.phoneRevenue)})
                        </span>
                        {' — '}
                        guests who were messaged and then booked on a matching number without
                        following the link. Inferred, not tracked. Not included above.
                    </p>
                </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-gray-900">Cost</h2>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Stat label="Total in period" value={formatCurrency(cost.totalPaise)} />
                    <Stat label="Marketing" value={formatCurrency(cost.marketingPaise)} />
                    <Stat label="Utility" value={formatCurrency(cost.utilityPaise)} />
                    <Stat label="Per delivered" value={formatCurrency(cost.costPerDeliveredPaise)} />
                </div>

                <div className="mt-4 border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                            This month: {formatCurrency(cost.monthToDatePaise)} of {formatCurrency(cost.budgetPaise)}
                        </span>
                        <span
                            className={cn(
                                'font-semibold',
                                cost.state === 'over' && 'text-red-600',
                                cost.state === 'warn' && 'text-amber-600',
                                cost.state === 'ok' && 'text-gray-600',
                            )}
                        >
                            {cost.percentOfBudget}%
                        </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded bg-gray-100">
                        <div
                            className={cn(
                                'h-full rounded transition-all',
                                cost.state === 'over' ? 'bg-red-500'
                                    : cost.state === 'warn' ? 'bg-amber-500' : 'bg-emerald-500',
                            )}
                            style={{ width: `${Math.min(100, cost.percentOfBudget)}%` }}
                        />
                    </div>
                </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-gray-900">Daily volume</h2>
                <div className="mt-3 flex h-32 items-end gap-px overflow-x-auto">
                    {trends.map((point) => (
                        <div
                            key={point.day}
                            className="group relative flex min-w-[6px] flex-1 flex-col justify-end"
                            title={`${point.day}: ${point.sent} sent, ${point.read} read`}
                        >
                            <div
                                className="w-full rounded-t bg-gray-200"
                                style={{ height: `${(point.sent / peakSent) * 100}%` }}
                            >
                                <div
                                    className="w-full rounded-t bg-emerald-500"
                                    style={{ height: `${point.sent ? (point.read / point.sent) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <p className="mt-2 text-[11px] text-gray-400">
                    Grey is sent, green is read. Hover for the day.
                </p>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-gray-900">Templates</h2>
                {!templates.length ? (
                    <p className="mt-3 text-xs text-gray-500">No template has been sent in this period.</p>
                ) : (
                    <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="text-gray-500">
                                <tr className="border-b border-gray-100">
                                    <th className="pb-2 font-medium">Template</th>
                                    <th className="pb-2 text-right font-medium">Sent</th>
                                    <th className="pb-2 text-right font-medium">Delivered</th>
                                    <th className="pb-2 text-right font-medium">Read rate</th>
                                    <th className="pb-2 text-right font-medium">Opt-out rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {templates.map((template) => (
                                    <tr key={template.templateId}>
                                        <td className="py-2">
                                            <span className="font-medium text-gray-900">{template.name}</span>
                                            <span className="ml-2 text-[10px] uppercase text-gray-400">
                                                {template.category}
                                            </span>
                                        </td>
                                        <td className="py-2 text-right tabular-nums">{template.sent}</td>
                                        <td className="py-2 text-right tabular-nums">{template.delivered}</td>
                                        <td className="py-2 text-right tabular-nums">{percent(template.readRate)}</td>
                                        <td
                                            className={cn(
                                                'py-2 text-right tabular-nums',
                                                template.optOutRate > 0.03 && 'font-semibold text-red-600',
                                            )}
                                        >
                                            {percent(template.optOutRate)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-lg border border-gray-200 bg-white p-4">
                    <h2 className="text-sm font-semibold text-gray-900">Read rate by hour</h2>
                    <div className="mt-3 flex h-24 items-end gap-0.5">
                        {hours.map((hour) => (
                            <div
                                key={hour.hour}
                                className="flex-1 rounded-t bg-sky-400"
                                style={{ height: `${Math.max(2, hour.readRate * 100)}%` }}
                                title={`${hour.hour}:00 — ${hour.sent} sent, ${percent(hour.readRate)} read`}
                            />
                        ))}
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                        <span>00:00</span><span>12:00</span><span>23:00</span>
                    </div>
                </section>

                <section className="rounded-lg border border-gray-200 bg-white p-4">
                    <h2 className="text-sm font-semibold text-gray-900">Consent</h2>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                        <Stat label="Opted in" value={consent.optedIn.toLocaleString('en-IN')} />
                        <Stat label="Pending" value={consent.pending.toLocaleString('en-IN')} />
                        <Stat label="Opted out" value={consent.optedOut.toLocaleString('en-IN')} />
                        <Stat label="Suppressed" value={consent.suppressed.toLocaleString('en-IN')} />
                    </div>
                    <div className="mt-4 border-t border-gray-100 pt-3">
                        <p className="text-xs text-gray-500">
                            Opted-in contacts with documented proof
                        </p>
                        <p
                            className={cn(
                                'mt-1 text-lg font-semibold',
                                consent.proofPercent === 100 ? 'text-emerald-600' : 'text-amber-600',
                            )}
                        >
                            {consent.proofPercent}%
                        </p>
                        <p className="mt-1 text-[11px] text-gray-400">
                            This should be 100%. Anything less is a contact we could not defend if challenged.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
    return (
        <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className={cn('mt-0.5 text-lg font-semibold tabular-nums', warn ? 'text-amber-600' : 'text-gray-900')}>
                {value}
            </p>
        </div>
    );
}
