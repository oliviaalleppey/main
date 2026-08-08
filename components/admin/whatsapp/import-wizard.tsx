'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    AlertTriangle, ArrowLeft, ArrowRight, Check, Download, FileSpreadsheet, Loader2, Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ConsentBadge } from './consent-badge';
import {
    ConsentDeclarationFields, declarationIsComplete, declaredStatus, emptyDeclaration, type Declaration,
} from './consent-declaration';
import { cn } from '@/lib/utils';

/**
 * The five-step import wizard.
 *
 * Each step is explicit and nothing is written until step 5. The file itself is
 * held in browser memory and re-posted to /validate and then /commit, because the
 * commit route re-parses and re-validates server-side rather than trusting a
 * client-held result — the browser must not be able to assert what was in the
 * sheet.
 */

type ColumnMapping = { phone: string | null; name: string | null; email: string | null };

type MappingStage = {
    stage: 'mapping';
    filename: string;
    headers: string[];
    detected: ColumnMapping;
    totalRows: number;
    truncated: boolean;
    maxRows: number;
    sampleRows: Record<string, string>[];
};

type ValidationRow = {
    rowNumber: number;
    raw: string;
    e164?: string;
    name?: string;
    email?: string;
    outcome: 'insert' | 'update' | 'rejected' | 'duplicate_in_file' | 'suppressed';
    detail?: string;
    reason?: string;
};

type ValidatedStage = {
    stage: 'validated';
    filename: string;
    mapping: ColumnMapping;
    total: number;
    truncated: boolean;
    counts: { insert: number; update: number; rejected: number; duplicateInFile: number; suppressed: number };
    rejectionBreakdown: Record<string, number>;
    previewRows: ValidationRow[];
    hasMoreRows: boolean;
    errorReportCsv: string;
};

type CommitResult = {
    importId: string;
    imported: number;
    updated: number;
    rejected: number;
    duplicates: number;
    suppressed: number;
    assignedStatus: 'pending' | 'opted_in';
};

const STEPS = ['Upload', 'Map columns', 'Validate', 'Declare consent', 'Confirm'] as const;

const REJECTION_LABELS: Record<string, string> = {
    empty: 'Blank cell',
    unparseable: 'Could not be read as a phone number',
    invalid_number: 'Not valid for its country',
    not_mobile: 'Landline or service number',
    multiple_numbers: 'More than one number in the cell',
    too_short: 'Too few digits',
    too_long: 'Too many digits',
    suppressed: 'On the do-not-contact list',
    duplicate_in_file: 'Duplicate within this file',
};

const OUTCOME_STYLES: Record<ValidationRow['outcome'], { label: string; className: string }> = {
    insert: { label: 'New', className: 'bg-green-100 text-green-800' },
    update: { label: 'Update', className: 'bg-blue-100 text-blue-800' },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
    duplicate_in_file: { label: 'Duplicate', className: 'bg-amber-100 text-amber-900' },
    suppressed: { label: 'Suppressed', className: 'bg-gray-200 text-gray-700' },
};

export function ImportWizard() {
    const router = useRouter();
    const fileInput = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [mappingStage, setMappingStage] = useState<MappingStage | null>(null);
    const [mapping, setMapping] = useState<ColumnMapping>({ phone: null, name: null, email: null });
    const [report, setReport] = useState<ValidatedStage | null>(null);
    const [declaration, setDeclaration] = useState<Declaration>(emptyDeclaration);
    const [provenanceNote, setProvenanceNote] = useState('');
    const [result, setResult] = useState<CommitResult | null>(null);
    const [busy, setBusy] = useState(false);
    const [dragging, setDragging] = useState(false);

    function selectFile(next: File | null) {
        setFile(next);
        // Anything derived from the previous file is now meaningless.
        setMappingStage(null);
        setMapping({ phone: null, name: null, email: null });
        setReport(null);
    }

    async function readHeaders() {
        if (!file) return;
        setBusy(true);
        try {
            const form = new FormData();
            form.append('file', file);
            const response = await fetch('/api/admin/whatsapp/import/validate', { method: 'POST', body: form });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.error || `Could not read that file (${response.status})`);

            const stage = body as MappingStage;
            setMappingStage(stage);
            setMapping(stage.detected);
            setStep(2);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not read that file');
        } finally {
            setBusy(false);
        }
    }

    async function runValidation() {
        if (!file || !mapping.phone) return;
        setBusy(true);
        try {
            const form = new FormData();
            form.append('file', file);
            form.append('mapping', JSON.stringify(mapping));
            const response = await fetch('/api/admin/whatsapp/import/validate', { method: 'POST', body: form });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.error || `Validation failed (${response.status})`);

            setReport(body as ValidatedStage);
            setStep(3);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Validation failed');
        } finally {
            setBusy(false);
        }
    }

    async function commit() {
        if (!file || !mapping.phone) return;
        setBusy(true);
        try {
            const form = new FormData();
            form.append('file', file);
            form.append('mapping', JSON.stringify(mapping));
            form.append('provenanceNote', provenanceNote.trim());
            form.append(
                'declaration',
                JSON.stringify({
                    hasExplicitOptIn: declaration.hasExplicitOptIn,
                    source: declaration.source || undefined,
                    collectedAt: declaration.collectedAt || undefined,
                    proofUrl: declaration.proofUrl || undefined,
                }),
            );

            const response = await fetch('/api/admin/whatsapp/import/commit', { method: 'POST', body: form });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.error || `Import failed (${response.status})`);

            setResult(body as CommitResult);
            setStep(6);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Import failed');
        } finally {
            setBusy(false);
        }
    }

    function downloadErrorReport() {
        if (!report) return;
        const blob = new Blob([`﻿${report.errorReportCsv}`], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `import-errors-${report.filename.replace(/\.[^.]+$/, '')}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
    }

    const willImport = report ? report.counts.insert + report.counts.update : 0;

    if (step === 6 && result) {
        return <ImportDone result={result} filename={file?.name ?? ''} onRouter={() => router.push('/admin/whatsapp/contacts')} />;
    }

    return (
        <div className="space-y-6">
            <Stepper current={step} />

            {/* ---------- Step 1: upload ---------- */}
            {step === 1 && (
                <Panel
                    title="Upload the contact sheet"
                    description="CSV or XLSX, up to 50,000 rows and 10 MB. Nothing is saved until the final step."
                >
                    <div
                        onDragOver={(event) => {
                            event.preventDefault();
                            setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(event) => {
                            event.preventDefault();
                            setDragging(false);
                            const dropped = event.dataTransfer.files?.[0];
                            if (dropped) selectFile(dropped);
                        }}
                        onClick={() => fileInput.current?.click()}
                        className={cn(
                            'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors',
                            dragging ? 'border-gray-900 bg-gray-50' : 'border-gray-300 hover:border-gray-400',
                        )}
                    >
                        <Upload className="h-8 w-8 text-gray-400" />
                        <p className="mt-3 text-sm font-medium text-gray-900">
                            {file ? file.name : 'Drop a file here, or click to choose'}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                            {file
                                ? `${(file.size / 1024).toFixed(0)} KB — click to choose a different file`
                                : '.csv, .xlsx, .xls or .tsv'}
                        </p>
                        <input
                            ref={fileInput}
                            type="file"
                            accept=".csv,.xlsx,.xls,.tsv,.txt"
                            className="hidden"
                            onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
                        />
                    </div>

                    <Footer
                        onNext={() => void readHeaders()}
                        nextLabel="Read the file"
                        nextDisabled={!file || busy}
                        busy={busy}
                    />
                </Panel>
            )}

            {/* ---------- Step 2: map columns ---------- */}
            {step === 2 && mappingStage && (
                <Panel
                    title="Map the columns"
                    description={`${mappingStage.totalRows.toLocaleString('en-IN')} rows found in ${mappingStage.filename}. Confirm which column holds what.`}
                >
                    {mappingStage.truncated && (
                        <Notice tone="amber">
                            This sheet is longer than {mappingStage.maxRows.toLocaleString('en-IN')} rows. Only the
                            first {mappingStage.maxRows.toLocaleString('en-IN')} will be imported — split the file to
                            bring in the rest.
                        </Notice>
                    )}

                    <div className="grid gap-4 sm:grid-cols-3">
                        <ColumnSelect
                            label="Phone number"
                            required
                            headers={mappingStage.headers}
                            value={mapping.phone}
                            detected={mappingStage.detected.phone}
                            onChange={(value) => setMapping({ ...mapping, phone: value })}
                        />
                        <ColumnSelect
                            label="Name"
                            headers={mappingStage.headers}
                            value={mapping.name}
                            detected={mappingStage.detected.name}
                            onChange={(value) => setMapping({ ...mapping, name: value })}
                        />
                        <ColumnSelect
                            label="Email"
                            headers={mappingStage.headers}
                            value={mapping.email}
                            detected={mappingStage.detected.email}
                            onChange={(value) => setMapping({ ...mapping, email: value })}
                        />
                    </div>

                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            First rows of the sheet
                        </h3>
                        <div className="mt-2 rounded-lg border border-gray-200">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {mappingStage.headers.map((header) => (
                                            <TableHead
                                                key={header}
                                                className={cn(
                                                    header === mapping.phone && 'bg-gray-900 text-white',
                                                    (header === mapping.name || header === mapping.email) && 'bg-gray-100 text-gray-900',
                                                )}
                                            >
                                                {header}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mappingStage.sampleRows.map((row, index) => (
                                        <TableRow key={index}>
                                            {mappingStage.headers.map((header) => (
                                                <TableCell key={header} className="whitespace-nowrap text-xs text-gray-600">
                                                    {row[header] || <span className="text-gray-300">empty</span>}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <Footer
                        onBack={() => setStep(1)}
                        onNext={() => void runValidation()}
                        nextLabel="Validate the rows"
                        nextDisabled={!mapping.phone || busy}
                        busy={busy}
                    />
                </Panel>
            )}

            {/* ---------- Step 3: validate & preview ---------- */}
            {step === 3 && report && (
                <Panel
                    title="What this import will do"
                    description="Still nothing written. Check the rejections before continuing — a fixed sheet re-uploaded now is cheaper than chasing numbers later."
                >
                    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        <Stat label="New contacts" value={report.counts.insert} tone="green" />
                        <Stat label="Existing, refreshed" value={report.counts.update} tone="blue" />
                        <Stat label="Rejected" value={report.counts.rejected} tone="red" />
                        <Stat label="Duplicates in file" value={report.counts.duplicateInFile} tone="amber" />
                        <Stat label="On do-not-contact" value={report.counts.suppressed} tone="gray" />
                    </div>

                    {report.counts.suppressed > 0 && (
                        <Notice tone="gray">
                            {report.counts.suppressed} number{report.counts.suppressed === 1 ? '' : 's'} in this sheet
                            previously asked not to be contacted. They will be skipped — a re-upload can never
                            resurrect them.
                        </Notice>
                    )}

                    {Object.keys(report.rejectionBreakdown).length > 0 && (
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="text-sm font-semibold text-gray-900">Why rows were rejected</h3>
                                <Button variant="outline" size="sm" onClick={downloadErrorReport}>
                                    <Download className="mr-1.5 h-4 w-4" /> Download full error report
                                </Button>
                            </div>
                            <dl className="mt-3 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                                {Object.entries(report.rejectionBreakdown)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([reason, count]) => (
                                        <div key={reason} className="flex justify-between gap-4 border-b border-gray-100 pb-1">
                                            <dt className="text-gray-600">{REJECTION_LABELS[reason] ?? reason}</dt>
                                            <dd className="font-medium text-gray-900">{count}</dd>
                                        </div>
                                    ))}
                            </dl>
                        </div>
                    )}

                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Row preview{report.hasMoreRows && ` — first ${report.previewRows.length} of ${report.total.toLocaleString('en-IN')}`}
                        </h3>
                        <div className="mt-2 max-h-96 overflow-y-auto rounded-lg border border-gray-200">
                            <Table>
                                <TableHeader className="sticky top-0 bg-white">
                                    <TableRow>
                                        <TableHead className="w-16">Row</TableHead>
                                        <TableHead>In the sheet</TableHead>
                                        <TableHead>Normalised</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Outcome</TableHead>
                                        <TableHead>Detail</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {report.previewRows.map((row) => (
                                        <TableRow key={row.rowNumber}>
                                            <TableCell className="text-xs text-gray-400">{row.rowNumber}</TableCell>
                                            <TableCell className="font-mono text-xs text-gray-600">{row.raw || '—'}</TableCell>
                                            <TableCell className="font-mono text-xs text-gray-900">{row.e164 ?? '—'}</TableCell>
                                            <TableCell className="text-xs text-gray-600">{row.name ?? '—'}</TableCell>
                                            <TableCell>
                                                <span
                                                    className={cn(
                                                        'rounded-full px-2 py-0.5 text-xs font-semibold',
                                                        OUTCOME_STYLES[row.outcome].className,
                                                    )}
                                                >
                                                    {OUTCOME_STYLES[row.outcome].label}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs text-gray-500">
                                                {row.detail ?? (row.reason ? REJECTION_LABELS[row.reason] ?? row.reason : '')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <Footer
                        onBack={() => setStep(2)}
                        onNext={() => setStep(4)}
                        nextLabel={`Continue with ${willImport.toLocaleString('en-IN')} contacts`}
                        nextDisabled={willImport === 0}
                    />
                    {willImport === 0 && (
                        <p className="text-sm text-red-600">
                            No rows would be imported. Fix the sheet using the error report and upload it again.
                        </p>
                    )}
                </Panel>
            )}

            {/* ---------- Step 4: declare consent ---------- */}
            {step === 4 && report && (
                <Panel
                    title="Declare consent"
                    description="This is the step that decides what these contacts may lawfully be sent. It is stored on every row as DPDP evidence."
                >
                    <ConsentDeclarationFields value={declaration} onChange={setDeclaration} idPrefix="import" />

                    <div className="space-y-1.5">
                        <Label htmlFor="provenance">Where did this list come from? (required)</Label>
                        <Textarea
                            id="provenance"
                            value={provenanceNote}
                            onChange={(event) => setProvenanceNote(event.target.value)}
                            rows={3}
                            placeholder="e.g. Export of the hotel's PMS guest list, 2019–2026, supplied by the front office manager on 7 Aug 2026"
                        />
                        <p className="text-xs text-gray-500">
                            Stored against every contact in this import. If consent is ever challenged, this note is
                            the answer.
                        </p>
                    </div>

                    <Footer
                        onBack={() => setStep(3)}
                        onNext={() => setStep(5)}
                        nextLabel="Review and confirm"
                        nextDisabled={!provenanceNote.trim() || !declarationIsComplete(declaration)}
                    />
                </Panel>
            )}

            {/* ---------- Step 5: confirm ---------- */}
            {step === 5 && report && (
                <Panel
                    title="Confirm the import"
                    description="This is the step that writes to the database."
                >
                    <dl className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white text-sm">
                        <Row label="File">{report.filename}</Row>
                        <Row label="Phone column">{mapping.phone}</Row>
                        <Row label="New contacts">{report.counts.insert.toLocaleString('en-IN')}</Row>
                        <Row label="Existing contacts refreshed">{report.counts.update.toLocaleString('en-IN')}</Row>
                        <Row label="Skipped">
                            {(report.counts.rejected + report.counts.duplicateInFile + report.counts.suppressed).toLocaleString('en-IN')}{' '}
                            <span className="text-gray-400">
                                ({report.counts.rejected} rejected, {report.counts.duplicateInFile} duplicate,{' '}
                                {report.counts.suppressed} suppressed)
                            </span>
                        </Row>
                        <Row label="They will land as">
                            <ConsentBadge status={declaredStatus(declaration)} />
                        </Row>
                        {declaration.hasExplicitOptIn && (
                            <>
                                <Row label="Opt-in source">{declaration.source}</Row>
                                <Row label="Collected on">{declaration.collectedAt}</Row>
                            </>
                        )}
                        <Row label="Provenance">{provenanceNote}</Row>
                    </dl>

                    {declaredStatus(declaration) === 'pending' ? (
                        <Notice tone="amber">
                            These contacts land as <strong>Pending</strong>. The only message they may receive is the
                            re-permission template — the consent gate blocks every marketing send to them until they
                            opt in.
                        </Notice>
                    ) : (
                        <Notice tone="amber">
                            You are declaring a documented opt-in for {willImport.toLocaleString('en-IN')} contacts.
                            They become eligible for marketing immediately. Existing contacts keep their current
                            consent state — a re-import never overwrites it.
                        </Notice>
                    )}

                    <Footer
                        onBack={() => setStep(4)}
                        onNext={() => void commit()}
                        nextLabel={`Import ${willImport.toLocaleString('en-IN')} contacts`}
                        nextDisabled={busy}
                        busy={busy}
                    />
                </Panel>
            )}
        </div>
    );
}

// --------------------------------------------
// Presentation helpers
// --------------------------------------------

function Stepper({ current }: { current: number }) {
    return (
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            {STEPS.map((label, index) => {
                const number = index + 1;
                const done = current > number;
                const active = current === number;
                return (
                    <li key={label} className="flex items-center gap-2">
                        <span
                            className={cn(
                                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                                done && 'bg-green-600 text-white',
                                active && 'bg-gray-900 text-white',
                                !done && !active && 'bg-gray-100 text-gray-400',
                            )}
                        >
                            {done ? <Check className="h-3.5 w-3.5" /> : number}
                        </span>
                        <span className={cn('text-xs', active ? 'font-semibold text-gray-900' : 'text-gray-500')}>
                            {label}
                        </span>
                        {number < STEPS.length && <span className="mx-1 text-gray-300">›</span>}
                    </li>
                );
            })}
        </ol>
    );
}

function Panel({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-5 rounded-lg border border-gray-200 bg-white p-6">
            <div>
                <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                <p className="mt-1 text-sm text-gray-500">{description}</p>
            </div>
            {children}
        </div>
    );
}

function Footer({
    onBack,
    onNext,
    nextLabel,
    nextDisabled,
    busy,
}: {
    onBack?: () => void;
    onNext: () => void;
    nextLabel: string;
    nextDisabled?: boolean;
    busy?: boolean;
}) {
    return (
        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            {onBack ? (
                <Button variant="outline" onClick={onBack} disabled={busy}>
                    <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                </Button>
            ) : (
                <Button variant="outline" asChild>
                    <Link href="/admin/whatsapp/contacts">Cancel</Link>
                </Button>
            )}
            <Button onClick={onNext} disabled={nextDisabled}>
                {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                {nextLabel}
                {!busy && <ArrowRight className="ml-1.5 h-4 w-4" />}
            </Button>
        </div>
    );
}

function ColumnSelect({
    label,
    required,
    headers,
    value,
    detected,
    onChange,
}: {
    label: string;
    required?: boolean;
    headers: string[];
    value: string | null;
    detected: string | null;
    onChange: (value: string | null) => void;
}) {
    return (
        <div className="space-y-1.5">
            <Label>
                {label}
                {required && <span className="text-red-500"> *</span>}
            </Label>
            <select
                value={value ?? ''}
                onChange={(event) => onChange(event.target.value || null)}
                className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            >
                <option value="">{required ? 'Choose a column…' : 'Not in this sheet'}</option>
                {headers.map((header) => (
                    <option key={header} value={header}>
                        {header}
                    </option>
                ))}
            </select>
            {detected && value === detected && (
                <p className="text-xs text-gray-400">Auto-detected — change it if that is wrong</p>
            )}
        </div>
    );
}

function Stat({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone: 'green' | 'blue' | 'red' | 'amber' | 'gray';
}) {
    const tones = {
        green: 'border-green-200 bg-green-50 text-green-900',
        blue: 'border-blue-200 bg-blue-50 text-blue-900',
        red: 'border-red-200 bg-red-50 text-red-900',
        amber: 'border-amber-200 bg-amber-50 text-amber-900',
        gray: 'border-gray-200 bg-gray-50 text-gray-700',
    } as const;

    return (
        <div className={cn('rounded-lg border p-3', tones[tone])}>
            <p className="text-2xl font-semibold">{value.toLocaleString('en-IN')}</p>
            <p className="mt-0.5 text-xs">{label}</p>
        </div>
    );
}

function Notice({ tone, children }: { tone: 'amber' | 'gray'; children: React.ReactNode }) {
    return (
        <div
            className={cn(
                'flex items-start gap-3 rounded-md border p-3 text-sm',
                tone === 'amber' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-gray-200 bg-gray-50 text-gray-700',
            )}
        >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>{children}</div>
        </div>
    );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-4 px-4 py-2.5">
            <dt className="text-gray-500">{label}</dt>
            <dd className="max-w-lg text-right font-medium text-gray-900">{children}</dd>
        </div>
    );
}

function ImportDone({
    result,
    filename,
    onRouter,
}: {
    result: CommitResult;
    filename: string;
    onRouter: () => void;
}) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <FileSpreadsheet className="h-6 w-6 text-green-700" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">Import complete</h2>
            <p className="mt-1 text-sm text-gray-500">{filename}</p>

            <dl className="mx-auto mt-6 grid max-w-lg grid-cols-2 gap-3 text-left sm:grid-cols-3">
                <Stat label="Imported" value={result.imported} tone="green" />
                <Stat label="Refreshed" value={result.updated} tone="blue" />
                <Stat label="Rejected" value={result.rejected} tone="red" />
                <Stat label="Duplicates" value={result.duplicates} tone="amber" />
                <Stat label="Suppressed" value={result.suppressed} tone="gray" />
            </dl>

            <p className="mt-6 text-sm text-gray-600">
                They landed as <ConsentBadge status={result.assignedStatus} />
                {result.assignedStatus === 'pending' && (
                    <span className="mt-2 block text-xs text-gray-500">
                        Only the re-permission template may be sent to them. Build a &ldquo;Pending
                        re-permission&rdquo; audience to ask for consent.
                    </span>
                )}
            </p>

            <div className="mt-6 flex justify-center gap-2">
                <Button variant="outline" asChild>
                    <Link href="/admin/whatsapp/contacts/import">Import another sheet</Link>
                </Button>
                <Button onClick={onRouter}>View contacts</Button>
            </div>
        </div>
    );
}
