'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Pencil, ShieldAlert, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { CONSENT_META, type ConsentStatus } from './consent-badge';
import { cn } from '@/lib/utils';

const STATUS_ORDER: ConsentStatus[] = ['opted_in', 'pending', 'opted_out', 'suppressed'];

export function ContactActions({
    contactId,
    phone,
    consentStatus,
    name,
    email,
    tags,
    notes,
}: {
    contactId: string;
    phone: string;
    consentStatus: ConsentStatus;
    name: string | null;
    email: string | null;
    tags: string[];
    notes: string | null;
}) {
    const [dialog, setDialog] = useState<'consent' | 'edit' | 'erase' | null>(null);

    return (
        <>
            <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setDialog('edit')}>
                    <Pencil className="mr-1.5 h-4 w-4" /> Edit details
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDialog('consent')}>
                    <ShieldAlert className="mr-1.5 h-4 w-4" /> Change consent
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDialog('erase')}>
                    <Trash2 className="mr-1.5 h-4 w-4 text-red-600" /> Erase (DPDP)
                </Button>
            </div>

            <ConsentDialog
                open={dialog === 'consent'}
                onClose={() => setDialog(null)}
                contactId={contactId}
                current={consentStatus}
            />
            <EditDialog
                open={dialog === 'edit'}
                onClose={() => setDialog(null)}
                contactId={contactId}
                name={name}
                email={email}
                tags={tags}
                notes={notes}
            />
            <EraseDialog
                open={dialog === 'erase'}
                onClose={() => setDialog(null)}
                contactId={contactId}
                phone={phone}
            />
        </>
    );
}

function ConsentDialog({
    open,
    onClose,
    contactId,
    current,
}: {
    open: boolean;
    onClose: () => void;
    contactId: string;
    current: ConsentStatus;
}) {
    const router = useRouter();
    const [status, setStatus] = useState<ConsentStatus>(current);
    const [reason, setReason] = useState('');
    const [source, setSource] = useState('');
    const [saving, setSaving] = useState(false);

    async function submit() {
        setSaving(true);
        try {
            const response = await fetch(`/api/admin/whatsapp/contacts/${contactId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    consentStatus: status,
                    consentReason: reason.trim(),
                    consentSource: source.trim() || undefined,
                }),
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);

            toast.success('Consent updated and recorded in the ledger');
            onClose();
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not change consent');
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Change consent status</DialogTitle>
                    <DialogDescription>
                        Appended to this contact&apos;s consent ledger with your name, the time and the reason. The
                        ledger is never edited or deleted.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-2">
                    {STATUS_ORDER.map((option) => (
                        <label
                            key={option}
                            className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm',
                                status === option ? 'border-gray-900 bg-gray-50' : 'border-gray-200',
                            )}
                        >
                            <input
                                type="radio"
                                name="consent-status"
                                className="mt-1"
                                checked={status === option}
                                onChange={() => setStatus(option)}
                            />
                            <span>
                                <span className="font-medium text-gray-900">
                                    {CONSENT_META[option].label}
                                    {option === current && <span className="ml-2 text-xs text-gray-400">current</span>}
                                </span>
                                <span className="block text-xs text-gray-500">{CONSENT_META[option].meaning}</span>
                            </span>
                        </label>
                    ))}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="consent-reason">Reason (required)</Label>
                    <Textarea
                        id="consent-reason"
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        rows={3}
                        placeholder="e.g. Guest asked at the front desk to stop receiving offers"
                    />
                </div>

                {status === 'opted_in' && (
                    <div className="space-y-1.5">
                        <Label htmlFor="consent-source">Where the opt-in came from</Label>
                        <Input
                            id="consent-source"
                            value={source}
                            onChange={(event) => setSource(event.target.value)}
                            placeholder="e.g. Front desk consent card"
                        />
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => void submit()}
                        disabled={saving || !reason.trim() || status === current}
                    >
                        {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                        Record change
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function EditDialog({
    open,
    onClose,
    contactId,
    name,
    email,
    tags,
    notes,
}: {
    open: boolean;
    onClose: () => void;
    contactId: string;
    name: string | null;
    email: string | null;
    tags: string[];
    notes: string | null;
}) {
    const router = useRouter();
    const [form, setForm] = useState({
        name: name ?? '',
        email: email ?? '',
        tags: tags.join(', '),
        notes: notes ?? '',
    });
    const [saving, setSaving] = useState(false);

    async function submit() {
        setSaving(true);
        try {
            const response = await fetch(`/api/admin/whatsapp/contacts/${contactId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name.trim() || null,
                    email: form.email.trim() || null,
                    tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
                    notes: form.notes.trim() || null,
                }),
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);

            toast.success('Contact updated');
            onClose();
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not save');
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit contact details</DialogTitle>
                    <DialogDescription>
                        The phone number cannot be edited — it is the contact&apos;s identity. Add the correct number
                        as a new contact instead.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="edit-name">Name</Label>
                        <Input
                            id="edit-name"
                            value={form.name}
                            onChange={(event) => setForm({ ...form, name: event.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="edit-email">Email</Label>
                        <Input
                            id="edit-email"
                            type="email"
                            value={form.email}
                            onChange={(event) => setForm({ ...form, email: event.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="edit-tags">Tags</Label>
                        <Input
                            id="edit-tags"
                            value={form.tags}
                            onChange={(event) => setForm({ ...form, tags: event.target.value })}
                            placeholder="comma, separated"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="edit-notes">Internal notes</Label>
                        <Textarea
                            id="edit-notes"
                            rows={3}
                            value={form.notes}
                            onChange={(event) => setForm({ ...form, notes: event.target.value })}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={() => void submit()} disabled={saving}>
                        {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/**
 * DPDP erasure. Typing the number is required because this is irreversible and
 * cascades to the message history — a misplaced click must not be enough.
 */
function EraseDialog({
    open,
    onClose,
    contactId,
    phone,
}: {
    open: boolean;
    onClose: () => void;
    contactId: string;
    phone: string;
}) {
    const router = useRouter();
    const [confirmation, setConfirmation] = useState('');
    const [saving, setSaving] = useState(false);

    async function submit() {
        setSaving(true);
        try {
            const response = await fetch(`/api/admin/whatsapp/contacts/${contactId}`, { method: 'DELETE' });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);

            toast.success('Contact erased and the number permanently suppressed');
            router.push('/admin/whatsapp/contacts');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not erase the contact');
            setSaving(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Erase this contact</DialogTitle>
                    <DialogDescription>
                        Deletes the contact, their message history and their consent events. The number is added to
                        the permanent do-not-contact list so a future import cannot bring them back.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-1.5">
                    <Label htmlFor="erase-confirm">Type {phone} to confirm</Label>
                    <Input
                        id="erase-confirm"
                        value={confirmation}
                        onChange={(event) => setConfirmation(event.target.value)}
                        placeholder={phone}
                    />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => void submit()}
                        disabled={saving || confirmation.trim() !== phone}
                    >
                        {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                        Erase permanently
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
