import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TemplateForm } from '@/components/admin/whatsapp/template-form';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Request a template — WhatsApp — Olivia Admin',
};

export default function NewTemplatePage() {
    return (
        <div className="space-y-6">
            <div>
                <Link
                    href="/admin/whatsapp/templates"
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to templates
                </Link>
                <h2 className="mt-2 text-lg font-semibold text-gray-900">Request a new template</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Saved as a draft for internal review first. Nothing reaches Meta until someone approves it —
                    rejected templates count against the account&apos;s reputation.
                </p>
            </div>

            <TemplateForm />
        </div>
    );
}
