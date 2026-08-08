import { AutomationList } from '@/components/admin/whatsapp/automation-list';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Automations — WhatsApp — Olivia Admin',
};

export default function WhatsAppAutomationsPage() {
    return <AutomationList />;
}
