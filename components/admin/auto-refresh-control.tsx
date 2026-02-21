'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type AutoRefreshControlProps = {
    intervalSeconds?: number;
};

export function AutoRefreshControl({ intervalSeconds = 30 }: AutoRefreshControlProps) {
    const router = useRouter();
    const [enabled, setEnabled] = useState(true);
    const [countdown, setCountdown] = useState(intervalSeconds);

    useEffect(() => {
        if (!enabled) return;

        const timer = window.setInterval(() => {
            setCountdown((previous) => {
                if (previous <= 1) {
                    router.refresh();
                    return intervalSeconds;
                }
                return previous - 1;
            });
        }, 1000);

        return () => window.clearInterval(timer);
    }, [enabled, intervalSeconds, router]);

    const handleToggle = () => {
        setEnabled((previous) => !previous);
        setCountdown(intervalSeconds);
    };

    const refreshNow = () => {
        router.refresh();
        setCountdown(intervalSeconds);
    };

    return (
        <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 md:flex-row md:items-center md:justify-between">
            <div>
                <p className="text-sm font-semibold text-gray-900">Live Queue Refresh</p>
                <p className="text-xs text-gray-600">
                    {enabled
                        ? `Auto-refreshing every ${intervalSeconds}s. Next refresh in ${countdown}s.`
                        : 'Auto-refresh is paused.'}
                </p>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={refreshNow}
                    className="rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                >
                    Refresh Now
                </button>
                <button
                    onClick={handleToggle}
                    className={`rounded-md px-3 py-2 text-xs font-semibold text-white ${
                        enabled ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-700 hover:bg-emerald-600'
                    }`}
                >
                    {enabled ? 'Pause Auto-Refresh' : 'Resume Auto-Refresh'}
                </button>
            </div>
        </div>
    );
}
