'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TemplatePreview } from './template-preview';
import { ExclusionPanel, type Breakdown, type SampleContact } from './exclusion-panel';
import { CATEGORY_PRICE } from './template-status';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { dynamicUrlButtonIndex, type TemplateButton } from '@/lib/services/whatsapp/template-lint';

/**
 * The 5-step campaign wizard.
 *
 * Deliberately slow. This is the screen that spends money and risks the sender
 * number, so every step states what it will do before the next one is reachable,
 * and the final launch requires typing the campaign name.
 */

type Template = {
    id: string;
    name: string;
    category: string;
    language: string;
    status: string;
    bodyText: string | null;
    headerType: string | null;
    headerText: string | null;
    footerText: string | null;
    buttons: TemplateButton[] | null;
    variableCount: number | null;
    variableMap: Record<string, string> | null;
};

type ActiveOffer = { id: string; code: string; title: string };

type Audience = {
    id: string;
    name: string;
    description: string | null;
    type: string;
    eligible: number;
    isRePermission: boolean;
};

type Estimate = {
    breakdown: Breakdown;
    isRePermission: boolean;
    cost: { recipients: number; category: string; perMessagePaise: number; totalPaise: number };
    completion: { days: number; finishesAt: string; perDay: number };
    dailyCap: number;
    throttlePerMin: number;
    budget: { monthly: number; remaining: number; wouldExceed: boolean };
    requiresSecondApproval: boolean;
    approvalThreshold: number;
    frequencyCap: number;
    quietHours: { start: number; end: number } | null;
};

const STEPS = ['Template', 'Audience', 'Variables', 'Schedule', 'Review'] as const;

export function CampaignWizard() {
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [audiences, setAudiences] = useState<Audience[]>([]);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [templateId, setTemplateId] = useState('');
    const [audienceId, setAudienceId] = useState('');
    const [name, setName] = useState('');
    const [staticVariables, setStaticVariables] = useState<Record<string, string>>({});
    const [destinationPath, setDestinationPath] = useState('/');
    const [utmCampaign, setUtmCampaign] = useState('');
    const [offerCode, setOfferCode] = useState('');
    const [activeOffers, setActiveOffers] = useState<ActiveOffer[]>([]);
    const [dailyCap, setDailyCap] = useState<number | ''>('');
    const [throttlePerMin, setThrottlePerMin] = useState<number | ''>('');
    const [scheduledAt, setScheduledAt] = useState('');

    const [estimate, setEstimate] = useState<Estimate | null>(null);
    const [samples, setSamples] = useState<SampleContact[]>([]);
    const [estimating, setEstimating] = useState(false);
    const [confirmName, setConfirmName] = useState('');
    const [launching, setLaunching] = useState(false);

    const template = templates.find((t) => t.id === templateId);
    const tracksClicks = dynamicUrlButtonIndex(template?.buttons ?? null) !== null;
    const audience = audiences.find((a) => a.id === audienceId);

    useEffect(() => {
        (async () => {
            try {
                const [templateResponse, audienceResponse, offerResponse] = await Promise.all([
                    fetch('/api/admin/whatsapp/templates'),
                    fetch('/api/admin/whatsapp/audiences'),
                    // Only an admin can read this; a marketing user building a
                    // campaign simply gets no promo picker rather than an error.
                    fetch('/api/admin/offers?active=true').catch(() => null),
                ]);
                const templateBody = await templateResponse.json().catch(() => ({}));
                const audienceBody = await audienceResponse.json().catch(() => ({}));
                if (!templateResponse.ok) throw new Error(templateBody.error || 'Could not load templates');
                if (!audienceResponse.ok) throw new Error(audienceBody.error || 'Could not load audiences');

                // Only approved templates can be sent, so nothing else is offered.
                setTemplates((templateBody.templates ?? []).filter((t: Template) => t.status === 'approved'));
                setAudiences(audienceBody.audiences ?? []);

                if (offerResponse?.ok) {
                    const offerBody = await offerResponse.json().catch(() => ({}));
                    setActiveOffers(offerBody.offers ?? []);
                }
            } catch (error) {
                setLoadError(error instanceof Error ? error.message : 'Could not load campaign options');
            }
        })();
    }, []);

    const runEstimate = useCallback(async () => {
        if (!templateId || !audienceId) return;
        setEstimating(true);
        try {
            const response = await fetch('/api/admin/whatsapp/campaigns/new/estimate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    templateId,
                    audienceId,
                    dailyCap: dailyCap || undefined,
                    throttlePerMin: throttlePerMin || undefined,
                }),
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.error || 'Could not estimate');
            setEstimate(body);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not estimate');
        } finally {
            setEstimating(false);
        }
    }, [templateId, audienceId, dailyCap, throttlePerMin]);

    // Sample contacts for the variable preview step.
    useEffect(() => {
        if (step !== 3 || !audience) return;
        (async () => {
            try {
                const response = await fetch('/api/admin/whatsapp/audiences/preview', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filter: {}, limit: 5 }),
                });
                const body = await response.json().catch(() => ({}));
                if (response.ok) setSamples(body.samples ?? []);
            } catch {
                // A missing preview is cosmetic; the step still works.
            }
        })();
    }, [step, audience]);

    useEffect(() => {
        if (step === 2 || step === 4 || step === 5) void runEstimate();
    }, [step, runEstimate]);

    async function launch() {
        setLaunching(true);
        try {
            const createResponse = await fetch('/api/admin/whatsapp/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    templateId,
                    audienceId,
                    staticVariables,
                    dailyCap: dailyCap || undefined,
                    throttlePerMin: throttlePerMin || undefined,
                    scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
                    // Only sent when the template can actually carry a token.
                    destinationPath: tracksClicks ? destinationPath.trim() || '/' : undefined,
                    utmCampaign: tracksClicks && utmCampaign.trim() ? utmCampaign.trim() : undefined,
                    offerCode: tracksClicks && offerCode ? offerCode : undefined,
                }),
            });
            const created = await createResponse.json().catch(() => ({}));
            if (!createResponse.ok) throw new Error(created.error || 'Could not create the campaign');

            const campaignId = created.campaign.id;

            const startResponse = await fetch(`/api/admin/whatsapp/campaigns/${campaignId}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirmName: confirmName.trim() }),
            });
            const started = await startResponse.json().catch(() => ({}));

            if (startResponse.status === 409 && started.requiresApproval) {
                toast.warning(started.error);
                router.push(`/admin/whatsapp/campaigns/${campaignId}`);
                return;
            }
            if (!startResponse.ok) {
                // The campaign exists as a draft; send them to it rather than losing the work.
                toast.error(started.error || 'Could not start the campaign');
                router.push(`/admin/whatsapp/campaigns/${campaignId}`);
                return;
            }

            toast.success(started.message ?? 'Campaign started');
            router.push(`/admin/whatsapp/campaigns/${campaignId}`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not launch the campaign');
        } finally {
            setLaunching(false);
        }
    }

    if (loadError) {
        return (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-6">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                        <h2 className="font-semibold text-amber-900">Could not start the wizard</h2>
                        <p className="mt-1 text-sm text-amber-800">{loadError}</p>
                        <p className="mt-2 text-xs text-amber-700">
                            If the WhatsApp tables have not been created yet, apply{' '}
                            <code>drizzle/0006_whatsapp_module.sql</code> first.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const previewValues = Object.fromEntries(
        Array.from({ length: template?.variableCount ?? 0 }, (_, index) => {
            const key = String(index + 1);
            const staticValue = staticVariables[key];
            const mapped = template?.variableMap?.[key];
            const sample = samples[0];
            const resolved = staticValue
                || (mapped === 'contact.firstName' ? sample?.name?.split(' ')[0] : undefined)
                || (mapped === 'contact.name' ? sample?.name ?? undefined : undefined)
                || mapped?.split('.').pop()
                || 'Guest';
            return [key, resolved];
        }),
    );

    return (
        <div className="space-y-6">
            <Stepper current={step} />

            {/* Step 1 — Template */}
            {step === 1 && (
                <Panel title="Choose a template" description="Only templates approved by Meta can be sent.">
                    {templates.length === 0 ? (
                        <EmptyNotice
                            message="No approved templates yet."
                            action={{ href: '/admin/whatsapp/templates', label: 'Go to templates' }}
                        />
                    ) : (
                        <div className="space-y-2">
                            {templates.map((t) => (
                                <label
                                    key={t.id}
                                    className={cn(
                                        'flex cursor-pointer items-start gap-3 rounded-md border p-4',
                                        templateId === t.id ? 'border-gray-900 bg-gray-50' : 'border-gray-200',
                                    )}
                                >
                                    <input
                                        type="radio"
                                        name="template"
                                        className="mt-1"
                                        checked={templateId === t.id}
                                        onChange={() => setTemplateId(t.id)}
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span className="flex flex-wrap items-center gap-2">
                                            <span className="font-mono text-sm font-semibold text-gray-900">{t.name}</span>
                                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                                                {t.category} · {CATEGORY_PRICE[t.category]} each
                                            </span>
                                        </span>
                                        <span className="mt-1 block line-clamp-2 text-sm text-gray-600">{t.bodyText}</span>
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}

                    {template && (
                        <div className="max-w-sm">
                            <TemplatePreview
                                bodyText={template.bodyText ?? ''}
                                headerType={template.headerType ?? 'none'}
                                headerText={template.headerText ?? ''}
                                footerText={template.footerText ?? ''}
                                buttons={template.buttons ?? []}
                            />
                        </div>
                    )}

                    <Footer onNext={() => setStep(2)} nextDisabled={!templateId} nextLabel="Choose an audience" />
                </Panel>
            )}

            {/* Step 2 — Audience */}
            {step === 2 && (
                <Panel
                    title="Choose an audience"
                    description="The exclusion breakdown shows who will not receive this, and why."
                >
                    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
                        <div className="space-y-2">
                            {audiences.length === 0 ? (
                                <EmptyNotice
                                    message="No audiences yet."
                                    action={{ href: '/admin/whatsapp/audiences', label: 'Build one' }}
                                />
                            ) : (
                                audiences.map((a) => (
                                    <label
                                        key={a.id}
                                        className={cn(
                                            'flex cursor-pointer items-start gap-3 rounded-md border p-4',
                                            audienceId === a.id ? 'border-gray-900 bg-gray-50' : 'border-gray-200',
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="audience"
                                            className="mt-1"
                                            checked={audienceId === a.id}
                                            onChange={() => setAudienceId(a.id)}
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className="flex flex-wrap items-center gap-2">
                                                <span className="font-medium text-gray-900">{a.name}</span>
                                                <span className="text-xs text-gray-500">
                                                    {a.eligible.toLocaleString('en-IN')} eligible
                                                </span>
                                                {a.isRePermission && (
                                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                                                        Re-permission only
                                                    </span>
                                                )}
                                            </span>
                                            {a.description && (
                                                <span className="mt-0.5 block text-xs text-gray-500">{a.description}</span>
                                            )}
                                        </span>
                                    </label>
                                ))
                            )}
                        </div>

                        <div className="lg:border-l lg:border-gray-100 lg:pl-6">
                            {audienceId ? (
                                <ExclusionPanel
                                    breakdown={estimate?.breakdown ?? null}
                                    samples={[]}
                                    loading={estimating}
                                    error={null}
                                    frequencyCap={estimate?.frequencyCap ?? 2}
                                />
                            ) : (
                                <p className="text-sm text-gray-500">Pick an audience to see the breakdown.</p>
                            )}
                        </div>
                    </div>

                    {estimate?.isRePermission && template?.category === 'MARKETING' && (
                        <Notice>
                            This audience is pending contacts, who may only receive the re-permission template. If
                            this template is not that ask, every message will be blocked by the consent gate.
                        </Notice>
                    )}

                    <Footer
                        onBack={() => setStep(1)}
                        onNext={() => setStep(3)}
                        nextDisabled={!audienceId || !estimate || estimate.breakdown.eligible === 0}
                        nextLabel="Set the variables"
                    />
                    {estimate && estimate.breakdown.eligible === 0 && (
                        <p className="text-sm text-red-600">
                            Nobody in this audience is eligible, so there would be nothing to send.
                        </p>
                    )}
                </Panel>
            )}

            {/* Step 3 — Variables */}
            {step === 3 && template && (
                <Panel
                    title="Confirm the variables"
                    description="Anything not mapped on the template needs a fixed value for this campaign."
                >
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="space-y-3">
                            {(template.variableCount ?? 0) === 0 ? (
                                <p className="text-sm text-gray-500">This template has no variables.</p>
                            ) : (
                                Array.from({ length: template.variableCount ?? 0 }, (_, index) => {
                                    const key = String(index + 1);
                                    const mapped = template.variableMap?.[key];
                                    return (
                                        <div key={key} className="space-y-1.5">
                                            <Label htmlFor={`var-${key}`}>
                                                <span className="font-mono">{`{{${key}}}`}</span>
                                                {mapped && (
                                                    <span className="ml-2 text-xs font-normal text-gray-500">
                                                        mapped to {mapped}
                                                    </span>
                                                )}
                                            </Label>
                                            <Input
                                                id={`var-${key}`}
                                                value={staticVariables[key] ?? ''}
                                                onChange={(event) =>
                                                    setStaticVariables({ ...staticVariables, [key]: event.target.value })
                                                }
                                                placeholder={
                                                    mapped
                                                        ? 'Leave blank to use the mapped value'
                                                        : 'Required — no data source is mapped'
                                                }
                                            />
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div>
                            {/*
                              Only shown when the template actually has a dynamic
                              URL button. Offering a destination for a template
                              that cannot carry a token would silently do nothing.
                            */}
                            {tracksClicks && (
                                <div className="mb-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                    <div>
                                        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Link tracking
                                        </h4>
                                        <p className="mt-1 text-xs text-gray-500">
                                            This template has a tracked button. Each guest gets their own
                                            link, so clicks and any bookings that follow are attributed to
                                            this campaign.
                                        </p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="camp-destination">Where the button goes</Label>
                                        <Input
                                            id="camp-destination"
                                            value={destinationPath}
                                            onChange={(event) => setDestinationPath(event.target.value)}
                                            placeholder="/rooms/houseboat"
                                        />
                                        <p className="text-xs text-gray-500">
                                            A path on this site, starting with a slash. Anything else falls
                                            back to the home page.
                                        </p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="camp-utm">Google Analytics campaign name</Label>
                                        <Input
                                            id="camp-utm"
                                            value={utmCampaign}
                                            onChange={(event) => setUtmCampaign(event.target.value)}
                                            placeholder="onam_2026"
                                        />
                                        <p className="text-xs text-gray-500">
                                            Optional. Sent as <span className="font-mono">utm_campaign</span> so
                                            GA reporting lines up with the numbers here.
                                        </p>
                                    </div>

                                    {/*
                                      A picker rather than a text field on purpose: a mistyped
                                      code is not an error anyone sees. It would auto-apply to
                                      nothing, and every recipient would pay full price on an
                                      offer the hotel believes it is running.
                                    */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="camp-offer">Promo code</Label>
                                        <select
                                            id="camp-offer"
                                            value={offerCode}
                                            onChange={(event) => setOfferCode(event.target.value)}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                                        >
                                            <option value="">No promo code</option>
                                            {activeOffers.map((offer) => (
                                                <option key={offer.id} value={offer.code}>
                                                    {offer.code} — {offer.title}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500">
                                            {activeOffers.length === 0
                                                ? 'No active promo codes. Create one under Promo Codes to offer a discount here.'
                                                : 'Applied automatically for guests who follow this link. They can still type it themselves.'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Preview {samples[0]?.name ? `for ${samples[0].name}` : ''}
                            </h4>
                            <TemplatePreview
                                bodyText={template.bodyText ?? ''}
                                headerType={template.headerType ?? 'none'}
                                headerText={template.headerText ?? ''}
                                footerText={template.footerText ?? ''}
                                buttons={template.buttons ?? []}
                                values={previewValues}
                            />
                        </div>
                    </div>

                    <Footer onBack={() => setStep(2)} onNext={() => setStep(4)} nextLabel="Set the schedule" />
                </Panel>
            )}

            {/* Step 4 — Schedule */}
            {step === 4 && (
                <Panel title="Schedule and pace" description="Caps and quiet hours apply on top of whatever is set here.">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="camp-name">Campaign name</Label>
                            <Input
                                id="camp-name"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="e.g. Onam 2026 — opted-in guests"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="camp-schedule">Send at (optional)</Label>
                            <Input
                                id="camp-schedule"
                                type="datetime-local"
                                value={scheduledAt}
                                onChange={(event) => setScheduledAt(event.target.value)}
                            />
                            <p className="text-xs text-gray-500">Leave blank to start as soon as it is launched.</p>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="camp-cap">Daily cap for this campaign</Label>
                            <Input
                                id="camp-cap"
                                type="number"
                                min={1}
                                value={dailyCap}
                                onChange={(event) => setDailyCap(event.target.value ? Number(event.target.value) : '')}
                                placeholder={String(estimate?.dailyCap ?? '')}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="camp-throttle">Messages per minute</Label>
                            <Input
                                id="camp-throttle"
                                type="number"
                                min={1}
                                max={600}
                                value={throttlePerMin}
                                onChange={(event) => setThrottlePerMin(event.target.value ? Number(event.target.value) : '')}
                                placeholder={String(estimate?.throttlePerMin ?? '')}
                            />
                        </div>
                    </div>

                    {estimate?.quietHours && (
                        <p className="text-sm text-gray-500">
                            Quiet hours are {estimate.quietHours.start}:00–{estimate.quietHours.end}:00. Marketing
                            messages are held until morning rather than dropped.
                        </p>
                    )}

                    <Footer
                        onBack={() => setStep(3)}
                        onNext={() => setStep(5)}
                        nextDisabled={!name.trim()}
                        nextLabel="Review"
                    />
                </Panel>
            )}

            {/* Step 5 — Review */}
            {step === 5 && template && audience && (
                <Panel title="Review and launch" description="This is the step that spends money.">
                    {estimating || !estimate ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" /> Calculating…
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-6 lg:grid-cols-2">
                                <dl className="divide-y divide-gray-100 rounded-lg border border-gray-200 text-sm">
                                    <Row label="Campaign">{name}</Row>
                                    <Row label="Template">
                                        <span className="font-mono">{template.name}</span>
                                    </Row>
                                    <Row label="Audience">{audience.name}</Row>
                                    <Row label="Recipients">
                                        <strong>{estimate.breakdown.eligible.toLocaleString('en-IN')}</strong>
                                        <span className="text-gray-400">
                                            {' '}of {estimate.breakdown.matched.toLocaleString('en-IN')} matched
                                        </span>
                                    </Row>
                                    <Row label="Estimated cost">
                                        <strong>{formatCurrency(estimate.cost.totalPaise)}</strong>
                                        <span className="text-gray-400">
                                            {' '}({formatCurrency(estimate.cost.perMessagePaise)} × {estimate.cost.recipients.toLocaleString('en-IN')})
                                        </span>
                                    </Row>
                                    <Row label="Daily cap">{estimate.dailyCap.toLocaleString('en-IN')}</Row>
                                    <Row label="Expected to finish">
                                        {estimate.completion.days === 1
                                            ? 'Today'
                                            : `${estimate.completion.days} days (about ${estimate.completion.perDay.toLocaleString('en-IN')}/day)`}
                                    </Row>
                                    <Row label="Send at">
                                        {scheduledAt ? new Date(scheduledAt).toLocaleString('en-IN') : 'Immediately'}
                                    </Row>
                                </dl>

                                <div>
                                    <TemplatePreview
                                        bodyText={template.bodyText ?? ''}
                                        headerType={template.headerType ?? 'none'}
                                        headerText={template.headerText ?? ''}
                                        footerText={template.footerText ?? ''}
                                        buttons={template.buttons ?? []}
                                        values={previewValues}
                                    />
                                </div>
                            </div>

                            {estimate.budget.wouldExceed && (
                                <Notice tone="red">
                                    This campaign costs {formatCurrency(estimate.cost.totalPaise)}, more than the
                                    entire monthly budget of {formatCurrency(estimate.budget.monthly)}.
                                </Notice>
                            )}

                            {estimate.requiresSecondApproval && (
                                <Notice>
                                    {estimate.breakdown.eligible.toLocaleString('en-IN')} recipients is above the
                                    approval threshold of {estimate.approvalThreshold.toLocaleString('en-IN')}. A
                                    second admin must approve before this can start — launching now will park it as
                                    pending approval.
                                </Notice>
                            )}

                            <div className="space-y-1.5 border-t border-gray-100 pt-4">
                                <Label htmlFor="confirm-name">
                                    Type <span className="font-semibold">{name}</span> to confirm
                                </Label>
                                <Input
                                    id="confirm-name"
                                    value={confirmName}
                                    onChange={(event) => setConfirmName(event.target.value)}
                                    placeholder={name}
                                    className="max-w-md"
                                />
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                                <Button variant="outline" onClick={() => setStep(4)} disabled={launching}>
                                    <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                                </Button>
                                <Button
                                    onClick={() => void launch()}
                                    disabled={launching || confirmName.trim() !== name.trim()}
                                >
                                    {launching && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                                    Launch — {formatCurrency(estimate.cost.totalPaise)}
                                </Button>
                            </div>
                        </>
                    )}
                </Panel>
            )}
        </div>
    );
}

function Stepper({ current }: { current: number }) {
    return (
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            {STEPS.map((label, index) => {
                const number = index + 1;
                const done = current > number;
                const active = current === number;
                return (
                    <li key={label} className="flex items-center gap-2">
                        <span
                            className={cn(
                                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                                done && 'bg-green-600 text-white',
                                active && 'bg-gray-900 text-white',
                                !done && !active && 'bg-gray-100 text-gray-400',
                            )}
                        >
                            {done ? <Check className="h-3.5 w-3.5" /> : number}
                        </span>
                        <span className={cn('text-xs', active ? 'font-semibold text-gray-900' : 'text-gray-500')}>
                            {label}
                        </span>
                        {number < STEPS.length && <span className="mx-1 text-gray-300">›</span>}
                    </li>
                );
            })}
        </ol>
    );
}

function Panel({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-5 rounded-lg border border-gray-200 bg-white p-6">
            <div>
                <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                <p className="mt-1 text-sm text-gray-500">{description}</p>
            </div>
            {children}
        </div>
    );
}

function Footer({
    onBack,
    onNext,
    nextLabel,
    nextDisabled,
}: {
    onBack?: () => void;
    onNext: () => void;
    nextLabel: string;
    nextDisabled?: boolean;
}) {
    return (
        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            {onBack ? (
                <Button variant="outline" onClick={onBack}>
                    <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                </Button>
            ) : (
                <Button variant="outline" asChild>
                    <Link href="/admin/whatsapp/campaigns">Cancel</Link>
                </Button>
            )}
            <Button onClick={onNext} disabled={nextDisabled}>
                {nextLabel}
                <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
        </div>
    );
}

function Notice({ children, tone = 'amber' }: { children: React.ReactNode; tone?: 'amber' | 'red' }) {
    return (
        <div
            className={cn(
                'flex items-start gap-3 rounded-md border p-3 text-sm',
                tone === 'red'
                    ? 'border-red-200 bg-red-50 text-red-900'
                    : 'border-amber-200 bg-amber-50 text-amber-900',
            )}
        >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>{children}</div>
        </div>
    );
}

function EmptyNotice({ message, action }: { message: string; action: { href: string; label: string } }) {
    return (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-6 text-center">
            <p className="text-sm text-gray-600">{message}</p>
            <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href={action.href}>{action.label}</Link>
            </Button>
        </div>
    );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-4 px-4 py-2.5">
            <dt className="text-gray-500">{label}</dt>
            <dd className="text-right text-gray-900">{children}</dd>
        </div>
    );
}
