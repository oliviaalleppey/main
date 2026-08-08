import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ImportWizard } from '@/components/admin/whatsapp/import-wizard';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Import contacts — WhatsApp — Olivia Admin',
};

export default function WhatsAppImportPage() {
    return (
        <div className="space-y-6">
            <div>
                <Link
                    href="/admin/whatsapp/contacts"
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to contacts
                </Link>
                <h2 className="mt-2 text-lg font-semibold text-gray-900">Import a contact sheet</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Five steps. Nothing is written to the database until you confirm on the last one.
                </p>
            </div>

            <ImportWizard />
        </div>
    );
}
