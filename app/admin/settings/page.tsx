import { requireSection } from '@/lib/admin/guard';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
    await requireSection('settings');
    return <SettingsClient />;
}
