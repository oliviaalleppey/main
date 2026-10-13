'use client';

import { useEffect, useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import { toast } from 'sonner';
import { PartyPopper, Loader2, Save, ImagePlus, RotateCcw, Music, Plus, Trash2, Check, ExternalLink } from 'lucide-react';
import { getPartyPopup, updatePartyPopup } from '@/lib/db/actions/settings-actions';
import {
    DEFAULT_PARTY_BACKGROUND,
    DEFAULT_PARTY_CROWD_IMAGE,
    DEFAULT_PARTY_LIGHTS_IMAGE,
    DEFAULT_PARTY_MASK,
    DEFAULT_PARTY_PAGE_IMAGE,
    DEFAULT_PARTY_POPUP,
    MAX_GUEST_PRICES,
    PARTY_PAGE_THEMES,
    PARTY_PATH,
    PARTY_THEMES,
    switchPartyTheme,
    type PartyGuestPrice,
    type PartyPageTheme,
    type PartyPopupSettings,
    type PartyStay,
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
                Plays when a guest taps the sound button. Only upload music you have the rights to play publicly.
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

/** A small picture of each theme for the switch. */
const THEME_SWATCH: Record<PartyPageTheme, string> = {
    masquerade: 'radial-gradient(ellipse at 50% 30%, #c42638 0, #3a0a14 45%, #0b0306 80%)',
    gatsby: 'repeating-conic-gradient(from -90deg at 50% 78%, rgba(243,214,150,.55) 0deg 1.5deg, transparent 1.5deg 9deg), linear-gradient(#05060b, #17121f 76%, #d9b56c 78%, #09090c 80%)',
    gotham: 'linear-gradient(90deg, transparent 0 8%, #050406 8% 14%, transparent 14% 22%, #050406 22% 26%, transparent 26% 40%, #050406 40% 48%, transparent 48% 60%, #050406 60% 66%, transparent 66% 80%, #050406 80% 90%, transparent 90%) bottom / 100% 55% no-repeat, radial-gradient(ellipse at 50% 100%, #c4182f, #4a1260 45%, #050406 80%)',
};

function ThemeSwitch({
    value,
    disabled,
    onPick,
}: {
    value: PartyPageTheme;
    disabled: boolean;
    onPick: (theme: PartyPageTheme) => void;
}) {
    return (
        <section className="space-y-3">
            <div>
                <Label>Page theme</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                    Changes the look of the /31st-night page and the homepage pop-up straight away. Prices and details stay as they are. Use Preview to look at a theme before switching.
                </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
                {PARTY_PAGE_THEMES.map((theme) => {
                    const active = value === theme;
                    return (
                        <div key={theme} className={`overflow-hidden rounded-lg border-2 ${active ? 'border-primary' : 'border-border'}`}>
                            <button
                                type="button"
                                disabled={disabled || active}
                                onClick={() => onPick(theme)}
                                aria-pressed={active}
                                className="block w-full text-left disabled:cursor-default"
                            >
                                <div className="h-20" style={{ background: THEME_SWATCH[theme] }} />
                                <div className="space-y-1 p-3">
                                    <p className="flex items-center gap-2 font-medium">
                                        {PARTY_THEMES[theme].name}
                                        {active && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                                                <Check className="h-3 w-3" /> Live
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{PARTY_THEMES[theme].about}</p>
                                    {!active && <p className="text-xs font-medium text-primary">Click to use this theme</p>}
                                </div>
                            </button>
                            <a
                                href={`${PARTY_PATH}/preview/${theme}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 border-t px-3 py-2 text-xs font-medium hover:bg-muted"
                            >
                                <ExternalLink className="h-3 w-3" /> Preview
                            </a>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

const STAY_OPTIONS: { value: PartyStay; label: string }[] = [
    { value: 'R', label: 'R · staying guests' },
    { value: 'NR', label: 'NR · party only' },
    { value: 'both', label: 'Both' },
];

function GuestPricesField({ value, onChange }: { value: PartyGuestPrice[]; onChange: (rows: PartyGuestPrice[]) => void }) {
    const update = (i: number, patch: Partial<PartyGuestPrice>) =>
        onChange(value.map((row, j) => (j === i ? { ...row, ...patch } : row)));

    return (
        <div className="space-y-3">
            <div>
                <Label>Extra guest prices</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                    Shown on the /31st-night page, where guests add them to their plan. R is for guests staying at Olivia, NR for guests who come for the party only. Rows without a name or price are left out.
                </p>
            </div>
            {value.map((row, i) => (
                <div key={i} className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1.2fr_1.4fr_0.8fr_1fr_auto] sm:items-end">
                    <div className="space-y-1">
                        <Label htmlFor={`pp-g${i}-label`} className="text-xs">Guest</Label>
                        <Input id={`pp-g${i}-label`} value={row.label} maxLength={40} placeholder="Kid" onChange={(e) => update(i, { label: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor={`pp-g${i}-note`} className="text-xs">Ages or what is included</Label>
                        <Input id={`pp-g${i}-note`} value={row.note} maxLength={60} placeholder="6 to 11 years" onChange={(e) => update(i, { note: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor={`pp-g${i}-price`} className="text-xs">Price (₹)</Label>
                        <Input id={`pp-g${i}-price`} type="number" min={1} value={row.price || ''} onChange={(e) => update(i, { price: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor={`pp-g${i}-stay`} className="text-xs">For</Label>
                        <select
                            id={`pp-g${i}-stay`}
                            value={row.stay}
                            onChange={(e) => update(i, { stay: e.target.value as PartyStay })}
                            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                        >
                            {STAY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                    <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${row.label || 'this row'}`} onClick={() => onChange(value.filter((_, j) => j !== i))}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            {value.length < MAX_GUEST_PRICES && (
                <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, { label: '', note: '', price: 0, stay: 'both' }])}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add a price
                </Button>
            )}
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

    // Like the on/off switch, the theme saves on its own; unsaved edits below stay as they are.
    async function pickTheme(theme: PartyPageTheme) {
        const result = await persist(switchPartyTheme(saved, theme));
        if (result) {
            setDraft((prev) => switchPartyTheme(prev, theme));
            toast.success(`The 31st Night page now uses ${PARTY_THEMES[theme].name}`);
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
                <ThemeSwitch value={saved.pageTheme} disabled={loading || saving} onPick={pickTheme} />

                {saved.pageTheme !== 'masquerade' && (
                    <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                        The Gatsby and Gotham themes draw their own backgrounds and use only the mask below; the photos are for The Grand Masquerade.
                    </p>
                )}
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
                        label="Event page, top photo"
                        hint="The full-screen photo at the top of /31st-night, behind the mask. A tall photo works on phones and computers."
                        value={draft.pageImage}
                        fallback={DEFAULT_PARTY_PAGE_IMAGE}
                        onChange={set('pageImage')}
                    />
                    <ImageField
                        label="Event page, crowd photo"
                        hint="Shown beside the list of what the night includes. A tall photo works best."
                        value={draft.crowdImage}
                        fallback={DEFAULT_PARTY_CROWD_IMAGE}
                        onChange={set('crowdImage')}
                    />
                    <ImageField
                        label="Event page, lights photo"
                        hint="Behind the big “Masks on” line further down the page."
                        value={draft.lightsImage}
                        fallback={DEFAULT_PARTY_LIGHTS_IMAGE}
                        onChange={set('lightsImage')}
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
                        <Label htmlFor="pp-price">Couple pass, staying · R (₹)</Label>
                        <Input
                            id="pp-price"
                            type="number"
                            min={1}
                            value={draft.pricePerCouple}
                            onChange={(e) => set('pricePerCouple')(Number(e.target.value))}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="pp-price-nr">Couple pass, party only · NR (₹)</Label>
                        <Input
                            id="pp-price-nr"
                            type="number"
                            min={0}
                            placeholder="Empty shows “On request”"
                            value={draft.pricePerCoupleNonResidential || ''}
                            onChange={(e) => set('pricePerCoupleNonResidential')(Number(e.target.value))}
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

                <GuestPricesField value={draft.guestPrices} onChange={set('guestPrices')} />

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
                    <Button type="button" variant="ghost" disabled={loading || saving} onClick={() => setDraft(switchPartyTheme({ ...DEFAULT_PARTY_POPUP, enabled: saved.enabled }, saved.pageTheme))}>
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
