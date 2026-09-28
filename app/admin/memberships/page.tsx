import { requireSection } from '@/lib/admin/guard';
import MembershipsClient from './MembershipsClient';

export default async function MembershipsPage() {
    await requireSection('memberships');
    return <MembershipsClient />;
}
