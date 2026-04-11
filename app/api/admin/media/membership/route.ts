import { NextResponse } from 'next/server';
import { getMembershipImages } from '@/app/admin/media/actions';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const images = await getMembershipImages();
        return NextResponse.json(images);
    } catch (error) {
        console.error('Error fetching membership images:', error);
        return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
    }
}
