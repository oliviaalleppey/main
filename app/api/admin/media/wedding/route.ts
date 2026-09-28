import { NextResponse } from 'next/server';
import { getWeddingVenueImages, getWeddingSectionImages } from '../../../../admin/media/actions';

// Deliberately unauthenticated despite the /api/admin/ path: the public site
// fetches this to render images that are already published. Read-only, and
// adding an auth check here would blank those pages for visitors.
export async function GET() {
    try {
        const [venueImages, sectionImages] = await Promise.all([
            getWeddingVenueImages(),
            getWeddingSectionImages(),
        ]);
        return NextResponse.json({ venueImages, sectionImages });
    } catch (error) {
        console.error('Error fetching wedding images:', error);
        return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
    }
}
