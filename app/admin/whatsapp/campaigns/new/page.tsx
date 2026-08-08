import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CampaignWizard } from '@/components/admin/whatsapp/campaign-wizard';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'New campaign — WhatsApp — Olivia Admin',
};

export default function NewCampaignPage() {
    return (
        <div className="space-y-6">
            <div>
                <Link
                    href="/admin/whatsapp/campaigns"
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to campaigns
                </Link>
                <h2 className="mt-2 text-lg font-semibold text-gray-900">New campaign</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Five steps. Nothing is queued until you confirm on the last one by typing the campaign name.
                </p>
            </div>

            <CampaignWizard />
        </div>
    );
}
