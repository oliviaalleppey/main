'use client';

import { useState, useTransition } from 'react';
import { Loader2, Plus, Trash2, Check } from 'lucide-react';
import { addStaff, removeStaff, setStaffSections, type StaffMember } from './actions';

type SectionOption = {
    key: string;
    label: string;
    description: string;
};

export function AddStaffForm() {
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    return (
        <form
            action={(formData) => {
                setError(null);
                startTransition(async () => {
                    const result = await addStaff(formData);
                    if (result.error) setError(result.error);
                });
            }}
            className="flex flex-wrap items-start gap-3"
        >
            <div className="min-w-64 flex-1">
                <input
                    type="email"
                    name="email"
                    required
                    placeholder="name@example.com"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
            <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
            >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add staff
            </button>
        </form>
    );
}

export function StaffRow({
    person,
    sections,
}: {
    person: StaffMember;
    sections: SectionOption[];
}) {
    const [selected, setSelected] = useState<Set<string>>(new Set(person.sections));
    const [pending, startTransition] = useTransition();
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Compared against the server's copy so the Save button only lights up when
    // there is something to save.
    const dirty =
        selected.size !== person.sections.length ||
        person.sections.some((s) => !selected.has(s));

    function toggle(key: string) {
        setSaved(false);
        setSelected((current) => {
            const next = new Set(current);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }

    function save() {
        setError(null);
        const formData = new FormData();
        formData.set('userId', person.id);
        for (const key of selected) formData.append('sections', key);

        startTransition(async () => {
            const result = await setStaffSections(formData);
            if (result.error) setError(result.error);
            else setSaved(true);
        });
    }

    function remove() {
        setError(null);
        const formData = new FormData();
        formData.set('userId', person.id);
        startTransition(async () => {
            const result = await removeStaff(formData);
            if (result.error) setError(result.error);
        });
    }

    return (
        <div className="rounded-xl border border-gray-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                        {(person.name ?? person.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                            {person.name ?? person.email}
                        </p>
                        <p className="truncate text-xs text-gray-500">{person.email}</p>
                    </div>
                    {!person.hasSignedIn && (
                        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                            Awaiting first sign-in
                        </span>
                    )}
                </div>

                <button
                    type="button"
                    onClick={remove}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove access
                </button>
            </div>

            <div className="p-4">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {sections.map((section) => {
                        const checked = selected.has(section.key);
                        return (
                            <label
                                key={section.key}
                                title={section.description}
                                className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 transition ${checked
                                    ? 'border-gray-900 bg-gray-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggle(section.key)}
                                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                />
                                <span className="min-w-0">
                                    <span className="block text-sm font-medium text-gray-900">
                                        {section.label}
                                    </span>
                                    <span className="block text-xs leading-snug text-gray-500">
                                        {section.description}
                                    </span>
                                </span>
                            </label>
                        );
                    })}
                </div>

                <div className="mt-4 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={save}
                        disabled={pending || !dirty}
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-40"
                    >
                        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Save access
                    </button>

                    {saved && !dirty && (
                        <span className="inline-flex items-center gap-1.5 text-sm text-green-700">
                            <Check className="h-4 w-4" />
                            Saved
                        </span>
                    )}
                    {selected.size === 0 && (
                        <span className="text-sm text-gray-500">
                            No sections — this person can sign in but sees nothing.
                        </span>
                    )}
                    {error && <span className="text-sm text-red-600">{error}</span>}
                </div>
            </div>
        </div>
    );
}
