'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type WatchdogResponse = {
    success?: boolean;
    processed?: number;
    results?: Array<{ id: string; status: string }>;
    error?: string;
};

export function RunWatchdogButton() {
    const router = useRouter();
    const [isRunning, setIsRunning] = useState(false);
    const [message, setMessage] = useState<string>('');

    const runWatchdog = async () => {
        setIsRunning(true);
        setMessage('');

        try {
            const response = await fetch('/api/cron/booking-watchdog');
            const data = await response.json() as WatchdogResponse;

            if (!response.ok) {
                setMessage(data.error || 'Failed to run retry cycle');
                return;
            }

            const processed = data.processed || 0;
            setMessage(`Retry cycle completed. Processed ${processed} booking${processed === 1 ? '' : 's'}.`);
            router.refresh();
        } catch {
            setMessage('Network error while running retry cycle.');
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="rounded-xl border bg-white p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-sm font-semibold text-gray-900">Manual Retry Cycle</p>
                    <p className="text-xs text-gray-600">Run confirmation retries immediately without waiting for cron.</p>
                </div>
                <button
                    onClick={runWatchdog}
                    disabled={isRunning}
                    className="rounded-md bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                    {isRunning ? 'Running...' : 'Run Retry Cycle Now'}
                </button>
            </div>
            {message && <p className="mt-3 text-xs text-gray-700">{message}</p>}
        </div>
    );
}
