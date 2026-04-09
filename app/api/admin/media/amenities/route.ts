import { NextResponse } from 'next/server';
import { getAmenityImages } from '@/app/admin/media/actions';

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