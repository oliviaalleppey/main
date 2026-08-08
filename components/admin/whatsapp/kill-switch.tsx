'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

/**
 * The global sending kill switch.
 *
 * Turning sending ON is the consequential direction, so it asks for confirmation.
 * Turning it OFF is always immediate — an operator stopping a bad campaign must
 * never be slowed down by a dialog.
 */
export function KillSwitch({ enabled: initialEnabled }: { enabled: boolean }) {
    const [enabled, setEnabled] = useState(initialEnabled);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    async function apply(next: boolean) {
        const previous = enabled;
        setEnabled(next); // optimistic

        try {
            const response = await fetch('/api/admin/whatsapp/kill-switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: next }),
            });

            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(body.error || `Request failed (${response.status})`);
            }

            toast.success(next ? 'WhatsApp sending enabled' : 'WhatsApp sending stopped');
            startTransition(() => router.refresh());
        } catch (error) {
            setEnabled(previous); // roll back so the UI never lies about the real state
            toast.error(error instanceof Error ? error.message : 'Could not update the setting');
        }
    }

    function handleChange(next: boolean) {
        if (next) {
            const ok = window.confirm(
                'Enable WhatsApp sending?\n\n' +
                'Queued messages will start going out on the next dispatch run, subject to ' +
                'test mode, the daily cap and quiet hours.',
            );
            if (!ok) return;
        }
        void apply(next);
    }

    return (
        <label className="flex cursor-pointer items-center gap-3">
            <Switch checked={enabled} onCheckedChange={handleChange} disabled={isPending} />
            <span className="text-sm text-gray-600">
                {enabled ? 'Sending is on' : 'Sending is off'}
            </span>
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
        </label>
    );
}
