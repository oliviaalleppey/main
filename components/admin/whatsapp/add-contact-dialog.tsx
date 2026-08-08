'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ConsentDeclarationFields, type Declaration, emptyDeclaration, declarationIsComplete } from './consent-declaration';

/**
 * Add one contact by hand — the front desk taking consent in person.
 *
 * The consent declaration is the same component the import wizard uses, on
 * purpose: there must be exactly one way to assert an opt-in in this system, so
 * a single-contact add cannot become the loophole that skips the evidence.
 */
export function AddContactDialog({
    open,
    onOpenChange,
    onCreated,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated: () => void;
}) {
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [tags, setTags] = useState('');
    const [notes, setNotes] = useState('');
    const [declaration, setDeclaration] = useState<Declaration>(emptyDeclaration);
    const [provenanceNote, setProvenanceNote] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setPhone('');
            setName('');
            setEmail('');
            setTags('');
            setNotes('');
            setDeclaration(emptyDeclaration);
            setProvenanceNote('');
        }
    }, [open]);

    const canSubmit =
        phone.trim().length > 0 &&
        provenanceNote.trim().length > 0 &&
        declarationIsComplete(declaration);

    async function submit() {
        setSaving(true);
        try {
            const response = await fetch('/api/admin/whatsapp/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: phone.trim(),
                    name: name.trim() || undefined,
                    email: email.trim() || undefined,
                    tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
                    notes: notes.trim() || undefined,
                    consent: {
                        hasExplicitOptIn: declaration.hasExplicitOptIn,
                        source: declaration.source || undefined,
                        collectedAt: declaration.collectedAt || undefined,
                    },
                    provenanceNote: provenanceNote.trim(),
                }),
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);

            toast.success(
                declaration.hasExplicitOptIn
                    ? 'Contact added as opted in'
                    : 'Contact added as pending — re-permission template only',
            );
            onCreated();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not add the contact');
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Add a contact</DialogTitle>
                    <DialogDescription>
                        The number is normalised to E.164 on save. Indian numbers can be entered with or without
                        the country code.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="add-phone">WhatsApp number (required)</Label>
                            <Input
                                id="add-phone"
                                value={phone}
                                onChange={(event) => setPhone(event.target.value)}
                                placeholder="98471 23456"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="add-name">Name</Label>
                            <Input id="add-name" value={name} onChange={(event) => setName(event.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="add-email">Email</Label>
                            <Input
                                id="add-email"
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="add-tags">Tags</Label>
                            <Input
                                id="add-tags"
                                value={tags}
                                onChange={(event) => setTags(event.target.value)}
                                placeholder="comma, separated"
                            />
                        </div>
                    </div>

                    <ConsentDeclarationFields value={declaration} onChange={setDeclaration} idPrefix="add" />

                    <div className="space-y-1.5">
                        <Label htmlFor="add-provenance">Where did this contact come from? (required)</Label>
                        <Textarea
                            id="add-provenance"
                            value={provenanceNote}
                            onChange={(event) => setProvenanceNote(event.target.value)}
                            rows={2}
                            placeholder="e.g. Signed the front-desk WhatsApp consent card at check-in, 12 Aug 2026"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="add-notes">Internal notes</Label>
                        <Textarea
                            id="add-notes"
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            rows={2}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={() => void submit()} disabled={!canSubmit || saving}>
                        {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                        Add contact
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
