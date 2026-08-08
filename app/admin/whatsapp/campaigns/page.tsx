import { CampaignList } from '@/components/admin/whatsapp/campaign-list';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Campaigns — WhatsApp — Olivia Admin',
};

export default function WhatsAppCampaignsPage() {
    return <CampaignList />;
}
