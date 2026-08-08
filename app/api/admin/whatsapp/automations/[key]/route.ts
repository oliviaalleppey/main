import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCapability, errorResponse, audit } from '@/lib/services/whatsapp/admin-guard';
import {
    AUTOMATION_KEYS, getAutomation, updateAutomation, recentFires, type AutomationKey,
} from '@/lib/services/whatsapp/automations';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ key: string }> };

function parseKey(key: string): AutomationKey | null {
    return (AUTOMATION_KEYS as readonly string[]).includes(key) ? (key as AutomationKey) : null;
}

/** GET — one automation plus its recent fires. */
export async function GET(request: Request, { params }: Params) {
    try {
        await requireCapability(request, 'automations.read');
        const { key: raw } = await params;

        const key = parseKey(raw);
        if (!key) return NextResponse.json({ error: 'Unknown automation' }, { status: 404 });

        const [automation, fires] = await Promise.all([getAutomation(key), recentFires(key)]);
        if (!automation) return NextResponse.json({ error: 'Unknown automation' }, { status: 404 });

        return NextResponse.json({ automation, fires });
    } catch (error) {
        return errorResponse(error);
    }
}

const patchSchema = z.object({
    enabled: z.boolean().optional(),
    templateId: z.string().uuid().nullish(),
    offsetHours: z.number().int().min(-720).max(720).optional(),
});

/**
 * PATCH — toggle, choose a template, adjust timing.
 *
 * Switching an automation on is the moment it starts messaging real guests
 * without anyone pressing send again, so it is audited like a campaign launch.
 */
export async function PATCH(request: Request, { params }: Params) {
    try {
        const actor = await requireCapability(request, 'automations.write');
        const { key: raw } = await params;

        const key = parseKey(raw);
        if (!key) return NextResponse.json({ error: 'Unknown automation' }, { status: 404 });

        const patch = patchSchema.parse(await request.json());
        const before = await getAutomation(key);
        if (!before) return NextResponse.json({ error: 'Unknown automation' }, { status: 404 });

        // Refuse to arm an automation that has nothing to send: an "on" toggle
        // that quietly does nothing is worse than a refusal.
        if (patch.enabled === true) {
            const templateId = patch.templateId ?? before.templateId;
            if (!templateId) {
                return NextResponse.json(
                    { error: 'Choose an approved template before switching this automation on' },
                    { status: 400 },
                );
            }
        }

        const updated = await updateAutomation(key, patch);

        await audit({
            actor,
            action: 'whatsapp.automation.updated',
            entityType: 'wa_automations',
            entityId: key,
            before: { enabled: before.enabled, templateId: before.templateId, offsetHours: before.offsetHours },
            after: patch,
        });

        return NextResponse.json({ automation: updated });
    } catch (error) {
        return errorResponse(error);
    }
}
