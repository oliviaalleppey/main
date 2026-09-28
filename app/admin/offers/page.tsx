import { requireSection } from '@/lib/admin/guard';
import OffersClient from './OffersClient';

export default async function OffersPage() {
    await requireSection('offers');
    return <OffersClient />;
}
