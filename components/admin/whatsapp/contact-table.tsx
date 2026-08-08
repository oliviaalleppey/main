'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
    AlertTriangle, Download, Loader2, Plus, Search, Tag as TagIcon, Upload, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ConsentBadge, CONSENT_META, type ConsentStatus } from './consent-badge';
import { AddContactDialog } from './add-contact-dialog';
import { cn } from '@/lib/utils';

export type ContactRow = {
    id: string;
    phone: string;
    name: string | null;
    email: string | null;
    source: string;
    consentStatus: ConsentStatus;
    consentSource: string | null;
    consentAt: string | null;
    optedOutAt: string | null;
    lastInboundAt: string | null;
    lastOutboundAt: string | null;
    marketingSent30d: number | null;
    tags: string[] | null;
    createdAt: string | null;
    guestProfileId: string | null;
    totalStays: number | null;
    lastStayAt: string | null;
    city: string | null;
};

type ListResponse = {
    contacts: ContactRow[];
    pagination: { page: number; pageSize: number; total: number; pages: number };
    statusCounts: Record<string, number>;
    tags: { tag: string; count: number }[];
};

const STATUS_ORDER: ConsentStatus[] = ['opted_in', 'pending', 'opted_out', 'suppressed'];

const SOURCE_LABELS: Record<string, string> = {
    booking: 'Booking',
    guest_profile: 'Guest profile',
    inquiry: 'Inquiry',
    import: 'Import',
    inbound: 'Inbound',
    manual: 'Added by hand',
};

const ENGAGEMENT_LABELS: Record<string, string> = {
    never_messaged: 'Never messaged',
    messaged: 'Messaged before',
    replied: 'Has replied',
    never_replied: 'Never replied',
};

const PAGE_SIZE = 50;

/** +919847123456 -> +91 98471 23456. Kept local: phone.ts pulls in server-only metadata. */
function prettyPhone(e164: string): string {
    const match = /^\+91(\d{5})(\d{5})$/.exec(e164);
    return match ? `+91 ${match[1]} ${match[2]}` : e164;
}

function formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function ContactTable() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [data, setData] = useState<ListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkAction, setBulkAction] = useState<'tag' | 'untag' | 'consent' | null>(null);
    const [addOpen, setAddOpen] = useState(false);

    // Search is local so typing stays responsive; it is pushed to the URL on a delay.
    const [search, setSearch] = useState(searchParams.get('search') ?? '');

    const query = searchParams.toString();

    const setParam = useCallback(
        (updates: Record<string, string | string[] | null>) => {
            const next = new URLSearchParams(searchParams.toString());
            for (const [key, value] of Object.entries(updates)) {
                next.delete(key);
                if (Array.isArray(value)) value.forEach((v) => next.append(key, v));
                else if (value) next.set(key, value);
            }
            // Any filter change invalidates the current page number.
            if (!('page' in updates)) next.delete('page');
            router.replace(`${pathname}?${next.toString()}`, { scroll: false });
        },
        [pathname, router, searchParams],
    );

    // Debounce the search box into the URL.
    const firstSearchRun = useRef(true);
    useEffect(() => {
        if (firstSearchRun.current) {
            firstSearchRun.current = false;
            return;
        }
        const timer = setTimeout(() => {
            if ((searchParams.get('search') ?? '') !== search) setParam({ search: search || null });
        }, 350);
        return () => clearTimeout(timer);
    }, [search, searchParams, setParam]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams(query);
            params.set('pageSize', String(PAGE_SIZE));
            const response = await fetch(`/api/admin/whatsapp/contacts?${params.toString()}`);
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
            setData(body as ListResponse);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load contacts');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [query]);

    useEffect(() => {
        void load();
        // Selection is per-result-set; keeping it across a filter change would let a
        // bulk action hit rows the operator can no longer see.
        setSelected(new Set());
    }, [load]);

    const contacts = data?.contacts ?? [];
    const activeStatuses = searchParams.getAll('consentStatus');
    const page = Number(searchParams.get('page') ?? 1);

    const filterCount = useMemo(() => {
        let count = 0;
        for (const key of ['search', 'tag', 'city', 'hasBooked', 'engagement']) {
            if (searchParams.get(key)) count += 1;
        }
        count += searchParams.getAll('consentStatus').length;
        count += searchParams.getAll('source').length;
        return count;
    }, [searchParams]);

    const allOnPageSelected = contacts.length > 0 && contacts.every((c) => selected.has(c.id));

    function toggleAll() {
        setSelected(allOnPageSelected ? new Set() : new Set(contacts.map((c) => c.id)));
    }

    function toggleOne(id: string) {
        setSelected((current) => {
            const next = new Set(current);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function toggleStatus(status: ConsentStatus) {
        const next = activeStatuses.includes(status)
            ? activeStatuses.filter((s) => s !== status)
            : [...activeStatuses, status];
        setParam({ consentStatus: next });
    }

    function exportCsv(onlySelected: boolean) {
        const params = new URLSearchParams(onlySelected ? '' : query);
        params.delete('page');
        params.delete('pageSize');
        if (onlySelected) params.set('ids', [...selected].join(','));
        window.location.href = `/api/admin/whatsapp/contacts/export?${params.toString()}`;
    }

    if (error) {
        return (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-6">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                        <h2 className="font-semibold text-amber-900">Contacts could not be loaded</h2>
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
            {/* Header actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative min-w-[240px] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by name, number or email"
                        className="pl-9"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => exportCsv(false)}>
                        <Download className="mr-1.5 h-4 w-4" /> Export
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                        <Plus className="mr-1.5 h-4 w-4" /> Add contact
                    </Button>
                    <Button size="sm" asChild>
                        <Link href="/admin/whatsapp/contacts/import">
                            <Upload className="mr-1.5 h-4 w-4" /> Import a sheet
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Consent chips — the primary filter, because consent is what decides sendability */}
            <div className="flex flex-wrap items-center gap-2">
                {STATUS_ORDER.map((status) => {
                    const active = activeStatuses.includes(status);
                    const count = data?.statusCounts[status] ?? 0;
                    return (
                        <button
                            key={status}
                            type="button"
                            onClick={() => toggleStatus(status)}
                            title={CONSENT_META[status].meaning}
                            className={cn(
                                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                                active
                                    ? 'border-gray-900 bg-gray-900 text-white'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400',
                            )}
                        >
                            {CONSENT_META[status].label}
                            <span className={cn('ml-1.5', active ? 'text-gray-300' : 'text-gray-400')}>{count}</span>
                        </button>
                    );
                })}

                <div className="ml-auto flex flex-wrap items-center gap-2">
                    <FilterSelect
                        value={searchParams.get('source') ?? ''}
                        onChange={(value) => setParam({ source: value || null })}
                        placeholder="Any source"
                        options={Object.entries(SOURCE_LABELS).map(([value, label]) => ({ value, label }))}
                    />
                    <FilterSelect
                        value={searchParams.get('tag') ?? ''}
                        onChange={(value) => setParam({ tag: value || null })}
                        placeholder="Any tag"
                        options={(data?.tags ?? []).map((t) => ({ value: t.tag, label: `${t.tag} (${t.count})` }))}
                    />
                    <FilterSelect
                        value={searchParams.get('engagement') ?? ''}
                        onChange={(value) => setParam({ engagement: value || null })}
                        placeholder="Any engagement"
                        options={Object.entries(ENGAGEMENT_LABELS).map(([value, label]) => ({ value, label }))}
                    />
                    <FilterSelect
                        value={searchParams.get('hasBooked') ?? ''}
                        onChange={(value) => setParam({ hasBooked: value || null })}
                        placeholder="Any guest"
                        options={[
                            { value: 'true', label: 'Has a guest profile' },
                            { value: 'false', label: 'No guest profile' },
                        ]}
                    />
                    {filterCount > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearch('');
                                router.replace(pathname, { scroll: false });
                            }}
                            className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700"
                        >
                            <X className="h-3.5 w-3.5" /> Clear {filterCount}
                        </button>
                    )}
                </div>
            </div>

            {/* Bulk action bar */}
            {selected.size > 0 && (
                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-900 bg-gray-900 px-4 py-2.5 text-sm text-white">
                    <span className="font-medium">{selected.size} selected</span>
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        <BulkButton onClick={() => setBulkAction('tag')}>Add tag</BulkButton>
                        <BulkButton onClick={() => setBulkAction('untag')}>Remove tag</BulkButton>
                        <BulkButton onClick={() => setBulkAction('consent')}>Set consent</BulkButton>
                        <BulkButton onClick={() => exportCsv(true)}>Export selected</BulkButton>
                        <button
                            type="button"
                            onClick={() => setSelected(new Set())}
                            className="rounded p-1 text-gray-300 hover:text-white"
                            aria-label="Clear selection"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="rounded-lg border border-gray-200 bg-white">
                {loading && !data ? (
                    <div className="space-y-3 p-4">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <Skeleton key={index} className="h-8 w-full" />
                        ))}
                    </div>
                ) : contacts.length === 0 ? (
                    <EmptyState hasFilters={filterCount > 0} onClear={() => router.replace(pathname, { scroll: false })} />
                ) : (
                    <Table className={loading ? 'opacity-60 transition-opacity' : undefined}>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-10">
                                    <Checkbox
                                        checked={allOnPageSelected}
                                        onCheckedChange={toggleAll}
                                        aria-label="Select all on this page"
                                    />
                                </TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Consent</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Tags</TableHead>
                                <TableHead>Guest</TableHead>
                                <TableHead>Last sent</TableHead>
                                <TableHead>Last reply</TableHead>
                                <TableHead className="text-right">30d</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contacts.map((contact) => (
                                <TableRow key={contact.id} data-state={selected.has(contact.id) ? 'selected' : undefined}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selected.has(contact.id)}
                                            onCheckedChange={() => toggleOne(contact.id)}
                                            aria-label={`Select ${contact.phone}`}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Link
                                            href={`/admin/whatsapp/contacts/${contact.id}`}
                                            className="font-medium text-gray-900 hover:underline"
                                        >
                                            {contact.name || 'Unnamed'}
                                        </Link>
                                        <div className="text-xs text-gray-500">{prettyPhone(contact.phone)}</div>
                                    </TableCell>
                                    <TableCell>
                                        <ConsentBadge status={contact.consentStatus} />
                                    </TableCell>
                                    <TableCell className="text-xs text-gray-600">
                                        {SOURCE_LABELS[contact.source] ?? contact.source}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {(contact.tags ?? []).slice(0, 3).map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                            {(contact.tags?.length ?? 0) > 3 && (
                                                <span className="text-xs text-gray-400">
                                                    +{(contact.tags?.length ?? 0) - 3}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-gray-600">
                                        {contact.guestProfileId
                                            ? `${contact.totalStays ?? 0} stay${contact.totalStays === 1 ? '' : 's'}${contact.city ? ` · ${contact.city}` : ''}`
                                            : '—'}
                                    </TableCell>
                                    <TableCell className="text-xs text-gray-600">{formatDate(contact.lastOutboundAt)}</TableCell>
                                    <TableCell className="text-xs text-gray-600">{formatDate(contact.lastInboundAt)}</TableCell>
                                    <TableCell className="text-right text-xs text-gray-600">
                                        {contact.marketingSent30d ?? 0}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Pagination */}
            {data && data.pagination.total > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
                    <span>
                        {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.pagination.total)} of{' '}
                        {data.pagination.total.toLocaleString('en-IN')}
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1 || loading}
                            onClick={() => setParam({ page: String(page - 1) })}
                        >
                            Previous
                        </Button>
                        <span className="text-xs">
                            Page {page} of {Math.max(1, data.pagination.pages)}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= data.pagination.pages || loading}
                            onClick={() => setParam({ page: String(page + 1) })}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            <BulkDialog
                action={bulkAction}
                count={selected.size}
                onClose={() => setBulkAction(null)}
                onDone={() => {
                    setBulkAction(null);
                    setSelected(new Set());
                    void load();
                }}
                contactIds={[...selected]}
            />

            <AddContactDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                onCreated={() => {
                    setAddOpen(false);
                    void load();
                }}
            />
        </div>
    );
}

function BulkButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="rounded-md border border-gray-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-gray-800"
        >
            {children}
        </button>
    );
}

function FilterSelect({
    value,
    onChange,
    placeholder,
    options,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    options: { value: string; label: string }[];
}) {
    return (
        <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={cn(
                'h-8 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-700',
                'focus:outline-none focus:ring-2 focus:ring-gray-900/10',
                value && 'border-gray-900 font-medium text-gray-900',
            )}
        >
            <option value="">{placeholder}</option>
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
    return (
        <div className="px-6 py-16 text-center">
            <TagIcon className="mx-auto h-8 w-8 text-gray-300" />
            <h3 className="mt-3 text-sm font-semibold text-gray-900">
                {hasFilters ? 'No contacts match these filters' : 'No contacts yet'}
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
                {hasFilters
                    ? 'Try widening the filters, or clear them to see the whole list.'
                    : 'Import a contact sheet to get started. Everything imported without a documented opt-in lands as Pending and can only be sent the re-permission template.'}
            </p>
            <div className="mt-4 flex justify-center gap-2">
                {hasFilters ? (
                    <Button variant="outline" size="sm" onClick={onClear}>
                        Clear filters
                    </Button>
                ) : (
                    <Button size="sm" asChild>
                        <Link href="/admin/whatsapp/contacts/import">Import a sheet</Link>
                    </Button>
                )}
            </div>
        </div>
    );
}

/**
 * Bulk action dialog. A consent change demands a reason before the button is even
 * enabled — the API rejects it without one, and the UI should not let an operator
 * discover that after selecting 200 people.
 */
function BulkDialog({
    action,
    count,
    contactIds,
    onClose,
    onDone,
}: {
    action: 'tag' | 'untag' | 'consent' | null;
    count: number;
    contactIds: string[];
    onClose: () => void;
    onDone: () => void;
}) {
    const [tag, setTag] = useState('');
    const [status, setStatus] = useState<ConsentStatus>('opted_out');
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (action) {
            setTag('');
            setReason('');
            setStatus('opted_out');
        }
    }, [action]);

    const canSubmit = action === 'consent' ? reason.trim().length > 0 : tag.trim().length > 0;

    async function submit() {
        setSaving(true);
        try {
            const payload =
                action === 'consent'
                    ? { action: 'set_consent', contactIds, consentStatus: status, reason: reason.trim() }
                    : { action: action === 'tag' ? 'add_tag' : 'remove_tag', contactIds, tag: tag.trim() };

            const response = await fetch('/api/admin/whatsapp/contacts/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);

            toast.success(
                body.changed === 0
                    ? 'Nothing needed changing'
                    : `${body.changed} contact${body.changed === 1 ? '' : 's'} updated`,
            );
            onDone();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Bulk action failed');
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open={action !== null} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {action === 'consent' ? 'Set consent status' : action === 'tag' ? 'Add a tag' : 'Remove a tag'}
                    </DialogTitle>
                    <DialogDescription>
                        Applies to {count} selected contact{count === 1 ? '' : 's'}.
                    </DialogDescription>
                </DialogHeader>

                {action === 'consent' ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>New status</Label>
                            <div className="grid gap-2">
                                {STATUS_ORDER.map((option) => (
                                    <label
                                        key={option}
                                        className={cn(
                                            'flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm',
                                            status === option ? 'border-gray-900 bg-gray-50' : 'border-gray-200',
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="bulk-consent"
                                            className="mt-1"
                                            checked={status === option}
                                            onChange={() => setStatus(option)}
                                        />
                                        <span>
                                            <span className="font-medium text-gray-900">{CONSENT_META[option].label}</span>
                                            <span className="block text-xs text-gray-500">{CONSENT_META[option].meaning}</span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="bulk-reason">Reason (required)</Label>
                            <Textarea
                                id="bulk-reason"
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                                placeholder="e.g. Guests who replied STOP to the March re-permission campaign"
                                rows={3}
                            />
                            <p className="text-xs text-gray-500">
                                Recorded against every contact in the consent ledger. This is the evidence trail.
                            </p>
                        </div>
                        {status === 'suppressed' && (
                            <p className="rounded-md bg-red-50 p-3 text-xs text-red-800">
                                Suppression is permanent. These numbers can never be re-added by a future import.
                            </p>
                        )}
                        {status === 'opted_in' && (
                            <p className="rounded-md bg-amber-50 p-3 text-xs text-amber-900">
                                Only do this when you can point to a real opt-in. Marking someone opted in without one
                                is the record you cannot defend if challenged.
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        <Label htmlFor="bulk-tag">Tag</Label>
                        <Input
                            id="bulk-tag"
                            value={tag}
                            onChange={(event) => setTag(event.target.value)}
                            placeholder="e.g. onam-2026"
                        />
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={() => void submit()} disabled={!canSubmit || saving}>
                        {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                        Apply to {count}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
