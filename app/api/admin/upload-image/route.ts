import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const convert = formData.get('convert') !== 'false'; // default true

        if (!file || file.size === 0) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
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
