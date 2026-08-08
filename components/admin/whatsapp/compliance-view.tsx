'use client';

import { useCallback, useEffect, useState } from 'react';
import {
    AlertTriangle, Download, FileSearch, Loader2, Search, ShieldOff, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type Snapshot = {
    contacts: number; optedIn: number; withProof: number; proofPercent: number;
    optedOut: number; suppressed: number; ledgerEntries: number;
    rawEvents: number; rawEventsOver30Days: number; optOutsLast30Days: number;
};

type ConsentEvent = {
    id: string; phone: string; fromStatus: string | null; toStatus: string;
    reason: string | null; source: string | null; actorEmail: string | null; createdAt: string | null;
};

type SuppressionEntry = { id: string; phone: string; reason: string | null; createdAt: string | null };

type AuditEntry = {
    id: string; actorEmail: string | null; action: string; entityType: string | null;
    entityId: string | null; before: unknown; after: unknown; ip: string | null; createdAt: string | null;
};

type Payload = {
    snapshot: Snapshot;
    ledger: { total: number; events: ConsentEvent[] };
    suppression: { total: number; entries: SuppressionEntry[] };
    audit: { total: number; entries: AuditEntry[] };
};

function formatDate(value: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}

export function ComplianceView() {
    const [data, setData] = useState<Payload | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [subjectPhone, setSubjectPhone] = useState('');
    const [subject, setSubject] = useState<Record<string, unknown> | null>(null);
    const [subjectLoading, setSubjectLoading] = useState(false);
    const [eraseOpen, setEraseOpen] = useState(false);
    const [eraseConfirm, setEraseConfirm] = useState('');
    const [erasing, setErasing] = useState(false);

    const load = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/whatsapp/compliance');
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error ?? 'Could not load compliance data');

            setData(payload);
            setError(null);
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'Could not load compliance data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const lookup = useCallback(async () => {
        if (!subjectPhone.trim()) return;
        setSubjectLoading(true);
        try {
            const response = await fetch(
                `/api/admin/whatsapp/compliance/subject?phone=${encodeURIComponent(subjectPhone.trim())}`,
            );
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error ?? 'Lookup failed');

            setSubject(payload);
            if (!payload.found) toast.info('Nothing held for that number.');

            // The lookup is itself an audited action, so the audit tab is now one
            // entry out of date until the dashboard data is refetched.
            await load();
        } catch (caught) {
            toast.error(caught instanceof Error ? caught.message : 'Lookup failed');
        } finally {
            setSubjectLoading(false);
        }
    }, [load, subjectPhone]);

    const downloadExport = useCallback(() => {
        if (!subject) return;
        const blob = new Blob([JSON.stringify(subject, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `whatsapp-data-${String(subject.phone).replace(/\D/g, '')}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
    }, [subject]);

    const erase = useCallback(async () => {
        setErasing(true);
        try {
            const response = await fetch('/api/admin/whatsapp/compliance/subject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: subjectPhone.trim(), confirm: 'ERASE' }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error ?? 'Erasure failed');

            toast.success(
                result.erased
                    ? `Erased. ${result.removed.messages} messages and ${result.removed.consentEvents} consent records removed; the number is now suppressed.`
                    : 'No contact held for that number. It has been added to the suppression list.',
            );

            setEraseOpen(false);
            setEraseConfirm('');
            setSubject(null);
            await load();
        } catch (caught) {
            toast.error(caught instanceof Error ? caught.message : 'Erasure failed');
        } finally {
            setErasing(false);
        }
    }, [load, subjectPhone]);

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-6">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                    <p className="font-medium text-amber-900">Could not load compliance data</p>
                    <p className="mt-1 text-sm text-amber-800">{error}</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={load}>Try again</Button>
                </div>
            </div>
        );
    }

    const { snapshot } = data;

    return (
        <div className="space-y-6">
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <Card label="Contacts" value={snapshot.contacts} />
                <Card label="Opted in" value={snapshot.optedIn} />
                <Card
                    label="With documented proof"
                    value={`${snapshot.proofPercent}%`}
                    warn={snapshot.proofPercent < 100}
                    hint="Should be 100%"
                />
                <Card label="Suppressed" value={snapshot.suppressed} />
                <Card
                    label="Opt-outs (30d)"
                    value={snapshot.optOutsLast30Days}
                    warn={snapshot.optOutsLast30Days > 0}
                />
            </section>

            {snapshot.rawEventsOver30Days > 0 && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <p className="text-xs text-amber-900">
                        {snapshot.rawEventsOver30Days.toLocaleString('en-IN')} raw webhook payloads are older
                        than 30 days. These contain guest message bodies and are purged nightly by the
                        retention cron; if this number keeps growing, the cron is not running.
                    </p>
                </div>
            )}

            <Tabs defaultValue="subject">
                <TabsList>
                    <TabsTrigger value="subject">Data subject request</TabsTrigger>
                    <TabsTrigger value="ledger">Consent ledger</TabsTrigger>
                    <TabsTrigger value="suppression">Suppression list</TabsTrigger>
                    <TabsTrigger value="audit">Audit log</TabsTrigger>
                </TabsList>

                <TabsContent value="subject" className="mt-4 space-y-4">
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <Label htmlFor="dsr-phone" className="text-xs font-medium text-gray-700">
                            Phone number
                        </Label>
                        <p className="mt-1 text-xs text-gray-500">
                            Enter the number exactly as the guest gave it. Everything we hold about them is
                            returned, and the lookup itself is recorded in the audit log.
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <Input
                                id="dsr-phone"
                                value={subjectPhone}
                                onChange={(event) => setSubjectPhone(event.target.value)}
                                onKeyDown={(event) => { if (event.key === 'Enter') lookup(); }}
                                placeholder="+91 98470 12345"
                                className="max-w-xs"
                            />
                            <Button onClick={lookup} disabled={subjectLoading || !subjectPhone.trim()}>
                                {subjectLoading
                                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    : <Search className="mr-2 h-4 w-4" />}
                                Look up
                            </Button>
                        </div>
                    </div>

                    {subject && (
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="text-sm font-semibold text-gray-900">
                                    {String(subject.phone)}
                                    <span className="ml-2 text-xs font-normal text-gray-500">
                                        {subject.found ? 'found' : 'nothing held'}
                                    </span>
                                </h3>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={downloadExport}>
                                        <Download className="mr-2 h-3.5 w-3.5" />
                                        Export JSON
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => setEraseOpen(true)}>
                                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                                        Erase
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                                <Mini label="Consent records" value={(subject.consentEvents as unknown[])?.length ?? 0} />
                                <Mini label="Messages sent" value={(subject.messages as unknown[])?.length ?? 0} />
                                <Mini
                                    label="Inbox messages"
                                    value={((subject.conversation as { messages?: unknown[] })?.messages ?? []).length}
                                />
                                <Mini label="Suppressed" value={subject.suppression ? 'yes' : 'no'} />
                            </div>

                            <details className="mt-3">
                                <summary className="cursor-pointer text-xs font-medium text-gray-600">
                                    Raw record
                                </summary>
                                <pre className="mt-2 max-h-80 overflow-auto rounded bg-gray-50 p-3 text-[11px] leading-relaxed text-gray-700">
                                    {JSON.stringify(subject, null, 2)}
                                </pre>
                            </details>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="ledger" className="mt-4">
                    <div className="rounded-lg border border-gray-200 bg-white">
                        <p className="border-b border-gray-100 px-4 py-2 text-xs text-gray-500">
                            Append-only. {data.ledger.total.toLocaleString('en-IN')} entries — every grant,
                            change and withdrawal of consent.
                        </p>
                        {!data.ledger.events.length ? (
                            <Empty icon={FileSearch} text="No consent events recorded yet." />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="text-gray-500">
                                        <tr className="border-b border-gray-100">
                                            <th className="px-4 py-2 font-medium">When</th>
                                            <th className="px-4 py-2 font-medium">Number</th>
                                            <th className="px-4 py-2 font-medium">Change</th>
                                            <th className="px-4 py-2 font-medium">Source</th>
                                            <th className="px-4 py-2 font-medium">Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {data.ledger.events.map((event) => (
                                            <tr key={event.id}>
                                                <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                                                    {formatDate(event.createdAt)}
                                                </td>
                                                <td className="px-4 py-2 font-medium text-gray-900">{event.phone}</td>
                                                <td className="px-4 py-2">
                                                    <span className="text-gray-400">{event.fromStatus ?? '—'}</span>
                                                    {' → '}
                                                    <span
                                                        className={cn(
                                                            'font-medium',
                                                            event.toStatus === 'opted_in' && 'text-emerald-700',
                                                            event.toStatus === 'opted_out' && 'text-amber-700',
                                                            event.toStatus === 'suppressed' && 'text-red-700',
                                                        )}
                                                    >
                                                        {event.toStatus}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-gray-600">{event.source ?? '—'}</td>
                                                <td className="max-w-xs truncate px-4 py-2 text-gray-600" title={event.reason ?? ''}>
                                                    {event.reason ?? '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="suppression" className="mt-4">
                    <div className="rounded-lg border border-gray-200 bg-white">
                        <p className="border-b border-gray-100 px-4 py-2 text-xs text-gray-500">
                            Permanent do-not-contact. {data.suppression.total.toLocaleString('en-IN')} numbers.
                            A number here can never be re-added by a CSV import — that is the point of it.
                        </p>
                        {!data.suppression.entries.length ? (
                            <Empty icon={ShieldOff} text="Nobody is suppressed." />
                        ) : (
                            <ul className="divide-y divide-gray-50">
                                {data.suppression.entries.map((entry) => (
                                    <li key={entry.id} className="flex items-center justify-between gap-3 px-4 py-2 text-xs">
                                        <span className="font-medium text-gray-900">{entry.phone}</span>
                                        <span className="flex-1 truncate text-gray-500">{entry.reason}</span>
                                        <span className="shrink-0 text-gray-400">{formatDate(entry.createdAt)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="audit" className="mt-4">
                    <div className="rounded-lg border border-gray-200 bg-white">
                        <p className="border-b border-gray-100 px-4 py-2 text-xs text-gray-500">
                            {data.audit.total.toLocaleString('en-IN')} recorded actions — imports, campaign
                            launches, consent overrides, setting changes, kill-switch flips.
                        </p>
                        {!data.audit.entries.length ? (
                            <Empty icon={FileSearch} text="No admin actions recorded yet." />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="text-gray-500">
                                        <tr className="border-b border-gray-100">
                                            <th className="px-4 py-2 font-medium">When</th>
                                            <th className="px-4 py-2 font-medium">Who</th>
                                            <th className="px-4 py-2 font-medium">Action</th>
                                            <th className="px-4 py-2 font-medium">Entity</th>
                                            <th className="px-4 py-2 font-medium">Change</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {data.audit.entries.map((entry) => (
                                            <tr key={entry.id}>
                                                <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                                                    {formatDate(entry.createdAt)}
                                                </td>
                                                <td className="px-4 py-2 text-gray-700">{entry.actorEmail ?? 'system'}</td>
                                                <td className="px-4 py-2 font-medium text-gray-900">{entry.action}</td>
                                                <td className="px-4 py-2 text-gray-500">{entry.entityType ?? '—'}</td>
                                                <td className="max-w-sm px-4 py-2">
                                                    {entry.after ? (
                                                        <code className="block truncate text-[11px] text-gray-600"
                                                            title={JSON.stringify(entry.after)}>
                                                            {JSON.stringify(entry.after)}
                                                        </code>
                                                    ) : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            <Dialog open={eraseOpen} onOpenChange={setEraseOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Erase {subjectPhone}?</DialogTitle>
                        <DialogDescription asChild>
                            <div className="space-y-2 text-sm text-gray-600">
                                <p>
                                    This permanently deletes the contact, their message history and their
                                    consent records. It cannot be undone.
                                </p>
                                <p>
                                    The number is added to the suppression list at the same time, so erasing
                                    them does not have the side effect of making them contactable again by a
                                    future import.
                                </p>
                            </div>
                        </DialogDescription>
                    </DialogHeader>

                    <div>
                        <Label htmlFor="erase-confirm" className="text-xs">
                            Type ERASE to confirm
                        </Label>
                        <Input
                            id="erase-confirm"
                            value={eraseConfirm}
                            onChange={(event) => setEraseConfirm(event.target.value)}
                            placeholder="ERASE"
                            className="mt-1"
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEraseOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={erase}
                            disabled={erasing || eraseConfirm !== 'ERASE'}
                        >
                            {erasing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Erase permanently
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function Card({ label, value, warn, hint }: { label: string; value: number | string; warn?: boolean; hint?: string }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={cn('mt-1 text-xl font-semibold tabular-nums', warn ? 'text-amber-600' : 'text-gray-900')}>
                {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
            </p>
            {hint && <p className="mt-0.5 text-[10px] text-gray-400">{hint}</p>}
        </div>
    );
}

function Mini({ label, value }: { label: string; value: number | string }) {
    return (
        <div>
            <p className="text-gray-500">{label}</p>
            <p className="mt-0.5 font-semibold text-gray-900">{value}</p>
        </div>
    );
}

function Empty({ icon: Icon, text }: { icon: typeof FileSearch; text: string }) {
    return (
        <div className="p-8 text-center">
            <Icon className="mx-auto h-7 w-7 text-gray-300" />
            <p className="mt-2 text-xs text-gray-500">{text}</p>
        </div>
    );
}
