import { NextResponse } from 'next/server';
import { getWeddingVenueImages, getWeddingSectionImages } from '../../../../admin/media/actions';

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
