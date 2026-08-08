import { Suspense } from 'react';
import { InboxView } from '@/components/admin/whatsapp/inbox-view';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Inbox — WhatsApp — Olivia Admin',
};

/**
 * Two-way inbox.
 *
 * Client-fetched like the rest of the module: the thread list polls for inbound
 * messages, which arrive out of band via the Meta webhook rather than through
 * anything this page did.
 */
export default function WhatsAppInboxPage() {
    return (
        <Suspense fallback={<InboxSkeleton />}>
            <InboxView />
        </Suspense>
    );
}

function InboxSkeleton() {
    return (
        <div className="grid gap-4 lg:grid-cols-[minmax(280px,360px)_1fr]">
            <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-14 w-full" />
                ))}
            </div>
            <Skeleton className="h-96 w-full rounded-lg" />
        </div>
    );
}
