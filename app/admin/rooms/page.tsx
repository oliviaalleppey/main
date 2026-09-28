import { redirect } from 'next/navigation';
import { requireSection } from '@/lib/admin/guard';

export default async function RoomsPage() {
    await requireSection('rooms');

    redirect('/admin/rooms/types');
}
