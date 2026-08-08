import * as XLSX from 'xlsx';
import { db } from '@/lib/db';
import { waContacts, waConsentEvents, waImports, waSuppression } from '@/lib/db/schema';
import { inArray, sql } from 'drizzle-orm';
import { normalizeBatch, describeRejection, type PhoneRejectReason } from './phone';

/**
 * Contact sheet import.
 *
 * Split deliberately into `validateSheet` (pure, no writes) and `commitImport`
 * (writes). The admin wizard calls validate first and shows the operator exactly
 * what will happen; nothing touches the database until they confirm.
 *
 * Two rules this file exists to enforce:
 *   1. A number on wa_suppression can never be re-added by an import. Without
 *      this, every re-upload resurrects the people who asked us to stop.
 *   2. Consent is declared explicitly per import, and the declaration is stored.
 *      An import cannot claim opted-in status without a source and a date.
 */

export const MAX_ROWS = 50_000;

// --------------------------------------------
// Parsing
// --------------------------------------------

export type ParsedSheet = {
    headers: string[];
    rows: Record<string, string>[];
    truncated: boolean;
};

/**
 * Parse CSV or XLSX from a buffer.
 *
 * `raw: true` + `defval: ''` keeps cells as-is rather than letting XLSX coerce
 * them; phone.ts then undoes any float mangling the source file already had.
 */
export function parseSheet(buffer: ArrayBuffer | Buffer, filename: string): ParsedSheet {
    const workbook = XLSX.read(buffer, {
        type: 'buffer',
        raw: true,
        // Dates aren't relevant to contact sheets and cellDates adds ambiguity.
        cellDates: false,
    });

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
        throw new Error(`${filename} contains no sheets`);
    }

    const sheet = workbook.Sheets[firstSheetName];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: '',
        raw: true,
        blankrows: false,
    });

    const truncated = json.length > MAX_ROWS;
    const limited = truncated ? json.slice(0, MAX_ROWS) : json;

    // Stringify every cell up front so downstream code never has to type-check.
    const rows = limited.map((row) => {
        const out: Record<string, string> = {};
        for (const [key, value] of Object.entries(row)) {
            out[key] = value === null || value === undefined ? '' : String(value).trim();
        }
        return out;
    });

    const headers = Object.keys(json[0] ?? {});

    return { headers, rows, truncated };
}

// --------------------------------------------
// Column detection
// --------------------------------------------

export type ColumnMapping = {
    phone: string | null;
    name: string | null;
    email: string | null;
};

const PHONE_HINTS = ['whatsapp', 'whatsapp number', 'wa', 'phone', 'phone number', 'mobile', 'mobile number', 'mob', 'contact', 'contact number', 'number', 'cell', 'telephone', 'tel', 'msisdn'];
const NAME_HINTS = ['name', 'full name', 'guest name', 'customer name', 'contact name', 'first name', 'firstname', 'guest'];
const EMAIL_HINTS = ['email', 'e-mail', 'email address', 'mail', 'email id'];

function normalizeHeader(header: string): string {
    return header.toLowerCase().replace(/[_\-.]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Best-effort column guess. The operator always sees and can override it. */
export function detectColumns(headers: string[]): ColumnMapping {
    const pick = (hints: string[]): string | null => {
        // Exact match on a normalised header beats a substring match, so a sheet
        // with both "Name" and "Company Name" maps "Name" to the contact name.
        for (const hint of hints) {
            const exact = headers.find((h) => normalizeHeader(h) === hint);
            if (exact) return exact;
        }
        for (const hint of hints) {
            const partial = headers.find((h) => normalizeHeader(h).includes(hint));
            if (partial) return partial;
        }
        return null;
    };

    return {
        phone: pick(PHONE_HINTS),
        name: pick(NAME_HINTS),
        email: pick(EMAIL_HINTS),
    };
}

// --------------------------------------------
// Validation (read-only)
// --------------------------------------------

export type ValidationRow = {
    rowNumber: number;
    raw: string;
    e164?: string;
    name?: string;
    email?: string;
    /** What committing this row would do. */
    outcome: 'insert' | 'update' | 'rejected' | 'duplicate_in_file' | 'suppressed';
    detail?: string;
    reason?: PhoneRejectReason | 'suppressed' | 'duplicate_in_file';
};

export type ValidationReport = {
    total: number;
    truncated: boolean;
    counts: {
        insert: number;
        update: number;
        rejected: number;
        duplicateInFile: number;
        suppressed: number;
    };
    /** Every row, so the wizard can render a preview and build a full error CSV. */
    rows: ValidationRow[];
    rejectionBreakdown: Record<string, number>;
};

export async function validateSheet(
    parsed: ParsedSheet,
    mapping: ColumnMapping,
): Promise<ValidationReport> {
    if (!mapping.phone) {
        throw new Error('A phone number column must be selected');
    }

    const phoneColumn = mapping.phone;
    const candidates = parsed.rows.map((row, index) => ({
        // +2 because row 1 is the header and spreadsheets are 1-indexed — the
        // number shown must match what the operator sees in Excel.
        rowNumber: index + 2,
        raw: row[phoneColumn] ?? '',
        name: mapping.name ? row[mapping.name] || undefined : undefined,
        email: mapping.email ? row[mapping.email] || undefined : undefined,
    }));

    const { valid, rejected, duplicates } = normalizeBatch(candidates);

    const metaByRow = new Map(candidates.map((c) => [c.rowNumber, c]));
    const validPhones = valid.map((v) => v.e164);

    // Two bulk lookups rather than per-row queries — a 50k sheet would otherwise
    // issue 100k round trips.
    const [existing, suppressed] = await Promise.all([
        validPhones.length
            ? db
                .select({ phone: waContacts.phone })
                .from(waContacts)
                .where(inArray(waContacts.phone, validPhones))
            : Promise.resolve([]),
        validPhones.length
            ? db
                .select({ phone: waSuppression.phone })
                .from(waSuppression)
                .where(inArray(waSuppression.phone, validPhones))
            : Promise.resolve([]),
    ]);

    const existingSet = new Set(existing.map((r) => r.phone));
    const suppressedSet = new Set(suppressed.map((r) => r.phone));

    const rows: ValidationRow[] = [];
    const counts = { insert: 0, update: 0, rejected: 0, duplicateInFile: 0, suppressed: 0 };
    const rejectionBreakdown: Record<string, number> = {};

    for (const item of valid) {
        const meta = metaByRow.get(item.rowNumber);

        if (suppressedSet.has(item.e164)) {
            counts.suppressed += 1;
            rejectionBreakdown.suppressed = (rejectionBreakdown.suppressed ?? 0) + 1;
            rows.push({
                rowNumber: item.rowNumber,
                raw: item.raw,
                e164: item.e164,
                outcome: 'suppressed',
                reason: 'suppressed',
                detail: 'On the permanent do-not-contact list — will be skipped',
            });
            continue;
        }

        const isUpdate = existingSet.has(item.e164);
        if (isUpdate) counts.update += 1;
        else counts.insert += 1;

        rows.push({
            rowNumber: item.rowNumber,
            raw: item.raw,
            e164: item.e164,
            name: meta?.name,
            email: meta?.email,
            outcome: isUpdate ? 'update' : 'insert',
            detail: isUpdate ? 'Already in contacts — details will be refreshed' : undefined,
        });
    }

    for (const item of rejected) {
        counts.rejected += 1;
        rejectionBreakdown[item.reason] = (rejectionBreakdown[item.reason] ?? 0) + 1;
        rows.push({
            rowNumber: item.rowNumber,
            raw: item.raw,
            outcome: 'rejected',
            reason: item.reason,
            detail: item.detail,
        });
    }

    for (const item of duplicates) {
        counts.duplicateInFile += 1;
        rejectionBreakdown.duplicate_in_file = (rejectionBreakdown.duplicate_in_file ?? 0) + 1;
        rows.push({
            rowNumber: item.rowNumber,
            raw: metaByRow.get(item.rowNumber)?.raw ?? '',
            e164: item.e164,
            outcome: 'duplicate_in_file',
            reason: 'duplicate_in_file',
            detail: `Same number as row ${item.firstSeenRow}`,
        });
    }

    rows.sort((a, b) => a.rowNumber - b.rowNumber);

    return {
        total: parsed.rows.length,
        truncated: parsed.truncated,
        counts,
        rows,
        rejectionBreakdown,
    };
}

// --------------------------------------------
// Commit (writes)
// --------------------------------------------

export type ConsentDeclaration = {
    /** True only when the operator can point to a real WhatsApp opt-in. */
    hasExplicitOptIn: boolean;
    /** Where the opt-in came from, e.g. "booking form". Required when hasExplicitOptIn. */
    source?: string;
    /** ISO date the consent was collected. Required when hasExplicitOptIn. */
    collectedAt?: string;
    proofUrl?: string;
};

export type CommitParams = {
    parsed: ParsedSheet;
    mapping: ColumnMapping;
    filename: string;
    blobUrl?: string;
    /** Mandatory free text describing where this list came from. DPDP evidence. */
    provenanceNote: string;
    declaration: ConsentDeclaration;
    actorId?: string;
    actorEmail?: string;
};

export type CommitResult = {
    importId: string;
    imported: number;
    updated: number;
    rejected: number;
    duplicates: number;
    suppressed: number;
    assignedStatus: 'pending' | 'opted_in';
};

/**
 * Only two landing states are permitted.
 *
 * A declared opt-in with a documented source and date lands as `opted_in`;
 * everything else lands as `pending`, which the consent gate restricts to the
 * re-permission template. There is no path here that grants marketing consent
 * without a record of where it came from.
 */
function resolveAssignedStatus(declaration: ConsentDeclaration): 'pending' | 'opted_in' {
    if (!declaration.hasExplicitOptIn) return 'pending';
    if (!declaration.source?.trim() || !declaration.collectedAt) return 'pending';
    return 'opted_in';
}

export async function commitImport(params: CommitParams): Promise<CommitResult> {
    if (!params.provenanceNote?.trim()) {
        throw new Error('A provenance note is required — describe where this list came from');
    }

    const report = await validateSheet(params.parsed, params.mapping);
    const assignedStatus = resolveAssignedStatus(params.declaration);

    const consentAt = assignedStatus === 'opted_in' && params.declaration.collectedAt
        ? new Date(params.declaration.collectedAt)
        : null;

    const writable = report.rows.filter((r) => r.outcome === 'insert' || r.outcome === 'update');

    return db.transaction(async (tx) => {
        const [importRow] = await tx
            .insert(waImports)
            .values({
                filename: params.filename,
                blobUrl: params.blobUrl,
                rowCount: report.total,
                importedCount: report.counts.insert,
                updatedCount: report.counts.update,
                rejectedCount: report.counts.rejected,
                duplicateCount: report.counts.duplicateInFile,
                consentDeclaration: params.declaration,
                provenanceNote: params.provenanceNote.trim(),
                assignedStatus,
                columnMapping: params.mapping as unknown as Record<string, string>,
                actorId: params.actorId,
                actorEmail: params.actorEmail,
            })
            .returning();

        // Chunked so a large sheet doesn't build one enormous statement.
        const CHUNK = 500;
        for (let i = 0; i < writable.length; i += CHUNK) {
            const chunk = writable.slice(i, i + CHUNK);

            const inserted = await tx
                .insert(waContacts)
                .values(
                    chunk.map((row) => ({
                        phone: row.e164!,
                        name: row.name,
                        email: row.email,
                        source: 'import' as const,
                        importId: importRow.id,
                        consentStatus: assignedStatus,
                        consentSource: assignedStatus === 'opted_in' ? params.declaration.source : null,
                        consentAt,
                        consentProofUrl: params.declaration.proofUrl,
                        provenanceNote: params.provenanceNote.trim(),
                    })),
                )
                .onConflictDoUpdate({
                    target: waContacts.phone,
                    set: {
                        // Refresh contact details, but NEVER downgrade or overwrite an
                        // existing consent state from a re-import. Someone who opted out
                        // stays opted out; someone already opted in keeps their original
                        // consent date and source.
                        name: sql`COALESCE(excluded.name, ${waContacts.name})`,
                        email: sql`COALESCE(excluded.email, ${waContacts.email})`,
                        importId: importRow.id,
                        updatedAt: new Date(),
                    },
                })
                .returning({ id: waContacts.id, phone: waContacts.phone, consentStatus: waContacts.consentStatus });

            // Ledger entries only for rows that actually landed as opted_in — an
            // update that preserved an existing state must not fabricate consent.
            const ledgerRows = inserted
                .filter((c) => c.consentStatus === 'opted_in' && assignedStatus === 'opted_in')
                .map((c) => ({
                    contactId: c.id,
                    phone: c.phone,
                    fromStatus: null,
                    toStatus: 'opted_in' as const,
                    reason: params.provenanceNote.trim(),
                    source: `import:${params.filename}`,
                    actorId: params.actorId,
                    actorEmail: params.actorEmail,
                }));

            if (ledgerRows.length) {
                await tx.insert(waConsentEvents).values(ledgerRows);
            }
        }

        return {
            importId: importRow.id,
            imported: report.counts.insert,
            updated: report.counts.update,
            rejected: report.counts.rejected,
            duplicates: report.counts.duplicateInFile,
            suppressed: report.counts.suppressed,
            assignedStatus,
        };
    });
}

// --------------------------------------------
// Error report
// --------------------------------------------

/** CSV of everything that will not be imported, for the operator to fix and re-upload. */
export function buildErrorReportCsv(report: ValidationReport): string {
    const escape = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
    const lines = ['Row,Value,Problem,Detail'];

    for (const row of report.rows) {
        if (row.outcome === 'insert' || row.outcome === 'update') continue;
        const problem = row.reason && row.reason !== 'suppressed' && row.reason !== 'duplicate_in_file'
            ? describeRejection(row.reason)
            : row.outcome === 'suppressed'
                ? 'On the do-not-contact list'
                : 'Duplicate within this file';
        // Most rejections carry a detail identical to the problem text; repeating it
        // in both columns just makes the report harder to scan.
        const detail = row.detail && row.detail !== problem ? row.detail : '';
        lines.push([row.rowNumber, escape(row.raw), escape(problem), escape(detail)].join(','));
    }

    return lines.join('\n');
}
