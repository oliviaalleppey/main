'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, Inbox as InboxIcon, Loader2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { WindowCountdown } from './window-countdown';
import { type ConsentStatus } from './consent-badge';
import { InboxThread } from './inbox-thread';
import { cn } from '@/lib/utils';

export type ThreadSummary = {
    id: string;
    status: string;
    unreadCount: number | null;
    windowExpiresAt: string | null;
    lastMessageAt: string | null;
    labels: string[] | null;
    contact: { id: string; name: string | null; phone: string; consentStatus: ConsentStatus };
    window: { open: boolean; expiresAt: string | null; msRemaining: number };
    lastMessage: { body: string | null; direction: string; createdAt: string | null; type: string } | null;
};

type ListResponse = { total: number; threads: ThreadSummary[]; unreadTotal: number };

type StatusFilter = 'open' | 'resolved' | 'all';

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
    { value: 'open', label: 'Open' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'all', label: 'All' },
];

function prettyPhone(e164: string): string {
    const match = /^\+91(\d{5})(\d{5})$/.exec(e164);
    return match ? `+91 ${match[1]} ${match[2]}` : e164;
}

function relativeTime(value: string | null): string {
    if (!value) return '';
    const ms = Date.now() - new Date(value).getTime();
    const minutes = Math.floor(ms / 60_000);
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

/**
 * The inbox: conversation list on the left, thread on the right.
 *
 * The selected thread lives in the URL (`?thread=`) rather than in component
 * state so an operator can send a colleague a link to the exact conversation,
 * which is the single most common thing anyone wants to do from a shared inbox.
 */
export function InboxView() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const selectedId = searchParams.get('thread');
    const status = (searchParams.get('status') as StatusFilter) || 'open';
    const unreadOnly = searchParams.get('unread') === '1';

    const [data, setData] = useState<ListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState(searchParams.get('q') ?? '');

    const load = useCallback(async () => {
        try {
            const params = new URLSearchParams({ status });
            if (unreadOnly) params.set('unread', '1');
            if (search.trim()) params.set('q', search.trim());

            const response = await fetch(`/api/admin/whatsapp/inbox?${params}`);
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error ?? 'Could not load conversations');

            setData(payload);
            setError(null);
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'Could not load conversations');
        } finally {
            setLoading(false);
        }
    }, [status, unreadOnly, search]);

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(load, search ? 300 : 0);
        return () => clearTimeout(timer);
    }, [load, search]);

    // Inbound messages arrive by webhook, so the list is only ever as fresh as the
    // last poll. 20s is frequent enough to feel live without hammering the DB.
    useEffect(() => {
        const timer = setInterval(load, 20_000);
        return () => clearInterval(timer);
    }, [load]);

    const setParam = useCallback(
        (key: string, value: string | null) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value === null) params.delete(key);
            else params.set(key, value);
            router.replace(`${pathname}?${params}`, { scroll: false });
        },
        [pathname, router, searchParams],
    );

    if (error) {
        return (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                        <p className="font-medium text-amber-900">Could not load the inbox</p>
                        <p className="mt-1 text-sm text-amber-800">{error}</p>
                        <Button variant="outline" size="sm" className="mt-3" onClick={load}>
                            Try again
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid gap-4 lg:grid-cols-[minmax(280px,360px)_1fr]">
            <div className="flex flex-col rounded-lg border border-gray-200 bg-white">
                <div className="space-y-3 border-b border-gray-200 p-3">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search name or number"
                            className="pl-8"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                aria-label="Clear search"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <div className="flex gap-1">
                            {STATUS_TABS.map((tab) => (
                                <button
                                    key={tab.value}
                                    type="button"
                                    onClick={() => setParam('status', tab.value)}
                                    className={cn(
                                        'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                                        status === tab.value
                                            ? 'bg-gray-900 text-white'
                                            : 'text-gray-600 hover:bg-gray-100',
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => setParam('unread', unreadOnly ? null : '1')}
                            className={cn(
                                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                                unreadOnly ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100',
                            )}
                        >
                            Unread{data?.unreadTotal ? ` (${data.unreadTotal})` : ''}
                        </button>
                    </div>
                </div>

                <div className="max-h-[calc(100vh-20rem)] min-h-[24rem] overflow-y-auto">
                    {loading && !data ? (
                        <div className="space-y-3 p-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <Skeleton key={index} className="h-14 w-full" />
                            ))}
                        </div>
                    ) : !data?.threads.length ? (
                        <div className="p-8 text-center">
                            <InboxIcon className="mx-auto h-8 w-8 text-gray-300" />
                            <p className="mt-3 text-sm font-medium text-gray-900">No conversations</p>
                            <p className="mt-1 text-xs text-gray-500">
                                Threads appear here when a guest messages the hotel&apos;s WhatsApp number.
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {data.threads.map((thread) => {
                                const unread = (thread.unreadCount ?? 0) > 0;
                                return (
                                    <li key={thread.id}>
                                        <button
                                            type="button"
                                            onClick={() => setParam('thread', thread.id)}
                                            className={cn(
                                                'w-full px-3 py-3 text-left transition-colors hover:bg-gray-50',
                                                selectedId === thread.id && 'bg-gray-100 hover:bg-gray-100',
                                            )}
                                        >
                                            <div className="flex items-baseline justify-between gap-2">
                                                <span
                                                    className={cn(
                                                        'truncate text-sm',
                                                        unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700',
                                                    )}
                                                >
                                                    {thread.contact.name || prettyPhone(thread.contact.phone)}
                                                </span>
                                                <span className="shrink-0 text-xs text-gray-400">
                                                    {relativeTime(thread.lastMessageAt)}
                                                </span>
                                            </div>

                                            <div className="mt-1 flex items-center gap-2">
                                                <p
                                                    className={cn(
                                                        'flex-1 truncate text-xs',
                                                        unread ? 'text-gray-700' : 'text-gray-500',
                                                    )}
                                                >
                                                    {thread.lastMessage?.direction === 'outbound' && (
                                                        <span className="text-gray-400">You: </span>
                                                    )}
                                                    {thread.lastMessage?.body || 'No messages yet'}
                                                </p>
                                                {unread && (
                                                    <span className="shrink-0 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                                        {thread.unreadCount}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-1.5">
                                                <WindowCountdown expiresAt={thread.windowExpiresAt} />
                                            </div>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {loading && data && (
                    <div className="flex items-center justify-center gap-2 border-t border-gray-100 py-2 text-xs text-gray-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Refreshing
                    </div>
                )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white">
                {selectedId ? (
                    <InboxThread threadId={selectedId} onChanged={load} />
                ) : (
                    <div className="flex h-full min-h-[24rem] flex-col items-center justify-center p-8 text-center">
                        <InboxIcon className="h-10 w-10 text-gray-200" />
                        <p className="mt-3 text-sm font-medium text-gray-900">Select a conversation</p>
                        <p className="mt-1 max-w-sm text-xs text-gray-500">
                            Replies are free-form for 24 hours after a guest writes to us. After that
                            only an approved template may be sent.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
