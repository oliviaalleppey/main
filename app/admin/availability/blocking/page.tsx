import { requireSection } from '@/lib/admin/guard';
import BlockDatesClient from './BlockDatesClient';

export default async function BlockDatesPage() {
    await requireSection('availability');
    return <BlockDatesClient />;
}
