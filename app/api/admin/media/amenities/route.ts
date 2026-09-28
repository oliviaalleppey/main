import { NextResponse } from 'next/server';
import { getAmenityImages } from '@/app/admin/media/actions';

// Deliberately unauthenticated despite the /api/admin/ path: the public site
// fetches this (wellness, wedding, conference-events and the homepage galleries)
// to render images that are already published. Read-only, and adding an auth
// check here would blank those pages for visitors.
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const images = await getAmenityImages();
        return NextResponse.json(images);
    } catch (error) {
        console.error('Error fetching amenity images:', error);
        return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
    }
}