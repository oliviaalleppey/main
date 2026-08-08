'use client';

import { useEffect, useState } from 'react';
import { Clock, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Live countdown on Meta's 24-hour customer service window.
 *
 * This ticks rather than rendering a fixed string because an operator may sit on
 * a thread for a long time, and the moment the window closes the composer has to
 * stop offering free-form text. The server re-checks on send regardless — this is
 * the thing that stops someone typing a paragraph they were never allowed to
 * send, not the thing that enforces the rule.
 */
export function formatRemaining(ms: number): string {
    if (ms <= 0) return 'closed';

    const totalMinutes = Math.floor(ms / 60_000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) return `${hours}h ${minutes}m left`;
    if (minutes > 0) return `${minutes}m left`;
    return `${Math.floor(ms / 1000)}s left`;
}

export function WindowCountdown({
    expiresAt,
    onExpire,
    className,
}: {
    expiresAt: string | null;
    onExpire?: () => void;
    className?: string;
}) {
    const [now, setNow] = useState(() => Date.now());

    const expiry = expiresAt ? new Date(expiresAt).getTime() : 0;
    const remaining = expiry - now;
    const isOpen = remaining > 0;

    useEffect(() => {
        if (!expiresAt) return;
        // A minute is too coarse in the last moments and a second is wasteful for
        // most of the day, so the tick tightens as the deadline approaches.
        const interval = remaining > 120_000 ? 30_000 : 1_000;
        const timer = setInterval(() => setNow(Date.now()), interval);
        return () => clearInterval(timer);
    }, [expiresAt, remaining]);

    useEffect(() => {
        if (expiresAt && !isOpen) onExpire?.();
    }, [expiresAt, isOpen, onExpire]);

    if (!expiresAt) {
        return (
            <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium text-gray-500', className)}>
                <Lock className="h-3.5 w-3.5" />
                No reply window — the guest has not messaged us
            </span>
        );
    }

    if (!isOpen) {
        return (
            <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium text-gray-600', className)}>
                <Lock className="h-3.5 w-3.5" />
                Reply window closed — templates only
            </span>
        );
    }

    // Under an hour is the point at which an operator should stop drafting and send.
    const urgent = remaining < 3_600_000;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 text-xs font-medium',
                urgent ? 'text-amber-700' : 'text-emerald-700',
                className,
            )}
        >
            <Clock className="h-3.5 w-3.5" />
            Reply window {formatRemaining(remaining)}
        </span>
    );
}
