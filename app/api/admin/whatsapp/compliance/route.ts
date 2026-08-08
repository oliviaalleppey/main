import { NextResponse } from 'next/server';
import { requireCapability, errorResponse } from '@/lib/services/whatsapp/admin-guard';
import {
    complianceSnapshot, consentLedger, listSuppression, auditLog,
} from '@/lib/services/whatsapp/compliance';

export const dynamic = 'force-dynamic';

/** GET — the compliance dashboard: snapshot, ledger, suppression list, audit log. */
export async function GET(request: Request) {
    try {
        await requireCapability(request, 'compliance.read');
        const url = new URL(request.url);

        const [snapshot, ledger, suppression, audit] = await Promise.all([
            complianceSnapshot(),
            consentLedger({ phone: url.searchParams.get('phone') ?? undefined, limit: 50 }),
            listSuppression({ search: url.searchParams.get('suppressed') ?? undefined, limit: 50 }),
            auditLog({ action: url.searchParams.get('action') ?? undefined, limit: 50 }),
        ]);

        return NextResponse.json({ snapshot, ledger, suppression, audit });
    } catch (error) {
        return errorResponse(error);
    }
}
