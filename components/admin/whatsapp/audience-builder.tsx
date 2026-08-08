'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ExclusionPanel, type Breakdown, type SampleContact } from './exclusion-panel';
import { cn } from '@/lib/utils';

/**
 * The audience filter builder.
 *
 * Every edit re-runs the preview, so the operator always sees the live eligible
 * count and — more importantly — the exclusion breakdown next to the filter that
 * produced it. Consent is not a filter here on purpose: it is applied by the
 * server at count and send time, so no combination of controls in this form can
 * widen an audience past the consent rules.
 */

export type AudienceFilter = {
    consentStatus?: string[];
    source?: string[];
    tags?: string[];
    tagMatch?: 'any' | 'all';
    hasEmail?: boolean;
    minStays?: number;
    maxStays?: number;
    minSpent?: number;
    isVIP?: boolean;
    lastStayWithinDays?: number;
    lastStayNotWithinDays?: number;
    neverStayed?: boolean;
    birthdayMonth?: number;
    anniversaryMonth?: number;
    city?: string[];
    hasEverRead?: boolean;
    neverMessaged?: boolean;
    notMessagedInDays?: number;
    hadFailure?: boolean;
    hasRepliedEver?: boolean;
};

const CONSENT_OPTIONS = [
    { value: 'opted_in', label: 'Opted in' },
    { value: 'pending', label: 'Pending' },
    { value: 'opted_out', label: 'Opted out' },
    { value: 'suppressed', label: 'Suppressed' },
];

const SOURCE_OPTIONS = [
    { value: 'import', label: 'Import' },
    { value: 'booking', label: 'Booking' },
    { value: 'guest_profile', label: 'Guest profile' },
    { value: 'inquiry', label: 'Inquiry' },
    { value: 'inbound', label: 'Inbound' },
    { value: 'manual', label: 'By hand' },
];

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

export function AudienceBuilder({
    open,
    onOpenChange,
    onSaved,
    initial,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved: () => void;
    initial?: { name: string; description: string; filter: AudienceFilter };
}) {
    const [name, setName] = useState(initial?.name ?? '');
    const [description, setDescription] = useState(initial?.description ?? '');
    const [type, setType] = useState<'dynamic' | 'static'>('dynamic');
    const [filter, setFilter] = useState<AudienceFilter>(initial?.filter ?? { consentStatus: ['opted_in'] });

    const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
    const [samples, setSamples] = useState<SampleContact[]>([]);
    const [frequencyCap, setFrequencyCap] = useState(2);
    const [previewing, setPreviewing] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setName(initial?.name ?? '');
            setDescription(initial?.description ?? '');
            setType('dynamic');
            setFilter(initial?.filter ?? { consentStatus: ['opted_in'] });
        }
        // `initial` is a fresh object each render; keying off `open` is what we want.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const patch = useCallback((updates: Partial<AudienceFilter>) => {
        setFilter((current) => {
            const next = { ...current, ...updates };
            // Strip keys set back to undefined so the payload stays minimal and the
            // strict server schema doesn't see explicit nulls.
            for (const key of Object.keys(next) as (keyof AudienceFilter)[]) {
                const value = next[key];
                if (value === undefined || (Array.isArray(value) && value.length === 0)) delete next[key];
            }
            return next;
        });
    }, []);

    // Re-preview on every filter change, debounced.
    const requestId = useRef(0);
    useEffect(() => {
        if (!open) return;
        const id = ++requestId.current;
        const timer = setTimeout(async () => {
            setPreviewing(true);
            setPreviewError(null);
            try {
                const response = await fetch('/api/admin/whatsapp/audiences/preview', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filter, limit: 20 }),
                });
                const body = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(body.error || `Preview failed (${response.status})`);
                // Ignore a slow response that a newer edit has already superseded.
                if (id !== requestId.current) return;
                setBreakdown(body.breakdown);
                setSamples(body.samples ?? []);
                setFrequencyCap(body.frequencyCap ?? 2);
            } catch (error) {
                if (id !== requestId.current) return;
                setPreviewError(error instanceof Error ? error.message : 'Preview failed');
                setBreakdown(null);
                setSamples([]);
            } finally {
                if (id === requestId.current) setPreviewing(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [filter, open]);

    async function save() {
        setSaving(true);
        try {
            const response = await fetch('/api/admin/whatsapp/audiences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    type,
                    filter,
                }),
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.error || `Could not save (${response.status})`);

            toast.success(`Audience saved — ${body.audience.lastCount} eligible`);
            onSaved();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not save the audience');
        } finally {
            setSaving(false);
        }
    }

    function toggleInArray(key: 'consentStatus' | 'source', value: string) {
        const current = filter[key] ?? [];
        patch({
            [key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
        } as Partial<AudienceFilter>);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Build an audience</DialogTitle>
                    <DialogDescription>
                        The count updates as you filter. Consent rules are applied on top of whatever you build
                        here — they cannot be filtered away.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                    {/* Filter controls */}
                    <div className="space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="audience-name">Name</Label>
                                <Input
                                    id="audience-name"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    placeholder="e.g. Onam offer — repeat guests"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="audience-type">Type</Label>
                                <select
                                    id="audience-type"
                                    value={type}
                                    onChange={(event) => setType(event.target.value as 'dynamic' | 'static')}
                                    className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm"
                                >
                                    <option value="dynamic">Dynamic — re-evaluated at send time</option>
                                    <option value="static">Static — frozen list</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="audience-description">Description</Label>
                            <Textarea
                                id="audience-description"
                                rows={2}
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                            />
                        </div>

                        {type === 'static' && (
                            <p className="rounded-md bg-amber-50 p-3 text-xs text-amber-900">
                                A static audience freezes today&apos;s matches. It will not pick up people who opt out
                                later — the dispatcher re-checks consent per message, but the count you see will drift.
                                Dynamic is almost always the right choice.
                            </p>
                        )}

                        <Section title="Consent status">
                            <ChipGroup
                                options={CONSENT_OPTIONS}
                                selected={filter.consentStatus ?? []}
                                onToggle={(value) => toggleInArray('consentStatus', value)}
                            />
                            <p className="mt-1.5 text-xs text-gray-500">
                                Narrows who the filter matches. Eligibility to actually receive a message is enforced
                                separately.
                            </p>
                        </Section>

                        <Section title="Source">
                            <ChipGroup
                                options={SOURCE_OPTIONS}
                                selected={filter.source ?? []}
                                onToggle={(value) => toggleInArray('source', value)}
                            />
                        </Section>

                        <Section title="Tags">
                            <Input
                                value={(filter.tags ?? []).join(', ')}
                                onChange={(event) =>
                                    patch({
                                        tags: event.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                                    })
                                }
                                placeholder="comma, separated"
                            />
                            {(filter.tags?.length ?? 0) > 1 && (
                                <label className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={filter.tagMatch === 'all'}
                                        onChange={(event) => patch({ tagMatch: event.target.checked ? 'all' : 'any' })}
                                    />
                                    Must have <strong>all</strong> of these tags (otherwise any)
                                </label>
                            )}
                        </Section>

                        <Section title="Guest value">
                            <div className="grid gap-3 sm:grid-cols-3">
                                <NumberField
                                    label="Min stays"
                                    value={filter.minStays}
                                    onChange={(value) => patch({ minStays: value })}
                                />
                                <NumberField
                                    label="Max stays"
                                    value={filter.maxStays}
                                    onChange={(value) => patch({ maxStays: value })}
                                />
                                <NumberField
                                    label="Min spent (₹)"
                                    value={filter.minSpent === undefined ? undefined : filter.minSpent / 100}
                                    onChange={(value) =>
                                        // Money is paise everywhere in this codebase.
                                        patch({ minSpent: value === undefined ? undefined : Math.round(value * 100) })
                                    }
                                />
                            </div>
                            <CheckRow
                                label="VIP guests only"
                                checked={filter.isVIP === true}
                                onChange={(checked) => patch({ isVIP: checked ? true : undefined })}
                            />
                        </Section>

                        <Section title="Recency">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <NumberField
                                    label="Stayed within (days)"
                                    value={filter.lastStayWithinDays}
                                    onChange={(value) => patch({ lastStayWithinDays: value })}
                                />
                                <NumberField
                                    label="No stay in (days)"
                                    value={filter.lastStayNotWithinDays}
                                    onChange={(value) => patch({ lastStayNotWithinDays: value })}
                                />
                            </div>
                            <CheckRow
                                label="Never stayed"
                                checked={filter.neverStayed === true}
                                onChange={(checked) => patch({ neverStayed: checked ? true : undefined })}
                            />
                        </Section>

                        <Section title="Calendar">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <MonthField
                                    label="Birthday in"
                                    value={filter.birthdayMonth}
                                    onChange={(value) => patch({ birthdayMonth: value })}
                                />
                                <MonthField
                                    label="Anniversary in"
                                    value={filter.anniversaryMonth}
                                    onChange={(value) => patch({ anniversaryMonth: value })}
                                />
                            </div>
                        </Section>

                        <Section title="Engagement">
                            <CheckRow
                                label="Never messaged"
                                checked={filter.neverMessaged === true}
                                onChange={(checked) => patch({ neverMessaged: checked ? true : undefined })}
                            />
                            <CheckRow
                                label="Has replied at least once"
                                checked={filter.hasRepliedEver === true}
                                onChange={(checked) => patch({ hasRepliedEver: checked ? true : undefined })}
                            />
                            <CheckRow
                                label="Has read a message"
                                checked={filter.hasEverRead === true}
                                onChange={(checked) => patch({ hasEverRead: checked ? true : undefined })}
                            />
                            <CheckRow
                                label="Previously failed"
                                checked={filter.hadFailure === true}
                                onChange={(checked) => patch({ hadFailure: checked ? true : undefined })}
                            />
                            <div className="mt-2 max-w-[200px]">
                                <NumberField
                                    label="Not messaged in (days)"
                                    value={filter.notMessagedInDays}
                                    onChange={(value) => patch({ notMessagedInDays: value })}
                                />
                            </div>
                        </Section>
                    </div>

                    {/* Live count + exclusions */}
                    <div className="lg:border-l lg:border-gray-100 lg:pl-6">
                        <ExclusionPanel
                            breakdown={breakdown}
                            samples={samples}
                            loading={previewing}
                            error={previewError}
                            frequencyCap={frequencyCap}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={() => void save()} disabled={saving || !name.trim()}>
                        {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                        <Users className="mr-1.5 h-4 w-4" />
                        Save audience
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="border-t border-gray-100 pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h4>
            <div className="mt-2">{children}</div>
        </div>
    );
}

function ChipGroup({
    options,
    selected,
    onToggle,
}: {
    options: { value: string; label: string }[];
    selected: string[];
    onToggle: (value: string) => void;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onToggle(option.value)}
                    className={cn(
                        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                        selected.includes(option.value)
                            ? 'border-gray-900 bg-gray-900 text-white'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400',
                    )}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

function NumberField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: number | undefined;
    onChange: (value: number | undefined) => void;
}) {
    return (
        <div className="space-y-1">
            <Label className="text-xs font-normal text-gray-500">{label}</Label>
            <Input
                type="number"
                min={0}
                value={value ?? ''}
                onChange={(event) => {
                    const raw = event.target.value;
                    onChange(raw === '' ? undefined : Number(raw));
                }}
                className="h-9"
            />
        </div>
    );
}

function MonthField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: number | undefined;
    onChange: (value: number | undefined) => void;
}) {
    return (
        <div className="space-y-1">
            <Label className="text-xs font-normal text-gray-500">{label}</Label>
            <select
                value={value ?? ''}
                onChange={(event) => onChange(event.target.value ? Number(event.target.value) : undefined)}
                className="h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-sm"
            >
                <option value="">Any month</option>
                {MONTHS.map((month, index) => (
                    <option key={month} value={index + 1}>
                        {month}
                    </option>
                ))}
            </select>
        </div>
    );
}

function CheckRow({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="mt-1.5 flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
            {label}
        </label>
    );
}
