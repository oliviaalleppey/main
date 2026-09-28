import { requireAdminPage } from '@/lib/admin/guard';
import { ADMIN_SECTIONS } from '@/lib/admin/sections';
import { listStaff } from './actions';
import { AddStaffForm, StaffRow } from './StaffClient';

export const metadata = {
    title: 'Staff Access | Admin',
};

export default async function StaffPage() {
    await requireAdminPage();

    const staff = await listStaff();
    const admins = staff.filter((person) => person.role === 'admin');
    const members = staff.filter((person) => person.role === 'staff');

    return (
        <div className="max-w-5xl space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Staff Access</h1>
                <p className="mt-1 text-gray-600">
                    Give a staff member a Google account sign-in, then tick the sections they
                    may view. Anything not ticked is invisible to them — the menu entry is
                    hidden and the page itself refuses them.
                </p>
            </div>

            <section className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Add a staff member
                </h2>
                <p className="mt-1 mb-4 text-sm text-gray-600">
                    Use the Google address they will sign in with. They start with no
                    sections until you grant some below.
                </p>
                <AddStaffForm />
            </section>

            <section className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Staff ({members.length})
                </h2>

                {members.length === 0 && (
                    <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
                        No staff accounts yet. Add one above.
                    </p>
                )}

                {members.map((person) => (
                    <StaffRow
                        key={person.id}
                        person={person}
                        sections={ADMIN_SECTIONS.map((s) => ({
                            key: s.key,
                            label: s.label,
                            description: s.description,
                        }))}
                    />
                ))}
            </section>

            <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Administrators ({admins.length})
                </h2>
                <p className="text-sm text-gray-600">
                    Administrators can see and change everything, including this page. They
                    are set in the site configuration rather than here, so that a mistake on
                    this screen cannot lock the hotel out of its own admin panel.
                </p>
                <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
                    {admins.map((person) => (
                        <li key={person.id} className="flex items-center gap-3 px-4 py-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-800">
                                {(person.name ?? person.email).charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-gray-900">
                                    {person.name ?? person.email}
                                </p>
                                <p className="truncate text-xs text-gray-500">{person.email}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
