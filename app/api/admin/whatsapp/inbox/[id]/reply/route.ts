import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCapability, errorResponse, audit } from '@/lib/services/whatsapp/admin-guard';
import {
    sendReply, sendTemplateReply, WindowClosedError, SendBlockedError,
} from '@/lib/services/whatsapp/inbox';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

const replySchema = z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('text'), body: z.string().min(1).max(4096) }),
    z.object({
        kind: z.literal('template'),
        templateId: z.string().uuid(),
        variables: z.record(z.string(), z.string()).optional(),
    }),
]);

/**
 * POST — reply to a guest.
 *
 * Free-form text is only accepted while the 24h window is open; the service
 * layer enforces that, and a closed window comes back as 409 rather than 400 so
 * the client can distinguish "you typed something wrong" from "the rules
 * changed while you were typing" and switch the composer to templates.
 */
export async function POST(request: Request, { params }: Params) {
    try {
        const actor = await requireCapability(request, 'inbox.reply');
        const { id } = await params;
        const body = replySchema.parse(await request.json());

        const result = body.kind === 'text'
            ? await sendReply({ threadId: id, body: body.body, actor })
            : await sendTemplateReply({
                threadId: id,
                templateId: body.templateId,
                variables: body.variables,
                actor,
            });

        await audit({
            actor,
            action: `whatsapp.inbox.reply_${body.kind}`,
            entityType: 'wa_inbox_threads',
            entityId: id,
            after: body.kind === 'text'
                ? { length: body.body.length }
                : { templateId: body.templateId },
        });

        return NextResponse.json({ message: result.message, warnings: result.warnings });
    } catch (error) {
        if (error instanceof WindowClosedError) {
            return NextResponse.json(
                { error: error.message, code: 'window_closed', expiresAt: error.expiresAt },
                { status: 409 },
            );
        }
        if (error instanceof SendBlockedError) {
            return NextResponse.json(
                { error: error.message, code: error.reason },
                { status: 403 },
            );
        }
        return errorResponse(error);
    }
}
