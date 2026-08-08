import { Suspense } from 'react';
import { ContactTable } from '@/components/admin/whatsapp/contact-table';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Contacts — WhatsApp — Olivia Admin',
};

/**
 * Contacts list.
 *
 * The table fetches client-side so filters, pagination and bulk selection stay
 * interactive without a round trip through the server component tree. The
 * Suspense boundary is required: ContactTable reads useSearchParams().
 */
export default function WhatsAppContactsPage() {
    return (
        <Suspense fallback={<TableSkeleton />}>
            <ContactTable />
        </Suspense>
    );
}

function TableSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-8 w-2/3" />
            <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
                {Array.from({ length: 8 }).map((_, index) => (
                    <Skeleton key={index} className="h-8 w-full" />
                ))}
            </div>
        </div>
    );
}
