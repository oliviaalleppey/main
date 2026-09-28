import { ShieldAlert } from 'lucide-react';
import { getAdminAccess, landingPathFor } from '@/lib/admin/guard';
import { redirect } from 'next/navigation';

export const metadata = {
    title: 'No sections assigned | Admin',
};

/**
 * Where a staff account with no grants lands.
 *
 * It exists so that "signed in, but nothing assigned yet" is a page saying so,
 * rather than a redirect loop or a blank dashboard the person reads as broken.
 * Anyone who does hold something is moved along to it immediately, so this page
 * cannot become a dead end after the owner grants them a section.
 */
export default async function NoAccessPage() {
    const access = await getAdminAccess();
    if (!access) redirect('/signin');

    const landing = landingPathFor(access);
    if (landing !== '/admin/no-access') redirect(landing);

    return (
        <div className="mx-auto max-w-lg py-16 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
                <ShieldAlert className="h-6 w-6 text-amber-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">No sections assigned yet</h1>
            <p className="mt-2 text-gray-600">
                Your account is set up, but the hotel administrator has not given it access
                to any part of the admin panel. Ask them to assign the sections you need,
                then reload this page.
            </p>
            <p className="mt-6 text-sm text-gray-400">Signed in as {access.email}</p>
        </div>
    );
}
