'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, AlertTriangle, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TemplatePreview } from './template-preview';
import {
    lintTemplate, hasBlockingIssues, slugifyTemplateName, extractVariables,
    OPT_OUT_BUTTON, type TemplateButton, type LintIssue,
} from '@/lib/services/whatsapp/template-lint';
import { cn } from '@/lib/utils';

/**
 * "Request a new template".
 *
 * The linter here is imported from the same module the server uses, not
 * reimplemented — so what the form accepts and what the API accepts can never
 * drift apart.
 *
 * Variables are inserted by button rather than typed. Hand-typed `{{2}}` with no
 * `{{1}}`, or a variable at the start of the body, is where most rejections come
 * from, and a rejection costs days.
 */

const VARIABLE_SOURCES = [
    { value: 'contact.firstName', label: 'Guest first name', sample: 'Anjali' },
    { value: 'contact.name', label: 'Guest full name', sample: 'Anjali Menon' },
    { value: 'guest.lastStayDate', label: 'Last stay date', sample: '12 March 2026' },
    { value: 'guest.totalStays', label: 'Number of stays', sample: '3' },
    { value: 'booking.number', label: 'Booking number', sample: 'OLV-24815' },
    { value: 'booking.checkIn', label: 'Check-in date', sample: '18 August 2026' },
    { value: 'campaign.offerCode', label: 'Offer code', sample: 'ONAM25' },
    { value: 'campaign.static', label: 'Fixed text per campaign', sample: '25%' },
];

export function TemplateForm() {
    const router = useRouter();

    const [displayName, setDisplayName] = useState('');
    const [nameEdited, setNameEdited] = useState(false);
    const [name, setName] = useState('');
    const [category, setCategory] = useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('MARKETING');
    const [language, setLanguage] = useState('en');
    const [headerType, setHeaderType] = useState<'none' | 'text' | 'image' | 'document' | 'video'>('none');
    const [headerText, setHeaderText] = useState('');
    const [bodyText, setBodyText] = useState('');
    const [footerText, setFooterText] = useState('');
    const [buttons, setButtons] = useState<TemplateButton[]>([]);
    const [variableMap, setVariableMap] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [serverIssues, setServerIssues] = useState<LintIssue[]>([]);

    const variables = useMemo(
        () => extractVariables(`${headerText} ${bodyText}`),
        [headerText, bodyText],
    );

    // Sample values drive both the preview and the example array Meta requires.
    const exampleValues = useMemo(
        () =>
            variables.map((n) => {
                const source = VARIABLE_SOURCES.find((s) => s.value === variableMap[String(n)]);
                return source?.sample ?? 'Sample';
            }),
        [variables, variableMap],
    );

    const previewValues = useMemo(
        () => Object.fromEntries(variables.map((n, index) => [String(n), exampleValues[index]])),
        [variables, exampleValues],
    );

    // Marketing templates always carry an opt-out, added server-side. Showing it
    // in the preview keeps the form honest about what will actually be submitted.
    const effectiveButtons = useMemo(() => {
        const isOptOut = (b: TemplateButton) =>
            b.type === 'QUICK_REPLY' && ['stop promotions', 'no thanks', 'unsubscribe'].includes(b.text.trim().toLowerCase());
        return category === 'MARKETING' && !buttons.some(isOptOut)
            ? [...buttons, OPT_OUT_BUTTON]
            : buttons;
    }, [buttons, category]);

    const issues = useMemo(
        () =>
            lintTemplate({
                name,
                category,
                bodyText,
                headerType,
                headerText,
                footerText,
                buttons,
                exampleValues,
            }),
        [name, category, bodyText, headerType, headerText, footerText, buttons, exampleValues],
    );

    const blocked = hasBlockingIssues(issues) || !name || !bodyText.trim();

    function updateDisplayName(value: string) {
        setDisplayName(value);
        if (!nameEdited) setName(slugifyTemplateName(value));
    }

    function insertVariable() {
        const next = variables.length ? Math.max(...variables) + 1 : 1;
        setBodyText((current) => `${current}{{${next}}}`);
    }

    function addButton(type: TemplateButton['type']) {
        if (type === 'URL') setButtons([...buttons, { type: 'URL', text: '', url: '' }]);
        else if (type === 'PHONE_NUMBER') setButtons([...buttons, { type: 'PHONE_NUMBER', text: '', phone_number: '' }]);
        else setButtons([...buttons, { type: 'QUICK_REPLY', text: '' }]);
    }

    function patchButton(index: number, updates: Partial<TemplateButton>) {
        setButtons(buttons.map((b, i) => (i === index ? ({ ...b, ...updates } as TemplateButton) : b)));
    }

    async function submit() {
        setSaving(true);
        setServerIssues([]);
        try {
            const response = await fetch('/api/admin/whatsapp/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    language,
                    category,
                    bodyText,
                    headerType,
                    headerText,
                    footerText,
                    buttons,
                    exampleValues,
                    variableMap,
                }),
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) {
                if (body.issues) setServerIssues(body.issues);
                throw new Error(body.error || `Could not save (${response.status})`);
            }

            toast.success('Draft saved and sent for internal review');
            router.push(`/admin/whatsapp/templates/${body.template.id}`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not save the template');
        } finally {
            setSaving(false);
        }
    }

    const allIssues = [...issues, ...serverIssues];

    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            {/* Form */}
            <div className="space-y-5 rounded-lg border border-gray-200 bg-white p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="tpl-display">What is this template for?</Label>
                        <Input
                            id="tpl-display"
                            value={displayName}
                            onChange={(event) => updateDisplayName(event.target.value)}
                            placeholder="e.g. Onam offer 2026"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="tpl-name">Template name (Meta format)</Label>
                        <Input
                            id="tpl-name"
                            value={name}
                            onChange={(event) => {
                                setNameEdited(true);
                                setName(slugifyTemplateName(event.target.value));
                            }}
                            placeholder="onam_offer_2026"
                            className="font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500">Lowercase, underscores. Cannot be changed later.</p>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="tpl-category">Category</Label>
                        <select
                            id="tpl-category"
                            value={category}
                            onChange={(event) => setCategory(event.target.value as typeof category)}
                            className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm"
                        >
                            <option value="MARKETING">Marketing — ₹0.78 per message</option>
                            <option value="UTILITY">Utility — ₹0.13 per message</option>
                            <option value="AUTHENTICATION">Authentication — ₹0.13 per message</option>
                        </select>
                        <p className="text-xs text-gray-500">
                            {category === 'MARKETING'
                                ? 'Needs documented opt-in, and respects quiet hours and the frequency cap.'
                                : 'Justified by the guest’s own transaction — no marketing consent required.'}
                        </p>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="tpl-language">Language</Label>
                        <select
                            id="tpl-language"
                            value={language}
                            onChange={(event) => setLanguage(event.target.value)}
                            className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm"
                        >
                            <option value="en">English</option>
                            <option value="en_GB">English (UK)</option>
                            <option value="ml">Malayalam</option>
                            <option value="hi">Hindi</option>
                            <option value="ta">Tamil</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-1.5 border-t border-gray-100 pt-4">
                    <Label htmlFor="tpl-header">Header (optional)</Label>
                    <select
                        id="tpl-header"
                        value={headerType}
                        onChange={(event) => setHeaderType(event.target.value as typeof headerType)}
                        className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm"
                    >
                        <option value="none">No header</option>
                        <option value="text">Text</option>
                        <option value="image">Image</option>
                        <option value="document">Document</option>
                        <option value="video">Video</option>
                    </select>
                    {headerType === 'text' && (
                        <Input
                            value={headerText}
                            onChange={(event) => setHeaderText(event.target.value)}
                            maxLength={60}
                            placeholder="Up to 60 characters"
                            className="mt-2"
                        />
                    )}
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="tpl-body">Body</Label>
                        <button
                            type="button"
                            onClick={insertVariable}
                            className="text-xs font-medium text-gray-600 underline hover:text-gray-900"
                        >
                            Insert a variable
                        </button>
                    </div>
                    <Textarea
                        id="tpl-body"
                        value={bodyText}
                        onChange={(event) => setBodyText(event.target.value)}
                        rows={6}
                        maxLength={1024}
                        placeholder="Hello {{1}}, we would love to welcome you back to Olivia Alleppey."
                    />
                    <p className="text-xs text-gray-500">
                        {bodyText.length}/1024 · *bold*, _italic_, ~strikethrough~
                    </p>
                </div>

                {variables.length > 0 && (
                    <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Map the variables
                        </h4>
                        {variables.map((n) => (
                            <div key={n} className="flex items-center gap-3">
                                <span className="w-12 shrink-0 font-mono text-sm text-gray-600">{`{{${n}}}`}</span>
                                <select
                                    value={variableMap[String(n)] ?? ''}
                                    onChange={(event) =>
                                        setVariableMap({ ...variableMap, [String(n)]: event.target.value })
                                    }
                                    className="h-9 flex-1 rounded-md border border-gray-200 bg-white px-2 text-sm"
                                >
                                    <option value="">Choose a data source…</option>
                                    {VARIABLE_SOURCES.map((source) => (
                                        <option key={source.value} value={source.value}>
                                            {source.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                        <p className="text-xs text-gray-500">
                            An unmapped variable blocks sending. Every one also gets a fallback, because an empty
                            variable is a delivery failure, not a blank space.
                        </p>
                    </div>
                )}

                <div className="space-y-1.5">
                    <Label htmlFor="tpl-footer">Footer (optional)</Label>
                    <Input
                        id="tpl-footer"
                        value={footerText}
                        onChange={(event) => setFooterText(event.target.value)}
                        maxLength={60}
                        placeholder="e.g. Olivia Alleppey · Finishing Point"
                    />
                </div>

                <div className="space-y-2 border-t border-gray-100 pt-4">
                    <Label>Buttons</Label>
                    {buttons.map((button, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <span className="w-24 shrink-0 text-xs text-gray-500">
                                {button.type === 'URL' ? 'Link' : button.type === 'PHONE_NUMBER' ? 'Call' : 'Quick reply'}
                            </span>
                            <Input
                                value={button.text}
                                onChange={(event) => patchButton(index, { text: event.target.value })}
                                placeholder="Label"
                                maxLength={25}
                                className="h-9"
                            />
                            {button.type === 'URL' && (
                                <Input
                                    value={button.url}
                                    onChange={(event) => patchButton(index, { url: event.target.value } as Partial<TemplateButton>)}
                                    placeholder="https://…"
                                    className="h-9"
                                />
                            )}
                            {button.type === 'PHONE_NUMBER' && (
                                <Input
                                    value={button.phone_number}
                                    onChange={(event) =>
                                        patchButton(index, { phone_number: event.target.value } as Partial<TemplateButton>)
                                    }
                                    placeholder="+91…"
                                    className="h-9"
                                />
                            )}
                            <button
                                type="button"
                                onClick={() => setButtons(buttons.filter((_, i) => i !== index))}
                                className="shrink-0 rounded p-1 text-gray-300 hover:text-red-600"
                                aria-label="Remove button"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => addButton('QUICK_REPLY')}>
                            <Plus className="mr-1 h-3.5 w-3.5" /> Quick reply
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => addButton('URL')}>
                            <Plus className="mr-1 h-3.5 w-3.5" /> Link
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => addButton('PHONE_NUMBER')}>
                            <Plus className="mr-1 h-3.5 w-3.5" /> Call
                        </Button>
                    </div>
                    {category === 'MARKETING' && (
                        <p className="text-xs text-gray-500">
                            An opt-out quick reply is added automatically to every marketing template and cannot be
                            removed.
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                    <Button variant="outline" onClick={() => router.push('/admin/whatsapp/templates')} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={() => void submit()} disabled={blocked || saving}>
                        {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                        Save and send for review
                    </Button>
                </div>
            </div>

            {/* Preview + linter */}
            <div className="space-y-4">
                <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Preview</h3>
                    <TemplatePreview
                        bodyText={bodyText}
                        headerType={headerType}
                        headerText={headerText}
                        footerText={footerText}
                        buttons={effectiveButtons}
                        values={previewValues}
                    />
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Pre-submit checks
                    </h3>
                    {allIssues.length === 0 ? (
                        <p className="mt-2 text-sm text-green-700">
                            No problems found. This still has to pass Meta&apos;s own review.
                        </p>
                    ) : (
                        <ul className="mt-2 space-y-2">
                            {allIssues.map((issue, index) => (
                                <li
                                    key={index}
                                    className={cn(
                                        'flex items-start gap-2 rounded-md p-2 text-xs',
                                        issue.severity === 'error' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-900',
                                    )}
                                >
                                    {issue.severity === 'error' ? (
                                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    ) : (
                                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    )}
                                    <span>
                                        <strong className="capitalize">{issue.field}</strong> — {issue.message}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
