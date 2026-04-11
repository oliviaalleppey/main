import { NextResponse } from 'next/server';
import { getConferenceVenueImages, getConferenceSectionImages } from '../../../../admin/media/actions';

export async function GET() {
    try {
        const [venueImages, sectionImages] = await Promise.all([
            getConferenceVenueImages(),
            getConferenceSectionImages(),
        ]);
        return NextResponse.json({ venueImages, sectionImages });
    } catch (error) {
        console.error('Error fetching conference images:', error);
        return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
    }
}