'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
    AlertTriangle, Check, CheckCheck, ChevronDown, Loader2, Lock, MessageSquareText,
    FileText, Paperclip, Send, User,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ConsentBadge, type ConsentStatus } from './consent-badge';
import { WindowCountdown } from './window-countdown';
import { cn } from '@/lib/utils';

type ThreadMessage = {
    id: string;
    direction: 'inbound' | 'outbound';
    type: string;
    body: string | null;
    status: string | null;
    errorDetail: string | null;
    mediaUrl: string | null;
    mediaMimeType: string | null;
    createdAt: string | null;
};

type ThreadDetail = {
    id: string;
    status: string;
    unreadCount: number | null;
    windowExpiresAt: string | null;
    internalNotes: string | null;
    labels: string[] | null;
    contact: {
        id: string;
        name: string | null;
        phone: string;
        consentStatus: ConsentStatus;
        email: string | null;
    };
    window: { open: boolean; expiresAt: string | null; msRemaining: number };
    messages: ThreadMessage[];
};

type CannedReply = { id: string; title: string; body: string; category: string | null };
type SendableTemplate = { id: string; name: string; language: string; category: string; bodyText: string | null };

function prettyPhone(e164: string): string {
    const match = /^\+91(\d{5})(\d{5})$/.exec(e164);
    return match ? `+91 ${match[1]} ${match[2]}` : e164;
}

function formatTime(value: string | null): string {
    if (!value) return '';
    return new Date(value).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
}

/** Delivery ticks, matching what the guest's own client shows. */
function StatusTicks({ status }: { status: string | null }) {
    if (status === 'failed') {
        return <AlertTriangle className="h-3.5 w-3.5 text-red-500" aria-label="Failed" />;
    }
    if (status === 'read') {
        return <CheckCheck className="h-3.5 w-3.5 text-sky-500" aria-label="Read" />;
    }
    if (status === 'delivered') {
        return <CheckCheck className="h-3.5 w-3.5 text-gray-400" aria-label="Delivered" />;
    }
    return <Check className="h-3.5 w-3.5 text-gray-400" aria-label="Sent" />;
}

export function InboxThread({ threadId, onChanged }: { threadId: string; onChanged: () => void }) {
    const [thread, setThread] = useState<ThreadDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [canned, setCanned] = useState<CannedReply[]>([]);
    const [templates, setTemplates] = useState<SendableTemplate[]>([]);
    const [showCanned, setShowCanned] = useState(false);
    const [templateId, setTemplateId] = useState('');
    const [notes, setNotes] = useState('');

    const transcriptRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const load = useCallback(async () => {
        try {
            const response = await fetch(`/api/admin/whatsapp/inbox/${threadId}`);
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error ?? 'Could not load the conversation');

            setThread(payload.thread);
            setNotes(payload.thread.internalNotes ?? '');
            setError(null);

            // Opening a thread marks it read server-side. The route reports whether
            // it actually cleared anything, so the list drops the badge now rather
            // than carrying a stale count until its next poll.
            if (payload.markedRead) onChanged();
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'Could not load the conversation');
        } finally {
            setLoading(false);
        }
    }, [threadId, onChanged]);

    useEffect(() => {
        setLoading(true);
        setDraft('');
        load();
    }, [load]);

    // Poll so a guest's reply appears while the operator is looking at the thread.
    useEffect(() => {
        const timer = setInterval(load, 15_000);
        return () => clearInterval(timer);
    }, [load]);

    useEffect(() => {
        fetch('/api/admin/whatsapp/canned-replies')
            .then((response) => response.json())
            .then((payload) => setCanned(payload.replies ?? []))
            .catch(() => setCanned([]));
    }, []);

    // Templates are only needed once the window has closed, but they are fetched
    // up front so the composer can switch over without a visible stall.
    useEffect(() => {
        fetch('/api/admin/whatsapp/templates?status=approved')
            .then((response) => response.json())
            .then((payload) => setTemplates(payload.templates ?? []))
            .catch(() => setTemplates([]));
    }, []);

    useEffect(() => {
        transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight });
    }, [thread?.messages.length]);

    const windowOpen = thread?.window.open ?? false;

    const send = useCallback(async () => {
        if (!thread) return;

        const payload = windowOpen
            ? { kind: 'text' as const, body: draft.trim() }
            : { kind: 'template' as const, templateId };

        if (windowOpen && !payload.body) return;
        if (!windowOpen && !templateId) {
            toast.error('Choose a template — the free-form window has closed');
            return;
        }

        setSending(true);
        try {
            const response = await fetch(`/api/admin/whatsapp/inbox/${threadId}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();

            if (!response.ok) {
                // 409 means the window shut between render and send. Reloading swaps
                // the composer to templates and keeps the typed text recoverable.
                if (result.code === 'window_closed') {
                    toast.error('The 24-hour window closed. Send an approved template instead.');
                    await load();
                    return;
                }
                throw new Error(result.error ?? 'Could not send');
            }

            for (const warning of result.warnings ?? []) toast.warning(warning);

            setDraft('');
            setTemplateId('');
            await load();
            onChanged();
        } catch (caught) {
            toast.error(caught instanceof Error ? caught.message : 'Could not send');
        } finally {
            setSending(false);
        }
    }, [draft, load, onChanged, templateId, thread, threadId, windowOpen]);

    /**
     * Upload and send an image or PDF.
     *
     * The typed draft travels with it as the caption, because that is what an
     * operator attaching a menu almost always means — and it saves sending two
     * messages where one will do.
     */
    const sendFile = useCallback(async (file: File) => {
        setSending(true);
        try {
            const form = new FormData();
            form.append('file', file);
            if (draft.trim()) form.append('caption', draft.trim());

            const response = await fetch(`/api/admin/whatsapp/inbox/${threadId}/media`, {
                method: 'POST',
                body: form,
            });
            const result = await response.json();

            if (!response.ok) {
                if (result.code === 'window_closed') {
                    toast.error('The 24-hour window closed, so a file can no longer be sent.');
                    await load();
                    return;
                }
                throw new Error(result.error ?? 'Could not send the file');
            }

            for (const warning of result.warnings ?? []) toast.warning(warning);

            setDraft('');
            await load();
            onChanged();
        } catch (caught) {
            toast.error(caught instanceof Error ? caught.message : 'Could not send the file');
        } finally {
            setSending(false);
        }
    }, [draft, load, onChanged, threadId]);

    const patch = useCallback(
        async (body: Record<string, unknown>, successMessage?: string) => {
            try {
                const response = await fetch(`/api/admin/whatsapp/inbox/${threadId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error ?? 'Could not update');

                if (successMessage) toast.success(successMessage);
                await load();
                onChanged();
            } catch (caught) {
                toast.error(caught instanceof Error ? caught.message : 'Could not update');
            }
        },
        [load, onChanged, threadId],
    );

    const selectedTemplate = useMemo(
        () => templates.find((template) => template.id === templateId),
        [templateId, templates],
    );

    if (loading && !thread) {
        return (
            <div className="space-y-3 p-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
        );
    }

    if (error || !thread) {
        return (
            <div className="p-6">
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                        <p className="font-medium text-amber-900">Could not open this conversation</p>
                        <p className="mt-1 text-sm text-amber-800">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    const optedOut = thread.contact.consentStatus === 'opted_out';

    return (
        <div className="flex h-full flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/admin/whatsapp/contacts/${thread.contact.id}`}
                            className="truncate text-sm font-semibold text-gray-900 hover:underline"
                        >
                            {thread.contact.name || prettyPhone(thread.contact.phone)}
                        </Link>
                        <ConsentBadge status={thread.contact.consentStatus} />
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">{prettyPhone(thread.contact.phone)}</p>
                </div>

                <div className="flex items-center gap-2">
                    <WindowCountdown expiresAt={thread.windowExpiresAt} onExpire={load} />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            patch(
                                { status: thread.status === 'resolved' ? 'open' : 'resolved' },
                                thread.status === 'resolved' ? 'Reopened' : 'Marked resolved',
                            )
                        }
                    >
                        {thread.status === 'resolved' ? 'Reopen' : 'Resolve'}
                    </Button>
                </div>
            </div>

            {optedOut && (
                <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-3 py-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <p className="text-xs text-amber-900">
                        This guest opted out of marketing. Answering their question is fine — promoting
                        anything is not.
                    </p>
                </div>
            )}

            <div ref={transcriptRef} className="min-h-[20rem] flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
                {!thread.messages.length ? (
                    <p className="py-8 text-center text-xs text-gray-500">No messages yet.</p>
                ) : (
                    thread.messages.map((message) => {
                        const outbound = message.direction === 'outbound';
                        return (
                            <div key={message.id} className={cn('flex', outbound ? 'justify-end' : 'justify-start')}>
                                <div
                                    className={cn(
                                        'max-w-[75%] rounded-lg px-3 py-2 shadow-sm',
                                        outbound ? 'bg-emerald-600 text-white' : 'bg-white text-gray-900',
                                        message.status === 'failed' && 'bg-red-50 text-red-900 ring-1 ring-red-200',
                                    )}
                                >
                                    {message.type === 'template' && (
                                        <p
                                            className={cn(
                                                'mb-1 text-[10px] font-semibold uppercase tracking-wide',
                                                outbound && message.status !== 'failed'
                                                    ? 'text-emerald-100'
                                                    : 'text-gray-400',
                                            )}
                                        >
                                            Template
                                        </p>
                                    )}
                                    {message.type === 'image' && message.mediaUrl && (
                                        // eslint-disable-next-line @next/next/no-img-element -- blob host is not in next.config images
                                        <img
                                            src={message.mediaUrl}
                                            alt={message.body || 'Photo'}
                                            className="mb-1 max-h-64 rounded-md object-cover"
                                        />
                                    )}
                                    {message.type === 'document' && message.mediaUrl && (
                                        <a
                                            href={message.mediaUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={cn(
                                                'mb-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm underline',
                                                outbound && message.status !== 'failed'
                                                    ? 'bg-emerald-700/40'
                                                    : 'bg-gray-100',
                                            )}
                                        >
                                            <FileText className="h-4 w-4 shrink-0" />
                                            <span className="truncate">{message.body || 'Document'}</span>
                                        </a>
                                    )}
                                    {/* A media message may have no caption, and an empty
                                        paragraph would leave a stray gap in the bubble. */}
                                    {message.body && !(message.type === 'document' && message.mediaUrl) && (
                                        <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
                                    )}

                                    <div
                                        className={cn(
                                            'mt-1 flex items-center justify-end gap-1 text-[10px]',
                                            outbound && message.status !== 'failed'
                                                ? 'text-emerald-100'
                                                : 'text-gray-400',
                                        )}
                                    >
                                        <span>{formatTime(message.createdAt)}</span>
                                        {outbound && <StatusTicks status={message.status} />}
                                    </div>

                                    {message.errorDetail && (
                                        <p className="mt-1 text-[10px] text-red-700">{message.errorDetail}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="border-t border-gray-200 p-3">
                {windowOpen ? (
                    <div className="space-y-2">
                        {canned.length > 0 && (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowCanned((open) => !open)}
                                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                                >
                                    <MessageSquareText className="h-3.5 w-3.5" />
                                    Canned replies
                                    <ChevronDown className="h-3 w-3" />
                                </button>

                                {showCanned && (
                                    <div className="absolute bottom-full z-10 mb-1 max-h-64 w-80 overflow-y-auto rounded-md border border-gray-200 bg-white p-1 shadow-lg">
                                        {canned.map((reply) => (
                                            <button
                                                key={reply.id}
                                                type="button"
                                                onClick={() => {
                                                    setDraft(reply.body);
                                                    setShowCanned(false);
                                                }}
                                                className="block w-full rounded px-2 py-1.5 text-left hover:bg-gray-100"
                                            >
                                                <span className="block text-xs font-medium text-gray-900">
                                                    {reply.title}
                                                </span>
                                                <span className="block truncate text-[11px] text-gray-500">
                                                    {reply.body}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Textarea
                                value={draft}
                                onChange={(event) => setDraft(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                                        event.preventDefault();
                                        send();
                                    }
                                }}
                                placeholder="Type a reply…  (⌘↵ to send)"
                                rows={2}
                                maxLength={4096}
                                className="resize-none"
                            />
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,application/pdf"
                                className="hidden"
                                onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    // Reset first, so picking the same file twice
                                    // in a row still fires onChange.
                                    event.target.value = '';
                                    if (file) sendFile(file);
                                }}
                            />
                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={sending}
                                className="self-end"
                                title="Send a photo or PDF (JPEG, PNG, PDF)"
                                aria-label="Attach a photo or PDF"
                            >
                                <Paperclip className="h-4 w-4" />
                            </Button>
                            <Button onClick={send} disabled={sending || !draft.trim()} className="self-end">
                                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex items-start gap-2 rounded-md bg-gray-50 p-2">
                            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                            <p className="text-xs text-gray-600">
                                The 24-hour reply window has closed, so Meta will only accept an approved
                                template. The guest replying reopens it for another 24 hours.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <select
                                value={templateId}
                                onChange={(event) => setTemplateId(event.target.value)}
                                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                            >
                                <option value="">Choose an approved template…</option>
                                {templates.map((template) => (
                                    <option key={template.id} value={template.id}>
                                        {template.name} ({template.category.toLowerCase()})
                                    </option>
                                ))}
                            </select>
                            <Button onClick={send} disabled={sending || !templateId}>
                                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </div>

                        {selectedTemplate?.bodyText && (
                            <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-600">
                                {selectedTemplate.bodyText}
                            </p>
                        )}

                        {!templates.length && (
                            <p className="text-xs text-amber-700">
                                No approved templates yet. Submit one under{' '}
                                <Link href="/admin/whatsapp/templates" className="underline">
                                    Templates
                                </Link>
                                .
                            </p>
                        )}
                    </div>
                )}
            </div>

            <div className="border-t border-gray-200 p-3">
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                    <User className="h-3.5 w-3.5" />
                    Internal notes — never sent to the guest
                </label>
                <Textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    onBlur={() => {
                        if (notes !== (thread.internalNotes ?? '')) patch({ internalNotes: notes }, 'Notes saved');
                    }}
                    rows={2}
                    className="mt-1.5 resize-none text-sm"
                    placeholder="Context for whoever picks this up next…"
                />
            </div>
        </div>
    );
}
