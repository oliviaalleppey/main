import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/auth';
import { CampaignDetail } from '@/components/admin/whatsapp/campaign-detail';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PageProps = { params: Promise<{ id: string }> };

export default async function CampaignDetailPage({ params }: PageProps) {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') redirect('/signin');

    const { id } = await params;
    if (!UUID.test(id)) notFound();

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href="/admin/whatsapp/campaigns"
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to campaigns
                </Link>
            </div>

            <CampaignDetail campaignId={id} />
        </div>
    );
}
