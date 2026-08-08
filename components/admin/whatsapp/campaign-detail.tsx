'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Loader2, Pause, Play, RefreshCw, ShieldCheck, Square } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CampaignStatusBadge, CAMPAIGN_STATUS_META, describeError } from './campaign-status';
import { TemplatePreview } from './template-preview';
import { formatCurrency, cn } from '@/lib/utils';
import type { TemplateButton } from '@/lib/services/whatsapp/template-lint';

/** Statuses worth polling for — a finished campaign does not need a live feed. */
const LIVE_STATUSES = ['sending', 'scheduled'];
const POLL_MS = 10_000;

type Detail = {
    campaign: {
        id: string; name: string; description: string | null; status: string;
        totalCount: number | null; queuedCount: number | null; sentCount: number | null;
        deliveredCount: number | null; readCount: number | null; failedCount: number | null;
        skippedCount: number | null; estimatedCost: number | null; actualCost: number | null;
        dailyCap: number | null; throttlePerMin: number | null; haltReason: string | null;
        scheduledAt: string | null; startedAt: string | null; completedAt: string | null;
        approvedBy: string | null;
    };
    template: {
        id: string; name: string; category: string; bodyText: string | null;
        headerType: string | null; headerText: string | null; footerText: string | null;
        buttons: TemplateButton[] | null;
    } | null;
    audience: { id: string; name: string; type: string } | null;
    recipients: {
        id: string; status: string; errorCode: number | null; errorDetail: string | null;
        skipReason: string | null; attempts: number | null; cost: number | null;
        sentAt: string | null; deliveredAt: string | null; readAt: string | null;
        phone: string; name: string | null; contactId: string;
    }[];
    recipientStatusCounts: Record<string, number>;
    pagination: { page: number; pageSize: number; total: number; pages: number };
};

export function CampaignDetail({ campaignId }: { campaignId: string }) {
    const [data, setData] = useState<Detail | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [busy, setBusy] = useState(false);
    const [haltOpen, setHaltOpen] = useState(false);
    const [haltReason, setHaltReason] = useState('');
    const [startOpen, setStartOpen] = useState(false);
    const [confirmName, setConfirmName] = useState('');

    const load = useCallback(async () => {
        try {
            const params = new URLSearchParams({ page: String(page) });
            if (statusFilter) params.set('status', statusFilter);
            const response = await fetch(`/api/admin/whatsapp/campaigns/${campaignId}?${params}`);
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
            setData(body);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load the campaign');
        }
    }, [campaignId, page, statusFilter]);

    useEffect(() => {
        void load();
    }, [load]);

    // Poll only while something is actually moving.
    useEffect(() => {
        if (!data || !LIVE_STATUSES.includes(data.campaign.status)) return;
        const timer = setInterval(() => void load(), POLL_MS);
        return () => clearInterval(timer);
    }, [data, load]);

    async function act(path: string, payload?: unknown, successMessage?: string) {
        setBusy(true);
        try {
            const response = await fetch(`/api/admin/whatsapp/campaigns/${campaignId}/${path}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload ?? {}),
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
            toast.success(successMessage ?? body.message ?? 'Done');
            setHaltOpen(false);
            setStartOpen(false);
            await load();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Action failed');
        } finally {
            setBusy(false);
        }
    }

    if (error) {
        return (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                        <p className="font-semibold">Campaign could not be loaded</p>
                        <p className="mt-1">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    const { campaign, template, audience } = data;
    const total = campaign.totalCount ?? 0;
    const sent = campaign.sentCount ?? 0;
    const delivered = campaign.deliveredCount ?? 0;
    const read = campaign.readCount ?? 0;
    const failed = campaign.failedCount ?? 0;
    const percent = total > 0 ? Math.round((sent / total) * 100) : 0;

    const rate = (value: number, base: number) => (base > 0 ? `${Math.round((value / base) * 100)}%` : '—');

    return (
        <div className="space-y-6">
            {/* Header + controls */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-semibold text-gray-900">{campaign.name}</h2>
                            <CampaignStatusBadge status={campaign.status} />
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                            {CAMPAIGN_STATUS_META[campaign.status]?.meaning}
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                            {template && (
                                <Link href={`/admin/whatsapp/templates/${template.id}`} className="font-mono underline">
                                    {template.name}
                                </Link>
                            )}
                            {audience && ` → ${audience.name}`}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => void load()} disabled={busy}>
                            <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
                        </Button>

                        {campaign.status === 'pending_approval' && (
                            <Button
                                size="sm"
                                onClick={() => void act('approve', {}, 'Campaign approved')}
                                disabled={busy}
                            >
                                <ShieldCheck className="mr-1.5 h-4 w-4" /> Approve
                            </Button>
                        )}

                        {['draft', 'pending_approval', 'paused', 'scheduled'].includes(campaign.status) && (
                            <Button size="sm" onClick={() => setStartOpen(true)} disabled={busy}>
                                <Play className="mr-1.5 h-4 w-4" />
                                {campaign.status === 'paused' ? 'Resume' : 'Start'}
                            </Button>
                        )}

                        {campaign.status === 'sending' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => void act('pause', {}, 'Campaign paused')}
                                disabled={busy}
                            >
                                <Pause className="mr-1.5 h-4 w-4" /> Pause
                            </Button>
                        )}

                        {!['completed', 'halted'].includes(campaign.status) && total > 0 && (
                            <Button variant="outline" size="sm" onClick={() => setHaltOpen(true)} disabled={busy}>
                                <Square className="mr-1.5 h-4 w-4 text-red-600" /> Halt
                            </Button>
                        )}
                    </div>
                </div>

                {campaign.haltReason && (
                    <div className="mt-4 rounded-md bg-red-50 p-4">
                        <h3 className="text-sm font-semibold text-red-900">This campaign was halted</h3>
                        <p className="mt-1 text-sm text-red-800">{campaign.haltReason}</p>
                        <p className="mt-1 text-xs text-red-700">
                            Remaining queued messages were cancelled. Anything already sent stayed sent.
                        </p>
                    </div>
                )}

                {total > 0 && (
                    <>
                        <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-200">
                            <div className="h-full bg-gray-900 transition-all" style={{ width: `${percent}%` }} />
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                            <Stat label="Queued" value={campaign.queuedCount ?? 0} />
                            <Stat label="Sent" value={sent} sub={rate(sent, total)} />
                            <Stat label="Delivered" value={delivered} sub={rate(delivered, sent)} />
                            <Stat label="Read" value={read} sub={rate(read, delivered)} />
                            <Stat label="Failed" value={failed} sub={rate(failed, total)} tone={failed > 0 ? 'red' : undefined} />
                            <Stat label="Skipped" value={campaign.skippedCount ?? 0} />
                        </div>
                    </>
                )}

                <dl className="mt-5 grid gap-x-8 gap-y-2 border-t border-gray-100 pt-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Spent so far" value={formatCurrency(campaign.actualCost ?? 0)} />
                    <Field label="Estimated" value={formatCurrency(campaign.estimatedCost ?? 0)} />
                    <Field label="Daily cap" value={(campaign.dailyCap ?? 0).toLocaleString('en-IN')} />
                    <Field label="Throttle" value={`${campaign.throttlePerMin ?? 0}/min`} />
                </dl>
            </div>

            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
                {template && (
                    <div className="rounded-lg border border-gray-200 bg-white p-5">
                        <h3 className="mb-3 text-sm font-semibold text-gray-900">What was sent</h3>
                        <TemplatePreview
                            bodyText={template.bodyText ?? ''}
                            headerType={template.headerType ?? 'none'}
                            headerText={template.headerText ?? ''}
                            footerText={template.footerText ?? ''}
                            buttons={template.buttons ?? []}
                        />
                    </div>
                )}

                {/* Per-recipient table */}
                <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-gray-900">Recipients</h3>
                        <div className="flex flex-wrap gap-1.5">
                            <FilterChip label="All" active={!statusFilter} onClick={() => { setStatusFilter(''); setPage(1); }} />
                            {Object.entries(data.recipientStatusCounts).map(([status, count]) => (
                                <FilterChip
                                    key={status}
                                    label={`${status} ${count}`}
                                    active={statusFilter === status}
                                    onClick={() => { setStatusFilter(statusFilter === status ? '' : status); setPage(1); }}
                                />
                            ))}
                        </div>
                    </div>

                    {data.recipients.length === 0 ? (
                        <p className="mt-4 text-sm text-gray-500">
                            {total === 0
                                ? 'Nothing queued yet — the queue is built when the campaign starts.'
                                : 'No recipients match this filter.'}
                        </p>
                    ) : (
                        <div className="mt-3">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Detail</TableHead>
                                        <TableHead className="text-right">Cost</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.recipients.map((recipient) => (
                                        <TableRow key={recipient.id}>
                                            <TableCell>
                                                <Link
                                                    href={`/admin/whatsapp/contacts/${recipient.contactId}`}
                                                    className="text-gray-900 hover:underline"
                                                >
                                                    {recipient.name || 'Unnamed'}
                                                </Link>
                                                <div className="font-mono text-xs text-gray-400">{recipient.phone}</div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs capitalize text-gray-700">{recipient.status}</span>
                                            </TableCell>
                                            <TableCell className="text-xs text-gray-500">
                                                {recipient.status === 'failed'
                                                    ? describeError(recipient.errorCode, recipient.errorDetail)
                                                    : recipient.skipReason
                                                        ? `Skipped: ${recipient.skipReason}`
                                                        : recipient.readAt
                                                            ? 'Read'
                                                            : recipient.deliveredAt
                                                                ? 'Delivered'
                                                                : recipient.sentAt
                                                                    ? 'Sent'
                                                                    : ''}
                                            </TableCell>
                                            <TableCell className="text-right text-xs text-gray-500">
                                                {formatCurrency(recipient.cost ?? 0)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {data.pagination.pages > 1 && (
                                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                                    <span>
                                        Page {data.pagination.page} of {data.pagination.pages}
                                    </span>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page <= 1}
                                            onClick={() => setPage(page - 1)}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page >= data.pagination.pages}
                                            onClick={() => setPage(page + 1)}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Start / resume */}
            <Dialog open={startOpen} onOpenChange={setStartOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {campaign.status === 'paused' ? 'Resume this campaign?' : 'Start this campaign?'}
                        </DialogTitle>
                        <DialogDescription>
                            {campaign.status === 'paused'
                                ? 'Sending continues from where it stopped, using the existing queue.'
                                : 'The queue is built now and sending begins on the next dispatch run.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-1.5">
                        <Label htmlFor="start-confirm">
                            Type <span className="font-semibold">{campaign.name}</span> to confirm
                        </Label>
                        <Input
                            id="start-confirm"
                            value={confirmName}
                            onChange={(event) => setConfirmName(event.target.value)}
                            placeholder={campaign.name}
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setStartOpen(false)} disabled={busy}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => void act('start', { confirmName: confirmName.trim() })}
                            disabled={busy || confirmName.trim() !== campaign.name.trim()}
                        >
                            {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                            {campaign.status === 'paused' ? 'Resume' : 'Start'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Halt */}
            <Dialog open={haltOpen} onOpenChange={setHaltOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Halt this campaign?</DialogTitle>
                        <DialogDescription>
                            This cancels every message still queued and cannot be undone. Anything already sent stays
                            sent — halting stops the remainder, it does not unsend.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-1.5">
                        <Label htmlFor="halt-reason">Reason (required)</Label>
                        <Textarea
                            id="halt-reason"
                            value={haltReason}
                            onChange={(event) => setHaltReason(event.target.value)}
                            rows={3}
                            placeholder="e.g. Wrong offer code in the template"
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setHaltOpen(false)} disabled={busy}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => void act('halt', { reason: haltReason.trim() })}
                            disabled={busy || !haltReason.trim()}
                        >
                            {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                            Halt permanently
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function Stat({
    label,
    value,
    sub,
    tone,
}: {
    label: string;
    value: number;
    sub?: string;
    tone?: 'red';
}) {
    return (
        <div>
            <p className={cn('text-xl font-semibold', tone === 'red' ? 'text-red-700' : 'text-gray-900')}>
                {value.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-gray-500">
                {label}
                {sub && <span className="ml-1 text-gray-400">{sub}</span>}
            </p>
        </div>
    );
}

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
            <dd className="mt-0.5 font-medium text-gray-900">{value}</dd>
        </div>
    );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'rounded-full border px-2 py-0.5 text-xs font-medium capitalize transition-colors',
                active ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400',
            )}
        >
            {label}
        </button>
    );
}
