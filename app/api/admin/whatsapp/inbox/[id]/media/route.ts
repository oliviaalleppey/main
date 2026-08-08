import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { requireCapability, errorResponse, audit } from '@/lib/services/whatsapp/admin-guard';
import { sendMediaReply, MEDIA_LIMITS } from '@/lib/services/whatsapp/inbox';
import type { MediaKind } from '@/lib/services/whatsapp/types';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/**
 * POST — upload an image or PDF and send it into the conversation.
 *
 * Upload and send are one route on purpose. A separate "upload" endpoint would
 * be a public-blob writer that any authenticated role could call without ever
 * sending anything, which is a file-drop service we do not want to run.
 *
 * Note that unlike /api/admin/upload-image, nothing is converted to WebP here.
 * Meta accepts only JPEG and PNG for image messages, so a "helpful" conversion
 * would produce a file WhatsApp refuses.
 */
export async function POST(request: Request, { params }: Params) {
    try {
        const actor = await requireCapability(request, 'inbox.reply');
        const { id } = await params;

        const form = await request.formData();
        const file = form.get('file');
        const caption = (form.get('caption') as string | null) ?? undefined;

        if (!(file instanceof File) || file.size === 0) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const kind: MediaKind = file.type === 'application/pdf' ? 'document' : 'image';
        const limits = MEDIA_LIMITS[kind];

        if (!(limits.mime as readonly string[]).includes(file.type)) {
            return NextResponse.json(
                { error: `Unsupported file type ${file.type || 'unknown'}. Allowed: JPEG, PNG, PDF.` },
                { status: 400 },
            );
        }
        if (file.size > limits.bytes) {
            return NextResponse.json(
                { error: `File is too large. WhatsApp allows up to ${Math.floor(limits.bytes / 1024 / 1024)}MB for a ${kind}.` },
                { status: 400 },
            );
        }

        // Meta fetches the link itself, so this has to be public. addRandomSuffix
        // keeps two guests' "menu.pdf" from colliding, and means the URL is not
        // guessable from the filename alone.
        const blob = await put(`whatsapp/${id}/${file.name}`, file, {
            access: 'public',
            addRandomSuffix: true,
            contentType: file.type,
        });

        // If this throws, the blob is left behind. That is the right way round:
        // an orphaned file costs pennies, whereas deleting it on a send error
        // would break the failed-message bubble, which links to it so the
        // operator can see what they tried to send.
        const { message, warnings } = await sendMediaReply({
            threadId: id,
            kind,
            link: blob.url,
            mimeType: file.type,
            filename: file.name,
            caption,
            actor,
        });

        await audit({
            actor,
            action: 'inbox.send_media',
            entityType: 'inbox_thread',
            entityId: id,
            after: { kind, mimeType: file.type, bytes: file.size, url: blob.url },
        });

        return NextResponse.json({ message, warnings });
    } catch (error) {
        return errorResponse(error);
    }
}
