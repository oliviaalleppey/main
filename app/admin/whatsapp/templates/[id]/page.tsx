import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requirePageCapability } from '@/lib/services/whatsapp/admin-guard';
import { db } from '@/lib/db';
import { waTemplates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { resolveProviderName } from '@/lib/services/whatsapp';
import { TemplatePreview } from '@/components/admin/whatsapp/template-preview';
import { TemplateActions } from '@/components/admin/whatsapp/template-actions';
import { TemplateStatusBadge, TEMPLATE_STATUS_META, CATEGORY_PRICE } from '@/components/admin/whatsapp/template-status';
import type { TemplateButton } from '@/lib/services/whatsapp/template-lint';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatDateTime(value: Date | string | null | undefined): string {
    if (!value) return '—';
    return new Date(value).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}

export default async function TemplateDetailPage({ params }: PageProps) {
    await requirePageCapability('templates.read');

    const { id } = await params;
    if (!UUID.test(id)) notFound();

    const template = await db.query.waTemplates.findFirst({ where: eq(waTemplates.id, id) });
    if (!template) notFound();

    const buttons = (template.buttons ?? []) as TemplateButton[];
    const variableMap = (template.variableMap ?? {}) as Record<string, string>;
    const statusMeta = TEMPLATE_STATUS_META[template.status] ?? TEMPLATE_STATUS_META.draft;

    // Sample values so the preview reads as a message rather than as placeholders.
    const sampleValues = Object.fromEntries(
        Array.from({ length: template.variableCount ?? 0 }, (_, index) => [
            String(index + 1),
            variableMap[String(index + 1)]?.split('.').pop() ?? 'Sample',
        ]),
    );

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href="/admin/whatsapp/templates"
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to templates
                </Link>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="font-mono text-xl font-semibold text-gray-900">{template.name}</h2>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <TemplateStatusBadge status={template.status} />
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                {template.category} · {CATEGORY_PRICE[template.category] ?? '—'} per message
                            </span>
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                {template.language}
                            </span>
                        </div>
                        <p className="mt-3 text-sm text-gray-500">{statusMeta.meaning}</p>
                    </div>
                    <TemplateActions
                        templateId={template.id}
                        templateName={template.name}
                        status={template.status}
                        provider={resolveProviderName()}
                    />
                </div>

                {template.status === 'rejected' && (
                    <div className="mt-4 rounded-md bg-red-50 p-4">
                        <h3 className="text-sm font-semibold text-red-900">Meta rejected this template</h3>
                        <p className="mt-1 text-sm text-red-800">
                            {template.rejectionReason || 'No reason was supplied.'}
                        </p>
                        <p className="mt-2 text-xs text-red-700">
                            Editing the body returns it to internal review so it can be resubmitted.
                        </p>
                    </div>
                )}

                {(template.status === 'paused' || template.status === 'disabled') && (
                    <div className="mt-4 rounded-md bg-orange-50 p-4 text-sm text-orange-900">
                        Meta has {template.status} this template for quality reasons. Sends using it will fail until
                        that changes.
                    </div>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">How the guest sees it</h3>
                    <TemplatePreview
                        bodyText={template.bodyText ?? ''}
                        headerType={template.headerType ?? 'none'}
                        headerText={template.headerText ?? ''}
                        footerText={template.footerText ?? ''}
                        buttons={buttons}
                        values={sampleValues}
                    />
                </div>

                <div className="space-y-6">
                    <div className="rounded-lg border border-gray-200 bg-white p-5">
                        <h3 className="text-sm font-semibold text-gray-900">Details</h3>
                        <dl className="mt-3 space-y-2 text-sm">
                            <Row label="Variables">{template.variableCount ?? 0}</Row>
                            <Row label="Times sent">{template.sentCount ?? 0}</Row>
                            <Row label="Quality score">{template.qualityScore ?? '—'}</Row>
                            <Row label="Meta template id">
                                <span className="font-mono text-xs">{template.metaTemplateId ?? 'not submitted'}</span>
                            </Row>
                            <Row label="Submitted">{formatDateTime(template.submittedAt)}</Row>
                            <Row label="Last synced">{formatDateTime(template.syncedAt)}</Row>
                        </dl>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-5">
                        <h3 className="text-sm font-semibold text-gray-900">Variable mapping</h3>
                        {(template.variableCount ?? 0) === 0 ? (
                            <p className="mt-2 text-sm text-gray-500">This template has no variables.</p>
                        ) : (
                            <>
                                <dl className="mt-3 space-y-2 text-sm">
                                    {Array.from({ length: template.variableCount ?? 0 }, (_, index) => {
                                        const key = String(index + 1);
                                        const mapped = variableMap[key];
                                        return (
                                            <div key={key} className="flex items-center justify-between gap-3">
                                                <dt className="font-mono text-gray-600">{`{{${key}}}`}</dt>
                                                <dd className={mapped ? 'text-gray-900' : 'text-amber-700'}>
                                                    {mapped ?? 'not mapped'}
                                                </dd>
                                            </div>
                                        );
                                    })}
                                </dl>
                                {Array.from({ length: template.variableCount ?? 0 }).some(
                                    (_, index) => !variableMap[String(index + 1)],
                                ) && (
                                    <p className="mt-3 rounded bg-amber-50 p-2 text-xs text-amber-900">
                                        An unmapped variable blocks sending — an empty value is a delivery failure,
                                        not a blank space.
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <dt className="text-gray-500">{label}</dt>
            <dd className="text-right font-medium text-gray-900">{children}</dd>
        </div>
    );
}
