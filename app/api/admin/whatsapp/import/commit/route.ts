import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCapability, errorResponse, audit } from '@/lib/services/whatsapp/admin-guard';
import { parseSheet, commitImport, type ColumnMapping } from '@/lib/services/whatsapp/import';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 10 * 1024 * 1024;

const declarationSchema = z
    .object({
        hasExplicitOptIn: z.boolean(),
        source: z.string().max(255).optional(),
        collectedAt: z.string().optional(),
        proofUrl: z.string().url().optional().or(z.literal('')),
    })
    .refine(
        // Claiming opt-in without a source and a date is exactly the gap that makes
        // a consent record indefensible, so it is rejected here rather than being
        // silently downgraded.
        (d) => !d.hasExplicitOptIn || (!!d.source?.trim() && !!d.collectedAt),
        { message: 'Declaring an opt-in requires both a source and the date it was collected' },
    );

/**
 * POST — commit a validated import.
 *
 * The file is re-uploaded and re-validated server-side rather than trusting a
 * client-held result: the browser must not be able to assert what was in the sheet.
 */
export async function POST(request: Request) {
    try {
        const actor = await requireCapability(request, 'contacts.write');

        const form = await request.formData();
        const file = form.get('file');
        if (!(file instanceof File) || file.size === 0) {
            return NextResponse.json({ error: 'A file is required' }, { status: 400 });
        }
        if (file.size > MAX_BYTES) {
            return NextResponse.json({ error: 'File is too large (limit 10 MB)' }, { status: 400 });
        }

        const mappingRaw = form.get('mapping');
        if (typeof mappingRaw !== 'string') {
            return NextResponse.json({ error: 'A column mapping is required' }, { status: 400 });
        }
        let mapping: ColumnMapping;
        try {
            mapping = JSON.parse(mappingRaw) as ColumnMapping;
        } catch {
            return NextResponse.json({ error: 'Malformed column mapping' }, { status: 400 });
        }

        const provenanceNote = String(form.get('provenanceNote') ?? '').trim();
        if (!provenanceNote) {
            return NextResponse.json(
                { error: 'A provenance note is required — describe where this list came from' },
                { status: 400 },
            );
        }

        const declarationRaw = form.get('declaration');
        if (typeof declarationRaw !== 'string') {
            return NextResponse.json({ error: 'A consent declaration is required' }, { status: 400 });
        }

        let declaration;
        try {
            declaration = declarationSchema.parse(JSON.parse(declarationRaw));
        } catch (error) {
            const message = error instanceof z.ZodError
                ? error.issues[0]?.message ?? 'Invalid consent declaration'
                : 'Invalid consent declaration';
            return NextResponse.json({ error: message }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const parsed = parseSheet(buffer, file.name);

        const result = await commitImport({
            parsed,
            mapping,
            filename: file.name,
            blobUrl: (form.get('blobUrl') as string) || undefined,
            provenanceNote,
            declaration: {
                hasExplicitOptIn: declaration.hasExplicitOptIn,
                source: declaration.source,
                collectedAt: declaration.collectedAt,
                proofUrl: declaration.proofUrl || undefined,
            },
            actorId: actor.id,
            actorEmail: actor.email,
        });

        await audit({
            actor,
            action: 'whatsapp.import.committed',
            entityType: 'wa_imports',
            entityId: result.importId,
            after: {
                filename: file.name,
                imported: result.imported,
                updated: result.updated,
                rejected: result.rejected,
                duplicates: result.duplicates,
                suppressed: result.suppressed,
                assignedStatus: result.assignedStatus,
                provenanceNote,
            },
        });

        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        return errorResponse(error);
    }
}
