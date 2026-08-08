'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

/**
 * Submit-to-Meta and delete, on the template detail page.
 *
 * Submission is confirmed explicitly because it is a one-way door: once Meta
 * holds the template, the wording is frozen and a mistake means drafting a new
 * version rather than editing this one.
 */
export function TemplateActions({
    templateId,
    templateName,
    status,
    provider,
}: {
    templateId: string;
    templateName: string;
    status: string;
    provider: string;
}) {
    const router = useRouter();
    const [confirming, setConfirming] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const submittable = status === 'internal_review' || status === 'draft';

    async function submit() {
        setSubmitting(true);
        try {
            const response = await fetch(`/api/admin/whatsapp/templates/${templateId}/submit`, { method: 'POST' });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.error || `Submission failed (${response.status})`);

            toast.success(
                body.remoteStatus?.toUpperCase() === 'APPROVED'
                    ? 'Submitted and approved'
                    : 'Submitted to Meta — approval usually takes minutes to a few hours',
            );
            setConfirming(false);
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    }

    async function remove() {
        if (!window.confirm(`Delete the template "${templateName}"? This also removes it from Meta.`)) return;
        setDeleting(true);
        try {
            const response = await fetch(`/api/admin/whatsapp/templates/${templateId}`, { method: 'DELETE' });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.error || `Delete failed (${response.status})`);
            toast.success('Template deleted');
            router.push('/admin/whatsapp/templates');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not delete');
            setDeleting(false);
        }
    }

    return (
        <>
            <div className="flex flex-wrap gap-2">
                {submittable && (
                    <Button size="sm" onClick={() => setConfirming(true)}>
                        <Send className="mr-1.5 h-4 w-4" /> Approve and submit to Meta
                    </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => void remove()} disabled={deleting}>
                    {deleting ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                        <Trash2 className="mr-1.5 h-4 w-4 text-red-600" />
                    )}
                    Delete
                </Button>
            </div>

            <Dialog open={confirming} onOpenChange={setConfirming}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Submit to Meta?</DialogTitle>
                        <DialogDescription>
                            This sends <span className="font-mono">{templateName}</span> for Meta&apos;s review.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 text-sm text-gray-600">
                        <p>
                            After submission the wording is frozen — a change means drafting a new template, not
                            editing this one.
                        </p>
                        <p className="rounded-md bg-amber-50 p-3 text-xs text-amber-900">
                            Rejected templates count against the account&apos;s reputation, so submit only what you
                            would be happy for a guest to receive verbatim.
                        </p>
                        {provider === 'mock' && (
                            <p className="rounded-md bg-gray-100 p-3 text-xs text-gray-600">
                                Simulator mode — this will not reach Meta. The template gets a fake id and a
                                simulated approval delay.
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirming(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button onClick={() => void submit()} disabled={submitting}>
                            {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                            Submit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
