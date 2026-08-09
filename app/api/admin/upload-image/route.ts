import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import sharp from 'sharp';
import { auth } from '@/auth';

/**
 * Server-side upload straight into the public blob store.
 *
 * This route had no permission check at all: a `put(..., { access: 'public' })`
 * reachable by anyone who knew the path, which is an open file drop and an
 * unbounded storage bill. There is no middleware guarding /api/admin/** — the
 * `authorized` callback in auth.config.ts only covers page routes under /admin —
 * so the check has to live in the handler, the same way every other admin API
 * route here does it (see app/api/admin/rooms/types/route.ts).
 */

/** Mirrors the allowlist the client-upload route hands to Vercel Blob. */
const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
];

/**
 * The whole file is buffered in memory and run through sharp, so the cap is
 * about bounding that work, not about the transport: Vercel's ~4.5 MB request
 * body limit already rejects anything larger before this handler runs. The check
 * is what keeps that from being the only thing standing between a caller and an
 * arbitrarily large in-memory decode.
 */
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const convert = formData.get('convert') !== 'false'; // default true

        if (!file || file.size === 0) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }
        if (file.size > MAX_BYTES) {
            return NextResponse.json(
                { error: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Limit is 10 MB.` },
                { status: 400 },
            );
        }
        // Worth checking even though sharp would reject a non-image: with
        // convert=false the bytes go to the blob store untouched, so this is the
        // only thing deciding what can be stored under a public URL.
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: `Unsupported file type${file.type ? ` (${file.type})` : ''}. Upload a JPEG, PNG, GIF, WebP, MP4 or WebM.` },
                { status: 400 },
            );
        }

        const originalSize = file.size;
        const isVideo = file.type.startsWith('video/');
        let uploadData: Buffer | File = file;
        let uploadName = file.name;
        let contentType = file.type;
        let convertedSize: number | undefined;

        if (!isVideo && convert) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const webpBuffer = await sharp(buffer).webp({ quality: 85 }).toBuffer();
            convertedSize = webpBuffer.length;
            uploadData = webpBuffer;
            uploadName = file.name.replace(/\.[^.]+$/, '.webp');
            contentType = 'image/webp';
        }

        const blob = await put(uploadName, uploadData, {
            access: 'public',
            addRandomSuffix: true,
            contentType,
        });

        return NextResponse.json({ url: blob.url, originalSize, convertedSize });
    } catch (err) {
        console.error('Upload error:', err);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
