'use client';

import { useEffect, useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import { toast } from 'sonner';
import { PartyPopper, Loader2, Save, ImagePlus, RotateCcw, Music } from 'lucide-react';
import { getPartyPopup, updatePartyPopup } from '@/lib/db/actions/settings-actions';
import {
    DEFAULT_PARTY_BACKGROUND,
    DEFAULT_PARTY_MASK,
    DEFAULT_PARTY_PAGE_IMAGE,
    DEFAULT_PARTY_POPUP,
    type PartyPopupSettings,
} from '@/lib/config/party-popup';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const HIGHLIGHT_SLOTS = 6;

function ImageField({
    label,
    hint,
    value,
    fallback,
    onChange,
    checker,
    composite,
}: {
    label: string;
    hint: string;
    value: string;
    fallback: string;
    onChange: (url: string) => void;
    checker?: boolean;
    /** The built-in ballroom file holds two photos side by side; preview the left one. */
    composite?: boolean;
}) {
    const input = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);

    async function pick(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        setBusy(true);
        try {
            const blob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload' });
            onChange(blob.url);
        } catch {
            toast.error('Upload failed. Use a JPG, PNG or WebP image and try again.');
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div
                className="flex h-36 items-center justify-center overflow-hidden rounded-md border"
                style={checker ? { background: 'repeating-conic-gradient(#e5e5e5 0% 25%, #fff 0% 50%) 50% / 16px 16px' } : { background: '#f3f3f3' }}
            >
                {!value && composite ? (
                    <div
                        className="h-full w-full"
                        style={{ backgroundImage: `url("${fallback}")`, backgroundSize: '200% auto', backgroundPosition: '0 40%' }}
                    />
                ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={value || fallback} alt={label} className={checker ? 'h-full w-full object-contain' : 'h-full w-full object-cover'} />
                )}
            </div>
            <p className="text-xs text-muted-foreground">{hint}</p>
            <div className="flex gap-2">
                <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={pick} />
                <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}>
                    {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
                    {value ? 'Replace' : 'Upload'}
                </Button>
                {value && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Use default
                    </Button>
                )}
            </div>
        </div>
    );
}

function MusicField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
    const input = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);

    async function pick(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        setBusy(true);
        try {
            const blob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload' });
            onChange(blob.url);
        } catch {
            toast.error('Upload failed. Use an MP3, M4A, WAV or OGG file and try again.');
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="space-y-2">
            <Label>Event page music</Label>
            {value ? (
                <audio controls src={value} className="w-full" />
            ) : (
                <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                    Using the built-in lounge-house loop.
                </p>
            )}
            <p className="text-xs text-muted-foreground">
                Plays after a guest taps &quot;Enter the masquerade&quot;. Only upload music you have the rights to play publicly.
            </p>
            <div className="flex gap-2">
                <input ref={input} type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/ogg" className="hidden" onChange={pick} />
                <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}>
                    {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Music className="mr-2 h-4 w-4" />}
                    {value ? 'Replace track' : 'Upload track'}
                </Button>
                {value && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Use built-in loop
                    </Button>
                )}
            </div>
        </div>
    );
}

function TextField({
    id,
    label,
    value,
    onChange,
    maxLength,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    maxLength?: number;
}) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            <Input id={id} value={value} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} />
        </div>
    );
}

export default function PartyPopupCard() {
    const [saved, setSaved] = useState<PartyPopupSettings>(DEFAULT_PARTY_POPUP);
    const [draft, setDraft] = useState<PartyPopupSettings>(DEFAULT_PARTY_POPUP);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getPartyPopup()
            .then((s) => { setSaved(s); setDraft(s); })
            .catch(() => undefined)
            .finally(() => setLoading(false));
    }, []);

    const set = <K extends keyof PartyPopupSettings>(key: K) => (value: PartyPopupSettings[K]) =>
        setDraft((prev) => ({ ...prev, [key]: value }));

    async function persist(next: PartyPopupSettings) {
        setSaving(true);
        try {
            const result = await updatePartyPopup(next);
            setSaved(result);
            return result;
        } catch {
            toast.error('Could not save. Please try again.');
            return null;
        } finally {
            setSaving(false);
        }
    }

    // The switch saves on its own and leaves any unsaved edits below untouched.
    async function toggle(enabled: boolean) {
        const result = await persist({ ...saved, enabled });
        if (result) {
            setDraft((prev) => ({ ...prev, enabled: result.enabled }));
            toast.success(enabled ? '31st Night pop-up is on' : '31st Night pop-up is off');
        }
    }

    async function saveAll() {
        const result = await persist(draft);
        if (result) {
            setDraft(result);
            toast.success('31st Night pop-up saved');
        }
    }

    const highlights = Array.from({ length: HIGHLIGHT_SLOTS }, (_, i) => draft.highlights[i] ?? '');
    const setHighlight = (i: number, v: string) => {
        const next = [...highlights];
        next[i] = v;
        set('highlights')(next);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <PartyPopper className="h-5 w-5" />
                            31st Night Pop-up
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Shows on the homepage a few seconds after it opens, and fills the /31st-night page. It stops by itself after the night.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{saved.enabled ? 'On' : 'Off'}</span>
                        <Switch
                            checked={saved.enabled}
                            onCheckedChange={toggle}
                            disabled={loading || saving}
                            aria-label="Show the 31st Night pop-up"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-8">
                <section className="grid gap-6 sm:grid-cols-2">
                    <ImageField
                        label="Pop-up photo"
                        hint="A wide photo works best. Shown at the top of the homepage pop-up."
                        value={draft.backgroundImage}
                        fallback={DEFAULT_PARTY_BACKGROUND}
                        onChange={set('backgroundImage')}
                        composite
                    />
                    <ImageField
                        label="Mask image"
                        hint="A PNG or WebP with a transparent background, so it sits cleanly over the photo."
                        value={draft.maskImage}
                        fallback={DEFAULT_PARTY_MASK}
                        onChange={set('maskImage')}
                        checker
                    />
                    <ImageField
                        label="Event page background"
                        hint="The full-screen photo behind the /31st-night page. A tall photo works on phones and computers."
                        value={draft.pageImage}
                        fallback={DEFAULT_PARTY_PAGE_IMAGE}
                        onChange={set('pageImage')}
                    />
                    <MusicField value={draft.musicUrl} onChange={set('musicUrl')} />
                </section>

                <section className="grid gap-4 sm:grid-cols-2">
                    <TextField id="pp-presenter" label="Line above the photo" value={draft.presenter} onChange={set('presenter')} maxLength={60} />
                    <TextField id="pp-eyebrow" label="Small line above the title" value={draft.eyebrow} onChange={set('eyebrow')} maxLength={60} />
                    <TextField id="pp-main" label="Title" value={draft.titleMain} onChange={set('titleMain')} maxLength={30} />
                    <TextField id="pp-accent" label="Title, gold word" value={draft.titleAccent} onChange={set('titleAccent')} maxLength={30} />
                    <div className="sm:col-span-2">
                        <TextField id="pp-theme" label="Theme line" value={draft.theme} onChange={set('theme')} maxLength={80} />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="pp-intro">Intro paragraph (event page only)</Label>
                        <Textarea id="pp-intro" rows={3} maxLength={400} value={draft.intro} onChange={(e) => set('intro')(e.target.value)} />
                    </div>
                </section>

                <section className="space-y-2">
                    <Label>Highlights (leave a box empty to hide it)</Label>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {highlights.map((value, i) => (
                            <Input
                                key={i}
                                aria-label={`Highlight ${i + 1}`}
                                value={value}
                                maxLength={40}
                                onChange={(e) => setHighlight(i, e.target.value)}
                            />
                        ))}
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-3">
                    <TextField id="pp-date" label="Date" value={draft.dateValue} onChange={set('dateValue')} maxLength={30} />
                    <TextField id="pp-time" label="Time" value={draft.timeValue} onChange={set('timeValue')} maxLength={30} />
                    <TextField id="pp-dress" label="Dress" value={draft.dressValue} onChange={set('dressValue')} maxLength={40} />
                    <div className="space-y-1.5">
                        <Label htmlFor="pp-price">Price per couple (₹)</Label>
                        <Input
                            id="pp-price"
                            type="number"
                            min={1}
                            value={draft.pricePerCouple}
                            onChange={(e) => set('pricePerCouple')(Number(e.target.value))}
                        />
                    </div>
                    <TextField id="pp-price-label" label="Text above the price" value={draft.priceLabel} onChange={set('priceLabel')} maxLength={60} />
                    <div className="space-y-1.5">
                        <Label htmlFor="pp-delay">Show after (seconds)</Label>
                        <Input
                            id="pp-delay"
                            type="number"
                            min={0}
                            max={60}
                            value={draft.delaySeconds}
                            onChange={(e) => set('delaySeconds')(Number(e.target.value))}
                        />
                    </div>
                    <div className="sm:col-span-3">
                        <TextField id="pp-fine" label="Small print under the buttons" value={draft.finePrint} onChange={set('finePrint')} maxLength={120} />
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2">
                    <TextField id="pp-res-label" label="Main button text" value={draft.reserveLabel} onChange={set('reserveLabel')} maxLength={30} />
                    <TextField id="pp-res-link" label="Main button goes to" value={draft.reserveLink} onChange={set('reserveLink')} maxLength={300} />
                    <TextField id="pp-enq-label" label="Second button text" value={draft.enquireLabel} onChange={set('enquireLabel')} maxLength={30} />
                    <TextField id="pp-enq-link" label="Second button goes to" value={draft.enquireLink} onChange={set('enquireLink')} maxLength={300} />
                    <p className="text-xs text-muted-foreground sm:col-span-2">
                        Links start with / for a page on this site (for example /31st-night#enquire) or https:// for another site. Anything else resets to the default.
                    </p>
                </section>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" disabled={loading || saving} onClick={() => setDraft({ ...DEFAULT_PARTY_POPUP, enabled: saved.enabled })}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset to defaults
                    </Button>
                    <Button onClick={saveAll} disabled={loading || saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save changes
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
