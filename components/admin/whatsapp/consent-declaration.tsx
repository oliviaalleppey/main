'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * The consent declaration — step 4 of the import wizard, and the same block in
 * the single-contact add dialog.
 *
 * There is one rule this component exists to make unavoidable: claiming an
 * opt-in requires naming where it came from and when it was collected. The
 * server enforces it too (import.ts silently downgrades an incomplete
 * declaration to `pending`), but an operator should see the requirement rather
 * than discover afterwards that their 10,000 "opted-in" contacts landed as
 * pending.
 */

export type Declaration = {
    hasExplicitOptIn: boolean;
    source: string;
    collectedAt: string;
    proofUrl: string;
};

export const emptyDeclaration: Declaration = {
    hasExplicitOptIn: false,
    source: '',
    collectedAt: '',
    proofUrl: '',
};

/** Mirrors resolveAssignedStatus() in lib/services/whatsapp/import.ts. */
export function declarationIsComplete(declaration: Declaration): boolean {
    if (!declaration.hasExplicitOptIn) return true;
    return declaration.source.trim().length > 0 && declaration.collectedAt.length > 0;
}

export function declaredStatus(declaration: Declaration): 'opted_in' | 'pending' {
    return declaration.hasExplicitOptIn && declarationIsComplete(declaration) ? 'opted_in' : 'pending';
}

const OPT_IN_SOURCES = [
    'Booking form checkbox',
    'Front desk consent card',
    'Website enquiry form',
    'WhatsApp opt-in message',
    'Event or promotion sign-up',
];

export function ConsentDeclarationFields({
    value,
    onChange,
    idPrefix,
}: {
    value: Declaration;
    onChange: (next: Declaration) => void;
    idPrefix: string;
}) {
    function patch(updates: Partial<Declaration>) {
        onChange({ ...value, ...updates });
    }

    return (
        <div className="space-y-3">
            <Label>Consent declaration (required)</Label>

            <label
                className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm',
                    !value.hasExplicitOptIn ? 'border-gray-900 bg-gray-50' : 'border-gray-200',
                )}
            >
                <input
                    type="radio"
                    name={`${idPrefix}-consent`}
                    className="mt-1"
                    checked={!value.hasExplicitOptIn}
                    onChange={() => patch({ hasExplicitOptIn: false })}
                />
                <span>
                    <span className="font-medium text-gray-900">No explicit WhatsApp opt-in</span>
                    <span className="block text-xs text-gray-500">
                        Lands as <strong>Pending</strong>. Can only be sent the re-permission template — never a
                        marketing offer. This is enforced in code, not by policy.
                    </span>
                </span>
            </label>

            <label
                className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm',
                    value.hasExplicitOptIn ? 'border-gray-900 bg-gray-50' : 'border-gray-200',
                )}
            >
                <input
                    type="radio"
                    name={`${idPrefix}-consent`}
                    className="mt-1"
                    checked={value.hasExplicitOptIn}
                    onChange={() => patch({ hasExplicitOptIn: true })}
                />
                <span>
                    <span className="font-medium text-gray-900">
                        These contacts explicitly opted in to WhatsApp
                    </span>
                    <span className="block text-xs text-gray-500">
                        Lands as <strong>Opted in</strong> and may receive marketing. Requires a source and the date
                        it was collected.
                    </span>
                </span>
            </label>

            {value.hasExplicitOptIn && (
                <div className="grid gap-4 rounded-md border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor={`${idPrefix}-source`}>Opt-in source (required)</Label>
                        <Input
                            id={`${idPrefix}-source`}
                            list={`${idPrefix}-source-options`}
                            value={value.source}
                            onChange={(event) => patch({ source: event.target.value })}
                            placeholder="e.g. Booking form checkbox"
                        />
                        <datalist id={`${idPrefix}-source-options`}>
                            {OPT_IN_SOURCES.map((source) => (
                                <option key={source} value={source} />
                            ))}
                        </datalist>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor={`${idPrefix}-collected`}>Date collected (required)</Label>
                        <Input
                            id={`${idPrefix}-collected`}
                            type="date"
                            max={new Date().toISOString().slice(0, 10)}
                            value={value.collectedAt}
                            onChange={(event) => patch({ collectedAt: event.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor={`${idPrefix}-proof`}>Link to proof (optional)</Label>
                        <Input
                            id={`${idPrefix}-proof`}
                            type="url"
                            value={value.proofUrl}
                            onChange={(event) => patch({ proofUrl: event.target.value })}
                            placeholder="https://… scan of the consent form, screenshot, or signup export"
                        />
                    </div>
                    {!declarationIsComplete(value) && (
                        <p className="sm:col-span-2 text-xs font-medium text-amber-700">
                            Without both a source and a date, this import will land as Pending instead.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
