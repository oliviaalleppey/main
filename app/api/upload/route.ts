import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Mints the short-lived client tokens the admin media screens use to upload
 * straight to Vercel Blob, bypassing the serverless request body limit.
 *
 * The token *is* the write permission, so this route was effectively an open
 * upload endpoint: it shipped with the authentication left as a commented-out
 * TODO, meaning anyone could ask for a token and write to the public store.
 * Every caller is an admin media screen (components/ui/image-upload.tsx,
 * app/admin/media/*), so the gate is the same admin check the rest of the
 * admin API uses.
 */

/**
 * Uploads go browser -> blob store without passing through this function, so
 * the token is the only place a size limit can be enforced. Generous enough for
 * the hero videos the media library accepts; low enough that a leaked token
 * cannot be used to park arbitrary volumes of data on the account.
 */
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

export async function POST(request: Request): Promise<NextResponse> {
    let body: HandleUploadBody;
    try {
        body = (await request.json()) as HandleUploadBody;
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Only the token request comes from a browser. The 'blob.upload-completed'
    // callback is sent by Vercel Blob itself with no session cookie — handleUpload
    // authenticates that one by its x-vercel-signature header, so requiring a
    // session here would reject a legitimate callback. Guarding the branch rather
    // than the route keeps that true if onUploadCompleted is added later.
    if (body.type === 'blob.generate-client-token') {
        const session = await auth();
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async () => {
                // Authentication happens above, not here: an error thrown inside
                // this callback surfaces as the generic 400 below, and an
                // unauthenticated caller should get a 401.
                return {
                    allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'],
                    addRandomSuffix: true,
                    maximumSizeInBytes: MAX_UPLOAD_BYTES,
                    tokenPayload: JSON.stringify({
                        // optional, sent to your server on upload completion
                        // you could pass a user id from auth, or a value from clientPayload
                    }),
                };
            },
        }); // Close handleUpload call

        return NextResponse.json(jsonResponse);
    } catch (error) {
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 }, // The webhook will retry 5 times automatically if the status code is 500-599
        );
    }
}
