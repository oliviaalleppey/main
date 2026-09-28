import { requireSection } from '@/lib/admin/guard';
import AddOnsClient from './AddOnsClient';

// The screen itself is a client component; this server wrapper exists so the
// section check runs on the server before any of it is sent to the browser.
export default async function AddOnsPage() {
    await requireSection('add-ons');
    return <AddOnsClient />;
}
