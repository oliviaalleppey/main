import { NextResponse } from 'next/server';
import { requireCapability, errorResponse } from '@/lib/services/whatsapp/admin-guard';
import { parseSheet, detectColumns, validateSheet, buildErrorReportCsv, MAX_ROWS, type ColumnMapping } from '@/lib/services/whatsapp/import';

export const dynamic = 'force-dynamic';

/** Sheets are parsed in memory; 10 MB comfortably covers a 50k-row contact list. */
const MAX_BYTES = 10 * 1024 * 1024;

const PREVIEW_ROWS = 100;

/**
 * POST — parse and validate an uploaded sheet. **Writes nothing.**
 *
 * Two modes, driven by whether a mapping is supplied:
 *   - no mapping  -> return headers + auto-detected columns + a few sample rows,
 *                    so the wizard can render its column-mapping step
 *   - mapping     -> return the full validation report
 *
 * Keeping this route side-effect free is what lets the operator see exactly what
 * an import will do before committing to it.
 */
export async function POST(request: Request) {
    try {
        await requireCapability(request, 'contacts.write');

        const form = await request.formData();
        const file = form.get('file');

        if (!(file instanceof File)) {
            return NextResponse.json({ error: 'A file is required' }, { status: 400 });
        }
        if (file.size === 0) {
            return NextResponse.json({ error: 'That file is empty' }, { status: 400 });
        }
        if (file.size > MAX_BYTES) {
            return NextResponse.json(
                { error: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Limit is 10 MB.` },
                { status: 400 },
            );
        }

        const extension = file.name.split('.').pop()?.toLowerCase();
        if (!extension || !['csv', 'xlsx', 'xls', 'tsv', 'txt'].includes(extension)) {
            return NextResponse.json(
                { error: 'Unsupported file type. Upload a .csv or .xlsx file.' },
                { status: 400 },
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        let parsed;
        try {
            parsed = parseSheet(buffer, file.name);
        } catch (error) {
            return NextResponse.json(
                { error: error instanceof Error ? error.message : 'Could not read that file' },
                { status: 400 },
            );
        }

        if (!parsed.rows.length) {
            return NextResponse.json({ error: 'That sheet has no data rows' }, { status: 400 });
        }

        const mappingRaw = form.get('mapping');

        // Step 2: no mapping yet — hand back the headers so the operator can map.
        if (typeof mappingRaw !== 'string' || !mappingRaw) {
            return NextResponse.json({
                stage: 'mapping',
                filename: file.name,
                headers: parsed.headers,
                detected: detectColumns(parsed.headers),
                totalRows: parsed.rows.length,
                truncated: parsed.truncated,
                maxRows: MAX_ROWS,
                sampleRows: parsed.rows.slice(0, 5),
            });
        }

        // Step 3: mapping supplied — run the full validation.
        let mapping: ColumnMapping;
        try {
            mapping = JSON.parse(mappingRaw) as ColumnMapping;
        } catch {
            return NextResponse.json({ error: 'Malformed column mapping' }, { status: 400 });
        }
        if (!mapping.phone) {
            return NextResponse.json({ error: 'A phone number column must be selected' }, { status: 400 });
        }

        const report = await validateSheet(parsed, mapping);

        return NextResponse.json({
            stage: 'validated',
            filename: file.name,
            mapping,
            total: report.total,
            truncated: report.truncated,
            counts: report.counts,
            rejectionBreakdown: report.rejectionBreakdown,
            // Full row list can be 50k entries — send a preview plus the error CSV
            // rather than the whole thing.
            previewRows: report.rows.slice(0, PREVIEW_ROWS),
            hasMoreRows: report.rows.length > PREVIEW_ROWS,
            errorReportCsv: buildErrorReportCsv(report),
        });
    } catch (error) {
        return errorResponse(error);
    }
}
